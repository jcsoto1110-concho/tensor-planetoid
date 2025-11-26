'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MOCK_USERS } from '@/lib/mock-data';
import { Briefcase, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--background)',
            backgroundImage: 'radial-gradient(circle at top right, #e2e8f0 0%, transparent 40%), radial-gradient(circle at bottom left, #e2e8f0 0%, transparent 40%)'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', border: 'none' }}>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '12px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', marginBottom: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.3)'
                    }}>
                        <Briefcase size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>Bienvenido a CorpTravel</h2>
                    <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Gestión inteligente de viajes corporativos</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Correo Corporativo</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@empresa.com"
                            required
                            style={{ padding: '0.75rem' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Contraseña</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ padding: '0.75rem' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem', fontSize: '1rem' }}>
                        Iniciar Sesión <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
                        Acceso Rápido (Demo)
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {MOCK_USERS.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                className="btn btn-outline"
                                style={{ fontSize: '0.75rem', padding: '0.5rem', justifyContent: 'flex-start', height: 'auto' }}
                                onClick={() => {
                                    setEmail(u.email);
                                    setPassword('123');
                                }}
                            >
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--secondary)', marginRight: '0.5rem' }}></div>
                                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
