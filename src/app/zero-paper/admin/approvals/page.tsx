'use client';

import { useState, useEffect } from 'react';
import { useDoc } from '@/context/DocContext';
import { useZPAuth } from '@/context/ZPAuthContext';
import { CheckCircle2, XCircle, FileText, User, Calendar, MessageSquare, Eye, X, CheckCheck } from 'lucide-react';
import { decryptToDataUrl } from '@/lib/encryption';

export default function ApprovalsPage() {
    const { getPendingDocuments, approvePendingDocument, rejectPendingDocument } = useDoc();
    const { currentUser } = useZPAuth();
    const pendingDocs = getPendingDocuments();

    const [selectedDoc, setSelectedDoc] = useState<{ employee: any; document: any } | null>(null);
    const [comments, setComments] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);

    // Group documents by employee
    const groupedByEmployee = pendingDocs.reduce((acc, item) => {
        const empId = item.employee.id;
        if (!acc[empId]) {
            acc[empId] = {
                employee: item.employee,
                documents: []
            };
        }
        acc[empId].documents.push(item.document);
        return acc;
    }, {} as Record<string, { employee: any; documents: any[] }>);

    const groupedEmployees = Object.values(groupedByEmployee);

    const handleApprove = () => {
        if (!selectedDoc) return;

        approvePendingDocument(
            selectedDoc.employee.id,
            selectedDoc.document.id,
            currentUser?.name || 'Sistema',
            comments || undefined
        );

        setSelectedDoc(null);
        setComments('');
        setShowPreview(false);
        alert('✅ Documento aprobado exitosamente');
    };

    const handleApproveAll = (e: React.MouseEvent, employeeId: string, employeeName: string, documents: any[]) => {
        e.preventDefault();
        e.stopPropagation();

        const confirmMsg = `¿Aprobar TODOS los ${documents.length} documento(s) de ${employeeName}?\n\nEsta acción aprobará todos los documentos a la vez.`;
        if (!confirm(confirmMsg)) return;

        documents.forEach(doc => {
            approvePendingDocument(
                employeeId,
                doc.id,
                currentUser?.name || 'Sistema',
                'Aprobación masiva - Todos los documentos'
            );
        });

        alert(`✅ ${documents.length} documentos de ${employeeName} aprobados exitosamente`);
    };

    const handleReject = () => {
        if (!selectedDoc) return;

        if (!comments.trim()) {
            alert('⚠️ Por favor ingresa un motivo de rechazo');
            return;
        }

        rejectPendingDocument(
            selectedDoc.employee.id,
            selectedDoc.document.id,
            currentUser?.name || 'Sistema',
            comments
        );

        setSelectedDoc(null);
        setComments('');
        setShowPreview(false);
        alert('❌ Documento rechazado');
    };

    // Decrypt document when selected
    useEffect(() => {
        if (selectedDoc && selectedDoc.document.url) {
            try {
                const decrypted = decryptToDataUrl(selectedDoc.document.url);
                setDecryptedUrl(decrypted);
            } catch (error) {
                console.error('Error decrypting document:', error);
                setDecryptedUrl(null);
            }
        } else {
            setDecryptedUrl(null);
        }
    }, [selectedDoc]);

    return (
        <div>
            {/* Modern Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2.5rem 2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                color: 'white'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Aprobación de Documentos
                        </h1>
                        <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                            Validación y control de calidad de documentos
                        </p>
                    </div>

                    {pendingDocs.length > 0 && (
                        <div style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '10px',
                            border: '2px solid rgba(239, 68, 68, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🔔</span>
                            <div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Pendientes</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{pendingDocs.length}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Documents List - Grouped by Employee */}
            {groupedEmployees.length === 0 ? (
                <div style={{
                    padding: '5rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                        ¡Todo al día!
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        No hay documentos pendientes de aprobación
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {groupedEmployees.map(({ employee, documents }) => (
                        <div
                            key={employee.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '2rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                                border: '2px solid #fbbf24',
                                transition: 'all 0.3s'
                            }}
                        >
                            {/* Employee Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #f1f5f9' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <User size={24} color="#667eea" />
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                                            {employee.name} {employee.apellido}
                                        </h3>
                                        <span style={{
                                            padding: '0.375rem 1rem',
                                            borderRadius: '999px',
                                            backgroundColor: '#eff6ff',
                                            color: '#1e40af',
                                            fontSize: '0.875rem',
                                            fontWeight: '700',
                                            border: '2px solid #93c5fd'
                                        }}>
                                            Cédula: {employee.id}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.95rem', color: '#64748b', marginLeft: '2rem', fontWeight: '500' }}>
                                        {documents.length} documento{documents.length > 1 ? 's' : ''} pendiente{documents.length > 1 ? 's' : ''} de aprobación
                                    </div>
                                </div>

                                {/* Approve All Button */}
                                <button
                                    onClick={(e) => handleApproveAll(e, employee.id, `${employee.name} ${employee.apellido}`, documents)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.875rem 1.75rem',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                                    }}
                                >
                                    <CheckCheck size={20} />
                                    Aprobar Todos ({documents.length})
                                </button>
                            </div>

                            {/* Documents Grid */}
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {documents.map((document) => (
                                    <div
                                        key={document.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1.25rem',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#eff6ff';
                                            e.currentTarget.style.borderColor = '#93c5fd';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f8fafc';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                                <FileText size={18} color="#667eea" />
                                                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{document.fileName}</span>
                                                <span style={{
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: '#fef3c7',
                                                    color: '#92400e',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700'
                                                }}>
                                                    PENDIENTE
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: '1.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <Calendar size={13} />
                                                    {new Date(document.uploadDate).toLocaleDateString('es-ES')}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <User size={13} />
                                                    {document.uploadedBy}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedDoc({ employee, document });
                                                setShowPreview(true);
                                            }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.625rem 1.125rem',
                                                borderRadius: '8px',
                                                backgroundColor: 'white',
                                                color: '#667eea',
                                                border: '2px solid #667eea',
                                                cursor: 'pointer',
                                                fontWeight: '600',
                                                fontSize: '0.85rem',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#667eea';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'white';
                                                e.currentTarget.style.color = '#667eea';
                                            }}
                                        >
                                            <Eye size={16} />
                                            Revisar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedDoc && showPreview && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => { setShowPreview(false); setComments(''); }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '1000px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderTopLeftRadius: '16px',
                            borderTopRightRadius: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ fontWeight: '700', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                                    Revisar Documento
                                </h3>
                                <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                    {selectedDoc.employee.name} {selectedDoc.employee.apellido} - {selectedDoc.document.fileName}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowPreview(false); setComments(''); }}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'white',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    display: 'flex'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
                            {/* Document Preview */}
                            <div style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                padding: '2rem',
                                textAlign: 'center',
                                marginBottom: '1.5rem',
                                minHeight: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {selectedDoc.document.type === 'pdf' ? (
                                    decryptedUrl ? (
                                        <iframe
                                            src={decryptedUrl}
                                            style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
                                            title="Document Preview"
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
                                            <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#ef4444' }} />
                                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem' }}>
                                                Descifrando documento...
                                            </h4>
                                            <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                                                El sistema está procesando el archivo cifrado de forma segura.
                                            </p>
                                        </div>
                                    )
                                ) : decryptedUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={decryptedUrl}
                                        alt={selectedDoc.document.fileName}
                                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                                    />
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                                        <FileText size={64} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                        <p>Descifrando documento...</p>
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#475569',
                                    marginBottom: '0.5rem'
                                }}>
                                    <MessageSquare size={16} />
                                    Comentarios (opcional para aprobar, requerido para rechazar)
                                </label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Ingresa comentarios sobre el documento..."
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '0.875rem',
                                        borderRadius: '10px',
                                        border: '2px solid #e2e8f0',
                                        fontSize: '0.875rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                                    onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    onClick={handleApprove}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem 2rem',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                                    }}
                                >
                                    <CheckCircle2 size={20} />
                                    Aprobar Documento
                                </button>

                                <button
                                    onClick={handleReject}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem 2rem',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                    }}
                                >
                                    <XCircle size={20} />
                                    Rechazar Documento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
