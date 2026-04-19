'use client'
import { useState, useRef } from 'react'

export default function BuscadorPacientes({ onCargar, onCerrar }) {
  const [busqueda, setBusqueda] = useState('')
  const [tipoBusqueda, setTipoBusqueda] = useState('apellido')
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [expandido, setExpandido] = useState(null)
  const inputRef = useRef(null)

  const buscar = async () => {
    if (!busqueda.trim()) return
    setCargando(true)
    try {
      const res = await fetch(`/api/pacientes?q=${encodeURIComponent(busqueda)}&tipo=${tipoBusqueda}`)
      const json = await res.json()
      if (json.error) { alert('Error: ' + json.error); setCargando(false); return }
      setResultados(json.pacientes || [])
      setBuscado(true)
      setExpandido(null)
    } catch(e) { alert('Error de conexión') }
    setCargando(false)
  }

  const agrupar = (rows) => {
    const mapa = {}
    rows.forEach(r => {
      if (!mapa[r.id]) mapa[r.id] = {
        id: r.id, nombre: r.nombre, documento: r.documento,
        fecha_nacimiento: r.fecha_nacimiento, curvas: []
      }
      if (r.curva_id) {
        let info = {}
        try { info = JSON.parse(r.notas || '{}') } catch(e) { info = {} }
        mapa[r.id].curvas.push({
          id: r.curva_id, ojo: r.ojo, fecha: r.fecha,
          iol: info.iol || '—',
          refOD: info.refOD || '',
          refOI: info.refOI || '',
          mediciones: (r.mediciones || []).filter(m => m && m.defocus !== null)
        })
      }
    })
    return Object.values(mapa)
  }

  const pacientes = agrupar(resultados)
  const colores = { OD:'#1e40af', OI:'#0f766e', AO:'#7c3aed' }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(15,23,42,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', width:'640px', maxHeight:'85vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ margin:0, fontSize:'1.1rem', color:'#1e293b' }}>🔍 Buscar paciente</h2>
          <button onClick={onCerrar} style={{ background:'#f1f5f9', border:'none', borderRadius:'6px', width:28, height:28, cursor:'pointer', color:'#64748b', fontSize:'1rem' }}>✕</button>
        </div>

        <div style={{ display:'flex', gap:'6px', marginBottom:'10px' }}>
          {[{val:'apellido',label:'Por apellido'},{val:'documento',label:'Por documento / ID'}].map(t => (
            <button key={t.val} onClick={() => { setTipoBusqueda(t.val); setTimeout(()=>inputRef.current?.focus(),50) }}
              style={{ padding:'6px 14px', border:`1.5px solid ${tipoBusqueda===t.val?'#1e40af':'#e2e8f0'}`, borderRadius:'20px', background:tipoBusqueda===t.val?'#eff6ff':'white', color:tipoBusqueda===t.val?'#1e40af':'#64748b', fontSize:'0.8rem', cursor:'pointer', fontWeight:tipoBusqueda===t.val?600:400 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:'8px', marginBottom:'1rem' }}>
          <input ref={inputRef} autoFocus
            style={{ flex:1, padding:'9px 14px', border:'2px solid #e2e8f0', borderRadius:'9px', fontSize:'0.9rem', outline:'none' }}
            placeholder={tipoBusqueda==='apellido'?'Ej: Orjuela, García...':'Ej: 79245491...'}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key==='Enter' && buscar()}
            onFocus={e => e.target.style.borderColor='#1e40af'}
            onBlur={e => e.target.style.borderColor='#e2e8f0'}
          />
          <button onClick={buscar} disabled={cargando}
            style={{ padding:'9px 22px', background:'#1e40af', color:'white', border:'none', borderRadius:'9px', cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>
            {cargando ? '⏳' : 'Buscar'}
          </button>
        </div>

        <div style={{ overflowY:'auto', flex:1 }}>
          {buscado && pacientes.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>
              <div style={{ fontSize:'2rem', marginBottom:'8px' }}>🔎</div>
              <p style={{ margin:0, fontSize:'0.9rem' }}>No se encontraron pacientes</p>
              <p style={{ margin:'4px 0 0', fontSize:'0.8rem' }}>Intenta con otro término de búsqueda</p>
            </div>
          )}

          {pacientes.map(p => {
            const isOpen = expandido === p.id
            return (
              <div key={p.id} style={{ border:'1px solid #e2e8f0', borderRadius:'10px', marginBottom:'8px', overflow:'hidden' }}>
                <div onClick={() => setExpandido(isOpen ? null : p.id)}
                  style={{ padding:'12px 14px', background:isOpen?'#eff6ff':'#f8fafc', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:isOpen?'1px solid #bfdbfe':'none' }}>
                  <div>
                    <strong style={{ fontSize:'0.95rem', color:'#1e293b' }}>{p.nombre}</strong>
                    <span style={{ marginLeft:'10px', fontSize:'0.78rem', color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:'4px' }}>
                      {p.documento || 'Sin documento'}
                    </span>
                    {p.fecha_nacimiento && (
                      <span style={{ marginLeft:'8px', fontSize:'0.75rem', color:'#94a3b8' }}>
                        Nac: {new Date(p.fecha_nacimiento).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'0.72rem', background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'10px' }}>
                      {p.curvas.length} curva{p.curvas.length!==1?'s':''}
                    </span>
                    <span style={{ color:'#94a3b8' }}>{isOpen?'▲':'▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div>
                    {p.curvas.length === 0 && (
                      <p style={{ padding:'12px 14px', margin:0, color:'#94a3b8', fontSize:'0.82rem' }}>Sin curvas registradas</p>
                    )}
                    {p.curvas.map((c, idx) => {
                      const fechaStr = c.fecha ? new Date(c.fecha).toLocaleDateString('es-CO', {day:'2-digit', month:'short', year:'numeric'}) : '—'
                      return (
                        <div key={c.id} style={{ padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #f1f5f9', background:idx%2===0?'white':'#fafafa' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                            <span style={{ fontSize:'0.85rem', fontWeight:700, color:colores[c.ojo]||'#1e40af', background:(colores[c.ojo]||'#1e40af')+'18', padding:'3px 10px', borderRadius:'6px' }}>
                              {c.ojo}
                            </span>
                            <div>
                              <div style={{ fontSize:'0.82rem', color:'#334155', fontWeight:500 }}>{c.iol}</div>
                              <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                                {fechaStr} · {c.mediciones.length} puntos
                                {c.refOD && ` · OD: ${c.refOD}`}
                                {c.refOI && ` · OI: ${c.refOI}`}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => onCargar({ paciente: p, curva: c })}
                            style={{ padding:'6px 16px', background:'#1e40af', color:'white', border:'none', borderRadius:'7px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500 }}>
                            Cargar →
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
