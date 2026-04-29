'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, FileText, User, Download, FileSpreadsheet, Trash2, Mail, RefreshCw, Brain, Settings, Search, MapPin, Briefcase, Trophy, Star, Save, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function CandidatesAdmin() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalUrl, setPortalUrl] = useState('https://superdeporte.com/onboarding')
  const [isMounted, setIsMounted] = useState(false)

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`
  const [errorMsg, setErrorMsg] = useState('')

  // Selección de Pestañas
  const [activeTab, setActiveTab] = useState<'onboarding' | 'seleccion' | 'ranking'>('onboarding')
  
  // Datos para Selección
  const [resumes, setResumes] = useState<any[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [openAiKey, setOpenAiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Filtros de Búsqueda
  const [filterCity, setFilterCity] = useState('')
  const [filterPosition, setFilterPosition] = useState('')

  // === RANKING POR CARGO ===
  const [jobPositions, setJobPositions] = useState<any[]>([])
  const [rankingCargo, setRankingCargo] = useState('')
  const [rankingCiudad, setRankingCiudad] = useState('')
  const [rankingFunciones, setRankingFunciones] = useState('')
  const [rankingResults, setRankingResults] = useState<any[]>([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const [rankingError, setRankingError] = useState('')
  const [savingPosition, setSavingPosition] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchCandidates()
    fetchResumes()
    fetchJobPositions()
  }, [])

  const fetchJobPositions = async () => {
    const { data } = await supabase.from('job_positions').select('*').order('created_at', { ascending: false })
    if (data) setJobPositions(data)
  }

  const handleSavePosition = async () => {
    if (!rankingCargo || !rankingFunciones) return
    setSavingPosition(true)
    await supabase.from('job_positions').insert({ cargo: rankingCargo, ciudad: rankingCiudad, funciones: rankingFunciones })
    await fetchJobPositions()
    setSavingPosition(false)
  }

  const handleLoadPosition = (pos: any) => {
    setRankingCargo(pos.cargo)
    setRankingCiudad(pos.ciudad || '')
    setRankingFunciones(pos.funciones)
  }

  const handleRankCandidates = async () => {
    if (!rankingCargo || !rankingFunciones) {
      setRankingError('Debes ingresar el cargo y sus funciones.')
      return
    }
    if (!openAiKey) {
      setShowSettings(true)
      return
    }
    setRankingLoading(true)
    setRankingError('')
    setRankingResults([])
    try {
      const res = await fetch('/api/rank-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargo: rankingCargo, ciudad: rankingCiudad, funciones: rankingFunciones, apiKey: openAiKey })
      })
      const data = await res.json()
      if (res.ok) {
        setRankingResults(data.rankings)
      } else {
        setRankingError(data.error || 'Error al evaluar candidatos.')
      }
    } catch (e: any) {
      setRankingError('Error de red: ' + e.message)
    } finally {
      setRankingLoading(false)
    }
  }

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
        alert('Error al escanear: ' + data.details + '\nRespuesta del Servidor: ' + (data.serverResponse || 'Revisa la terminal'))
      }
    } catch (err: any) {
      alert('Fallo de red al escanear correos.')
    } finally {
      setScanning(false)
    }
  }

  const handleAnalyzeResume = async (id: string) => {
    if (!openAiKey) {
      alert('Por favor, ingresa tu API Key de OpenAI haciendo clic en el icono de engranaje (⚙️).')
      setShowSettings(true)
      return
    }

    setAnalyzingId(id)
    try {
      const res = await fetch('/api/analyze-resume', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, apiKey: openAiKey }) 
      })
      const data = await res.json()
      
      if (res.ok) {
        fetchResumes() // Recargar datos
      } else {
        alert('Error de IA: ' + data.error + '\nDetalles: ' + (data.details || ''))
      }
    } catch (err) {
      alert('Error de conexión con la IA.')
    } finally {
      setAnalyzingId(null)
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
        
        .ai-btn { background: #8b5cf6; color: white; border: none; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: 0.2s; }
        .ai-btn:hover { background: #7c3aed; }
        .ai-btn:disabled { background: #c4b5fd; cursor: wait; }

        .ai-summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; font-size: 13px; color: #475569; margin-top: 8px; font-style: italic; }
        .ai-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; margin-right: 8px; margin-bottom: 4px; }
        .ai-tag.city { background: #fce7f3; color: #be185d; }

        .filter-bar { display: flex; gap: 16px; margin-bottom: 16px; background: white; padding: 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; align-items: center; }
        .filter-input { flex: 1; display: flex; align-items: center; gap: 8px; border: 1px solid #d1d5db; padding: 8px 12px; border-radius: 6px; }
        .filter-input input { border: none; outline: none; width: 100%; font-size: 14px; }

        .settings-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; }
        .settings-content { background: white; padding: 24px; border-radius: 8px; width: 400px; box-shadow: 0 10px 15px rgba(0,0,0,0.1); }

        .pdf-link { color: #2563eb; font-size: 14px; display: flex; align-items: center; gap: 6px; text-decoration: none; }
        .pdf-link:hover { color: #1d4ed8; text-decoration: underline; }

        /* === RANKING STYLES === */
        .ranking-layout { display: grid; grid-template-columns: 340px 1fr; gap: 24px; align-items: flex-start; }
        @media (max-width: 900px) { .ranking-layout { grid-template-columns: 1fr; } }
        .ranking-form-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); position: sticky; top: 24px; }
        .ranking-form-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 18px; display: flex; align-items: center; gap: 8px; }
        .ranking-label { display: block; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .ranking-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 14px; box-sizing: border-box; transition: border-color 0.2s; }
        .ranking-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
        .ranking-textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 13px; resize: vertical; min-height: 140px; box-sizing: border-box; line-height: 1.5; transition: border-color 0.2s; font-family: inherit; }
        .ranking-textarea:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
        .ranking-btn-primary { width: 100%; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: white; border: none; padding: 11px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: opacity 0.2s; }
        .ranking-btn-primary:hover { opacity: 0.9; }
        .ranking-btn-primary:disabled { opacity: 0.55; cursor: wait; }
        .ranking-btn-secondary { flex: 1; background: white; color: #374151; border: 1px solid #d1d5db; padding: 9px 12px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
        .ranking-btn-secondary:hover { background: #f9fafb; }
        .ranking-select { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 12px; font-size: 13px; background: white; cursor: pointer; }
        .score-bar-wrap { background: #f3f4f6; border-radius: 9999px; height: 8px; width: 120px; overflow: hidden; display: inline-block; vertical-align: middle; }
        .score-bar-fill { height: 8px; border-radius: 9999px; transition: width 0.6s ease; }
        .medal-badge { font-size: 22px; line-height: 1; }
        .rank-row { border-bottom: 1px solid #f3f4f6; }
        .rank-row:hover { background: #fafafa; }
        .rank-number { width: 48px; text-align: center; font-size: 13px; font-weight: 700; color: #6b7280; }
        .justification-text { font-size: 12px; color: #6b7280; font-style: italic; margin-top: 4px; line-height: 1.4; }
      `}</style>

      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Configuración de IA (Claude)</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Ingresa tu API Key de Anthropic Claude para habilitar el motor de lectura inteligente de Hojas de Vida.</p>
            <input 
              type="password" 
              placeholder="sk-ant-..." 
              value={openAiKey}
              onChange={e => setOpenAiKey(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

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
          <button 
            className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
            style={{ color: activeTab === 'ranking' ? '#7c3aed' : undefined, borderBottomColor: activeTab === 'ranking' ? '#7c3aed' : undefined }}
          >
            🏆 Selección por Cargo (IA)
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
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setShowSettings(true)} 
                  style={{ backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={handleScanEmails} 
                  disabled={scanning}
                  style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: scanning ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: scanning ? 0.7 : 1 }}
                >
                  <RefreshCw size={16} className={scanning ? "animate-spin" : ""} /> 
                  {scanning ? 'Escaneando Correo...' : 'Buscar Nuevos Correos'}
                </button>
              </div>
            </div>

            <div className="filter-bar">
              <div className="filter-input">
                <Briefcase size={18} color="#6b7280" />
                <input 
                  type="text" 
                  placeholder="Filtrar por cargo (ej. Vendedor, Gerente)..." 
                  value={filterPosition} 
                  onChange={e => setFilterPosition(e.target.value)} 
                />
              </div>
              <div className="filter-input">
                <MapPin size={18} color="#6b7280" />
                <input 
                  type="text" 
                  placeholder="Filtrar por ciudad (ej. Quito)..." 
                  value={filterCity} 
                  onChange={e => setFilterCity(e.target.value)} 
                />
              </div>
            </div>

            {loadingResumes ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '40px' }}>Cargando hojas de vida...</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Perfil IA</th>
                      <th>Archivo CV</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumes
                      .filter(r => filterPosition ? (r.position || '').toLowerCase().includes(filterPosition.toLowerCase()) : true)
                      .filter(r => filterCity ? (r.city || '').toLowerCase().includes(filterCity.toLowerCase()) : true)
                      .map((r) => (
                      <tr key={r.id}>
                        <td style={{ width: '50%' }}>
                          <div className="user-cell" style={{ alignItems: 'flex-start' }}>
                            <div className="user-avatar" style={{ backgroundColor: r.classification_status === 'REVIEWED' ? '#f0fdf4' : '#f3e8ff', color: r.classification_status === 'REVIEWED' ? '#16a34a' : '#9333ea' }}>
                              {r.classification_status === 'REVIEWED' ? <Brain size={20} /> : <Mail size={20} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p className="user-name">{r.sender_name || 'Sin Nombre'} <span style={{ color: '#9ca3af', fontWeight: 'normal', fontSize: '12px' }}>({r.sender_email})</span></p>
                              <p className="user-email" style={{ marginBottom: '8px' }}>Asunto: {r.subject}</p>
                              
                              {r.classification_status === 'REVIEWED' ? (
                                <div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                    <span className="ai-tag city"><MapPin size={12} /> {r.city}</span>
                                    <span className="ai-tag"><Briefcase size={12} /> {r.position}</span>
                                    {r.experience_years && <span className="ai-tag" style={{ background: '#fef9c3', color: '#854d0e' }}>⏱ {r.experience_years}</span>}
                                    {r.education_level && <span className="ai-tag" style={{ background: '#f0fdf4', color: '#166534' }}>🎓 {r.education_level}</span>}
                                    {r.age && r.age !== 'No especificada' && <span className="ai-tag" style={{ background: '#ede9fe', color: '#6d28d9' }}>👤 {r.age}</span>}
                                    {r.availability && <span className="ai-tag" style={{ background: '#fff7ed', color: '#c2410c' }}>📅 {r.availability}</span>}
                                  </div>
                                  {r.skills && <p style={{ fontSize: '12px', color: '#4b5563', margin: '4px 0' }}>🛠 <strong>Skills:</strong> {r.skills}</p>}
                                  {r.languages && <p style={{ fontSize: '12px', color: '#4b5563', margin: '4px 0' }}>🌐 <strong>Idiomas:</strong> {r.languages}</p>}
                                  <div className="ai-summary-box">"{r.ai_summary}"</div>
                                </div>
                              ) : (
                                <button 
                                  className="ai-btn" 
                                  onClick={() => handleAnalyzeResume(r.id)}
                                  disabled={analyzingId === r.id}
                                >
                                  <Brain size={14} /> {analyzingId === r.id ? 'Analizando (IA)...' : 'Analizar con IA'}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {r.pdf_url && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <a href={r.pdf_url} target="_blank" rel="noreferrer" className="pdf-link">
                                <FileText size={16} /> Ver CV
                              </a>
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.file_name}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '13px', color: '#4b5563' }}>{new Date(r.received_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${r.classification_status === 'REVIEWED' ? 'status-synced' : 'status-pending'}`}>
                            {r.classification_status === 'REVIEWED' ? 'REVISADO' : 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {resumes.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
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

        {activeTab === 'ranking' && (
          <div className="ranking-layout">

            {/* ---- PANEL IZQUIERDO: FORMULARIO ---- */}
            <div className="ranking-form-card">
              <p className="ranking-form-title"><Trophy size={18} color="#7c3aed" /> Definir Cargo Vacante</p>

              {jobPositions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="ranking-label">Cargar cargo guardado</label>
                  <select
                    className="ranking-select"
                    defaultValue=""
                    onChange={e => {
                      const pos = jobPositions.find((p: any) => p.id === e.target.value)
                      if (pos) handleLoadPosition(pos)
                    }}
                  >
                    <option value="">-- Selecciona un cargo --</option>
                    {jobPositions.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.cargo} {p.ciudad ? `· ${p.ciudad}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label className="ranking-label">Nombre del cargo *</label>
                <input id="ranking-cargo" className="ranking-input" type="text" placeholder="Ej: Cajero, Vendedor, Bodeguero..." value={rankingCargo} onChange={e => setRankingCargo(e.target.value)} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="ranking-label">Ciudad objetivo</label>
                <input id="ranking-ciudad" className="ranking-input" type="text" placeholder="Ej: Quito, Guayaquil..." value={rankingCiudad} onChange={e => setRankingCiudad(e.target.value)} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="ranking-label">Funciones y requisitos del cargo *</label>
                <textarea
                  id="ranking-funciones"
                  className="ranking-textarea"
                  placeholder="Describe las funciones principales, requisitos de experiencia, nivel educativo mínimo, habilidades clave..."
                  value={rankingFunciones}
                  onChange={e => setRankingFunciones(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <button
                  id="btn-save-position"
                  className="ranking-btn-secondary"
                  onClick={handleSavePosition}
                  disabled={savingPosition || !rankingCargo || !rankingFunciones}
                >
                  <Save size={14} /> {savingPosition ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

              <button
                id="btn-rank-candidates"
                className="ranking-btn-primary"
                onClick={handleRankCandidates}
                disabled={rankingLoading}
              >
                <Brain size={16} />
                {rankingLoading ? 'Evaluando candidatos...' : 'Evaluar con IA'}
              </button>

              {rankingError && (
                <div style={{ marginTop: '14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  {rankingError}
                </div>
              )}

              {rankingLoading && (
                <div style={{ marginTop: '16px', textAlign: 'center', color: '#7c3aed', fontSize: '13px' }}>
                  <RefreshCw size={16} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: '6px' }} />
                  La IA está analizando todos los perfiles...
                </div>
              )}
            </div>

            {/* ---- PANEL DERECHO: RESULTADOS ---- */}
            <div>
              {rankingResults.length > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700' }}>Ranking de Candidatos</h2>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '13px' }}>Cargo: <strong>{rankingCargo}</strong>{rankingCiudad ? ` · ${rankingCiudad}` : ''} · {rankingResults.length} candidatos evaluados</p>
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '48px', textAlign: 'center' }}>#</th>
                          <th>Candidato</th>
                          <th>Ciudad</th>
                          <th>Perfil detectado</th>
                          <th>Puntaje IA</th>
                          <th>CV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingResults.map((r, idx) => {
                          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`
                          const scoreColor = r.score >= 75 ? '#16a34a' : r.score >= 50 ? '#d97706' : '#dc2626'
                          const barColor = r.score >= 75 ? '#22c55e' : r.score >= 50 ? '#f59e0b' : '#ef4444'
                          return (
                            <tr key={r.id} className="rank-row">
                              <td className="rank-number">
                                {idx < 3 ? <span className="medal-badge">{medal}</span> : <span>{medal}</span>}
                              </td>
                              <td>
                                <div className="user-cell" style={{ alignItems: 'flex-start' }}>
                                  <div className="user-avatar" style={{ background: '#f3e8ff', color: '#9333ea', flexShrink: 0 }}><User size={18}/></div>
                                  <div>
                                    <p className="user-name" style={{ marginBottom: '2px' }}>{r.sender_name || 'Sin nombre'}</p>
                                    <p className="user-email">{r.sender_email}</p>
                                    <p className="justification-text">{r.justification}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontSize: '13px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                                <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{r.city || '—'}
                              </td>
                              <td>
                                {r.position && <span className="ai-tag"><Briefcase size={11}/> {r.position}</span>}
                                {r.experience_years && <span className="ai-tag" style={{ background: '#fef9c3', color: '#854d0e' }}>⏱ {r.experience_years}</span>}
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div className="score-bar-wrap">
                                    <div className="score-bar-fill" style={{ width: `${r.score}%`, background: barColor }} />
                                  </div>
                                  <span style={{ fontWeight: '700', fontSize: '14px', color: scoreColor }}>{r.score}</span>
                                </div>
                              </td>
                              <td>
                                {r.pdf_url ? (
                                  <a href={r.pdf_url} target="_blank" rel="noreferrer" className="pdf-link"><FileText size={15}/> Ver CV</a>
                                ) : <span style={{ color: '#9ca3af', fontSize: '12px' }}>Sin CV</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                !rankingLoading && (
                  <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                    <Trophy size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: '#9ca3af', margin: '0 0 8px', fontSize: '16px' }}>Sin resultados aún</h3>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Completa el formulario y haz clic en <strong>"Evaluar con IA"</strong> para ver el ranking de candidatos.</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
