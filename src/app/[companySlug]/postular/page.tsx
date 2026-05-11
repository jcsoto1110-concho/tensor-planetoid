'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { UploadCloud, CheckCircle2, AlertCircle, Briefcase, MapPin, User, Mail, Clock, ChevronDown } from 'lucide-react'
import { useParams } from 'next/navigation'

const CONSENT_TEXT = (companyName: string) => `CONSENTIMIENTO INFORMADO PARA EL TRATAMIENTO DE DATOS PERSONALES DE POSTULANTES

Al registrar mis datos y cargar mi hoja de vida en la presente plataforma, declaro que he sido informado/a de forma clara, previa, expresa y suficiente sobre el tratamiento de mis datos personales por parte de ${companyName}, en calidad de Responsable del Tratamiento, conforme a la Ley Orgánica de Protección de Datos Personales y su Reglamento.

Autorizo de manera libre, específica, informada e inequívoca a ${companyName} para recopilar, registrar, almacenar, consultar, analizar, clasificar, conservar y tratar mis datos personales ingresados en la plataforma, así como aquellos contenidos en mi hoja de vida, con la finalidad de gestionar mi postulación, evaluar mi perfil profesional, contactarme en relación con procesos de selección actuales o futuros, verificar la información proporcionada y determinar mi posible adecuación a una vacante.

Declaro conocer que, como parte del proceso de selección, ${companyName} podrá utilizar herramientas tecnológicas con funcionalidades de inteligencia artificial, cuyo objetivo será generar un resumen breve de mi perfil profesional, experiencia, formación, habilidades y posible compatibilidad con la vacante a la que aplico, con el fin de facilitar la revisión inicial por parte del área de Desarrollo Humano y Organizacional —DHO—.

El uso de inteligencia artificial tendrá carácter auxiliar y de apoyo, por lo que no sustituirá necesariamente la revisión humana ni implicará por sí solo una decisión definitiva de contratación, descarte o vinculación laboral. La decisión final dentro del proceso de selección corresponderá al área competente de ${companyName}.

Los datos personales tratados podrán incluir: nombres y apellidos, número de identificación, datos de contacto, domicilio o ciudad de residencia, formación académica, experiencia laboral, referencias, competencias, aspiración salarial, disponibilidad, información contenida en la hoja de vida y demás datos que el postulante proporcione voluntariamente en la plataforma.

En caso de que mi hoja de vida contenga datos sensibles o categorías especiales de datos personales, declaro que los proporciono voluntariamente y autorizo su tratamiento únicamente en la medida en que sean estrictamente necesarios para la gestión de mi postulación. No obstante, se recomienda no incluir información sensible que no sea necesaria para el proceso de selección.

Mis datos serán conservados durante el tiempo necesario para gestionar la postulación y, posteriormente, podrán mantenerse en la base de talento de ${companyName} para futuras vacantes, por un plazo máximo de 12 meses, salvo que solicite previamente su eliminación o revoque mi consentimiento.

Declaro conocer que puedo ejercer en cualquier momento mis derechos de acceso, rectificación, actualización, eliminación, oposición, anulación, limitación del tratamiento, portabilidad y derecho a no ser objeto de una decisión basada únicamente en valoraciones automatizadas, escribiendo al correo: privacidad@superdeporte.com.ec. También podré revocar mi consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento realizado con anterioridad a dicha revocatoria.

Asimismo, declaro conocer que la negativa a proporcionar mis datos personales o a aceptar este consentimiento impedirá continuar con el registro de mi postulación en la plataforma, al ser información necesaria para gestionar el proceso de selección.`;

export default function ApplyPage() {
  const params = useParams()
  const companySlug = params.companySlug as string
  
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [jobPositions, setJobPositions] = useState<any[]>([])
  const [companyInfo, setCompanyInfo] = useState({ name: 'SUPERDEPORTE S.A.', slug: 'superdeporte' })

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
    consentimiento: false,
    noAceptoConsentimiento: false
  })

  useEffect(() => {
    if (companySlug) {
      fetchCompanyInfo()
      fetchJobPositions()
    }
  }, [companySlug])

  const fetchCompanyInfo = async () => {
    // Intentar obtener el nombre de la empresa desde los perfiles
    const { data } = await supabase
      .from('admin_profiles')
      .select('company_name')
      .eq('company_slug', companySlug)
      .limit(1)
      .maybeSingle()
    
    if (data) {
      setCompanyInfo({ name: data.company_name, slug: companySlug })
    } else {
      // Fallback simple si no hay perfil creado aún para ese slug
      const name = companySlug.charAt(0).toUpperCase() + companySlug.slice(1) + ' S.A.'
      setCompanyInfo({ name, slug: companySlug })
    }
  }

  const fetchJobPositions = async () => {
    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('company_slug', companySlug)
      .order('cargo', { ascending: true })
    if (data) setJobPositions(data)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    if (name === 'consentimiento' && val) {
      setFormData(prev => ({ ...prev, consentimiento: true, noAceptoConsentimiento: false }))
    } else if (name === 'noAceptoConsentimiento' && val) {
      setFormData(prev => ({ ...prev, consentimiento: false, noAceptoConsentimiento: true }))
    } else {
      setFormData(prev => ({ ...prev, [name]: val }))
    }
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
    if (!formData.consentimiento) { setError('Debes aceptar el tratamiento de datos personales para postularte.'); return }
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
        ai_summary: `CED: ${formData.cedula} | TEL: ${formData.celular} | LOGRO: ${formData.logro} | HERRAMIENTAS: ${formData.herramientas} | CONSENTIMIENTO LOPDP: ACEPTADO`,
        company_slug: companySlug
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
            Gracias {formData.nombre}, hemos recibido tu hoja de vida. El equipo de Talento Humano de <strong>{companyInfo.name}</strong> la revisará y se pondrá en contacto contigo muy pronto.
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
          <p style={{ color: '#93c5fd', fontSize: '16px' }}>{companyInfo.name} | Talento Humano</p>
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
                  <input type="text" name="nombre" required placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
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
                  <input type="email" name="email" required placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }} />
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

            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '20px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                {CONSENT_TEXT(companyInfo.name).split('\n\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: para.includes(':') ? '8px' : '12px', fontWeight: para.startsWith('CONSENTIMIENTO') ? '800' : 'normal' }}>
                    {para}
                  </p>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: formData.consentimiento ? '#f0fdf4' : 'transparent', border: `1px solid ${formData.consentimiento ? '#22c55e' : 'transparent'}`, transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" 
                    name="consentimiento" 
                    checked={formData.consentimiento} 
                    onChange={handleChange} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                    He leído y acepto el tratamiento de mis datos personales para la gestión de mi postulación, incluyendo el uso auxiliar de herramientas de inteligencia artificial.
                  </span>
                </label>

                <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer', padding: '12px', borderRadius: '8px', background: formData.noAceptoConsentimiento ? '#fef2f2' : 'transparent', border: `1px solid ${formData.noAceptoConsentimiento ? '#ef4444' : 'transparent'}`, transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" 
                    name="noAceptoConsentimiento" 
                    checked={formData.noAceptoConsentimiento} 
                    onChange={handleChange} 
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }} 
                  />
                  <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>
                    He leído y no acepto el tratamiento de mis datos personales para la gestión de mi postulación.
                  </span>
                </label>
              </div>
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
          Al enviar este formulario, confirmas que la información proporcionada es verídica.
        </p>

      </div>
    </div>
  )
}
