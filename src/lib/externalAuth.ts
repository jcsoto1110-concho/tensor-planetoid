interface AuthResponse {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Autentica un usuario con el servicio externo de Aseyco
 * @param cedula - Número de cédula del usuario
 * @param password - Contraseña del usuario
 * @returns Objeto con resultado de autenticación
 */
export async function authenticateWithExternalService(
    cedula: string,
    password: string
): Promise<AuthResponse> {
    try {
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
            return {
                success: false,
                error: 'Credenciales inválidas'
            };
        }

        const data = await response.json();

        // Verificar si el servicio retorna un indicador de éxito
        if (data.error || data.success === false) {
            return {
                success: false,
                error: data.message || 'Credenciales inválidas'
            };
        }

        return {
            success: true,
            data: data
        };
    } catch (error) {
        console.error('Error authenticating with external service:', error);
        return {
            success: false,
            error: 'Error de conexión con el servidor de autenticación'
        };
    }
}
