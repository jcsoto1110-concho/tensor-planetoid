'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, FileText, User, Download, FileSpreadsheet, Trash2, Mail, RefreshCw, Brain, Settings, MapPin, Briefcase, Trophy, Save, X, UploadCloud, Clock, LogOut, TrendingUp, Users, Activity, Award, MessageSquare, Send, Star } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

// Componente visual del Gráfico Lineal DISC en SVG
const DiscLineChart = ({ D, I, S, C }: { D: number; I: number; S: number; C: number }) => {
  const points = [D, I, S, C];
  const width = 450;
  const height = 280;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 35;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const xCoords = [
    paddingLeft + 0 * (chartWidth / 3),
    paddingLeft + 1 * (chartWidth / 3),
    paddingLeft + 2 * (chartWidth / 3),
    paddingLeft + 3 * (chartWidth / 3)
  ];

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / 100) * chartHeight;
  };

  const pathD = `M ${xCoords[0]} ${getY(D)} L ${xCoords[1]} ${getY(I)} L ${xCoords[2]} ${getY(S)} L ${xCoords[3]} ${getY(C)}`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', fontFamily: 'inherit' }}>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => {
          const isMain = tick === 0 || tick === 50 || tick === 100;
          return (
            <g key={tick}>
              <line 
                x1={paddingLeft} 
                y1={getY(tick)} 
                x2={width - paddingRight} 
                y2={getY(tick)} 
                stroke={isMain ? '#cbd5e1' : '#f1f5f9'} 
                strokeWidth={isMain ? '1.5' : '1'}
                strokeDasharray={isMain ? '0' : '3 3'}
              />
              {isMain && (
                <text x={paddingLeft - 12} y={getY(tick) + 4} textAnchor="end" fontSize="10" fontWeight="700" fill="#64748b">
                  {tick}
                </text>
              )}
            </g>
          );
        })}

        <rect 
          x={paddingLeft} 
          y={getY(60)} 
          width={chartWidth} 
          height={getY(40) - getY(60)} 
          fill="rgba(226, 232, 240, 0.4)" 
          pointerEvents="none" 
        />
        <text x={width - paddingRight - 8} y={getY(50) + 4} textAnchor="end" fontSize="9" fontWeight="800" fill="#94a3b8" letterSpacing="0.5px">
          INTENSIDAD MEDIA
        </text>

        {xCoords.map((x, i) => (
          <line key={i} x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke="#e2e8f0" strokeWidth="1.5" />
        ))}

        <path 
          d={pathD} 
          fill="none" 
          stroke="url(#disc-grad)" 
          strokeWidth="4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0px 3px 6px rgba(59, 130, 246, 0.35))' }}
        />

        <defs>
          <linearGradient id="disc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="33%" stopColor="#f59e0b" />
            <stop offset="66%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {points.map((val, i) => {
          const labels = ['D', 'I', 'S', 'C'];
          const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
          return (
            <g key={i}>
              <circle 
                cx={xCoords[i]} 
                cy={getY(val)} 
                r="7" 
                fill={colors[i]} 
                stroke="#ffffff" 
                strokeWidth="2.5" 
                style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}
              />
              <text x={xCoords[i]} y={getY(val) - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1e293b">
                {val}%
              </text>
              <text x={xCoords[i]} y={paddingTop + chartHeight + 20} textAnchor="middle" fontSize="14" fontWeight="900" fill={colors[i]}>
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Componente visual del flujo cognitivo
const CognitiveFlowRow = ({ letter, name, desc, score }: { letter: string; name: string; desc: string; score: number }) => {
  const isLow = score <= 33;
  const isMid = score > 33 && score <= 66;

  const renderStickFigure = () => {
    if (isLow) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7v8M12 15l-3 5M12 15l3 5M9 10h6" />
        </svg>
      );
    } else if (isMid) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
          <circle cx="13" cy="4" r="2" />
          <path d="M13 6v6l-2 3-2 3M13 8l3 3M11 12l2 3 3-1" />
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
          <circle cx="15" cy="4" r="2" />
          <path d="m18 10-4-1-3 3M11 9v4l-3 4-2-1M13 13l3 3h3M9 13l2-3" />
        </svg>
      );
    }
  };

  const getLabel = () => {
    if (isLow) return 'Procrastina';
    if (isMid) return '+/-';
    return 'Fluye';
  };

  const getLabelColor = () => {
    if (isLow) return '#ef4444';
    if (isMid) return '#d97706';
    return '#059669';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 60px', gap: '16px', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: '#eff6ff', 
          color: '#2563eb', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontWeight: 800, 
          fontSize: '14px',
          border: '1.5px solid #dbeafe',
          flexShrink: 0
        }}>
          {letter}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>{name}</h4>
          <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 500, lineHeight: 1.2 }}>{desc}</span>
        </div>
      </div>

      <div style={{ position: 'relative', height: '36px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', height: '10px', borderRadius: '9999px', background: '#f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ borderRight: '1px solid rgba(226, 232, 240, 0.5)', background: score > 0 ? (score > 33 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.3)') : 'transparent' }} />
          <div style={{ borderRight: '1px solid rgba(226, 232, 240, 0.5)', background: score > 33 ? (score > 66 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.3)') : 'transparent' }} />
          <div style={{ background: score > 66 ? 'rgba(59, 130, 246, 0.3)' : 'transparent' }} />
        </div>

        <div style={{ 
          position: 'absolute', 
          left: 0, 
          height: '10px', 
          width: `${score}%`, 
          background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)', 
          borderRadius: '9999px 0 0 9999px',
          pointerEvents: 'none' 
        }} />

        <div style={{ position: 'absolute', bottom: '-4px', left: 0, width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Procrastina</span>
          <span>+/-</span>
          <span>Fluye</span>
        </div>

        <div style={{ 
          position: 'absolute', 
          left: `calc(${score}% - 12px)`, 
          top: '-1px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          transition: 'left 0.5s ease-out',
          zIndex: 10
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '50%', 
            padding: '2px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)', 
            border: `1.5px solid ${isLow ? '#ef4444' : isMid ? '#f59e0b' : '#10b981'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px'
          }}>
            {renderStickFigure()}
          </div>
          <span style={{ fontSize: '8px', fontWeight: 900, color: getLabelColor(), background: 'white', padding: '1px 4px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '2px', border: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>
            {getLabel()}
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'right', fontWeight: 900, fontSize: '16px', color: '#1e293b' }}>
        {score}
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>/100</span>
      </div>
    </div>
  );
};

export default function CandidatesAdmin() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalUrl, setPortalUrl] = useState(`https://uneteanuestroequipo.ec.aseyco.com/${user?.company_slug || 'superdeporte'}/onboarding`)
  const [isMounted, setIsMounted] = useState(false)

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`
  const [errorMsg, setErrorMsg] = useState('')

  // Selección de Pestañas
  const [activeTab, setActiveTab] = useState<'onboarding' | 'seleccion' | 'ranking' | 'pipeline' | 'estadisticas' | 'nomina' | 'formativas'>('seleccion')
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
  const [rankingFilterSector, setRankingFilterSector] = useState('ALL')
  const [rankingFilterCiudad, setRankingFilterCiudad] = useState('')
  const [rankingFilterRegion, setRankingFilterRegion] = useState('ALL')
  const [rankingFilterEdad, setRankingFilterEdad] = useState('ALL')
  const [rankingFilterGenero, setRankingFilterGenero] = useState('ALL')
  const [showJobMaintenance, setShowJobMaintenance] = useState(false)
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null)

  // === SEGUIMIENTO DE CANDIDATOS ===
  const [trackingMap, setTrackingMap] = useState<Record<string, any>>({})
  const [trackingUpdating, setTrackingUpdating] = useState<string | null>(null)
  const [interviewModal, setInterviewModal] = useState<{ id: string; name: string; resumeId: string; cargo: string } | null>(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewTime, setInterviewTime] = useState('09:00')
  const [interviewNotes, setInterviewNotes] = useState('Cita en Galo Plaza Lasso 13205 y de los Cerezos.')

  // === PASS TO RANKING DIRECTLY MODAL ===
  const [passToRankingModal, setPassToRankingModal] = useState<{ id: string; name: string; defaultCargo: string } | null>(null)
  const [selectedRankingCargo, setSelectedRankingCargo] = useState('')
  const [customRankingCargo, setCustomRankingCargo] = useState('')

  // === PIPELINE GLOBAL ===
  const [pipelineData, setPipelineData] = useState<any[]>([])
  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [pipelineFilter, setPipelineFilter] = useState('ALL')
  const [pipelineCargoFilter, setPipelineCargoFilter] = useState('')
  const [pipelineUpdating, setPipelineUpdating] = useState<string | null>(null)

  // === EVALUACIÓN PSICOMÉTRICA ===
  const [psychometricTests, setPsychometricTests] = useState<any[]>([])
  const [viewingPsychometric, setViewingPsychometric] = useState<any | null>(null)
  const [sendingPsychometricId, setSendingPsychometricId] = useState<string | null>(null)
  const [sendingThankYouId, setSendingThankYouId] = useState<string | null>(null)
  const [viewingFormData, setViewingFormData] = useState<any | null>(null)
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<any | null>(null)
  const [activeResultsTab, setActiveResultsTab] = useState<'disc' | 'cognicion' | 'preguntas'>('disc')
  const [openAiKey, setOpenAiKey] = useState('')

  // === CONFIGURACIÓN DE POSTULACIONES POR EMPRESA ===
  const [companySettings, setCompanySettings] = useState<Record<string, boolean>>({
    superdeporte: true,
    medeport: true,
    equinox: true
  })

  // === MÓDULO DE FORMATIVAS ===
  const [formativeCandidates, setFormativeCandidates] = useState<any[]>([])
  const [formativeSupervisors, setFormativeSupervisors] = useState<any[]>([])
  const [formativeAssignments, setFormativeAssignments] = useState<any[]>([])
  const [formativeEvaluations, setFormativeEvaluations] = useState<any[]>([])
  const [formativeOptions, setFormativeOptions] = useState<any[]>([])
  const [activeEvaluatingCandidateId, setActiveEvaluatingCandidateId] = useState<string | null>(null)
  const [formativeSessionTitle, setFormativeSessionTitle] = useState(() => {
    const today = new Date()
    const ymd = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}`
    return `Formativas ${ymd}`
  })
  const [formativeSessionFilter, setFormativeSessionFilter] = useState<string>('ALL')
  const [formativeSessions, setFormativeSessions] = useState<string[]>([])
  const [formativeNameFilter, setFormativeNameFilter] = useState('')
  const [formativasSubTab, setFormativasSubTab] = useState<'candidatos' | 'resultados' | 'medica' | 'fase2'>('candidatos')
  const [fase2MinScore, setFase2MinScore] = useState(0)
  const [promotingFase2, setPromotingFase2] = useState(false)
  const [sendingBulkOnboarding, setSendingBulkOnboarding] = useState(false)
  
  // Modals / Inputs
  const [showMassCitationModal, setShowMassCitationModal] = useState(false)
  const [massCitationDate, setMassCitationDate] = useState('')
  const [massCitationTime, setMassCitationTime] = useState('09:00')
  const [sendingMassCitation, setSendingMassCitation] = useState(false)
  
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappTemplateText, setWhatsappTemplateText] = useState(
    `Estimad@ candidat@, te invitamos a participar en nuestro proceso de selección para nuestras tiendas Marathon en Quito, llamado "Formativas". ⚽\n` +
    `Te comparto los detalles para que puedas asistir: \n` +
    `📅Fecha: Viernes 12 de junio de 2026. \n` +
    `🕘Hora: 09h30 (Trata de llegar 10 min. antes)\n` +
    `📍Dirección: Av. Galo Plaza Lasso 13205 y De los Cerezos.\n` +
    `Te recomendamos asistir con un estilo semiformal y zapatos deportivos. Por favor confirma tu asistencia.`
  )
  
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [savingSupervisor, setSavingSupervisor] = useState(false)
  
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [newOptionWeight, setNewOptionWeight] = useState(10)
  const [newOptionCategory, setNewOptionCategory] = useState('Formación')
  const [savingOption, setSavingOption] = useState(false)

  const fetchFormativeData = async () => {
    if (!user) return
    try {
      // Candidatos de formativas de toda la empresa (sin filtro por usuario individual)
      const { data: cands } = await supabase
        .from('formative_candidates')
        .select('*, email_resumes(*)')
        .order('created_at', { ascending: false })

      // Supervisores de toda la empresa (sin filtro por usuario individual)
      const { data: sups } = await supabase
        .from('formative_supervisors')
        .select('*')
        .order('name', { ascending: true })

      const { data: evals } = await supabase.from('formative_evaluations').select('*')
      const { data: opts } = await supabase.from('formative_options').select('*').order('category', { ascending: true })
      
      const { data: activeRec } = await supabase
        .from('recruiter_active_candidate')
        .select('active_candidate_id')
        .eq('recruiter_user', user.cedula)
        .maybeSingle()
      
      if (cands) {
        // Filtrar sólo por empresa para ver todos los candidatos de la compañía
        const filteredCands = cands.filter((c: any) => c.email_resumes?.company_slug === user.company_slug)
        setFormativeCandidates(filteredCands)
        // Extraer sesiones únicas para el selector
        const sessions = [...new Set(
          filteredCands
            .map((c: any) => c.session_title)
            .filter((s: any) => s && s.trim() !== '')
        )] as string[]
        sessions.sort((a, b) => b.localeCompare(a)) // Más reciente primero
        setFormativeSessions(sessions)
        // Si hay sesiones y el filtro activo no existe, seleccionar la más reciente
        if (sessions.length > 0 && formativeSessionFilter === 'ALL') {
          // No auto-seleccionar, dejar que el user elija
        }
      }
      if (sups) setFormativeSupervisors(sups)
      setFormativeAssignments([])
      if (evals) setFormativeEvaluations(evals)
      if (opts) setFormativeOptions(opts)
      if (activeRec) {
        setActiveEvaluatingCandidateId(activeRec.active_candidate_id)
      } else {
        setActiveEvaluatingCandidateId(null)
      }
    } catch (e) {
      console.error('Error fetching formative data:', e)
    }
  }

  const handleToggleFormative = async (p: any) => {
    if (!user) return
    const isSelected = formativeCandidates.some(c => c.resume_id === p.resume_id)
    try {
      if (isSelected) {
        const candToRemove = formativeCandidates.find(c => c.resume_id === p.resume_id)
        if (candToRemove) {
          const { error } = await supabase.from('formative_candidates').delete().eq('id', candToRemove.id)
          if (error) throw error
          setFormativeCandidates(prev => prev.filter(c => c.id !== candToRemove.id))
        }
      } else {
        const sessionToUse = formativeSessionTitle.trim() || 'Sin Título'
        const { data, error } = await supabase.from('formative_candidates').insert({
          resume_id: p.resume_id,
          created_by_user: user.cedula,
          session_title: sessionToUse
        }).select().single()
        if (error) throw error
        if (data) {
          await fetchFormativeData()
        }
      }
    } catch (e: any) {
      alert('Error al actualizar candidato formativo: ' + e.message)
    }
  }

  const handleSendMassCitation = async () => {
    if (formativeCandidates.length === 0) {
      alert('No hay candidatos en formativas para citar.')
      return
    }
    if (!massCitationDate || !massCitationTime) {
      alert('Por favor selecciona fecha y hora.')
      return
    }
    
    setSendingMassCitation(true)
    try {
      const candidatesPayload = formativeCandidates.map(c => ({
        email: c.email_resumes?.sender_email,
        name: c.email_resumes?.sender_name,
        cargo: c.email_resumes?.position || 'Candidato'
      })).filter(c => c.email)

      const res = await fetch('/api/send-mass-citation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates: candidatesPayload,
          date: massCitationDate,
          time: massCitationTime,
          companySlug: user?.company_slug
        })
      })

      const data = await res.json()
      if (res.ok) {
        const formativeIds = formativeCandidates.map(c => c.id)
        const { error } = await supabase
          .from('formative_candidates')
          .update({
            interview_date: massCitationDate,
            interview_time: massCitationTime,
            email_sent: true
          })
          .in('id', formativeIds)

        if (error) throw error

        alert(`✅ Cita grupal programada con éxito. Se enviaron ${data.count} correos masivos.`)
        await fetchFormativeData()
        setShowMassCitationModal(false)
      } else {
        alert('❌ Error al enviar correos masivos: ' + (data.error || 'Desconocido'))
      }
    } catch (e: any) {
      alert('❌ Error al enviar citación masiva: ' + e.message)
    } finally {
      setSendingMassCitation(false)
    }
  }

  const handleCleanupNonAttendees = async () => {
    if (!user) return
    const sessionToDepurate = formativeSessionFilter
    const sessionLabel = sessionToDepurate === 'ALL' ? 'TODAS las sesiones' : `la sesión "${sessionToDepurate}"`
    
    // Filter candidates in current company & view that fail either condition
    const filteredCands = formativeCandidates.filter(c => {
      const matchesSession = sessionToDepurate === 'ALL' || c.session_title === sessionToDepurate
      const matchesCompany = c.email_resumes?.company_slug === user.company_slug
      const isNotConfirmedOrNotAttended = !c.confirmed || !c.attended
      return matchesSession && matchesCompany && isNotConfirmedOrNotAttended
    })

    if (filteredCands.length === 0) {
      alert('No hay candidatos en esta vista que no hayan confirmado y asistido.')
      return
    }

    const confirmMessage = `Esta acción eliminará de forma permanente de ${sessionLabel} a los ${filteredCands.length} candidatos que:\n` +
      `- NO confirmaron (Confirmación desmarcada)\n` +
      `O\n` +
      `- NO asistieron (Asistencia desmarcada)\n\n` +
      `¿Estás seguro de que deseas continuar?`
      
    if (!window.confirm(confirmMessage)) return

    try {
      const idsToDelete = filteredCands.map(c => c.id)
      const { error } = await supabase
        .from('formative_candidates')
        .delete()
        .in('id', idsToDelete)
        
      if (error) throw error
      
      alert(`✅ Depuración completada. Se removieron ${idsToDelete.length} candidatos.`)
      await fetchFormativeData()
    } catch (e: any) {
      alert('❌ Error al depurar la convocatoria: ' + e.message)
    }
  }

  const handleCloseFormative = async () => {
    const sessionName = formativeSessionFilter !== 'ALL' ? formativeSessionFilter : formativeSessionTitle;
    if (!sessionName || sessionName === 'ALL') {
      alert('Por favor selecciona una sesión específica en el filtro superior para cerrarla y archivarla.');
      return;
    }
    
    if (!confirm(`¿Estás seguro de cerrar la sesión "${sessionName}"? Sus datos se descargarán en un archivo Excel y la pantalla quedará limpia para un nuevo registro.`)) return;

    const sessionCands = formativeCandidates.filter(c => c.session_title === sessionName);
    const dataToExport = sessionCands.map(c => {
      const cEvals = formativeEvaluations.filter(e => e.candidate_id === c.id);
      const totalScore = cEvals.reduce((sum, ev) => sum + ev.score, 0);
      const avgScore = cEvals.length > 0 ? Math.round(totalScore / cEvals.length) : 0;
      
      return {
        'Candidato': c.email_resumes?.sender_name || 'Desconocido',
        'Cédula': c.email_resumes?.cedula || '',
        'Cargo': c.email_resumes?.position || '',
        'Sesión': c.session_title,
        'Fecha Entrevista': c.interview_date || '',
        'Hora Entrevista': c.interview_time || '',
        'Asistió': c.attended ? 'Sí' : 'No',
        'Puntaje Promedio': avgScore,
        'Fase': c.fase || 1
      };
    });

    if (dataToExport.length > 0) {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Formativas");
      XLSX.writeFile(wb, `Formativas_${sessionName}.xlsx`);
    }

    const resumeIdsToArchive = sessionCands.map(c => c.resume_id).filter(Boolean);
    if (resumeIdsToArchive.length > 0) {
      const { error } = await supabase.from('candidate_tracking')
        .update({ status: 'FORMATIVA_CERRADA' })
        .in('resume_id', resumeIdsToArchive);
        
      if (!error) {
        setTrackingMap(prev => {
          const newMap = { ...prev };
          resumeIdsToArchive.forEach(id => {
            if (newMap[id]) newMap[id] = { ...newMap[id], status: 'FORMATIVA_CERRADA' };
          });
          return newMap;
        });
        fetchPipeline();
      }
      
      // Eliminar de formativas para que no salgan más en la pantalla
      await supabase.from('formative_candidates')
        .delete()
        .in('resume_id', resumeIdsToArchive);
        
      // Actualizar estado local
      setFormativeCandidates(prev => prev.filter(c => c.session_title !== sessionName));
    }

    const now = new Date();
    const newTitle = `Formativas ${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${now.getHours()}${now.getMinutes()}`;
    
    setFormativeSessionTitle(newTitle);
    setFormativeSessionFilter(newTitle);
    
    if (!formativeSessions.includes(newTitle)) {
      setFormativeSessions(prev => [newTitle, ...prev]);
    }

    alert(`✅ Sesión "${sessionName}" archivada con éxito. Se ha creado la nueva sesión "${newTitle}".`);
  };

  const handleExportMedica = () => {
    const sessionCands = formativeSessionFilter === 'ALL'
      ? formativeCandidates
      : formativeCandidates.filter(c => c.session_title === formativeSessionFilter);

    const passedCands = sessionCands.filter(c => c.fase === 2);

    if (passedCands.length === 0) {
      alert("No hay candidatos en esta fase para exportar.");
      return;
    }

    const dataToExport = passedCands.map(c => ({
      'NOMBRES Y APELLIDOS': c.email_resumes?.sender_name || 'Desconocido',
      'RESPONSABLE': c.created_by_user || 'Sin asignar',
      'CELULAR': c.email_resumes?.sender_phone || '',
      'CEDULA': c.email_resumes?.cedula || '',
      'CORREO': c.email_resumes?.sender_email || '',
      'DOMICILIO': c.email_resumes?.address || c.email_resumes?.city || '',
      'SECTOR': c.email_resumes?.sector || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Valoracion Medica");
    const sessionName = formativeSessionFilter !== 'ALL' ? formativeSessionFilter : 'Todas';
    XLSX.writeFile(wb, `Valoracion_Medica_${sessionName}.xlsx`);
  }

  const handleCreateSupervisor = async () => {
    if (!user) return
    if (!supervisorName.trim() || !supervisorEmail.trim()) return
    setSavingSupervisor(true)
    try {
      const { error } = await supabase.from('formative_supervisors').insert({
        name: supervisorName.trim(),
        email: supervisorEmail.trim().toLowerCase(),
        created_by_user: user.cedula
      })
      if (error) throw error
      setSupervisorName('')
      setSupervisorEmail('')
      await fetchFormativeData()
    } catch (e: any) {
      alert('Error al registrar supervisor: ' + e.message)
    } finally {
      setSavingSupervisor(false)
    }
  }

  const handleDeleteSupervisor = async (id: string) => {
    if (!confirm('¿Deseas eliminar este supervisor?')) return
    try {
      const { error } = await supabase.from('formative_supervisors').delete().eq('id', id)
      if (error) throw error
      await fetchFormativeData()
    } catch (e: any) {
      alert('Error al eliminar supervisor: ' + e.message)
    }
  }

  const handleSetActiveEvaluatingCandidate = async (candidateId: string | null) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('recruiter_active_candidate')
        .upsert({
          recruiter_user: user.cedula,
          active_candidate_id: candidateId,
          updated_at: new Date().toISOString()
        })
      if (error) throw error
      setActiveEvaluatingCandidateId(candidateId)
    } catch (e: any) {
      alert('Error al activar candidato: ' + e.message)
    }
  }

  // Alterna is_evaluating de un candidato individual
  const handleToggleEvaluating = async (candidate: any) => {
    const newValue = !candidate.is_evaluating
    try {
      const { error } = await supabase
        .from('formative_candidates')
        .update({ is_evaluating: newValue })
        .eq('id', candidate.id)
      if (error) throw error
      setFormativeCandidates(prev =>
        prev.map(c => c.id === candidate.id ? { ...c, is_evaluating: newValue } : c)
      )
    } catch (e: any) {
      alert('Error al actualizar estado de evaluación: ' + e.message)
    }
  }

  // Marca/desmarca TODOS los candidatos de la sesión activa
  const handleBulkEvaluating = async (value: boolean) => {
    const session = formativeSessionFilter
    const targets = session === 'ALL'
      ? formativeCandidates
      : formativeCandidates.filter(c => c.session_title === session)
    if (targets.length === 0) { alert('No hay candidatos en esta vista.'); return }
    const ids = targets.map(c => c.id)
    try {
      const { error } = await supabase
        .from('formative_candidates')
        .update({ is_evaluating: value })
        .in('id', ids)
      if (error) throw error
      setFormativeCandidates(prev =>
        prev.map(c => ids.includes(c.id) ? { ...c, is_evaluating: value } : c)
      )
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
  }

  // Promueve candidatos a Fase 2
  const handlePromoteToFase2 = async (candidateIds: string[]) => {
    if (candidateIds.length === 0) { alert('No hay candidatos para promover.'); return }
    setPromotingFase2(true)
    try {
      const { error } = await supabase
        .from('formative_candidates')
        .update({ fase: 2 })
        .in('id', candidateIds)
      if (error) throw error
      setFormativeCandidates(prev =>
        prev.map(c => candidateIds.includes(c.id) ? { ...c, fase: 2 } : c)
      )
      alert(`✅ ${candidateIds.length} candidato(s) promovido(s) a Fase 2.`)
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setPromotingFase2(false)
    }
  }

  const handleCreateOption = async () => {
    if (!newOptionLabel.trim()) return
    setSavingOption(true)
    try {
      const { error } = await supabase.from('formative_options').insert({
        label: newOptionLabel.trim(),
        weight: newOptionWeight,
        category: newOptionCategory
      })
      if (error) throw error
      setNewOptionLabel('')
      await fetchFormativeData()
    } catch (e: any) {
      alert('Error al crear criterio: ' + e.message)
    } finally {
      setSavingOption(false)
    }
  }

  const handleDeleteOption = async (id: string) => {
    if (!confirm('¿Deseas eliminar este criterio?')) return
    try {
      const { error } = await supabase.from('formative_options').delete().eq('id', id)
      if (error) throw error
      await fetchFormativeData()
    } catch (e: any) {
      alert('Error al eliminar criterio: ' + e.message)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase.from('company_settings').select('*')
      if (error) throw error
      if (data) {
        const settings: Record<string, boolean> = { superdeporte: true, medeport: true, equinox: true }
        data.forEach((row: any) => {
          settings[row.company_slug] = row.postulation_enabled
        })
        setCompanySettings(settings)
      }
    } catch (e) {
      console.error('Error fetching company settings:', e)
    }
  }

  const toggleCompanyPostulation = async (slug: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setCompanySettings(prev => ({ ...prev, [slug]: newStatus }))
    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({ company_slug: slug, postulation_enabled: newStatus }, { onConflict: 'company_slug' })
      if (error) throw error
    } catch (e: any) {
      console.error('Error updating company setting:', e)
      setCompanySettings(prev => ({ ...prev, [slug]: currentStatus }))
      alert('No se pudo actualizar la configuración en la base de datos: ' + e.message)
    }
  }

  useEffect(() => {
    if (!viewingPsychometric) {
      setAiRecommendation(null)
      return
    }
    setActiveResultsTab('disc')

    const rawRec = viewingPsychometric.test?.kudert_disc?.ai_recommendation
    if (rawRec) {
      const normalized = {
        compatibility: rawRec.compatibility || rawRec.compatibilidad || 'Media',
        summary: rawRec.summary || rawRec.resumen || rawRec.resumen_ejecutivo || '',
        strengths: rawRec.strengths || rawRec.fortalezas || [],
        risks: rawRec.risks || rawRec.riesgos || [],
        interview_questions: rawRec.interview_questions || rawRec.interviewQuestions || rawRec.preguntas_entrevista || rawRec.preguntas || []
      }
      setAiRecommendation(normalized)
    } else {
      const fetchRecommendation = async () => {
        setLoadingRecommendation(true)
        try {
          const res = await fetch('/api/psychometric/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: viewingPsychometric.test.id,
              cargo: viewingPsychometric.candidate?.position || viewingPsychometric.test.candidate?.position || 'Candidato',
              apiKey: openAiKey
            })
          })
          const data = await res.json()
          if (data.success && data.recommendation) {
            const normalized = {
              compatibility: data.recommendation.compatibility || data.recommendation.compatibilidad || 'Media',
              summary: data.recommendation.summary || data.recommendation.resumen || data.recommendation.resumen_ejecutivo || '',
              strengths: data.recommendation.strengths || data.recommendation.fortalezas || [],
              risks: data.recommendation.risks || data.recommendation.riesgos || [],
              interview_questions: data.recommendation.interview_questions || data.recommendation.interviewQuestions || data.recommendation.preguntas_entrevista || data.recommendation.preguntas || []
            }
            setAiRecommendation(normalized)

            // Actualizar el estado del modal actual para reflejar la recomendación
            setViewingPsychometric((prev: any) => {
              if (!prev || prev.test.id !== viewingPsychometric.test.id) return prev
              return {
                ...prev,
                test: {
                  ...prev.test,
                  kudert_disc: {
                    ...prev.test.kudert_disc,
                    ai_recommendation: normalized
                  }
                }
              }
            })

            // Actualizar la lista en memoria
            setPsychometricTests(prev => prev.map(t => t.id === viewingPsychometric.test.id ? {
              ...t,
              kudert_disc: {
                ...t.kudert_disc,
                ai_recommendation: normalized
              }
            } : t))
          } else {
            console.error('Error al generar recomendación:', data.error)
            alert('No se pudo generar la guía de entrevista: ' + (data.error || 'Error desconocido'))
          }
        } catch (e: any) {
          console.error('Error al cargar recomendación:', e)
          alert('Error de conexión o de servidor al generar la guía: ' + (e.message || 'Error desconocido'))
        } finally {
          setLoadingRecommendation(false)
        }
      }
      fetchRecommendation()
    }
  }, [viewingPsychometric, openAiKey])

  // === BANDEJA FILTERS ===
  const [inboxSearch, setInboxSearch] = useState('')
  const [inboxCargo, setInboxCargo] = useState('')
  const [inboxCity, setInboxCity] = useState('')
  const [inboxExp, setInboxExp] = useState('')
  const [inboxSector, setInboxSector] = useState('')
  const [inboxCedula, setInboxCedula] = useState('')
  const [inboxPage, setInboxPage] = useState(1)

  useEffect(() => {
    setInboxPage(1)
  }, [inboxSearch, inboxCargo, inboxCity, inboxExp, inboxSector, inboxCedula])


  // === ESTADOS COPILOTO IA ===
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([
    { role: 'assistant', content: '¡Hola! Soy tu Copiloto de IA para selección de personal. Puedo ayudarte a buscar candidatos, comparar perfiles, analizar resultados psicométricos y responder preguntas sobre tu base de datos de postulantes. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  // === CÁLCULO DE ESTADÍSTICAS AVANZADAS ===
  const stats = useMemo(() => {
    const total = resumes.length;
    if (total === 0) return null;

    // 1. Cargos más postulados
    const positionsMap: Record<string, number> = {};
    // 2. Medios de postulación
    const heardFromMap: Record<string, number> = {
      LinkedIn: 0,
      Facebook: 0,
      Telegram: 0,
      Referidos: 0,
      Otros: 0
    };
    // 3. Sectores
    const sectorsMap: Record<string, number> = {
      Norte: 0,
      Centro: 0,
      Sur: 0,
      Cumbayá: 0,
      'Valle de los Chillos': 0,
      'Via la Costa': 0,
      Samborondon: 0
    };
    // 4. Estudios
    const educationMap: Record<string, number> = {
      Bachiller: 0,
      'Instrucción técnica completa': 0,
      'Instrucción técnica incompleta': 0,
      'Universidad Completa': 0,
      'Universidad Incompleta': 0
    };
    // 5. Deportes
    let likesSportsCount = 0;
    let totalSportsAnswered = 0;

    // 6. Edades
    let totalAge = 0;
    let ageCount = 0;
    const ageRanges = {
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46+': 0
    };

    resumes.forEach(r => {
      // Posiciones
      if (r.position) {
        positionsMap[r.position] = (positionsMap[r.position] || 0) + 1;
      }

      // Medios
      if (r.heard_from && r.heard_from in heardFromMap) {
        heardFromMap[r.heard_from]++;
      } else if (r.heard_from) {
        heardFromMap['Otros']++;
      }

      // Sectores
      if (r.sector && r.sector in sectorsMap) {
        sectorsMap[r.sector]++;
      }

      // Estudios
      if (r.education_level && r.education_level in educationMap) {
        educationMap[r.education_level]++;
      }

      // Deportes
      if (r.likes_sports) {
        totalSportsAnswered++;
        if (r.likes_sports === 'Si') {
          likesSportsCount++;
        }
      }

      // Edades
      if (r.age) {
        const parsedAge = parseInt(r.age);
        if (!isNaN(parsedAge)) {
          totalAge += parsedAge;
          ageCount++;
          if (parsedAge <= 25) ageRanges['18-25']++;
          else if (parsedAge <= 35) ageRanges['26-35']++;
          else if (parsedAge <= 45) ageRanges['36-45']++;
          else ageRanges['46+']++;
        }
      }
    });

    const averageAge = ageCount > 0 ? Math.round(totalAge / ageCount) : 0;
    const likesSportsPct = totalSportsAnswered > 0 ? Math.round((likesSportsCount / totalSportsAnswered) * 100) : 0;

    const topPositions = Object.entries(positionsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => ({ name: entry[0], count: entry[1] }));

    const pipelineCount = pipelineData.length;
    const formativeCount = formativeCandidates.length;
    const onboardingCount = candidates.length;
    const selectedCount = candidates.filter((c: any) => c.status === 'SYNCED' || c.status === 'LLENADO').length;

    return {
      total,
      heardFromMap,
      sectorsMap,
      educationMap,
      likesSportsPct,
      likesSportsCount,
      likesSportsNo: totalSportsAnswered - likesSportsCount,
      averageAge,
      ageRanges,
      topPositions,
      pipelineCount,
      formativeCount,
      onboardingCount,
      selectedCount
    };
  }, [resumes, pipelineData, formativeCandidates, candidates]);

  const displayedRankingCandidates = useMemo(() => {
    if (!rankingCargo) return [];
    
    const trackedResumeIds = Object.keys(trackingMap).filter(resumeId => {
      const tracking = trackingMap[resumeId];
      return tracking && tracking.cargo === rankingCargo && tracking.status !== 'FORMATIVA_CERRADA';
    });

    const aiResultsMap = new Map<string, any>();
    rankingResults.forEach(r => {
      aiResultsMap.set(r.id, r);
    });

    const unifiedList: any[] = [];

    rankingResults.forEach(r => {
      if (trackingMap[r.id]?.status === 'FORMATIVA_CERRADA') return;
      unifiedList.push({
        id: r.id,
        name: r.name || r.sender_name || 'Sin Nombre',
        city: r.city || r.ciudad || '',
        score: r.score || 0,
        justification: r.justification || 'Evaluado por IA',
        pdf_url: r.pdf_url || '',
        position: r.position || '',
        experience: r.experience || '',
        sender_phone: r.sender_phone || '',
        sender_email: r.sender_email || r.email || ''
      });
    });

    trackedResumeIds.forEach(resumeId => {
      if (!aiResultsMap.has(resumeId)) {
        const resume = resumes.find(res => res.id === resumeId);
        if (resume) {
          unifiedList.push({
            id: resume.id,
            name: resume.sender_name || 'Sin Nombre',
            city: resume.city || '',
            score: 0,
            justification: 'Candidato asignado directamente al cargo.',
            pdf_url: resume.pdf_url || '',
            position: resume.position || '',
            experience: resume.experience_years || '',
            sender_phone: resume.sender_phone || '',
            sender_email: resume.sender_email || ''
          });
        }
      }
    });

    // Filtros solicitados por el usuario
    return unifiedList.filter(item => {
      const email = (item.sender_email || '').toLowerCase().trim();
      if (!email) return true;

      // 1. Ya se les envió mail de onboarding
      const inOnboarding = candidates.some((c: any) => (c.email || '').toLowerCase().trim() === email);
      if (inOnboarding) return false;

      // 2. Se rechazó (tracking status === 'RECHAZADO')
      const tracking = trackingMap[item.id];
      if (tracking && tracking.status === 'RECHAZADO') return false;

      // 3. Están en la pantalla Resumen (pipelineData) pero NO pasaron a formativas (formativeCandidates)
      const inResumen = pipelineData.some((p: any) => p.resume_id === item.id);
      if (inResumen) {
        const passedToFormativas = formativeCandidates.some((fc: any) => fc.resume_id === item.id);
        if (!passedToFormativas) {
          return false;
        }
      }

      return true;
    });
  }, [rankingCargo, rankingResults, trackingMap, resumes, candidates, pipelineData, formativeCandidates]);

  useEffect(() => {
    setIsMounted(true)
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      // Actualizar la URL con el slug real del usuario cuando esté disponible
      setPortalUrl(`https://uneteanuestroequipo.ec.aseyco.com/${user.company_slug}/onboarding`)
      const savedKey = localStorage.getItem('openai_api_key')
      if (savedKey) setOpenAiKey(savedKey)
      
      // Ajustar pestaña inicial según el perfil
      if (user.perfil === 'NOMINA' && activeTab !== 'nomina') {
        setActiveTab('nomina')
      }

      fetchCandidates()
      fetchResumes()
      fetchJobPositions()
      fetchPipeline()
      fetchCompanySettings()
      fetchFormativeData()
    }
  }, [user])

  // Polling para mantener actualizadas las calificaciones formativas en tiempo real
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      fetchFormativeData()
    }, 4000)
    return () => clearInterval(interval)
  }, [user])

  const fetchPipeline = async () => {
    if (!user) return
    setPipelineLoading(true)
    const res = await fetch(`/api/candidate-tracking?company_slug=${user.company_slug}`)
    const data = await res.json()
    if (data.data) {
      // Filtrar solo por empresa para el resumen global
      setPipelineData(data.data.filter((p: any) => 
        p.candidate?.company_slug === user.company_slug
      ))
    }
    // Cargar pruebas psicométricas
    const { data: psychData } = await supabase.from('candidate_psychometric_tests').select('*')
    if (psychData) setPsychometricTests(psychData)
    setPipelineLoading(false)
  }

  const handleDeleteResume = async (resume: any) => {
    const resumeId = resume.id

    // 1. Verificar que no está en Ranking (trackingMap)
    const inRanking = !!trackingMap[resumeId]
    // 2. Verificar que no está en Resumen/Pipeline
    const inPipeline = pipelineData.some(p => p.resume_id === resumeId)
    // 3. Verificar que no está en Formativas
    const inFormativas = formativeCandidates.some(c => c.resume_id === resumeId)

    if (inRanking || inPipeline || inFormativas) {
      const donde = [inRanking && 'Ranking IA', inPipeline && 'Resumen', inFormativas && 'Formativas'].filter(Boolean).join(', ')
      alert(`❌ No se puede borrar este candidato porque ya está en: ${donde}.\n\nRetíralo de esas secciones primero.`)
      return
    }

    if (!confirm(`⚠️ ¿Borrar permanentemente el registro de ${resume.sender_name || 'este candidato'}?\n\nSe eliminará su datos y el PDF adjunto. Esta acción no se puede deshacer.`)) return

    try {
      // 4. Eliminar PDF del storage de Supabase si existe
      if (resume.pdf_url) {
        const parts = resume.pdf_url.split('candidate-documents/')
        if (parts.length > 1) {
          const storageFileName = decodeURIComponent(parts[1].split('?')[0])
          await supabase.storage.from('candidate-documents').remove([storageFileName])
        }
      }

      // 5. Eliminar registro de email_resumes
      const { error } = await supabase.from('email_resumes').delete().eq('id', resumeId)
      if (error) throw error

      // 6. Actualizar estado local
      setResumes(prev => prev.filter(r => r.id !== resumeId))
      alert('✅ Candidato eliminado correctamente.')
    } catch (err: any) {
      console.error('Error al borrar candidato:', err)
      alert('❌ Error al borrar: ' + err.message)
    }
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
    if (!candidate) {
      const formativeCand = formativeCandidates.find(c => c.resume_id === resumeId);
      if (formativeCand && formativeCand.email_resumes) {
        candidate = {
          ...formativeCand.email_resumes,
          sender_email: formativeCand.email_resumes.sender_email || formativeCand.email_resumes.email,
          sender_name: formativeCand.email_resumes.sender_name || formativeCand.email_resumes.name,
          sender_phone: formativeCand.email_resumes.sender_phone || formativeCand.email_resumes.phone || formativeCand.email_resumes.cellphone || formativeCand.email_resumes.telefono,
          position: formativeCand.email_resumes.position
        };
      }
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
          candidateEmail: candidate.sender_email,
          companySlug: user?.company_slug
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

  const handleSendBulkOnboarding = async (targets: any[]) => {
    if (targets.length === 0) {
      alert("No hay candidatos seleccionados para onboarding.");
      return;
    }
    const confirmMsg = `¿Estás seguro de enviar correo de onboarding a los ${targets.length} candidato(s) de la Fase 2?`;
    if (!confirm(confirmMsg)) return;

    setSendingBulkOnboarding(true);
    let successCount = 0;
    let errorCount = 0;

    for (const c of targets) {
      if (!c.resume_id) continue;
      try {
        let candidate = resumes.find(r => r.id === c.resume_id);
        if (!candidate) {
          candidate = rankingResults.find(r => r.id === c.resume_id);
        }
        if (!candidate) {
          const pipeEntry = pipelineData.find(p => p.resume_id === c.resume_id);
          candidate = pipeEntry?.candidate;
        }
        if (!candidate && c.email_resumes) {
          candidate = {
            ...c.email_resumes,
            sender_email: c.email_resumes.sender_email || c.email_resumes.email,
            sender_name: c.email_resumes.sender_name || c.email_resumes.name,
            sender_phone: c.email_resumes.sender_phone || c.email_resumes.phone || c.email_resumes.cellphone || c.email_resumes.telefono,
            position: c.email_resumes.position
          };
        }

        if (!candidate || !candidate.sender_email) continue;

        const names = (candidate.sender_name || candidate.name || '').split(' ');
        const candidatePayload = {
          email: candidate.sender_email,
          nombres: names[0] || '',
          apellidos: names.slice(1).join(' ') || '',
          telefono: candidate.sender_phone || '',
          cedula: `PENDIENTE-${candidate.sender_email}`,
          cargo: candidate.position || (pipelineData.find(p => p.resume_id === c.resume_id)?.cargo) || '',
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

        if (onboardErr) throw onboardErr;

        const mailRes = await fetch('/api/send-approval-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: candidate.sender_name || candidate.name,
            candidateEmail: candidate.sender_email,
            companySlug: user?.company_slug
          })
        });

        if (!mailRes.ok) throw new Error("Error SMTP");
        successCount++;
      } catch (err) {
        console.error(err);
        errorCount++;
      }
    }

    setSendingBulkOnboarding(false);
    fetchCandidates();
    alert(`✅ Envío masivo completado.\nExitosos: ${successCount}\nErrores: ${errorCount}`);
  }

  const handleSendPsychometricEmail = async (candidate: any, cargo: string) => {
    if (!candidate || !candidate.id) return
    if (!confirm(`¿Deseas enviar la citación de evaluación psicométrica a ${candidate.sender_email}?`)) return
    
    setSendingPsychometricId(candidate.id)
    try {
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: candidate.sender_email,
          name: candidate.sender_name || candidate.name,
          cargo,
          candidateId: candidate.id
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert('✅ Correo de invitación con el enlace y QR enviado con éxito.')
        fetchPipeline()
      } else {
        alert('❌ Error al enviar correo: ' + (data.error || 'Fallo desconocido'))
      }
    } catch (e: any) {
      alert('❌ Error de conexión: ' + e.message)
    } finally {
      setSendingPsychometricId(null)
    }
  }

  const fetchJobPositions = async () => {
    if (!user?.company_slug) return
    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('company_slug', user.company_slug)
      .order('cargo', { ascending: true })
    if (data) {
      // Eliminar duplicados por nombre de cargo
      const seen = new Set<string>()
      const unique = data.filter(p => {
        const key = p.cargo.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      setJobPositions(unique)
    }
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
    setRankingResults([]) // Limpiar evaluaciones previas
    if (pos.cargo) {
      fetchTracking(pos.cargo)
    }
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
          company_slug: user?.company_slug,
          filterSector: rankingFilterSector,
          filterCiudad: rankingFilterCiudad,
          filterRegion: rankingFilterRegion,
          filterEdad: rankingFilterEdad,
          filterGenero: rankingFilterGenero
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
    if (!user) return
    const companyParam = user.company_slug ? `&company_slug=${encodeURIComponent(user.company_slug)}` : ''
    const res = await fetch(`/api/candidate-tracking?cargo=${encodeURIComponent(cargo)}${companyParam}`)
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
    if (!user?.company_slug) return
    setLoading(true)
    const { data } = await supabase
      .from('onboarding_candidates')
      .select('*')
      .eq('company_slug', user.company_slug)
      .neq('status', 'DELETED')
      .order('created_at', { ascending: false })
    if (data) setCandidates(data)
    setLoading(false)
  }

  const fetchResumes = async () => {
    if (!user?.company_slug) return
    setLoadingResumes(true)
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while(true) {
      const { data } = await supabase
        .from('email_resumes')
        .select('*')
        .eq('company_slug', user.company_slug)
        .order('received_date', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) break; // Se obtuvieron todos
        if (allData.length >= 10000) break; // Límite duro de 10000 para no explotar la memoria
      } else {
        break;
      }
      page++;
    }
    
    setResumes(allData)
    
    // Cargar pruebas psicométricas para que el Inbox esté actualizado
    const { data: psychData } = await supabase.from('candidate_psychometric_tests').select('*')
    if (psychData) setPsychometricTests(psychData)
    
    setLoadingResumes(false)
  }

  const handleExportNomina = () => {
    if (candidates.length === 0) {
      alert('No hay candidatos en Onboarding para exportar.');
      return;
    }

    const flatData = candidates.map((c, index) => {
      const p = c.datos_personales || {};
      const b = c.datos_bancarios || {};
      const fam = c.cargas_familiares || {};
      const conyuge = fam.conyuge || {};
      const hijos = fam.hijos || [];
      const estudio = c.educacion || {};

      let ap1 = p.apellido1 || '';
      let ap2 = p.apellido2 || '';
      if (!ap1 && !ap2 && c.apellidos) {
        const parts = c.apellidos.split(' ');
        ap1 = parts[0] || '';
        ap2 = parts.length > 1 ? parts.slice(1).join(' ') : '';
      }

      const primerHijo = hijos.length > 0 ? hijos[0] : {};
      const segundoHijo = hijos.length > 1 ? hijos[1] : {};

      return {
        "#": index + 1,
        "TERCERA_PT": "",
        "AUTORIZA EL TRATAMIENTO DE DATOS PERSONALES": p.tratamiento || "Sí",
        "TRABAJADOR NO": "",
        "INGRESA TUS DOS NOMBRES:": c.nombres || '',
        "INGRESA TU PRIMER APELLIDO:": ap1,
        "INGRESA TU SEGUNDO APELLIDO:": ap2,
        "CIUDAD DE NACIMIENTO": p.ciudad_nacimiento || '',
        "FECHA DE NACIMIENTO": p.fecha_nacimiento || '',
        "ESTADO CIVIL": p.estado_civil || '',
        "NACIONALIDAD": p.nacionalidad || '',
        "NÚMERO DE CÉDULA": c.cedula || '',
        "NÚMERO DE CTA O LIBRETA": b.numero_cuenta || '',
        "TIPO DE CTA": b.tipo_cuenta || '',
        "CIUDAD EN LA QUE RESIDES": p.ciudad_residencia || '',
        "DIRECCIÓN DOMICILIARIA (CALLE PRINCIPAL - CALLE SECUNDARIA - NUMERACIÓN)": p.direccion || '',
        "N° DE TELÉFONO CONVENCIONAL": p.telefono_fijo || 'S/n',
        "EN EL CASO DE CONTAR CON CARGAS FAMILIARES ESCOGE LAS OPCIONES": hijos.length.toString(),
        "EN EL CASO DE TENER CONYUGE, INGRESA EL NOMBRE COMPLETO: (2 NOMBRES)": conyuge.tiene ? `${conyuge.nombres || ''} ${conyuge.apellidos || ''}`.trim() : '',
        "FECHA DE NACIMIENTO DEL CÓNYUGE:": conyuge.fecha_nacimiento || '',
        "NACIONALIDAD DEL CÓNYUGE": conyuge.nacionalidad || '',
        "CIUDAD DE NACIMIENTO CÓNYUGE": conyuge.ciudad_nacimiento || '',
        "NÚMERO CÉDULA CÓNYUGE": conyuge.cedula || '',
        
        "EN EL CASO DE TENER HIJOS, INGRESE EL NOMBRE COMPLETO: (2 NOMBRES)": primerHijo.nombres ? `${primerHijo.nombres} ${primerHijo.apellidos}`.trim() : '',
        "FECHA DE NACIMIENTO DEL HIJO:": primerHijo.fecha_nacimiento || '',
        "NACIONALIDAD DEL HIJO:": primerHijo.nacionalidad || '',
        "CIUDAD DE NACIMIENTO DEL HIJO": primerHijo.ciudad_nacimiento || '',
        "NÚMERO CÉDULA HIJO": primerHijo.cedula || '',

        "EN EL CASO DE TENER HIJOS, INGRESE EL NOMBRE COMPLETO: (2 NOMBRES) ": segundoHijo.nombres ? `${segundoHijo.nombres} ${segundoHijo.apellidos}`.trim() : '',
        "FECHA DE NACIMIENTO DEL HIJO: ": segundoHijo.fecha_nacimiento || '',
        "NACIONALIDAD DEL HIJO: ": segundoHijo.nacionalidad || '',
        "CIUDAD DE NACIMIENTO DEL HIJO ": segundoHijo.ciudad_nacimiento || '',
        "NÚMERO CÉDULA HIJO ": segundoHijo.cedula || '',

        "Estudios:": estudio.nivel || '',
        "Título Obtenido:": estudio.titulo || '',
        "Nombre de Institución Educativa / Universidad :": estudio.institucion || '',
        "Fecha de inicio de estudios:": estudio.fecha_inicio || '',
        "Fecha de fin de estudios:": estudio.fecha_fin || '',
        "Número de celular": p.celular || c.telefono || '',
        "Correo electrónico": c.email || '',
        
        "En el caso de tener Cónyuge, ingresa el apellido completo: (2 apellidos)": conyuge.tiene ? conyuge.apellidos || '' : '',
        "En el caso de tener hijos, ingresa el apellido completo: (2 apellidos)": primerHijo.apellidos || '',
        "En el caso de tener hijos, ingresa el apellido completo: (2 apellidos) ": segundoHijo.apellidos || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(flatData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nómina");
    XLSX.writeFile(workbook, "Reporte_Nomina_Completa.xlsx");
  }

  const handleToggleReviewed = async (resume_id: string, currentStatus: string | null) => {
    const isCurrentlyReviewed = currentStatus === 'REVIEWED' || currentStatus === 'MANUALLY_REVIEWED';
    const newStatus = isCurrentlyReviewed ? null : 'MANUALLY_REVIEWED';
    
    const { error } = await supabase
      .from('email_resumes')
      .update({ classification_status: newStatus })
      .eq('id', resume_id);

    if (!error) {
      setResumes(prev => prev.map(r => r.id === resume_id ? { ...r, classification_status: newStatus } : r));
    } else {
      console.error("Error updating review status:", error);
      alert("Error al actualizar el estado de revisión.");
    }
  }

  const handleUpdatePhone = async (id: string, phone: string) => {
    const newPhone = window.prompt("Editar número de teléfono:", phone);
    if (newPhone === null) return;
    const { error } = await supabase.from('email_resumes').update({ sender_phone: newPhone }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
      fetchResumes();
      if (viewingFormData && viewingFormData.id === id) {
        setViewingFormData({ ...viewingFormData, sender_phone: newPhone });
      }
    }
  }

  const handleUpdateEmail = async (id: string, email: string) => {
    const newEmail = window.prompt("Editar correo electrónico:", email);
    if (newEmail === null) return;
    const { error } = await supabase.from('email_resumes').update({ sender_email: newEmail }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
      fetchResumes();
      if (viewingFormData && viewingFormData.id === id) {
        setViewingFormData({ ...viewingFormData, sender_email: newEmail });
      }
    }
  }

  const handleUpdateName = async (id: string, name: string) => {
    const newName = window.prompt("Editar nombre completo:", name);
    if (newName === null) return;
    const { error } = await supabase.from('email_resumes').update({ sender_name: newName }).eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
      fetchResumes();
      if (viewingFormData && viewingFormData.id === id) {
        setViewingFormData({ ...viewingFormData, sender_name: newName });
      }
    }
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

  const handleSendThankYouEmail = async (candidateId: string, email: string, name: string, cargo: string) => {
    if (!email) { alert('Este candidato no tiene email registrado.'); return; }
    if (!confirm(`¿Enviar correo de agradecimiento por postulación a ${name} (${email}) para el cargo de ${cargo}?`)) return;
    setSendingThankYouId(candidateId);
    try {
      const res = await fetch('/api/send-thank-you-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, cargo })
      });
      const data = await res.json();
      if (res.ok) alert('✅ Correo de agradecimiento enviado correctamente a ' + email);
      else alert('❌ Error al enviar correo: ' + (data.error || 'Fallo en el servidor'));
    } catch (e: any) {
      alert('❌ Error de conexión: ' + e.message);
    } finally {
      setSendingThankYouId(null);
    }
  }

  const handleScanEmails = async () => {
    if (!user) return
    setScanning(true)
    try {
      const res = await fetch('/api/scan-emails', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: user.cedula, company_slug: user.company_slug })
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
        await fetchResumes()
        alert('✅ Análisis completado con éxito.')
      } else {
        alert('❌ Error de IA: ' + (data.error || 'Fallo desconocido'))
      }
    } catch (err: any) {
      alert('❌ Error de conexión: ' + err.message)
    } finally {
      setAnalyzingId(null)
    }
  }

  const handlePassToRankingDirectly = async (resumeId: string, cargo: string) => {
    if (!cargo) {
      alert('Por favor selecciona o ingresa un cargo.');
      return;
    }
    setTrackingUpdating(resumeId);
    try {
      const res = await fetch('/api/candidate-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resume_id: resumeId, 
          cargo: cargo, 
          status: 'MENSAJE_ENVIADO', 
          created_by_cedula: user?.cedula,
          company_slug: user?.company_slug 
        })
      });
      const data = await res.json();
      if (data.success) {
        setTrackingMap(prev => ({ ...prev, [resumeId]: data.data }));
        alert('✅ Candidato enviado al ranking/pipeline con éxito.');
        fetchPipeline(); // Actualizar el pipeline
      } else {
        alert('❌ Error al enviar al ranking: ' + (data.error || 'Fallo desconocido'));
      }
    } catch (e: any) {
      alert('❌ Error de conexión: ' + e.message);
    } finally {
      setTrackingUpdating(null);
    }
  }

  const handleSendCopilotMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;

    const userMessage = { role: 'user', content: copilotInput };
    setCopilotMessages(prev => [...prev, userMessage]);
    setCopilotInput('');
    setCopilotLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: copilotMessages.slice(1), // Exclude initial greeting to keep context clean
          apiKey: openAiKey,
          company_slug: user?.company_slug
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setCopilotMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.error || 'No se pudo obtener respuesta de la IA.'}` }]);
      }
    } catch (err: any) {
      setCopilotMessages(prev => [...prev, { role: 'assistant', content: `❌ Error de conexión: ${err.message}` }]);
    } finally {
      setCopilotLoading(false);
    }
  };

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

  // Métricas para el Inbox
  const inboxMetrics = (() => {
    const total = resumes.length;
    const byCargo: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    
    resumes.forEach(r => {
      const cargo = (r.position || 'No Especificado').trim();
      const city = (r.city || 'No Especificada').trim();
      
      byCargo[cargo] = (byCargo[cargo] || 0) + 1;
      byCity[city] = (byCity[city] || 0) + 1;
    });

    const topCargos = Object.entries(byCargo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    const topCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, topCargos, topCities };
  })();

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
      {showMassCitationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>📅 Programar Cita Grupal</h3>
              <button onClick={() => setShowMassCitationModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Se enviará un correo masivo de invitación a todos los candidatos seleccionados con la misma fecha y hora.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label className="ranking-label">Fecha</label>
                <input type="date" className="ranking-input" value={massCitationDate} onChange={e => setMassCitationDate(e.target.value)} style={{ marginBottom: 0 }} />
              </div>
              <div>
                <label className="ranking-label">Hora</label>
                <input type="time" className="ranking-input" value={massCitationTime} onChange={e => setMassCitationTime(e.target.value)} style={{ marginBottom: 0 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowMassCitationModal(false)} className="track-btn">Cancelar</button>
              <button 
                className="ranking-btn-primary" 
                style={{ width: 'auto' }} 
                onClick={handleSendMassCitation}
                disabled={sendingMassCitation || !massCitationDate}
              >
                {sendingMassCitation ? 'Enviando...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWhatsAppModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '650px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 Envío masivo de WhatsApp y Gestión de Grupo
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#475569', margin: 0, textTransform: 'uppercase' }}>
                  Mensaje de Invitación Template (Puedes editarlo)
                </label>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappTemplateText);
                    alert('¡Mensaje copiado al portapapeles!');
                  }}
                  className="track-btn"
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                >
                  📋 Copiar Mensaje
                </button>
              </div>
              <textarea 
                value={whatsappTemplateText}
                onChange={e => setWhatsappTemplateText(e.target.value)}
                style={{ width: '100%', height: '150px', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', color: '#334155', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
              />
            </div>

            {(() => {
              const activeSessionCandidates = formativeCandidates.filter(c => formativeSessionFilter === 'ALL' || c.session_title === formativeSessionFilter);
              
              const handleCopyPhones = () => {
                const phones = activeSessionCandidates
                  .map(c => c.email_resumes?.sender_phone)
                  .filter(Boolean)
                  .map(p => p.replace(/\s+/g, '')); // clean spaces
                
                navigator.clipboard.writeText(phones.join(','));
                alert('¡Teléfonos copiados al portapapeles!');
              };

              const formatWhatsAppLink = (phone: string, text: string) => {
                let cleanPhone = phone.replace(/\D/g, '');
                if (cleanPhone.startsWith('0')) {
                  cleanPhone = '593' + cleanPhone.substring(1);
                } else if (cleanPhone.length === 9 && (cleanPhone.startsWith('9') || cleanPhone.startsWith('8'))) {
                  cleanPhone = '593' + cleanPhone;
                }
                return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
              };

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>
                      Candidatos en la sesión ({activeSessionCandidates.length})
                    </span>
                    <button 
                      onClick={handleCopyPhones}
                      className="ranking-btn-primary" 
                      style={{ width: 'auto', background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '12.5px', padding: '8px 16px', borderRadius: '8px' }}
                      disabled={activeSessionCandidates.length === 0}
                    >
                      📋 Copiar todos los teléfonos
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', maxHeight: '250px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 16px' }}>Candidato</th>
                          <th style={{ padding: '10px 16px' }}>Teléfono</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right' }}>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSessionCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                              No hay candidatos en esta sesión.
                            </td>
                          </tr>
                        ) : (
                          activeSessionCandidates.map(c => {
                            const name = c.email_resumes?.sender_name || 'Candidato';
                            const phone = c.email_resumes?.sender_phone || '';
                            const cleanPhone = phone.trim();
                            const link = cleanPhone ? formatWhatsAppLink(cleanPhone, whatsappTemplateText) : '';
                            
                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{name}</td>
                                <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{phone || '—'}</td>
                                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                  {cleanPhone ? (
                                    <a 
                                      href={link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}
                                    >
                                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" style={{ width: '14px' }} /> Enviar
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Sin teléfono</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowWhatsAppModal(false)} className="track-btn">Cerrar</button>
            </div>
          </div>
        </div>
      )}



      {showOptionsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>⚙️ Configurar Criterios y Pesos</h3>
              <button onClick={() => setShowOptionsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>

            {/* Crear nuevo criterio */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>+ Agregar Criterio</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="ranking-label">Texto del Comentario / Opción</label>
                  <input 
                    type="text" 
                    value={newOptionLabel}
                    onChange={e => setNewOptionLabel(e.target.value)}
                    placeholder="Ej: ME ENCANTA COMO SE DESENVUELVE..."
                    className="ranking-input"
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="ranking-label">Peso / Puntaje</label>
                    <input 
                      type="number" 
                      value={newOptionWeight}
                      onChange={e => setNewOptionWeight(parseInt(e.target.value) || 0)}
                      className="ranking-input"
                      style={{ marginBottom: 0 }}
                    />
                  </div>
                  <div>
                    <label className="ranking-label">Categoría</label>
                    <select 
                      value={newOptionCategory}
                      onChange={e => setNewOptionCategory(e.target.value)}
                      className="ranking-select"
                      style={{ marginBottom: 0, height: '43px' }}
                    >
                      <option value="Formación">Formación</option>
                      <option value="Experiencia">Experiencia</option>
                      <option value="Alineamiento cultural">Alineamiento cultural</option>
                      <option value="Cercanía al punto de venta">Cercanía al punto de venta</option>
                      <option value="Rango de edad (18-30 años)">Rango de edad (18-30 años)</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleCreateOption}
                  disabled={savingOption || !newOptionLabel.trim()}
                  className="ranking-btn-primary"
                  style={{ padding: '10px', fontSize: '13px', borderRadius: '8px' }}
                >
                  {savingOption ? 'Guardando...' : 'Guardar Criterio'}
                </button>
              </div>
            </div>

            {/* Listado de criterios existentes */}
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Criterios Registrados</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formativeOptions.map(opt => (
                <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{opt.label}</p>
                    <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'inline-block' }}>
                      {opt.category} • Peso: <strong style={{ color: opt.weight >= 0 ? '#166534' : '#991b1b' }}>{opt.weight >= 0 ? `+${opt.weight}` : opt.weight}</strong>
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteOption(opt.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL: Ver Formulario de Postulación Web */}
      {viewingFormData && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}
          onClick={() => setViewingFormData(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '24px 28px', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadCloud size={20} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'white' }}>{viewingFormData.sender_name || 'Candidato'}</h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Formulario de Postulación Web</p>
                </div>
              </div>
              <button onClick={() => setViewingFormData(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>✕ Cerrar</button>
            </div>

            {/* Body */}
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Datos de Contacto */}
              <section>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>📋 Datos de Contacto</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Nombre Completo</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.sender_name || '—'}</span>
                      <button 
                        onClick={() => handleUpdateName(viewingFormData.id, viewingFormData.sender_name || '')} 
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                        title="Editar Nombre"
                      >
                        <Settings size={12} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Email</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.sender_email || '—'}</span>
                      <button 
                        onClick={() => handleUpdateEmail(viewingFormData.id, viewingFormData.sender_email || '')} 
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                        title="Editar Email"
                      >
                        <Settings size={12} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Teléfono</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.sender_phone || '—'}</span>
                      <button 
                        onClick={() => handleUpdatePhone(viewingFormData.id, viewingFormData.sender_phone || '')} 
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                        title="Editar Teléfono"
                      >
                        <Settings size={12} />
                      </button>
                    </div>
                  </div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Fecha de Nacimiento</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.birth_date ? new Date(viewingFormData.birth_date + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Edad</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.age ? `${viewingFormData.age} años` : '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Género</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.gender || '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Estado Civil</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.civil_status || '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Medio de Contacto</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.heard_from || '—'}</span></div>
                </div>
              </section>

              {/* Residencia */}
              <section>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>📍 Dirección y Residencia</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px' }}>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Ciudad</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.city || '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Sector</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.sector || '—'}</span></div>
                  {viewingFormData.home_address && (
                    <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Dirección</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.home_address}</span></div>
                  )}
                </div>
              </section>

              {/* Perfil Profesional */}
              <section>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>💼 Perfil y Experiencia</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px' }}>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Cargo al que Postula</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.position || '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Años de Experiencia</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.experience_years ? `${viewingFormData.experience_years} años` : '—'}</span></div>
                  {viewingFormData.skills && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Habilidades / Skills</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {viewingFormData.skills.split(',').map((s: string, i: number) => (
                          <span key={i} style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{s.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Educación */}
              <section>
                <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>🎓 Educación</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px' }}>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Nivel de Estudios</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.education_level || '—'}</span></div>
                  <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Institución</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.education_institution || '—'}</span></div>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Título Obtenido</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.education_title || '—'}</span></div>
                </div>
              </section>

              {/* Datos adicionales */}
              {(viewingFormData.likes_sports || viewingFormData.work_culture_motivation) && (
                <section>
                  <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>✨ Información Adicional</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                    {viewingFormData.likes_sports && (
                      <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>¿Le gusta el deporte?</span><span style={{ color: '#1e293b', fontWeight: 600 }}>{viewingFormData.likes_sports === 'Si' ? `Sí, practica: ${viewingFormData.sports_practiced || '—'}` : 'No'}</span></div>
                    )}
                    {viewingFormData.work_culture_motivation && (
                      <div><span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>Motivación Laboral</span><span style={{ color: '#1e293b', fontWeight: 600, lineHeight: 1.5, display: 'block' }}>{viewingFormData.work_culture_motivation}</span></div>
                    )}
                  </div>
                </section>
              )}

              {/* Resumen IA */}
              {viewingFormData.ai_summary && (
                <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🤖 Resumen de Perfil (IA)</h3>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>"{viewingFormData.ai_summary}"</p>
                </section>
              )}

              {/* CV */}
              {viewingFormData.pdf_url && (
                <a href={viewingFormData.pdf_url} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}>
                  <FileText size={16} /> Ver CV Adjunto
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {passToRankingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '28px', borderRadius: '12px', width: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>🏆 Pasar Candidato a Resumen</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              Selecciona o escribe el cargo para asignar a <strong>{passToRankingModal.name}</strong> en el Resumen y Pipeline.
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label className="ranking-label">Seleccionar Cargo Existente</label>
              <select 
                className="ranking-select" 
                value={selectedRankingCargo} 
                onChange={e => {
                  setSelectedRankingCargo(e.target.value);
                  if (e.target.value) setCustomRankingCargo('');
                }}
              >
                <option value="">-- Seleccionar --</option>
                {jobPositions.map(p => (
                  <option key={p.id} value={p.cargo}>{p.cargo} {p.ciudad ? `· ${p.ciudad}` : ''}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="ranking-label">O ingresar cargo personalizado</label>
              <input 
                type="text" 
                className="ranking-input" 
                placeholder="Ej: Cajero Principal..." 
                value={customRankingCargo} 
                onChange={e => {
                  setCustomRankingCargo(e.target.value);
                  if (e.target.value) setSelectedRankingCargo('');
                }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => {
                  setPassToRankingModal(null);
                  setSelectedRankingCargo('');
                  setCustomRankingCargo('');
                }} 
                className="track-btn"
              >
                Cancelar
              </button>
              <button 
                className="ranking-btn-primary" 
                style={{ width: 'auto' }} 
                onClick={async () => {
                  const finalCargo = selectedRankingCargo || customRankingCargo;
                  if (!finalCargo) {
                    alert('Debes seleccionar o escribir un cargo.');
                    return;
                  }
                  await handlePassToRankingDirectly(passToRankingModal.id, finalCargo);
                  setPassToRankingModal(null);
                  setSelectedRankingCargo('');
                  setCustomRankingCargo('');
                }}
              >
                Confirmar
              </button>
            </div>
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
                {user?.company_name === 'SUPERDEPORT S.A.' ? 'SUPERDEPORTE S.A.' : (user?.company_name || 'SUPERDEPORTE S.A.')}
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
          <div className="qr-card" style={{ gap: '32px', flexWrap: 'wrap' }}>
            {/* LINK ONBOARDING */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <label className="ranking-label">🚀 Link Onboarding (Nuevos Ingresos)</label>
                <input type="text" value={portalUrl} onChange={e => setPortalUrl(e.target.value)} className="qr-input" />
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`} alt="QR Onboarding" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
            </div>

            {/* SEPARADOR */}
            <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

            {/* LINK POSTULACIÓN */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <label className="ranking-label">📋 Link Postulación (Candidatos)</label>
                <input
                  type="text"
                  value={`https://uneteanuestroequipo.ec.aseyco.com/${user?.company_slug || 'superdeporte'}/postular`}
                  readOnly
                  className="qr-input"
                  style={{ background: '#f8fafc', color: '#475569', cursor: 'default' }}
                />
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://uneteanuestroequipo.ec.aseyco.com/${user?.company_slug || 'superdeporte'}/postular`)}`}
                alt="QR Postulación"
                style={{ width: '64px', height: '64px', borderRadius: '8px' }}
              />
            </div>

            {/* SEPARADOR */}
            <div style={{ width: '1px', background: '#e2e8f0', alignSelf: 'stretch' }} />

            {/* ACTIVACIÓN DE POSTULACIÓN POR COMPAÑÍA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px' }}>
              <label className="ranking-label">🟢 Recepción de Candidatos</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {[
                  { slug: 'superdeporte', name: 'Superdeporte' },
                  { slug: 'medeport', name: 'Medeport' },
                  { slug: 'equinox', name: 'Equinox' }
                ].map(comp => {
                  const isEnabled = companySettings[comp.slug] !== false;
                  return (
                    <label key={comp.slug} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', color: '#1e293b' }}>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleCompanyPostulation(comp.slug, isEnabled)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                      />
                      <span>{comp.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => { fetchCandidates(); fetchResumes(); fetchPipeline(); }}
              className="ranking-btn-primary"
              style={{ width: 'auto', padding: '12px 24px', marginLeft: 'auto', borderRadius: '10px' }}
            >
              <RefreshCw size={18} /> Actualizar Todo
            </button>
          </div>

        <div className="tabs-nav">
          {(user?.perfil === 'RECLUTADOR' || user?.perfil === 'ADMIN') && (
            <>
              <button className={`tab-btn ${activeTab === 'seleccion' ? 'active' : ''}`} onClick={() => setActiveTab('seleccion')}>Inbox</button>
              <button className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`} onClick={() => setActiveTab('ranking')}>🏆 Ranking IA</button>
              <button className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => { setActiveTab('pipeline'); fetchPipeline() }}>📑 Resumen</button>
              <button className={`tab-btn ${activeTab === 'formativas' ? 'active' : ''}`} onClick={() => { setActiveTab('formativas'); fetchFormativeData() }}>🎯 Formativas</button>
              <button className={`tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`} onClick={() => setActiveTab('onboarding')}>🚀 Onboarding</button>
              <button className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`} onClick={() => setActiveTab('estadisticas')}>📈 Estadísticas</button>
            </>
          )}
          {(user?.perfil === 'NOMINA' || user?.perfil === 'ADMIN') && (
            <button className={`tab-btn ${activeTab === 'nomina' ? 'active' : ''}`} onClick={() => setActiveTab('nomina')}>💼 Nómina</button>
          )}
        </div>

        {/* --- BANDEJA --- */}
        {activeTab === 'seleccion' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px' }}>
              <button onClick={() => setShowSettings(true)} style={{ background: 'white', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}><Settings size={16}/></button>
              {/* BOTÓN DESACTIVADO TEMPORALMENTE - para reactivar quitar display:none */}
              <button onClick={handleScanEmails} disabled={scanning} className="ai-btn" style={{ background: '#3b82f6', display: 'none' }}><RefreshCw size={16} className={scanning ? "animate-spin" : ""}/> {scanning ? 'Escaneando...' : 'Buscar Nuevos Correos'}</button>
            </div>

            {/* Metricas de Candidatos por Cargo y Ciudad */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
              color: 'white', 
              padding: '20px 24px', 
              borderRadius: '16px', 
              marginBottom: '20px', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '24px',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {/* Total Card */}
              <div style={{ 
                borderRight: '1px solid rgba(255,255,255,0.1)', 
                paddingRight: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Candidatos</span>
                <span style={{ fontSize: '42px', fontWeight: 900, color: '#3b82f6', lineHeight: 1, margin: '6px 0 2px' }}>{inboxMetrics.total}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Postulantes registrados</span>
              </div>

              {/* Cargos Card */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Candidatos por Cargo</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '80px', overflowY: 'auto' }}>
                  {inboxMetrics.topCargos.map(([cargo, count]) => (
                    <div key={cargo} style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      padding: '4px 10px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{cargo}</span>
                      <span style={{ background: '#3b82f6', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{count}</span>
                    </div>
                  ))}
                  {inboxMetrics.topCargos.length === 0 && <span style={{ fontSize: '12px', color: '#64748b' }}>Sin datos disponibles</span>}
                </div>
              </div>

              {/* Ciudades Card */}
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Candidatos por Ciudad</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '80px', overflowY: 'auto' }}>
                  {inboxMetrics.topCities.map(([city, count]) => (
                    <div key={city} style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      padding: '4px 10px', 
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{city}</span>
                      <span style={{ background: '#10b981', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>{count}</span>
                    </div>
                  ))}
                  {inboxMetrics.topCities.length === 0 && <span style={{ fontSize: '12px', color: '#64748b' }}>Sin datos disponibles</span>}
                </div>
              </div>
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
              <div style={{ width: '150px' }}>
                <label className="form-label">Cédula</label>
                <div className="filter-input" style={{ background: '#f8fafc', marginTop: '4px' }}>
                  <User size={18} color="#6b7280" />
                  <input 
                    type="text" 
                    placeholder="Ej: 1712217502..." 
                    value={inboxCedula}
                    onChange={(e) => setInboxCedula(e.target.value)}
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
              <div style={{ width: '150px' }}>
                <label className="form-label">Sector</label>
                <div className="filter-input" style={{ background: '#f8fafc', marginTop: '4px' }}>
                  <MapPin size={18} color="#6b7280" />
                  <input 
                    type="text" 
                    placeholder="Ej: Carcelén..." 
                    value={inboxSector}
                    onChange={(e) => setInboxSector(e.target.value)}
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
                  onClick={() => { setInboxSearch(''); setInboxCargo(''); setInboxCity(''); setInboxExp(''); setInboxSector(''); setInboxCedula(''); }}
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
                  {(() => {
                    const filteredResumes = resumes.filter(r => {
                      const matchesSearch = !inboxSearch || (r.sender_name || '').toLowerCase().includes(inboxSearch.toLowerCase());
                      const matchesCargo = !inboxCargo || (r.position || '').toLowerCase().includes(inboxCargo.toLowerCase());
                      const matchesCity = !inboxCity || (r.city || '').toLowerCase().includes(inboxCity.toLowerCase());
                      const matchesExp = !inboxExp || (parseInt(r.experience_years || '0') >= parseInt(inboxExp));
                      const matchesSector = !inboxSector || (r.sector || '').toLowerCase().includes(inboxSector.toLowerCase());
                      const matchesCedula = !inboxCedula || (r.cedula || '').toLowerCase().includes(inboxCedula.toLowerCase());
                      return matchesSearch && matchesCargo && matchesCity && matchesExp && matchesSector && matchesCedula;
                    });
                    
                    const ITEMS_PER_PAGE = 50;
                    const totalPages = Math.ceil(filteredResumes.length / ITEMS_PER_PAGE);
                    const paginatedResumes = filteredResumes.slice((inboxPage - 1) * ITEMS_PER_PAGE, inboxPage * ITEMS_PER_PAGE);

                    return (
                      <>
                        {paginatedResumes.map(r => (
                          <tr key={r.id}>
                      <td>
                        <div className="user-cell" style={{ alignItems: 'flex-start' }}>
                          <div
                            className="user-avatar"
                            onClick={() => r.email_uid?.startsWith('WEB') ? setViewingFormData(r) : undefined}
                            title={r.email_uid?.startsWith('WEB') ? 'Ver formulario completo' : ''}
                            style={{ 
                              background: r.email_uid?.startsWith('WEB') ? '#eff6ff' : (r.classification_status === 'REVIEWED' ? '#f0fdf4' : '#f3e8ff'), 
                              color: r.email_uid?.startsWith('WEB') ? '#3b82f6' : (r.classification_status === 'REVIEWED' ? '#16a34a' : '#9333ea'),
                              cursor: r.email_uid?.startsWith('WEB') ? 'pointer' : 'default',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                              boxShadow: r.email_uid?.startsWith('WEB') ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none'
                            }}
                          >
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>{r.sender_email}</p>
                              <button 
                                onClick={() => handleUpdateEmail(r.id, r.sender_email || '')} 
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                title="Editar Correo"
                              >
                                <Settings size={12} />
                              </button>
                            </div>
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
                            
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: (r.classification_status === 'REVIEWED' || r.classification_status === 'MANUALLY_REVIEWED') ? '#16a34a' : '#64748b', cursor: 'pointer', background: (r.classification_status === 'REVIEWED' || r.classification_status === 'MANUALLY_REVIEWED') ? '#f0fdf4' : '#f8fafc', border: `1px solid ${(r.classification_status === 'REVIEWED' || r.classification_status === 'MANUALLY_REVIEWED') ? '#bbf7d0' : '#e2e8f0'}`, padding: '4px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                              <input 
                                type="checkbox" 
                                checked={r.classification_status === 'REVIEWED' || r.classification_status === 'MANUALLY_REVIEWED'}
                                onChange={() => handleToggleReviewed(r.id, r.classification_status || null)}
                                style={{ cursor: 'pointer' }}
                              />
                              {(r.classification_status === 'REVIEWED' || r.classification_status === 'MANUALLY_REVIEWED') ? '✓ Perfil Revisado' : 'Marcar como Revisado'}
                            </label>
                            
                            {/* Mostramos los datos si está REVISADO o si ya tiene cargo extraído */}
                            {(r.classification_status === 'REVIEWED' || r.position) ? (
                              <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                  {r.city && <span className="ai-tag"><MapPin size={12} /> {r.city}</span>}
                                  {r.position && <span className="ai-tag"><Briefcase size={12} /> {r.position}</span>}
                                  {r.age && <span className="ai-tag" style={{ background: '#fce7f3', color: '#9d174d' }}><User size={12} /> {r.age} años</span>}
                                  {r.experience_years && <span className="ai-tag" style={{ background: '#fef9c3', color: '#854d0e' }}>⏱ {r.experience_years} años</span>}
                                  {r.skills && r.skills.split(',').map((s: string, i: number) => i < 3 && <span key={i} className="ai-tag" style={{ background: '#f0fdf4', color: '#166534' }}>{s.trim()}</span>)}
                                </div>
                                {r.ai_summary && (
                                  <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '12px', fontStyle: 'italic', color: '#475569', borderLeft: '3px solid #cbd5e1', marginBottom: '8px' }}>
                                    "{r.ai_summary}"
                                  </div>
                                )}

                                {/* Datos adicionales de postulación web */}
                                {(r.birth_date || r.civil_status || r.home_address || r.education_level || r.likes_sports || r.heard_from) && (
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '1fr 1fr', 
                                    gap: '10px', 
                                    marginTop: '8px', 
                                    padding: '12px', 
                                    background: '#f8fafc', 
                                    borderRadius: '10px', 
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    color: '#334155'
                                  }}>
                                    <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '2px', fontWeight: '800', color: '#002f6c', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                      📝 Datos Adicionales Formulario
                                    </div>
                                    {r.birth_date && (
                                      <p style={{ margin: 0 }}><strong>F. Nacimiento:</strong> {new Date(r.birth_date + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    )}
                                    {r.civil_status && (
                                      <p style={{ margin: 0 }}><strong>Estado Civil:</strong> {r.civil_status}</p>
                                    )}
                                    {r.sector && (
                                      <p style={{ margin: 0 }}><strong>Sector:</strong> {r.sector}</p>
                                    )}
                                    {r.heard_from && (
                                      <p style={{ margin: 0 }}><strong>Medio de Contacto:</strong> {r.heard_from}</p>
                                    )}
                                    {r.home_address && (
                                      <p style={{ margin: 0, gridColumn: '1 / -1' }}><strong>Dirección:</strong> {r.home_address}</p>
                                    )}
                                    {r.education_level && (
                                      <p style={{ margin: 0, gridColumn: '1 / -1' }}><strong>Estudios:</strong> {r.education_level} {r.education_institution ? `en ${r.education_institution}` : ''} {r.education_title ? ` - Título: ${r.education_title}` : ''}</p>
                                    )}
                                    {r.likes_sports && (
                                      <p style={{ margin: 0, gridColumn: '1 / -1' }}><strong>¿Le gusta el deporte?:</strong> {r.likes_sports === 'Si' ? `Sí, practica: ${r.sports_practiced || '—'}` : 'No'}</p>
                                    )}
                                    {r.work_culture_motivation && (
                                      <p style={{ margin: 0, gridColumn: '1 / -1' }}><strong>Motivación Laboral:</strong> {r.work_culture_motivation}</p>
                                    )}
                                  </div>
                                )}
                                {/* Botón de IA extra por si quieren profundizar aunque ya tengan datos básicos */}
                                {r.classification_status !== 'REVIEWED' && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button className="ai-btn" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }} onClick={() => handleAnalyzeResume(r.id)} disabled={analyzingId === r.id}>
                                      {analyzingId === r.id ? 'Analizando...' : 'Profundizar con IA'}
                                    </button>
                                    {/* Oculto: Aceptar Directo (Sin IA) */}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button className="ai-btn" onClick={() => handleAnalyzeResume(r.id)} disabled={analyzingId === r.id}>
                                  {analyzingId === r.id ? 'Analizando...' : 'Analizar con IA'}
                                </button>
                                {/* Oculto: Aceptar Directo (Sin IA) */}
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
                        {/* Solo mostrar REVISADO, ocultar badge PENDIENTE */}
                        {r.classification_status === 'REVIEWED' && (
                          <span className="status-badge status-synced" style={{ marginBottom: '6px', display: 'inline-block' }}>REVISADO</span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedRankingCargo(r.position || '');
                            setPassToRankingModal({ id: r.id, name: r.sender_name || 'Sin Nombre', defaultCargo: r.position || '' });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            marginBottom: '6px',
                            width: '100%',
                            justifyContent: 'center'
                          }}
                        >
                          <Trophy size={12} /> Pasar a Resumen
                        </button>
                        <button
                          onClick={() => handleDeleteResume(r)}
                          title="Borrar candidato y PDF adjunto"
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#fff1f2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <Trash2 size={12} /> Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {totalPages > 1 && (
                    <tr>
                      <td colSpan={4}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
                          <button 
                            className="track-btn" 
                            disabled={inboxPage === 1} 
                            onClick={() => setInboxPage(p => p - 1)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Anterior
                          </button>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                            Página {inboxPage} de {totalPages} ({filteredResumes.length} candidatos)
                          </span>
                          <button 
                            className="track-btn" 
                            disabled={inboxPage === totalPages || totalPages === 0} 
                            onClick={() => setInboxPage(p => p + 1)}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Siguiente
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </>
                );
              })()}
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
              
              {/* Filtros Adicionales */}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '16px', marginBottom: '16px' }}>
                <p style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔍 Filtros de Optimización IA
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="ranking-label" style={{ margin: 0, fontSize: '10px' }}>Sector de Vivienda</label>
                    <select className="ranking-select" style={{ marginBottom: 0, padding: '8px 12px' }} value={rankingFilterSector} onChange={e => setRankingFilterSector(e.target.value)}>
                      <option value="ALL">Todos los Sectores</option>
                      <option value="Norte">Norte</option>
                      <option value="Centro">Centro</option>
                      <option value="Sur">Sur</option>
                      <option value="Cumbayá">Cumbayá</option>
                      <option value="Valle de los Chillos">Valle de los Chillos</option>
                      <option value="Via la Costa">Via la Costa</option>
                      <option value="Samborondon">Samborondon</option>
                    </select>
                  </div>

                  <div>
                    <label className="ranking-label" style={{ margin: 0, fontSize: '10px' }}>Ciudad de Residencia</label>
                    <select
                      className="ranking-select"
                      style={{ marginBottom: 0, padding: '8px 12px' }}
                      value={rankingFilterCiudad}
                      onChange={e => setRankingFilterCiudad(e.target.value)}
                    >
                      <option value="">Todas las Ciudades</option>
                      <option value="Quito">Quito</option>
                      <option value="Guayaquil">Guayaquil</option>
                      <option value="Cuenca">Cuenca</option>
                      <option value="Manta">Manta</option>
                      <option value="Portoviejo">Portoviejo</option>
                      <option value="Machala">Machala</option>
                      <option value="Loja">Loja</option>
                      <option value="Ambato">Ambato</option>
                      <option value="Santo Domingo">Santo Domingo</option>
                      <option value="Ibarra">Ibarra</option>
                      <option value="Otra">Otra / Provincia</option>
                    </select>
                  </div>

                  <div>
                    <label className="ranking-label" style={{ margin: 0, fontSize: '10px' }}>Región</label>
                    <select className="ranking-select" style={{ marginBottom: 0, padding: '8px 12px' }} value={rankingFilterRegion} onChange={e => setRankingFilterRegion(e.target.value)}>
                      <option value="ALL">Todas las Regiones</option>
                      <option value="Costa">Costa</option>
                      <option value="Sierra">Sierra</option>
                      <option value="Oriente">Oriente</option>
                      <option value="Insular">Insular</option>
                    </select>
                  </div>

                  <div>
                    <label className="ranking-label" style={{ margin: 0, fontSize: '10px' }}>Edad</label>
                    <select className="ranking-select" style={{ marginBottom: 0, padding: '8px 12px' }} value={rankingFilterEdad} onChange={e => setRankingFilterEdad(e.target.value)}>
                      <option value="ALL">Todas las Edades</option>
                      <option value="18-25">18 a 25 años</option>
                      <option value="26-35">26 a 35 años</option>
                      <option value="36-45">36 a 45 años</option>
                      <option value="46+">46 años o más</option>
                    </select>
                  </div>

                  <div>
                    <label className="ranking-label" style={{ margin: 0, fontSize: '10px' }}>Género</label>
                    <select className="ranking-select" style={{ marginBottom: 0, padding: '8px 12px' }} value={rankingFilterGenero} onChange={e => setRankingFilterGenero(e.target.value)}>
                      <option value="ALL">Todos los Géneros</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                </div>
              </div>

              <button className="ranking-btn-primary" onClick={handleRankCandidates} disabled={rankingLoading}><Brain size={16} /> {rankingLoading ? 'Evaluando...' : 'Evaluar con IA'}</button>
              
              {rankingError && (
                <div style={{ color: '#ef4444', background: '#fee2e2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>
                  ⚠️ {rankingError}
                </div>
              )}
            </div>
            <div>
              {displayedRankingCandidates && displayedRankingCandidates.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>#</th><th>Candidato</th><th>Ciudad</th><th>Puntaje</th><th>CV</th><th style={{ textAlign: 'right' }}>Acción</th></tr>
                    </thead>
                    <tbody>
                      {displayedRankingCandidates.map((r, idx) => {
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
                                  <>
                                    <button className="ai-btn-accept" onClick={() => updateTracking(r.id, 'MENSAJE_ENVIADO')} disabled={isUpd}>
                                      {isUpd ? '...' : 'Aceptar Candidato'}
                                    </button>
                                    <button
                                      className="track-btn"
                                      style={{ color: '#f59e0b', borderColor: '#fde68a', background: 'rgba(245, 158, 11, 0.05)', fontSize: '11px', padding: '4px 10px' }}
                                      onClick={() => handleSendThankYouEmail(r.id, r.sender_email || r.email || '', r.name || r.sender_name || '', rankingCargo)}
                                      disabled={sendingThankYouId === r.id}
                                      title="Enviar correo de agradecimiento por postulación"
                                    >
                                      {sendingThankYouId === r.id ? '⏳ Enviando...' : '🙏 Agradecer'}
                                    </button>
                                  </>
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
              ) : rankingCargo ? (
                <div style={{ background: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                  <Trophy size={48} color="#cbd5e1" style={{ marginBottom: '16px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>No hay candidatos en este ranking</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '320px', margin: '0 auto' }}>
                    Agrega candidatos desde el <strong>Inbox</strong> usando el botón "Pasar a Ranking", o haz clic en <strong>Evaluar con IA</strong> para analizar a todos los postulantes.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* --- ESTADÍSTICAS --- */}
        {activeTab === 'estadisticas' && (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#002f6c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={24} /> Dashboard de Estadísticas Avanzadas
            </h2>

            {!stats ? (
              <div style={{ background: 'white', padding: '48px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                No hay suficientes datos cargados para generar estadísticas.
              </div>
            ) : (
              <>
                {/* KPI Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '12px' }}><Users size={24} /></div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Postulantes</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{stats.total}</h3>
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#fdf2f8', color: '#db2777', padding: '12px', borderRadius: '12px' }}><User size={24} /></div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Edad Promedio</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{stats.averageAge} años</h3>
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '12px' }}><Activity size={24} /></div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Afinidad Deporte</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{stats.likesSportsPct}% Sí</h3>
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: '#f7fee7', color: '#4d7c0f', padding: '12px', borderRadius: '12px' }}><Award size={24} /></div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Cargo Top</span>
                      <h3 style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {stats.topPositions[0]?.name || 'N/A'}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Embudo de Selección y Conversión */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Embudo de Selección y Conversión de Procesos
                  </h3>
                  <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b' }}>
                    Porcentaje de avance y conversión desde la postulación inicial hasta la contratación (candidatos que completaron Onboarding).
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', position: 'relative' }}>
                    {[
                      { 
                        title: 'Postulantes', 
                        subtitle: 'Inbox General', 
                        count: stats.total, 
                        pct: 100, 
                        color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                        desc: 'CVs recibidos' 
                      },
                      { 
                        title: 'En Resumen', 
                        subtitle: 'Pipeline Activo', 
                        count: stats.pipelineCount, 
                        pct: stats.total > 0 ? Math.round((stats.pipelineCount / stats.total) * 100) : 0, 
                        color: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', 
                        desc: 'Pre-seleccionados' 
                      },
                      { 
                        title: 'Formativas', 
                        subtitle: 'Evaluación Práctica', 
                        count: stats.formativeCount, 
                        pct: stats.total > 0 ? Math.round((stats.formativeCount / stats.total) * 100) : 0, 
                        color: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)', 
                        desc: 'En capacitación' 
                      },
                      { 
                        title: 'Onboarding', 
                        subtitle: 'Ingreso Inicial', 
                        count: stats.onboardingCount, 
                        pct: stats.total > 0 ? Math.round((stats.onboardingCount / stats.total) * 100) : 0, 
                        color: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', 
                        desc: 'Subiendo documentos' 
                      },
                      { 
                        title: 'Seleccionados', 
                        subtitle: 'Contratados', 
                        count: stats.selectedCount, 
                        pct: stats.total > 0 ? Math.round((stats.selectedCount / stats.total) * 100) : 0, 
                        color: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
                        desc: 'Completaron proceso' 
                      }
                    ].map((step, idx) => (
                      <div key={idx} style={{ 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px', 
                        padding: '16px', 
                        textAlign: 'center', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ 
                          width: '100%', 
                          height: '6px', 
                          background: step.color, 
                          borderRadius: '999px',
                          marginBottom: '12px' 
                        }} />
                        
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.title}</span>
                          <div style={{ fontSize: '28px', fontWeight: 900, color: '#1e293b', margin: '4px 0' }}>{step.count}</div>
                          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>{step.subtitle}</span>
                        </div>
                        
                        <div style={{ 
                          background: step.pct > 0 ? '#f0fdf4' : '#f1f5f9', 
                          color: step.pct > 0 ? '#15803d' : '#64748b', 
                          padding: '4px 8px', 
                          borderRadius: '8px', 
                          fontSize: '12px', 
                          fontWeight: 'bold' 
                        }}>
                          {step.pct}% conversión
                        </div>
                        <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px' }}>{step.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                  
                  {/* 1. Medios de Adquisición */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Medios de Adquisición</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(stats.heardFromMap).map(([key, val]) => {
                        const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                              <span>{key}</span>
                              <strong>{val} ({pct}%)</strong>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #6366f1)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Distribución de Sectores */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Distribución por Sectores</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(stats.sectorsMap).map(([key, val]) => {
                        const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                              <span>{key}</span>
                              <strong>{val} ({pct}%)</strong>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ec4899, #f43f5e)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Niveles de Educación */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Nivel de Educación</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(stats.educationMap).map(([key, val]) => {
                        const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                              <span>{key}</span>
                              <strong>{val} ({pct}%)</strong>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Rangos de Edad */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>Distribución por Rangos de Edad</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {Object.entries(stats.ageRanges).map(([key, val]) => {
                        const pct = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                              <span>{key} años</span>
                              <strong>{val} ({pct}%)</strong>
                            </div>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #d946ef)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top Positions Section */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏆 Cargos Más Solicitados
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {stats.topPositions.map((pos, idx) => (
                      <div key={pos.name} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 900, color: idx === 0 ? '#b45309' : idx === 1 ? '#475569' : '#7c2d12', background: idx === 0 ? '#fef3c7' : idx === 1 ? '#f1f5f9' : '#ffedd5', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Top {idx + 1}
                          </span>
                          <h4 style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{pos.name}</h4>
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#475569' }}>{pos.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
                    <th style={{ width: '80px', textAlign: 'center' }}>Formativas</th>
                    <th>Candidato</th>
                    <th>Cargo</th>
                    <th>Psicométrico</th>
                    <th>Teléfono / WhatsApp</th>
                    <th>Estado</th>
                    <th>Entrevista</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineData.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        No hay candidatos en el resumen actualmente.
                      </td>
                    </tr>
                  ) : (
                    pipelineData
                      .filter(p => pipelineFilter === 'ALL' || p.status === pipelineFilter)
                      .filter(p => !pipelineCargoFilter || p.cargo.toLowerCase().includes(pipelineCargoFilter.toLowerCase()))
                      .map(p => (
                      <tr key={p.id}>
                        <td style={{ textAlign: 'center' }}>
                          {(() => {
                            const psychTest = psychometricTests.find(t => t.resume_id === p.resume_id);
                            const isCompleted = psychTest && psychTest.status === 'COMPLETADO';
                            const isSelected = formativeCandidates.some(c => c.resume_id === p.resume_id);
                            if (isSelected) {
                              // Ya está en formativas: mostrar badge, sin checkbox
                              return (
                                <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 7px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>
                                  🎯 En Formativas
                                </span>
                              );
                            }
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() => handleToggleFormative(p)}
                                  title="Seleccionar para Formativas"
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                    accentColor: '#2563eb'
                                  }}
                                />
                                {isCompleted ? (
                                  <span style={{ fontSize: '9px', color: '#16a34a', fontWeight: 'bold' }} title="Psicométrico completado">✓ Psico</span>
                                ) : (
                                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold' }} title="Sin prueba psicométrica">— Psico</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <p style={{ fontWeight: 700, margin: 0, color: '#1e293b' }}>{p.candidate?.sender_name || 'Candidato'}</p>
                            {(() => {
                              const formativeCand = formativeCandidates.find(c => c.resume_id === p.resume_id);
                              if (formativeCand) {
                                const candidateEvals = formativeEvaluations.filter(e => e.candidate_id === formativeCand.id);
                                if (candidateEvals.length > 0) {
                                  const totalScore = candidateEvals.reduce((sum, e) => sum + e.score, 0);
                                  return (
                                    <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }} title="Puntaje de Evaluaciones Formativas">
                                      🎯 {totalScore} pts
                                    </span>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{p.candidate?.sender_email || '—'}</p>
                        </td>
                        <td style={{ fontWeight: 600, color: '#475569' }}>{p.cargo}</td>
                        {(() => {
                          const psychTest = psychometricTests.find(t => t.resume_id === p.resume_id);
                          if (!psychTest) {
                            return (
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <span className="pipeline-badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '11px', display: 'block' }}>
                                    ⏳ PENDIENTE
                                  </span>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button 
                                      className="track-btn" 
                                      style={{ padding: '4px 8px', fontSize: '11px', color: '#2563eb', borderColor: '#dbeafe', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleSendPsychometricEmail(p.candidate, p.cargo)}
                                      disabled={sendingPsychometricId === p.candidate?.id}
                                    >
                                      {sendingPsychometricId === p.candidate?.id ? '...' : '✉️ Enviar'}
                                    </button>
                                    <button 
                                      className="track-btn" 
                                      style={{ padding: '4px 8px', fontSize: '11px', color: '#8b5cf6', borderColor: '#ddd6fe', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => {
                                        const protocol = window.location.protocol;
                                        const host = window.location.host;
                                        setQrModalUrl(`${protocol}//${host}/evaluacion/${p.resume_id}`);
                                      }}
                                    >
                                      📱 QR
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          const isCompleted = psychTest.status === 'COMPLETADO';
                          const sections = psychTest.sections_status || {};
                          const totalSecs = Object.keys(sections).length || 7;
                          const completedSecs = Object.values(sections).filter(s => s === 'COMPLETADO').length;
                          const compatibility = psychTest.kudert_disc?.ai_recommendation?.compatibility;

                          return (
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span 
                                  className="pipeline-badge" 
                                  style={{ 
                                    background: isCompleted ? '#dcfce7' : '#fef9c3', 
                                    color: isCompleted ? '#166534' : '#854d0e', 
                                    border: '1px solid currentColor',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    display: 'block'
                                  }}
                                >
                                  {isCompleted ? '✅ COMPLETADO' : `⏳ EN PROCESO (${completedSecs}/${totalSecs})`}
                                </span>
                                {isCompleted && compatibility && (
                                  <span 
                                    className="pipeline-badge" 
                                    style={{ 
                                      background: compatibility === 'Alta' ? '#d1fae5' : compatibility === 'Media' ? '#fef3c7' : '#fee2e2', 
                                      color: compatibility === 'Alta' ? '#065f46' : compatibility === 'Media' ? '#92400e' : '#991b1b', 
                                      border: '1px solid currentColor',
                                      textAlign: 'center',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      display: 'block'
                                    }}
                                  >
                                    🤖 IA: {compatibility}
                                  </span>
                                )}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {isCompleted ? (
                                    <button 
                                      className="track-btn" 
                                      style={{ padding: '4px 8px', fontSize: '11px', color: '#10b981', borderColor: '#bbf7d0', width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => setViewingPsychometric({ test: psychTest, candidate: { ...p.candidate, position: p.candidate?.position || p.cargo } })}
                                    >
                                      📊 Resultados
                                    </button>
                                  ) : (
                                    <>
                                      <button 
                                        className="track-btn" 
                                        style={{ padding: '4px 8px', fontSize: '11px', color: '#2563eb', borderColor: '#dbeafe', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => handleSendPsychometricEmail(p.candidate, p.cargo)}
                                        disabled={sendingPsychometricId === p.candidate?.id}
                                      >
                                        {sendingPsychometricId === p.candidate?.id ? '...' : '✉️ Reenviar'}
                                      </button>
                                      <button 
                                        className="track-btn" 
                                        style={{ padding: '4px 8px', fontSize: '11px', color: '#8b5cf6', borderColor: '#ddd6fe', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        onClick={() => {
                                          const protocol = window.location.protocol;
                                          const host = window.location.host;
                                          setQrModalUrl(`${protocol}//${host}/evaluacion/${p.resume_id}`);
                                        }}
                                      >
                                        📱 QR
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })()}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {p.candidate?.sender_phone && (
                              <a 
                                href={p.status === 'PENDIENTE' ? '#' : `https://wa.me/${p.candidate.sender_phone.replace(/\D/g, '').replace(/^0/, '593')}?text=${encodeURIComponent(
                                  p.status === 'ENTREVISTA_PROGRAMADA' 
                                  ? `Hola ${p.candidate?.sender_name || 'candidat@'}, nos complace informarte que has pasado la primera etapa de nuestro proceso de selección para Superdeporte S.A. Para la siguiente fase, deberás asistir a una entrevista presencial y/o virtual.\n\nTe enviamos los detalles para que puedas asistir:\n📅Fecha: ${p.interview_date ? new Date(p.interview_date.split(' ')[0] + 'T12:00:00').toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }) : '—'}\n⏰Hora: ${p.interview_date?.split(' ')[1] || '09:00'}\n📍Lugar: Galo Plaza Lasso 13205 y de los Cerezos.`
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
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Bienvenido al panel de gestión de nómina para {user?.company_name}. Descarga el consolidado de datos.</p>
            <button 
              onClick={handleExportNomina} 
              className="ranking-btn-primary" 
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📥 Descargar Reporte Completo de Nómina (Excel)
            </button>
          </div>
        )}

        {/* --- FORMATIVAS --- */}
        {activeTab === 'formativas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Cabecera del Módulo */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star style={{ color: '#f59e0b', fill: '#f59e0b' }} size={24} /> Módulo de Evaluaciones Formativas
                  </h2>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
                    Administra las entrevistas grupales formativas, asigna supervisores y ejecuta evaluaciones dinámicas en tiempo real.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => setShowMassCitationModal(true)} 
                    className="ranking-btn-primary" 
                    style={{ width: 'auto', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
                  >
                    📅 Citar Grupo ({formativeSessionFilter === 'ALL' ? formativeCandidates.length : formativeCandidates.filter(c => c.session_title === formativeSessionFilter).length})
                  </button>
                  <button 
                    onClick={() => setShowWhatsAppModal(true)} 
                    className="ranking-btn-primary" 
                    style={{ width: 'auto', background: 'linear-gradient(135deg, #10b981, #059669)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
                  >
                    💬 WhatsApp Grupal ({formativeSessionFilter === 'ALL' ? formativeCandidates.length : formativeCandidates.filter(c => c.session_title === formativeSessionFilter).length})
                  </button>
                  {/* Botones de evaluación grupal */}
                  <button
                    onClick={() => handleBulkEvaluating(true)}
                    className="ranking-btn-primary"
                    style={{ width: 'auto', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🎯 Iniciar Evaluación Grupal
                    {(() => { const n = (formativeSessionFilter === 'ALL' ? formativeCandidates : formativeCandidates.filter(c => c.session_title === formativeSessionFilter)).length; return n > 0 ? <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '999px', padding: '1px 7px', fontWeight: 900 }}>{n}</span> : null })()}
                  </button>
                  <button
                    onClick={() => handleBulkEvaluating(false)}
                    className="track-btn"
                    style={{ fontSize: '13px', padding: '10px 20px', borderRadius: '10px', color: '#dc2626', borderColor: '#fecaca' }}
                  >
                    ⏹ Detener Evaluación
                  </button>
                  <button 
                    onClick={handleCleanupNonAttendees} 
                    className="ranking-btn-primary" 
                    style={{ width: 'auto', background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
                  >
                    🧹 Depurar
                  </button>
                  <button 
                    onClick={handleCloseFormative} 
                    className="ranking-btn-primary" 
                    style={{ width: 'auto', background: 'linear-gradient(135deg, #475569, #334155)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}
                  >
                    🔒 Cierre de Formativa
                  </button>
                  <button 
                    onClick={() => setShowOptionsModal(true)} 
                    className="track-btn" 
                    style={{ fontSize: '13px', padding: '10px 20px', borderRadius: '10px' }}
                  >
                    ⚙️ Criterios
                  </button>
                </div>
              </div>

              {/* Sección de Sesión */}
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                {/* Input de Título de Sesión Activa */}
                <div style={{ flex: '1', minWidth: '240px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    📋 Título de Sesión Activa
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={formativeSessionTitle}
                      onChange={e => setFormativeSessionTitle(e.target.value)}
                      placeholder="Ej: Formativas 20260604"
                      style={{ flex: 1, border: '1.5px solid #7c3aed', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', fontWeight: 600, background: '#faf5ff', color: '#5b21b6', outline: 'none' }}
                    />
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>Los candidatos que agregues irán a esta sesión</p>
                </div>

                {/* Selector de sesión para filtrar/ver */}
                <div style={{ minWidth: '260px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                    🔍 Ver Sesión
                  </label>
                  <select
                    value={formativeSessionFilter}
                    onChange={e => setFormativeSessionFilter(e.target.value)}
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', background: '#f8fafc', color: '#1e293b', cursor: 'pointer' }}
                  >
                    <option value="ALL">Todas las sesiones ({formativeCandidates.length})</option>
                    {formativeSessions.map(s => (
                      <option key={s} value={s}>
                        {s} ({formativeCandidates.filter(c => c.session_title === s).length} candidatos)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Sub-pestañas de Formativas ─────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
              {([
                { key: 'candidatos', label: '👥 Candidatos' },
                { key: 'resultados', label: '📊 Resultados' },
                { key: 'medica',     label: '⚕️ Valoración Médica' },
                { key: 'fase2',      label: '🏆 Fase 2' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFormativasSubTab(tab.key)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '9px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: formativasSubTab === tab.key ? 800 : 500,
                    background: formativasSubTab === tab.key ? 'white' : 'transparent',
                    color: formativasSubTab === tab.key ? '#7c3aed' : '#64748b',
                    boxShadow: formativasSubTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── PESTAÑA: CANDIDATOS ────────────────────────────────────── */}
            {formativasSubTab === 'candidatos' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'flex-start' }}>
              
              {/* Sección Izquierda: Candidatos Formativos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="table-container">
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Postulantes en Formativas</h3>
                      {formativeSessionFilter !== 'ALL' && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>
                          📋 Sesión: {formativeSessionFilter}
                        </p>
                      )}
                    </div>
                    {/* Buscador por nombre */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px', maxWidth: '320px' }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#94a3b8', pointerEvents: 'none' }}>🔎</span>
                        <input
                          type="text"
                          value={formativeNameFilter}
                          onChange={e => setFormativeNameFilter(e.target.value)}
                          placeholder="Buscar por nombre..."
                          style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px 8px 32px', fontSize: '13px', color: '#1e293b', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                        />
                        {formativeNameFilter && (
                          <button
                            onClick={() => setFormativeNameFilter('')}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', lineHeight: 1, padding: 0 }}
                            title="Limpiar búsqueda"
                          >×</button>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      {formativeSessionFilter === 'ALL' 
                        ? `${formativeCandidates.length} candidatos`
                        : `${formativeCandidates.filter(c => c.session_title === formativeSessionFilter).length} de ${formativeCandidates.length}`
                      }
                    </span>
                  </div>
                  
                  <table>
                    <thead>
                      <tr>
                        <th>Candidato</th>
                        <th>Cargo</th>
                        <th>Cita Programada</th>
                        <th style={{ textAlign: 'center', width: '110px' }}>Confirmación</th>
                        <th style={{ textAlign: 'center', width: '110px' }}>Asistencia</th>
                        <th>Calificaciones Recibidas</th>
                        <th style={{ textAlign: 'center', width: '90px' }}>Promedio</th>
                        <th style={{ textAlign: 'right' }}>Evaluación en Vivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formativeCandidates.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                            No hay candidatos en formativas. Selecciona candidatos desde la pestaña <strong>Resumen</strong> marcando su checkbox.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {(() => {
                            const sessionFiltered = formativeSessionFilter === 'ALL' ? formativeCandidates : formativeCandidates.filter(c => c.session_title === formativeSessionFilter);
                            const nameFiltered = formativeNameFilter.trim()
                              ? sessionFiltered.filter(c => (c.email_resumes?.sender_name || '').toLowerCase().includes(formativeNameFilter.trim().toLowerCase()))
                              : sessionFiltered;
                            if (nameFiltered.length === 0) return (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                                  {formativeNameFilter.trim() ? (<>No se encontraron candidatos con el nombre <strong>&quot;{formativeNameFilter}&quot;</strong>.</>) : (<>No hay candidatos en la sesión <strong>{formativeSessionFilter}</strong>.</>)}
                                </td>
                              </tr>
                            );
                            
                            const sortedFiltered = [...nameFiltered].sort((a, b) => {
                              const evalsA = formativeEvaluations.filter(e => e.candidate_id === a.id);
                              const avgA = evalsA.length > 0 ? evalsA.reduce((sum, e) => sum + e.score, 0) / evalsA.length : -999;
                              const evalsB = formativeEvaluations.filter(e => e.candidate_id === b.id);
                              const avgB = evalsB.length > 0 ? evalsB.reduce((sum, e) => sum + e.score, 0) / evalsB.length : -999;
                              return avgB - avgA;
                            });

                            return sortedFiltered.map(c => {
                            const isCurrentlyActive = activeEvaluatingCandidateId === c.id;
                            const candidateEvals = formativeEvaluations.filter(e => e.candidate_id === c.id);
                            return (
                              <tr key={c.id} style={{ background: isCurrentlyActive ? 'rgba(59, 130, 246, 0.03)' : 'inherit' }}>
                                <td>
                                  <p style={{ fontWeight: 700, margin: 0, color: '#1e293b' }}>{c.email_resumes?.sender_name || 'Candidato'}</p>
                                  <p style={{ fontSize: '12px', color: '#64748b', margin: '1px 0 0' }}>{c.email_resumes?.sender_email || '—'}</p>
                                  {c.session_title && (
                                    <span style={{ fontSize: '9px', background: '#f3e8ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, display: 'inline-block', marginTop: '2px' }}>
                                      {c.session_title}
                                    </span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 600, color: '#475569' }}>{c.email_resumes?.position || '—'}</td>
                                <td>
                                  {c.interview_date ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#0f172a' }}>
                                        {new Date(c.interview_date + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}
                                      </span>
                                      <span style={{ fontSize: '11px', color: '#64748b' }}>{c.interview_time || '—'}</span>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Sin programar</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={!!c.confirmed} 
                                      onChange={async (e) => {
                                        const checked = e.target.checked;
                                        try {
                                          const { error } = await supabase
                                            .from('formative_candidates')
                                            .update({ confirmed: checked })
                                            .eq('id', c.id);
                                          if (error) throw error;
                                          setFormativeCandidates(prev => prev.map(item => item.id === c.id ? { ...item, confirmed: checked } : item));
                                        } catch (err: any) {
                                          alert('Error al actualizar confirmación: ' + err.message);
                                        }
                                      }}
                                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
                                    />
                                  </div>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={!!c.attended} 
                                      onChange={async (e) => {
                                        const checked = e.target.checked;
                                        try {
                                          const { error } = await supabase
                                            .from('formative_candidates')
                                            .update({ attended: checked })
                                            .eq('id', c.id);
                                          if (error) throw error;
                                          setFormativeCandidates(prev => prev.map(item => item.id === c.id ? { ...item, attended: checked } : item));
                                        } catch (err: any) {
                                          alert('Error al actualizar asistencia: ' + err.message);
                                        }
                                      }}
                                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                                    />
                                  </div>
                                </td>
                                <td>
                                  {candidateEvals.length === 0 ? (
                                    <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Pendiente</span>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {candidateEvals.map(e => {
                                        const sup = formativeSupervisors.find(s => s.id === e.supervisor_id);
                                        return (
                                          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11.5px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#475569', fontWeight: 600 }}>{sup?.name || 'Supervisor'}</span>
                                            <span style={{ color: e.score >= 0 ? '#166534' : '#991b1b', fontWeight: 800 }}>
                                              {e.score >= 0 ? `+${e.score}` : e.score} pts
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {candidateEvals.length > 0 ? (
                                    (() => {
                                      const total = candidateEvals.reduce((acc, e) => acc + e.score, 0);
                                      const avg = total / candidateEvals.length;
                                      return (
                                        <div style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          background: avg >= 70 ? '#ecfdf5' : avg >= 40 ? '#fffbeb' : '#fef2f2',
                                          color: avg >= 70 ? '#059669' : avg >= 40 ? '#d97706' : '#dc2626',
                                          border: `1px solid ${avg >= 70 ? '#a7f3d0' : avg >= 40 ? '#fde68a' : '#fecaca'}`,
                                          fontWeight: 800,
                                          fontSize: '14px',
                                          padding: '4px 10px',
                                          borderRadius: '8px'
                                        }}>
                                          {avg.toFixed(1)}
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <span style={{ fontSize: '11px', color: '#cbd5e1' }}>—</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleToggleEvaluating(c)}
                                    style={{
                                      width: 'auto',
                                      background: c.is_evaluating
                                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                        : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    {c.is_evaluating ? '⏹ Quitar' : '🎯 Evaluar'}
                                  </button>
                                  {c.is_evaluating && (
                                    <span style={{ fontSize: '10px', color: '#7c3aed', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                      <span className="animate-pulse" style={{ width: '5px', height: '5px', background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }}></span>
                                      En evaluación
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })})()
                          }
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Sección Derecha: Supervisores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Registrar Supervisor */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    + Registrar Supervisor
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="ranking-label">Nombre del Supervisor</label>
                      <input 
                        type="text" 
                        value={supervisorName}
                        onChange={e => setSupervisorName(e.target.value)}
                        placeholder="Ej: Juan Pérez"
                        className="ranking-input"
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                    <div>
                      <label className="ranking-label">Correo Electrónico</label>
                      <input 
                        type="email" 
                        value={supervisorEmail}
                        onChange={e => setSupervisorEmail(e.target.value)}
                        placeholder="Ej: supervisor@empresa.com"
                        className="ranking-input"
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                    <button 
                      onClick={handleCreateSupervisor}
                      disabled={savingSupervisor || !supervisorName.trim() || !supervisorEmail.trim()}
                      className="ranking-btn-primary"
                      style={{ padding: '10px', fontSize: '13px', borderRadius: '8px' }}
                    >
                      {savingSupervisor ? 'Registrando...' : 'Registrar'}
                    </button>
                  </div>
                </div>

                {/* Listado de Supervisores */}
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Supervisores Activos
                  </h3>
                  {formativeSupervisors.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic' }}>No hay supervisores registrados.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {formativeSupervisors.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{s.name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.email}</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteSupervisor(s.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Eliminar Supervisor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
            )}{/* fin candidatos */}

            {/* ── PESTAÑA: RESULTADOS ─────────────────────────────────────── */}
            {formativasSubTab === 'resultados' && (() => {
              // Calcular resultados por candidato
              const resultsData = (() => {
                const sessionCands = formativeSessionFilter === 'ALL'
                  ? formativeCandidates
                  : formativeCandidates.filter(c => c.session_title === formativeSessionFilter)
                return sessionCands.map(c => {
                  const evals = formativeEvaluations.filter((e: any) => e.candidate_id === c.id)
                  const totalScore = evals.reduce((sum: number, e: any) => sum + (e.score || 0), 0)
                  const avgScore = evals.length > 0 ? Math.round(totalScore / evals.length) : 0
                  return { ...c, evals, totalScore, avgScore }
                }).sort((a, b) => b.totalScore - a.totalScore)
              })()

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="table-container">
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Resultados de Evaluación</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Todos los supervisores · ordenado por puntaje total</p>
                      </div>
                      <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1e40af', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}>
                        {resultsData.length} candidatos
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', minWidth: '180px' }}>Candidato</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Sesión</th>
                            {formativeSupervisors.map((s: any) => (
                              <th key={s.id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', minWidth: '110px' }}>
                                {s.name.split(' ')[0]}
                              </th>
                            ))}
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', minWidth: '90px' }}>Total</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', minWidth: '80px' }}>Fase</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', minWidth: '130px' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultsData.length === 0 ? (
                            <tr><td colSpan={formativeSupervisors.length + 5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No hay candidatos en esta sesión.</td></tr>
                          ) : resultsData.map((c: any, idx: number) => (
                            <tr key={c.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px' }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{c.email_resumes?.sender_name || '—'}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{c.email_resumes?.position || '—'}</p>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                {c.session_title ? (
                                  <span style={{ fontSize: '10px', background: '#f3e8ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>{c.session_title}</span>
                                ) : <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>}
                              </td>
                              {formativeSupervisors.map((s: any) => {
                                const ev = c.evals.find((e: any) => e.supervisor_id === s.id)
                                return (
                                  <td key={s.id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    {ev ? (
                                      <span style={{ fontWeight: 800, fontSize: '14px', color: ev.score > 0 ? '#7c3aed' : '#ef4444' }}>{ev.score} pts</span>
                                    ) : (
                                      <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
                                    )}
                                  </td>
                                )
                              })}
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '16px', color: c.totalScore > 0 ? '#1e293b' : '#94a3b8' }}>{c.totalScore > 0 ? `${c.totalScore}` : '—'}</span>
                                {c.evals.length > 1 && <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>prom. {c.avgScore}</span>}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{
                                  fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
                                  background: c.fase === 2 ? '#d1fae5' : '#f1f5f9',
                                  color: c.fase === 2 ? '#065f46' : '#64748b',
                                  border: `1px solid ${c.fase === 2 ? '#a7f3d0' : '#e2e8f0'}`
                                }}>
                                  {c.fase === 2 ? '🏆 Fase 2' : 'Fase 1'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  {c.fase === 2 ? (
                                    <button
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from('formative_candidates')
                                            .update({ fase: 1 })
                                            .eq('id', c.id);
                                          if (error) throw error;
                                          setFormativeCandidates(prev => prev.map(item => item.id === c.id ? { ...item, fase: 1 } : item));
                                        } catch (err: any) {
                                          alert('Error: ' + err.message);
                                        }
                                      }}
                                      style={{
                                        background: '#fef2f2',
                                        color: '#ef4444',
                                        border: '1px solid #fee2e2',
                                        borderRadius: '8px',
                                        padding: '5px 10px',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                      }}
                                    >
                                      Quitar Fase 2
                                    </button>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        try {
                                          const { error } = await supabase
                                            .from('formative_candidates')
                                            .update({ fase: 2 })
                                            .eq('id', c.id);
                                          if (error) throw error;
                                          setFormativeCandidates(prev => prev.map(item => item.id === c.id ? { ...item, fase: 2 } : item));
                                        } catch (err: any) {
                                          alert('Error: ' + err.message);
                                        }
                                      }}
                                      style={{
                                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '5px 12px',
                                        fontSize: '11.5px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                      }}
                                    >
                                      Promover a Fase 2
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (!window.confirm(`¿Estás seguro de que deseas borrar a ${c.email_resumes?.sender_name} de Formativas?`)) return;
                                      try {
                                        const { error } = await supabase.from('formative_candidates').delete().eq('id', c.id);
                                        if (error) throw error;
                                        setFormativeCandidates(prev => prev.filter(item => item.id !== c.id));
                                      } catch (err: any) {
                                        alert('Error al borrar: ' + err.message);
                                      }
                                    }}
                                    style={{
                                      background: 'white',
                                      color: '#64748b',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      padding: '5px 10px',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Borrar candidato (Depurar)"
                                  >
                                    Borrar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── PESTAÑA: VALORACIÓN MÉDICA ─────────────────────────────── */}
            {formativasSubTab === 'medica' && (() => {
              const sessionCands = formativeSessionFilter === 'ALL'
                ? formativeCandidates
                : formativeCandidates.filter(c => c.session_title === formativeSessionFilter)

              const passedCands = sessionCands.filter(c => c.fase === 2);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)', border: '1px solid #f5d0fe', borderRadius: '16px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#86198f', fontSize: '14px', fontWeight: 800 }}>⚕️ Valoración Médica</h4>
                      <p style={{ margin: '4px 0 0', color: '#701a75', fontSize: '12.5px' }}>Estos candidatos pasaron la entrevista y evaluación. Descarga el reporte para enviar a valoración médica.</p>
                    </div>
                    <button onClick={handleExportMedica} className="ranking-btn-primary" style={{ background: 'linear-gradient(135deg, #d946ef, #c026d3)', padding: '10px 20px', borderRadius: '10px', fontSize: '13px' }}>
                      📥 Descargar Excel
                    </button>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Nombres y Apellidos</th>
                          <th>Responsable</th>
                          <th>Celular</th>
                          <th>Cédula</th>
                          <th>Correo</th>
                          <th>Domicilio</th>
                          <th>Sector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passedCands.map(c => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: 600 }}>{c.email_resumes?.sender_name || 'Desconocido'}</td>
                            <td>{c.created_by_user || 'Sin asignar'}</td>
                            <td>{c.email_resumes?.sender_phone}</td>
                            <td>{c.email_resumes?.cedula}</td>
                            <td>{c.email_resumes?.sender_email}</td>
                            <td>{c.email_resumes?.address || c.email_resumes?.city}</td>
                            <td>{c.email_resumes?.sector}</td>
                          </tr>
                        ))}
                        {passedCands.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No hay candidatos en esta fase.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* ── PESTAÑA: FASE 2 ─────────────────────────────────────────── */}
            {formativasSubTab === 'fase2' && (() => {
              const sessionCands = formativeSessionFilter === 'ALL'
                ? formativeCandidates
                : formativeCandidates.filter(c => c.session_title === formativeSessionFilter)

              const ranked = sessionCands.map(c => {
                const evals = formativeEvaluations.filter((e: any) => e.candidate_id === c.id)
                const totalScore = evals.reduce((sum: number, e: any) => sum + (e.score || 0), 0)
                return { ...c, totalScore, evalCount: evals.length }
              }).filter(c => c.fase === 2).sort((a, b) => b.totalScore - a.totalScore)

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Encabezado informativo */}
                  <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#1e40af', fontSize: '14px', fontWeight: 800 }}>🏆 Candidatos Seleccionados para Fase 2</h4>
                      <p style={{ margin: '4px 0 0', color: '#1e3a8a', fontSize: '12.5px' }}>Estos candidatos han sido promovidos desde la pestaña de Resultados. Presiona el botón para enviar los accesos de Onboarding a todos.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#1e40af', background: '#dbeafe', padding: '10px 16px', borderRadius: '10px', fontWeight: 800 }}>
                        📋 Total: {ranked.length}
                      </div>
                      <button
                        onClick={() => handleSendBulkOnboarding(ranked)}
                        disabled={sendingBulkOnboarding || ranked.length === 0}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 20px',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          opacity: (sendingBulkOnboarding || ranked.length === 0) ? 0.5 : 1,
                          transition: 'all 0.15s',
                          boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
                        }}
                      >
                        {sendingBulkOnboarding ? '⏳ Enviando...' : `🚀 Enviar Onboarding a Todos (${ranked.length})`}
                      </button>
                    </div>
                  </div>

                  {/* Ranking */}
                  <div className="table-container">
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>Ranking de Candidatos</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Ordenados por puntaje total (suma de todos los supervisores)</p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', width: '48px' }}>#</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Candidato</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Evaluadores</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Puntaje Total</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', minWidth: '160px' }}>Onboarding</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ranked.length === 0 ? (
                          <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No hay candidatos promovidos a la Fase 2 en esta sesión.</td></tr>
                        ) : ranked.map((c: any, idx: number) => {
                          return (
                            <tr key={c.id} style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '14px', color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#94a3b8' }}>
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>{c.email_resumes?.sender_name || '—'}</p>
                                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{c.email_resumes?.position || '—'}</p>
                                {c.session_title && <span style={{ fontSize: '9px', background: '#f3e8ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>{c.session_title}</span>}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: c.evalCount > 0 ? '#475569' : '#cbd5e1' }}>{c.evalCount > 0 ? `${c.evalCount} sup.` : '—'}</span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <span style={{ fontWeight: 900, fontSize: '18px', color: c.totalScore > 0 ? '#1e293b' : '#94a3b8' }}>{c.totalScore > 0 ? c.totalScore : '—'}</span>
                                <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8' }}>pts</span>
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                {(() => {
                                  const onboardingCand = candidates.find(
                                    ond => ond.email === c.email_resumes?.sender_email || ond.email === c.email_resumes?.email
                                  )
                                  if (onboardingCand) {
                                    return (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{
                                          fontSize: '11.5px', fontWeight: 800, color: '#065f46', background: '#d1fae5',
                                          border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '8px'
                                        }}>
                                          ✅ Enviado ({onboardingCand.status === 'PENDING' ? 'Pendiente' : onboardingCand.status})
                                        </span>
                                        <button
                                          onClick={() => handleSendApprovalEmail(c.resume_id)}
                                          style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '10.5px', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                                        >
                                          Reenviar Correo
                                        </button>
                                      </div>
                                    )
                                  }
                                  return (
                                    <button
                                      onClick={() => handleSendApprovalEmail(c.resume_id)}
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px 14px',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      🚀 Enviar Onboarding
                                    </button>
                                  )
                                })()}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}

          </div>
        )}

          {/* Modales de Evaluación Psicométrica */}
          {qrModalUrl && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', color: '#0f172a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Código QR de Evaluación</h3>
                  <button onClick={() => setQrModalUrl(null)} className="track-btn" style={{ padding: '6px' }}><X size={16} /></button>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Indique al candidato que escanee este código con su teléfono celular para iniciar la evaluación psicométrica.</p>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-block' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrModalUrl)}`} 
                    alt="QR Code" 
                    style={{ width: '250px', height: '250px', display: 'block' }}
                  />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <a href={qrModalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>Abrir enlace directo en el navegador</a>
                </div>
              </div>
            </div>
          )}

          {viewingPsychometric && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
              <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '95%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', color: '#0f172a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Evaluación Psicométrica</h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13.5px' }}>
                      Candidato: <strong style={{ color: '#1e293b' }}>{viewingPsychometric.candidate?.sender_name}</strong> · Cargo Postulado: <strong style={{ color: '#1e293b' }}>{viewingPsychometric.candidate?.position}</strong>
                    </p>
                  </div>
                  <button onClick={() => setViewingPsychometric(null)} className="track-btn" style={{ padding: '8px', borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>

                {(() => {
                  const verbal = viewingPsychometric.test.verbal_score || 0;
                  const espacial = viewingPsychometric.test.espacial_score || 0;
                  const logico = viewingPsychometric.test.logico_score || 0;
                  const numerico = viewingPsychometric.test.numerico_score || 0;
                  const abstracto = viewingPsychometric.test.abstracto_score || 0;
                  const avgAptitude = Math.round((verbal + espacial + logico + numerico + abstracto) / 5);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Promedio Aptitudes */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '8px' }}>
                        {/* Tarjeta de Promedio Aptitudes */}
                        <div style={{ 
                          background: '#f8fafc', 
                          border: '1.5px solid #e2e8f0', 
                          borderRadius: '20px', 
                          padding: '20px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)',
                            color: 'white',
                            fontWeight: 900,
                            fontSize: '18px',
                            flexShrink: 0
                          }}>
                            {avgAptitude}%
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Promedio Aptitudes Técnicas</span>
                            <h3 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 900, color: '#1e293b' }}>
                              Cognición: <span style={{ color: '#2563eb' }}>{avgAptitude >= 75 ? 'Excelente' : avgAptitude >= 50 ? 'Adecuado' : 'Bajo'}</span>
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Navigation tabs inside Modal */}
                      <div style={{ 
                        display: 'flex', 
                        borderBottom: '2px solid #e2e8f0', 
                        marginBottom: '16px', 
                        gap: '6px',
                        overflowX: 'auto',
                        paddingBottom: '2px'
                      }}>
                        {[
                          { id: 'disc', label: '🧠 Conducta (DISC)', icon: '📈' },
                          { id: 'cognicion', label: '⚡ Cognición (Aptitudes)', icon: '👣' },
                          { id: 'preguntas', label: '💬 Guía de Entrevista', icon: '❓' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setActiveResultsTab(t.id as any)}
                            style={{
                              padding: '10px 16px',
                              background: 'none',
                              border: 'none',
                              fontSize: '13.5px',
                              fontWeight: 800,
                              color: activeResultsTab === t.id ? '#2563eb' : '#64748b',
                              cursor: 'pointer',
                              borderBottom: `3px solid ${activeResultsTab === t.id ? '#2563eb' : 'transparent'}`,
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <span>{t.icon}</span> {t.label}
                          </button>
                        ))}
                      </div>



                      {/* TAB CONTENT: DISC */}
                      {activeResultsTab === 'disc' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
                          <DiscLineChart 
                            D={viewingPsychometric.test.kudert_disc?.D || 0} 
                            I={viewingPsychometric.test.kudert_disc?.I || 0} 
                            S={viewingPsychometric.test.kudert_disc?.S || 0} 
                            C={viewingPsychometric.test.kudert_disc?.C || 0} 
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resumen de Dimensiones DISC</span>
                            {[
                              { label: 'D', name: 'Decisión', val: viewingPsychometric.test.kudert_disc?.D || 0, desc: 'Liderazgo, orientación a resultados y empuje ante retos.', color: '#ef4444' },
                              { label: 'I', name: 'Interacción', val: viewingPsychometric.test.kudert_disc?.I || 0, desc: 'Comunicación, sociabilidad y capacidad de persuasión.', color: '#f59e0b' },
                              { label: 'S', name: 'Serenidad', val: viewingPsychometric.test.kudert_disc?.S || 0, desc: 'Paciencia, trabajo en equipo y resistencia a la presión.', color: '#10b981' },
                              { label: 'C', name: 'Cumplimiento', val: viewingPsychometric.test.kudert_disc?.C || 0, desc: 'Análisis, disciplina y apego a normas y calidad.', color: '#3b82f6' }
                            ].map((item, idx) => (
                              <div key={idx} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: item.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px', flexShrink: 0 }}>
                                  {item.label}
                                </span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '12px', color: '#1e293b' }}>{item.name}</strong>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: item.color }}>{item.val}%</span>
                                  </div>
                                  <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#64748b', lineHeight: 1.2 }}>{item.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB CONTENT: COGNICION */}
                      {activeResultsTab === 'cognicion' && (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '16px 24px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Velocidad y Flujo de Procesamiento</span>
                          <CognitiveFlowRow letter="V" name="Razonamiento Verbal" desc="Comprensión léxica e identificación de sinónimos" score={viewingPsychometric.test.verbal_score || 0} />
                          <CognitiveFlowRow letter="E" name="Razonamiento Espacial" desc="Visualización y rotación mental de figuras" score={viewingPsychometric.test.espacial_score || 0} />
                          <CognitiveFlowRow letter="L" name="Razonamiento Lógico" desc="Descubrir patrones de secuencias y reglas lógicas" score={viewingPsychometric.test.logico_score || 0} />
                          <CognitiveFlowRow letter="N" name="Razonamiento Numérico" desc="Agilidad en operaciones matemáticas y resolución de problemas" score={viewingPsychometric.test.numerico_score || 0} />
                          <CognitiveFlowRow letter="A" name="Razonamiento Abstracto" desc="Deducir y continuar secuencias de figuras complejas" score={viewingPsychometric.test.abstracto_score || 0} />
                          
                          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', background: '#eff6ff', padding: '12px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                            <span style={{ fontSize: '14px' }}>🛡️</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '12px', color: '#1e40af' }}>Ética y Cumplimiento de Normas</strong>
                                <span style={{ fontSize: '13px', fontWeight: 900, color: '#1d4ed8' }}>{viewingPsychometric.test.ethics_score || 0}/100</span>
                              </div>
                              <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#1e3a8a', lineHeight: 1.2 }}>Estudio de dilemas éticos y apego a políticas corporativas.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB CONTENT: PREGUNTAS ENTRIVISTA */}
                      {activeResultsTab === 'preguntas' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guía de Entrevista Recomendada</span>
                          {loadingRecommendation ? (
                            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                              <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
                              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Generando preguntas de entrevista...</span>
                            </div>
                          ) : (() => {
                            const questions = aiRecommendation?.interview_questions || aiRecommendation?.interviewQuestions || aiRecommendation?.preguntas_entrevista || aiRecommendation?.preguntas || [];
                            if (questions.length > 0) {
                              return questions.map((q: string, i: number) => (
                                <div key={i} style={{ 
                                  display: 'flex', 
                                  gap: '12px', 
                                  background: '#eff6ff', 
                                  border: '1px solid #dbeafe', 
                                  padding: '16px', 
                                  borderRadius: '16px',
                                  borderLeft: '4px solid #3b82f6',
                                  boxShadow: '0 2px 4px rgba(59,130,246,0.02)'
                                }}>
                                  <span style={{ fontSize: '20px', color: '#3b82f6', alignSelf: 'flex-start', flexShrink: 0 }}>💬</span>
                                  <div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', fontWeight: 700 }}>Pregunta sugerida {i + 1}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#334155', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.5 }}>
                                      "{q}"
                                    </p>
                                  </div>
                                </div>
                              ));
                            }
                            return (
                              <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Las preguntas de entrevista se sugieren en base a la evaluación psicométrica.</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div style={{ marginTop: '28px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setViewingPsychometric(null)} className="track-btn" style={{ background: '#0f172a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800 }}>Cerrar Reporte</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Floating AI Copilot Widget */}
      {user && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'inherit' }}>
          
          {/* Chat Window */}
          {showCopilot && (
            <div style={{ 
              width: '380px', 
              height: '500px', 
              background: 'white', 
              borderRadius: '20px', 
              boxShadow: '0 12px 24px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e2e8f0', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden',
              marginBottom: '16px'
            }}>
              
              {/* Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #002f6c, #004b93)', 
                color: 'white', 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={18} color="white" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800 }}>Copiloto IA</h4>
                    <span style={{ fontSize: '10.5px', color: '#93c5fd', fontWeight: 600 }}>Asistente de Selección</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCopilot(false)} 
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages Container */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
                {copilotMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: isUser ? '#002f6c' : 'white',
                        color: isUser ? 'white' : '#1e293b',
                        padding: '12px 16px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '12.5px',
                        lineHeight: '1.5',
                        boxShadow: isUser ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
                        border: isUser ? 'none' : '1px solid #e2e8f0',
                        whiteSpace: 'pre-line'
                      }}
                    >
                      {msg.content}
                    </div>
                  );
                })}
                {copilotLoading && (
                  <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }} />
                      <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }} />
                      <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form 
                onSubmit={handleSendCopilotMessage}
                style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: 'white', alignItems: 'center' }}
              >
                <input 
                  type="text" 
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  placeholder="Pregúntame sobre tus candidatos..."
                  disabled={copilotLoading}
                  style={{ 
                    flex: 1, 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '999px', 
                    padding: '8px 16px', 
                    fontSize: '13px', 
                    outline: 'none'
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!copilotInput.trim() || copilotLoading}
                  style={{ 
                    background: '#002f6c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '36px', 
                    height: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer',
                    opacity: (!copilotInput.trim() || copilotLoading) ? 0.5 : 1
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* Floating Trigger Button */}
          <button 
            onClick={() => setShowCopilot(!showCopilot)}
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #002f6c, #004b93)', 
              color: 'white', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              boxShadow: '0 8px 16px rgba(0, 47, 108, 0.3)',
              transition: 'transform 0.2s ease-in-out',
              transform: showCopilot ? 'rotate(90deg)' : 'none'
            }}
          >
            {showCopilot ? <X size={24} /> : <MessageSquare size={24} />}
          </button>
        </div>
      )}
    </>
  )
}
