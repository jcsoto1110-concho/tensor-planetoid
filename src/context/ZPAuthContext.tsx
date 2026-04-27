'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticateWithExternalService } from '@/lib/externalAuth';

export type UserRole = 'UPLOADER' | 'APPROVER' | 'ADMIN' | 'EMPLOYEE';

export interface ZPUser {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    cedula: string;
}

interface ZPAuthContextType {
    currentUser: ZPUser | null;
    login: (cedula: string, password: string) => Promise<boolean>;
    loginEmployee: (cedula: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const ZPAuthContext = createContext<ZPAuthContextType | undefined>(undefined);

// La autenticación se realiza vía Web Service y los roles se consultan en Oracle.

export function ZPAuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<ZPUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('zp_current_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                // Si el usuario tiene un ID que no parece una cédula o si no tiene las propiedades esperadas, limpiar
                if (!parsedUser.role || !parsedUser.cedula) {
                    localStorage.removeItem('zp_current_user');
                    setCurrentUser(null);
                } else {
                    setCurrentUser(parsedUser);
                }
            } catch (e) {
                console.error('Error loading user:', e);
                localStorage.removeItem('zp_current_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (cedula: string, password: string): Promise<boolean> => {
        try {
            // 1. Autenticar con servicio externo (WS)
            const authResult = await authenticateWithExternalService(cedula, password);

            if (!authResult.success) {
                console.error('Authentication failed:', authResult.error);
                return false;
            }

            // 2. Buscar rol en tablas de Oracle: digi_user_roles UNION con employees
            // Intentar primero roles especiales (ADMIN, APPROVER, UPLOADER)
            const roleResponse = await fetch(`/api/users/roles?cedula=${cedula}`);
            const roleData = await roleResponse.json();

            let appRole: UserRole | null = null;
            let displayName = authResult.data?.nombre || 'Usuario';

            if (roleData.success && roleData.data && roleData.data.length > 0) {
                // Tomar el primer rol encontrado (o manejar múltiples si es necesario)
                appRole = roleData.data[0].ROLE as UserRole;
                
                // Intentar obtener el nombre desde digi_users si existe
                const userResponse = await fetch(`/api/users?cedula=${cedula}`);
                const userData = await userResponse.json();
                if (userData.success && userData.data?.length > 0) {
                    displayName = userData.data[0].NAME;
                }
            } else {
                // Si no tiene rol especial, verificar si es empleado estándar
                const empResponse = await fetch(`/api/employees?id=${cedula}`);
                const empData = await empResponse.json();

                if (empData.success && empData.data && empData.data.length > 0) {
                    appRole = 'EMPLOYEE';
                    displayName = `${empData.data[0].NAME} ${empData.data[0].APELLIDO}`;
                }
            }

            if (!appRole) {
                console.error('User authenticated but no role found in system');
                alert('No tiene permisos asignados en el sistema. Contacte al administrador.');
                return false;
            }

            // 3. Crear objeto de usuario
            const user: ZPUser = {
                id: cedula,
                username: cedula,
                name: displayName,
                role: appRole,
                cedula: cedula
            };

            // 4. Guardar en localStorage y estado
            setCurrentUser(user);
            localStorage.setItem('zp_current_user', JSON.stringify(user));

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const loginEmployee = async (cedula: string, password: string): Promise<boolean> => {
        // Redirigir al mismo flujo de login unificado que ahora maneja todos los roles
        return login(cedula, password);
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('zp_current_user');
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.25rem'
            }}>
                Cargando...
            </div>
        );
    }

    return (
        <ZPAuthContext.Provider value={{
            currentUser,
            login,
            loginEmployee,
            logout,
            isAuthenticated: currentUser !== null
        }}>
            {children}
        </ZPAuthContext.Provider>
    );
}

export function useZPAuth() {
    const context = useContext(ZPAuthContext);
    if (!context) {
        throw new Error('useZPAuth debe usarse dentro de ZPAuthProvider');
    }
    return context;
}

// Helper para verificar permisos
export function hasPermission(user: ZPUser | null, requiredRole: UserRole | UserRole[]): boolean {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    // ADMIN tiene todos los permisos
    if (user.role === 'ADMIN') return true;

    return roles.includes(user.role);
}
