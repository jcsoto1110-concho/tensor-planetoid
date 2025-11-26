'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_USERS } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    users: User[]; // List of all users for Admin
    login: (email: string) => void;
    logout: () => void;
    updateUser: (updatedUser: User) => void; // Admin function
    createUser: (newUser: User) => void; // Admin function
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]); // Initialize empty, load from mock/localstorage
    const router = useRouter();

    // Initialize users from Mock or LocalStorage
    useEffect(() => {
        const storedUsers = localStorage.getItem('app_users');
        if (storedUsers) {
            setUsers(JSON.parse(storedUsers));
        } else {
            setUsers(MOCK_USERS);
            localStorage.setItem('app_users', JSON.stringify(MOCK_USERS));
        }
    }, []);

    // Persist users when changed
    useEffect(() => {
        if (users.length > 0) {
            localStorage.setItem('app_users', JSON.stringify(users));
        }
    }, [users]);

    // Check for logged in user on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (email: string) => {
        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem('current_user', JSON.stringify(foundUser));

            // Redirect based on role
            switch (foundUser.role) {
                case 'employee': router.push('/employee'); break;
                case 'boss': router.push('/boss'); break;
                case 'agency': router.push('/agency'); break;
                case 'finance': router.push('/finance'); break;
                case 'admin': router.push('/admin'); break;
            }
        } else {
            alert('Usuario no encontrado');
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('current_user');
        router.push('/login');
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        // If updating self, update current user state too
        if (user && user.id === updatedUser.id) {
            setUser(updatedUser);
            localStorage.setItem('current_user', JSON.stringify(updatedUser));
        }
    };

    const createUser = (newUser: User) => {
        setUsers(prev => [...prev, newUser]);
    };

    return (
        <AuthContext.Provider value={{ user, users, login, logout, updateUser, createUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
