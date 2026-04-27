'use client';

import { useState, useRef } from 'react';
import { useDoc } from '@/context/DocContext';
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, X, Trash2, PlusCircle, Sparkles, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'next/navigation';

export default function MassUploadPage() {
    const { massImportEmployees, massDeleteEmployees, addDocumentToEmployee, employees, syncEmployees } = useDoc();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get('mode') === 'delete' ? 'delete' : 'import';

    const [mode, setMode] = useState<'import' | 'sync'>(initialMode === 'delete' ? 'import' : initialMode as any);
    const [isSyncing, setIsSyncing] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [importedCount, setImportedCount] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [uploadLog, setUploadLog] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (mode === 'import') {
                massImportEmployees(data);
                setImportedCount(data.length);
                alert(`Se importaron ${data.length} empleados exitosamente.`);
                setStep(2);
            } else {
                if (confirm(`¿Estás seguro de que deseas eliminar los empleados listados en este archivo? (${data.length} registros detectados)`)) {
                    massDeleteEmployees(data);
                    alert(`Proceso de eliminación completado.`);
                }
            }
        };
        reader.readAsBinaryString(file);
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
                log.push(`⚠️ ${file.name} -> No se encontró coincidencia con ninguna CI (Cédula) de empleado activo.`);
            }
        });

        setUploadLog(log);
        alert(`Proceso completado. ${successCount} archivos asignados correctamente.`);
        setFiles([]);
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
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    filter: 'blur(40px)'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: 0 }}>
                            Gestión Masiva
                        </h1>
                    </div>
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        Importa empleados y documenta en segundos con nuestra plataforma inteligente
                    </p>
                </div>
            </div>

            {/* Modern Mode Switcher */}
            <div style={{
                display: 'inline-flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                backgroundColor: 'white',
                padding: '0.5rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0'
            }}>
                <button
                    onClick={() => { setMode('import'); setStep(1); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.875rem 1.75rem',
                        borderRadius: '12px',
                        background: mode === 'import' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                        color: mode === 'import' ? 'white' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s',
                        boxShadow: mode === 'import' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (mode !== 'import') {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (mode !== 'import') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <PlusCircle size={20} />
                    Carga / Alta
                </button>
                <button
                    onClick={() => { setMode('sync'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.875rem 1.75rem',
                        borderRadius: '12px',
                        background: mode === 'sync' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 'transparent',
                        color: mode === 'sync' ? 'white' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s',
                        boxShadow: mode === 'sync' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
                    }}
                >
                    <Sparkles size={20} />
                    Sincronizar RRHH (Oracle)
                </button>
            </div>

            {mode === 'import' && (
                <>
                    {/* Simplified Header for Document Upload */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        padding: '2rem',
                        marginBottom: '2rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '1.25rem',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                            }}>
                                <FileText size={24} />
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                            Carga de Documentos
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Selecciona los archivos PDF/Imágenes para procesar
                        </p>
                    </div>

                    {/* Content for Document Upload */}
                    <div style={{
                        background: 'white',
                        padding: '3rem',
                        borderRadius: '24px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            padding: '2rem',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '16px',
                            border: '2px dashed #cbd5e1',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                                Carga los documentos
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                Los archivos deben incluir la CI (Cédula) del empleado en el nombre. Ejemplo: <code style={{ backgroundColor: '#667eea', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>1726896671.pdf</code>
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
                                        padding: '1rem 2rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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
                                    <Upload size={20} />
                                    Seleccionar Archivos
                                </div>
                            </label>
                        </div>

                        {files.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                                    Archivos seleccionados ({files.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
                                    {files.map((file, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            backgroundColor: '#f8fafc',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            <FileText size={18} color="#667eea" />
                                            <span style={{ flex: 1, fontSize: '0.875rem', color: '#475569' }}>{file.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {(file.size / 1024).toFixed(0)} KB
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={processFiles}
                                    style={{
                                        marginTop: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '1rem 2rem',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                                    }}
                                >
                                    <CheckCircle size={20} />
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
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                                    Resultado del proceso
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                    {uploadLog.map((msg, idx) => (
                                        <div key={idx} style={{
                                            fontSize: '0.875rem',
                                            color: msg.startsWith('✅') ? '#059669' : '#f59e0b',
                                            fontFamily: 'monospace',
                                            padding: '0.5rem',
                                            backgroundColor: 'white',
                                            borderRadius: '6px'
                                        }}>
                                            {msg}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {mode === 'sync' && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '3rem',
                    textAlign: 'center',
                    border: '3px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.25)'
                    }}>
                        <Sparkles size={40} color="white" />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '1rem' }}>
                        Sincronización Automática con RRHH
                    </h2>

                    <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem' }}>
                        Esta acción importará y actualizará la nómina de empleados directamente desde la tabla <code style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>ms_colaboradores</code> de Oracle.
                    </p>

                    <button
                        onClick={async () => {
                            setIsSyncing(true);
                            const result = await syncEmployees();
                            setIsSyncing(false);
                            if (result.success) {
                                alert(`Sincronización exitosa. Se procesaron ${result.count} empleados.`);
                            } else {
                                alert(`Error en la sincronización: ${result.error}`);
                            }
                        }}
                        disabled={isSyncing}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem 2.5rem',
                            background: isSyncing ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            color: 'white',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: isSyncing ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            border: 'none',
                            boxShadow: isSyncing ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        {isSyncing ? 'Sincronizando...' : 'Iniciar Sincronización Ahora'}
                    </button>
                    
                    <div style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        color: '#64748b',
                        textAlign: 'left'
                    }}>
                        <h4 style={{ fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} /> Reglas de sincronización:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                            <li>Solo se importan empleados con <code style={{ color: '#8b5cf6' }}>estado = 1</code> (Activos).</li>
                            <li><strong>Bajas Automáticas:</strong> Los empleados que no estén en el origen serán marcados como <code style={{ color: '#ef4444' }}>Inactivos</code> automáticamente.</li>
                            <li>Se sincroniza: Nombre, Cargo, Fecha Ingreso, Empresa y Ubicación (Unidad de Negocio).</li>
                            <li>Si el empleado ya existe, se actualizarán sus datos actuales.</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
