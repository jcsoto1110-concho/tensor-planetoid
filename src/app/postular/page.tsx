'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UploadCloud, CheckCircle2, AlertCircle, Briefcase, MapPin, User, Mail, Clock, ChevronDown } from 'lucide-react'

export default function ApplyPage() {
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobPositions, setJobPositions] = useState<any[]>([])

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    cedula: '',
    celular: '',
    cargo: '',
    ciudad: '',
    experiencia: '',
    logro: '',
    herramientas: '',
    consentimiento: false
  })

  useEffect(() => {
    fetchJobPositions()
  }, [])

  const fetchJobPositions = async () => {
    const { data } = await supabase.from('job_positions').select('*').order('cargo', { ascending: true })
    if (data) setJobPositions(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  const handleJobSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const job = jobPositions.find(j => j.id === selectedId);
    if (job) {
      setFormData(prev => ({ ...prev, cargo: job.cargo, ciudad: job.ciudad }));
    } else {
      setFormData(prev => ({ ...prev, cargo: '', ciudad: '' }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Por favor, adjunta tu hoja de vida en PDF.'); return }
    if (!formData.consentimiento) { setError('Debes aceptar el tratamiento de datos personales.'); return }
    if (formData.cedula.length < 10) { setError('La cédula debe tener al menos 10 dígitos.'); return }
    
    setLoading(true)
    setError('')

    try {
      // 1. Verificar si ya existe la cédula
      const { data: existing, error: checkError } = await supabase
        .from('email_resumes')
        .select('id')
        .eq('cedula', formData.cedula)
        .limit(1)

      if (checkError) throw checkError
      if (existing && existing.length > 0) {
        setError('Ya te has postulado anteriormente con este número de cédula. ¡Gracias por tu interés!')
        setLoading(false)
        return
      }

      // 2. Subir CV a Storage (Usamos el mismo formato que scan-emails para compatibilidad con IA)
      const emailUid = `WEB${Date.now()}`
      const fileExt = file.name.split('.').pop()
      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const storageFileName = `resume_${emailUid.substring(0, 8)}_${sanitizedOriginalName}`
      
      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(storageFileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('candidate-documents')
        .getPublicUrl(storageFileName)

      // 2. Insertar en email_resumes
      const { error: dbError } = await supabase.from('email_resumes').insert([{
        email_uid: emailUid,
        sender_email: formData.email,
        sender_name: formData.nombre,
        cedula: formData.cedula,
        subject: `Postulación Web: ${formData.cargo}`,
        received_date: new Date().toISOString(),
        file_name: file.name,
        pdf_url: publicUrl,
        sender_phone: formData.celular,
        classification_status: 'PENDING',
        position: formData.cargo,
        city: formData.ciudad,
        experience_years: formData.experiencia,
        skills: formData.herramientas,
        main_achievement: formData.logro,
        key_tools: formData.herramientas,
        ai_summary: `CED: ${formData.cedula} | TEL: ${formData.celular} | LOGRO: ${formData.logro} | HERRAMIENTAS: ${formData.herramientas} | CONSENTIMIENTO LOPDP: ACEPTADO`
      }])

      if (dbError) throw dbError

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al enviar la postulación')
    } finally {
      setLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <div style={{ background: '#f0fdf4', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={48} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px' }}>¡Postulación Enviada!</h2>
          <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.6', margin: '0 0 32px' }}>
            Gracias {formData.nombre}, hemos recibido tu hoja de vida. Nuestro equipo de Talento Humano la revisará y se pondrá en contacto contigo muy pronto.
          </p>
          <button onClick={() => window.location.reload()} style={{ background: '#002f6c', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
            Enviar otra postulación
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #002f6c 0%, #001f4a 100%)', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Únete a Nuestro Equipo</h1>
          <p style={{ color: '#93c5fd', fontSize: '16px' }}>SUPERDEPORTE S.A. | Talento Humano</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" name="nombre" required placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={handleChange} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Número de Cédula</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" name="cedula" required placeholder="10 dígitos" maxLength={10} value={formData.cedula} onChange={handleChange} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="email" name="email" required placeholder="tu@email.com" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Celular / WhatsApp</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" name="celular" required placeholder="Ej: 0987654321" value={formData.celular} onChange={handleChange} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Seleccionar Cargo</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <select 
                  required 
                  onChange={handleJobSelect} 
                  style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', appearance: 'none', background: 'white' }}
                >
                  <option value="">Seleccionar...</option>
                  {jobPositions.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.cargo} {job.ciudad ? `· ${job.ciudad}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Hidden fields but updated by state */}
            <input type="hidden" name="cargo" value={formData.cargo} />
            <input type="hidden" name="ciudad" value={formData.ciudad} />

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Habilidad principal o logro clave</label>
              <textarea 
                name="logro" 
                required 
                placeholder="Ej: Especialista en campañas Google Ads con ROAS del 300%" 
                value={formData.logro} 
                onChange={(e: any) => handleChange(e)} 
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Herramientas o idiomas clave</label>
              <input 
                type="text" 
                name="herramientas" 
                required 
                placeholder="Ej: Nivel C2 de inglés, manejo de PowerBI" 
                value={formData.herramientas} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Años de experiencia</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="number" name="experiencia" required placeholder="Ej: 3" value={formData.experiencia} onChange={handleChange} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Adjuntar Hoja de Vida (PDF)</label>
              <div 
                onClick={() => document.getElementById('cv-upload')?.click()}
                style={{ 
                  border: '2px dashed #e2e8f0', 
                  borderRadius: '16px', 
                  padding: '32px', 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  background: file ? '#f0fdf4' : '#f8fafc',
                  borderColor: file ? '#22c55e' : '#e2e8f0',
                  transition: 'all 0.2s'
                }}
              >
                <input type="file" id="cv-upload" accept=".pdf" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <UploadCloud size={40} color={file ? '#22c55e' : '#94a3b8'} style={{ marginBottom: '12px' }} />
                {file ? (
                  <p style={{ margin: 0, fontWeight: '700', color: '#166534' }}>{file.name}</p>
                ) : (
                  <>
                    <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#475569' }}>Haz clic para subir tu PDF</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Tamaño máximo sugerido: 5MB</p>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <input 
                type="checkbox" 
                name="consentimiento" 
                required 
                checked={formData.consentimiento} 
                onChange={handleChange} 
                style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }} 
              />
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', margin: 0 }}>
                Acepto que mis datos personales sean tratados por SUPERDEPORTE S.A. para fines de reclutamiento y selección de personal, conforme a la Ley Orgánica de Protección de Datos Personales.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !formData.consentimiento}
              style={{ 
                background: (loading || !formData.consentimiento) ? '#94a3b8' : '#002f6c', 
                color: 'white', 
                border: 'none', 
                padding: '16px', 
                borderRadius: '12px', 
                fontSize: '16px', 
                fontWeight: '800', 
                cursor: (loading || !formData.consentimiento) ? 'not-allowed' : 'pointer', 
                opacity: 1,
                marginTop: '12px',
                boxShadow: (loading || !formData.consentimiento) ? 'none' : '0 10px 15px -3px rgba(0, 47, 108, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Enviando...' : 'FINALIZAR POSTULACIÓN'}
            </button>

          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', color: '#93c5fd', fontSize: '13px' }}>
          Al enviar este formulario, aceptas nuestra política de tratamiento de datos personales.
        </p>

      </div>
    </div>
  )
}
