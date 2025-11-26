'use client';

import Link from 'next/link';
import { useDoc } from '@/context/DocContext';
import { Users, FileText, HardDrive, TrendingUp, Activity, Clock } from 'lucide-react';

function DashboardContent() {
    const { employees, loadDemoData, clearAllData } = useDoc();

    const totalDocs = employees.reduce((acc, emp) => acc + emp.documents.length, 0);
    const totalStorage = (totalDocs * 1.5).toFixed(1);

    const handleReset = () => {
        if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los empleados y documentos?\n\nEsta acción es permanente y no se puede deshacer.')) {
            clearAllData();
            alert('✅ Todos los datos han sido eliminados.');
        }
    };

    return (
        <div>
            {/* Modern Header with Gradient */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2.5rem 2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                color: 'white'
            }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Panel de Control
                </h1>
                <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                    Bienvenido al sistema de gestión documental
                </p>
            </div>

            {employees.length === 0 ? (
                <div style={{
                    background: 'white',
                    padding: '4rem 3rem',
                    borderRadius: '16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    border: '2px dashed #cbd5e1'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                    }}>
                        <Activity size={40} color="white" />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.75rem' }}>
                        Sistema Inactivo
                    </h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                        No hay actividad reciente. Comienza cargando empleados o prueba con datos de ejemplo.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                            href="/zero-paper/admin/upload"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: '0.875rem 2rem',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                transition: 'all 0.3s',
                                display: 'inline-block'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                            }}
                        >
                            Ir a Carga Masiva
                        </Link>
                        <button
                            onClick={() => { loadDemoData(); alert('Datos de prueba cargados.'); }}
                            style={{
                                backgroundColor: 'white',
                                color: '#667eea',
                                padding: '0.875rem 2rem',
                                borderRadius: '12px',
                                border: '2px solid #667eea',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f0f4ff';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Cargar Datos de Prueba
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Enhanced Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        <StatCard
                            title="Empleados Activos"
                            value={employees.length}
                            icon={<Users size={28} />}
                            trend="+12% este mes"
                            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            iconBg="rgba(102, 126, 234, 0.15)"
                            iconColor="#667eea"
                        />
                        <StatCard
                            title="Documentos Digitalizados"
                            value={totalDocs}
                            icon={<FileText size={28} />}
                            trend="+45 hoy"
                            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                            iconBg="rgba(16, 185, 129, 0.15)"
                            iconColor="#10b981"
                        />
                        <StatCard
                            title="Almacenamiento Usado"
                            value={`${totalStorage} MB`}
                            icon={<HardDrive size={28} />}
                            trend="15% del total"
                            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            iconBg="rgba(245, 158, 11, 0.15)"
                            iconColor="#f59e0b"
                        />
                    </div>

                    {/* Activity Section */}
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Clock size={22} color="white" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                                Actividad Reciente
                            </h2>
                        </div>

                        <div style={{
                            padding: '1.5rem',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <p style={{ fontSize: '1rem', color: '#475569', fontWeight: '500' }}>
                                Sistema activo con <strong style={{ color: '#667eea' }}>{employees.length}</strong> empleados y <strong style={{ color: '#10b981' }}>{totalDocs}</strong> documentos.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    trend,
    gradient,
    iconBg,
    iconColor
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend: string;
    gradient: string;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <div
            style={{
                backgroundColor: 'white',
                padding: '1.75rem',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
            }}
        >
            {/* Gradient accent bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: gradient
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {title}
                    </p>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                        {value}
                    </h3>
                </div>
                <div style={{
                    padding: '0.875rem',
                    backgroundColor: iconBg,
                    borderRadius: '12px',
                    color: iconColor
                }}>
                    {icon}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={14} color="#10b981" />
                <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>
                    {trend}
                </p>
            </div>
        </div>
    );
}

export default function ZeroPaperPage() {
    return <DashboardContent />;
}
