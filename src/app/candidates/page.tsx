'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, FileText, User, Download, FileSpreadsheet, Trash2, Mail, RefreshCw, Brain, Settings, MapPin, Briefcase, Trophy, Save, X, UploadCloud, Clock, LogOut } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function CandidatesAdmin() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalUrl, setPortalUrl] = useState(`https://${user?.company_slug || 'superdeporte'}.com/onboarding`)
  const [isMounted, setIsMounted] = useState(false)

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`
  const [errorMsg, setErrorMsg] = useState('')

  // Selección de Pestañas
  const [activeTab, setActiveTab] = useState<'onboarding' | 'seleccion' | 'ranking' | 'pipeline' | 'estadisticas' | 'nomina'>('seleccion')
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [viewingOnboarding, setViewingOnboarding] = useState<any | null>(null)
  const [rejectionModal, setRejectionModal] = useState<{ id: string; email: string; name: string } | null>(null)
  const [rejectionObs, setRejectionObs] = useState('')
  
  // Datos para Selección
  const [resumes, setResumes] = useState<any[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
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
  const [showJobMaintenance, setShowJobMaintenance] = useState(false)
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null)

  // === SEGUIMIENTO DE CANDIDATOS ===
  const [trackingMap, setTrackingMap] = useState<Record<string, any>>({})
  const [trackingUpdating, setTrackingUpdating] = useState<string | null>(null)
  const [interviewModal, setInterviewModal] = useState<{ id: string; name: string; resumeId: string; cargo: string } | null>(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('09:00')
  const [interviewNotes, setInterviewNotes] = useState('Cita en las Av Galo Plaza Lasso 13205 de los Ceresos.')

  // === PIPELINE GLOBAL ===
  const [pipelineData, setPipelineData] = useState<any[]>([])
  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [pipelineFilter, setPipelineFilter] = useState('ALL')
  const [pipelineCargoFilter, setPipelineCargoFilter] = useState('')
  const [pipelineUpdating, setPipelineUpdating] = useState<string | null>(null)

  // === BANDEJA FILTERS ===
  const [inboxSearch, setInboxSearch] = useState('')
  const [inboxCargo, setInboxCargo] = useState('')
  const [inboxCity, setInboxCity] = useState('')
  const [inboxExp, setInboxExp] = useState('')
  const [openAiKey, setOpenAiKey] = useState('')

  useEffect(() => {
    setIsMounted(true)
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      const savedKey = localStorage.getItem('openai_api_key')
      if (savedKey) setOpenAiKey(savedKey)
      fetchCandidates()
      fetchResumes()
      fetchJobPositions()
      fetchPipeline()
    }
  }, [user])

  const fetchPipeline = async () => {
    if (!user) return
    setPipelineLoading(true)
    const res = await fetch('/api/candidate-tracking')
    const data = await res.json()
    if (data.data) {
      // Filtrar por empresa y por usuario individual para el resumen
      setPipelineData(data.data.filter((p: any) => 
        p.company_slug === user.company_slug && 
        p.created_by_cedula === user.cedula
      ))
    }
    setPipelineLoading(false)
  }

  const updatePipelineStatus = async (trackingId: string, resumeId: string, cargo: string, status: string, interview_date?: string, notes?: string) => {
    setPipelineUpdating(trackingId)
    const res = await fetch('/api/candidate-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_id: resumeId, cargo, status, interview_date, notes, created_by_cedula: user?.cedula })
    })
    const result = await res.json()
    if (result.success) {
      setPipelineData(prev => prev.map(p => p.id === trackingId ? { ...p, status, interview_date: interview_date || p.interview_date, notes: notes || p.notes } : p))
      
      if (status === 'ENTREVISTA_APROBADA') {
        handleSendApprovalEmail(resumeId)
      }
    }
    setPipelineUpdating(null)
  }

  const handleSendApprovalEmail = async (resumeId: string) => {
    let candidate = resumes.find(r => r.id === resumeId);
    if (!candidate) {
      candidate = rankingResults.find(r => r.id === resumeId);
    }
    if (!candidate) {
      const pipeEntry = pipelineData.find(p => p.resume_id === resumeId);
      candidate = pipeEntry?.candidate;
    }

    if (!candidate || !candidate.sender_email) return;

    try {
      const names = (candidate.sender_name || candidate.name || '').split(' ');
      const candidatePayload = {
        email: candidate.sender_email,
        nombres: names[0] || '',
        apellidos: names.slice(1).join(' ') || '',
        telefono: candidate.sender_phone || '',
        cedula: `PENDIENTE-${candidate.sender_email}`,
        cargo: candidate.position || (pipelineData.find(p => p.resume_id === resumeId)?.cargo) || '',
        status: 'PENDING',
        created_by_cedula: user?.cedula,
        company_slug: user?.company_slug
      };

      const { data: existing } = await supabase.from('onboarding_candidates').select('id').eq('email', candidate.sender_email).single();

      let onboardErr;
      if (existing) {
        const { error } = await supabase.from('onboarding_candidates').update(candidatePayload).eq('id', existing.id);
        onboardErr = error;
      } else {
        const { error } = await supabase.from('onboarding_candidates').insert(candidatePayload);
        onboardErr = error;
      }

      if (onboardErr) throw new Error("Error al registrar en Onboarding: " + onboardErr.message);
      
      fetchCandidates(); 

      const mailRes = await fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidate.sender_name || candidate.name,
          candidateEmail: candidate.sender_email
        })
      });

      const mailData = await mailRes.json();
      if (!mailRes.ok) {
        alert("⚠️ El candidato fue registrado en Onboarding, pero el correo no pudo enviarse: " + (mailData.error || "Error de servidor SMTP"));
      } else {
        alert("✅ Proceso completado: Candidato registrado y correo enviado con éxito.");
      }

    } catch (error: any) {
      console.error("Error en proceso de aprobación:", error);
      alert("❌ Error crítico: " + error.message);
    }
  }

  const fetchJobPositions = async () => {
    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('company_slug', user?.company_slug)
      .order('created_at', { ascending: false })
    if (data) setJobPositions(data)
  }

  const handleSavePosition = async () => {
    if (!rankingCargo || !rankingFunciones || !user) return
    setSavingPosition(true)
    const payload = { cargo: rankingCargo, ciudad: rankingCiudad, funciones: rankingFunciones, created_by_cedula: user.cedula, company_slug: user.company_slug }
    if (editingPositionId) {
      await supabase.from('job_positions').update(payload).eq('id', editingPositionId)
    } else {
      await supabase.from('job_positions').insert(payload)
    }
    await fetchJobPositions()
    setSavingPosition(false)
  }

  const handleDeletePosition = async () => {
    if (!editingPositionId) return
    if (!window.confirm('¿Eliminar perfil de cargo?')) return
    setSavingPosition(true)
    await supabase.from('job_positions').delete().eq('id', editingPositionId)
    setEditingPositionId(null)
    setRankingCargo('')
    setRankingFunciones('')
    await fetchJobPositions()
    setShowJobMaintenance(false)
    setSavingPosition(false)
  }

  const handleLoadPosition = (pos: any) => {
    setEditingPositionId(pos.id)
    setRankingCargo(pos.cargo)
    setRankingCiudad(pos.ciudad || '')
    setRankingFunciones(pos.funciones)
  }

  const handleRankCandidates = async () => {
    if (!rankingCargo || !rankingFunciones) {
      alert('Completa el cargo y las funciones.')
      return
    }
    if (!openAiKey) {
      alert('Falta la API Key de OpenAI.')
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
        body: JSON.stringify({ 
          cargo: rankingCargo, 
          ciudad: rankingCiudad, 
          funciones: rankingFunciones, 
          apiKey: openAiKey, 
          cedula: user?.cedula,
          company_slug: user?.company_slug
        })
      })
      const data = await res.json()
      if (res.ok) {
        setRankingResults(data.data || [])
        fetchTracking(rankingCargo)
      } else {
        setRankingError(data.error || 'Error al evaluar.')
        alert('Error en Ranking: ' + (data.error || 'Desconocido'))
      }
    } catch (e: any) {
      setRankingError('Error: ' + e.message)
      alert('Error de conexión en Ranking: ' + e.message)
    } finally {
      setRankingLoading(false)
    }
  }

  const handleMarkAsReviewed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('email_resumes')
        .update({ classification_status: 'REVIEWED' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar estado local
      setResumes(prev => prev.map(r => r.id === id ? { ...r, classification_status: 'REVIEWED' } : r));
    } catch (e: any) {
      alert('Error al marcar como revisado: ' + e.message);
    }
  }

  const fetchTracking = async (cargo: string) => {
    const res = await fetch(`/api/candidate-tracking?cargo=${encodeURIComponent(cargo)}`)
    const data = await res.json()
    if (data.data) {
      const map: Record<string, any> = {}
      data.data.forEach((t: any) => { map[t.resume_id] = t })
      setTrackingMap(map)
    }
  }

  const updateTracking = async (resume_id: string, status: string, interview_date?: string, notes?: string) => {
    setTrackingUpdating(resume_id)
    const res = await fetch('/api/candidate-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        resume_id, 
        cargo: rankingCargo, 
        status, 
        interview_date, 
        notes, 
        created_by_cedula: user?.cedula,
        company_slug: user?.company_slug 
      })
    })
    const data = await res.json()
    if (data.success) {
      setTrackingMap(prev => ({ ...prev, [resume_id]: data.data }))
      if (status === 'ENTREVISTA_APROBADA') handleSendApprovalEmail(resume_id)
    }
    setTrackingUpdating(null)
  }

  const fetchCandidates = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('onboarding_candidates')
      .select('*')
      .eq('company_slug', user.company_slug)
      .neq('status', 'DELETED')
      .order('created_at', { ascending: false })
    if (data) setCandidates(data.filter(c => c.created_by_cedula === user.cedula))
    setLoading(false)
  }

  const fetchResumes = async () => {
    setLoadingResumes(true)
    const { data } = await supabase
      .from('email_resumes')
      .select('*')
      .eq('company_slug', user?.company_slug)
      .order('received_date', { ascending: false })
    if (data) setResumes(data)
    setLoadingResumes(false)
  }

  const handleUpdatePhone = async (id: string, phone: string) => {
    const newPhone = window.prompt("Editar número de teléfono:", phone);
    if (newPhone === null) return;
    const { error } = await supabase.from('email_resumes').update({ sender_phone: newPhone }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else fetchResumes();
  }

  const handleSendContactEmail = async (email: string, name: string, cargo: string, interviewDate?: string, notes?: string) => {
    const isInterview = !!interviewDate;
    const confirmMsg = isInterview 
      ? `¿Enviar citación de entrevista a ${email} para el ${interviewDate}?`
      : `¿Enviar correo de contacto inicial a ${email}?`;
      
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, cargo, interviewDate, notes })
      });
      const data = await res.json();
      if (res.ok) alert('✅ Correo enviado con éxito.');
      else alert('❌ Error al enviar correo: ' + (data.error || 'Fallo en el servidor SMTP'));
    } catch (e: any) { alert('❌ Error de conexión: ' + e.message); }
  }

  const handleScanEmails = async () => {
    if (!user) return
    setScanning(true)
    try {
      const res = await fetch('/api/scan-emails', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: user.cedula })
      })
      if (res.ok) fetchResumes()
    } finally { setScanning(false) }
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
        fetchResumes()
      } else {
        alert('Error de IA: ' + (data.error || 'Fallo desconocido'))
      }
    } catch (err: any) {
      alert('Error de conexión con la IA: ' + err.message)
    } finally {
      setAnalyzingId(null)
    }
  }

  const handleApproveOnboarding = async (id: string) => {
    if (!confirm('¿Deseas aprobar este expediente?')) return;
    const { error } = await supabase.from('onboarding_candidates').update({ status: 'SYNCED' }).eq('id', id);
    if (error) {
      alert('Error al aprobar: ' + error.message);
    } else {
      setViewingOnboarding(null);
      fetchCandidates();
    }
  }

  const handleSyncToOracle = async (id: string) => {
    if (!confirm('¿Deseas sincronizar este candidato con Oracle? Asegúrate de haber revisado sus documentos.')) return;
    await fetch('/api/oracle-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchCandidates();
  }

  const handleRejectOnboarding = async () => {
    if (!rejectionModal || !rejectionObs) return;
    try {
      const res = await fetch('/api/send-rejection-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: rejectionModal.email, 
          name: rejectionModal.name, 
          observation: rejectionObs,
          portalUrl: portalUrl
        })
      });
      if (res.ok) {
        // Obtenemos los datos actuales para no sobrescribir datos personales si los hay
        const { data: current } = await supabase.from('onboarding_candidates').select('datos_personales').eq('id', rejectionModal.id).single();
        
        const { error: updateErr } = await supabase.from('onboarding_candidates').update({ 
          status: 'PENDING', 
          // observaciones: rejectionObs, // Comentado hasta que se corra el SQL
          cedula: `PENDIENTE-${rejectionModal.email}`,
          datos_personales: { ...(current?.datos_personales || {}), observation_fallback: rejectionObs }, // Guardamos aquí temporalmente
          datos_bancarios: null,
          cargas_familiares: null,
          estudios: null,
          documentos: null
        }).eq('id', rejectionModal.id);
        
        if (updateErr) {
          alert('Error al resetear datos en la base: ' + updateErr.message);
          return;
        }

        alert('✅ Correo enviado y expediente reseteado con éxito.');
        setRejectionModal(null);
        setRejectionObs('');
        setViewingOnboarding(null); // Clear viewing state
        fetchCandidates(); // Refresh list
      } else {
        const errData = await res.json();
        alert('Error al enviar el correo: ' + (errData.error || 'Fallo desconocido'));
      }
    } catch (e) { alert('Error de conexión.'); }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar?')) return;
    await supabase.from('onboarding_candidates').delete().eq('id', id);
    fetchCandidates();
  }

  const exportToExcel = () => {
    const pending = candidates.filter(c => c.status === 'PENDING');
    const flat = pending.map(c => ({ "Nombre": c.nombres, "Apellido": c.apellidos, "Email": c.email, "Cédula": c.cedula, "Teléfono": c.telefono }));
    const ws = XLSX.utils.json_to_sheet(flat);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendientes");
    XLSX.writeFile(wb, "Onboarding.xlsx");
  }

  if (!isMounted) return null;

  return (
    <>
      <style>{`
        .admin-main { min-height: 100vh; background: #f8fafc; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
        .admin-container { padding: 32px; max-width: 1600px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; }
        .admin-title { font-size: 28px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.02em; background: linear-gradient(90deg, #0f172a, #334155); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .admin-subtitle { color: #64748b; font-size: 15px; font-weight: 500; margin: 0; }
        .qr-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid rgba(226, 232, 240, 0.8); display: flex; align-items: center; gap: 24px; }
        .qr-input { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; font-size: 14px; width: 280px; transition: all 0.2s; }
        .qr-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); outline: none; }
        .tabs-nav { display: flex; border-bottom: 1px solid #e2e8f0; margin-bottom: 28px; gap: 8px; }
        .tab-btn { padding: 12px 20px; background: none; border: none; font-size: 14px; font-weight: 700; color: #64748b; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 8px 8px 0 0; }
        .tab-btn:hover { color: #0f172a; background: rgba(241, 245, 249, 0.8); }
        .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: rgba(37, 99, 235, 0.05); }
        .table-container { background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background-color: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; letter-spacing: 0.05em; }
        td { padding: 18px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .user-cell { display: flex; align-items: center; gap: 16px; }
        .user-avatar { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .track-btn { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          padding: 8px 14px; 
          background: white; 
          border: 1px solid #e2e8f0; 
          border-radius: 8px; 
          font-size: 13px; 
          font-weight: 600; 
          color: #475569; 
          cursor: pointer; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .track-btn:hover { 
          background: #f8fafc; 
          border-color: #cbd5e1; 
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .track-btn:active { transform: translateY(0); }
        .track-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
        .pipeline-badge { 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-size: 11px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
        }
        .user-name { font-size: 15px; font-weight: 700; color: #1e293b; margin: 0 0 2px; }
        .user-email { font-size: 13px; color: #64748b; margin: 0; }
        .status-badge { display: inline-flex; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
        .status-synced { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .status-pending { background-color: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
        .action-btn { background: none; border: none; color: #4f46e5; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .action-btn:hover { color: #3730a3; transform: translateX(2px); }
        .ai-btn { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.2); transition: all 0.2s; }
        .ai-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(139, 92, 246, 0.3); }
        .ai-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .filter-bar { display: flex; gap: 16px; margin-bottom: 24px; background: white; padding: 12px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .filter-input { flex: 1; display: flex; align-items: center; gap: 10px; border: 1px solid #f1f5f9; background: #f8fafc; padding: 10px 14px; border-radius: 10px; transition: all 0.2s; }
        .filter-input:focus-within { background: white; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05); }
        .filter-input input { border: none; outline: none; width: 100%; font-size: 14px; background: transparent; font-weight: 500; }
        .ranking-layout { display: grid; grid-template-columns: 360px 1fr; gap: 32px; align-items: flex-start; }
        .ranking-form-card { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.05); position: sticky; top: 32px; }
        .ranking-label { display: block; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .ranking-input, .ranking-select { width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; font-size: 14px; margin-bottom: 16px; background: #f8fafc; transition: all 0.2s; }
        .ranking-textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; padding: 11px 14px; font-size: 14px; min-height: 160px; margin-bottom: 16px; background: #f8fafc; line-height: 1.6; }
        .ranking-btn-primary { width: 100%; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3); transition: all 0.2s; }
        .ranking-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(124, 58, 237, 0.4); }
        .score-bar-wrap { background: #f1f5f9; border-radius: 9999px; height: 10px; width: 140px; overflow: hidden; display: inline-block; vertical-align: middle; border: 1px solid #e2e8f0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .score-bar-fill { height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 9999px; }
        .medal-badge { font-size: 26px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); display: inline-block; }
        .rank-number { width: 50px; text-align: center; font-size: 15px; font-weight: 800; color: #94a3b8; }
        .rank-row { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .rank-row:hover { background: #f8fafc; transform: scale(1.005); box-shadow: inset 4px 0 0 #7c3aed, 0 10px 15px -3px rgba(0,0,0,0.05); }
        .ai-btn-accept { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; font-size: 13px; font-weight: 800; padding: 10px 20px; border-radius: 10px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .ai-btn-accept:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 15px rgba(16, 185, 129, 0.3); }
        .pipeline-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 9999px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
        .wa-link { color: #15803d; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; background: #f0fdf4; padding: 4px 10px; border-radius: 6px; border: 1px solid #bbf7d0; transition: all 0.2s; }
        .wa-link:hover { background: #dcfce7; transform: translateY(-1px); }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-top: 20px; }
        .calendar-day { background: white; border-radius: 12px; border: 1px solid #e2e8f0; min-height: 150px; padding: 12px; transition: all 0.2s; }
        .calendar-day:hover { border-color: #3b82f6; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .calendar-day.today { background: #f0f9ff; border-color: #3b82f6; border-width: 2px; }
        .calendar-date { font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 10px; display: flex; justify-content: space-between; }
        .event-card { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 6px 10px; border-radius: 4px; margin-bottom: 6px; font-size: 11px; }
        .event-time { font-weight: 800; color: #1e40af; margin-right: 4px; }
        .event-title { font-weight: 600; color: #1e3a8a; }
      `}</style>

      {/* MODALES */}
      {showJobMaintenance && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingPositionId ? '✏️ Editar Cargo' : '➕ Crear Cargo'}</h3>
              <button onClick={() => setShowJobMaintenance(false)} style={{ background: 'none', border: 'none' }}><X /></button>
            </div>
            {editingPositionId && (
              <button onClick={() => { setEditingPositionId(null); setRankingCargo(''); setRankingFunciones(''); }} style={{ marginBottom: '16px', fontSize: '12px', color: '#2563eb', border: 'none', background: 'none' }}>+ Crear nuevo</button>
            )}
            <label className="ranking-label">Cargo</label>
            <input className="ranking-input" value={rankingCargo} onChange={e => setRankingCargo(e.target.value)} />
            <label className="ranking-label">Funciones</label>
            <textarea className="ranking-textarea" style={{ minHeight: '180px' }} value={rankingFunciones} onChange={e => setRankingFunciones(e.target.value)} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="ranking-btn-primary" onClick={() => { handleSavePosition(); setShowJobMaintenance(false); }}>Guardar</button>
              {editingPositionId && <button onClick={handleDeletePosition} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px' }}><Trash2 size={16}/></button>}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>Configuración IA (OpenAI)</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>OpenAI API Key</label>
              <input 
                className="ranking-input" 
                type="password" 
                placeholder="sk-..."
                value={openAiKey} 
                onChange={e => {
                  setOpenAiKey(e.target.value)
                  localStorage.setItem('openai_api_key', e.target.value)
                }} 
              />
            </div>
            <button className="ranking-btn-primary" onClick={() => setShowSettings(false)}>Guardar y Cerrar</button>
          </div>
        </div>
      )}

      {interviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '12px', width: '420px' }}>
            <h3 style={{ margin: '0 0 16px' }}>📅 Programar Entrevista</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label className="ranking-label">Fecha</label>
                <input type="date" className="ranking-input" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
              </div>
              <div>
                <label className="ranking-label">Hora</label>
                <input type="time" className="ranking-input" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} />
              </div>
            </div>
            <label className="ranking-label">Lugar / Notas</label>
            <textarea className="ranking-textarea" placeholder="Notas..." value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setInterviewModal(null)} className="track-btn">Cancelar</button>
              <button className="ranking-btn-primary" style={{ width: 'auto' }} onClick={async () => {
                const fullDateTime = `${interviewDate} ${interviewTime}`;
                if (interviewModal.resumeId && interviewModal.resumeId !== interviewModal.id) {
                  await updatePipelineStatus(interviewModal.id, interviewModal.resumeId, interviewModal.cargo, 'ENTREVISTA_PROGRAMADA', fullDateTime, interviewNotes)
                } else {
                  await updateTracking(interviewModal.id, 'ENTREVISTA_PROGRAMADA', fullDateTime, interviewNotes)
                }
                setInterviewModal(null)
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-main">
        <header 
          className="onboarding-header" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'linear-gradient(135deg, #002f6c 0%, #001a3d 100%)',
            padding: '20px 40px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle light effect */}
          <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '40%', height: '200%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', transform: 'rotate(-15deg)', pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', position: 'relative', zIndex: 1 }}>
            <div>
              <h1 className="onboarding-title" style={{ fontSize: '28px', letterSpacing: '0.5px', marginBottom: '4px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {user?.company_name || 'SUPERDEPORTE S.A.'}
              </h1>
              <p className="onboarding-subtitle" style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Panel de Gestión Administrativa</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>{user?.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Cédula: {user?.cedula}</p>
            </div>
            
            <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
            
            <button 
              onClick={logout}
              style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                color: '#fca5a5', 
                padding: '10px 20px', 
                borderRadius: '12px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '800',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <LogOut size={18} /> Salir
            </button>
          </div>
        </header>
        <div className="admin-container">
          <div className="qr-card">
            <div>
              <label className="ranking-label">Link Candidatos</label>
              <input type="text" value={portalUrl} onChange={e => setPortalUrl(e.target.value)} className="qr-input" />
            </div>
            <img src={qrCodeUrl} alt="QR" style={{ width: '64px', height: '64px' }} />
            <button 
              onClick={() => { fetchCandidates(); fetchResumes(); fetchPipeline(); }} 
              className="ranking-btn-primary"
              style={{ width: 'auto', padding: '12px 24px', marginLeft: 'auto', borderRadius: '10px' }}
            >
              <RefreshCw size={18} /> Actualizar Todo
            </button>
          </div>

        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === 'seleccion' ? 'active' : ''}`} onClick={() => setActiveTab('seleccion')}>Inbox</button>
          <button className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>🏆 Ranking IA</button>
          <button className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => { setActiveTab('pipeline'); fetchPipeline() }}>📑 Resumen</button>
          <button className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`} onClick={() => setActiveTab('onboarding')}>🚀 Onboarding</button>
          <button className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`} onClick={() => setActiveTab('estadisticas')}>📈 Estadísticas</button>
          {(user?.perfil === 'NOMINA' || user?.perfil === 'ADMIN') && (
            <button className={`tab-btn ${activeTab === 'nomina' ? 'active' : ''}`} onClick={() => setActiveTab('nomina')}>💼 Nómina</button>
          )}
        </div>

        {/* --- BANDEJA --- */}
        {activeTab === 'seleccion' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
              <button onClick={() => setShowSettings(true)} style={{ background: 'white', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}><Settings size={16}/></button>
              <button onClick={handleScanEmails} disabled={scanning} className="ai-btn" style={{ background: '#3b82f6' }}><RefreshCw size={16} className={scanning ? "animate-spin" : ""}/> {scanning ? 'Escaneando...' : 'Buscar Nuevos Correos'}</button>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '20px', 
              background: 'white', 
              padding: '16px', 
              borderRadius: '12px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Buscar por nombre</label>
                <div className="filter-input" style={{ background: '#f8fafc', marginTop: '4px' }}>
                  <User size={18} color="#6b7280" />
                  <input 
                    type="text" 
                    placeholder="Ej: Daniel Molina..." 
                    value={inboxSearch}
                    onChange={(e) => setInboxSearch(e.target.value)}
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>
              <div style={{ width: '180px' }}>
                <label className="form-label">Cargo</label>
                <div className="filter-input" style={{ background: '#f8fafc', marginTop: '4px' }}>
                  <Briefcase size={18} color="#6b7280" />
                  <input 
                    type="text" 
                    placeholder="Ej: Cajero..." 
                    value={inboxCargo}
                    onChange={(e) => setInboxCargo(e.target.value)}
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>
              <div style={{ width: '150px' }}>
                <label className="form-label">Ciudad</label>
                <div className="filter-input" style={{ background: '#f8fafc', marginTop: '4px' }}>
                  <MapPin size={18} color="#6b7280" />
                  <input 
                    type="text" 
                    placeholder="Ej: Quito..." 
                    value={inboxCity}
                    onChange={(e) => setInboxCity(e.target.value)}
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>
              <div style={{ width: '100px' }}>
                <label className="form-label">Min. Años</label>
                <div className="filter-input" style={{ background: '#f8fafc', marginTop: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>+</span>
                  <input 
                    type="number" 
                    placeholder="Exp" 
                    value={inboxExp}
                    onChange={(e) => setInboxExp(e.target.value)}
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button 
                  className="track-btn" 
                  onClick={() => { setInboxSearch(''); setInboxCargo(''); setInboxCity(''); setInboxExp(''); }}
                >
                  Limpiar
                </button>
                <button 
                  className="track-btn" 
                  style={{ background: '#f8fafc', color: '#2563eb', borderColor: '#dbeafe' }}
                  onClick={() => fetchResumes()}
                  disabled={loadingResumes}
                >
                  {loadingResumes ? 'Cargando...' : 'Actualizar'}
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Perfil IA</th><th>Archivo CV</th><th>Fecha</th><th>Estado</th></tr>
                </thead>
                <tbody>
                  {resumes
                    .filter(r => {
                      const matchesSearch = !inboxSearch || (r.sender_name || '').toLowerCase().includes(inboxSearch.toLowerCase());
                      const matchesCargo = !inboxCargo || (r.position || '').toLowerCase().includes(inboxCargo.toLowerCase());
                      const matchesCity = !inboxCity || (r.city || '').toLowerCase().includes(inboxCity.toLowerCase());
                      const matchesExp = !inboxExp || (parseInt(r.experience_years || '0') >= parseInt(inboxExp));
                      return matchesSearch && matchesCargo && matchesCity && matchesExp;
                    })
                    .map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="user-cell" style={{ alignItems: 'flex-start' }}>
                          <div className="user-avatar" style={{ 
                            background: r.email_uid?.startsWith('WEB') ? '#eff6ff' : (r.classification_status === 'REVIEWED' ? '#f0fdf4' : '#f3e8ff'), 
                            color: r.email_uid?.startsWith('WEB') ? '#3b82f6' : (r.classification_status === 'REVIEWED' ? '#16a34a' : '#9333ea') 
                          }}>
                            {r.email_uid?.startsWith('WEB') ? <UploadCloud size={20} /> : (r.classification_status === 'REVIEWED' ? <Brain size={20} /> : <Mail size={20} />)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <p className="user-name" style={{ margin: 0 }}>{r.sender_name || 'Sin Nombre'}</p>
                              <span style={{ 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                background: r.email_uid?.startsWith('WEB') ? '#dbeafe' : '#f1f5f9',
                                color: r.email_uid?.startsWith('WEB') ? '#1e40af' : '#475569',
                                fontWeight: 'bold'
                              }}>
                                {r.email_uid?.startsWith('WEB') ? 'WEB' : 'EMAIL'}
                              </span>
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>{r.sender_email}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              {r.sender_phone ? (
                                <p style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>📞 {r.sender_phone}</p>
                              ) : (
                                <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>Sín teléfono</p>
                              )}
                              <button 
                                onClick={() => handleUpdatePhone(r.id, r.sender_phone || '')} 
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                title="Editar Teléfono"
                              >
                                <Settings size={12} />
                              </button>
                            </div>
                            
                            {/* Mostramos los datos si está REVISADO o si ya tiene cargo extraído */}
                            {(r.classification_status === 'REVIEWED' || r.position) ? (
                              <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                  {r.city && <span className="ai-tag"><MapPin size={12} /> {r.city}</span>}
                                  {r.position && <span className="ai-tag"><Briefcase size={12} /> {r.position}</span>}
                                  {r.experience_years && <span className="ai-tag" style={{ background: '#fef9c3', color: '#854d0e' }}>⏱ {r.experience_years} años</span>}
                                  {r.skills && r.skills.split(',').map((s: string, i: number) => i < 3 && <span key={i} className="ai-tag" style={{ background: '#f0fdf4', color: '#166534' }}>{s.trim()}</span>)}
                                </div>
                                {r.ai_summary && (
                                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '12px', fontStyle: 'italic', color: '#475569', borderLeft: '3px solid #cbd5e1' }}>
                                    "{r.ai_summary}"
                                  </div>
                                )}
                                {/* Botón de IA extra por si quieren profundizar aunque ya tengan datos básicos */}
                                {r.classification_status !== 'REVIEWED' && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button className="ai-btn" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => handleAnalyzeResume(r.id)} disabled={analyzingId === r.id}>
                                      {analyzingId === r.id ? 'Analizando...' : 'Profundizar con IA'}
                                    </button>
                                    <button 
                                      className="ai-btn" 
                                      style={{ background: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }} 
                                      onClick={() => handleMarkAsReviewed(r.id)}
                                    >
                                      Aceptar Directo (Sin IA)
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button className="ai-btn" onClick={() => handleAnalyzeResume(r.id)} disabled={analyzingId === r.id}>
                                  {analyzingId === r.id ? 'Analizando...' : 'Analizar con IA'}
                                </button>
                                <button 
                                  className="ai-btn" 
                                  style={{ background: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }} 
                                  onClick={() => handleMarkAsReviewed(r.id)}
                                >
                                  Aceptar Directo (Sin IA)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {r.pdf_url && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <a href={r.pdf_url} target="_blank" className="pdf-link" style={{ fontWeight: 600 }}>
                              <FileText size={16} /> Ver CV
                            </a>
                            <span style={{ fontSize: '10px', color: '#64748b', wordBreak: 'break-all', maxWidth: '150px' }}>
                              {r.file_name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>{r.received_date ? new Date(r.received_date).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`status-badge ${r.classification_status === 'REVIEWED' ? 'status-synced' : 'status-pending'}`}>
                          {r.classification_status === 'REVIEWED' ? 'REVISADO' : 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* --- RANKING IA --- */}
        {activeTab === 'ranking' && (
          <div className="ranking-layout">
            <div className="ranking-form-card">
              <p style={{ fontWeight: 700, margin: '0 0 16px' }}><Trophy size={18} color="#7c3aed" /> Evaluación por Cargo</p>
              <label className="ranking-label">Seleccionar Cargo</label>
              <select className="ranking-select" value={editingPositionId || ''} onChange={e => {
                const p = jobPositions.find(pos => pos.id === e.target.value);
                if (p) handleLoadPosition(p);
                else { setEditingPositionId(null); setRankingCargo(''); setRankingFunciones(''); }
              }}>
                <option value="">Seleccionar...</option>
                {jobPositions.map(p => <option key={p.id} value={p.id}>{p.cargo} {p.ciudad ? `· ${p.ciudad}` : ''}</option>)}
              </select>
              <button onClick={() => setShowJobMaintenance(true)} style={{ width: '100%', padding: '8px', background: '#f3f4f6', border: 'none', borderRadius: '8px', marginBottom: '12px' }}>⚙️ Ajustar Perfil</button>
              <button className="ranking-btn-primary" onClick={handleRankCandidates} disabled={rankingLoading}><Brain size={16} /> {rankingLoading ? 'Evaluando...' : 'Evaluar con IA'}</button>
            </div>
            <div>
              {rankingResults && rankingResults.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Candidato</th><th>Ciudad</th><th>Puntaje</th><th>CV</th><th style={{ textAlign: 'right' }}>Acción</th></tr>
                    </thead>
                    <tbody>
                      {rankingResults.map((r, idx) => {
                        const status = trackingMap[r.id]?.status || 'PENDIENTE';
                        const isUpd = trackingUpdating === r.id;
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                        const scoreColor = r.score >= 85 ? 'linear-gradient(90deg, #10b981, #22c55e)' : r.score >= 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)';
                        
                        return (
                          <tr key={`${r.id}-${idx}`} className="rank-row">
                            <td className="rank-number">
                              {medal ? <span className="medal-badge">{medal}</span> : idx + 1}
                            </td>
                            <td>
                              <div className="user-cell" style={{ alignItems: 'flex-start' }}>
                                <div className="user-avatar" style={{ background: '#f3e8ff', color: '#9333ea', width: '36px', height: '36px' }}><User size={18}/></div>
                                <div>
                                  <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: '15px', color: '#1e293b' }}>{r.name || r.sender_name || 'Sin Nombre'}</p>
                                  <p className="justification-text" style={{ fontSize: '12px', lineHeight: '1.4', color: '#64748b' }}>{r.justification}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                              <MapPin size={12} style={{ marginRight: '4px' }} /> {r.city}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="score-bar-wrap">
                                  <div className="score-bar-fill" style={{ width: `${r.score}%`, background: scoreColor }} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>{r.score}</span>
                              </div>
                            </td>
                            <td>{r.pdf_url && <a href={r.pdf_url} target="_blank" className="pdf-link" style={{ fontWeight: 600 }}><FileText size={16}/> CV</a>}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                {status === 'PENDIENTE' ? (
                                  <button className="ai-btn-accept" onClick={() => updateTracking(r.id, 'MENSAJE_ENVIADO')} disabled={isUpd}>
                                    {isUpd ? '...' : 'Aceptar Candidato'}
                                  </button>
                                ) : (
                                  <>
                                    <span className="pipeline-badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', marginBottom: '4px' }}>
                                      ✅ SELECCIONADO
                                    </span>
                                    
                                    {/* Panel de Seguimiento Completo */}
                                    {r.sender_phone && status === 'MENSAJE_ENVIADO' && (
                                      <a 
                                        href={`https://wa.me/${r.sender_phone.replace(/\D/g, '').replace(/^0/, '593')}?text=${encodeURIComponent('Estimado candidato, hemos recibido su CV para el cargo de ' + rankingCargo + ', ¿podemos agendar una reunión para la entrevista?')}`} 
                                        target="_blank" 
                                        className="wa-link"
                                      >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style={{ width: '14px' }} /> Reenviar WA
                                      </a>
                                    )}
                                    
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                      {status === 'MENSAJE_ENVIADO' && (
                                        <button className="track-btn" onClick={() => setInterviewModal({ id: r.id, name: r.sender_name, resumeId: r.id, cargo: rankingCargo })}>📅 Citar</button>
                                      )}
                                      <button className="track-btn" style={{ color: '#94a3b8' }} onClick={() => updateTracking(r.id, 'PENDIENTE')}>↺ Reiniciar</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ESTADÍSTICAS --- */}
        {activeTab === 'estadisticas' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800, color: '#002f6c' }}>Panel de Estadísticas</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* SECCIÓN PIPELINE */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', color: '#1e293b' }}>Resumen / Pipeline</h3>
                <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>📅 Entrevistas Agendadas</span>
                    <strong style={{ fontSize: '18px', color: '#2563eb' }}>{pipelineData.filter(p => p.status === 'ENTREVISTA_PROGRAMADA').length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>✅ Entrevistas Aprobadas</span>
                    <strong style={{ fontSize: '18px', color: '#10b981' }}>{pipelineData.filter(p => p.status === 'ENTREVISTA_APROBADA').length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>❌ Entrevistas Rechazadas</span>
                    <strong style={{ fontSize: '18px', color: '#ef4444' }}>{pipelineData.filter(p => p.status === 'ENTREVISTA_RECHAZADA').length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>✉️ Contactados (Mail/WA)</span>
                    <strong style={{ fontSize: '18px', color: '#8b5cf6' }}>{pipelineData.filter(p => p.status !== 'PENDIENTE').length}</strong>
                  </div>
                </div>
              </div>

              {/* SECCIÓN ONBOARDING */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', color: '#1e293b' }}>Proceso Onboarding</h3>
                <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>📝 Onboarding Completados</span>
                    <strong style={{ fontSize: '18px', color: '#7c3aed' }}>{candidates.filter(c => c.status === 'LLENADO').length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>⚠️ Rechazados / En Revisión</span>
                    <strong style={{ fontSize: '18px', color: '#f59e0b' }}>{candidates.filter(c => c.observaciones || (c.datos_personales && c.datos_personales.observation_fallback)).length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>🏦 Data de Nómina (Simulada)</span>
                    <strong style={{ fontSize: '18px', color: '#06b6d4' }}>0</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b' }}>🚀 Sincronizados Oracle</span>
                    <strong style={{ fontSize: '18px', color: '#002f6c' }}>{candidates.filter(c => c.status === 'SYNCED').length}</strong>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ marginTop: '32px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <h4 style={{ margin: '0 0 8px', color: '#475569' }}>Total Candidatos en el Sistema</h4>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>
                {new Set([
                  ...resumes.filter(r => r.created_by_cedula === user?.cedula).map(r => r.sender_email?.toLowerCase()).filter(Boolean),
                  ...candidates.map(c => c.email?.toLowerCase()).filter(Boolean)
                ]).size}
              </p>
            </div>
          </div>
        )}

        {/* --- PIPELINE / RESUMEN --- */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="filter-bar" style={{ margin: 0, flex: 1 }}>
                <div className="filter-input">
                  <Briefcase size={18} color="#94a3b8" />
                  <input placeholder="Filtrar por cargo..." value={pipelineCargoFilter} onChange={e => setPipelineCargoFilter(e.target.value)} />
                </div>
                <select 
                  value={pipelineFilter} 
                  onChange={e => setPipelineFilter(e.target.value)}
                  style={{ border: 'none', background: 'none', fontWeight: 700, color: '#475569', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="PENDIENTE">⏳ Pendientes</option>
                  <option value="MENSAJE_ENVIADO">📨 Mensaje Enviado</option>
                  <option value="ENTREVISTA_PROGRAMADA">📅 Citados</option>
                  <option value="ENTREVISTA_APROBADA">✅ Aprobados</option>
                  <option value="RECHAZADO">❌ Rechazados</option>
                </select>
              </div>
              <button 
                onClick={() => setShowCalendarModal(true)} 
                className="ranking-btn-primary" 
                style={{ width: 'auto', padding: '10px 20px', marginLeft: '20px' }}
              >
                📅 Ver Mi Agenda
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Cargo</th>
                    <th>Teléfono / WhatsApp</th>
                    <th>Estado</th>
                    <th>Entrevista</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineData.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No hay candidatos en el resumen actualmente.
                      </td>
                    </tr>
                  ) : (
                    pipelineData
                      .filter(p => pipelineFilter === 'ALL' || p.status === pipelineFilter)
                      .filter(p => !pipelineCargoFilter || p.cargo.toLowerCase().includes(pipelineCargoFilter.toLowerCase()))
                      .map(p => (
                      <tr key={p.id}>
                        <td>
                          <p style={{ fontWeight: 700, margin: 0, color: '#1e293b' }}>{p.candidate?.sender_name || 'Candidato'}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{p.candidate?.sender_email || '—'}</p>
                        </td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{p.cargo}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {p.candidate?.sender_phone && (
                              <a 
                                href={p.status === 'PENDIENTE' ? '#' : `https://wa.me/${p.candidate.sender_phone.replace(/\D/g, '').replace(/^0/, '593')}?text=${encodeURIComponent(
                                  p.status === 'ENTREVISTA_PROGRAMADA' 
                                  ? `Hola ${p.candidate?.sender_name || 'candidat@'}, nos complace informarte que has pasado la primera etapa de nuestro proceso de selección para Superdeporte S.A. Para la siguiente fase, deberás asistir a una entrevista presencial y/o virtual.\n\nTe enviamos los detalles para que puedas asistir:\n📅Fecha: ${p.interview_date ? new Date(p.interview_date.split(' ')[0] + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}\n⏰Hora: ${p.interview_date?.split(' ')[1] || '09:00'}\n📍Lugar: Av Galo Plaza Lasso 13205 de los Ceresos.`
                                  : `Hola ${p.candidate?.sender_name || 'candidat@'}, te saludamos de RRHH de Superdeporte S.A. Estamos revisando tu perfil para el cargo de ${p.cargo} y nos gustaría agendar una entrevista.`
                                )}`} 
                                onClick={(e) => (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') && e.preventDefault()}
                                target={(p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? undefined : "_blank"} 
                                className="wa-link"
                                style={{ 
                                  opacity: (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? 0.5 : 1, 
                                  cursor: (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? 'not-allowed' : 'pointer',
                                  filter: (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? 'grayscale(1)' : 'none',
                                  justifyContent: 'center'
                                }}
                              >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style={{ width: '16px' }} /> {p.candidate.sender_phone}
                              </a>
                            )}
                            <button 
                              disabled={p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO'}
                              onClick={() => handleSendContactEmail(p.candidate?.sender_email, p.candidate?.sender_name, p.cargo, p.interview_date, p.notes)}
                              className="track-btn"
                              style={{ 
                                fontSize: '11px', 
                                padding: '6px 8px', 
                                color: (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? '#94a3b8' : '#2563eb', 
                                borderColor: (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? '#e2e8f0' : '#dbeafe',
                                cursor: (p.status === 'PENDIENTE' || p.status === 'ENTREVISTA_APROBADA' || p.status === 'RECHAZADO') ? 'not-allowed' : 'pointer',
                                justifyContent: 'center'
                              }}
                            >
                              <Mail size={12} /> {p.status === 'ENTREVISTA_PROGRAMADA' ? 'Enviar Citación' : 'Enviar Email'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="pipeline-badge" style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                            {p.status || 'PENDIENTE'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                          {p.interview_date ? <span>📅 {new Date(p.interview_date.split(' ')[0] + 'T12:00:00').toLocaleDateString()}</span> : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            {/* Botón Citar (si ya fue aceptado o mensaje enviado) */}
                            {(p.status === 'PENDIENTE' || p.status === 'MENSAJE_ENVIADO') && (
                              <button className="track-btn" onClick={() => setInterviewModal({ id: p.id, name: p.candidate?.sender_name, resumeId: p.resume_id, cargo: p.cargo })}>
                                📅 Citar
                              </button>
                            )}
  
                            {/* Botón Aprobar / Rechazar (si ya tiene entrevista) */}
                            {p.status === 'ENTREVISTA_PROGRAMADA' && (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="track-btn" style={{ color: '#10b981', borderColor: '#bbf7d0' }} onClick={() => updatePipelineStatus(p.id, p.resume_id, p.cargo, 'ENTREVISTA_APROBADA')}>
                                  🌟 Aprobar
                                </button>
                                <button className="track-btn" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={() => updatePipelineStatus(p.id, p.resume_id, p.cargo, 'RECHAZADO')}>
                                  ❌ Rechazar
                                </button>
                              </div>
                            )}
  
                            {/* Estados Finales */}
                            {p.status === 'ENTREVISTA_APROBADA' && (
                              <span className="pipeline-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>✅ APROBADO</span>
                            )}
                            {p.status === 'RECHAZADO' && (
                              <span className="pipeline-badge" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>❌ RECHAZADO</span>
                            )}
  
                            {/* Botón Reiniciar siempre disponible */}
                            {p.status !== 'ENTREVISTA_APROBADA' && p.status !== 'RECHAZADO' && (
                              <button 
                                className="track-btn" 
                                style={{ color: '#94a3b8', padding: '6px' }} 
                                onClick={() => updatePipelineStatus(p.id, p.resume_id, p.cargo, 'PENDIENTE')}
                                title="Reiniciar a Pendiente"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCalendarModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '1200px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Mi Agenda de Entrevistas</h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b' }}>Planifica tus actividades de selección</p>
                </div>
                <button onClick={() => setShowCalendarModal(false)} className="track-btn" style={{ padding: '10px' }}><X /></button>
              </div>
              
              <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {/* Cabecera de días */}
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontWeight: 800, color: '#475569', fontSize: '12px', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0' }}>{d}</div>
                ))}
                
                {(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = today.getMonth(); // 0-indexed
                  
                  // Primer día del mes
                  const firstDay = new Date(year, month, 1);
                  // Ajustar a Lunes como primer día (JS: 0=Dom, 1=Lun...)
                  // Si es Dom(0), queremos 6 espacios. Si es Lun(1), 0 espacios.
                  let startPadding = firstDay.getDay() - 1;
                  if (startPadding === -1) startPadding = 6; 
                  
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  
                  const elements = [];
                  
                  // Espacios vacíos antes del día 1
                  for (let i = 0; i < startPadding; i++) {
                    elements.push(<div key={`pad-${i}`} style={{ background: '#f1f5f9', opacity: 0.3, borderRadius: '8px', minHeight: '100px' }}></div>);
                  }
                  
                  // Días del mes
                  for (let d = 1; d <= daysInMonth; d++) {
                    const currentDate = new Date(year, month, d);
                    const dateStr = currentDate.toISOString().split('T')[0];
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    
                    const dayEvents = pipelineData.filter(p => p.status === 'ENTREVISTA_PROGRAMADA' && p.interview_date && p.interview_date.startsWith(dateStr));
                    
                    elements.push(
                      <div key={d} className={`calendar-day ${isToday ? 'today' : ''}`} style={{ minHeight: '120px', padding: '8px' }}>
                        <div className="calendar-date" style={{ marginBottom: '4px', fontSize: '12px' }}>
                          <span style={{ 
                            background: isToday ? '#2563eb' : 'transparent', 
                            color: isToday ? 'white' : '#64748b', 
                            width: '22px', 
                            height: '22px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            borderRadius: '50%',
                            fontWeight: 800
                          }}>
                            {d}
                          </span>
                        </div>
                        <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                          {dayEvents.map(ev => (
                            <div key={ev.id} className="event-card" style={{ padding: '4px', marginBottom: '3px', fontSize: '10px' }} title={ev.candidate?.sender_name}>
                              <div className="event-time" style={{ fontSize: '9px' }}>{ev.interview_date?.split(' ')[1] || '09:00'}</div>
                              <div className="event-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.candidate?.sender_name?.split(' ')[0] || 'Candidato'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  return elements;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* --- ONBOARDING --- */}
        {activeTab === 'onboarding' && (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Candidato</th><th>Cargo</th><th>Cédula</th><th>Estado Onboarding</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar"><User size={20} /></div>
                        <div>
                          <p className="user-name">{c.nombres} {c.apellidos}</p>
                          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontWeight: 600 }}>{c.cargo}</td>
                    <td>{c.cedula?.startsWith('PENDIENTE') ? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Por completar</span> : <strong>{c.cedula}</strong>}</td>
                    <td>
                      <span className="pipeline-badge" style={{ 
                         background: c.status === 'SYNCED' ? '#f0fdf4' : c.status === 'LLENADO' ? '#f5f3ff' : '#eff6ff', 
                         color: c.status === 'SYNCED' ? '#166534' : c.status === 'LLENADO' ? '#5b21b6' : '#1e40af',
                         border: '1px solid currentColor',
                         opacity: 0.8
                       }}>
                         {c.status === 'LLENADO' ? '📝 LLENADO' : c.status === 'SYNCED' ? '✅ APROBADO' : '⏳ PENDIENTE'}
                       </span>
                       {c.observaciones && <p style={{ fontSize: '10px', color: '#ef4444', margin: '4px 0 0' }}>⚠️ {c.observaciones}</p>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {(c.status === 'LLENADO' || c.status === 'SYNCED') && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setViewingOnboarding(c)} className="track-btn" style={{ color: '#3b82f6', borderColor: '#dbeafe', padding: '4px 8px', fontSize: '11px' }}>👁️ Ver</button>
                            <button onClick={() => alert('Ventana de Nómina próximamente...')} className="track-btn" style={{ color: '#8b5cf6', borderColor: '#ddd6fe', padding: '4px 8px', fontSize: '11px' }}>🏦 Nómina</button>
                            <button onClick={() => setRejectionModal({ id: c.id, email: c.email, name: `${c.nombres} ${c.apellidos}` })} className="track-btn" style={{ color: '#ef4444', borderColor: '#fecaca', padding: '4px 8px', fontSize: '11px' }}>❌ Rechazar</button>
                            {c.status !== 'SYNCED' && (
                              <button onClick={() => handleApproveOnboarding(c.id)} className="track-btn" style={{ color: '#002f6c', borderColor: '#002f6c', padding: '4px 8px', fontSize: '11px' }}>🌟 Aprobar</button>
                            )}
                            <button onClick={() => handleSyncToOracle(c.id)} className="track-btn" style={{ background: '#002f6c', color: 'white', borderColor: '#002f6c', padding: '4px 8px', fontSize: '11px' }}>🚀 Sincronizar</button>
                          </div>
                        )}
                        {c.status === 'PENDING' && <span style={{ color: '#94a3b8', fontSize: '12px' }}>Esperando llenado</span>}
                        <button onClick={() => handleDelete(c.id)} className="track-btn" style={{ color: '#64748b', padding: '6px' }} title="Eliminar registro"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL VER EXPEDIENTE */}
        {viewingOnboarding && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ margin: 0 }}>Expediente de {viewingOnboarding.nombres} {viewingOnboarding.apellidos}</h2>
                <button onClick={() => setViewingOnboarding(null)} className="track-btn"><X /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: '#002f6c', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Datos Personales</h3>
                  <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <p><strong>Cédula:</strong> {viewingOnboarding.cedula}</p>
                    <p><strong>Email:</strong> {viewingOnboarding.email}</p>
                    <p><strong>Nacionalidad:</strong> {viewingOnboarding.datos_personales?.nacionalidad}</p>
                    <p><strong>Estado Civil:</strong> {viewingOnboarding.datos_personales?.estado_civil}</p>
                    <p><strong>Ciudad Nac.:</strong> {viewingOnboarding.datos_personales?.ciudad_nacimiento}</p>
                    <p><strong>Fecha Nac.:</strong> {viewingOnboarding.datos_personales?.fecha_nacimiento}</p>
                    <p><strong>Ciudad Res.:</strong> {viewingOnboarding.datos_personales?.ciudad_residencia}</p>
                    <p><strong>Teléfono:</strong> {viewingOnboarding.telefono}</p>
                    <p style={{ gridColumn: '1 / -1' }}><strong>Dirección:</strong> {viewingOnboarding.datos_personales?.direccion}</p>
                  </div>

                  <h3 style={{ fontSize: '16px', color: '#002f6c', borderBottom: '1px solid #eee', paddingBottom: '8px', marginTop: '24px' }}>Datos Bancarios</h3>
                  <div style={{ fontSize: '13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <p><strong>Banco:</strong> {viewingOnboarding.datos_bancarios?.banco}</p>
                    <p><strong>Tipo Cuenta:</strong> {viewingOnboarding.datos_bancarios?.tipo_cuenta}</p>
                    <p style={{ gridColumn: '1 / -1' }}><strong>Número:</strong> {viewingOnboarding.datos_bancarios?.numero_cuenta}</p>
                  </div>

                  <h3 style={{ fontSize: '16px', color: '#002f6c', borderBottom: '1px solid #eee', paddingBottom: '8px', marginTop: '24px' }}>Cargas Familiares</h3>
                  <div style={{ fontSize: '13px', display: 'grid', gap: '8px', marginTop: '12px' }}>
                    {viewingOnboarding.cargas_familiares?.conyuge ? (
                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                        <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#475569' }}>Cónyuge / Pareja</p>
                        <p style={{ margin: 0 }}>{viewingOnboarding.cargas_familiares.conyuge.nombres} {viewingOnboarding.cargas_familiares.conyuge.apellidos}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>Cédula: {viewingOnboarding.cargas_familiares.conyuge.cedula} | Nac: {viewingOnboarding.cargas_familiares.conyuge.fecha_nacimiento}</p>
                      </div>
                    ) : <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin cónyuge declarado</p>}
                    
                    {viewingOnboarding.cargas_familiares?.hijos?.length > 0 ? (
                      <div style={{ marginTop: '8px' }}>
                        <p style={{ fontWeight: 700, margin: '0 0 6px', color: '#475569' }}>Hijos ({viewingOnboarding.cargas_familiares.hijos.length})</p>
                        {viewingOnboarding.cargas_familiares.hijos.map((h: any, idx: number) => (
                          <div key={idx} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <p style={{ margin: 0 }}>• {h.nombres} {h.apellidos}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Cédula: {h.cedula} | Nac: {h.fecha_nacimiento}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin hijos declarados</p>}
                  </div>

                  <h3 style={{ fontSize: '16px', color: '#002f6c', borderBottom: '1px solid #eee', paddingBottom: '8px', marginTop: '24px' }}>Estudios Académicos</h3>
                  <div style={{ fontSize: '13px', display: 'grid', gap: '12px', marginTop: '12px' }}>
                    {viewingOnboarding.estudios?.map((e: any, idx: number) => (
                      <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                        <p style={{ fontWeight: 800, margin: '0 0 4px', color: '#1e293b' }}>{e.nivel}</p>
                        <p style={{ fontWeight: 600, margin: 0 }}>{e.titulo}</p>
                        <p style={{ margin: '2px 0', color: '#475569' }}>{e.institucion}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{e.fecha_inicio} - {e.fecha_fin || 'Presente'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', color: '#002f6c', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Documentos Adjuntos</h3>
                  <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                    {viewingOnboarding.documentos && Object.entries(viewingOnboarding.documentos).map(([name, url]: [string, any]) => (
                      <a key={name} href={url} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#3b82f6', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
                        <FileText size={14} /> {name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => { setRejectionModal({ id: viewingOnboarding.id, email: viewingOnboarding.email, name: `${viewingOnboarding.nombres} ${viewingOnboarding.apellidos}` }); setViewingOnboarding(null); }} className="track-btn" style={{ color: '#ef4444', borderColor: '#fecaca' }}>Rechazar con Observación</button>
                <button onClick={() => handleApproveOnboarding(viewingOnboarding.id)} className="track-btn" style={{ color: '#002f6c', borderColor: '#002f6c' }}>🌟 Aprobar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL RECHAZO */}
        {rejectionModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '400px' }}>
              <h3 style={{ margin: '0 0 16px' }}>Rechazar Expediente</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Indica el motivo del rechazo para {rejectionModal.name}. Se enviará un correo solicitando corregir la información.</p>
              <textarea 
                value={rejectionObs} 
                onChange={e => setRejectionObs(e.target.value)}
                placeholder="Ej: La cédula está borrosa, faltan los antecedentes penales..."
                style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '20px', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectionModal(null)} className="track-btn">Cancelar</button>
                <button onClick={handleRejectOnboarding} className="track-btn" style={{ background: '#ef4444', color: 'white', border: 'none' }}>Enviar Observación</button>
              </div>
            </div>
          </div>
        )}
        {/* --- NÓMINA --- */}
        {activeTab === 'nomina' && (
          <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
            <Briefcase size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Módulo de Nómina</h2>
            <p style={{ color: '#64748b' }}>Bienvenido al panel de gestión de nómina para {user?.company_name}.</p>
          </div>
        )}

        </div>
      </div>
    </>
  )
}
