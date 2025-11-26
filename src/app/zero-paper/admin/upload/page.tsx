'use client';

import { useState, useRef } from 'react';
import { useDoc } from '@/context/DocContext';
import { Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, X, Trash2, PlusCircle, Sparkles, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'next/navigation';

export default function MassUploadPage() {
    const { massImportEmployees, massDeleteEmployees, addDocumentToEmployee, employees } = useDoc();
    const searchParams = useSearchParams();
    const initialMode = searchParams.get('mode') === 'delete' ? 'delete' : 'import';

    const [mode, setMode] = useState<'import' | 'delete'>(initialMode);
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
                        <Sparkles size={32} />
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
                    onClick={() => { setMode('delete'); setStep(1); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.875rem 1.75rem',
                        borderRadius: '12px',
                        background: mode === 'delete' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'transparent',
                        color: mode === 'delete' ? 'white' : '#64748b',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s',
                        boxShadow: mode === 'delete' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (mode !== 'delete') {
                            e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (mode !== 'delete') {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <Trash2 size={20} />
                    Baja / Eliminación
                </button>
            </div>

            {mode === 'import' && (
                <>
                    {/* Enhanced Progress Steps */}
                    <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        marginBottom: '2.5rem',
                        position: 'relative'
                    }}>
                        {/* Connection Line */}
                        <div style={{
                            position: 'absolute',
                            top: '24px',
                            left: '50%',
                            width: '100px',
                            height: '3px',
                            background: step === 2 ? 'linear-gradient(90deg, #667eea, #764ba2)' : '#e2e8f0',
                            transform: 'translateX(-50%)',
                            zIndex: 0
                        }} />

                        <div style={{
                            flex: 1,
                            padding: '1.75rem',
                            borderRadius: '16px',
                            background: step === 1
                                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                : 'white',
                            border: step === 1 ? '2px solid #667eea' : '2px solid #e2e8f0',
                            transition: 'all 0.3s',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: step === 1 ? '0 8px 24px rgba(102, 126, 234, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '0.75rem'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: step === 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: step === 1 ? 'white' : '#94a3b8',
                                    fontWeight: 'bold',
                                    fontSize: '1.25rem',
                                    boxShadow: step === 1 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                                }}>
                                    1
                                </div>
                                <div>
                                    <h3 style={{
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        margin: 0,
                                        marginBottom: '0.25rem',
                                        color: step === 1 ? '#1e40af' : '#64748b'
                                    }}>
                                        Metadatos
                                    </h3>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        margin: 0,
                                        color: step === 1 ? '#3b82f6' : '#94a3b8'
                                    }}>
                                        Importar nómina de empleados (Excel)
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            padding: '1.75rem',
                            borderRadius: '16px',
                            background: step === 2
                                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                                : 'white',
                            border: step === 2 ? '2px solid #667eea' : '2px solid #e2e8f0',
                            transition: 'all 0.3s',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: step === 2 ? '0 8px 24px rgba(102, 126, 234, 0.15)' : '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '0.75rem'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: step === 2 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: step === 2 ? 'white' : '#94a3b8',
                                    fontWeight: 'bold',
                                    fontSize: '1.25rem',
                                    boxShadow: step === 2 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                                }}>
                                    2
                                </div>
                                <div>
                                    <h3 style={{
                                        fontWeight: 'bold',
                                        fontSize: '1.1rem',
                                        margin: 0,
                                        marginBottom: '0.25rem',
                                        color: step === 2 ? '#1e40af' : '#64748b'
                                    }}>
                                        Documentos
                                    </h3>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        margin: 0,
                                        color: step === 2 ? '#3b82f6' : '#94a3b8'
                                    }}>
                                        Carga de archivos y auto-clasificación
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step Content */}
                    {step === 1 ? (
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            padding: '3rem',
                            textAlign: 'center',
                            border: '3px dashed #cbd5e1',
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.borderColor = '#667eea';
                                e.currentTarget.style.backgroundColor = '#f8fafc';
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 2rem',
                                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.25)'
                            }}>
                                <FileSpreadsheet size={40} color="white" />
                            </div>

                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#0f172a',
                                marginBottom: '0.75rem'
                            }}>
                                Sube tu archivo Excel de Empleados
                            </h2>

                            <p style={{
                                fontSize: '1rem',
                                color: '#64748b',
                                marginBottom: '0.5rem'
                            }}>
                                Debe contener las columnas: <strong>id, name, position, entryDate</strong>
                            </p>

                            <p style={{
                                fontSize: '0.875rem',
                                color: '#94a3b8',
                                marginBottom: '2.5rem'
                            }}>
                                Arrastra y suelta tu archivo aquí o haz clic en el botón
                            </p>

                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                                id="excel-input"
                            />
                            <label htmlFor="excel-input">
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem 2.5rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        fontSize: '1rem',
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
                                    Seleccionar Archivo Excel
                                </div>
                            </label>

                            <div style={{
                                marginTop: '2rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                                borderRadius: '12px',
                                border: '1px solid #bfdbfe'
                            }}>
                                <p style={{
                                    fontSize: '0.8rem',
                                    color: '#1e40af',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <AlertCircle size={16} />
                                    Formatos soportados: .xlsx, .xls
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Step 2: Document Upload (previous implementation continues...)
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            padding: '3rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem',
                                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
                                }}>
                                    <CheckCircle size={40} color="white" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                                    ¡Empleados importados exitosamente!
                                </h2>
                                <p style={{ fontSize: '1rem', color: '#10b981', fontWeight: '600' }}>
                                    {importedCount} empleados agregados al sistema
                                </p>
                            </div>

                            <div style={{
                                padding: '2rem',
                                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                borderRadius: '16px',
                                border: '2px dashed #cbd5e1',
                                marginBottom: '2rem'
                            }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginBottom: '1rem' }}>
                                    Ahora carga los documentos
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
                    )}
                </>
            )}

            {mode === 'delete' && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '3rem',
                    textAlign: 'center',
                    border: '3px dashed #fecaca',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)'
                    }}>
                        <Trash2 size={40} color="white" />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.75rem' }}>
                        Eliminación Masiva de Empleados
                    </h2>

                    <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        Sube un archivo Excel con la columna <strong>id</strong> de los empleados a eliminar
                    </p>

                    <p style={{ fontSize: '0.875rem', color: '#ef4444', marginBottom: '2.5rem', fontWeight: '600' }}>
                        ⚠️ Esta acción es irreversible. Ten precaución.
                    </p>

                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        id="delete-input"
                    />
                    <label htmlFor="delete-input">
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem 2.5rem',
                                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                fontWeight: '600',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                            }}
                        >
                            <Upload size={20} />
                            Seleccionar Archivo para Eliminación
                        </div>
                    </label>
                </div>
            )}
        </div>
    );
}
