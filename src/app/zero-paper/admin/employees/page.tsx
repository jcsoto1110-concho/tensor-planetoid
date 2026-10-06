'use client';

import { useState, useRef } from 'react';
import { useDoc } from '@/context/DocContext';
import Link from 'next/link';
import { Search, FileText, User as UserIcon, ChevronRight, Briefcase, Calendar, Trash2, X, Upload, UserPlus, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function EmployeesListPage() {
    const { employees } = useDoc();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 24;

    const filteredEmployees = employees.filter(emp => {
        // Filtro de Estado: Activo / Inactivo
        const isInactive = emp.estado === '0' || emp.estado === 'I' || emp.estado === 'INACTIVO';
        if (statusFilter === 'ACTIVE' && isInactive) return false;
        if (statusFilter === 'INACTIVE' && !isInactive) return false;

        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;

        return (
            (emp.name && emp.name.toLowerCase().includes(search)) ||
            (emp.apellido && emp.apellido.toLowerCase().includes(search)) ||
            (emp.id && emp.id.includes(search)) ||
            (emp.position && emp.position.toLowerCase().includes(search)) ||
            (emp.entryDate && emp.entryDate.toLowerCase().includes(search)) ||
            (emp.codigo_sap && emp.codigo_sap.includes(search)) ||
            (emp.departamento && emp.departamento.toLowerCase().includes(search)) ||
            (emp.ciudad && emp.ciudad.toLowerCase().includes(search))
        );
    });

    const activeCount = employees.filter(e => e.estado !== '0' && e.estado !== 'I' && e.estado !== 'INACTIVO').length;
    const inactiveCount = employees.filter(e => e.estado === '0' || e.estado === 'I' || e.estado === 'INACTIVO').length;

    // Reset page on filter or search change
    const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
    const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Format date helper
    const formatDate = (dateStr: string) => {
        try {
            if (!isNaN(Number(dateStr))) {
                const excelEpoch = new Date(1899, 11, 30);
                const date = new Date(excelEpoch.getTime() + Number(dateStr) * 24 * 60 * 60 * 1000);
                return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
            }
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div>
            {/* Header Section */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                            Directorio de Empleados
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                            {filteredEmployees.length} registros encontrados ({activeCount} activos · {inactiveCount} inactivos)
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Selector de Estado */}
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                            <button
                                onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: statusFilter === 'ACTIVE' ? 'white' : 'transparent',
                                    color: statusFilter === 'ACTIVE' ? '#166534' : 'rgba(255,255,255,0.85)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                🟢 Activos ({activeCount})
                            </button>
                            <button
                                onClick={() => { setStatusFilter('INACTIVE'); setCurrentPage(1); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: statusFilter === 'INACTIVE' ? 'white' : 'transparent',
                                    color: statusFilter === 'INACTIVE' ? '#991b1b' : 'rgba(255,255,255,0.85)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                🔴 Inactivos ({inactiveCount})
                            </button>
                            <button
                                onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: statusFilter === 'ALL' ? 'white' : 'transparent',
                                    color: statusFilter === 'ALL' ? '#0f172a' : 'rgba(255,255,255,0.85)',
                                    transition: 'all 0.15s'
                                }}
                            >
                                👥 Todos ({employees.length})
                            </button>
                        </div>

                        {/* Buscador */}
                        <div style={{ position: 'relative' }}>
                            <Search size={20} color="rgba(255,255,255,0.9)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    borderRadius: '10px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    width: '280px',
                                    outline: 'none',
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    color: '#0f172a',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Controls Top */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                        Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredEmployees.length} registros)
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: currentPage === 1 ? '#f1f5f9' : 'white',
                                color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                fontSize: '12.5px'
                            }}
                        >
                            ← Anterior
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', padding: '0 8px' }}>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: currentPage === totalPages ? '#f1f5f9' : 'white',
                                color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                fontSize: '12.5px'
                            }}
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}

            {/* Employee Grid */}
            {filteredEmployees.length === 0 ? (
                <div style={{
                    padding: '5rem',
                    textAlign: 'center',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <UserIcon size={64} color="#94a3b8" style={{ margin: '0 auto 1.5rem auto', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                        No se encontraron empleados
                    </h3>
                    <p style={{ color: '#94a3b8' }}>Intenta ajustar tu búsqueda o el filtro de estado.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {paginatedEmployees.map((emp, index) => {
                        const isInactive = emp.estado === '0' || emp.estado === 'I' || emp.estado === 'INACTIVO';

                        return (
                            <Link
                                href={`/zero-paper/admin/employees/${emp.id}`}
                                key={`${emp.id}-${index}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                                    border: isInactive ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    opacity: isInactive ? 0.88 : 1
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-8px)';
                                        e.currentTarget.style.boxShadow = isInactive ? '0 20px 40px rgba(239, 68, 68, 0.15)' : '0 20px 40px rgba(102, 126, 234, 0.2)';
                                        e.currentTarget.style.borderColor = isInactive ? '#ef4444' : '#667eea';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
                                        e.currentTarget.style.borderColor = isInactive ? '#fca5a5' : '#e2e8f0';
                                    }}
                                >
                                    {/* Card Header with Gradient */}
                                    <div style={{
                                        background: isInactive 
                                            ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)' 
                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        padding: '1.5rem',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <div style={{
                                                width: '70px',
                                                height: '70px',
                                                background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                                                border: '3px solid rgba(255,255,255,0.3)'
                                            }}>
                                                <UserIcon size={36} color={isInactive ? '#64748b' : '#667eea'} />
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                                {isInactive ? (
                                                    <span style={{
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '999px',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#991b1b',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '800',
                                                        border: '1.5px solid #fca5a5',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }}>
                                                        🔴 INACTIVO
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '999px',
                                                        backgroundColor: '#dcfce7',
                                                        color: '#166534',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '800',
                                                        border: '1.5px solid #86efac'
                                                    }}>
                                                        🟢 ACTIVO
                                                    </span>
                                                )}

                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    padding: '0.3rem 0.75rem',
                                                    borderRadius: '999px',
                                                    backgroundColor: emp.documents.length > 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    border: `1px solid ${emp.documents.length > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.3)'}`
                                                }}>
                                                    <FileText size={12} />
                                                    {emp.documents.length} Doc{emp.documents.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            color: '#0f172a',
                                            marginBottom: '0.25rem',
                                            lineHeight: 1.3
                                        }}>
                                            {emp.name} {emp.apellido}
                                        </h3>
                                        <p style={{
                                            fontSize: '0.825rem',
                                            color: '#94a3b8',
                                            marginBottom: '1.25rem',
                                            fontFamily: 'monospace'
                                        }}>
                                            ID: {emp.id} {emp.codigo_sap && `| SAP: ${emp.codigo_sap}`}
                                        </p>

                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                            marginTop: 'auto'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                backgroundColor: '#f8fafc',
                                                borderRadius: '10px'
                                            }}>
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    backgroundColor: '#eff6ff',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <Briefcase size={18} color="#3b82f6" />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.1rem' }}>
                                                        Cargo
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.875rem',
                                                        color: '#475569',
                                                        fontWeight: '600'
                                                    }}>{emp.position}</span>
                                                </div>
                                            </div>

                                            {(emp.departamento || emp.ciudad) && (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem',
                                                    backgroundColor: '#f8fafc',
                                                    borderRadius: '10px'
                                                }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        backgroundColor: '#f0fdf4',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0
                                                    }}>
                                                        <UserIcon size={18} color="#16a34a" />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.1rem' }}>
                                                            Ubicación
                                                        </div>
                                                        <span style={{
                                                            fontSize: '0.875rem',
                                                            color: '#475569',
                                                            fontWeight: '500'
                                                        }}>
                                                            {[emp.departamento, emp.ciudad].filter(Boolean).join(' - ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        padding: '1rem',
                                        borderTop: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <span style={{
                                            color: isInactive ? '#64748b' : '#667eea',
                                            fontWeight: '700',
                                            fontSize: '0.875rem'
                                        }}>Ver Ficha Digital</span>
                                        <ChevronRight size={16} color={isInactive ? '#64748b' : '#667eea'} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Pagination Controls Bottom */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2.5rem', gap: '12px' }}>
                    <button
                        onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === 1}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            background: currentPage === 1 ? '#f1f5f9' : 'white',
                            color: currentPage === 1 ? '#94a3b8' : '#1e293b',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            fontSize: '13px'
                        }}
                    >
                        ← Anterior
                    </button>
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#475569', padding: '0 8px' }}>
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === totalPages}
                        style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            background: currentPage === totalPages ? '#f1f5f9' : 'white',
                            color: currentPage === totalPages ? '#94a3b8' : '#1e293b',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            fontSize: '13px'
                        }}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}
