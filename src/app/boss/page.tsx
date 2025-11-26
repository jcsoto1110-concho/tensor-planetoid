'use client';

import Navbar from '@/components/Navbar';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Check, X, Calendar, User } from 'lucide-react';

export default function BossDashboard() {
    const { user } = useAuth();
    const { requests, updateRequest } = useData();

    // Filter requests pending approval for this boss
    const pendingRequests = requests.filter(r => r.status === 'pending_boss');

    const handleApprove = (id: string) => {
        updateRequest(id, { status: 'pending_agency' });
    };

    const handleReject = (id: string) => {
        updateRequest(id, { status: 'rejected_boss' });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Navbar />

            <main className="container" style={{ padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Aprobaciones Pendientes</h1>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {pendingRequests.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ color: 'var(--muted)' }}>No hay aprobaciones pendientes.</p>
                        </div>
                    ) : (
                        pendingRequests.map(req => (
                            <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '3rem', height: '3rem',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--surface-hover)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'var(--primary)'
                                    }}>
                                        <User size={20} />
                                    </div>

                                    <div>
                                        <h3 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{req.employeeName}</h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
                                            Viaje a <strong>{req.destination}</strong>
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} />
                                                {req.startDate} - {req.endDate}
                                            </span>
                                            {req.needsHotel && <span>• Hotel Requerido</span>}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleReject(req.id)}
                                        className="btn btn-outline"
                                        style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                                        title="Rechazar"
                                    >
                                        <X size={18} style={{ marginRight: '0.5rem' }} />
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleApprove(req.id)}
                                        className="btn btn-primary"
                                        style={{ backgroundColor: 'var(--success)' }}
                                        title="Aprobar"
                                    >
                                        <Check size={18} style={{ marginRight: '0.5rem' }} />
                                        Aprobar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
