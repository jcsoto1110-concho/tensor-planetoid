'use client';

import { useState, useRef, useEffect } from 'react';
import { useDoc } from '@/context/DocContext';
import Link from 'next/link';
import QRCode from 'qrcode';
import { 
    Search, FileText, User as UserIcon, ChevronRight, Briefcase, Calendar, 
    Trash2, X, Upload, UserPlus, Sparkles, Gift, CheckCircle, AlertCircle, 
    RefreshCw, QrCode, Mail, Edit3, DollarSign, Check, Eye, Download, ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function EmployeesListPage() {
    const { employees } = useDoc();
    const [mainTab, setMainTab] = useState<'directory' | 'benefits90'>('directory');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 24;

    // === ESTADOS BENEFICIO 90 DÍAS ===
    const [benefits, setBenefits] = useState<any[]>([]);
    const [benefitsLoading, setBenefitsLoading] = useState(false);
    const [benefitsFilter, setBenefitsFilter] = useState<'ALL' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE');
    const [benefitsSearch, setBenefitsSearch] = useState('');
    const [benefitsStats, setBenefitsStats] = useState({ total: 0, pendientes: 0, aprobados: 0, rechazados: 0, montoTotalAprobado: 0 });
    const [selectedBenefitIds, setSelectedBenefitIds] = useState<Set<string>>(new Set());
    const [editingCupoId, setEditingCupoId] = useState<string | null>(null);
    const [editingCupoValue, setEditingCupoValue] = useState<string>('');
    const [savingCupoId, setSavingCupoId] = useState<string | null>(null);
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
    const [rejectObs, setRejectObs] = useState('');
    const [qrModal, setQrModal] = useState<{ item: any; qrDataUrl: string } | null>(null);
    const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);

    const fetchBenefits = async () => {
        setBenefitsLoading(true);
        try {
            const res = await fetch(`/api/benefits-90-days?status=${benefitsFilter}&search=${encodeURIComponent(benefitsSearch)}`);
            const data = await res.json();
            if (data.success) {
                setBenefits(data.data || []);
                if (data.stats) setBenefitsStats(data.stats);
            }
        } catch (e) {
            console.error('Error fetching 90-day benefits:', e);
        } finally {
            setBenefitsLoading(false);
        }
    };

    useEffect(() => {
        if (mainTab === 'benefits90') {
            fetchBenefits();
        }
    }, [mainTab, benefitsFilter]);

    // Aprobar individual
    const handleApproveBenefit = async (id: string) => {
        setApprovingIds(prev => new Set(prev).add(id));
        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', ids: [id], aprobado_por: 'Talento Humano' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Colaborador aprobado exitosamente. Se ha emitido su código QR y enviado la notificación a su correo.`);
                await fetchBenefits();
            } else {
                alert('❌ Error al aprobar: ' + (data.error || 'Desconocido'));
            }
        } catch (e: any) {
            alert('❌ Error: ' + e.message);
        } finally {
            setApprovingIds(prev => {
                const n = new Set(prev);
                n.delete(id);
                return n;
            });
        }
    };

    // Aprobar lote
    const handleBatchApprove = async () => {
        if (selectedBenefitIds.size === 0) return;
        if (!confirm(`¿Estás seguro de aprobar y enviar notificación con QR a los ${selectedBenefitIds.size} colaboradores seleccionados?`)) return;

        const idsArray = Array.from(selectedBenefitIds);
        idsArray.forEach(id => setApprovingIds(prev => new Set(prev).add(id)));

        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'approve', ids: idsArray, aprobado_por: 'Talento Humano' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Se aprobaron ${data.count} colaboradores exitosamente y se enviaron sus correos con QR.`);
                setSelectedBenefitIds(new Set());
                await fetchBenefits();
            } else {
                alert('❌ Error al aprobar en lote: ' + (data.error || 'Desconocido'));
            }
        } catch (e: any) {
            alert('❌ Error: ' + e.message);
        } finally {
            setApprovingIds(new Set());
        }
    };

    // Guardar cupo modificado
    const handleSaveCupo = async (id: string) => {
        setSavingCupoId(id);
        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, cupo_aprobado: editingCupoValue })
            });
            const data = await res.json();
            if (data.success) {
                setBenefits(prev => prev.map(b => b.id === id ? { ...b, cupo_aprobado: Number(editingCupoValue) } : b));
                setEditingCupoId(null);
            } else {
                alert('❌ Error al actualizar cupo: ' + data.error);
            }
        } catch (e: any) {
            alert('❌ Error: ' + e.message);
        } finally {
            setSavingCupoId(null);
        }
    };

    // Rechazar
    const handleRejectBenefit = async () => {
        if (!rejectModal) return;
        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reject', id: rejectModal.id, observaciones: rejectObs })
            });
            const data = await res.json();
            if (data.success) {
                alert('Registro marcado como rechazado.');
                setRejectModal(null);
                setRejectObs('');
                await fetchBenefits();
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (e: any) {
            alert('❌ Error: ' + e.message);
        }
    };

    // Previsualizar QR
    const handleOpenQrModal = async (item: any) => {
        try {
            const qrPayload = JSON.stringify({
                empresa: 'SUPERDEPORTE S.A. / MARATHON',
                beneficio: 'CUPO_DESCUENTO_90_DIAS',
                pernr: item.pernr,
                cedula: item.cedula,
                colaborador: item.nombre_completo,
                cupo_aprobado: item.cupo_aprobado,
                token: item.qr_token || `BEN90-${item.pernr}`,
                id_ws: item.discount_id_ws || null
            });
            const dataUrl = await QRCode.toDataURL(qrPayload, {
                width: 280,
                margin: 2,
                color: { dark: '#002f6c', light: '#ffffff' }
            });
            setQrModal({ item, qrDataUrl: dataUrl });
        } catch (e: any) {
            alert('Error generando QR: ' + e.message);
        }
    };

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
            {/* SELECTOR DE PESTAÑAS PRINCIPALES */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: '#f8fafc', padding: '6px', borderRadius: '14px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                <button
                    onClick={() => setMainTab('directory')}
                    style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: mainTab === 'directory' ? 'white' : 'transparent',
                        color: mainTab === 'directory' ? '#0f172a' : '#64748b',
                        boxShadow: mainTab === 'directory' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <UserIcon size={16} /> Directorio General ({employees.length})
                </button>
                <button
                    onClick={() => { setMainTab('benefits90'); fetchBenefits(); }}
                    style={{
                        padding: '10px 22px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: mainTab === 'benefits90' ? 'linear-gradient(135deg, #002f6c, #1e40af)' : 'transparent',
                        color: mainTab === 'benefits90' ? 'white' : '#64748b',
                        boxShadow: mainTab === 'benefits90' ? '0 4px 14px rgba(0, 47, 108, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Gift size={16} /> Beneficio 90 Días
                    {benefitsStats.pendientes > 0 && (
                        <span style={{
                            background: '#ef4444',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
                        }}>
                            {benefitsStats.pendientes}
                        </span>
                    )}
                </button>
            </div>

            {mainTab === 'directory' && (
                <>
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
                </>
            )}

            {/* PESTAÑA BENEFICIO 90 DÍAS */}
            {mainTab === 'benefits90' && (
                <div>
                    {/* Header Banner Beneficios 90 Días */}
                    <div style={{
                        background: 'linear-gradient(135deg, #002f6c 0%, #001838 100%)',
                        padding: '2rem',
                        borderRadius: '16px',
                        marginBottom: '2rem',
                        boxShadow: '0 10px 30px rgba(0, 47, 108, 0.2)',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                    <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.05em' }}>
                                        SUPERDEPORTE / MARATHON
                                    </span>
                                    <span style={{ background: '#10b981', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                                        ACTIVOS ≥ 90 DÍAS
                                    </span>
                                </div>
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'white' }}>
                                    🎁 Asignación de Cupos y Beneficio 90 Días
                                </h1>
                                <p style={{ color: '#93c5fd', fontSize: '0.95rem', margin: 0, maxWidth: '750px' }}>
                                    Monitorea a los colaboradores activos con 90 días o más desde su fecha de ingreso. Ajusta sus cupos de descuento, genera sus códigos QR y notifícalos automáticamente por correo.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setShowSyncInfoModal(true)}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <RefreshCw size={15} /> Sincronización SAP
                                </button>
                                <button
                                    onClick={handleBatchApprove}
                                    disabled={selectedBenefitIds.size === 0}
                                    style={{
                                        padding: '12px 24px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: selectedBenefitIds.size === 0 ? '#475569' : 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        cursor: selectedBenefitIds.size === 0 ? 'not-allowed' : 'pointer',
                                        fontWeight: 800,
                                        fontSize: '13.5px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: selectedBenefitIds.size > 0 ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <CheckCircle size={17} /> Aprobar Seleccionados ({selectedBenefitIds.size})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tarjetas de Métricas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                        <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Pendientes de Aprobación</span>
                                <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>PENDIENTE</span>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#b45309' }}>{benefitsStats.pendientes}</div>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Listos para emitir cupo y QR</span>
                        </div>

                        <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Aprobados con QR</span>
                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>ACTIVOS</span>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#15803d' }}>{benefitsStats.aprobados}</div>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Notificados vía correo electrónico</span>
                        </div>

                        <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Monto Aprobado Emitido</span>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>TOTAL</span>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0284c7' }}>
                                ${Number(benefitsStats.montoTotalAprobado).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Cupo total disponible para consumo</span>
                        </div>

                        <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Total Registrados</span>
                                <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>BASE</span>
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{benefitsStats.total}</div>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{benefitsStats.rechazados} rechazados</span>
                        </div>
                    </div>

                    {/* Barra de Filtros y Búsqueda */}
                    <div style={{
                        background: 'white',
                        padding: '1.25rem',
                        borderRadius: '14px',
                        marginBottom: '1.5rem',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        {/* Selector de Estado */}
                        <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <button
                                onClick={() => setBenefitsFilter('PENDIENTE')}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: benefitsFilter === 'PENDIENTE' ? '#fef3c7' : 'transparent',
                                    color: benefitsFilter === 'PENDIENTE' ? '#b45309' : '#64748b'
                                }}
                            >
                                ⏳ Pendientes ({benefitsStats.pendientes})
                            </button>
                            <button
                                onClick={() => setBenefitsFilter('APROBADO')}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: benefitsFilter === 'APROBADO' ? '#dcfce7' : 'transparent',
                                    color: benefitsFilter === 'APROBADO' ? '#15803d' : '#64748b'
                                }}
                            >
                                ✅ Aprobados ({benefitsStats.aprobados})
                            </button>
                            <button
                                onClick={() => setBenefitsFilter('RECHAZADO')}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: benefitsFilter === 'RECHAZADO' ? '#fee2e2' : 'transparent',
                                    color: benefitsFilter === 'RECHAZADO' ? '#b91c1c' : '#64748b'
                                }}
                            >
                                ❌ Rechazados ({benefitsStats.rechazados})
                            </button>
                            <button
                                onClick={() => setBenefitsFilter('ALL')}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    background: benefitsFilter === 'ALL' ? '#f1f5f9' : 'transparent',
                                    color: benefitsFilter === 'ALL' ? '#0f172a' : '#64748b'
                                }}
                            >
                                📋 Todos ({benefitsStats.total})
                            </button>
                        </div>

                        {/* Buscador */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', minWidth: '280px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    value={benefitsSearch}
                                    onChange={e => setBenefitsSearch(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') fetchBenefits(); }}
                                    placeholder="Buscar por nombre, cédula, cargo..."
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px 9px 36px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '13px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <button
                                onClick={fetchBenefits}
                                style={{
                                    padding: '9px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 700,
                                    color: '#475569',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <RefreshCw size={14} className={benefitsLoading ? 'animate-spin' : ''} /> Buscar
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Beneficios 90 Días */}
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                                    <tr>
                                        <th style={{ padding: '14px 16px', width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                checked={benefits.length > 0 && selectedBenefitIds.size === benefits.length}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setSelectedBenefitIds(new Set(benefits.map(b => b.id)));
                                                    } else {
                                                        setSelectedBenefitIds(new Set());
                                                    }
                                                }}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </th>
                                        <th style={{ padding: '14px 16px' }}>Colaborador</th>
                                        <th style={{ padding: '14px 16px' }}>Puesto / Operación</th>
                                        <th style={{ padding: '14px 16px' }}>Antigüedad</th>
                                        <th style={{ padding: '14px 16px' }}>Nivel / Categoría</th>
                                        <th style={{ padding: '14px 16px' }}>Cupo de Descuento ($)</th>
                                        <th style={{ padding: '14px 16px' }}>Estado</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {benefitsLoading ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                                    <RefreshCw size={28} className="animate-spin" style={{ color: '#002f6c' }} />
                                                    <span style={{ fontWeight: 600 }}>Cargando registros de beneficios 90 días...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : benefits.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                                                <Gift size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                                <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#475569' }}>
                                                    No se encontraron colaboradores en esta vista
                                                </p>
                                                <p style={{ margin: '4px 0 16px', fontSize: '13px' }}>
                                                    Ejecuta la sincronización desde la red de la oficina con SAP HANA para actualizar a los colaboradores con 90 días.
                                                </p>
                                                <button
                                                    onClick={() => setShowSyncInfoModal(true)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        background: 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '12.5px',
                                                        fontWeight: 700,
                                                        color: '#002f6c'
                                                    }}
                                                >
                                                    ⚡ Ver Instrucciones de Sincronización SAP
                                                </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        benefits.map(b => {
                                            const isSelected = selectedBenefitIds.has(b.id);
                                            const isEditing = editingCupoId === b.id;
                                            const isApproving = approvingIds.has(b.id);

                                            return (
                                                <tr
                                                    key={b.id}
                                                    style={{
                                                        borderBottom: '1px solid #f1f5f9',
                                                        background: isSelected ? '#eff6ff' : 'white',
                                                        transition: 'background 0.15s'
                                                    }}
                                                >
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={e => {
                                                                const next = new Set(selectedBenefitIds);
                                                                if (e.target.checked) next.add(b.id);
                                                                else next.delete(b.id);
                                                                setSelectedBenefitIds(next);
                                                            }}
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '38px',
                                                                height: '38px',
                                                                borderRadius: '10px',
                                                                background: '#e0f2fe',
                                                                color: '#0369a1',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '14px'
                                                            }}>
                                                                {b.nombre_completo ? b.nombre_completo.charAt(0) : 'U'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 800, color: '#0f172a' }}>{b.nombre_completo}</div>
                                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                                    C.I.: <strong>{b.cedula}</strong> · SAP: <strong>{b.pernr}</strong>
                                                                </div>
                                                                {b.email && (
                                                                    <div style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <Mail size={11} /> {b.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.posicion || 'Colaborador'}</div>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                            {[b.operacion, b.ciudad].filter(Boolean).join(' · ')}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ fontSize: '12px', color: '#475569' }}>
                                                            Ingreso: {formatDate(b.fecha_ingreso_real || b.fecha_ingreso)}
                                                        </div>
                                                        <div style={{ marginTop: '3px' }}>
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                background: '#dcfce7',
                                                                color: '#15803d',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                padding: '2px 8px',
                                                                borderRadius: '6px'
                                                            }}>
                                                                ⚡ {b.dias_laborados} días cumplidos
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 16px' }}>
                                                        {(() => {
                                                            const t = b.tipo_operacion;
                                                            if (t === 'GERENCIA') {
                                                                return <span style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>🏢 Gerencia</span>;
                                                            } else if (t === 'JEFATURA_SUPERVISION') {
                                                                return <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>👔 Jefatura / Sup.</span>;
                                                            } else if (t === 'ADM_ASISTENCIAL') {
                                                                return <span style={{ background: '#ecfdf5', color: '#047857', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>📑 Adm / Mayoristas</span>;
                                                            } else {
                                                                return <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>🏪 Tienda / Bodega</span>;
                                                            }
                                                        })()}
                                                    </td>
                                                    <td style={{ padding: '14px 16px' }}>
                                                        {isEditing ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontWeight: 800, color: '#64748b' }}>$</span>
                                                                <input
                                                                    type="number"
                                                                    value={editingCupoValue}
                                                                    onChange={e => setEditingCupoValue(e.target.value)}
                                                                    style={{
                                                                        width: '90px',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '6px',
                                                                        border: '1.5px solid #2563eb',
                                                                        fontSize: '13px',
                                                                        fontWeight: 700,
                                                                        outline: 'none'
                                                                    }}
                                                                />
                                                                <button
                                                                    onClick={() => handleSaveCupo(b.id)}
                                                                    disabled={savingCupoId === b.id}
                                                                    style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                                                    title="Guardar Cupo"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingCupoId(null)}
                                                                    style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                                                    title="Cancelar"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
                                                                    ${Number(b.cupo_aprobado).toFixed(2)}
                                                                </span>
                                                                {b.estado === 'PENDIENTE' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingCupoId(b.id);
                                                                            setEditingCupoValue(String(b.cupo_aprobado));
                                                                        }}
                                                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                                                        title="Modificar Cupo"
                                                                    >
                                                                        <Edit3 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 16px' }}>
                                                        {b.estado === 'APROBADO' ? (
                                                            <div>
                                                                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                    <CheckCircle size={12} /> Aprobado
                                                                </span>
                                                                {b.email_sent && (
                                                                    <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                                                                        📧 Notificado con QR
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : b.estado === 'RECHAZADO' ? (
                                                            <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                                                                ❌ Rechazado
                                                            </span>
                                                        ) : (
                                                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                                                                ⏳ Pendiente
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            {b.estado === 'PENDIENTE' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApproveBenefit(b.id)}
                                                                        disabled={isApproving}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            borderRadius: '8px',
                                                                            border: 'none',
                                                                            background: 'linear-gradient(135deg, #10b981, #059669)',
                                                                            color: 'white',
                                                                            cursor: isApproving ? 'not-allowed' : 'pointer',
                                                                            fontSize: '12px',
                                                                            fontWeight: 800,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                                                        }}
                                                                    >
                                                                        <CheckCircle size={13} /> {isApproving ? 'Enviando...' : 'Aprobar y Enviar QR'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRejectModal({ id: b.id, name: b.nombre_completo })}
                                                                        style={{
                                                                            padding: '6px 10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #fecaca',
                                                                            background: '#fff5f5',
                                                                            color: '#dc2626',
                                                                            cursor: 'pointer',
                                                                            fontSize: '12px',
                                                                            fontWeight: 700
                                                                        }}
                                                                        title="Rechazar Beneficio"
                                                                    >
                                                                        Rechazar
                                                                    </button>
                                                                </>
                                                            )}

                                                            {b.estado === 'APROBADO' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleOpenQrModal(b)}
                                                                        style={{
                                                                            padding: '6px 12px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #bfdbfe',
                                                                            background: '#eff6ff',
                                                                            color: '#1d4ed8',
                                                                            cursor: 'pointer',
                                                                            fontSize: '12px',
                                                                            fontWeight: 700,
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}
                                                                    >
                                                                        <QrCode size={13} /> Ver QR
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApproveBenefit(b.id)}
                                                                        disabled={isApproving}
                                                                        style={{
                                                                            padding: '6px 10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #cbd5e1',
                                                                            background: 'white',
                                                                            color: '#475569',
                                                                            cursor: 'pointer',
                                                                            fontSize: '11px',
                                                                            fontWeight: 700
                                                                        }}
                                                                        title="Reenviar notificación por correo"
                                                                    >
                                                                        <Mail size={12} /> Reenviar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PREVISUALIZAR QR */}
            {qrModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '440px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                                📱 Código QR de Descuento
                            </h3>
                            <button onClick={() => setQrModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X /></button>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                            <img src={qrModal.qrDataUrl} alt="QR Code" style={{ width: '220px', height: '220px', margin: '0 auto', display: 'block', borderRadius: '10px' }} />
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#002f6c' }}>{qrModal.item.nombre_completo}</div>
                                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                                    Cédula: <strong>{qrModal.item.cedula}</strong> · Código: <strong>{qrModal.item.pernr}</strong>
                                </div>
                                <div style={{ marginTop: '8px', display: 'inline-block', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 900 }}>
                                    Cupo Aprobado: ${Number(qrModal.item.cupo_aprobado).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <a
                                href={qrModal.qrDataUrl}
                                download={`QR_Descuento_${qrModal.item.cedula}.png`}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '10px',
                                    background: '#002f6c',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Download size={15} /> Descargar QR
                            </a>
                            <button onClick={() => setQrModal(null)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '13px', color: '#475569' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL RECHAZAR */}
            {rejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            Rechazar Beneficio 90 Días
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                            Ingresa el motivo por el cual se rechaza el beneficio para <strong>{rejectModal.name}</strong>:
                        </p>
                        <textarea
                            value={rejectObs}
                            onChange={e => setRejectObs(e.target.value)}
                            placeholder="Ej: Pendiente de confirmación de RRHH, contrato temporal, etc..."
                            style={{
                                width: '100%',
                                height: '90px',
                                padding: '10px',
                                borderRadius: '10px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '13px',
                                marginBottom: '20px',
                                outline: 'none'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setRejectModal(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                                Cancelar
                            </button>
                            <button onClick={handleRejectBenefit} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>
                                Confirmar Rechazo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INFORMACIÓN SINCRONIZACIÓN SAP */}
            {showSyncInfoModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⚡ Sincronización desde SAP HANA (90 Días)
                            </h3>
                            <button onClick={() => setShowSyncInfoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X /></button>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                            <p style={{ margin: '0 0 10px' }}>
                                <strong>Arquitectura de Red Corporativa:</strong><br/>
                                El servidor de SAP HANA se encuentra en la IP interna de oficina <code>172.1.2.10</code>.
                            </p>
                            <p style={{ margin: 0 }}>
                                Para extraer los colaboradores con 90 días cumplidos hacia la base de datos de Supabase, ejecuta este comando en la terminal de cualquier máquina conectada a la red de la oficina:
                            </p>
                            <div style={{ background: '#0f172a', color: '#38bdf8', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12.5px', marginTop: '10px', userSelect: 'all' }}>
                                npm run sync:benefits
                            </div>
                        </div>

                        <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 20px' }}>
                            Una vez ejecutada la sincronización, haz clic en el botón de abajo para recargar la lista de aprobaciones de inmediato.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowSyncInfoModal(false);
                                    fetchBenefits();
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#002f6c',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <RefreshCw size={14} /> Recargar Lista Ahora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
