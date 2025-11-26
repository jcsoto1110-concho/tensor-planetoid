'use client';

import { useDoc } from '@/context/DocContext';
import { useState } from 'react';
import { ClipboardList, Filter, Calendar, User, Activity, FileText, TrendingUp } from 'lucide-react';

export default function AuditLogPage() {
    const { auditLogs } = useDoc();
    const [filterAction, setFilterAction] = useState<string>('ALL');

    const filteredLogs = filterAction === 'ALL'
        ? auditLogs
        : auditLogs.filter(log => log.action === filterAction);

    const getActionBadge = (action: string) => {
        const styles: Record<string, { bg: string, color: string, label: string, gradient: string }> = {
            'CREATE': { bg: '#dcfce7', color: '#166534', label: 'Crear', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
            'UPDATE': { bg: '#dbeafe', color: '#1e40af', label: 'Actualizar', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
            'DELETE': { bg: '#fee2e2', color: '#991b1b', label: 'Eliminar', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
            'IMPORT': { bg: '#e0e7ff', color: '#3730a3', label: 'Importar', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            'MASS_DELETE': { bg: '#fef2f2', color: '#7c2d12', label: 'Eliminación Masiva', gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' },
            'ADD_DOCUMENT': { bg: '#fef3c7', color: '#78350f', label: 'Agregar Documento', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
            'RESET': { bg: '#fce7f3', color: '#831843', label: 'Resetear Sistema', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }
        };

        const style = styles[action] || { bg: '#f1f5f9', color: '#475569', label: action, gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)' };

        return (
            <span style={{
                display: 'inline-flex',
                padding: '0.4rem 0.875rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: '700',
                backgroundColor: style.bg,
                color: style.color,
                border: `1.5px solid ${style.color}20`,
                textTransform: 'uppercase',
                letterSpacing: '0.3px'
            }}>
                {style.label}
            </span>
        );
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Bitácora del Sistema
                        </h1>
                        <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                            Registro completo de todas las operaciones realizadas
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Filter size={18} color="white" />
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                style={{
                                    backgroundColor: 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    paddingRight: '0.5rem'
                                }}
                            >
                                <option value="ALL" style={{ color: '#0f172a' }}>Todas las acciones</option>
                                <option value="CREATE" style={{ color: '#0f172a' }}>Crear</option>
                                <option value="IMPORT" style={{ color: '#0f172a' }}>Importar</option>
                                <option value="ADD_DOCUMENT" style={{ color: '#0f172a' }}>Agregar Documento</option>
                                <option value="MASS_DELETE" style={{ color: '#0f172a' }}>Eliminación Masiva</option>
                                <option value="DELETE" style={{ color: '#0f172a' }}>Eliminar</option>
                                <option value="RESET" style={{ color: '#0f172a' }}>Resetear</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '1.75rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Total de Operaciones
                            </p>
                            <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                                {auditLogs.length}
                            </h3>
                        </div>
                        <div style={{
                            padding: '0.875rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            borderRadius: '12px',
                            color: '#3b82f6'
                        }}>
                            <Activity size={28} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={14} color="#10b981" />
                        <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>
                            Sistema activo
                        </p>
                    </div>
                </div>

                <div style={{
                    backgroundColor: 'white',
                    padding: '1.75rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Resultados Filtrados
                            </p>
                            <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#0f172a' }}>
                                {filteredLogs.length}
                            </h3>
                        </div>
                        <div style={{
                            padding: '0.875rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderRadius: '12px',
                            color: '#10b981'
                        }}>
                            <ClipboardList size={28} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Filter size={14} color="#667eea" />
                        <p style={{ fontSize: '0.8rem', color: '#667eea', fontWeight: '600' }}>
                            {filterAction === 'ALL' ? 'Sin filtros' : `Filtrado por: ${filterAction}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Audit Log Table */}
            {filteredLogs.length === 0 ? (
                <div style={{
                    padding: '5rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <ClipboardList size={64} color="#94a3b8" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                        No hay registros
                    </h3>
                    <p style={{ color: '#94a3b8' }}>No se encontraron operaciones en el filtro seleccionado.</p>
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{
                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                    borderBottom: '2px solid #e2e8f0'
                                }}>
                                    <th style={{
                                        padding: '1.25rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: '#475569',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Fecha y Hora
                                    </th>
                                    <th style={{
                                        padding: '1.25rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: '#475569',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Usuario
                                    </th>
                                    <th style={{
                                        padding: '1.25rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: '#475569',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Acción
                                    </th>
                                    <th style={{
                                        padding: '1.25rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: '#475569',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Entidad
                                    </th>
                                    <th style={{
                                        padding: '1.25rem 1rem',
                                        textAlign: 'left',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: '#475569',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Detalles
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.map((log, index) => (
                                    <tr
                                        key={log.id}
                                        style={{
                                            borderBottom: '1px solid #f1f5f9',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', color: '#475569' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={16} color="#94a3b8" />
                                                <span style={{ fontWeight: '500' }}>{formatTimestamp(log.timestamp)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', color: '#475569' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <User size={16} color="#94a3b8" />
                                                <span style={{ fontWeight: '500' }}>{log.user}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', color: '#475569', fontWeight: '600' }}>
                                            {log.entity}
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
