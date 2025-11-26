'use client';

import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

export default function ZeroPaperLanding() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
        }}>
            <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
                <div style={{
                    width: '80px', height: '80px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 2rem auto',
                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)'
                }}>
                    <FileText size={40} color="white" />
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '-0.05em' }}>
                    ZeroPaper
                </h1>
                <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '3rem', lineHeight: '1.6' }}>
                    Sistema de Gestión Documental Inteligente.<br />
                    Digitaliza, organiza y encuentra cualquier documento en segundos.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/zero-paper/login" style={{
                        padding: '1rem 2rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        transition: 'transform 0.2s'
                    }}>
                        Ingresar al Sistema <ArrowRight size={20} />
                    </Link>
                </div>

                <p style={{ marginTop: '3rem', fontSize: '0.875rem', color: '#475569' }}>
                    v1.0.0 • Powered by Tensor Planetoid
                </p>
            </div>
        </div>
    );
}
