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
    const pacientes = {}
    rows.forEach(r => {
      if (!pacientes[r.id]) pacientes[r.id] = {
        id: r.id, nombre: r.nombre, documento: r.documento,
        fecha_nacimiento: r.fecha_nacimiento, examenes: {}
      }
      if (r.curva_id) {
        let info = {}
        try { info = JSON.parse(r.notas || '{}') } catch(e) { info = {} }
        const fechaKey = r.fecha ? r.fecha.split('T')[0] : 'sin-fecha'
        if (!pacientes[r.id].examenes[fechaKey]) {
          pacientes[r.id].examenes[fechaKey] = { fecha: fechaKey, curvas: [] }
        }
        pacientes[r.id].examenes[fechaKey].curvas.push({
          id: r.curva_id, ojo: r.ojo,
          iol: info.iol || '—',
          refOD: info.refOD || '',
          refOI: info.refOI || '',
          mediciones: (r.mediciones || []).filter(m => m && m.defocus !== null)
        })
      }
    })
    return Object.values(pacientes).map(p => ({
      ...p,
      examenes: Object.values(p.examenes).sort((a,b) => b.fecha.localeCompare(a.fecha))
    }))
  }

  const pacientes = agrupar(resultados)
  const colores = { OD:'#1e40af', OI:'#0f766e', AO:'#7c3aed' }

  const formatFecha = (f) => {
    if (!f || f === 'sin-fecha') return 'Fecha no registrada'
    const d = new Date(f + 'T12:00:00')
    return d.toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(15,23,42,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', width:'660px', maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>

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
              <p style={{ margin:0 }}>No se encontraron pacientes</p>
            </div>
          )}

          {pacientes.map(p => {
            const isOpen = expandido === p.id
            return (
              <div key={p.id} style={{ border:'1px solid #e2e8f0', borderRadius:'10px', marginBottom:'8px', overflow:'hidden' }}>
                {/* Header paciente */}
                <div onClick={() => setExpandido(isOpen ? null : p.id)}
                  style={{ padding:'12px 14px', background:isOpen?'#eff6ff':'#f8fafc', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:isOpen?'1px solid #bfdbfe':'none' }}>
                  <div>
                    <strong style={{ fontSize:'0.95rem', color:'#1e293b' }}>{p.nombre}</strong>
                    <span style={{ marginLeft:'10px', fontSize:'0.78rem', color:'#64748b', background:'#f1f5f9', padding:'2px 8px', borderRadius:'4px' }}>
                      {p.documento || 'Sin documento'}
                    </span>
                    {p.fecha_nacimiento && (
                      <span style={{ marginLeft:'8px', fontSize:'0.75rem', color:'#94a3b8' }}>
                        Nac: {new Date(p.fecha_nacimiento + 'T12:00:00').toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'0.72rem', background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'10px' }}>
                      {p.examenes.length} examen{p.examenes.length!==1?'es':''}
                    </span>
                    <span style={{ color:'#94a3b8' }}>{isOpen?'▲':'▼'}</span>
                  </div>
                </div>

                {/* Exámenes agrupados por fecha */}
                {isOpen && (
                  <div>
                    {p.examenes.length === 0 && (
                      <p style={{ padding:'12px 14px', margin:0, color:'#94a3b8', fontSize:'0.82rem' }}>Sin exámenes registrados</p>
                    )}
                    {p.examenes.map((examen, idx) => (
                      <div key={examen.fecha} style={{ borderTop:'1px solid #f1f5f9', background:idx%2===0?'white':'#fafafa' }}>
                        {/* Fecha del examen */}
                        <div style={{ padding:'8px 14px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:600 }}>
                              📅 {formatFecha(examen.fecha)}
                            </span>
                            <div style={{ display:'flex', gap:'4px' }}>
                              {examen.curvas.map(c => (
                                <span key={c.id} style={{ fontSize:'0.7rem', fontWeight:700, color:colores[c.ojo]||'#1e40af', background:(colores[c.ojo]||'#1e40af')+'18', padding:'1px 7px', borderRadius:'4px' }}>
                                  {c.ojo}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => onCargar({ paciente: p, examenes: examen.curvas, refOD: examen.curvas[0]?.refOD||"", refOI: examen.curvas[0]?.refOI||"" })}
                            style={{ padding:'5px 14px', background:'#1e40af', color:'white', border:'none', borderRadius:'7px', fontSize:'0.8rem', cursor:'pointer', fontWeight:600 }}>
                            Cargar examen →
                          </button>
                        </div>
                        {/* Detalle curvas del examen */}
                        <div style={{ padding:'4px 14px 8px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          {examen.curvas.map(c => (
                            <div key={c.id} style={{ fontSize:'0.72rem', color:'#64748b', background:'#f8fafc', padding:'3px 8px', borderRadius:'5px', border:'1px solid #e2e8f0' }}>
                              <span style={{ color:colores[c.ojo], fontWeight:600 }}>{c.ojo}</span>
                              {c.iol && c.iol !== '—' && ` · ${c.iol.split('(')[0].trim()}`}
                              {` · ${c.mediciones.length}pts`}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
