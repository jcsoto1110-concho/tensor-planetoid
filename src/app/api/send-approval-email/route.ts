import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const { candidateName, candidateEmail } = await req.json();

    if (!candidateEmail) {
      return NextResponse.json({ error: 'Se requiere el email del candidato.' }, { status: 400 });
    }

    const clientId = process.env.AZURE_CLIENT_ID || '69f4a759-9537-4f11-b398-47a7f6ef8e83';
    const tenantId = process.env.AZURE_TENANT_ID || 'a25466cf-9db0-4555-b90b-3b29d4097ff2';
    const clientSecret = process.env.AZURE_CLIENT_SECRET || 'vg98Q~Zt5MJ2ui6mpjM~CCFiPGB8o5fObGM4ZbXm';
    const senderEmail = process.env.SMTP_USER || 'uneteanuestroequipo@ec.marathon-sports.com';
    const onboardingUrl = process.env.ONBOARDING_URL || 'https://contrataciosuper.app/onboarding';

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

    // 2. Generar QR como base64 para embeber
    const qrDataUrl = await QRCode.toDataURL(onboardingUrl, {
      width: 300,
      margin: 2,
    });
    const qrBase64 = qrDataUrl.split(',')[1];

    // 3. Cuerpo HTML del correo
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #1a1a2e; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">SUPERDEPORTE S.A.</h1>
          <p style="color: #aab4be; margin: 8px 0 0; font-size: 13px;">SOLICITUD DE DOCUMENTOS</p>
        </div>

        <div style="padding: 32px 40px; background: #ffffff;">
          <p style="font-size: 15px; margin: 0 0 20px;">Estimado/a <strong>${candidateName || 'candidato/a'}</strong>,</p>

          <p style="font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
            A nombre de <strong>SUPERDEPORTE S.A.</strong> es un placer darte la bienvenida, esperamos que disfrutes con nosotros de nuestra actividad favorita, el deporte.
          </p>

          <p style="font-size: 14px; line-height: 1.7; margin: 0 0 16px;">
            Estamos orgullosos de ofrecer la mejor experiencia deportiva a nuestros consumidores a través de una asesoría del más alto nivel. Nos caracterizamos por ser un equipo que juega fuerte, que juega para ganar, sin excusas, siempre obedeciendo las reglas del juego.
          </p>

          <p style="font-size: 14px; line-height: 1.7; margin: 0 0 24px;">
            Estamos convencidos que tus competencias nos llevarán a lograr las metas que nos hemos propuesto. Eres parte de esta comunidad de apasionados por el deporte, dispuestos a transformar su entorno y contagiar esta pasión, volviéndose dueños del resultado y siempre trabajando hacia un mismo objetivo.
          </p>

          <div style="background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="font-size: 14px; font-weight: bold; margin: 0 0 16px; color: #374151;">
              📋 Por favor, completa tu formulario de ingreso escaneando el siguiente código QR:
            </p>
            <img src="cid:qr_onboarding" alt="QR Onboarding" style="width: 200px; height: 200px;" />
            <p style="font-size: 12px; color: #6b7280; margin: 12px 0 0;">
              O ingresa directamente en: <a href="${onboardingUrl}" style="color: #2563eb;">${onboardingUrl}</a>
            </p>
          </div>

          <p style="font-size: 13px; color: #6b7280; margin: 24px 0 0;">
            Si tienes alguna consulta, no dudes en comunicarte con nosotros.<br/>
            Bienvenido/a al equipo 🏆
          </p>
        </div>

        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          SUPERDEPORTE S.A. · uneteanuestroequipo@ec.marathon-sports.com
        </div>
      </div>
    `;

    // 4. Enviar el correo con adjunto inline
    const sendMail = {
      message: {
        subject: 'SOLICITUD DOCUMENTOS MARATHON SPORTS',
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: [{ emailAddress: { address: candidateEmail } }],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: 'QR_Onboarding.png',
            contentType: 'image/png',
            contentBytes: qrBase64,
            contentId: 'qr_onboarding',
            isInline: true
          }
        ]
      }
    };

    await client.api(`/users/${senderEmail}/sendMail`).post(sendMail);

    return NextResponse.json({ success: true, message: `Correo enviado a ${candidateEmail}` });

  } catch (error: any) {
    console.error('Error enviando correo de aprobación con Graph API:', error);
    return NextResponse.json({ error: 'Error al enviar el correo: ' + error.message }, { status: 500 });
  }
}
