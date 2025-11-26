'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useData } from '@/context/DataContext';
import { FileText, Upload, Send, Calendar } from 'lucide-react';

export default function AgencyDashboard() {
    const { requests, updateRequest } = useData();
    const [selectedReq, setSelectedReq] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const pendingRequests = requests.filter(r => r.status === 'pending_agency');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = (id: string) => {
        if (!file) return alert('Por favor adjunte la cotización en PDF');

        const fakeUrl = URL.createObjectURL(file);

        updateRequest(id, {
            status: 'pending_finance',
            quotationUrl: fakeUrl,
            agencyComments: 'Cotización adjunta vía portal.'
        });

        setSelectedReq(null);
        setFile(null);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Portal de Agencia</h1>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {pendingRequests.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--muted)' }}>No hay solicitudes pendientes de cotización.</p>
                        </div>
                    ) : (
                        pendingRequests.map(req => (
                            <div key={req.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '3rem', height: '3rem',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--surface-hover)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--primary)'
                                        }}>
                                            <FileText size={20} />
                                        </div>

                                        <div>
                                            <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Solicitud #{req.id}</h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>
                                                {req.employeeName} - <strong>{req.destination}</strong>
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} />
                                                    {req.startDate} - {req.endDate}
                                                </span>
                                                {req.needsHotel && <span>• Hotel Requerido</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedReq === req.id ? (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '1rem',
                                        backgroundColor: 'var(--surface-hover)',
                                        borderRadius: 'var(--radius)',
                                        border: '1px dashed var(--border)'
                                    }}>
                                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Adjuntar Cotización (PDF)</h4>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileChange}
                                                style={{ fontSize: '0.875rem' }}
                                            />
                                            <div style={{ flex: 1 }}></div>
                                            <button
                                                onClick={() => setSelectedReq(null)}
                                                className="btn btn-outline"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleSubmit(req.id)}
                                                className="btn btn-primary"
                                                disabled={!file}
                                            >
                                                <Send size={16} style={{ marginRight: '0.5rem' }} />
                                                Enviar Cotización
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => setSelectedReq(req.id)}
                                            className="btn btn-primary"
                                        >
                                            <Upload size={18} style={{ marginRight: '0.5rem' }} />
                                            Subir Cotización
                                        </button>
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
