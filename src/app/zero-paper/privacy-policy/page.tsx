'use client';

import { useState } from 'react';
import { Country } from '@/types/dataProtection';
import { getPrivacyPolicy } from '@/lib/privacyPolicies';
import { FileText, Shield, Globe } from 'lucide-react';

// Configuración de la empresa (esto debería venir de una configuración global)
const COMPANY_CONFIG = {
    companyName: 'Grupo Marathon',
    ruc: 'TU_RUC_AQUI',
    dpoEmail: 'dpo@grupomarathon.com',
    privacyEmail: 'privacidad@grupomarathon.com'
};

export default function PrivacyPolicyPage() {
    const [selectedCountry, setSelectedCountry] = useState<Country>('ecuador');

    const policy = getPrivacyPolicy(selectedCountry, COMPANY_CONFIG);

    const countryNames = {
        ecuador: '🇪🇨 Ecuador',
        peru: '🇵🇪 Perú',
        chile: '🇨🇱 Chile'
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '900px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Shield size={32} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                                {policy.title}
                            </h1>
                            <p style={{ color: '#64748b', margin: '0.5rem 0 0 0' }}>
                                {COMPANY_CONFIG.companyName}
                            </p>
                        </div>
                    </div>

                    {/* Country Selector */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#475569',
                            marginBottom: '0.5rem'
                        }}>
                            <Globe size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                            Seleccione su país:
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {(Object.keys(countryNames) as Country[]).map((country) => (
                                <button
                                    key={country}
                                    onClick={() => setSelectedCountry(country)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '10px',
                                        border: selectedCountry === country ? '2px solid #667eea' : '2px solid #e2e8f0',
                                        background: selectedCountry === country ? '#f0f4ff' : 'white',
                                        color: selectedCountry === country ? '#667eea' : '#64748b',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {countryNames[country]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Legal Framework */}
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '8px',
                        borderLeft: '4px solid #667eea'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                            <strong>Marco Legal:</strong> {policy.law}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem' }}>
                            <strong>Autoridad:</strong>{' '}
                            <a
                                href={policy.authorityUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#667eea', textDecoration: 'underline' }}
                            >
                                {policy.authority}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Policy Sections */}
                {Object.entries(policy.sections).map(([key, section]: [string, any]) => (
                    <div
                        key={key}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '2rem',
                            marginBottom: '1.5rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    >
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#0f172a',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <FileText size={24} color="#667eea" />
                            {section.title}
                        </h2>
                        <div style={{
                            fontSize: '1rem',
                            color: '#475569',
                            lineHeight: '1.7',
                            whiteSpace: 'pre-line'
                        }}>
                            {section.content}
                        </div>
                    </div>
                ))}

                {/* Contact Footer */}
                <div style={{
                    backgroundColor: '#1e293b',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        ¿Preguntas sobre sus datos personales?
                    </h3>
                    <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
                        Contáctenos para ejercer sus derechos o resolver dudas
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Delegado de Protección de Datos</div>
                            <a
                                href={`mailto:${COMPANY_CONFIG.dpoEmail}`}
                                style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: '600' }}
                            >
                                {COMPANY_CONFIG.dpoEmail}
                            </a>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Privacidad</div>
                            <a
                                href={`mailto:${COMPANY_CONFIG.privacyEmail}`}
                                style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: '600' }}
                            >
                                {COMPANY_CONFIG.privacyEmail}
                            </a>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                        Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
}
