'use client';

import { useState, useRef, useEffect } from 'react';
import { useDoc } from '@/context/DocContext';
import Link from 'next/link';
import QRCode from 'qrcode';
import { 
    Search, FileText, User as UserIcon, ChevronRight, Briefcase, Calendar, 
    Trash2, X, Upload, UserPlus, Sparkles, Gift, CheckCircle, AlertCircle, 
    RefreshCw, QrCode, Mail, Edit3, DollarSign, Check, Eye, Download, ShieldCheck, Building2,
    Sliders, Settings, Plus, RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';

const EMPRESAS_DISPONIBLES = [
    { code: 'E200', name: 'Superdeporte S.A.', short: 'Superdeporte' },
    { code: 'E100', name: 'Equinox', short: 'Equinox' },
    { code: 'E101', name: 'Mundo Dep', short: 'Mundo Dep' }
];

const DEFAULT_P_ESTILOS = "-5009|-5010|-5111|-5222|-5305|-5476|-5492|-5617|-5618|-5760|-3450|-VA-AC|-VA-AZ|-VA-BG|-VA-NG|-VT-BG|-VT-NG|-107-02|-107-04|-107-05|-107-06|-108-01|-201-02|-201-04|-202-06|-203-08|-710-02|-715-01|-715-02|-720-03|-10-11287-600|-10-11287-601|-10-12043-304|-10-12043-309|-10-12043-313|-10-12485-366|-10-12485-368|-10-12485-372|-10-12485-373|-10-12485-374|-10-12485-375|-10-12486-0833|-10-12486-0835|-10-12486-0837|-10-12486-0907|-10-12486-384|-10-12486-391|-10-12486-392|-10-12486-407|-10-12486-428|-CM1|-EF1|-PBW1|-PC1|-PE1|-PE2|-PE5|-SFE1|-SPV2|-SWI14|-SWI15|-VP2|-VP3|-VP4|-WC2|-WC8|-WI10|-WI11|-WI4|-AB4WS|-BBB11|-BR3CWS|-BR6WS|-CPROC|-CPRON|-CPWSB|-JR601|-JR602|-JR603|-JR604|-JR605|-MAT4WS001|-MAT4WS002|-MAT4WS003|-MAT6WS001|-MAT6WS002|-MAT6WS003|-MAT6WS005|-RWS105|-RWS106|-SA401|-SA402|-SP401|-CH50GSD|-FR50GSD|-GC50GSD";

const DEFAULT_EMPRESA_DESCUENTOS: Record<string, number> = {
    E200: 30,
    E100: 30,
    E101: 30
};

const DEFAULT_EMPRESA_SUBSIDIARIAS: Record<string, string> = {
    E200: '101|102|103|122|127|118|116',
    E100: '121|126',
    E101: '303|304'
};

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
    const [benefitsEmpresaFilter, setBenefitsEmpresaFilter] = useState<string>('ALL');
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
    const [isSyncingSap, setIsSyncingSap] = useState(false);
    const [isProcessingOracle, setIsProcessingOracle] = useState(false);

    // === CONFIGURACIÓN DE DESCUENTOS POR PUESTO Y ESTILOS ORACLE ===
    const [rulesModalOpen, setRulesModalOpen] = useState(false);
    const [cupoRules, setCupoRules] = useState<Array<{ id?: string; patron: string; descripcion?: string; cupo: number; activo?: boolean }>>([]);
    const [pEstilos, setPEstilos] = useState(DEFAULT_P_ESTILOS);
    const [empresaDescuentos, setEmpresaDescuentos] = useState<Record<string, number>>(DEFAULT_EMPRESA_DESCUENTOS);
    const [empresaSubsidiarias, setEmpresaSubsidiarias] = useState<Record<string, string>>(DEFAULT_EMPRESA_SUBSIDIARIAS);
    const [isLoadingRules, setIsLoadingRules] = useState(false);
    const [isSavingRules, setIsSavingRules] = useState(false);
    const [newRulePatron, setNewRulePatron] = useState('');
    const [newRuleDesc, setNewRuleDesc] = useState('');
    const [newRuleCupo, setNewRuleCupo] = useState('1000');
    const [rulesSearchFilter, setRulesSearchFilter] = useState('');

    const handleSyncSapBenefits = async () => {
        setIsSyncingSap(true);
        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync_sap' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message || 'Sincronización con SAP HANA completada exitosamente'}`);
                await fetchBenefits();
            } else {
                alert(`❌ Error al sincronizar con SAP: ${data.error}`);
            }
        } catch (e: any) {
            alert(`❌ Error al conectar con SAP HANA: ${e.message}`);
        } finally {
            setIsSyncingSap(false);
        }
    };

    const handleProcessOracleCoupons = async () => {
        setIsProcessingOracle(true);
        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate_oracle_coupons' })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message}`);
                await fetchBenefits();
            } else if (data.isLocalRequired) {
                alert(`ℹ️ Proceso de Red Local Oracle:\n\n${data.error}\n\nPara procesar las asignaciones pendientes en Oracle Retail Pro, ejecute en la consola del servidor:\nnpm run process:coupons`);
            } else {
                alert(`❌ Error: ${data.error || 'No se pudieron generar los certificados en Oracle'}`);
            }
        } catch (e: any) {
            alert(`❌ Error al conectar con el servicio: ${e.message}`);
        } finally {
            setIsProcessingOracle(false);
        }
    };

    const fetchBenefits = async () => {
        setBenefitsLoading(true);
        try {
            const res = await fetch(`/api/benefits-90-days?status=${benefitsFilter}&empresa=${benefitsEmpresaFilter}&search=${encodeURIComponent(benefitsSearch)}`);
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
    }, [mainTab, benefitsFilter, benefitsEmpresaFilter]);

    // === GESTIÓN DE REGLAS DE DESCUENTOS POR PUESTO ===
    const handleOpenRulesModal = async () => {
        setRulesModalOpen(true);
        setIsLoadingRules(true);
        try {
            const res = await fetch('/api/benefits-90-days?rules=true');
            const data = await res.json();
            if (data.success) {
                if (Array.isArray(data.rules)) setCupoRules(data.rules);
                if (data.p_estilos) setPEstilos(data.p_estilos);
                if (data.empresa_descuentos && typeof data.empresa_descuentos === 'object') {
                    setEmpresaDescuentos({ ...DEFAULT_EMPRESA_DESCUENTOS, ...data.empresa_descuentos });
                }
                if (data.empresa_subsidiarias && typeof data.empresa_subsidiarias === 'object') {
                    setEmpresaSubsidiarias({ ...DEFAULT_EMPRESA_SUBSIDIARIAS, ...data.empresa_subsidiarias });
                }
            }
        } catch (e: any) {
            console.error('Error al cargar reglas de descuentos:', e);
        } finally {
            setIsLoadingRules(false);
        }
    };

    const handleAddRule = () => {
        const cleanPatron = newRulePatron.trim().toUpperCase();
        if (!cleanPatron) {
            alert('⚠️ Ingresa el código o nombre del puesto (ej: ASVENT, CAJERO, AUBODE)');
            return;
        }
        const val = parseFloat(newRuleCupo);
        if (isNaN(val) || val < 0) {
            alert('⚠️ Ingresa un valor de descuento numérico válido');
            return;
        }

        const existingIdx = cupoRules.findIndex(r => r.patron.toUpperCase() === cleanPatron);
        if (existingIdx >= 0) {
            const updated = [...cupoRules];
            updated[existingIdx] = {
                ...updated[existingIdx],
                cupo: val,
                descripcion: newRuleDesc.trim() || updated[existingIdx].descripcion,
                activo: true
            };
            setCupoRules(updated);
        } else {
            setCupoRules([
                ...cupoRules,
                {
                    id: String(Date.now()),
                    patron: cleanPatron,
                    descripcion: newRuleDesc.trim(),
                    cupo: val,
                    activo: true
                }
            ]);
        }

        setNewRulePatron('');
        setNewRuleDesc('');
        setNewRuleCupo('1000');
    };

    const handleDeleteRule = (patronToDelete: string) => {
        setCupoRules(prev => prev.filter(r => r.patron.toUpperCase() !== patronToDelete.toUpperCase()));
    };

    const handleUpdateRuleCupo = (patron: string, newCupo: number) => {
        setCupoRules(prev => prev.map(r => r.patron.toUpperCase() === patron.toUpperCase() ? { ...r, cupo: newCupo } : r));
    };

    const handleToggleRuleActive = (patron: string) => {
        setCupoRules(prev => prev.map(r => r.patron.toUpperCase() === patron.toUpperCase() ? { ...r, activo: !r.activo } : r));
    };

    const handleUpdateEmpresaDescuento = (code: string, pct: number) => {
        setEmpresaDescuentos(prev => ({
            ...prev,
            [code]: isNaN(pct) ? 0 : Math.min(100, Math.max(0, pct))
        }));
    };

    const handleUpdateEmpresaSubsidiaria = (code: string, value: string) => {
        setEmpresaSubsidiarias(prev => ({
            ...prev,
            [code]: value
        }));
    };

    const handleResetDefaultRules = () => {
        if (!confirm('¿Restablecer las reglas de descuento, porcentajes, subsidiarias y estilos excluidos a los valores corporativos oficiales?')) return;
        setCupoRules([
            { patron: 'ASVENT', descripcion: 'Asesor de Ventas', cupo: 1000, activo: true },
            { patron: 'AUBODE', descripcion: 'Auxiliar de Bodega', cupo: 1000, activo: true },
            { patron: 'CAJERO', descripcion: 'Cajero / Facturación', cupo: 1000, activo: true },
            { patron: 'BODEG', descripcion: 'Bodegueros / Operadores de Bodega', cupo: 1000, activo: true },
            { patron: 'ANALIS', descripcion: 'Analistas Administrativos / BI', cupo: 1500, activo: true },
            { patron: 'ASIST', descripcion: 'Asistentes Administrativos', cupo: 1500, activo: true },
            { patron: 'MAYORISTA', descripcion: 'Canal Mayoristas', cupo: 1500, activo: true },
            { patron: 'JEALMA', descripcion: 'Jefes de Almacén', cupo: 2500, activo: true },
            { patron: 'SUALMA', descripcion: 'Supervisores de Almacén', cupo: 2500, activo: true },
            { patron: 'SUTIEN', descripcion: 'Supervisores de Tienda', cupo: 2500, activo: true },
            { patron: 'COORD', descripcion: 'Coordinadores / Líderes', cupo: 2500, activo: true },
            { patron: 'GEREN', descripcion: 'Gerencias y Directores', cupo: 6000, activo: true },
        ]);
        setPEstilos(DEFAULT_P_ESTILOS);
        setEmpresaDescuentos(DEFAULT_EMPRESA_DESCUENTOS);
        setEmpresaSubsidiarias(DEFAULT_EMPRESA_SUBSIDIARIAS);
    };

    const handleSaveRules = async (recalculatePending: boolean = false) => {
        setIsSavingRules(true);
        try {
            const res = await fetch('/api/benefits-90-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save_rules',
                    rules: cupoRules,
                    p_estilos: pEstilos,
                    empresa_descuentos: empresaDescuentos,
                    empresa_subsidiarias: empresaSubsidiarias,
                    recalculatePending,
                    user_name: 'Talento Humano'
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message || 'Configuración guardada exitosamente.'}`);
                setRulesModalOpen(false);
                if (recalculatePending) {
                    await fetchBenefits();
                }
            } else {
                alert(`❌ Error al guardar reglas: ${data.error}`);
            }
        } catch (e: any) {
            alert(`❌ Error al guardar configuración: ${e.message}`);
        } finally {
            setIsSavingRules(false);
        }
    };

    // Cambiar empresa para un colaborador (E200, E100, E101)
    const handleToggleEmpresa = async (benefitId: string, currentEmpresas: string[] | undefined, codeToToggle: string) => {
        const list = Array.isArray(currentEmpresas) && currentEmpresas.length > 0 ? [...currentEmpresas] : ['E200'];
        let updated: string[];
        if (list.includes(codeToToggle)) {
            if (list.length === 1) {
                alert('⚠️ El colaborador debe tener al menos una empresa seleccionada para su certificado.');
                return;
            }
            updated = list.filter(c => c !== codeToToggle);
        } else {
            updated = [...list, codeToToggle];
        }

        // Optimistic update
        setBenefits(prev => prev.map(b => b.id === benefitId ? { ...b, empresas: updated } : b));

        try {
            await fetch('/api/benefits-90-days', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: benefitId, empresas: updated })
            });
        } catch (e) {
            console.error('Error actualizando empresas:', e);
        }
    };

    // Seleccionar todas las empresas para un colaborador
    const handleSelectAllEmpresas = async (benefitId: string) => {
        const all = ['E200', 'E100', 'E101'];
        setBenefits(prev => prev.map(b => b.id === benefitId ? { ...b, empresas: all } : b));
        try {
            await fetch('/api/benefits-90-days', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: benefitId, empresas: all })
            });
        } catch (e) {
            console.error('Error actualizando empresas:', e);
        }
    };

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
            if (data.success && data.count > 0) {
                alert(`✅ Colaborador aprobado exitosamente. Se ha emitido su código QR y enviado la notificación a su correo.`);
                await fetchBenefits();
            } else if (data.success && data.count === 0) {
                alert(`⚠️ La aprobación no pudo actualizar el registro en la base de datos.`);
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
            if (data.success && data.count > 0) {
                alert(`✅ Se aprobaron ${data.count} colaboradores exitosamente y se enviaron sus correos con QR.`);
                setSelectedBenefitIds(new Set());
                await fetchBenefits();
            } else if (data.success && data.count === 0) {
                alert(`⚠️ La aprobación no pudo actualizar los registros en la base de datos.`);
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
                empresas_autorizadas: item.empresas || ['E200'],
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
                                    onClick={handleOpenRulesModal}
                                    title="Configura los descuentos automáticos por puesto (ej. ASVENT, CAJERO, AUBODE)"
                                    style={{
                                        padding: '12px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        background: 'rgba(255,255,255,0.12)',
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
                                    <Sliders size={15} /> Configurar Descuentos por Puesto
                                </button>
                                <button
                                    onClick={handleSyncSapBenefits}
                                    disabled={isSyncingSap}
                                    style={{
                                        padding: '12px 20px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: isSyncingSap ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        cursor: isSyncingSap ? 'not-allowed' : 'pointer',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        opacity: isSyncingSap ? 0.8 : 1
                                    }}
                                >
                                    <RefreshCw size={15} className={isSyncingSap ? 'animate-spin' : ''} />
                                    {isSyncingSap ? 'Sincronizando con SAP HANA...' : 'Sincronizar SAP HANA'}
                                </button>
                                <button
                                    onClick={handleProcessOracleCoupons}
                                    disabled={isProcessingOracle}
                                    title="Emite los certificados de descuento en Oracle Retail Pro para todos los colaboradores aprobados"
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.25)',
                                        background: isProcessingOracle ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                                        color: 'white',
                                        cursor: isProcessingOracle ? 'not-allowed' : 'pointer',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        opacity: isProcessingOracle ? 0.8 : 1
                                    }}
                                >
                                    <Sparkles size={15} className={isProcessingOracle ? 'animate-spin' : ''} />
                                    {isProcessingOracle ? 'Procesando en Oracle...' : 'Emitir Certificados Oracle'}
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

                        {/* Buscador y Filtro por Empresa */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={benefitsEmpresaFilter}
                                    onChange={e => setBenefitsEmpresaFilter(e.target.value)}
                                    style={{
                                        padding: '9px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #cbd5e1',
                                        background: 'white',
                                        fontSize: '12.5px',
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="ALL">🏢 Todas las Empresas</option>
                                    <option value="E200">E200 - Superdeporte</option>
                                    <option value="E100">E100 - Equinox</option>
                                    <option value="E101">E101 - Mundo Dep</option>
                                </select>
                            </div>

                            <div style={{ position: 'relative', minWidth: '260px' }}>
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
                                        <th style={{ padding: '14px 16px' }}>Empresas Descuento</th>
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
                                                    onClick={handleSyncSapBenefits}
                                                    disabled={isSyncingSap}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        background: 'white',
                                                        cursor: isSyncingSap ? 'not-allowed' : 'pointer',
                                                        fontSize: '12.5px',
                                                        fontWeight: 700,
                                                        color: '#002f6c'
                                                    }}
                                                >
                                                    {isSyncingSap ? 'Sincronizando con SAP HANA...' : '⚡ Sincronizar desde SAP HANA Ahora'}
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
                                                    {/* SELECTOR INTERACTIVO DE EMPRESAS DE DESCUENTO */}
                                                    <td style={{ padding: '14px 16px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                                {EMPRESAS_DISPONIBLES.map(emp => {
                                                                    const empList = Array.isArray(b.empresas) && b.empresas.length > 0 ? b.empresas : ['E200'];
                                                                    const isSelected = empList.includes(emp.code);
                                                                    const isPending = b.estado === 'PENDIENTE';

                                                                    return (
                                                                        <button
                                                                            key={emp.code}
                                                                            type="button"
                                                                            disabled={!isPending}
                                                                            onClick={() => handleToggleEmpresa(b.id, b.empresas, emp.code)}
                                                                            title={isPending ? `Clic para ${isSelected ? 'quitar' : 'asignar'} certificado en ${emp.name}` : emp.name}
                                                                            style={{
                                                                                padding: '3px 7px',
                                                                                borderRadius: '6px',
                                                                                fontSize: '11px',
                                                                                fontWeight: 800,
                                                                                border: isSelected ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                                                                                background: isSelected ? '#eff6ff' : '#f8fafc',
                                                                                color: isSelected ? '#1e40af' : '#94a3b8',
                                                                                cursor: isPending ? 'pointer' : 'default',
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '4px',
                                                                                transition: 'all 0.15s ease'
                                                                            }}
                                                                        >
                                                                            <span style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                background: isSelected ? '#2563eb' : '#cbd5e1'
                                                                            }} />
                                                                            {emp.code}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                            {b.estado === 'PENDIENTE' && (
                                                                <div style={{ display: 'flex', gap: '6px', fontSize: '10.5px' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSelectAllEmpresas(b.id)}
                                                                        style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                                                                    >
                                                                        ✓ Todas
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
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
                                                                {b.discount_id_ws ? (
                                                                    <div style={{ marginTop: '4px' }}>
                                                                        <span 
                                                                            title={`Certificado(s) Retail Pro: ${b.discount_id_ws}`} 
                                                                            style={{ 
                                                                                background: '#eff6ff', 
                                                                                color: '#1d4ed8', 
                                                                                fontSize: '10.5px', 
                                                                                fontWeight: 800, 
                                                                                padding: '2px 6px', 
                                                                                borderRadius: '6px', 
                                                                                border: '1px solid #bfdbfe',
                                                                                display: 'inline-block',
                                                                                maxWidth: '160px',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap'
                                                                            }}
                                                                        >
                                                                            🎟️ {b.discount_id_ws}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ marginTop: '4px' }}>
                                                                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', border: '1px solid #fde68a' }}>
                                                                            ⏳ Pendiente Oracle
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {b.email_sent && (
                                                                    <div style={{ fontSize: '10.5px', color: '#0284c7', marginTop: '3px', fontWeight: 600 }}>
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

                                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Empresas Autorizadas:
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        {(qrModal.item.empresas || ['E200']).map((code: string) => {
                                            const label = code === 'E200' ? 'E200 - Superdeporte' : code === 'E100' ? 'E100 - Equinox' : code === 'E101' ? 'E101 - Mundo Dep' : code;
                                            return (
                                                <span key={code} style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {qrModal.item.discount_id_ws && (
                                    <div style={{ marginTop: '10px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            🎟️ Certificado(s) Retail Pro Emitido(s):
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#15803d', letterSpacing: '0.04em', wordBreak: 'break-all' }}>
                                            {qrModal.item.discount_id_ws}
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    marginTop: '12px',
                                    background: '#eff6ff',
                                    border: '1.5px solid #bfdbfe',
                                    borderRadius: '12px',
                                    padding: '10px 14px',
                                    textAlign: 'left',
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🤖</span>
                                    <div style={{ fontSize: '11.5px', color: '#1e40af', lineHeight: 1.4 }}>
                                        <strong>Disponible en Sporty:</strong> El colaborador puede consultar y descargar este QR de descuento en cualquier momento desde su chat con <strong>Sporty</strong> (opción: <em>QR de Descuento</em>).
                                    </div>
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
            {/* MODAL CONFIGURACIÓN DE DESCUENTOS POR PUESTO */}
            {rulesModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2100,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '780px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                    }}>
                        {/* Cabecera del Modal */}
                        <div style={{
                            padding: '24px 28px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            background: 'linear-gradient(to right, #ffffff, #f8fafc)'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: '#eff6ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#2563eb'
                                    }}>
                                        <Sliders size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                                        Configuración de Descuentos por Puesto
                                    </h3>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                                    Ingresa el código o nombre del puesto (ej: <strong>ASVENT</strong>, <strong>CAJERO</strong>, <strong>AUBODE</strong>) y a su lado define el valor del descuento ($).
                                </p>
                            </div>
                            <button
                                onClick={() => setRulesModalOpen(false)}
                                style={{
                                    border: 'none',
                                    background: '#f1f5f9',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#64748b'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
                            {/* Formulario rápido para agregar nuevo puesto */}
                            <div style={{
                                background: '#f8fafc',
                                border: '1.5px dashed #cbd5e1',
                                borderRadius: '16px',
                                padding: '16px 20px',
                                marginBottom: '22px'
                            }}>
                                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={15} color="#2563eb" /> Agregar Nuevo Puesto y Valor de Descuento:
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 180px' }}>
                                        <input
                                            type="text"
                                            value={newRulePatron}
                                            onChange={e => setNewRulePatron(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                                            placeholder="Puesto (ej: ASVENT, CAJERO...)"
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                outline: 'none',
                                                textTransform: 'uppercase'
                                            }}
                                        />
                                    </div>
                                    <div style={{ width: '150px', position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '9px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>$</span>
                                        <input
                                            type="number"
                                            value={newRuleCupo}
                                            onChange={e => setNewRuleCupo(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                                            placeholder="1000.00"
                                            step="50"
                                            min="0"
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px 9px 24px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '13px',
                                                fontWeight: 800,
                                                color: '#0f172a',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: '2 1 200px' }}>
                                        <input
                                            type="text"
                                            value={newRuleDesc}
                                            onChange={e => setNewRuleDesc(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                                            placeholder="Descripción opcional (ej: Asesores de Ventas)"
                                            style={{
                                                width: '100%',
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                fontSize: '13px',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddRule}
                                        style={{
                                            padding: '9px 18px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#2563eb',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <Plus size={15} /> Agregar Puesto
                                    </button>
                                </div>
                            </div>

                            {/* Barra de Búsqueda y Conteo de Reglas */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                                    📋 Puestos Configurados ({cupoRules.length})
                                </div>
                                <div style={{ width: '220px', position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                                    <input
                                        type="text"
                                        value={rulesSearchFilter}
                                        onChange={e => setRulesSearchFilter(e.target.value)}
                                        placeholder="Filtrar puestos..."
                                        style={{
                                            width: '100%',
                                            padding: '7px 10px 7px 30px',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '12px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Tabla de Puestos y Descuentos */}
                            {isLoadingRules ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#2563eb' }} />
                                    Cargando reglas configuradas...
                                </div>
                            ) : cupoRules.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '13px' }}>
                                    No hay puestos configurados todavía. Ingresa uno arriba o restablece los predeterminados.
                                </div>
                            ) : (
                                <div style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    background: 'white'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <th style={{ padding: '10px 16px', fontWeight: 700 }}>Puesto / Código</th>
                                                <th style={{ padding: '10px 16px', fontWeight: 700 }}>Descripción</th>
                                                <th style={{ padding: '10px 16px', fontWeight: 700, width: '150px' }}>Cupo Base ($)</th>
                                                <th style={{ padding: '10px 16px', fontWeight: 700, width: '180px' }}>Desc. Máx Oracle</th>
                                                <th style={{ padding: '10px 16px', fontWeight: 700, width: '90px', textAlign: 'center' }}>Estado</th>
                                                <th style={{ padding: '10px 16px', fontWeight: 700, width: '60px', textAlign: 'center' }}>Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cupoRules
                                                .filter(r => {
                                                    if (!rulesSearchFilter.trim()) return true;
                                                    const s = rulesSearchFilter.toLowerCase();
                                                    return (r.patron || '').toLowerCase().includes(s) || (r.descripcion || '').toLowerCase().includes(s);
                                                })
                                                .map((r, idx) => {
                                                    const baseCupo = Number(r.cupo) || 0;
                                                    const uniquePcts = Array.from(new Set(Object.values(empresaDescuentos)));
                                                    const isUniform = uniquePcts.length <= 1;
                                                    const defaultPct = empresaDescuentos['E200'] ?? 30;
                                                    const descVal = Math.round(baseCupo * (defaultPct / 100) * 100) / 100;

                                                    return (
                                                        <tr key={r.patron + idx} style={{ borderBottom: '1px solid #f1f5f9', background: r.activo === false ? '#fafafa' : 'white' }}>
                                                            <td style={{ padding: '10px 16px' }}>
                                                                <span style={{
                                                                    background: '#eff6ff',
                                                                    color: '#1d4ed8',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '6px',
                                                                    fontWeight: 800,
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    {r.patron}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '10px 16px', color: '#475569' }}>
                                                                {r.descripcion || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin descripción</span>}
                                                            </td>
                                                            <td style={{ padding: '10px 16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ fontWeight: 800, color: '#3b82f6', fontSize: '13px' }}>$</span>
                                                                    <input
                                                                        type="number"
                                                                        value={r.cupo}
                                                                        onChange={e => handleUpdateRuleCupo(r.patron, parseFloat(e.target.value) || 0)}
                                                                        step="50"
                                                                        min="0"
                                                                        style={{
                                                                            width: '95px',
                                                                            padding: '6px 8px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid #cbd5e1',
                                                                            fontSize: '13px',
                                                                            fontWeight: 800,
                                                                            color: '#0f172a',
                                                                            outline: 'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '10px 16px' }}>
                                                                {isUniform ? (
                                                                    <span style={{
                                                                        background: '#dcfce7',
                                                                        color: '#15803d',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '6px',
                                                                        fontWeight: 800,
                                                                        fontSize: '13px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        ${descVal.toFixed(2)}
                                                                        <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 700 }}>({defaultPct}%)</span>
                                                                    </span>
                                                                ) : (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                        {Object.entries(empresaDescuentos).map(([code, pct]) => (
                                                                            <span key={code} style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
                                                                                <strong>{code}:</strong> ${(baseCupo * (pct / 100)).toFixed(2)} ({pct}%)
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleToggleRuleActive(r.patron)}
                                                                    style={{
                                                                        border: 'none',
                                                                        background: r.activo !== false ? '#dcfce7' : '#f1f5f9',
                                                                        color: r.activo !== false ? '#15803d' : '#94a3b8',
                                                                        padding: '3px 8px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 800,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {r.activo !== false ? 'ACTIVO' : 'PAUSADO'}
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleDeleteRule(r.patron)}
                                                                    title="Eliminar regla"
                                                                    style={{
                                                                        border: 'none',
                                                                        background: 'transparent',
                                                                        cursor: 'pointer',
                                                                        color: '#ef4444',
                                                                        padding: '4px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Configuración de Porcentaje de Descuento y Subsidiarias por Empresa */}
                            <div style={{
                                marginTop: '20px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '16px 20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building2 size={16} color="#2563eb" /> Parámetros por Empresa (<code>descuento_porcentaje</code> y <code>subsidiaria</code>)
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEmpresaDescuentos(DEFAULT_EMPRESA_DESCUENTOS);
                                            setEmpresaSubsidiarias(DEFAULT_EMPRESA_SUBSIDIARIAS);
                                        }}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#2563eb',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Restablecer valores oficiales
                                    </button>
                                </div>
                                <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                                    Define el porcentaje de descuento y las subsidiarias que se registrarán en la tabla <code>certificados</code> de Oracle Retail Pro para cada empresa autorizada.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                                    {EMPRESAS_DISPONIBLES.map(emp => {
                                        const currentPct = empresaDescuentos[emp.code] !== undefined ? empresaDescuentos[emp.code] : 30;
                                        const currentSub = empresaSubsidiarias[emp.code] !== undefined ? empresaSubsidiarias[emp.code] : (DEFAULT_EMPRESA_SUBSIDIARIAS[emp.code] || '');
                                        return (
                                            <div key={emp.code} style={{
                                                background: 'white',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '12px',
                                                padding: '14px 16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '10px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{emp.code}</span>
                                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{emp.short}</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.name}</div>

                                                {/* Input Descuento Porcentaje */}
                                                <div>
                                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                        % Descuento:
                                                    </label>
                                                    <div style={{ position: 'relative', width: '100%' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="1"
                                                            value={currentPct}
                                                            onChange={e => handleUpdateEmpresaDescuento(emp.code, parseFloat(e.target.value))}
                                                            style={{
                                                                width: '100%',
                                                                padding: '7px 28px 7px 10px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #cbd5e1',
                                                                fontSize: '13px',
                                                                fontWeight: 800,
                                                                color: '#0f172a',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <span style={{ position: 'absolute', right: '10px', top: '7px', fontSize: '13px', fontWeight: 800, color: '#64748b' }}>%</span>
                                                    </div>
                                                    <div style={{ fontSize: '10.5px', color: '#15803d', fontWeight: 700, marginTop: '3px' }}>
                                                        Ej: Cupo $1,000 ➔ ${(1000 * (currentPct / 100)).toFixed(2)}
                                                    </div>
                                                </div>

                                                {/* Input Subsidiaria(s) */}
                                                <div>
                                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                        Subsidiaria(s) Oracle:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={currentSub}
                                                        onChange={e => handleUpdateEmpresaSubsidiaria(emp.code, e.target.value)}
                                                        placeholder="ej: 101|102|103..."
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #cbd5e1',
                                                            fontSize: '11.5px',
                                                            fontFamily: 'monospace',
                                                            color: '#334155',
                                                            background: '#f8fafc',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Configuración de Estilos Excluidos Oracle (p_estilos) */}
                            <div style={{
                                marginTop: '20px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '14px',
                                padding: '16px 20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        🏷️ Estilos Excluidos en Oracle Retail Pro (<code>p_estilos</code>)
                                        <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                                            {pEstilos.split('|').filter(Boolean).length} estilos
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPEstilos(DEFAULT_P_ESTILOS)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#2563eb',
                                            fontSize: '11.5px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        Restablecer estilos oficiales
                                    </button>
                                </div>
                                <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                                    Lista de estilos excluidos que se registran en el campo <code>estilos</code> del certificado en Oracle Retail Pro. Separados por pleca (<code>|</code>).
                                </p>
                                <textarea
                                    value={pEstilos}
                                    onChange={e => setPEstilos(e.target.value)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '11.5px',
                                        fontFamily: 'monospace',
                                        color: '#334155',
                                        background: 'white',
                                        outline: 'none',
                                        resize: 'vertical',
                                        lineHeight: 1.4
                                    }}
                                />
                            </div>

                            {/* Mensaje informativo */}
                            <div style={{
                                marginTop: '16px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                fontSize: '12px',
                                color: '#1e40af',
                                lineHeight: 1.5
                            }}>
                                💡 <strong>Reglas de negocio:</strong> El valor en la tabla es el <strong>Cupo Asignado</strong> al colaborador. En Oracle Retail Pro, el campo <code>descuento_porcentaje</code> se registra según el porcentaje configurado por empresa y <code>monto_maximo_descuento</code> se calcula automáticamente (Cupo &times; %).
                            </div>
                        </div>

                        {/* Pie del Modal con Acciones */}
                        <div style={{
                            padding: '16px 28px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleResetDefaultRules}
                                style={{
                                    border: '1px solid #cbd5e1',
                                    background: 'white',
                                    color: '#475569',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <RotateCcw size={13} /> Restablecer Predeterminados
                            </button>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setRulesModalOpen(false)}
                                    style={{
                                        border: '1px solid #cbd5e1',
                                        background: 'white',
                                        color: '#475569',
                                        padding: '9px 16px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSaveRules(false)}
                                    disabled={isSavingRules}
                                    style={{
                                        border: 'none',
                                        background: '#2563eb',
                                        color: 'white',
                                        padding: '9px 18px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: isSavingRules ? 'not-allowed' : 'pointer',
                                        opacity: isSavingRules ? 0.7 : 1
                                    }}
                                >
                                    {isSavingRules ? 'Guardando...' : 'Guardar Configuración'}
                                </button>
                                <button
                                    onClick={() => handleSaveRules(true)}
                                    disabled={isSavingRules}
                                    title="Guarda los descuentos y actualiza inmediatamente a todos los colaboradores en estado PENDIENTE"
                                    style={{
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        padding: '9px 20px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 800,
                                        cursor: isSavingRules ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                                        opacity: isSavingRules ? 0.7 : 1
                                    }}
                                >
                                    <CheckCircle size={15} />
                                    {isSavingRules ? 'Procesando...' : 'Guardar y Recalcular Pendientes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
