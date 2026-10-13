import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';

export const dynamic = 'force-dynamic';

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

// 1. GET: Listar registros de beneficios con filtros y estadísticas
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'ALL';
        const search = (searchParams.get('search') || '').trim().toLowerCase();

        const supabase = getSupabase();

        let query = supabase
            .from('digi_employee_benefits_90d')
            .select('*')
            .order('dias_laborados', { ascending: false });

        if (status !== 'ALL') {
            query = query.eq('estado', status);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error al consultar digi_employee_benefits_90d:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const allRecords = data || [];

        // Filtrado por búsqueda en memoria
        const filtered = allRecords.filter(r => {
            if (!search) return true;
            return (
                (r.nombre_completo && r.nombre_completo.toLowerCase().includes(search)) ||
                (r.cedula && r.cedula.includes(search)) ||
                (r.pernr && r.pernr.includes(search)) ||
                (r.posicion && r.posicion.toLowerCase().includes(search)) ||
                (r.ciudad && r.ciudad.toLowerCase().includes(search))
            );
        });

        // Métricas
        const stats = {
            total: allRecords.length,
            pendientes: allRecords.filter(r => r.estado === 'PENDIENTE').length,
            aprobados: allRecords.filter(r => r.estado === 'APROBADO').length,
            rechazados: allRecords.filter(r => r.estado === 'RECHAZADO').length,
            montoTotalAprobado: allRecords
                .filter(r => r.estado === 'APROBADO')
                .reduce((acc, curr) => acc + (Number(curr.cupo_aprobado) || 0), 0)
        };

        return NextResponse.json({
            success: true,
            data: filtered,
            stats
        });
    } catch (e: any) {
        console.error('Error en GET /api/benefits-90-days:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// 2. PUT: Modificar cupo u observaciones
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, cupo_aprobado, observaciones } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
        }

        const supabase = getSupabase();
        const updateData: any = { updated_at: new Date().toISOString() };

        if (cupo_aprobado !== undefined) updateData.cupo_aprobado = Number(cupo_aprobado);
        if (observaciones !== undefined) updateData.observaciones = observaciones;

        const { data, error } = await supabase
            .from('digi_employee_benefits_90d')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// 3. POST: Aprobar y enviar QR, o rechazar
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, ids, id, observaciones, aprobado_por, discount_id_ws } = body;

        const supabase = getSupabase();

        // ACCIÓN: RECHAZAR
        if (action === 'reject') {
            const targetId = id || (ids && ids[0]);
            if (!targetId) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });

            const { data, error } = await supabase
                .from('digi_employee_benefits_90d')
                .update({
                    estado: 'RECHAZADO',
                    observaciones: observaciones || 'Rechazado por Talento Humano',
                    aprobado_por: aprobado_por || 'Talento Humano',
                    aprobado_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', targetId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        // ACCIÓN: ASIGNAR ID DEL WEB SERVICE
        if (action === 'set_ws_discount_id') {
            if (!id || !discount_id_ws) {
                return NextResponse.json({ success: false, error: 'ID y discount_id_ws requeridos' }, { status: 400 });
            }
            const { data, error } = await supabase
                .from('digi_employee_benefits_90d')
                .update({
                    discount_id_ws: String(discount_id_ws),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        // ACCIÓN: APROBAR (Individual o Masivo)
        if (action === 'approve') {
            const targetIds: string[] = ids || (id ? [id] : []);
            if (targetIds.length === 0) {
                return NextResponse.json({ success: false, error: 'Lista de IDs requerida' }, { status: 400 });
            }

            // Consultar empleados a aprobar
            const { data: employees, error: fetchErr } = await supabase
                .from('digi_employee_benefits_90d')
                .select('*')
                .in('id', targetIds);

            if (fetchErr) throw fetchErr;
            if (!employees || employees.length === 0) {
                return NextResponse.json({ success: false, error: 'No se encontraron colaboradores' }, { status: 404 });
            }

            // Inicializar Azure Graph Client para enviar correos
            const clientId = process.env.AZURE_CLIENT_ID || '69f4a759-9537-4f11-b398-47a7f6ef8e83';
            const tenantId = process.env.AZURE_TENANT_ID || 'a25466cf-9db0-4555-b90b-3b29d4097ff2';
            const clientSecret = process.env.AZURE_CLIENT_SECRET || 'vg98Q~Zt5MJ2ui6mpjM~CCFiPGB8o5fObGM4ZbXm';
            const senderEmail = process.env.SMTP_USER || 'uneteanuestroequipo@ec.marathon-sports.com';

            let graphClient: Client | null = null;
            try {
                const msalConfig = {
                    auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}`, clientSecret }
                };
                const cca = new ConfidentialClientApplication(msalConfig);
                const authResponse = await cca.acquireTokenByClientCredential({
                    scopes: ['https://graph.microsoft.com/.default']
                });
                if (authResponse && authResponse.accessToken) {
                    graphClient = Client.init({
                        authProvider: (done) => done(null, authResponse.accessToken)
                    });
                }
            } catch (authErr) {
                console.warn('⚠️ Aviso: No se pudo autenticar con Graph API:', authErr);
            }

            const results = [];

            for (const emp of employees) {
                const now = new Date();
                const qrToken = `BEN90-${emp.pernr}-${now.getTime()}`;

                // Generar QR en Buffer
                const qrPayload = JSON.stringify({
                    empresa: 'SUPERDEPORTE S.A. / MARATHON',
                    beneficio: 'CUPO_DESCUENTO_90_DIAS',
                    pernr: emp.pernr,
                    cedula: emp.cedula,
                    colaborador: emp.nombre_completo,
                    cupo_aprobado: emp.cupo_aprobado,
                    token: qrToken,
                    id_ws: emp.discount_id_ws || null
                });

                const qrBuffer = await QRCode.toBuffer(qrPayload, {
                    type: 'png',
                    margin: 2,
                    width: 280,
                    color: {
                        dark: '#002f6c',
                        light: '#ffffff'
                    }
                });

                let emailSent = false;

                // Enviar correo si tiene email y Graph Client está disponible
                if (emp.email && graphClient) {
                    try {
                        const htmlContent = `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #002f6c 0%, #001838 100%); padding: 32px 24px; text-align: center; color: white;">
                                <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">🎉 ¡Felicitaciones por tus 90 Días!</h1>
                                <p style="margin: 8px 0 0; color: #93c5fd; font-size: 15px;">Superdeporte S.A. · Marathon Sports</p>
                            </div>

                            <!-- Body -->
                            <div style="padding: 32px 28px; color: #1e293b; line-height: 1.6;">
                                <p style="font-size: 16px; margin: 0 0 16px;">Hola <strong>${emp.nombre_completo}</strong>,</p>
                                
                                <p style="font-size: 15px; margin: 0 0 20px; color: #475569;">
                                    ¡Hoy celebramos un hito muy importante! Has cumplido tus primeros <strong>90 días</strong> formando parte de nuestra gran familia. Agradecemos tu esfuerzo, dedicación y compromiso diario.
                                </p>

                                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                                    <span style="display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Tu Cupo de Descuento Asignado</span>
                                    <span style="font-size: 36px; font-weight: 900; color: #059669; display: block;">$${Number(emp.cupo_aprobado).toFixed(2)}</span>
                                    <span style="font-size: 13px; color: #0284c7; font-weight: 600; display: inline-block; margin-top: 4px; background: #e0f2fe; padding: 3px 12px; border-radius: 9999px;">
                                        Categoría: ${emp.tipo_operacion?.replace('_', ' ')}
                                    </span>
                                </div>

                                <!-- QR Container -->
                                <div style="text-align: center; padding: 24px; background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 14px; margin-bottom: 24px;">
                                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #166534;">
                                        📱 Tu Código QR Personal de Descuento
                                    </p>
                                    <img src="cid:qrCodeDiscount" alt="Código QR de Descuento" style="width: 220px; height: 220px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: white; padding: 8px;" />
                                    <p style="margin: 12px 0 0; font-size: 12px; color: #4b5563;">
                                        Cédula: <strong>${emp.cedula}</strong> · Código: <strong>${emp.pernr}</strong>
                                    </p>
                                </div>

                                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 6px; margin-bottom: 24px; font-size: 13.5px; color: #1e40af;">
                                    <strong>¿Cómo canjear tu beneficio?</strong><br/>
                                    Presenta este código QR en las cajas de nuestras tiendas afiliadas junto con tu documento de identidad para acceder a tu descuento especial para colaboradores.
                                </div>

                                <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
                                    ¡Muchos éxitos y que sigan los logros en tu trayectoria con nosotros!
                                </p>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                                <p style="margin: 0;">Superdeporte S.A. / Marathon Sports · Gerencia de Talento Humano</p>
                                <p style="margin: 4px 0 0;">Este es un mensaje automático de bienvenida a beneficios corporativos.</p>
                            </div>
                        </div>
                        `;

                        const sendMailPayload = {
                            message: {
                                subject: `🎉 ¡Felicitaciones! Cumpliste 90 días en Marathon - Tu cupo de descuento está activo`,
                                body: { contentType: 'HTML', content: htmlContent },
                                toRecipients: [{ emailAddress: { address: emp.email } }],
                                attachments: [
                                    {
                                        '@odata.type': '#microsoft.graph.fileAttachment',
                                        name: 'descuento-qr.png',
                                        contentType: 'image/png',
                                        contentBytes: qrBuffer.toString('base64'),
                                        isInline: true,
                                        contentId: 'qrCodeDiscount'
                                    }
                                ]
                            }
                        };

                        await graphClient.api(`/users/${senderEmail}/sendMail`).post(sendMailPayload);
                        emailSent = true;
                    } catch (mailErr: any) {
                        console.error(`Error enviando correo a ${emp.email}:`, mailErr);
                    }
                }

                // Actualizar registro en Supabase
                const { error: updErr } = await supabase
                    .from('digi_employee_benefits_90d')
                    .update({
                        estado: 'APROBADO',
                        qr_token: qrToken,
                        email_sent: emailSent,
                        email_sent_at: emailSent ? now.toISOString() : null,
                        aprobado_por: aprobado_por || 'Talento Humano',
                        aprobado_at: now.toISOString(),
                        updated_at: now.toISOString()
                    })
                    .eq('id', emp.id);

                if (!updErr) {
                    results.push({
                        id: emp.id,
                        pernr: emp.pernr,
                        nombre: emp.nombre_completo,
                        email_sent: emailSent,
                        cupo_aprobado: emp.cupo_aprobado
                    });
                }
            }

            return NextResponse.json({
                success: true,
                count: results.length,
                results
            });
        }

        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    } catch (e: any) {
        console.error('Error en POST /api/benefits-90-days:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
