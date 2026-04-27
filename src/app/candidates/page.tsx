'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, FileText, User, Download } from 'lucide-react'

export default function CandidatesAdmin() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [portalUrl, setPortalUrl] = useState('https://superdeporte.com/onboarding')

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(portalUrl)}`

  useEffect(() => {
    fetchCandidates()
  }, [])

  const fetchCandidates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('onboarding_candidates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setCandidates(data)
    }
    setLoading(false)
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
        
        .pdf-link { color: #2563eb; font-size: 14px; display: flex; align-items: center; gap: 6px; text-decoration: none; }
        .pdf-link:hover { color: #1d4ed8; text-decoration: underline; }
      `}</style>

      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">Candidatos Registrados</h1>
            <p className="admin-subtitle">Portal de Onboarding - Zero Paper</p>
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
                    <td>
                      {c.status === 'PENDING' && (
                        <button onClick={() => handleSyncToOracle(c.id)} className="action-btn">
                          <CheckCircle2 size={16} /> Aprobar y Enviar a Oracle
                        </button>
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
      </div>
    </>
  )
}
