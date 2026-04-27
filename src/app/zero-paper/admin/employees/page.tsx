'use client';

import { useState, useRef } from 'react';
import { useDoc } from '@/context/DocContext';
import Link from 'next/link';
import { Search, FileText, User as UserIcon, ChevronRight, Briefcase, Calendar, Trash2, X, Upload, UserPlus, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function EmployeesListPage() {
    const { employees } = useDoc();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(emp => {
        const search = searchTerm.toLowerCase();
        return (
            emp.name.toLowerCase().includes(search) ||
            emp.id.includes(searchTerm) ||
            emp.position.toLowerCase().includes(search) ||
            emp.entryDate.toLowerCase().includes(search)
        );
    });



    // Format date helper
    const formatDate = (dateStr: string) => {
        try {
            // Check if it's a raw number (Excel serial date)
            if (!isNaN(Number(dateStr))) {
                // Convert Excel serial to date
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
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                            Directorio de Empleados
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>
                            {filteredEmployees.length} de {employees.length} empleados
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                            onClick={async () => {
                                const btn = document.activeElement as HTMLButtonElement;
                                if (btn) btn.disabled = true;
                                try {
                                    const { syncEmployees } = useDoc(); // Need to call this inside the component
                                } catch(e) {}
                                window.location.href = '/zero-paper/admin/upload'; // Redirect to sync page for now
                            }}
                            style={{
                                padding: '0.75rem 1.25rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'white',
                                color: '#667eea',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Sparkles size={18} />
                            Sincronizar RRHH (Oracle)
                        </button>

                        <div style={{ position: 'relative' }}>
                            <Search size={20} color="rgba(255,255,255,0.9)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{
                                    padding: '0.75rem 1rem 0.75rem 3rem',
                                    borderRadius: '10px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    width: '300px',
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
                    <p style={{ color: '#94a3b8' }}>Intenta ajustar tu búsqueda o realiza una nueva carga masiva.</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredEmployees.map((emp, index) => (
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
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-8px)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.2)';
                                    e.currentTarget.style.borderColor = '#667eea';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                {/* Card Header with Gradient */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                                            <UserIcon size={36} color="#667eea" />
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.9rem',
                                            borderRadius: '999px',
                                            backgroundColor: emp.documents.length > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            fontWeight: '700',
                                            border: `2px solid ${emp.documents.length > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255,255,255,0.3)'}`
                                        }}>
                                            <FileText size={14} />
                                            {emp.documents.length} Doc{emp.documents.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: '#0f172a',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {emp.name} {emp.apellido}
                                    </h3>
                                    <p style={{
                                        fontSize: '0.875rem',
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
                                                    fontWeight: '500'
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
                                        color: '#667eea',
                                        fontWeight: '600',
                                        fontSize: '0.875rem'
                                    }}>Ver Ficha Digital</span>
                                    <ChevronRight size={16} color="#667eea" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
