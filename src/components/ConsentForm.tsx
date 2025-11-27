'use client';

import { useState } from 'react';
import { Country } from '@/types/dataProtection';
import { CheckSquare, FileSignature, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ConsentFormProps {
    employeeId: string;
    employeeName: string;
    employeeCedula: string;
    country: Country;
    onConsentGiven?: (consentData: any) => void;
}

const consentTexts = {
    ecuador: {
        title: 'Consentimiento de Tratamiento de Datos Personales',
        text: `Yo, {employeeName}, identificado/a con cédula {employeeCedula}, AUTORIZO expresamente a Grupo Marathon para:

1. Recopilar, almacenar y procesar mis datos personales (nombre, cédula, documentos laborales, información de contacto).

2. Utilizar mis datos exclusivamente para fines de gestión de recursos humanos, cumplimiento de obligaciones laborales y archivo documental.

3. Compartir mis datos con personal autorizado del departamento de Recursos Humanos.

4. Almacenar mis datos en sistemas de información seguros con encriptación.

DECLARO que he sido informado/a de:
• Mis derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO)
• Las medidas de seguridad implementadas
• El plazo de conservación de mis datos (5 años post-terminación laboral)
• Mi derecho a revocar este consentimiento en cualquier momento

Conforme a la Ley Orgánica de Protección de Datos Personales de Ecuador.`
    },
    peru: {
        title: 'Autorización de Tratamiento de Datos Personales',
        text: `Yo, {employeeName}, identificado/a con DNI {employeeCedula}, AUTORIZO a Grupo Marathon para:

1. Incluir mis datos personales en su banco de datos inscrito en el Registro Nacional de Protección de Datos Personales.

2. Tratar mis datos personales para fines de gestión laboral, cumplimiento de obligaciones legales y administración documental.

3. Transferir mis datos a servidores ubicados en el extranjero con medidas de seguridad adecuadas.

4. Conservar mis datos durante la relación laboral y 5 años adicionales.

HE SIDO INFORMADO/A de:
• Mis derechos de información, acceso, actualización, inclusión, rectificación, supresión y oposición
• El carácter facultativo de proporcionar datos sensibles
• Las consecuencias de proporcionar datos falsos o incompletos
• El plazo de respuesta a mis solicitudes (10 días hábiles)

Conforme a la Ley N° 29733 - Ley de Protección de Datos Personales del Perú.`
    },
    chile: {
        title: 'Consentimiento Expreso para Tratamiento de Datos Sensibles',
        text: `Yo, {employeeName}, identificado/a con RUT {employeeCedula}, CONSIENTO EXPRESAMENTE que Grupo Marathon:

1. Trate mis datos personales sensibles (RUT, documentos laborales) en su base de datos inscrita en el Registro de Bancos de Datos Personales.

2. Utilice mis datos para administración de recursos humanos y cumplimiento de obligaciones laborales y tributarias.

3. Conserve mis datos durante la relación laboral y hasta 5 años posteriores.

4. Implemente medidas de seguridad para proteger mis datos.

DECLARO conocer:
• Mi derecho a ser informado sobre los datos almacenados
• Mi derecho a solicitar modificación de datos erróneos
• Mi derecho a solicitar eliminación de datos
• Mi derecho a bloquear datos en caso de uso indebido
• El plazo de respuesta de 2 días hábiles

Conforme a la Ley N° 19.628 sobre Protección de la Vida Privada de Chile.`
    }
};

export function ConsentForm({ employeeId, employeeName, employeeCedula, country, onConsentGiven }: ConsentFormProps) {
    const [agreed, setAgreed] = useState(false);
    const [privacyRead, setPrivacyRead] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const consent = consentTexts[country];
    const processedText = consent.text
        .replace('{employeeName}', employeeName)
        .replace('{employeeCedula}', employeeCedula);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreed || !privacyRead) {
            alert('Debe aceptar ambas casillas para continuar');
            return;
        }

        setIsSubmitting(true);

        const consentData = {
            employee_id: employeeId,
            employee_name: employeeName,
            employee_cedula: employeeCedula,
            country,
            consent_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
            consent_text: processedText,
            ip_address: 'N/A', // En producción, obtener IP real
            status: 'active'
        };

        // Guardar en Supabase
        const { data, error } = await supabase
            .from('consents')
            .insert(consentData)
            .select();

        if (error) {
            console.error('Error saving consent:', error);
            alert('❌ Error al guardar consentimiento: ' + error.message);
            setIsSubmitting(false);
            return;
        }

        if (onConsentGiven) {
            onConsentGiven(data[0]);
        }

        alert('✅ Consentimiento registrado exitosamente');
        setIsSubmitting(false);
    };

    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <FileSignature size={28} color="white" />
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                        {consent.title}
                    </h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                        Protección de Datos Personales - {country.toUpperCase()}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Consent Text */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.7',
                    fontSize: '0.95rem',
                    color: '#475569'
                }}>
                    {processedText}
                </div>

                {/* Employee Info */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '2rem',
                    padding: '1rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Empleado</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{employeeName}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Cédula/DNI/RUT</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{employeeCedula}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Fecha</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>
                            {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Vigencia</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>1 año (renovable)</div>
                    </div>
                </div>

                {/* Checkboxes */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'start',
                        gap: '0.75rem',
                        padding: '1rem',
                        backgroundColor: agreed ? '#f0fdf4' : '#fff',
                        border: `2px solid ${agreed ? '#10b981' : '#e2e8f0'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            style={{
                                width: '20px',
                                height: '20px',
                                marginTop: '2px',
                                cursor: 'pointer'
                            }}
                        />
                        <div>
                            <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                                Acepto el tratamiento de mis datos personales
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                Autorizo expresamente el procesamiento de mis datos conforme a lo descrito
                            </div>
                        </div>
                    </label>

                    <label style={{
                        display: 'flex',
                        alignItems: 'start',
                        gap: '0.75rem',
                        padding: '1rem',
                        backgroundColor: privacyRead ? '#f0fdf4' : '#fff',
                        border: `2px solid ${privacyRead ? '#10b981' : '#e2e8f0'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={privacyRead}
                            onChange={(e) => setPrivacyRead(e.target.checked)}
                            style={{
                                width: '20px',
                                height: '20px',
                                marginTop: '2px',
                                cursor: 'pointer'
                            }}
                        />
                        <div>
                            <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.25rem' }}>
                                He leído la Política de Privacidad
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                Confirmo haber leído y comprendido la{' '}
                                <a
                                    href="/zero-paper/privacy-policy"
                                    target="_blank"
                                    style={{ color: '#667eea', textDecoration: 'underline' }}
                                >
                                    Política de Privacidad
                                </a>
                            </div>
                        </div>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!agreed || !privacyRead || isSubmitting}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '10px',
                        background: (agreed && privacyRead && !isSubmitting)
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : '#94a3b8',
                        color: 'white',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '700',
                        cursor: (agreed && privacyRead && !isSubmitting) ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <CheckSquare size={20} />
                    {isSubmitting ? 'Registrando...' : 'Firmar Consentimiento Digitalmente'}
                </button>

                {/* Info Footer */}
                <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3b82f6'
                }}>
                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                        <Shield size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.875rem', color: '#475569' }}>
                            <strong>Importante:</strong> Puede revocar este consentimiento en cualquier momento contactando a{' '}
                            <a href="mailto:dpo@grupomarathon.com" style={{ color: '#3b82f6' }}>dpo@grupomarathon.com</a>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
