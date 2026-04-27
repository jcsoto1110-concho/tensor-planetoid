'use client';

import { useState, useEffect } from 'react';
import { useZPAuth } from '@/context/ZPAuthContext';
import { useDoc, DocFile } from '@/context/DocContext';
import { useRouter } from 'next/navigation';
import { 
    FileText, 
    CheckCircle, 
    Clock, 
    AlertCircle, 
    Shield, 
    LogOut,
    ExternalLink,
    Check
} from 'lucide-react';
import { getPrivacyPolicy } from '@/lib/privacyPolicies';
import { Country } from '@/types/dataProtection';

export default function EmployeePortalPage() {
    const { currentUser, logout } = useZPAuth();
    const { employees, findEmployeeById, loading, approvePendingDocument } = useDoc();
    const [consent, setConsent] = useState<any>(null);
    const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    // Get current employee's documents from the context
    const employee = currentUser?.cedula ? findEmployeeById(currentUser.cedula) : null;
    const documents = employee?.documents || [];
    const [country, setCountry] = useState<Country>('ecuador');
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) {
            router.push('/zero-paper/login');
            return;
        }

        if (currentUser.role !== 'EMPLOYEE') {
            router.push('/zero-paper/dashboard');
            return;
        }

        // Fetch documents and consent
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser?.cedula) return;
        
        // Fetch consent from Oracle via API
        try {
            const response = await fetch(`/api/consents?cedula=${currentUser.cedula}`);
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                setConsent(data.data[0]);
            }
        } catch (error) {
            console.error('Error fetching consent:', error);
        }
    };

    const handleApproveDataProtection = async () => {
        if (!currentUser?.cedula) return;
        
        setIsApproving(true);
        try {
            const policy = getPrivacyPolicy(country);
            
            const response = await fetch('/api/consents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_cedula: currentUser.cedula,
                    country: country,
                    consent_text: policy.law,
                    ip_address: 'N/A',
                    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
                    accepted: true
                })
            });

            if (!response.ok) throw new Error('Failed to save consent');

            const data = await response.json();
            if (data.success) {
                setConsent(data.data[0]);
                alert('✅ Política de Privacidad aprobada correctamente.');
            }
        } catch (error: any) {
            console.error('Error approving policy:', error);
            alert('❌ Error al aprobar la política: ' + error.message);
        } finally {
            setIsApproving(false);
        }
    };

    const handleApproveDocument = async (docId: string) => {
        if (!currentUser?.cedula) return;
        
        try {
            await approvePendingDocument(currentUser.cedula, docId, 'Empleado');
            alert('✅ Documento aprobado correctamente');
            setSelectedDoc(null);
        } catch (error) {
            console.error('Error approving document:', error);
            alert('❌ Error al aprobar el documento');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/zero-paper/login');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <CheckCircle size={20} color="#10b981" />;
            case 'PENDING':
                return <Clock size={20} color="#f59e0b" />;
            case 'REJECTED':
                return <AlertCircle size={20} color="#ef4444" />;
            default:
                return <FileText size={20} color="#6b7280" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return 'Aprobado';
            case 'PENDING':
                return 'Pendiente';
            case 'REJECTED':
                return 'Rechazado';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return '#d1fae5';
            case 'PENDING':
                return '#fef3c7';
            case 'REJECTED':
                return '#fee2e2';
            default:
                return '#f3f4f6';
        }
    };

    const policy = getPrivacyPolicy(country);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{ color: 'white', fontSize: '1.25rem' }}>Cargando...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.5rem 2rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            Portal de Empleados
                        </h1>
                        <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                            Bienvenido, {currentUser?.name}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Left Column: Privacy Policy & ARCO Rights */}
                    <div>
                        {/* Privacy Policy */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '15px',
                            padding: '2rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            marginBottom: '2rem'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#1a202c',
                                marginBottom: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <Shield size={28} color="#667eea" />
                                Política de Privacidad
                            </h2>
                            <div style={{
                                maxHeight: '400px',
                                overflowY: 'auto',
                                padding: '1rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                lineHeight: '1.6',
                                color: '#4a5568'
                            }}>
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {policy.law}
                                </div>
                            </div>
                        </div>

                        {/* ARCO Rights */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '15px',
                            padding: '2rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#1a202c',
                                marginBottom: '1rem'
                            }}>
                                ⚖️ Derechos ARCO
                            </h2>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                lineHeight: '1.6',
                                color: '#4a5568'
                            }}>
                                <p style={{ marginBottom: '1rem' }}>
                                    Usted tiene los siguientes derechos sobre sus datos personales:
                                </p>
                                <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
                                    <li style={{ marginBottom: '0.5rem' }}>
                                        <strong>Acceso:</strong> Solicitar una copia de sus datos personales
                                    </li>
                                    <li style={{ marginBottom: '0.5rem' }}>
                                        <strong>Rectificación:</strong> Corregir datos inexactos o incompletos
                                    </li>
                                    <li style={{ marginBottom: '0.5rem' }}>
                                        <strong>Cancelación:</strong> Solicitar la eliminación de sus datos
                                    </li>
                                    <li>
                                        <strong>Oposición:</strong> Oponerse al uso de sus datos para fines específicos
                                    </li>
                                </ul>
                                <button
                                    onClick={() => router.push('/zero-paper/arco-rights')}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        backgroundColor: '#667eea',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Ir al Portal de Derechos ARCO
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Approval & Documents */}
                    <div>
                        {!consent && (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                border: '2px solid #ffeeba',
                                borderRadius: '15px',
                                padding: '2rem',
                                marginBottom: '2rem',
                                textAlign: 'center'
                            }}>
                                <Shield size={48} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
                                <h3 style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 'bold',
                                    color: '#1a202c',
                                    marginBottom: '0.5rem'
                                }}>
                                    Aprobación Requerida
                                </h3>
                                <p style={{ color: '#4a5568', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                    Para acceder a sus documentos, debe aprobar la Ley de Protección de Datos Personales
                                </p>
                                <button
                                    onClick={handleApproveDataProtection}
                                    disabled={isApproving}
                                    style={{
                                        width: '100%',
                                        padding: '1.25rem',
                                        background: isApproving
                                            ? '#cbd5e0'
                                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        cursor: isApproving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: isApproving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    <Check size={24} />
                                    {isApproving ? 'Procesando...' : 'Aprobar Ley de Datos Personales'}
                                </button>
                            </div>
                        )}

                        {consent && (
                            <div style={{
                                backgroundColor: '#d1fae5',
                                border: '2px solid #10b981',
                                borderRadius: '15px',
                                padding: '1.5rem',
                                marginBottom: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}>
                                <CheckCircle size={32} color="#10b981" />
                                <div>
                                    <h3 style={{
                                        fontSize: '1.1rem',
                                        fontWeight: 'bold',
                                        color: '#1a202c',
                                        marginBottom: '0.25rem'
                                    }}>
                                        ✅ Ley de Datos Aprobada
                                    </h3>
                                    <p style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                                        Aprobado el {new Date(consent.consent_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Documents Section */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '15px',
                            padding: '2rem',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#1a202c',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <FileText size={28} color="#667eea" />
                                Mis Documentos ({documents.length})
                            </h2>

                            {documents.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: '#718096'
                                }}>
                                    <FileText size={64} color="#cbd5e0" style={{ margin: '0 auto 1rem' }} />
                                    <p style={{ fontSize: '1.1rem' }}>No tiene documentos cargados</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            style={{
                                                border: '2px solid #e2e8f0',
                                                borderRadius: '12px',
                                                padding: '1.25rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                backgroundColor: getStatusColor(doc.status)
                                            }}
                                            onClick={() => setSelectedDoc(doc)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                <FileText size={32} color="#667eea" />
                                                <div>
                                                    <h3 style={{
                                                        fontSize: '1rem',
                                                        fontWeight: '600',
                                                        color: '#1a202c',
                                                        marginBottom: '0.25rem'
                                                    }}>
                                                        {doc.fileName}
                                                    </h3>
                                                    <p style={{ fontSize: '0.85rem', color: '#718096' }}>
                                                        {new Date(doc.uploadDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                backgroundColor: 'white'
                                            }}>
                                                {getStatusIcon(doc.status)}
                                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                                                    {getStatusText(doc.status)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Document Preview Modal */}
                {selectedDoc && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            padding: '2rem',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem'
                            }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c' }}>
                                        {selectedDoc.fileName}
                                    </h2>
                                    <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.25rem' }}>
                                        Estado: {getStatusText(selectedDoc.status)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '2rem',
                                        cursor: 'pointer',
                                        color: '#718096'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {selectedDoc.type === 'pdf' ? (
                                <iframe
                                    src={selectedDoc.url}
                                    style={{
                                        width: '100%',
                                        height: '600px',
                                        border: 'none',
                                        borderRadius: '10px'
                                    }}
                                />
                            ) : (
                                <img
                                    src={selectedDoc.url}
                                    alt={selectedDoc.fileName}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '10px'
                                    }}
                                />
                            )}

                            {selectedDoc.comments && (
                                <div style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    backgroundColor: '#f7fafc',
                                    borderRadius: '10px'
                                }}>
                                    <strong>Comentarios:</strong>
                                    <p style={{ marginTop: '0.5rem', color: '#4a5568' }}>
                                        {selectedDoc.comments}
                                    </p>
                                </div>
                            )}

                            {/* Approval Button for Documents */}
                            {selectedDoc.status === 'PENDING' && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <button
                                        onClick={() => handleApproveDocument(selectedDoc.id)}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                                        }}
                                    >
                                        ✓ Aprobar Documento
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
