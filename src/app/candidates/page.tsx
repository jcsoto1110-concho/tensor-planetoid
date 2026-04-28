'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, FileText, User, Download, FileSpreadsheet, Trash2, Mail, RefreshCw } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function CandidatesAdmin() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalUrl, setPortalUrl] = useState('https://superdeporte.com/onboarding')
  const [isMounted, setIsMounted] = useState(false)

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`
  const [errorMsg, setErrorMsg] = useState('')

  // Selección de Pestañas
  const [activeTab, setActiveTab] = useState<'onboarding' | 'seleccion'>('onboarding')
  
  // Datos para Selección
  const [resumes, setResumes] = useState<any[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchCandidates()
    fetchResumes()
  }, [])

  const fetchCandidates = async () => {
    setLoading(true)
    setErrorMsg('')
    const { data, error } = await supabase
      .from('onboarding_candidates')
      .select('*')
      .neq('status', 'DELETED')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase Error:', error)
      setErrorMsg(error.message)
    } else if (data) {
      setCandidates(data)
    }
    setLoading(false)
  }

  const fetchResumes = async () => {
    setLoadingResumes(true)
    const { data, error } = await supabase
      .from('email_resumes')
      .select('*')
      .order('received_date', { ascending: false })
    
    if (!error && data) {
      setResumes(data)
    }
    setLoadingResumes(false)
  }

  const handleScanEmails = async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/scan-emails', { method: 'POST', body: JSON.stringify({}) })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        fetchResumes()
      } else {
        alert('Error al escanear: ' + data.details)
      }
    } catch (err: any) {
      alert('Fallo de red al escanear correos.')
    } finally {
      setScanning(false)
    }
  }

  const handleSyncToOracle = async (id: string) => {
    try {
      const response = await fetch('/api/oracle-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Sincronizado exitosamente:\n- Datos guardados en Oracle\n- PDF descargado al servidor local\n- ' + result.message);
        fetchCandidates();
      } else {
        alert('Error al sincronizar: ' + (result.error || result.details));
      }
    } catch (err: any) {
      alert('Error de conexión con el servidor: ' + err.message);
    }
  }

  const handleDelete = async (id: string, currentCedula: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro de candidato? Esto le permitirá ingresar sus datos nuevamente.')) return;
    
    try {
      const { error } = await supabase
        .from('onboarding_candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Candidato eliminado exitosamente.');
      fetchCandidates();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  const exportToExcel = () => {
    const pendingCandidates = candidates.filter(c => c.status === 'PENDING');
    if (pendingCandidates.length === 0) {
      alert('No hay candidatos pendientes para exportar.');
      return;
    }

    // Aplanar los datos para el Excel
    const flatData = pendingCandidates.map(c => {
      const p = c.datos_personales || {};
      const b = c.datos_bancarios || {};
      const fam = c.cargas_familiares || {};
      const conyuge = fam.conyuge || {};
      const hijos = fam.hijos || [];
      const estudio = (c.estudios && c.estudios.length > 0) ? c.estudios[0] : {};

      // Si el candidato es antiguo y no tiene apellido1 y apellido2 separado, intentamos separar el campo apellidos.
      let ap1 = p.apellido1 || '';
      let ap2 = p.apellido2 || '';
      if (!ap1 && !ap2 && c.apellidos) {
        const parts = c.apellidos.split(' ');
        ap1 = parts[0] || '';
        ap2 = parts.length > 1 ? parts.slice(1).join(' ') : '';
      }

      // El Excel muestra columnas para hasta DOS hijos
      const primerHijo = hijos.length > 0 ? hijos[0] : {};
      const segundoHijo = hijos.length > 1 ? hijos[1] : {};

      return {
        "Timestamp": new Date(c.created_at).toLocaleString(),
        "¿Autoriza el tratamiento de sus datos personales para el proceso de selección y": "Acepto",
        "Tratamiento": p.tratamiento || '',
        "Ingresa tus dos Nombres:": c.nombres || '',
        "Ingresa tu Primer Apellido:": ap1,
        "Ingresa tu Segundo Apellido:": ap2,
        "Ciudad de Nacimiento": p.ciudad_nacimiento || '',
        "Fecha de Nacimiento": p.fecha_nacimiento || '',
        "Estado Civil": p.estado_civil || '',
        "Nacionalidad": p.nacionalidad || '',
        "Número de cédula": c.cedula || '',
        "Número de Cta Banco Produbanco": b.numero_cuenta || '',
        "Tipo de Cta": b.tipo_cuenta || '',
        "Ciudad en la que resides": p.ciudad_residencia || '',
        "Dirección domiciliaria: Detallar Calle principal, numeración y calle transversal": p.direccion || '',
        "N° de teléfono convencional": p.telefono_fijo || 'S/n',
        "En el caso de contar Con cargas Familiares escoge las opciones": hijos.length.toString(),
        "En el caso de tener Cónyuge, ingresa el nombre completo: (2 nombres)": conyuge.tiene ? `${conyuge.nombres || ''} ${conyuge.apellidos || ''}`.trim() : '',
        "Fecha de nacimiento del Cónyuge:": conyuge.fecha_nacimiento || '',
        "Nacionalidad del Cónyuge": conyuge.nacionalidad || '',
        "Ciudad de Nacimiento Cónyuge": conyuge.ciudad_nacimiento || '',
        "Número Cédula Cónyuge": conyuge.cedula || '',
        
        // --- HIJO 1 ---
        "En el caso de tener Hijos, ingrese el nombre completo: (2 nombres)": primerHijo.nombres ? `${primerHijo.nombres} ${primerHijo.apellidos}`.trim() : '',
        "Fecha de nacimiento del Hijo:": primerHijo.fecha_nacimiento || '',
        "Nacionalidad del hijo:": primerHijo.nacionalidad || '',
        "Ciudad de Nacimiento del Hijo": primerHijo.ciudad_nacimiento || '',
        "Número Cédula Hijo": primerHijo.cedula || '',

        // --- HIJO 2 (Columnas duplicadas) ---
        "En el caso de tener Hijos, ingrese el nombre completo: (2 nombres) ": segundoHijo.nombres ? `${segundoHijo.nombres} ${segundoHijo.apellidos}`.trim() : '',
        "Fecha de nacimiento del Hijo: ": segundoHijo.fecha_nacimiento || '',
        "Nacionalidad del hijo: ": segundoHijo.nacionalidad || '',
        "Ciudad de Nacimiento del Hijo ": segundoHijo.ciudad_nacimiento || '',
        "Número Cédula Hijo ": segundoHijo.cedula || '',

        "Estudios:": estudio.nivel || '',
        "Título Obtenido:": estudio.titulo || '',
        "Nombre de Institución Educativa / Universidad :": estudio.institucion || '',
        "Fecha de inicio de estudios:": estudio.fecha_inicio || '',
        "Fecha de fin de estudios:": estudio.fecha_fin || '',
        "Número de celular": p.celular || c.telefono || '',
        "Correo electrónico": c.email || '',
        
        // --- COLUMNAS FINALES DE APELLIDOS (SOLO CABECERAS, SIN DATOS) ---
        "En el caso de tener Cónyuge, ingresa el apellido completo: (2 apellidos)": '',
        "En el caso de tener hijos, ingresa el apellido completo: (2 apellidos)": '',
        "En el caso de tener hijos, ingresa el apellido completo: (2 apellidos) ": ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidatos Pendientes");
    XLSX.writeFile(workbook, "Candidatos_Pendientes_Onboarding.xlsx");
  }

  if (!isMounted) return null;

  return (
    <>
      <style>{`
        .admin-container { padding: 32px; background-color: #f9fafb; min-height: 100vh; font-family: system-ui, sans-serif; color: #111827; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; }
        .admin-title { font-size: 24px; font-weight: bold; margin: 0 0 4px; }
        .admin-subtitle { color: #6b7280; font-size: 14px; margin: 0; }
        
        .qr-card { background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; display: flex; align-items: center; gap: 24px; }
        .qr-input-group { display: flex; flex-direction: column; }
        .qr-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
        .qr-input { border: 1px solid #d1d5db; border-radius: 4px; padding: 6px 10px; font-size: 14px; width: 280px; }
        .qr-input:focus { outline: none; border-color: #3b82f6; }
        .qr-image-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .qr-img { width: 64px; height: 64px; border: 1px solid #e5e7eb; border-radius: 4px; }
        .qr-download { font-size: 11px; color: #2563eb; font-weight: bold; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .qr-download:hover { text-decoration: underline; }

        .tabs-nav { display: flex; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
        .tab-btn { padding: 12px 24px; background: none; border: none; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s; }
        .tab-btn:hover { color: #111827; }
        .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }

        .table-container { background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background-color: #f3f4f6; color: #4b5563; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 12px 24px; border-bottom: 1px solid #e5e7eb; }
        td { padding: 16px 24px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
        tr:last-child td { border-bottom: none; }
        
        .user-cell { display: flex; align-items: center; gap: 16px; }
        .user-avatar { width: 40px; height: 40px; background-color: #dbeafe; color: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .user-name { font-size: 14px; font-weight: 600; color: #111827; margin: 0 0 2px; }
        .user-email { font-size: 13px; color: #6b7280; margin: 0; }
        
        .status-badge { display: inline-flex; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .status-synced { background-color: #dcfce7; color: #166534; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        
        .action-btn { background: none; border: none; color: #4f46e5; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: flex-end; gap: 6px; cursor: pointer; width: 100%; text-align: right; }
        .action-btn:hover { color: #312e81; }
        
        .action-btn-danger { background: none; border: none; color: #ef4444; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: flex-end; gap: 6px; cursor: pointer; width: 100%; text-align: right; }
        .action-btn-danger:hover { color: #b91c1c; }
        
        .pdf-link { color: #2563eb; font-size: 14px; display: flex; align-items: center; gap: 6px; text-decoration: none; }
        .pdf-link:hover { color: #1d4ed8; text-decoration: underline; }
      `}</style>

      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Candidatos Registrados</h1>
            <p className="admin-subtitle">Portal de Onboarding - Zero Paper</p>
            <button onClick={exportToExcel} style={{ marginTop: '16px', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} /> Exportar Pendientes (Excel)
            </button>
          </div>

          <div className="qr-card">
            <div className="qr-input-group">
              <label className="qr-label">Enlace para Candidatos</label>
              <input 
                type="text" 
                value={portalUrl} 
                onChange={e => setPortalUrl(e.target.value)} 
                className="qr-input"
              />
            </div>
            <div className="qr-image-container">
              <img src={qrCodeUrl} alt="QR Code" className="qr-img" />
              <a href={qrCodeUrl} download="QR_Onboarding.png" target="_blank" rel="noreferrer" className="qr-download">
                <Download size={12} /> Descargar QR
              </a>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 'bold', margin: '0 0 8px' }}>Error al conectar con Supabase:</h3>
            <p style={{ margin: 0 }}>{errorMsg}</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Verifica si corriste el script <code>setup_onboarding.sql</code> en el dashboard de Supabase y si las políticas de lectura (RLS) permiten acceso público.</p>
          </div>
        )}

        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveTab('onboarding')}
          >
            Formularios de Ingreso (Onboarding)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'seleccion' ? 'active' : ''}`}
            onClick={() => setActiveTab('seleccion')}
          >
            Bandeja de Hojas de Vida (Selección)
          </button>
        </div>

        {activeTab === 'onboarding' && (
          <>
            {loading ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Cargando candidatos...</p>
            ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Candidato</th>
                  <th>Cédula</th>
                  <th>Cargas Familiares</th>
                  <th>Documentos</th>
                  <th>Estado Oracle</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar"><User size={20} /></div>
                        <div>
                          <p className="user-name">{c.nombres} {c.apellidos}</p>
                          <p className="user-email">{c.email} • {c.telefono}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '14px', color: '#4b5563' }}>{c.cedula}</td>
                    <td style={{ fontSize: '14px', color: '#4b5563' }}>
                      {c.cargas_familiares?.conyuge ? '1 Cónyuge, ' : ''}
                      {c.cargas_familiares?.hijos?.length || 0} Hijos
                    </td>
                    <td>
                      {c.documento_pdf_url && (
                        <a href={c.documento_pdf_url} target="_blank" rel="noreferrer" className="pdf-link">
                          <FileText size={16} /> Ver PDF
                        </a>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${c.status === 'SYNCED' ? 'status-synced' : 'status-pending'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                      {c.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleSyncToOracle(c.id)} className="action-btn">
                            <CheckCircle2 size={16} /> Aprobar y Enviar a Oracle
                          </button>
                          <button onClick={() => handleDelete(c.id, c.cedula)} className="action-btn-danger">
                            <Trash2 size={16} /> Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                      No hay candidatos registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            )}
          </>
        )}

        {activeTab === 'seleccion' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Hojas de vida extraídas desde el correo de Selección.</p>
              <button 
                onClick={handleScanEmails} 
                disabled={scanning}
                style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: scanning ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: scanning ? 0.7 : 1 }}
              >
                <RefreshCw size={16} className={scanning ? "animate-spin" : ""} /> 
                {scanning ? 'Escaneando Correo...' : 'Buscar Nuevos Correos'}
              </button>
            </div>

            {loadingResumes ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Cargando hojas de vida...</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Remitente</th>
                      <th>Asunto</th>
                      <th>Fecha Recibido</th>
                      <th>Archivo Adjunto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumes.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}><Mail size={20} /></div>
                            <div>
                              <p className="user-name">{r.sender_name || 'Sin Nombre'}</p>
                              <p className="user-email">{r.sender_email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '14px', color: '#4b5563', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subject}</td>
                        <td style={{ fontSize: '14px', color: '#4b5563' }}>{new Date(r.received_date).toLocaleDateString()}</td>
                        <td>
                          {r.pdf_url && (
                            <a href={r.pdf_url} target="_blank" rel="noreferrer" className="pdf-link">
                              <FileText size={16} /> Ver CV
                            </a>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge status-pending`}>
                            {r.classification_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {resumes.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
                          Aún no se han escaneado correos. Haz clic en "Buscar Nuevos Correos".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
