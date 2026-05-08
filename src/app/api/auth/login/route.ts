import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        // 1. Validar contra el Web Service de Active Directory (AD)
        const response = await fetch('https://ns.aseyco.com:444/MSWebServiceNomina/rest/service/adService', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario: cedula, // Asumimos que el campo que antes era cédula ahora recibe el usuario de Windows
                password 
            })
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Credenciales de Windows inválidas' },
                { status: 401 }
            );
        }

        const responseText = await response.text();
        let authData;
        try {
            authData = JSON.parse(responseText);
        } catch (e) {
            console.error('WS Response is not JSON:', responseText);
            return NextResponse.json(
                { success: false, error: 'Respuesta inválida del servidor de nómina', debug: responseText },
                { status: 502 }
            );
        }

        if (authData.error || authData.success === false) {
            return NextResponse.json(
                { success: false, error: authData.message || 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        let profile = null;
        const cleanCedula = cedula.trim();

        // 2. Si es para el panel de candidatos, validar que la cédula esté autorizada en admin_profiles
        if (app === 'candidates') {
            console.log(`Checking admin_profiles for cedula: "${cleanCedula}"`);
            const { data: profileData, error: profileError } = await supabase
                .from('admin_profiles')
                .select('*')
                .eq('cedula', cleanCedula)
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
                        debug_cedula: cleanCedula 
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
            userData.company_name = profile.company_name || 'SUPERDEPORTE S.A.';
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
