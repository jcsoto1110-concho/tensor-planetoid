import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: POST /api/auth/login
 * 
 * Server-side proxy for authenticating with the external Aseyco service.
 * This avoids CORS issues when making requests from the browser.
 */
export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        const { cedula, password } = body;

        // Validate inputs
        if (!cedula || !password) {
            return NextResponse.json(
                { success: false, error: 'Cédula y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Forward the request to the external authentication service
        const response = await fetch('https://ns.aseyco.com:444/MSWebServiceNomina/rest/service/wsNominaEmp', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify({
                cedula: cedula,
                password: password
            })
        });

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        const data = await response.json();

        // Check if the external service returned an error
        if (data.error || data.success === false) {
            return NextResponse.json(
                { success: false, error: data.message || 'Credenciales inválidas' },
                { status: 401 }
            );
        }

        // Return successful authentication
        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Error in authentication proxy:', error);
        return NextResponse.json(
            { success: false, error: 'Error de conexión con el servidor de autenticación' },
            { status: 500 }
        );
    }
}
