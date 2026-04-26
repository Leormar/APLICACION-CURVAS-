'use client'
import { useState, useEffect } from 'react'

const CATEGORIAS = {
  monofocal_plus: { label: 'Monofocal Plus', color: '#64748b' },
  edof_refractivo: { label: 'EDOF Refractivo', color: '#0f766e' },
  edof_difractivo: { label: 'EDOF Difractivo', color: '#0369a1' },
  trifocal: { label: 'Trifocal', color: '#7c3aed' },
  full_range: { label: 'Full Range', color: '#dc2626' },
  binocular_complementario: { label: 'Binocular', color: '#d97706' }
}

const VERGENCIAS = [1,0.5,0,-0.5,-1,-1.5,-2,-2.5,-3,-3.5,-4,-4.5,-5]
const CAMPOS = ['v_pos1','v_pos05','v_0','v_neg05','v_neg1','v_neg15','v_neg2','v_neg25','v_neg3','v_neg35','v_neg4','v_neg45','v_neg5']

export default function BibliotecaIOL({ curvaActual, nombreIOL, ojo, onCerrar }) {
  const [iolRefs, setIolRefs] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modoCiego, setModoCiego] = useState(false)
  const [clasificacion, setClasificacion] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mostrarPropuesta, setMostrarPropuesta] = useState(false)

  useEffect(() => {
    fetch('/api/iol-referencias')
      .then(r => r.json())
      .then(d => {
        setIolRefs(d.iol || [])
        if (nombreIOL) {
          const match = d.iol?.find(i =>
            i.nombre.toLowerCase().includes(nombreIOL.toLowerCase()) ||
            nombreIOL.toLowerCase().includes(i.nombre.toLowerCase().split(' ')[0])
          )
          if (match) setSeleccionado(match)
        }
      })
  }, [nombreIOL])

  const clasificarCiega = async () => {
    if (!curvaActual || curvaActual.length < 3) return
    setCargando(true)
    try {
      const res = await fetch('/api/clasificar-iol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediciones: curvaActual })
      })
      const data = await res.json()
      setClasificacion(data)
      setModoCiego(true)
      if (data.top3?.[0]) setSeleccionado(iolRefs.find(i => i.id === data.top3[0].id))
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  const iolFiltrados = iolRefs.filter(i => {
    const matchCat = !categoriaFiltro || i.categoria === categoriaFiltro
    const matchBus = !busqueda || i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      i.casa_comercial.toLowerCase().includes(busqueda.toLowerCase())
    return matchCat && matchBus
  })

  const miniSVG = (iol, ancho=120, alto=60) => {
    const curva = CAMPOS.map(c => iol[c] !== null ? parseFloat(iol[c]) : null)
    const color = CATEGORIAS[iol.categoria]?.color || '#666'
    const W=ancho, H=alto, pL=8, pR=8, pT=4, pB=16
    const gW=W-pL-pR, gH=H-pT-pB
    const px = i => pL + (i/(VERGENCIAS.length-1))*gW
    const py = v => v!==null ? pT + (v/1.3)*gH : null
    const puntos = curva.map((v,i) => v!==null ? `${px(i).toFixed(1)},${py(v).toFixed(1)}` : null).filter(Boolean)
    if (puntos.length < 2) return null
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <line x1="${pL}" y1="${py(0.2).toFixed(1)}" x2="${W-pR}" y2="${py(0.2).toFixed(1)}" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="3,2"/>
      <polyline points="${puntos.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>
    </svg>`
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'900px', maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        <div style={{ background:'#1e40af', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ color:'white', margin:0, fontSize:'1rem', fontWeight:800 }}>
              📚 Biblioteca IOL de Referencia — {ojo}
            </h2>
            <p style={{ color:'rgba(255,255,255,0.7)', margin:'2px 0 0', fontSize:'0.75rem' }}>
              MAIdx sd Bench · Curvas publicadas en literatura 2019-2025
            </p>
          </div>
          <button onClick={onCerrar} style={{ background:'rgba(255,255,255,0.2)', border:'none', color:'white', borderRadius:'8px', padding:'6px 12px', cursor:'pointer', fontSize:'0.85rem' }}>✕ Cerrar</button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

          <div style={{ width:'320px', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', flexShrink:0 }}>

            <div style={{ padding:'12px', borderBottom:'1px solid #e2e8f0' }}>
              <input
                placeholder="Buscar IOL o casa..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ width:'100%', border:'1px solid #ddd', borderRadius:'8px', padding:'7px 10px', fontSize:'0.82rem', marginBottom:'8px', boxSizing:'border-box' }}
              />
              <select
                value={categoriaFiltro}
                onChange={e => setCategoriaFiltro(e.target.value)}
                style={{ width:'100%', border:'1px solid #ddd', borderRadius:'8px', padding:'7px', fontSize:'0.82rem', marginBottom:'8px', boxSizing:'border-box' }}
              >
                <option value="">Todas las categorías</option>
                {Object.entries(CATEGORIAS).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {curvaActual?.length >= 3 && (
                <button onClick={clasificarCiega} disabled={cargando}
                  style={{ width:'100%', padding:'8px', background:cargando?'#94a3b8':'#7c3aed', color:'white', border:'none', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:700, boxSizing:'border-box' }}>
                  {cargando ? '⏳ Analizando...' : '🔬 Identificar IOL por curva (MAIdx)'}
                </button>
              )}
            </div>

            {clasificacion && modoCiego && (
              <div style={{ padding:'10px 12px', background:'#f0f9ff', borderBottom:'1px solid #bae6fd' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#0369a1', marginBottom:'4px' }}>
                  🔬 MAIdx sd Bench — Evaluación ciega
                </div>
                <div style={{ fontSize:'0.72rem', color:'#0369a1', marginBottom:'6px' }}>
                  {clasificacion.morfologia?.descripcion}
                </div>
                {clasificacion.top3?.map((r, i) => (
                  <div key={i}
                    onClick={() => setSeleccionado(iolRefs.find(x => x.id === r.id))}
                    style={{ display:'flex', justifyContent:'space-between', padding:'4px 6px', borderRadius:'6px', cursor:'pointer', background: i===0 ? '#dbeafe' : 'transparent', marginBottom:'2px' }}>
                    <span style={{ fontSize:'0.72rem', color:'#1e293b', fontWeight: i===0 ? 700 : 400 }}>{i+1}. {r.nombre}</span>
                    <span style={{ fontSize:'0.7rem', color:'#0369a1', fontWeight:700 }}>{r.similitud}%</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ flex:1, overflowY:'auto' }}>
              {iolFiltrados.map(iol => {
                const cat = CATEGORIAS[iol.categoria]
                const svg = miniSVG(iol)
                const esSeleccionado = seleccionado?.id === iol.id
                return (
                  <div key={iol.id}
                    onClick={() => setSeleccionado(iol)}
                    style={{ padding:'10px 12px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', background: esSeleccionado ? '#eff6ff' : 'white', borderLeft: esSeleccionado ? '3px solid #1e40af' : '3px solid transparent' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#1e293b' }}>{iol.nombre}</div>
                        <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{iol.casa_comercial}</div>
                        <span style={{ fontSize:'0.65rem', padding:'2px 6px', borderRadius:'10px', background:cat?.color+'22', color:cat?.color, fontWeight:600 }}>{cat?.label}</span>
                      </div>
                      {svg && <div dangerouslySetInnerHTML={{ __html: svg }} style={{ marginLeft:'8px', flexShrink:0 }}/>}
                    </div>
                  </div>
                )
              })}

              <div style={{ padding:'12px', borderTop:'1px solid #e2e8f0' }}>
                <button onClick={() => setMostrarPropuesta(true)}
                  style={{ width:'100%', padding:'8px', background:'#f0fdf4', color:'#166534', border:'1.5px dashed #166534', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:600 }}>
                  + Proponer IOL no encontrado
                </button>
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
            {seleccionado ? (
              <DetalleIOL iol={seleccionado} curvaActual={curvaActual} />
            ) : (
              <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', flexDirection:'column', gap:'8px' }}>
                <span style={{ fontSize:'2rem' }}>📚</span>
                <span style={{ fontSize:'0.9rem' }}>Selecciona un IOL para ver su curva de referencia</span>
                {curvaActual?.length >= 3 && (
                  <span style={{ fontSize:'0.8rem', color:'#7c3aed' }}>o usa MAIdx para identificación ciega</span>
                )}
              </div>
            )}
          </div>
        </div>

        {mostrarPropuesta && (
          <ModalPropuesta onCerrar={() => setMostrarPropuesta(false)} onEnviado={() => setMostrarPropuesta(false)} />
        )}
      </div>
    </div>
  )
}

function DetalleIOL({ iol, curvaActual }) {
  const VERGENCIAS_LABEL = ['VP ext','VP','VL','2m','1m','67cm','50cm','40cm','33cm','29cm','25cm','22cm','20cm']
  const cat = { monofocal_plus:'#64748b', edof_refractivo:'#0f766e', edof_difractivo:'#0369a1', trifocal:'#7c3aed', full_range:'#dc2626', binocular_complementario:'#d97706' }
  const color = cat[iol.categoria] || '#1e40af'
  const curvaRef = CAMPOS.map(c => iol[c] !== null ? parseFloat(iol[c]) : null)

  const W=500, H=220, pL=35, pR=45, pT=8, pB=44
  const gW=W-pL-pR, gH=H-pT-pB
  const px = i => pL + (i/(VERGENCIAS.length-1))*gW
  const py = v => v!==null ? pT + (Math.min(v,1.3)/1.3)*gH : null

  const puntosRef = curvaRef.map((v,i) => v!==null?`${px(i).toFixed(1)},${py(v).toFixed(1)}`:null).filter(Boolean)

  let puntosP = []
  if (curvaActual?.length >= 2) {
    puntosP = VERGENCIAS.map((verg, i) => {
      const exacto = curvaActual.find(m => parseFloat(m.defocus) === verg)
      if (exacto) return `${px(i).toFixed(1)},${py(parseFloat(exacto.agudeza)).toFixed(1)}`
      return null
    }).filter(Boolean)
  }

  return (
    <div>
      <div style={{ marginBottom:'12px' }}>
        <h3 style={{ margin:'0 0 4px', color:'#1e293b', fontSize:'1rem' }}>{iol.nombre}</h3>
        <div style={{ fontSize:'0.8rem', color:'#64748b' }}>{iol.casa_comercial} · {iol.tecnologia}</div>
        <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:'4px' }}>📚 {iol.referencia_bibliografica}</div>
      </div>

      <div style={{ background:'#fafafa', borderRadius:'10px', padding:'12px', marginBottom:'12px' }}>
        <div style={{ fontSize:'0.78rem', fontWeight:700, color:'#1e293b', marginBottom:'8px' }}>
          Curva de referencia {curvaActual?.length >= 2 ? '+ curva del paciente' : ''}
        </div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
          <line x1={pL} y1={py(0.1)} x2={W-pR} y2={py(0.1)} stroke="#22c55e" strokeWidth="0.8" strokeDasharray="4,3"/>
          <line x1={pL} y1={py(0.2)} x2={W-pR} y2={py(0.2)} stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="4,3"/>
          <line x1={pL} y1={py(0.3)} x2={W-pR} y2={py(0.3)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="4,3"/>
          <text x={W-pR+3} y={py(0.1)} dominantBaseline="middle" fontSize="7" fill="#22c55e">20/25</text>
          <text x={W-pR+3} y={py(0.2)} dominantBaseline="middle" fontSize="7" fill="#f59e0b">20/32</text>
          <text x={W-pR+3} y={py(0.3)} dominantBaseline="middle" fontSize="7" fill="#ef4444">20/40</text>
          {puntosRef.length >= 2 && <polyline points={puntosRef.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6,3" strokeLinejoin="round"/>}
          {puntosP.length >= 2 && <polyline points={puntosP.join(' ')} fill="none" stroke="#1e40af" strokeWidth="2" strokeLinejoin="round"/>}
          <line x1={pL} y1={pT} x2={pL} y2={H-pB} stroke="#94a3b8" strokeWidth="0.8"/>
          <line x1={pL} y1={H-pB} x2={W-pR} y2={H-pB} stroke="#94a3b8" strokeWidth="0.8"/>
          {VERGENCIAS.map((v,i) => (
            <g key={i}>
              <text x={px(i)} y={H-pB+10} textAnchor="middle" fontSize="6.5" fill="#475569">{v}</text>
              <text x={px(i)} y={H-pB+19} textAnchor="middle" fontSize="5.5" fill="#94a3b8">{VERGENCIAS_LABEL[i]}</text>
            </g>
          ))}
        </svg>

        <div style={{ display:'flex', gap:'16px', marginTop:'8px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.72rem', color:'#475569' }}>
            <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke={color} strokeWidth="2.5" strokeDasharray="5,3"/></svg>
            Referencia: {iol.nombre}
          </div>
          {puntosP.length >= 2 && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.72rem', color:'#475569' }}>
              <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#1e40af" strokeWidth="2"/></svg>
              Paciente
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.72rem' }}>
          <thead>
            <tr style={{ background:'#f1f5f9' }}>
              <th style={{ padding:'4px 6px', textAlign:'left', color:'#475569' }}>Defocus</th>
              {VERGENCIAS.map(v => <th key={v} style={{ padding:'4px 6px', textAlign:'center', color:'#475569' }}>{v}D</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding:'4px 6px', fontWeight:600, color:color }}>Referencia</td>
              {curvaRef.map((v,i) => (
                <td key={i} style={{ padding:'4px 6px', textAlign:'center', color: v!==null&&v<=0.2?'#166534':'#374151', fontWeight: v!==null&&v<=0.2?700:400 }}>
                  {v !== null ? v.toFixed(2) : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ModalPropuesta({ onCerrar, onEnviado }) {
  const [form, setForm] = useState({ nombre:'', casa_comercial:'', categoria:'trifocal', tecnologia:'', referencia_bibliografica:'' })
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  const enviar = async () => {
    if (!form.nombre || !form.casa_comercial) return
    setEnviando(true)
    try {
      const res = await fetch('/api/iol-referencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.ok) setOk(true)
    } catch(e) { console.error(e) }
    setEnviando(false)
  }

  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
      <div style={{ background:'white', borderRadius:'14px', padding:'24px', maxWidth:'420px', width:'90%' }}>
        {ok ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:'8px' }}>✅</div>
            <h3 style={{ color:'#166534' }}>Propuesta enviada</h3>
            <p style={{ color:'#475569', fontSize:'0.85rem' }}>El Dr. Orjuela revisará y validará el IOL para incluirlo en la biblioteca.</p>
            <button onClick={onEnviado} style={{ marginTop:'16px', padding:'10px 24px', background:'#1e40af', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>Cerrar</button>
          </div>
        ) : (
          <>
            <h3 style={{ margin:'0 0 16px', color:'#1e293b' }}>Proponer nuevo IOL</h3>
            {[
              ['nombre', 'Nombre del IOL *'],
              ['casa_comercial', 'Casa comercial *'],
              ['tecnologia', 'Tecnología'],
              ['referencia_bibliografica', 'Referencia bibliográfica']
            ].map(([key, label]) => (
              <div key={key} style={{ marginBottom:'10px' }}>
                <label style={{ fontSize:'0.78rem', color:'#475569', display:'block', marginBottom:'3px' }}>{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                  style={{ width:'100%', border:'1px solid #ddd', borderRadius:'8px', padding:'8px 10px', fontSize:'0.85rem', boxSizing:'border-box' }}/>
              </div>
            ))}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ fontSize:'0.78rem', color:'#475569', display:'block', marginBottom:'3px' }}>Categoría *</label>
              <select value={form.categoria} onChange={e => setForm(f => ({...f, categoria: e.target.value}))}
                style={{ width:'100%', border:'1px solid #ddd', borderRadius:'8px', padding:'8px', fontSize:'0.85rem', boxSizing:'border-box' }}>
                <option value="monofocal_plus">Monofocal Plus</option>
                <option value="edof_refractivo">EDOF Refractivo</option>
                <option value="edof_difractivo">EDOF Difractivo</option>
                <option value="trifocal">Trifocal</option>
                <option value="full_range">Full Range</option>
                <option value="binocular_complementario">Binocular Complementario</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={onCerrar} style={{ flex:1, padding:'10px', background:'#f1f5f9', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem' }}>Cancelar</button>
              <button onClick={enviar} disabled={enviando || !form.nombre || !form.casa_comercial}
                style={{ flex:1, padding:'10px', background:enviando?'#94a3b8':'#1e40af', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
                {enviando ? 'Enviando...' : 'Enviar propuesta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
