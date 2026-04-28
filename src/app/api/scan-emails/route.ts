import { NextRequest, NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { supabase } from '@/lib/supabase';

// Helper for parsing raw email source
const parseEmail = async (source: Buffer) => {
  return await simpleParser(source);
};

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json(); // Se puede pasar del lado del cliente por seguridad, pero usaremos el que dijiste
    
    // Conexión IMAP
    const client = new ImapFlow({
      host: 'outlook.office365.com',
      port: 993,
      secure: true,
      auth: {
        user: 'uneteanuestroequipo@ec.marathon-sports.com',
        pass: password || 'Toq98022'
      },
      logger: false
    });

    await client.connect();

    // Seleccionamos la bandeja de entrada
    const lock = await client.getMailboxLock('INBOX');
    let processedCount = 0;
    const resumes = [];

    try {
      // Buscar correos no leídos que tengan archivos adjuntos (esto puede variar según IMAP, buscaremos los últimos 10 para empezar)
      // client.search() permite buscar por fechas o flags. Buscaremos los últimos 20 correos para la prueba.
      const messages = await client.search({ all: true }); // Puede traer muchos, mejor limitamos.
      
      // En ImapFlow, para optimizar, es mejor usar un generador con .fetch()
      // Vamos a traer los últimos 10 mensajes ordenados por más recientes
      for await (let msg of client.fetch('1:*', { source: true, uid: true })) {
        if (processedCount >= 10) break; // Límite por petición para no ahogar el servidor

        // Revisar si este UID ya está en Supabase
        const { data: existing } = await supabase
          .from('email_resumes')
          .select('uid')
          .eq('email_uid', msg.uid.toString())
          .maybeSingle();

        if (existing) continue; // Ya fue procesado

        // Parsear el correo
        const parsed = await parseEmail(msg.source);
        
        // Buscar si tiene adjuntos PDF o Word
        const attachments = parsed.attachments.filter(att => 
          att.contentType === 'application/pdf' || 
          att.contentType.includes('wordprocessingml') ||
          att.contentType.includes('msword')
        );

        if (attachments.length > 0) {
          const file = attachments[0]; // Tomamos la primera hoja de vida
          
          // Subir a Supabase Storage
          const fileName = `resume_${msg.uid}_${file.filename}`;
          const { error: uploadError } = await supabase.storage
            .from('candidate-documents') // Usamos el bucket existente
            .upload(fileName, file.content, { upsert: true, contentType: file.contentType });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('candidate-documents')
              .getPublicUrl(fileName);

            // Guardar en base de datos
            const payload = {
              email_uid: msg.uid.toString(),
              sender_email: parsed.from?.value[0]?.address || 'Desconocido',
              sender_name: parsed.from?.value[0]?.name || '',
              subject: parsed.subject || 'Sin Asunto',
              received_date: parsed.date || new Date(),
              file_name: file.filename,
              pdf_url: publicUrl,
              classification_status: 'PENDING'
            };

            const { error: dbError } = await supabase
              .from('email_resumes')
              .insert([payload]);

            if (!dbError) {
              resumes.push(payload);
              processedCount++;
            }
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return NextResponse.json({ 
      success: true, 
      message: `Se procesaron ${processedCount} nuevos correos con hojas de vida.`,
      data: resumes
    });

  } catch (error: any) {
    console.error('Error IMAP:', error);
    return NextResponse.json(
      { error: 'Error conectando al correo', details: error.message },
      { status: 500 }
    );
  }
}
