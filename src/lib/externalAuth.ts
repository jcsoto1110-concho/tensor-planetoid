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
        // Use the internal API route to avoid CORS issues
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cedula: cedula,
                password: password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.error || 'Credenciales inválidas'
            };
        }

        const data = await response.json();

        // The API route already validates the response
        return data;
    } catch (error) {
        console.error('Error authenticating with external service:', error);
        return {
            success: false,
            error: 'Error de conexión con el servidor de autenticación'
        };
    }
}
