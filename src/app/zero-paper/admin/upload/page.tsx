'use client';

import { useState, useRef } from 'react';
import { useDoc } from '@/context/DocContext';
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, Sparkles, Download, RefreshCw, Server } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function MassUploadPage() {
    const { massImportEmployees, addDocumentToEmployee, employees, syncEmployees } = useDoc();

    const [mode, setMode] = useState<'sync_sap' | 'documents' | 'excel'>('sync_sap');
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgressMsg, setSyncProgressMsg] = useState<string | null>(null);
    const [syncResult, setSyncResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

    const [isProcessingExcel, setIsProcessingExcel] = useState(false);
    const [excelSummary, setExcelSummary] = useState<{ total: number; success: number } | null>(null);

    // Document upload state
    const [files, setFiles] = useState<File[]>([]);
    const [uploadLog, setUploadLog] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const handleSyncSap = async (syncMode: 'active' | 'all') => {
        setIsSyncing(true);
        setSyncResult(null);
        setSyncProgressMsg(
            syncMode === 'active' 
                ? 'Consultando nómina de empleados activos en SAP HANA (sapabap1)...' 
                : 'Consultando nómina completa (activos + inactivos) en SAP HANA...'
        );

        try {
            const res = await syncEmployees(syncMode);
            setSyncResult(res);
            if (res.success) {
                alert(`✅ ¡Sincronización con SAP exitosa! Se actualizaron ${res.count} empleados en Supabase.`);
            } else {
                const isTimeout = res.error?.includes('timed out') || res.error?.includes('89006') || res.error?.includes('connect');
                if (isTimeout) {
                    alert(`⚠️ No se pudo conectar con SAP HANA (172.1.2.10).\n\nEl servidor web en la nube no tiene acceso directo a la red privada de la oficina.\n\n👉 Para sincronizar hacia Supabase, ejecuta en la terminal de tu máquina en la oficina:\n\n   npm run sync:sap`);
                } else {
                    alert(`Error en sincronización con SAP: ${res.error}`);
                }
            }
        } catch (err: any) {
            setSyncResult({ success: false, error: err.message });
            alert(`Error: ${err.message}`);
        } finally {
            setIsSyncing(false);
            setSyncProgressMsg(null);
        }
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingExcel(true);
        setExcelSummary(null);

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    if (!data || data.length === 0) {
                        alert('El archivo no contiene filas de datos.');
                        setIsProcessingExcel(false);
                        return;
                    }

                    await massImportEmployees(data);
                    setExcelSummary({ total: data.length, success: data.length });
                    alert(`Se procesaron e importaron exitosamente ${data.length} empleados en Supabase.`);
                } catch (err: any) {
                    console.error('Error importando excel:', err);
                    alert(`Error al procesar el archivo Excel: ${err.message || 'Formato no soportado'}`);
                } finally {
                    setIsProcessingExcel(false);
                    if (excelInputRef.current) excelInputRef.current.value = '';
                }
            };
            reader.readAsBinaryString(file);
        } catch (err: any) {
            console.error('Error al leer archivo:', err);
            alert('Error al leer el archivo seleccionado.');
            setIsProcessingExcel(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            {
                cedula: '1712345678',
                codigo_sap: '00012750',
                nombre: 'Juan Carlos',
                apellido: 'Pérez Gómez',
                cargo: 'Asesor Comercial',
                fecha_ingreso: '2024-01-15',
                pais: 'SUPERDEPORTE S.A.',
                ciudad: 'Quito',
                region: 'Pichincha',
                departamento: 'Ventas',
                responsable: 'María López'
            }
        ];
        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Empleados');
        XLSX.writeFile(wb, 'plantilla_carga_empleados.xlsx');
    };

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const processFiles = () => {
        const log: string[] = [];
        let successCount = 0;

        files.forEach(file => {
            const matchedEmployee = employees
                .sort((a, b) => b.id.length - a.id.length)
                .find(emp => file.name.includes(emp.id));

            if (matchedEmployee) {
                const detectedId = matchedEmployee.id;

                addDocumentToEmployee(detectedId, {
                    file: file,
                    id: 'doc-' + Date.now() + Math.random(),
                    fileName: file.name,
                    type: file.type.includes('pdf') ? 'pdf' : 'image',
                    uploadDate: new Date().toISOString().split('T')[0]
                } as any);

                log.push(`✅ ${file.name} -> Asignado a ${matchedEmployee.name} ${matchedEmployee.apellido} (CI: ${detectedId})`);
                successCount++;
            } else {
                log.push(`⚠️ ${file.name} -> No se encontró coincidencia con ninguna Cédula de empleado activo.`);
            }
        });

        setUploadLog(log);
        alert(`Proceso completado. ${successCount} de ${files.length} archivos asignados correctamente.`);
        setFiles([]);
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '2.5rem 2rem',
                borderRadius: '16px',
                marginBottom: '2rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '220px',
                    height: '220px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '50%',
                    filter: 'blur(30px)'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Server size={28} color="#60a5fa" />
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
                            Gestión y Sincronización Masiva
                        </h1>
                    </div>
                    <p style={{ fontSize: '0.95rem', opacity: 0.85, margin: 0 }}>
                        Sincronización en tiempo real desde SAP HANA a Supabase y gestión de expedientes digitales
                    </p>
                </div>
            </div>

            {/* Mode Switcher */}
            <div style={{
                display: 'inline-flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                backgroundColor: 'white',
                padding: '0.4rem',
                borderRadius: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={() => { setMode('sync_sap'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        background: mode === 'sync_sap' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
                        color: mode === 'sync_sap' ? 'white' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.92rem',
                        transition: 'all 0.2s',
                        boxShadow: mode === 'sync_sap' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
                    }}
                >
                    <Sparkles size={18} />
                    Sincronización Automática SAP HANA
                </button>

                <button
                    onClick={() => { setMode('documents'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        background: mode === 'documents' ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'transparent',
                        color: mode === 'documents' ? 'white' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.92rem',
                        transition: 'all 0.2s',
                        boxShadow: mode === 'documents' ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                    }}
                >
                    <FileText size={18} />
                    Carga Masiva de Documentos (PDF / Imágenes)
                </button>

                <button
                    onClick={() => { setMode('excel'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '10px',
                        background: mode === 'excel' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'transparent',
                        color: mode === 'excel' ? 'white' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.92rem',
                        transition: 'all 0.2s',
                        boxShadow: mode === 'excel' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                >
                    <FileSpreadsheet size={18} />
                    Importar Nómina desde Excel
                </button>
            </div>

            {/* TAB 1: SAP HANA Synchronization */}
            {mode === 'sync_sap' && (
                <div style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                        color: 'white'
                    }}>
                        <RefreshCw size={36} className={isSyncing ? 'animate-spin' : ''} />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                        Sincronización con SAP HANA
                    </h2>
                    <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '650px', margin: '0 auto 2rem' }}>
                        Conexión directa al servidor SAP HANA (<code style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>172.1.2.10:30015</code>) esquema <code style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>sapabap1</code>.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
                        <button
                            onClick={() => handleSyncSap('active')}
                            disabled={isSyncing}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 2rem',
                                background: isSyncing ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: isSyncing ? 'not-allowed' : 'pointer',
                                border: 'none',
                                boxShadow: isSyncing ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Sparkles size={18} />
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar Empleados Activos'}
                        </button>

                        <button
                            onClick={() => handleSyncSap('all')}
                            disabled={isSyncing}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 2rem',
                                background: isSyncing ? '#94a3b8' : '#f8fafc',
                                color: isSyncing ? '#cbd5e1' : '#1e293b',
                                border: '1px solid #cbd5e1',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                cursor: isSyncing ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <RefreshCw size={18} />
                            Sincronizar Todos (Activos + Inactivos)
                        </button>
                    </div>

                    {syncProgressMsg && (
                        <div style={{
                            padding: '1rem 1.5rem',
                            backgroundColor: '#eff6ff',
                            borderRadius: '12px',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            fontSize: '0.9rem',
                            maxWidth: '600px',
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                            <RefreshCw size={16} className="animate-spin" />
                            {syncProgressMsg}
                        </div>
                    )}

                    {syncResult && (
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            backgroundColor: syncResult.success ? '#f0fdf4' : '#fef2f2',
                            borderRadius: '12px',
                            border: `1px solid ${syncResult.success ? '#bbf7d0' : '#fecaca'}`,
                            color: syncResult.success ? '#166534' : '#991b1b',
                            maxWidth: '600px',
                            margin: '0 auto 1.5rem',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem'
                        }}>
                            {syncResult.success ? <CheckCircle size={20} color="#16a34a" /> : <AlertCircle size={20} color="#dc2626" />}
                            <div>
                                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                                    {syncResult.success ? 'Sincronización Finalizada con Éxito' : 'Error en la sincronización'}
                                </h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
                                    {syncResult.success 
                                        ? `Se sincronizaron y actualizaron ${syncResult.count} empleados en Supabase.` 
                                        : syncResult.error}
                                </p>
                            </div>
                        </div>
                    )}

                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        fontSize: '0.88rem',
                        color: '#64748b',
                        textAlign: 'left'
                    }}>
                        <h4 style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} /> Requisitos de Red y Parámetros:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                            <li><strong>Red requerida:</strong> Estar conectado a la <strong>red interna de la oficina (172.1.2.10)</strong> o VPN corporativa.</li>
                            <li><strong>Si la web está desplegada en Vercel:</strong> Como Vercel está en la nube pública y no alcanza la IP local de SAP, puedes sincronizar en 1 segundo ejecutando en la terminal de tu máquina en la oficina:
                                <div style={{ marginTop: '0.4rem', backgroundColor: '#1e293b', color: '#38bdf8', padding: '0.4rem 0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                    npm run sync:sap
                                </div>
                            </li>
                            <li style={{ marginTop: '0.5rem' }}><strong>Destino:</strong> Base de datos Supabase (<code style={{ color: '#0284c7' }}>digi_employees</code>).</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* TAB 2: Document Upload */}
            {mode === 'documents' && (
                <div style={{
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        padding: '2.5rem 2rem',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '16px',
                        border: '2px dashed #cbd5e1',
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.3)'
                        }}>
                            <Upload size={28} />
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                            Subir Documentos de Empleados
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                            Los archivos deben incluir la <strong>Cédula</strong> en el nombre del archivo para asignarse automáticamente al expediente del empleado. Ejemplo: <code style={{ backgroundColor: '#e2e8f0', color: '#1e293b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>1726896671.pdf</code>
                        </p>

                        <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            ref={fileInputRef}
                            onChange={handleFilesSelect}
                            style={{ display: 'none' }}
                            id="files-input"
                        />
                        <label htmlFor="files-input">
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.875rem 2rem',
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                }}
                            >
                                <Upload size={18} />
                                Seleccionar Archivos
                            </div>
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>
                                    Archivos seleccionados ({files.length})
                                </h4>
                                <button
                                    onClick={() => setFiles([])}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
                                >
                                    Limpiar lista
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                maxHeight: '220px',
                                overflowY: 'auto',
                                padding: '0.5rem',
                                backgroundColor: '#f8fafc',
                                borderRadius: '10px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '1.25rem'
                            }}>
                                {files.map((file, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.6rem 0.85rem',
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <FileText size={16} color="#4f46e5" />
                                        <span style={{ flex: 1, fontSize: '0.85rem', color: '#334155' }}>{file.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                            {(file.size / 1024).toFixed(0)} KB
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={processFiles}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.875rem 2rem',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <CheckCircle size={18} />
                                Procesar y Asignar Archivos
                            </button>
                        </div>
                    )}

                    {uploadLog.length > 0 && (
                        <div style={{
                            backgroundColor: '#f8fafc',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.75rem' }}>
                                Resultado del Proceso
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '250px', overflowY: 'auto' }}>
                                {uploadLog.map((msg, idx) => (
                                    <div key={idx} style={{
                                        fontSize: '0.85rem',
                                        color: msg.startsWith('✅') ? '#059669' : '#d97706',
                                        fontFamily: 'monospace',
                                        padding: '0.5rem 0.75rem',
                                        backgroundColor: 'white',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Excel Import */}
            {mode === 'excel' && (
                <div style={{
                    background: 'white',
                    padding: '2.5rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                                Carga Masiva de Nómina de Empleados
                            </h2>
                            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                                Sube una planilla Excel (.xlsx) para registrar o actualizar los empleados en Supabase.
                            </p>
                        </div>

                        <button
                            onClick={downloadTemplate}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.65rem 1.25rem',
                                background: '#f8fafc',
                                color: '#334155',
                                border: '1px solid #cbd5e1',
                                borderRadius: '10px',
                                fontSize: '0.88rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            <Download size={16} />
                            Descargar Plantilla Excel
                        </button>
                    </div>

                    <div style={{
                        padding: '2.5rem 2rem',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)',
                        borderRadius: '16px',
                        border: '2px dashed #86efac',
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)'
                        }}>
                            <FileSpreadsheet size={28} />
                        </div>

                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                            Subir Archivo Excel de Empleados
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '550px', margin: '0 auto 1.5rem' }}>
                            Se reconocerán automáticamente columnas como: <code>cedula</code>, <code>nombre</code>, <code>apellido</code>, <code>cargo</code>, <code>fecha_ingreso</code>, <code>pais</code>, <code>ciudad</code>.
                        </p>

                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            ref={excelInputRef}
                            onChange={handleExcelUpload}
                            style={{ display: 'none' }}
                            id="excel-input"
                            disabled={isProcessingExcel}
                        />
                        <label htmlFor="excel-input">
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.875rem 2rem',
                                    background: isProcessingExcel ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: isProcessingExcel ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: isProcessingExcel ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <Upload size={18} />
                                {isProcessingExcel ? 'Procesando archivo...' : 'Seleccionar Excel'}
                            </div>
                        </label>
                    </div>

                    {excelSummary && (
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            backgroundColor: '#f0fdf4',
                            borderRadius: '12px',
                            border: '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            color: '#166534',
                            marginBottom: '1.5rem'
                        }}>
                            <CheckCircle size={24} color="#16a34a" />
                            <div>
                                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '0.95rem' }}>
                                    ¡Importación Completada!
                                </h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                                    Se insertaron / actualizaron {excelSummary.success} registros en la base de datos de Supabase.
                                </p>
                            </div>
                        </div>
                    )}

                    <div style={{
                        padding: '1.25rem 1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.88rem',
                        color: '#475569'
                    }}>
                        <h4 style={{ fontWeight: '600', color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} /> Columnas admitidas en el Excel:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                            <li><strong>Cédula / Identificación:</strong> <code>cedula</code>, <code>ci</code>, <code>id</code>, <code>identificacion</code>.</li>
                            <li><strong>Nombres y Apellidos:</strong> <code>nombre</code>, <code>apellido</code>.</li>
                            <li><strong>Cargo y Fechas:</strong> <code>cargo</code>, <code>position</code>, <code>fecha_ingreso</code>.</li>
                            <li><strong>Ubicación y Área:</strong> <code>pais</code>, <code>ciudad</code>, <code>region</code>, <code>departamento</code>.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
