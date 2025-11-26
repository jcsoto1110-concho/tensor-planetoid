'use client';

import Navbar from '@/components/Navbar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Clock, CheckCircle, XCircle, FileText, Upload, Sparkles } from 'lucide-react';
import { useState } from 'react';

export default function EmployeeDashboard() {
    const { requests, updateRequest } = useData();
    const { user } = useAuth();
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    if (!user) return null;

    const myRequests = requests.filter(r => r.employeeId === user.id);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_boss': return <span className="badge badge-warning">Pendiente Jefe</span>;
            case 'pending_agency': return <span className="badge badge-warning">Pendiente Agencia</span>;
            case 'pending_finance': return <span className="badge badge-neutral">Pendiente Legalización</span>;
            case 'pending_finance_review': return <span className="badge badge-warning">Revisión Finanzas</span>;
            case 'approved': return <span className="badge badge-success">Aprobado</span>;
            case 'rejected_boss': return <span className="badge badge-error">Rechazado</span>;
            default: return <span className="badge badge-neutral">{status}</span>;
        }
    };

    const handleLegalize = (id: string) => {
        setUploadingId(id);
        // Simulate AI Extraction delay
        setTimeout(() => {
            const mockInvoiceData = {
                invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
                invoiceAmount: parseFloat((Math.random() * 500 + 100).toFixed(2)),
                invoiceProvider: 'Hotel & Flights Inc.',
                status: 'pending_finance_review' as const
            };

            updateRequest(id, mockInvoiceData);
            setUploadingId(null);
            alert(`¡Factura procesada con IA!\nProveedor: ${mockInvoiceData.invoiceProvider}\nMonto: $${mockInvoiceData.invoiceAmount}\nEstado: Enviado a Finanzas`);
        }, 2000);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Mis Solicitudes de Viaje</h1>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {myRequests.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--muted)' }}>No tienes solicitudes activas.</p>
                        </div>
                    ) : (
                        myRequests.map(req => (
                            <div key={req.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>{req.destination}</h3>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={14} /> {req.startDate} - {req.endDate}
                                        </p>
                                        {req.hotelCity && (
                                            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                Hotel en: {req.hotelCity}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        {req.status === 'pending_finance' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleLegalize(req.id)}
                                                disabled={uploadingId === req.id}
                                                style={{ backgroundColor: 'var(--secondary)' }}
                                            >
                                                {uploadingId === req.id ? (
                                                    <>Procesando IA...</>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} style={{ marginRight: '0.5rem' }} />
                                                        Legalizar Gastos (Subir Factura)
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {req.quotationUrl && (
                                            <a
                                                href={req.quotationUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: '0.875rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                            >
                                                <FileText size={14} /> Ver Cotización
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Invoice Details View for Employee */}
                                {(req.status === 'pending_finance_review' || req.status === 'approved') && req.invoiceNumber && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>
                                        <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Datos de Facturación (Extraídos por IA):</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--muted)' }}>Proveedor:</span>
                                                <div style={{ fontWeight: '500' }}>{req.invoiceProvider}</div>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--muted)' }}>Factura #:</span>
                                                <div style={{ fontWeight: '500' }}>{req.invoiceNumber}</div>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--muted)' }}>Monto:</span>
                                                <div style={{ fontWeight: '500' }}>${req.invoiceAmount}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
