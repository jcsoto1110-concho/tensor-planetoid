'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { FileText, Check, DollarSign, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function FinanceDashboard() {
    const { requests, updateRequest } = useData();
    const { users } = useAuth();
    const [selectedReq, setSelectedReq] = useState<string | null>(null);

    // Review requests that are pending finance review (uploaded by employee)
    const pendingReviewRequests = requests.filter(r => r.status === 'pending_finance_review');
    const approvedRequests = requests.filter(r => r.status === 'approved');

    const handleApprove = (id: string) => {
        updateRequest(id, {
            status: 'approved'
        });
        setSelectedReq(null);
    };

    const exportToExcel = () => {
        if (approvedRequests.length === 0) return alert('No hay registros aprobados para exportar');

        const dataToExport = approvedRequests.map(r => {
            const employee = users.find(u => u.id === r.employeeId);
            return {
                'ID Solicitud': r.id,
                'Empleado': r.employeeName,
                'Centro de Costos': employee?.costCenter || 'N/A',
                'Destino': r.destination,
                'Fecha Inicio': r.startDate,
                'Fecha Fin': r.endDate,
                'Proveedor': r.invoiceProvider,
                'Factura #': r.invoiceNumber,
                'Monto': r.invoiceAmount,
                'Estado': 'Aprobado para Pago'
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contabilidad");
        XLSX.writeFile(wb, "Reporte_Gastos_Viajes.xlsx");
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Portal de Finanzas</h1>
                    <button onClick={exportToExcel} className="btn btn-outline" disabled={approvedRequests.length === 0}>
                        <FileSpreadsheet size={18} style={{ marginRight: '0.5rem' }} />
                        Exportar a Excel
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr' }}>
                    {/* Review Section */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--foreground)' }}>Revisiones Pendientes (Legalización)</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {pendingReviewRequests.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                    <p style={{ color: 'var(--muted)' }}>No hay legalizaciones pendientes de revisión.</p>
                                </div>
                            ) : (
                                pendingReviewRequests.map(req => (
                                    <div key={req.id} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '3rem', height: '3rem',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--surface-hover)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'var(--warning)'
                                                }}>
                                                    <DollarSign size={20} />
                                                </div>

                                                <div>
                                                    <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Solicitud #{req.id}</h3>
                                                    <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                                                        {req.employeeName} - <strong>{req.destination}</strong>
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                                        <span>Factura: <strong>{req.invoiceNumber}</strong></span>
                                                        <span>Monto: <strong>${req.invoiceAmount}</strong></span>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedReq !== req.id && (
                                                <button onClick={() => setSelectedReq(req.id)} className="btn btn-primary">
                                                    Revisar
                                                </button>
                                            )}
                                        </div>

                                        {selectedReq === req.id && (
                                            <div style={{
                                                marginTop: '1.5rem',
                                                padding: '1.5rem',
                                                backgroundColor: 'var(--surface-hover)',
                                                borderRadius: 'var(--radius)',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                                                    <AlertCircle size={18} />
                                                    <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>Verificar Datos Extraídos por IA</h4>
                                                </div>

                                                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)' }}>Proveedor</label>
                                                        <div className="input" style={{ backgroundColor: 'var(--background)' }}>{req.invoiceProvider}</div>
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)' }}>Número Factura</label>
                                                        <div className="input" style={{ backgroundColor: 'var(--background)' }}>{req.invoiceNumber}</div>
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: 'var(--muted)' }}>Monto Total</label>
                                                        <div className="input" style={{ backgroundColor: 'var(--background)', fontWeight: 'bold' }}>${req.invoiceAmount}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setSelectedReq(null)} className="btn btn-outline">
                                                        Cancelar
                                                    </button>
                                                    <button onClick={() => handleApprove(req.id)} className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }}>
                                                        <Check size={16} style={{ marginRight: '0.5rem' }} />
                                                        Confirmar y Aprobar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Approved History */}
                    <section>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--foreground)' }}>Historial Aprobado</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {approvedRequests.map(req => (
                                <div key={req.id} className="card" style={{ opacity: 0.8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontWeight: '600', fontSize: '0.875rem' }}>{req.destination}</h3>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{req.employeeName}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 'bold', color: 'var(--success)' }}>${req.invoiceAmount?.toFixed(2)}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{req.invoiceNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
