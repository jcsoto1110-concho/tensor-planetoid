'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { RefreshCw, Star, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react'

interface EvalCandidate {
  id: string
  candidate_name: string
  candidate_cargo: string
  city?: string
  age?: number | string
  gender?: string
  sector?: string
  cv_url?: string
}

interface EvalOption {
  id: string
  label: string
  weight: number
  category: string
}

export default function SupervisorPortal() {
  // ── Auth ──────────────────────────────────────────────────────────────
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [supervisor, setSupervisor] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [checkingActive, setCheckingActive] = useState(true)

  // ── Evaluation data ───────────────────────────────────────────────────
  const [activeCandidates, setActiveCandidates] = useState<EvalCandidate[]>([])
  const [options, setOptions] = useState<EvalOption[]>([])
  // { candidateId: { optionId: valorIngresado } }
  const [criterionValues, setCriterionValues] = useState<Record<string, Record<string, string>>>({})
  // Valor propuesto global por candidato (override del total)
  const [proposedByCandidate, setProposedByCandidate] = useState<Record<string, string>>({})
  const [submittedCandidates, setSubmittedCandidates] = useState<Set<string>>(new Set())
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [commentsByCandidate, setCommentsByCandidate] = useState<Record<string, string>>({})
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'evaluar' | 'resultados'>('evaluar')
  const [allEvals, setAllEvals] = useState<any[]>([])
  const [allSupers, setAllSupers] = useState<any[]>([])

  // ── Restore session ───────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('supervisor_session')
    if (saved) {
      try { setSupervisor(JSON.parse(saved)) } catch { localStorage.removeItem('supervisor_session') }
    }
    setCheckingActive(false)
  }, [])

  // ── Fetch options ─────────────────────────────────────────────────────
  const fetchOptions = async () => {
    const { data } = await supabase.from('formative_options').select('*').order('category')
    if (data) setOptions(data)
  }

  // Validate supervisor existence periodically
  useEffect(() => {
    const validateSupervisor = async () => {
      if (!supervisor) return
      const { data } = await supabase.from('formative_supervisors').select('id').eq('id', supervisor.id).maybeSingle()
      if (!data) {
        alert('Tu sesión ha expirado o el administrador ha actualizado tu perfil. Serás redirigido para ingresar nuevamente con el link más reciente.')
        handleLogout()
      }
    }
    validateSupervisor()
  }, [supervisor?.id])

  // ── Fetch active candidates (is_evaluating = true) ────────────────────
  const fetchActiveCandidates = async (sup: typeof supervisor) => {
    if (!sup) return
    const { data: cands } = await supabase
      .from('formative_candidates')
      .select('id, resume_id, session_title, email_resumes(sender_name, position, city, age, gender, sector, pdf_url)')
      .eq('is_evaluating', true)
      .order('created_at', { ascending: true })

    if (!cands) return

    const mapped: EvalCandidate[] = cands.map((c: any) => ({
      id: c.id,
      candidate_name: c.email_resumes?.sender_name || 'Candidato',
      candidate_cargo: c.email_resumes?.position || '—',
      city: c.email_resumes?.city || '—',
      age: c.email_resumes?.age || '—',
      gender: c.email_resumes?.gender || '—',
      sector: c.email_resumes?.sector || '—',
      cv_url: c.email_resumes?.pdf_url || null,
      session_title: c.session_title
    }))
    setActiveCandidates(mapped as any)

    // Check which ones this supervisor already evaluated
    if (mapped.length > 0) {
      const { data: evals } = await supabase
        .from('formative_evaluations')
        .select('candidate_id, selected_options, notes, comments')
        .eq('supervisor_id', sup.id)
        .in('candidate_id', mapped.map(c => c.id))

      if (evals && evals.length > 0) {
        const submitted = new Set<string>()
        const preloadedCriterion: Record<string, Record<string, string>> = {}
        const preloadedProposed: Record<string, string> = {}
        const preloadedComments: Record<string, string> = {}
        evals.forEach((e: any) => {
          submitted.add(e.candidate_id)
          // Restaurar valores por criterio si estaban guardados como objeto JSON en selected_options
          if (Array.isArray(e.selected_options)) {
            // Formato antiguo: array de IDs → restaurar como peso completo
            const map: Record<string, string> = {}
            e.selected_options.forEach((id: string) => map[id] = '')
            preloadedCriterion[e.candidate_id] = map
          }
          if (e.notes !== null && e.notes !== undefined) {
            const notesStr = String(e.notes)
            // Si es un JSON guardado (por ej: {"id":"5"}), no lo mostramos como propuesto.
            if (!notesStr.trim().startsWith('{')) {
              preloadedProposed[e.candidate_id] = notesStr
            }
          }
          if (e.comments !== null && e.comments !== undefined) {
            preloadedComments[e.candidate_id] = String(e.comments)
          }
        })
        setSubmittedCandidates(submitted)
        setCriterionValues(prev => ({ ...prev, ...preloadedCriterion }))
        setProposedByCandidate(prev => ({ ...prev, ...preloadedProposed }))
        setCommentsByCandidate(prev => ({ ...prev, ...preloadedComments }))
      }
      
      // Fetch all evals for RESULTS tab
      const { data: allEvaluations } = await supabase
        .from('formative_evaluations')
        .select('*')
        .in('candidate_id', mapped.map(c => c.id))
      if (allEvaluations) setAllEvals(allEvaluations)
      
      const { data: supers } = await supabase.from('formative_supervisors').select('*')
      if (supers) setAllSupers(supers)
    }
  }

  // ── Poll every 5s when logged in ──────────────────────────────────────
  useEffect(() => {
    if (!supervisor) return
    fetchOptions()
    fetchActiveCandidates(supervisor)
    const interval = setInterval(() => fetchActiveCandidates(supervisor), 5000)
    return () => clearInterval(interval)
  }, [supervisor])

  // ── Login ─────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese usuario y contraseña.')
      return
    }
    setLoading(true)
    setErrorMessage('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula: username.trim(), password, app: 'supervisor' })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Credenciales inválidas')

      const cleanUser = username.trim().toLowerCase()
      const shortUser = cleanUser.split('@')[0]
      const { data: supData, error: supError } = await supabase
        .from('formative_supervisors')
        .select('*')
        .or(`email.ilike."${cleanUser}",email.ilike."${shortUser}@%"`)
        .maybeSingle()

      if (supError || !supData) {
        setErrorMessage(`Autenticación exitosa para "${cleanUser}", pero no está registrado como supervisor.`)
      } else {
        setSupervisor(supData)
        localStorage.setItem('supervisor_session', JSON.stringify(supData))
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('supervisor_session')
    setSupervisor(null)
    setActiveCandidates([])
    setSubmittedCandidates(new Set())
  }

  // ── Set valor de un criterio para un candidato ───────────────────────────────
  const setCriterionValue = (candidateId: string, optionId: string, raw: string, maxWeight: number) => {
    if (submittedCandidates.has(candidateId)) return
    // Clampar al máximo 10
    let val = raw === '' ? '' : String(Math.min(Math.max(0, Number(raw)), 10))
    setCriterionValues(prev => ({
      ...prev,
      [candidateId]: { ...(prev[candidateId] || {}), [optionId]: val }
    }))
  }

  // ── Submit evaluation for ONE candidate ───────────────────────────────
  const submitEvaluation = async (candidateId: string) => {
    if (!supervisor) return
    const vals = criterionValues[candidateId] || {}
    const proposed = proposedByCandidate[candidateId]
    const hasProposed = proposed !== undefined && proposed.trim() !== ''
    // Criterios con valor > 0
    const activeOptions = Object.entries(vals)
      .filter(([, v]) => v !== '' && Number(v) > 0)
    if (activeOptions.length === 0 && !hasProposed) {
      alert('Ingresa un valor en al menos un criterio antes de enviar.')
      return
    }
    setSubmittingId(candidateId)
    try {
      const criterionScore = activeOptions.reduce((sum, [id, v]) => sum + Number(v), 0)
      const finalScore = hasProposed ? Number(proposed) : criterionScore
      // Guardar IDs activos y sus valores como objeto
      const selectedIds = activeOptions.map(([id]) => id)

      const { error } = await supabase.from('formative_evaluations').upsert({
        candidate_id: candidateId,
        supervisor_id: supervisor.id,
        score: finalScore,
        selected_options: selectedIds,
        comments: commentsByCandidate[candidateId] || null,
        ...(hasProposed ? { notes: proposed } : { notes: JSON.stringify(Object.fromEntries(activeOptions)) })
      }, { onConflict: 'candidate_id,supervisor_id' })

      if (error) throw error
      setSubmittedCandidates(prev => new Set([...prev, candidateId]))
    } catch (e: any) {
      if (e.message?.includes('supervisor_id_fkey')) {
        alert('❌ Error: Tu sesión de supervisor es antigua o fue eliminada. Por favor, pide al administrador que te envíe un nuevo link de acceso.')
        handleLogout()
      } else {
        alert('Error al guardar: ' + e.message)
      }
    } finally {
      setSubmittingId(null)
    }
  }

  // ── Group options by category ─────────────────────────────────────────
  const optionsByCategory = useMemo(() => {
    const map: Record<string, EvalOption[]> = {}
    options.forEach(o => {
      if (!map[o.category]) map[o.category] = []
      map[o.category].push(o)
    })
    return map
  }, [options])

  // ── Compute score per candidate from criterion values ────────────────────────
  const scoreOf = (candidateId: string) => {
    const vals = criterionValues[candidateId] || {}
    return Object.values(vals).reduce((sum, v) => sum + (v !== '' ? Number(v) : 0), 0)
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: "'Inter', sans-serif", padding: '16px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', maxWidth: '1400px', margin: '0 auto 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Star style={{ color: '#7c3aed', fill: '#7c3aed' }} size={22} />
          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Evaluaciones Formativas
          </h1>
        </div>
        {supervisor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', display: 'flex', gap: '4px', marginRight: '16px' }}>
              <button 
                onClick={() => setActiveTab('evaluar')}
                style={{ background: activeTab === 'evaluar' ? '#7c3aed' : 'transparent', color: activeTab === 'evaluar' ? 'white' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🎯 Evaluar
              </button>
              <button 
                onClick={() => setActiveTab('resultados')}
                style={{ background: activeTab === 'resultados' ? '#7c3aed' : 'transparent', color: activeTab === 'resultados' ? 'white' : '#94a3b8', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                📊 Resumen
              </button>
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              👤 <strong style={{ color: '#f8fafc' }}>{supervisor.name}</strong>
            </span>
            <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* LOADING */}
        {checkingActive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '64px' }}>
            <RefreshCw className="animate-spin" style={{ color: '#7c3aed' }} size={32} />
            <p style={{ color: '#94a3b8' }}>Iniciando...</p>
          </div>

        /* LOGIN */
        ) : !supervisor ? (
          <div style={{ maxWidth: '420px', margin: '0 auto', background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '36px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <Star style={{ color: '#7c3aed', fill: '#7c3aed', margin: '0 auto 12px' }} size={32} />
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px' }}>Acceso Supervisor</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Ingresa con tu usuario y contraseña de Windows.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Usuario</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="ej: jsoto" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '11px 14px', color: '#f8fafc', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {errorMessage && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '8px' }}>
                  <AlertCircle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#fca5a5', lineHeight: 1.4 }}>{errorMessage}</p>
                </div>
              )}
              <button onClick={handleLogin} disabled={loading || !username.trim() || !password.trim()} style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', opacity: (loading || !username.trim() || !password.trim()) ? 0.6 : 1 }}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </div>

        /* MAIN: MATRIX */
        ) : activeTab === 'resultados' ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Resultados de Evaluación</h2>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Todos los supervisores · ordenado por puntaje total</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Candidato</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Sesión</th>
                    {allSupers.map(s => (
                      <th key={s.id} style={{ padding: '16px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>
                        {s.name.split(' ')[0]}
                      </th>
                    ))}
                    <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(activeCandidates as any[])].sort((a, b) => {
                    const totalA = allEvals.filter(e => e.candidate_id === a.id).reduce((sum, e) => sum + e.score, 0);
                    const totalB = allEvals.filter(e => e.candidate_id === b.id).reduce((sum, e) => sum + e.score, 0);
                    return totalB - totalA;
                  }).map(c => {
                    const evalsForCandidate = allEvals.filter(e => e.candidate_id === c.id);
                    const totalScore = evalsForCandidate.reduce((sum, e) => sum + e.score, 0);
                    const avgScore = evalsForCandidate.length > 0 ? (totalScore / evalsForCandidate.length).toFixed(0) : 0;
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <p style={{ fontWeight: 800, margin: 0, color: '#0f172a', fontSize: '14px' }}>{c.candidate_name}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>{c.candidate_cargo}</p>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          {c.session_title ? (
                            <span style={{ fontSize: '10px', background: '#f3e8ff', color: '#d946ef', border: '1px solid #fbcfe8', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, display: 'inline-block' }}>
                              {c.session_title}
                            </span>
                          ) : '—'}
                        </td>
                        {allSupers.map(s => {
                          const ev = evalsForCandidate.find(e => e.supervisor_id === s.id);
                          return (
                            <td key={s.id} style={{ padding: '16px 12px', textAlign: 'center' }}>
                              {ev ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 800, color: '#a78bfa', fontSize: '14px' }}>{ev.score} pts</span>
                                  {ev.comments && (
                                    <span style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', maxWidth: '80px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ev.comments}>
                                      💬 {ev.comments}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: '#cbd5e1' }}>—</span>
                              )}
                            </td>
                          )
                        })}
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px' }}>{totalScore}</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>prom. {avgScore}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {activeCandidates.length === 0 && (
                    <tr>
                      <td colSpan={allSupers.length + 3} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        No hay candidatos en evaluación.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Status bar */}
            <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="animate-pulse" style={{ width: '8px', height: '8px', background: activeCandidates.length > 0 ? '#a78bfa' : '#64748b', borderRadius: '50%', display: 'inline-block' }}></span>
                <span style={{ fontSize: '13px', color: '#c4b5fd', fontWeight: 600 }}>
                  {activeCandidates.length > 0
                    ? `${activeCandidates.length} candidato${activeCandidates.length > 1 ? 's' : ''} en evaluación · ${submittedCandidates.size} evaluado${submittedCandidates.size !== 1 ? 's' : ''}`
                    : 'Sin candidatos activos — el reclutador no ha iniciado evaluación todavía'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Actualización automática cada 5 s</span>
            </div>

            {activeCandidates.length === 0 ? (
              /* Sin candidatos */
              <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '64px 32px', textAlign: 'center' }}>
                <RefreshCw className="animate-pulse" style={{ color: '#7c3aed', margin: '0 auto 16px' }} size={36} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Esperando candidatos</h3>
                <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: 0, lineHeight: 1.5 }}>
                  El reclutador debe hacer clic en <strong>&quot;🎯 Evaluar&quot;</strong> o <strong>&quot;Iniciar Evaluación Grupal&quot;</strong> en el panel de Formativas para que los candidatos aparezcan aquí.
                </p>
              </div>
            ) : (
              /* ─── MATRIX TABLE ─── */
              <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: `${220 + activeCandidates.length * 170}px` }}>
                    <thead>
                      <tr style={{ background: 'rgba(124,58,237,0.15)' }}>
                        {/* Sticky criteria column header */}
                        <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'rgba(15,23,42,0.98)', padding: '16px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', minWidth: '220px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          Criterio de Evaluación
                        </th>
                        {activeCandidates.map(c => (
                          <th key={c.id} style={{ padding: '12px 16px', textAlign: 'center', minWidth: '160px', borderRight: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '148px' }}>{c.candidate_name}</div>
                            <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginBottom: '4px' }}>{c.candidate_cargo}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{c.city}{c.age && c.age !== '—' ? ` · ${c.age} años` : ''}</div>
                            {c.sector && c.sector !== '—' && <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>{c.sector}</div>}
                            {c.cv_url && (
                              <a href={c.cv_url} target="_blank" rel="noreferrer" style={{ fontSize: '10.5px', color: '#a78bfa', textDecoration: 'underline', marginTop: '4px', display: 'inline-block', fontWeight: 600 }}>Ver CV</a>
                            )}
                            {submittedCandidates.has(c.id) && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '2px 8px', marginTop: '4px', fontWeight: 700 }}>
                                <CheckCircle2 size={10} /> Enviado
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {Object.entries(optionsByCategory).map(([category, opts]) => (
                        <>
                          {/* Category header row */}
                          <tr key={`cat-${category}`} style={{ background: 'rgba(124,58,237,0.08)' }}>
                            <td
                              colSpan={activeCandidates.length + 1}
                              style={{ padding: '8px 20px', fontSize: '10px', fontWeight: 900, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', borderTop: '1px solid rgba(124,58,237,0.2)', borderBottom: '1px solid rgba(124,58,237,0.1)' }}
                            >
                              {category}
                            </td>
                          </tr>

                          {/* Option rows */}
                          {opts.map((opt, idx) => (
                            <tr key={opt.id} style={{ background: idx % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent' }}>
                              {/* Sticky label */}
                              <td style={{ position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? 'rgba(15,23,42,0.98)' : 'rgba(15,23,42,0.92)', padding: '10px 20px', fontSize: '12.5px', color: '#cbd5e1', borderRight: '1px solid rgba(255,255,255,0.06)', lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 500 }}>{opt.label}</span>
                                <span style={{ display: 'block', fontSize: '10px', color: '#475569', marginTop: '1px' }}>máx 10 pts</span>
                              </td>
                              {/* Input numérico por criterio, por candidato */}
                              {activeCandidates.map(c => {
                                const isSubmitted = submittedCandidates.has(c.id)
                                const val = criterionValues[c.id]?.[opt.id] ?? ''
                                const numVal = val === '' ? 0 : Number(val)
                                const isFull = numVal === opt.weight && opt.weight > 0
                                const hasVal = numVal > 0
                                return (
                                  <td key={c.id} style={{ textAlign: 'center', padding: '6px 8px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                      <input
                                        type="number"
                                        min={0}
                                        max={opt.weight}
                                        value={val}
                                        disabled={isSubmitted}
                                        onChange={e => setCriterionValue(c.id, opt.id, e.target.value, opt.weight)}
                                        placeholder="0"
                                        title={`Máximo: ${opt.weight} pts`}
                                        style={{
                                          width: '62px',
                                          background: isSubmitted
                                            ? 'rgba(255,255,255,0.03)'
                                            : hasVal
                                              ? isFull ? 'rgba(124,58,237,0.2)' : 'rgba(245,158,11,0.12)'
                                              : 'rgba(255,255,255,0.04)',
                                          border: `1.5px solid ${isSubmitted
                                            ? 'rgba(255,255,255,0.06)'
                                            : hasVal
                                              ? isFull ? '#7c3aed' : 'rgba(245,158,11,0.6)'
                                              : 'rgba(255,255,255,0.1)'}`,
                                          borderRadius: '7px',
                                          padding: '5px 6px',
                                          color: isSubmitted ? '#64748b' : hasVal ? (isFull ? '#a78bfa' : '#fbbf24') : '#94a3b8',
                                          fontSize: '14px',
                                          fontWeight: 700,
                                          textAlign: 'center',
                                          outline: 'none',
                                          cursor: isSubmitted ? 'not-allowed' : 'text',
                                          transition: 'all 0.15s'
                                        }}
                                      />
                                      {/* Barra de progreso */}
                                      {!isSubmitted && opt.weight > 0 && (
                                        <div style={{ width: '62px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${(numVal / 10) * 100}%`, background: isFull ? '#7c3aed' : '#f59e0b', borderRadius: '999px', transition: 'width 0.2s' }} />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </>
                      ))}

                      {/* Score row — puntaje calculado + input inline para modificar */}
                      <tr style={{ background: 'rgba(124,58,237,0.1)', borderTop: '2px solid rgba(124,58,237,0.3)' }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'rgba(15,23,42,0.98)', padding: '12px 20px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#a78bfa', display: 'block' }}>Puntaje</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Auto · edita si deseas</span>
                        </td>
                        {activeCandidates.map(c => {
                          const auto = scoreOf(c.id)
                          const isSubmitted = submittedCandidates.has(c.id)
                          const hasAny = auto > 0 || Object.values(criterionValues[c.id] || {}).some(v => v !== '')
                          return (
                            <td key={c.id} style={{ textAlign: 'center', padding: '10px 8px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {/* Puntaje automático */}
                                <span style={{ fontSize: '17px', fontWeight: 900, color: auto > 0 ? '#a78bfa' : '#475569', minWidth: '32px', textAlign: 'right' }}>
                                  {auto > 0 ? `+${auto}` : '—'}
                                </span>
                                {/* Input para modificar — solo visible si hay algo seleccionado y no enviado */}
                                {hasAny && !isSubmitted && (
                                  <input
                                    type="number"
                                    min={0}
                                    max={9999}
                                    value={proposedByCandidate[c.id] ?? ''}
                                    onChange={e => setProposedByCandidate(prev => ({ ...prev, [c.id]: e.target.value }))}
                                    placeholder="✏️"
                                    title="Modificar puntaje"
                                    style={{
                                      width: '60px',
                                      background: 'rgba(245,158,11,0.1)',
                                      border: '1.5px solid rgba(245,158,11,0.45)',
                                      borderRadius: '7px',
                                      padding: '5px 6px',
                                      color: '#fbbf24',
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      textAlign: 'center',
                                      outline: 'none'
                                    }}
                                  />
                                )}
                                {/* Mostrar valor propuesto enviado */}
                                {isSubmitted && proposedByCandidate[c.id] && (
                                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
                                    → {proposedByCandidate[c.id]}
                                  </span>
                                )}
                              </div>
                              <span style={{ display: 'block', fontSize: '10px', color: '#64748b', marginTop: '2px' }}>pts</span>
                            </td>
                          )
                        })}
                      </tr>

                      {/* Fila de Comentarios */}
                      <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'rgba(15,23,42,0.98)', padding: '16px 20px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', display: 'block' }}>Comentarios</span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>Opcional pero recomendado</span>
                        </td>
                        {activeCandidates.map(c => {
                          const isSubmitted = submittedCandidates.has(c.id)
                          return (
                            <td key={`comments-${c.id}`} style={{ textAlign: 'center', padding: '12px 8px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                              <textarea
                                disabled={isSubmitted}
                                value={commentsByCandidate[c.id] || ''}
                                onChange={e => setCommentsByCandidate(prev => ({ ...prev, [c.id]: e.target.value }))}
                                placeholder={isSubmitted ? "—" : "Deja un comentario sobre este candidato..."}
                                style={{
                                  width: '100%',
                                  minWidth: '140px',
                                  height: '60px',
                                  background: isSubmitted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${isSubmitted ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: '8px',
                                  padding: '8px',
                                  color: isSubmitted ? '#94a3b8' : '#f8fafc',
                                  fontSize: '11px',
                                  outline: 'none',
                                  resize: 'none',
                                  cursor: isSubmitted ? 'not-allowed' : 'text'
                                }}
                              />
                            </td>
                          )
                        })}
                      </tr>

                      {/* Submit row */}
                      <tr style={{ background: 'rgba(15,23,42,0.5)' }}>
                        <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'rgba(15,23,42,0.98)', padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          Acción
                        </td>
                        {activeCandidates.map(c => {
                          const isSubmitted = submittedCandidates.has(c.id)
                          const isSubmitting = submittingId === c.id
                          const vals = criterionValues[c.id] || {}
                          const hasAnyVal = Object.values(vals).some(v => v !== '' && Number(v) > 0)
                          const hasProposed = (proposedByCandidate[c.id] ?? '').trim() !== ''
                          const canSubmit = hasAnyVal || hasProposed
                          return (
                            <td key={c.id} style={{ textAlign: 'center', padding: '12px 8px', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
                              {isSubmitted ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={22} style={{ color: '#10b981' }} />
                                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>Enviado</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => submitEvaluation(c.id)}
                                  disabled={isSubmitting || !canSubmit}
                                  style={{
                                    background: canSubmit
                                      ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                                      : 'rgba(255,255,255,0.05)',
                                    color: canSubmit ? 'white' : '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {isSubmitting ? '...' : 'Enviar'}
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>💡 Ingresa un valor por criterio (0 hasta el máximo configurado). El input se colorea en <strong style={{ color: '#f59e0b' }}>ámbar</strong> al asignar parcial y <strong style={{ color: '#a78bfa' }}>morado</strong> al completar el máximo. Presiona <strong style={{ color: '#a78bfa' }}>Enviar</strong> por candidato.</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Progreso: <strong style={{ color: '#a78bfa' }}>{submittedCandidates.size} / {activeCandidates.length}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
