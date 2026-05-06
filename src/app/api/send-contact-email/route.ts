import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';

export async function POST(req: NextRequest) {
  try {
    const { email, name, cargo, interviewDate, notes } = await req.json();
    const isInterview = !!interviewDate;

    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    const clientId = process.env.AZURE_CLIENT_ID || '69f4a759-9537-4f11-b398-47a7f6ef8e83';
    const tenantId = process.env.AZURE_TENANT_ID || 'a25466cf-9db0-4555-b90b-3b29d4097ff2';
    const clientSecret = process.env.AZURE_CLIENT_SECRET || 'vg98Q~Zt5MJ2ui6mpjM~CCFiPGB8o5fObGM4ZbXm';
    const senderEmail = process.env.SMTP_USER || 'uneteanuestroequipo@ec.marathon-sports.com';

    // 1. Obtener Token de Acceso
    const msalConfig = {
      auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}`, clientSecret }
    };
    const cca = new ConfidentialClientApplication(msalConfig);
    const authResponse = await cca.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default']
    });

    if (!authResponse || !authResponse.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Azure');
    }

    const client = Client.init({
      authProvider: (done) => done(null, authResponse.accessToken)
    });

    const formattedDate = isInterview ? new Date(interviewDate.split(' ')[0] + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const time = isInterview ? interviewDate.split(' ')[1] || '09:00' : '';

    const htmlMessage = isInterview 
      ? `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #0f172a; padding: 24px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Proceso de Selección</h2>
            <p style="color: #94a3b8; margin: 8px 0 0; font-size: 14px;">Superdeporte S.A.</p>
          </div>
          <div style="padding: 32px; background: white;">
            <p>Hola <strong>${name || 'candidat@'}</strong>,</p>
            <p>Nos complace informarte que <strong>has pasado la primera etapa</strong> de nuestro proceso de selección. Para la siguiente fase, deberás asistir a una entrevista presencial y/o virtual.</p>
            
            <div style="background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="margin: 0 0 12px; font-size: 15px;">📅 <strong>Fecha:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 12px; font-size: 15px;">⏰ <strong>Hora:</strong> ${time}</p>
              <p style="margin: 0; font-size: 15px;">📍 <strong>Lugar:</strong> Av Galo Plaza Lasso 13205 de los Ceresos.</p>
            </div>
            
            <p>Por favor, confirma tu asistencia respondiendo a este correo. Te esperamos puntualmente.</p>
            <br/>
            <p style="margin-bottom: 4px;">Saludos cordiales,</p>
            <p><strong>Equipo de Selección Talentos</strong><br/>Superdeporte S.A.</p>
          </div>
        </div>`
      : `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <p>Hola <strong>${name || 'Candidato'}</strong>,</p>
          <p>Te saludamos de RRHH de <strong>SUPERDEPORTE S.A.</strong></p>
          <p>Estamos revisando tu perfil para el cargo de <strong>${cargo}</strong> y nos gustaría agendar una entrevista.</p>
          <p>Por favor, confírmanos tu disponibilidad respondiendo a este correo.</p>
          <br/>
          <p>Saludos cordiales,<br/><strong>Equipo de Selección</strong></p>
        </div>`;

    const sendMail = {
      message: {
        subject: isInterview ? `Citación a Entrevista: ${cargo}` : `Proceso de Selección: ${cargo}`,
        body: { contentType: 'HTML', content: htmlMessage },
        toRecipients: [{ emailAddress: { address: email } }]
      }
    };

    await client.api(`/users/${senderEmail}/sendMail`).post(sendMail);

    } catch (error: any) {
    console.error('Error enviando mail con Graph API:', error);
    // Extraemos más info del error de Graph si existe
    const errorDetail = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
    return NextResponse.json({ 
      error: `Error Graph API (${errorCode}): ${errorDetail}`,
      debug: { senderEmail, clientId, tenantId } 
    }, { status: 500 });
  }
}
