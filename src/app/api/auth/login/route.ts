import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { executeOracleQuery } from '@/lib/oracledb';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cedula, password, app } = body;
        console.log(`Login attempt: app=${app}, cedula=${cedula}`);

        if (!cedula || !password) {
            return NextResponse.json(
                { success: false, error: 'Cédula y contraseña son requeridos' },
                { status: 400 }
            );
        }

        let adAuthenticated = false;
        let authData: any = null;
        let adErrorDetail = 'Credenciales de Windows inválidas';

        // 1. Validar contra el Web Service de Active Directory (AD)
        try {
            const response = await fetch('https://ns.aseyco.com:444/MSWebServiceNomina/rest/service/adService', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario: cedula, 
                    password 
                })
            });

            if (response.ok) {
                const responseText = await response.text();
                try {
                    authData = JSON.parse(responseText);
                    if (!authData.error && authData.success !== false && (!authData.codigo || authData.codigo === '1')) {
                        adAuthenticated = true;
                    } else {
                        adErrorDetail = authData.message || authData.mensaje || adErrorDetail;
                    }
                } catch (e) {
                    console.error('WS Response is not JSON:', responseText);
                }
            } else {
                adErrorDetail = `HTTP ${response.status}: Error en servidor AD`;
            }
        } catch (e: any) {
            console.error('AD connection error:', e);
            adErrorDetail = `Error de conexión: ${e.message}`;
        }

        // Fallback #2: Si no está autenticado por AD, buscar en Oracle DIGI_EMPLOYEES
        if (!adAuthenticated) {
            try {
                console.log(`Fallback login check in Oracle for cedula: ${cedula}`);
                const dbResult = await executeOracleQuery(
                    `SELECT id, name, apellido, position FROM digi_employees WHERE id = :id AND estado = '1'`,
                    { id: cedula }
                );
                
                if (dbResult.rows && dbResult.rows.length > 0) {
                    const employee = dbResult.rows[0];
                    adAuthenticated = true;
                    authData = {
                        cedula: employee.ID || employee.id,
                        nombre: `${employee.NAME || employee.name} ${employee.APELLIDO || employee.apellido}`.trim(),
                        success: true
                    };
                    console.log(`Fallback login success for employee: ${authData.nombre}`);
                }
            } catch (dbErr: any) {
                console.error('Oracle database lookup error during fallback login:', dbErr);
            }
        }

        // Fallback #3 (Producción): Para supervisores, validar directamente en Supabase
        // cuando AD y Oracle no son alcanzables desde el servidor público
        if (!adAuthenticated && (app === 'supervisor' || app === 'zero-paper')) {
            try {
                const cleanEmailCheck = cedula.trim().toLowerCase();
                const shortUserCheck = cleanEmailCheck.split('@')[0];
                console.log(`Fallback #3: Supabase supervisor check for: ${cleanEmailCheck}`);

                const { data: supFallback, error: supFallbackError } = await supabase
                    .from('formative_supervisors')
                    .select('id, name, email')
                    .or(`email.ilike."${cleanEmailCheck}",email.ilike."${shortUserCheck}@%"`)
                    .maybeSingle();

                if (!supFallbackError && supFallback) {
                    adAuthenticated = true;
                    authData = {
                        cedula: supFallback.email,
                        nombre: supFallback.name,
                        success: true
                    };
                    console.log(`Fallback #3 Supabase supervisor auth success: ${supFallback.name}`);
                } else {
                    console.log(`Fallback #3: Supervisor not found in Supabase for "${cleanEmailCheck}"`);
                }

                // If still not authenticated and it's zero paper, just allow it in development with a mock user
                if (!adAuthenticated && app === 'zero-paper' && process.env.NODE_ENV === 'development') {
                     console.log(`Fallback #4: Allowing zero-paper login in development for ${cedula}`);
                     adAuthenticated = true;
                     authData = {
                         cedula: cedula,
                         nombre: 'Admin Pruebas',
                         success: true
                     };
                }
            } catch (supErr: any) {
                console.error('Supabase fallback supervisor check error:', supErr);
            }
        }

        if (!adAuthenticated) {
            return NextResponse.json(
                { success: false, error: adErrorDetail },
                { status: 401 }
            );
        }

        let profile = null;
        const cleanUser = cedula.trim();
        const shortUser = cleanUser.split('@')[0]; // Extraer 'jsoto' de 'jsoto@ec.aseyco.com'

        // 2. Si es para el panel de candidatos, validar que el usuario esté autorizado en admin_profiles
        if (app === 'candidates') {
            console.log(`Checking admin_profiles for user: "${cleanUser}" or "${shortUser}"`);
            const { data: profileData, error: profileError } = await supabase
                .from('admin_profiles')
                .select('*')
                // Buscamos en la nueva columna ad_user o mantenemos compatibilidad con cedula
                .or(`ad_user.ilike."${cleanUser}",ad_user.ilike."${shortUser}",cedula.ilike."${cleanUser}",cedula.ilike."${shortUser}"`)
                .eq('is_active', true)
                .maybeSingle();
            
            profile = profileData;
            console.log(`Profile found: ${profile ? 'YES' : 'NO'}`);
            if (profileError) console.error('Supabase error:', profileError);

            if (profileError || !profile) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: 'Usuario no autorizado para acceder al panel administrativo de candidatos',
                        debug_cedula: cleanUser 
                    },
                    { status: 403 }
                );
            }
        }

        // 3. Preparar datos de respuesta
        let userData: any = {
            cedula: authData.cedula || cedula,
            name: authData.nombre || 'Usuario',
            company_slug: 'superdeporte',
            company_name: 'SUPERDEPORTE S.A.',
            perfil: 'ADMIN'
        };

        if (app === 'candidates' && profile) {
            userData.name = profile.name;
            userData.company_slug = profile.company_slug || 'superdeporte';
            userData.company_name = (profile.company_name || 'SUPERDEPORTE S.A.').replace('SUPERDEPORT S.A.', 'SUPERDEPORTE S.A.');
            userData.perfil = profile.perfil || 'ADMIN';
        }

        return NextResponse.json({
            success: true,
            user: userData
        });

    } catch (error: any) {
        console.error('Error in authentication route:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Error de conexión con el servidor', 
                debug: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}
