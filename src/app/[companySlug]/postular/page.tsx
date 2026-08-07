'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { UploadCloud, CheckCircle2, AlertCircle, Briefcase, MapPin, User, Mail, Clock, ChevronDown } from 'lucide-react'
import { useParams } from 'next/navigation'

// Genera el email de privacidad según la empresa
function getPrivacyEmail(slug: string): string {
  const map: Record<string, string> = {
    superdeporte: 'privacidad@superdeporte.com.ec',
    medeport:     'privacidad@medeport.com.ec',
    equinox:      'privacidad@equinox.com.ec',
  }
  return map[slug?.toLowerCase()] || `privacidad@${slug}.com.ec`
}

const CONSENT_TEXT = (companyName: string, privacyEmail: string) => `CONSENTIMIENTO INFORMADO PARA EL TRATAMIENTO DE DATOS PERSONALES DE POSTULANTES

Al registrar mis datos y cargar mi hoja de vida en la presente plataforma, declaro que he sido informado/a de forma clara, previa, expresa y suficiente sobre el tratamiento de mis datos personales por parte de ${companyName}, en calidad de Responsable del Tratamiento, conforme a la Ley Orgánica de Protección de Datos Personales y su Reglamento.

Autorizo de manera libre, específica, informada e inequívoca a ${companyName} para recopilar, registrar, almacenar, consultar, analizar, clasificar, conservar y tratar mis datos personales ingresados en la plataforma, así como aquellos contenidos en mi hoja de vida, con la finalidad de gestionar mi postulación, evaluar mi perfil profesional, contactarme en relación con procesos de selección actuales o futuros, verificar la información proporcionada y determinar mi posible adecuación a una vacante.

Declaro conocer que, como parte del proceso de selección, ${companyName} podrá utilizar herramientas tecnológicas con funcionalidades de inteligencia artificial, cuyo objetivo será generar un resumen breve de mi perfil profesional, experiencia, formación, habilidades y posible compatibilidad con la vacante a la que aplico, con el fin de facilitar la revisión inicial por parte del área de Desarrollo Humano y Organizacional —DHO—.

El uso de inteligencia artificial tendrá carácter auxiliar y de apoyo, por lo que no sustituirá necesariamente la revisión humana ni implicará por sí solo una decisión definitiva de contratación, descarte o vinculación laboral. La decisión final dentro del proceso de selección corresponderá al área competente de ${companyName}.

Los datos personales tratados podrán incluir: nombres y apellidos, número de identificación, datos de contacto, domicilio o ciudad de residencia, formación académica, experiencia laboral, referencias, competencias, aspiración salarial, disponibilidad, información contenida en la hoja de vida y demás datos que el postulante proporcione voluntariamente en la plataforma.

En caso de que mi hoja de vida contenga datos sensibles o categorías especiales de datos personales, declaro que los proporciono voluntariamente y autorizo su tratamiento únicamente en la medida en que sean estrictamente necesarios para la gestión de mi postulación. No obstante, se recomienda no incluir información sensible que no sea necesaria para el proceso de selección.

Mis datos serán conservados durante el tiempo necesario para gestionar la postulación y, posteriormente, podrán mantenerse en la base de talento de ${companyName} para futuras vacantes, por un plazo máximo de 12 meses, salvo que solicite previamente su eliminación o revoque mi consentimiento.

Declaro conocer que puedo ejercer en cualquier momento mis derechos de acceso, rectificación, actualización, eliminación, oposición, anulación, limitación del tratamiento, portabilidad y derecho a no ser objeto de una decisión basada únicamente en valoraciones automatizadas, escribiendo al correo: ${privacyEmail}. También podré revocar mi consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento realizado con anterioridad a dicha revocatoria.

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
  const [postulationEnabled, setPostulationEnabled] = useState(true)
  const [checkingSettings, setCheckingSettings] = useState(true)

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    cedula: '',
    celular: '',
    cargo: '',
    ciudad: '',
    experiencia: '',
    edad: '',
    logro: '',
    herramientas: '',
    consentimiento: false,
    noAceptoConsentimiento: false,
    birth_date: '',
    civil_status: '',
    home_address: '',
    sector: '',
    education_level: '',
    education_institution: '',
    education_title: '',
    heard_from: '',
    likes_sports: '',
    sports_practiced: '',
    work_culture_motivation: '',
    genero: ''
  })

  useEffect(() => {
    if (companySlug) {
      fetchCompanyInfo()
      fetchJobPositions()
    }
  }, [companySlug])

  // Actualizar el titulo de la pestana del navegador dinamicamente
  useEffect(() => {
    if (companyInfo.name && companyInfo.name !== 'SUPERDEPORTE S.A.') {
      document.title = `Unete a ${companyInfo.name} | Talento Humano`
    }
  }, [companyInfo.name])

  const fetchCompanyInfo = async () => {
    setCheckingSettings(true)
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

    try {
      const { data: settings, error: settingsError } = await supabase
        .from('company_settings')
        .select('postulation_enabled')
        .eq('company_slug', companySlug)
        .maybeSingle()
      if (settingsError) throw settingsError
      if (settings) {
        setPostulationEnabled(settings.postulation_enabled)
      } else {
        setPostulationEnabled(true)
      }
    } catch (e) {
      console.error('Error fetching company postulation settings:', e)
      setPostulationEnabled(true) // fallback
    } finally {
      setCheckingSettings(false)
    }
  }

  const fetchJobPositions = async () => {
    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('company_slug', companySlug)
      .order('cargo', { ascending: true })
    if (data) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    if (name === 'consentimiento' && val) {
      setFormData(prev => ({ ...prev, consentimiento: true, noAceptoConsentimiento: false }))
    } else if (name === 'noAceptoConsentimiento' && val) {
      setFormData(prev => ({ ...prev, consentimiento: false, noAceptoConsentimiento: true }))
    } else if (name === 'birth_date') {
      const birthDate = new Date(value);
      let calculatedAge = '';
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        calculatedAge = age >= 0 ? age.toString() : '';
      }
      setFormData(prev => ({ 
        ...prev, 
        birth_date: value,
        edad: calculatedAge
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: val }))
    }
  }

  const handleJobSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const job = jobPositions.find(j => j.id === selectedId);
    if (job) {
      setFormData(prev => ({ ...prev, cargo: job.cargo, city: job.ciudad || prev.ciudad, ciudad: job.ciudad || prev.ciudad }));
    } else {
      setFormData(prev => ({ ...prev, cargo: '', city: '', ciudad: '' }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Por favor, adjunta tu hoja de vida en PDF.'); return }
    if (!formData.consentimiento) { setError('Debes aceptar el tratamiento de datos personales para postularte.'); return }
    if (formData.cedula.length < 10) { setError('La cédula debe tener al menos 10 dígitos.'); return }
    if (parseInt(formData.experiencia) > 15) { setError('Los años de experiencia no pueden superar los 15 años.'); return }
    if (parseInt(formData.edad) < 18) { setError('Debes tener al menos 18 años para postularte.'); return }
    if (!formData.ciudad) { setError('Por favor, selecciona tu ciudad.'); return }
    if (!formData.genero) { setError('Por favor, selecciona tu género.'); return }
    
    setLoading(true)
    setError('')

    try {
      const bodyData = new FormData()
      bodyData.append('file', file)
      bodyData.append('companySlug', companySlug)
      bodyData.append('cedula', formData.cedula)
      bodyData.append('nombre', formData.nombre)
      bodyData.append('email', formData.email.toLowerCase())
      bodyData.append('celular', formData.celular)
      bodyData.append('cargo', formData.cargo)
      bodyData.append('ciudad', formData.ciudad)
      bodyData.append('experiencia', formData.experiencia)
      bodyData.append('edad', formData.edad)
      bodyData.append('herramientas', formData.herramientas)
      bodyData.append('logro', formData.logro)
      bodyData.append('birth_date', formData.birth_date || '')
      bodyData.append('civil_status', formData.civil_status || '')
      bodyData.append('home_address', formData.home_address || '')
      bodyData.append('sector', formData.sector || '')
      bodyData.append('education_level', formData.education_level || '')
      bodyData.append('education_institution', formData.education_institution || '')
      bodyData.append('education_title', formData.education_title || '')
      bodyData.append('heard_from', formData.heard_from || '')
      bodyData.append('genero', formData.genero || '')
      bodyData.append('likes_sports', formData.likes_sports || '')
      bodyData.append('sports_practiced', formData.sports_practiced || '')
      bodyData.append('work_culture_motivation', formData.work_culture_motivation || '')

      const res = await fetch('/api/submit-postulacion', {
        method: 'POST',
        body: bodyData,
      })

      const resData = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(resData.error || 'Error al enviar la postulación')
      }

      setIsSuccess(true)
    } catch (err: any) {
      console.error('Error al postular:', err)
      setError(err.message || 'Error al enviar la postulación')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSettings) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #002f6c 0%, #001f4a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <Clock size={48} color="white" className="animate-spin" style={{ margin: '0 auto 16px', opacity: 0.8 }} />
          <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Cargando portal...</p>
        </div>
      </div>
    )
  }

  if (!postulationEnabled) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #002f6c 0%, #001f4a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <div style={{ background: '#eff6ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock size={44} color="#2563eb" />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px', lineHeight: '1.2' }}>Estamos trabajando en el servicio</h2>
          <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }}>
            En este momento, la recepción de nuevas solicitudes de postulación para <strong>{companyInfo.name}</strong> no está disponible.
          </p>
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', fontSize: '13px', color: '#64748b', border: '1px solid #e2e8f0', margin: '0 0 12px' }}>
            Pronto habilitaremos el portal para recibir más candidatos. ¡Muchas gracias por tu interés en formar parte de nuestro equipo!
          </div>
        </div>
      </div>
    )
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

          <div style={{ display: 'grid', gap: '32px' }}>
            
            {/* Sección 1: Información Personal */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', borderLeft: '4px solid #002f6c', paddingLeft: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#002f6c" /> Información Personal
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Nombre Completo *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" name="nombre" required placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Número de Cédula *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" name="cedula" required placeholder="10 dígitos" maxLength={10} value={formData.cedula} onChange={handleChange} style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Correo Electrónico *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="email" name="email" required placeholder="tu@email.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})} style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Celular / WhatsApp *</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" name="celular" required placeholder="Ej: 0987654321" value={formData.celular} onChange={handleChange} style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Fecha de Nacimiento *</label>
                    <div style={{ position: 'relative' }}>
                      <input type="date" name="birth_date" required value={formData.birth_date} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: 'white' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Edad</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="number" name="edad" readOnly placeholder="Auto" value={formData.edad} style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Estado Civil *</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        name="civil_status"
                        required 
                        value={formData.civil_status}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Soltero/a">Soltero/a</option>
                        <option value="Casado/a">Casado/a</option>
                        <option value="Unión Libre legalizada">Unión Libre legalizada</option>
                        <option value="Divorciado/a">Divorciado/a</option>
                        <option value="Viudo/a">Viudo/a</option>
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Género *</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        name="genero"
                        required 
                        value={formData.genero}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 2: Dirección y Residencia */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', borderLeft: '4px solid #002f6c', paddingLeft: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="#002f6c" /> Dirección y Residencia
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Ciudad de Residencia *</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        name="ciudad"
                        required 
                        value={formData.ciudad}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({ ...prev, ciudad: val, sector: '' }));
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                      >
                        <option value="">Seleccionar...</option>
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
                      <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Sector *</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        name="sector"
                        required 
                        value={formData.sector}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Norte">Norte</option>
                        <option value="Centro">Centro</option>
                        <option value="Sur">Sur</option>
                        {formData.ciudad === 'Quito' && (
                          <>
                            <option value="Cumbayá">Cumbayá</option>
                            <option value="Valle de los Chillos">Valle de los Chillos</option>
                          </>
                        )}
                        {formData.ciudad === 'Guayaquil' && (
                          <>
                            <option value="Samborondón">Samborondón</option>
                            <option value="Vía a la Costa">Vía a la Costa</option>
                          </>
                        )}
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Dirección Domiciliaria Completa *</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" name="home_address" required placeholder="Detallar Calle principal, numeración y calle transversal" value={formData.home_address} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Perfil y Experiencia */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', borderLeft: '4px solid #002f6c', paddingLeft: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#002f6c" /> Perfil y Experiencia
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Seleccionar Cargo al que Postula *</label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                    <select 
                      required 
                      onChange={handleJobSelect} 
                      style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                    >
                      <option value="">Seleccionar...</option>
                      {jobPositions.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.cargo} {job.ciudad ? '· ' + job.ciudad : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Años de Experiencia *</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="number" name="experiencia" required min="0" max="15" placeholder="Ej: 3" value={formData.experiencia} onChange={handleChange} style={{ width: '100%', padding: '10px 12px 10px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Herramientas / Idiomas clave *</label>
                    <input 
                      type="text" 
                      name="herramientas" 
                      required 
                      placeholder="Ej: Excel intermedio, Inglés B2" 
                      value={formData.herramientas} 
                      onChange={handleChange} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Habilidad principal o logro clave *</label>
                  <textarea 
                    name="logro" 
                    required 
                    placeholder="Ej: Incremento de ventas en un 15% o manejo de presupuestos de +10k" 
                    value={formData.logro} 
                    onChange={(e) => handleChange(e)} 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} 
                  />
                </div>
              </div>
            </div>

            {/* Educación y Estudios */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', borderLeft: '4px solid #002f6c', paddingLeft: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎓 Educación y Estudios
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Nivel de Estudios *</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      name="education_level"
                      required 
                      value={formData.education_level}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Bachiller">Bachiller</option>
                      <option value="Instrucción técnica completa">Instrucción técnica completa</option>
                      <option value="Instrucción técnica incompleta">Instrucción técnica incompleta</option>
                      <option value="Universidad Completa">Universidad Completa</option>
                      <option value="Universidad Incompleta">Universidad Incompleta</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Institución / Universidad *</label>
                    <input type="text" name="education_institution" required placeholder="Nombre de la institución" value={formData.education_institution} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>Título Obtenido</label>
                    <input type="text" name="education_title" placeholder="Ej: Bachiller, Licenciado, Ingeniero" value={formData.education_title} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', borderLeft: '4px solid #002f6c', paddingLeft: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Información Adicional
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>¿Te gusta el deporte? *</label>
                    <div style={{ position: 'relative' }}>
                      <select 
                        name="likes_sports"
                        required 
                        value={formData.likes_sports}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            likes_sports: val,
                            sports_practiced: val === 'No' ? 'Ninguno' : prev.sports_practiced === 'Ninguno' ? '' : prev.sports_practiced
                          }));
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Si">Sí</option>
                        <option value="No">No</option>
                      </select>
                      <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>¿Qué deporte practicas? {formData.likes_sports === 'Si' ? '*' : ''}</label>
                    <input 
                      type="text" 
                      name="sports_practiced" 
                      required={formData.likes_sports === 'Si'} 
                      disabled={formData.likes_sports === 'No'} 
                      placeholder={formData.likes_sports === 'No' ? 'No aplica' : 'Ej: Fútbol, natación, correr'} 
                      value={formData.sports_practiced} 
                      onChange={handleChange} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: formData.likes_sports === 'No' ? '#f1f5f9' : 'white' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>¿En qué medio conociste sobre esta postulación? *</label>
                  <div style={{ position: 'relative' }}>
                    <select 
                      name="heard_from"
                      required 
                      value={formData.heard_from}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', appearance: 'none', background: 'white' }}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Telegram">Telegram</option>
                      <option value="Referidos">Referidos</option>
                      <option value="Otros">Otros</option>
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '6px', marginLeft: '4px' }}>¿Qué tipo de cultura laboral te motiva y te hace sentir más productivo? *</label>
                  <textarea 
                    name="work_culture_motivation" 
                    required 
                    placeholder="Cuéntanos qué ambiente laboral prefieres para dar lo mejor de ti" 
                    value={formData.work_culture_motivation} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} 
                  />
                </div>
              </div>
            </div>

            {/* Documentación */}
            <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.05em', borderLeft: '4px solid #002f6c', paddingLeft: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={18} color="#002f6c" /> Documentación
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', marginLeft: '4px' }}>Adjuntar Hoja de Vida (PDF) *</label>
                  <div 
                    onClick={() => document.getElementById('cv-upload')?.click()}
                    style={{ 
                      border: '2px dashed #cbd5e1', 
                      borderRadius: '12px', 
                      padding: '24px', 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      background: file ? '#f0fdf4' : 'white',
                      borderColor: file ? '#22c55e' : '#cbd5e1',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    <input type="file" id="cv-upload" accept=".pdf" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <UploadCloud size={32} color={file ? '#22c55e' : '#94a3b8'} style={{ marginBottom: '8px' }} />
                    {file ? (
                      <p style={{ margin: 0, fontWeight: '700', color: '#166534', fontSize: '14px' }}>{file.name}</p>
                    ) : (
                      <>
                        <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#475569', fontSize: '14px' }}>Haz clic para seleccionar tu PDF</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Tamaño máximo sugerido: 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
<div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '13px', color: '#475569', lineHeight: '1.6', marginBottom: '20px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                {CONSENT_TEXT(companyInfo.name, getPrivacyEmail(companySlug)).split('\n\n').map((para, i) => (
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
