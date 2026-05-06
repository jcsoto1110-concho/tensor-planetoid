import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

export async function POST(req: NextRequest) {
  try {
    // 1. Obtener Access Token mediante MSAL
    const msalConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET || ''
      }
    };
    
    const cca = new ConfidentialClientApplication(msalConfig);
    const authResponse = await cca.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });

    if (!authResponse || !authResponse.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Microsoft. Verifica si le diste "Admin Consent" en Azure.');
    }

    // 2. Inicializar Cliente de Graph API
    const graphClient = Client.init({
      authProvider: (done) => {
        done(null, authResponse.accessToken);
      }
    });

    // Cambia aquí el correo por uneteanuestroequipo... cuando quieras pasar a producción
    const userEmail = 'uneteanuestroequipo@ec.marathon-sports.com'; 

    // 3. Buscar mensajes más recientes
    // Graph API no permite usar filter(hasAttachments) junto con orderby(receivedDateTime) en algunos buzones.
    // Solución: Traemos los últimos 30 correos y filtramos manualmente en memoria.
    const response = await graphClient
      .api(`/users/${userEmail}/mailFolders/inbox/messages`)
      .select('id,subject,from,receivedDateTime,hasAttachments,body')
      .top(30)
      .orderby('receivedDateTime DESC')
      .get();

    const messages = response.value.filter((m: any) => m.hasAttachments === true);
    const resumes = [];
    let processedCount = 0;

    for (const msg of messages) {
      // Revisar si ya lo procesamos en Supabase
      const { data: existing } = await supabase
        .from('email_resumes')
        .select('email_uid')
        .eq('email_uid', msg.id)
        .maybeSingle();

      if (existing) continue;

      // 4. Analizar cuerpo del mensaje para formato estándar
      const bodyContent = msg.body?.content || '';
      // Limpieza profunda de HTML y entidades
      let cleanBody = bodyContent
        .replace(/<[^>]*>?/gm, '\n') // Reemplazar tags por saltos de línea para mejor separación
        .replace(/&nbsp;/g, ' ')
        .replace(/&aacute;/g, 'a').replace(/&eacute;/g, 'e').replace(/&iacute;/g, 'i').replace(/&oacute;/g, 'o').replace(/&uacute;/g, 'u')
        .replace(/&Aacute;/g, 'A').replace(/&Eacute;/g, 'E').replace(/&Iacute;/g, 'I').replace(/&Oacute;/g, 'O').replace(/&Uacute;/g, 'U')
        .replace(/\s+/g, ' ') // Colapsar espacios múltiples
        .trim();
      
      // Regex mejoradas: capturan hasta el final de la línea o hasta el siguiente campo conocido
      const nameMatch = cleanBody.match(/Nombre\s*:\s*([^:\n\r]*?)(?=(?:Carg[oó]\s*Aplica|A[ñn]os\s*de|Ciudad|$))/i);
      const cargoMatch = cleanBody.match(/Carg[oó]\s*Aplica\s*:\s*([^:\n\r]*?)(?=(?:Nombre|A[ñn]os\s*de|Ciudad|$))/i);
      const expMatch = cleanBody.match(/A[ñn]os\s*de\s*experiencia\s*:\s*(\d+)/i);
      const cityMatch = cleanBody.match(/Ciudad\s*:\s*([^:\n\r]*?)(?=(?:Nombre|Carg[oó]\s*Aplica|A[ñn]os\s*de|$))/i);

      let autoData: any = null;
      if (nameMatch && cargoMatch && expMatch) {
        autoData = {
          sender_name: nameMatch[1].trim(),
          position: cargoMatch[1].trim(),
          experience_years: expMatch[1].trim(),
          city: cityMatch ? cityMatch[1].trim() : '',
          status: 'PENDING',
          summary: 'Extraído automáticamente del formato estándar del correo.'
        };
      }

      // 5. Descargar los adjuntos de ese correo
      const attachmentsRes = await graphClient
        .api(`/users/${userEmail}/messages/${msg.id}/attachments`)
        .get();

      const attachments = attachmentsRes.value;
      
      // Filtrar el primer PDF o Word que encontremos
      const file = attachments.find((att: any) => 
        att.contentType === 'application/pdf' || 
        att.contentType?.includes('wordprocessing') ||
        att.contentType?.includes('msword') ||
        att.name?.toLowerCase().endsWith('.pdf') ||
        att.name?.toLowerCase().endsWith('.docx')
      );

      if (file && file.contentBytes) {
        // Microsoft devuelve el archivo codificado en Base64
        const buffer = Buffer.from(file.contentBytes, 'base64');
        const fileName = `resume_${msg.id.substring(0,8)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Subir al Storage de Supabase
        const { error: uploadError } = await supabase.storage
          .from('candidate-documents')
          .upload(fileName, buffer, { upsert: true, contentType: file.contentType || 'application/pdf' });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('candidate-documents')
            .getPublicUrl(fileName);

          const payload: any = {
            email_uid: msg.id,
            sender_email: msg.from?.emailAddress?.address || 'Desconocido',
            sender_name: autoData?.sender_name || msg.from?.emailAddress?.name || '',
            subject: msg.subject || 'Sin Asunto',
            received_date: msg.receivedDateTime || new Date().toISOString(),
            file_name: file.name,
            pdf_url: publicUrl,
            classification_status: autoData ? 'REVIEWED' : 'PENDING',
            position: autoData?.position || '',
            experience_years: autoData?.experience_years || null,
            city: autoData?.city || '',
            ai_summary: autoData?.summary || ''
          };

          // Guardar en la base de datos
          const { error: dbError } = await supabase.from('email_resumes').insert([payload]);

          if (!dbError) {
            resumes.push(payload);
            processedCount++;
          } else {
            console.error('Error DB Supabase:', dbError);
          }
        } else {
          console.error('Error Storage Supabase:', uploadError);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se procesaron ${processedCount} nuevas hojas de vida usando Graph API.`,
      data: resumes
    });

  } catch (error: any) {
    console.error('Error Graph API detallado:', error);
    
    // Mejorar el mensaje si es un error de permisos
    let friendlyError = error.message;
    if (friendlyError.includes('Access is denied') || friendlyError.includes('Authorization_RequestDenied')) {
      friendlyError = 'Microsoft denegó el acceso. Asegúrate de haberle dado clic al botón "Grant admin consent" en la pestaña de API Permissions de Azure.';
    }

    return NextResponse.json(
      { 
        error: 'Error conectando vía API de Microsoft', 
        details: friendlyError,
        serverResponse: error.body || error.response || 'Revisa la terminal de Node.'
      },
      { status: 500 }
    );
  }
}
