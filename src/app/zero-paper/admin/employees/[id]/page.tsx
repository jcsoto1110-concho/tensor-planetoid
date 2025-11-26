'use client';

import { useState, useEffect } from 'react';
import { useDoc, DocFile } from '@/context/DocContext';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Calendar, Briefcase, User, X, Eye, Mail, Phone, MapPin, Award } from 'lucide-react';
import { decryptToDataUrl } from '@/lib/encryption';

export default function EmployeeDetailPage() {
    const params = useParams();
    const { findEmployeeById } = useDoc();
    const employee = findEmployeeById(params.id as string);
    const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);

    // Filter to show only approved documents
    const approvedDocuments = employee?.documents.filter(doc => doc.status === 'APPROVED') || [];

    // Decrypt document when selected
    useEffect(() => {
        if (selectedDoc && selectedDoc.url) {
            try {
                const decrypted = decryptToDataUrl(selectedDoc.url);
                setDecryptedUrl(decrypted);
            } catch (error) {
                console.error('Error decrypting document:', error);
                setDecryptedUrl(null);
            }
        } else {
            setDecryptedUrl(null);
        }
    }, [selectedDoc]);

    if (!employee) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#64748b' }}>Empleado no encontrado</h2>
                <Link href="/zero-paper/admin/employees" style={{ color: '#3b82f6', marginTop: '1rem', display: 'inline-block' }}>
                    Volver al directorio
                </Link>
            </div>
        );
    }

    // Format entry date properly
    const formatDate = (dateStr: string) => {
        try {
            // Check if it's a raw number (Excel serial date)
            if (!isNaN(Number(dateStr))) {
                return dateStr; // For now, keep as is - ideally convert Excel serial
            }
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div>
            <Link href="/zero-paper/admin/employees" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                color: '#64748b', textDecoration: 'none', marginBottom: '2rem',
                fontSize: '0.875rem', fontWeight: '500', transition: 'color 0.2s'
            }} className="hover:text-blue-600">
                <ArrowLeft size={16} /> Volver al Directorio
            </Link>

            {/* Enhanced Header Card */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '3rem 2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                color: 'white',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        border: '4px solid rgba(255,255,255,0.3)'
                    }}>
                        <User size={60} color="#667eea" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            {employee.name}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.125rem', opacity: 0.95 }}>
                            <Briefcase size={20} />
                            <span style={{ fontWeight: '500' }}>{employee.position}</span>
                        </div>
                    </div>
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.3)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <FileText size={32} style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{approvedDocuments.length}</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Documentos</div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Award size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>ID / Cédula</div>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{employee.id}</div>
                        </div>
                    </div>

                    {employee.codigo_sap && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FileText size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Código SAP</div>
                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{employee.codigo_sap}</div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Calendar size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Fecha de Ingreso</div>
                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{formatDate(employee.entryDate)}</div>
                        </div>
                    </div>

                    {employee.departamento && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Departamento</div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    {employee.departamento}
                                </div>
                            </div>
                        </div>
                    )}

                    {(employee.ciudad || employee.pais || employee.region) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <MapPin size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Ubicación</div>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                                    {[employee.ciudad, employee.region, employee.pais].filter(Boolean).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Documents Section */}
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                        Documentos Digitalizados
                    </h2>
                    <div style={{
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        padding: '0.5rem 1rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                    }}>
                        {approvedDocuments.length} archivo{approvedDocuments.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {approvedDocuments.length === 0 ? (
                    <div style={{
                        padding: '4rem',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        borderRadius: '12px',
                        border: '2px dashed #cbd5e1'
                    }}>
                        <FileText size={48} color="#94a3b8" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ color: '#64748b', fontSize: '1.125rem', fontWeight: '500' }}>No hay documentos cargados</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Los documentos aparecerán aquí cuando sean agregados.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {approvedDocuments.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoc(doc)}
                                style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    border: '1px solid #e2e8f0',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                }}
                            >
                                <div style={{
                                    height: '160px',
                                    background: doc.type === 'image' ? '#000' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {doc.type === 'image' ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={doc.url}
                                            alt={doc.fileName}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <FileText size={56} color="rgba(255,255,255,0.9)" />
                                    )}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transition: 'opacity 0.3s'
                                    }} className="hover-overlay">
                                        <Eye size={32} color="white" />
                                    </div>
                                </div>
                                <div style={{ padding: '1.25rem' }}>
                                    <div style={{
                                        fontWeight: '600',
                                        color: '#0f172a',
                                        fontSize: '0.9rem',
                                        marginBottom: '0.5rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }} title={doc.fileName}>
                                        {doc.fileName}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.5rem'
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={12} />
                                            {doc.uploadDate}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                padding: '0.25rem',
                                                cursor: 'pointer',
                                                color: '#3b82f6',
                                                transition: 'transform 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <a href={doc.url} download={doc.fileName} title="Descargar">
                                                <Download size={16} />
                                            </a>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enhanced Document Viewer Modal */}
            {selectedDoc && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setSelectedDoc(null)}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        width: '100%',
                        maxWidth: '1200px',
                        height: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        animation: 'slideUp 0.3s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '1.5rem 2rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{selectedDoc.fileName}</h3>
                                <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Subido el {selectedDoc.uploadDate}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <a
                                    href={decryptedUrl || '#'}
                                    download={decryptedUrl ? selectedDoc.fileName : undefined}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        transition: 'background 0.2s',
                                        opacity: decryptedUrl ? 1 : 0.5,
                                        pointerEvents: decryptedUrl ? 'auto' : 'none'
                                    }}
                                    onMouseEnter={(e) => { if (decryptedUrl) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'; }}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                                >
                                    <Download size={16} />
                                    Descargar
                                </a>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'white',
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div style={{
                            flex: 1,
                            backgroundColor: '#f8fafc',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {decryptedUrl ? (
                                selectedDoc.type === 'pdf' ? (
                                    <iframe
                                        src={decryptedUrl}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title="Document Viewer"
                                    />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={decryptedUrl}
                                        alt={selectedDoc.fileName}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%',
                                            objectFit: 'contain',
                                            padding: '2rem'
                                        }}
                                    />
                                )
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                    <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '1rem', fontWeight: '600' }}>Descifrando documento...</p>
                                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Un momento por favor</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .hover-overlay {
                    opacity: 0;
                }
                div:hover .hover-overlay {
                    opacity: 1 !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
