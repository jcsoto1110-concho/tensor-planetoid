'use client';

import ConsentForm from '@/components/ConsentForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ConsentTestPage() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            padding: '2rem'
        }}>
            {/* Back Button */}
            <div style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
                <Link
                    href="/zero-paper/admin"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#667eea',
                        textDecoration: 'none',
                        fontWeight: '600'
                    }}
                >
                    <ArrowLeft size={20} />
                    Volver al Dashboard
                </Link>
            </div>

            {/* Consent Form */}
            <ConsentForm
                employeeId="test-123"
                employeeName="Juan Pérez"
                employeeCedula="1714639026"
                country="ecuador"
                onConsentGiven={(data) => {
                    console.log('Consent given:', data);
                }}
            />

            {/* Instructions */}
            <div style={{
                maxWidth: '800px',
                margin: '2rem auto 0',
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>
                    Página de Prueba - Formulario de Consentimiento
                </h3>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                    Esta es una página de prueba para el formulario de consentimiento. En producción, este formulario se mostraría:
                </p>
                <ul style={{ color: '#64748b', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                    <li>Al crear un nuevo empleado</li>
                    <li>Al editar un empleado existente</li>
                    <li>En una sección dedicada de consentimientos</li>
                </ul>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    <strong>Nota:</strong> Los datos se guardarán en Supabase en la tabla <code style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>consents</code>
                </p>
            </div>
        </div>
    );
}
