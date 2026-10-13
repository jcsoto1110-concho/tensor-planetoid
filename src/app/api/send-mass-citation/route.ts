import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { candidates, date, time, companySlug, address, sessionTitle } = await req.json();

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: 'Lista de candidatos requerida' }, { status: 400 });
    }
    if (!date || !time) {
      return NextResponse.json({ error: 'Fecha y hora requeridas' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.office365.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || 'uneteanuestroequipo@ec.marathon-sports.com';
    const smtpPass = process.env.SMTP_PASS || '';

    if (!smtpPass) {
      return NextResponse.json({ error: 'SMTP_PASS no configurado en variables de entorno' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // TLS
      auth: { user: smtpUser, pass: smtpPass },
      tls: { ciphers: 'SSLv3' },
    });

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const isGyeSession = (sessionTitle && (
      sessionTitle.toUpperCase().includes('GYE') || 
      sessionTitle.toUpperCase().includes('-GY') || 
      sessionTitle.toUpperCase().includes('_GY') || 
      sessionTitle.toUpperCase().endsWith('GY') || 
      sessionTitle.toUpperCase().includes('GUAYAQUIL')
    )) || (address && address.toUpperCase().includes('SANTA LEONOR'));

    for (const candidate of candidates) {
      const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const candSession = candidate.session_title || sessionTitle || '';
      const isCandGye = candSession.toUpperCase().includes('GYE') || 
                        candSession.toUpperCase().includes('-GY') || 
                        candSession.toUpperCase().includes('_GY') || 
                        candSession.toUpperCase().endsWith('GY') || 
                        candSession.toUpperCase().includes('GUAYAQUIL') ||
                        isGyeSession;

      const finalAddress = address?.trim() || (isCandGye ? 'Cdla Santa Leonor mz 10 solar 4' : 'Galo Plaza Lasso 13205 y de los Cerezos.');
      const finalLugar = isCandGye ? 'Sede Guayaquil (Cdla Santa Leonor mz 10 solar 4)' : 'Oficina Principal (Cerezos)';

      const message = `Hola ${candidate.name},\n\nHas sido seleccionado para la etapa de Evaluación Formativa para el puesto de ${candidate.cargo}.\n\nDetalles de la citación:\nFecha: ${formattedDate}\nHora: ${time}\nLugar: ${finalAddress}\n\nPor favor, sé puntual.\n\nSaludos cordiales,\nTalento Humano`;

      await transporter.sendMail({
        from: `"RRHH Selección" <${smtpUser}>`,
        to: candidate.email,
        subject: `Citación a Evaluación Formativa - ${candidate.cargo}`,
        text: message,
        html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #002f6c; padding: 24px; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 20px;">Citación a Evaluación Formativa</h2>
            <p style="color: #cbd5e1; margin: 8px 0 0; font-size: 14px;">Proceso de Selección de Personal</p>
          </div>
          <div style="padding: 32px; background: white;">
            <p>Hola <strong>${candidate.name}</strong>,</p>
            <p>Nos complace informarte que has avanzado a la etapa de <strong>Evaluación Formativa (Entrevista Grupal)</strong> para la vacante de <strong>${candidate.cargo}</strong>.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #1e293b; font-weight: bold;">📅 Detalles de tu Cita:</p>
              <p style="margin: 4px 0; color: #475569;"><strong>Fecha:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0; color: #475569;"><strong>Hora:</strong> ${time}</p>
              <p style="margin: 4px 0; color: #475569;"><strong>Dirección:</strong> ${finalAddress}</p>
            </div>
            
            <p>Por favor, confirma tu asistencia respondiendo a este correo electrónico o presentándote puntualmente en la fecha y hora indicadas con tu documento de identidad.</p>
            
            <br/>
            <p style="margin-bottom: 4px;">Saludos cordiales,</p>
            <p><strong>Talento Humano</strong><br/>Departamento de Selección</p>
          </div>
        </div>`
      });

      // Pequeña pausa para evitar que el servidor de SMTP detecte spam o demasiadas conexiones rápidas
      await delay(300);
    }

    return NextResponse.json({ success: true, count: candidates.length });
  } catch (error: any) {
    console.error('Error al enviar mails masivos de citación:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
