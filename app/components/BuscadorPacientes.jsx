'use client'
import { useState } from 'react'

export default function BuscadorPacientes({ onCargar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = async () => {
    if (!busqueda.trim()) return
    setCargando(true)
    try {
      const res = await fetch(`/api/pacientes?q=${encodeURIComponent(busqueda)}`)
      const json = await res.json()
      setResultados(json.pacientes || [])
      setBuscado(true)
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const agrupar = (rows) => {
    const mapa = {}
    rows.forEach(r => {
      if (!mapa[r.id]) mapa[r.id] = { id: r.id, nombre: r.nombre, documento: r.documento, fecha_nacimiento: r.fecha_nacimiento, curvas: [] }
      if (r.curva_id) mapa[r.id].curvas.push({ id: r.curva_id, ojo: r.ojo, notas: r.notas, fecha: r.fecha, mediciones: r.mediciones?.filter(m => m.defocus !== null) || [] })
    })
    return Object.values(mapa)
  }

  const pacientes = agrupar(resultados)

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', width:'600px', maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ margin:0, fontSize:'1.1rem', color:'#1e293b' }}>🔍 Buscar paciente</h2>
          <button onClick={onCerrar} style={{ background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer', color:'#64748b' }}>✕</button>
        </div>

        <div style={{ display:'flex', gap:'8px', marginBottom:'1rem' }}>
          <input
            style={{ flex:1, padding:'8px 12px', border:'1px solid #cbd5e1', borderRadius:'8px', fontSize:'0.9rem' }}
            placeholder="Nombre o documento..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            autoFocus
          />
          <button onClick={buscar} disabled={cargando}
            style={{ padding:'8px 20px', background:'#1e40af', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:500 }}>
            {cargando ? '...' : 'Buscar'}
          </button>
        </div>

        <div style={{ overflowY:'auto', flex:1 }}>
          {buscado && pacientes.length === 0 && (
            <p style={{ textAlign:'center', color:'#94a3b8', padding:'2rem' }}>No se encontraron pacientes</p>
          )}
          {pacientes.map(p => (
            <div key={p.id} style={{ border:'1px solid #e2e8f0', borderRadius:'10px', marginBottom:'10px', overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <strong style={{ fontSize:'0.95rem', color:'#1e293b' }}>{p.nombre}</strong>
                    <span style={{ marginLeft:'10px', fontSize:'0.8rem', color:'#64748b' }}>CC: {p.documento || '—'}</span>
                    {p.fecha_nacimiento && <span style={{ marginLeft:'8px', fontSize:'0.78rem', color:'#94a3b8' }}>Nac: {new Date(p.fecha_nacimiento).toLocaleDateString('es-CO')}</span>}
                  </div>
                  <span style={{ fontSize:'0.75rem', color:'#64748b' }}>{p.curvas.length} curva(s)</span>
                </div>
              </div>
              {p.curvas.map(c => {
                const notas = c.notas || ''
                const iolMatch = notas.match(/IOL:([^O]+)/)
                const refODMatch = notas.match(/OD:([^\s]+)/)
                const refOIMatch = notas.match(/OI:(.+)/)
                return (
                  <div key={c.id} style={{ padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#1e40af' }}>{c.ojo}</span>
                      <span style={{ marginLeft:'8px', fontSize:'0.78rem', color:'#64748b' }}>{iolMatch?.[1]?.trim() || '—'}</span>
                      <span style={{ marginLeft:'8px', fontSize:'0.75rem', color:'#94a3b8' }}>{new Date(c.fecha).toLocaleDateString('es-CO')}</span>
                      <span style={{ marginLeft:'8px', fontSize:'0.75rem', color:'#94a3b8' }}>{c.mediciones.length} puntos</span>
                    </div>
                    <button
                      onClick={() => onCargar({ paciente: p, curva: c, refOD: refODMatch?.[1] || '', refOI: refOIMatch?.[1] || '' })}
                      style={{ padding:'4px 14px', background:'#1e40af', color:'white', border:'none', borderRadius:'6px', fontSize:'0.8rem', cursor:'pointer' }}>
                      Cargar
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
