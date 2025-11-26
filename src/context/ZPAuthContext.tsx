'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticateWithExternalService } from '@/lib/externalAuth';
import { supabase } from '@/lib/supabase';

export type UserRole = 'UPLOADER' | 'APPROVER' | 'ADMIN';

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
    logout: () => void;
    isAuthenticated: boolean;
}

const ZPAuthContext = createContext<ZPAuthContextType | undefined>(undefined);

// Usuarios de demostración
const DEMO_USERS: Array<ZPUser & { password: string }> = [
    {
        id: 'admin-001',
        username: 'admin',
        password: 'admin123',
        name: 'Administrador',
        role: 'ADMIN'
    },
    {
        id: 'approver-001',
        username: 'aprobador',
        password: 'aprobar123',
        name: 'Supervisor de Aprobaciones',
        role: 'APPROVER'
    },
    {
        id: 'uploader-001',
        username: 'operador',
        password: 'subir123',
        name: 'Operador de Carga',
        role: 'UPLOADER'
    }
];

export function ZPAuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<ZPUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('zp_current_user');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Error loading user:', e);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (cedula: string, password: string): Promise<boolean> => {
        try {
            // 1. Autenticar con servicio externo
            const authResult = await authenticateWithExternalService(cedula, password);

            if (!authResult.success) {
                console.error('Authentication failed:', authResult.error);
                return false;
            }

            // 2. Buscar rol en tabla local
            const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('*')
                .eq('cedula', cedula)
                .single();

            if (roleError || !roleData) {
                console.error('User not found in roles table:', roleError);
                return false;
            }

            // 3. Mapear rol del formato local al formato de la aplicación
            const roleMap: Record<string, UserRole> = {
                'admin': 'ADMIN',
                'approver': 'APPROVER',
                'viewer': 'UPLOADER'
            };

            const appRole = roleMap[roleData.role] || 'UPLOADER';

            // 4. Crear objeto de usuario
            const user: ZPUser = {
                id: cedula,
                username: cedula,
                name: roleData.name || authResult.data?.nombre || 'Usuario',
                role: appRole,
                cedula: cedula
            };

            // 5. Guardar en localStorage y estado
            setCurrentUser(user);
            localStorage.setItem('zp_current_user', JSON.stringify(user));

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
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
