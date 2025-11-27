'use client';

import { useState } from 'react';
import { Country } from '@/types/dataProtection';
import { FileSearch, Edit, Trash2, Ban, Download, Send, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const requestTypes = {
    access: {
        icon: FileSearch,
        label: 'Acceso',
        description: 'Ver mis datos personales almacenados',
        color: '#3b82f6'
    },
    rectify: {
        icon: Edit,
        label: 'Rectificación',
        description: 'Corregir datos incorrectos o desactualizados',
        color: '#f59e0b'
    },
    delete: {
        icon: Trash2,
        label: 'Cancelación',
        description: 'Eliminar mis datos personales',
        color: '#ef4444'
    },
    oppose: {
        icon: Ban,
        label: 'Oposición',
        description: 'Negarme al tratamiento de mis datos',
        color: '#8b5cf6'
    },
    export: {
        icon: Download,
        label: 'Portabilidad',
        description: 'Exportar mis datos en formato digital',
        color: '#10b981'
    }
};

const responseTimes = {
    ecuador: '15 días hábiles',
    peru: '10 días hábiles',
    chile: '2 días hábiles'
};

export default function ARCOPortalPage() {
    const [selectedCountry, setSelectedCountry] = useState<Country>('ecuador');
    const [selectedType, setSelectedType] = useState<string>('');
    const [cedula, setCedula] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedType || !cedula || !details) {
            alert('Por favor complete todos los campos');
            return;
        }

        setIsSubmitting(true);

        const requestData = {
            employee_cedula: cedula,
            request_type: selectedType,
            country: selectedCountry,
            request_date: new Date().toISOString(),
            details,
            status: 'pending'
        };

        // Guardar en Supabase
        const { data, error } = await supabase
            .from('arco_requests')
            .insert(requestData)
            .select();

        if (error) {
            console.error('Error saving ARCO request:', error);
            alert('❌ Error al enviar solicitud: ' + error.message);
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '3rem',
                    maxWidth: '600px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <CheckCircle size={48} color="white" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1rem' }}>
                        ¡Solicitud Enviada!
                    </h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem' }}>
                        Su solicitud de {requestTypes[selectedType as keyof typeof requestTypes].label.toLowerCase()} ha sido registrada exitosamente.
                    </p>
                    <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '2px solid #10b981',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ fontSize: '0.875rem', color: '#064e3b', marginBottom: '0.5rem' }}>
                            Plazo de respuesta
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                            {responseTimes[selectedCountry]}
                        </div>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '2rem' }}>
                        Recibirá una respuesta a su solicitud en el correo electrónico registrado.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitted(false);
                            setSelectedType('');
                            setCedula('');
                            setDetails('');
                        }}
                        style={{
                            padding: '1rem 2rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        Nueva Solicitud
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8fafc',
            padding: '2rem'
        }}>
            <div style={{
                maxWidth: '1000px',
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
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
                        Portal de Derechos ARCO
                    </h1>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                        Ejercer sus derechos sobre datos personales
                    </p>

                    {/* Country Selector */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#475569',
                            marginBottom: '0.5rem'
                        }}>
                            Seleccione su país:
                        </label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {(['ecuador', 'peru', 'chile'] as Country[]).map((country) => (
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
                                        cursor: 'pointer'
                                    }}
                                >
                                    {country === 'ecuador' && '🇪🇨 Ecuador'}
                                    {country === 'peru' && '🇵🇪 Perú'}
                                    {country === 'chile' && '🇨🇱 Chile'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        backgroundColor: '#eff6ff',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#475569'
                    }}>
                        <strong>Plazo de respuesta:</strong> {responseTimes[selectedCountry]}
                    </div>
                </div>

                {/* Request Types */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {Object.entries(requestTypes).map(([key, type]) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === key;

                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedType(key)}
                                style={{
                                    backgroundColor: isSelected ? type.color : 'white',
                                    color: isSelected ? 'white' : '#0f172a',
                                    border: `2px solid ${isSelected ? type.color : '#e2e8f0'}`,
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <Icon size={32} style={{ marginBottom: '0.75rem' }} />
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {type.label}
                                </div>
                                <div style={{ fontSize: '0.875rem', opacity: isSelected ? 0.9 : 0.7 }}>
                                    {type.description}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Form */}
                {selectedType && (
                    <form onSubmit={handleSubmit} style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '1.5rem' }}>
                            Solicitud de {requestTypes[selectedType as keyof typeof requestTypes].label}
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#475569',
                                marginBottom: '0.5rem'
                            }}>
                                Cédula / DNI / RUT
                            </label>
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                placeholder="Ingrese su número de identificación"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    borderRadius: '10px',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#475569',
                                marginBottom: '0.5rem'
                            }}>
                                Detalles de la solicitud
                            </label>
                            <textarea
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                placeholder="Describa su solicitud con el mayor detalle posible..."
                                required
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    borderRadius: '10px',
                                    border: '2px solid #e2e8f0',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '10px',
                                background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Send size={20} />
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
