'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZPAuth } from '@/context/ZPAuthContext';
import { User, Lock, AlertCircle, FileText } from 'lucide-react';

export default function EmployeeLoginPage() {
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { loginEmployee } = useZPAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!cedula || !password) {
            setError('Por favor ingrese su cédula y contraseña');
            setIsLoading(false);
            return;
        }

        try {
            const success = await loginEmployee(cedula, password);

            if (success) {
                router.push('/zero-paper/employee-portal');
            } else {
                setError('Credenciales inválidas. Verifique su cédula y contraseña.');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Intente nuevamente.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '3rem',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {/* Logo/Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <FileText size={40} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        color: '#1a202c',
                        marginBottom: '0.5rem'
                    }}>
                        Portal de Empleados
                    </h1>
                    <p style={{ color: '#718096', fontSize: '0.95rem' }}>
                        Acceda a sus documentos personales
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <AlertCircle size={20} color="#c00" />
                        <span style={{ color: '#c00', fontSize: '0.9rem' }}>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    {/* Cédula Input */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#4a5568',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            Cédula
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User
                                size={20}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#a0aec0'
                                }}
                            />
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                placeholder="Ingrese su cédula"
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem 0.875rem 3rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: '#4a5568',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={20}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#a0aec0'
                                }}
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingrese su contraseña"
                                disabled={isLoading}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem 0.875rem 3rem',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: isLoading
                                ? '#cbd5e0'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isLoading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Ingresar'}
                    </button>
                </form>

                {/* Info Box */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#f7fafc',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    color: '#4a5568',
                    lineHeight: '1.5'
                }}>
                    <strong>ℹ️ Información:</strong><br />
                    Use su cédula y la contraseña proporcionada por el departamento de RRHH para acceder a sus documentos personales.
                </div>
            </div>
        </div>
    );
}
