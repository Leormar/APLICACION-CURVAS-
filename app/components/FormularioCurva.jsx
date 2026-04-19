'use client'
import { useState, useRef } from 'react'
import { LENTES } from '../data/lentes'

const DEFOCUS = ['-5.00','-4.50','-4.00','-3.50','-3.00','-2.50','-2.00','-1.50','-1.00','-0.50','0.00','+0.50','+1.00']

const toLogMAR = (valor, tipo) => {
  const v = parseFloat(valor)
  if (isNaN(v) || valor === '') return null
  if (tipo === 'logmar') return parseFloat(v.toFixed(2))
  if (tipo === 'decimal') return v <= 0 ? 1.3 : parseFloat((-Math.log10(v)).toFixed(2))
  if (tipo === 'snellen') {
    const parts = String(valor).split('/')
    if (parts.length === 2) {
      const dec = parseFloat(parts[0]) / parseFloat(parts[1])
      return dec <= 0 || isNaN(dec) ? 1.3 : parseFloat((-Math.log10(dec)).toFixed(2))
    }
    return null
  }
  return null
}

export default function FormularioCurva({ onMedicionesChange, onGuardado }) {
  const [paciente, setPaciente] = useState('')
  const [documento, setDocumento] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [ojo, setOjo] = useState('OD')
  const [lentes, setLentes] = useState({ OD: '', OI: '' })
  const [refOD, setRefOD] = useState('')
  const [refOI, setRefOI] = useState('')
  const [tipoAV, setTipoAV] = useState('decimal')
  const [valores, setValores] = useState({ OD: {}, OI: {}, AO: {} })
  const [guardando, setGuardando] = useState(false)
  const inputRefs = useRef({})

  const getMediciones = (vals, tipo) =>
    Object.entries(vals)
      .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: toLogMAR(v, tipo) }))
      .filter(m => m.agudeza !== null)
      .sort((a, b) => a.defocus - b.defocus)

  const handleValor = (d, v) => {
    const nuevos = { ...valores, [ojo]: { ...valores[ojo], [d]: v } }
    setValores(nuevos)
    const lenteActivo = ojo === 'AO' ? `${lentes.OD} / ${lentes.OI}` : lentes[ojo]
    onMedicionesChange(ojo, getMediciones(nuevos[ojo], tipoAV), lenteActivo)
  }

  const handleOjo = (o) => {
    setOjo(o)
    const lenteActivo = o === 'AO' ? `${lentes.OD} / ${lentes.OI}` : lentes[o]
    onMedicionesChange(o, getMediciones(valores[o], tipoAV), lenteActivo)
  }

  const handleLente = (o, val) => {
    const nuevos = { ...lentes, [o]: val }
    setLentes(nuevos)
  }

  const handleTipoAV = (t) => {
    setTipoAV(t)
    const lenteActivo = ojo === 'AO' ? `${lentes.OD} / ${lentes.OI}` : lentes[ojo]
    onMedicionesChange(ojo, getMediciones(valores[ojo], t), lenteActivo)
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); inputRefs.current[DEFOCUS[idx+1]]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); inputRefs.current[DEFOCUS[idx-1]]?.focus() }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const mediciones = getMediciones(valores[ojo], tipoAV)
      const iolGuardado = ojo === 'AO' ? `OD:${lentes.OD} OI:${lentes.OI}` : lentes[ojo]
      const res = await fetch('/api/curvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente, documento, fechaNac, ojo, iol: iolGuardado, refOD, refOI, mediciones })
      })
      if (res.ok) onGuardado({ paciente, documento, fechaNac, ojo, lentes, refOD, refOI, tipoAV })
    } catch(e) { console.error(e) }
    setGuardando(false)
  }

  const inp = { width:'100%', padding:'6px 10px', border:'1px solid #cbd5e1', borderRadius:'6px', fontSize:'0.85rem', boxSizing:'border-box' }
  const lbl = { fontSize:'0.78rem', color:'#475569', marginBottom:'3px', display:'block' }
  const sec = { fontSize:'0.85rem', fontWeight:600, color:'#1e293b', margin:'0.7rem 0 0.4rem', borderTop:'1px solid #f1f5f9', paddingTop:'0.6rem' }
  const valsOjo = valores[ojo] || {}
  const placeholder = tipoAV==='decimal'?'0.8':tipoAV==='logmar'?'0.1':'20/25'

  return (
    <div style={{ background:'white', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin:'0 0 0.75rem', fontSize:'1rem', color:'#1e293b' }}>Datos del paciente</h2>

      <div style={{ marginBottom:'0.5rem' }}>
        <label style={lbl}>Nombre completo</label>
        <input style={inp} value={paciente} onChange={e=>setPaciente(e.target.value)} placeholder="Nombre completo" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
        <div><label style={lbl}>Documento / ID</label><input style={inp} value={documento} onChange={e=>setDocumento(e.target.value)} placeholder="CC / Pasaporte" /></div>
        <div><label style={lbl}>Fecha de nacimiento</label><input type="date" style={inp} value={fechaNac} onChange={e=>setFechaNac(e.target.value)} /></div>
      </div>

      <p style={sec}>Refracción</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
        <div><label style={lbl}>OD</label><input style={inp} value={refOD} onChange={e=>setRefOD(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
        <div><label style={lbl}>OI</label><input style={inp} value={refOI} onChange={e=>setRefOI(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
      </div>

      <p style={sec}>IOL implantada</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
        {['OD','OI'].map(o => (
          <div key={o}>
            <label style={lbl}>{o==='OD'?'Ojo Derecho (OD)':'Ojo Izquierdo (OI)'}</label>
            <select style={inp} value={lentes[o]} onChange={e=>handleLente(o,e.target.value)}>
              <option value="">— Sin IOL —</option>
              {Object.entries(LENTES).map(([cat, lista]) => (
                <optgroup key={cat} label={cat}>
                  {lista.map(l => <option key={l} value={l}>{l}</option>)}
                </optgroup>
              ))}
              <option value="otro">Otro</option>
            </select>
          </div>
        ))}
      </div>
      {(lentes.OD==='otro'||lentes.OI==='otro') && (
        <input style={{ ...inp, marginTop:'6px' }} placeholder="Especificar IOL" />
      )}
      {ojo === 'AO' && lentes.OD && lentes.OI && (
        <div style={{ marginTop:'6px', padding:'6px 10px', background:'#f0f9ff', borderRadius:'6px', fontSize:'0.78rem', color:'#0369a1' }}>
          AO: OD {lentes.OD.split('(')[0].trim()} · OI {lentes.OI.split('(')[0].trim()}
        </div>
      )}

      <p style={sec}>Ojo a evaluar</p>
      <div style={{ display:'flex', gap:'6px', marginBottom:'0.5rem' }}>
        {['OD','OI','AO'].map(o => (
          <button key={o} onClick={()=>handleOjo(o)}
            style={{ flex:1, padding:'7px', border:`2px solid ${ojo===o?'#1e40af':'#cbd5e1'}`, borderRadius:'7px', background:ojo===o?'#1e40af':'white', color:ojo===o?'white':'#475569', fontSize:'0.9rem', cursor:'pointer', fontWeight:ojo===o?700:400 }}>
            {o}
          </button>
        ))}
      </div>

      <p style={sec}>Tipo de AV</p>
      <div style={{ display:'flex', gap:'6px', marginBottom:'0.5rem' }}>
        {['decimal','logmar','snellen'].map(t => (
          <button key={t} onClick={()=>handleTipoAV(t)}
            style={{ flex:1, padding:'5px', border:`1px solid ${tipoAV===t?'#1e40af':'#cbd5e1'}`, borderRadius:'6px', background:tipoAV===t?'#1e40af':'white', color:tipoAV===t?'white':'#475569', fontSize:'0.78rem', cursor:'pointer' }}>
            {t==='logmar'?'LogMAR':t==='decimal'?'Decimal':'Snellen'}
          </button>
        ))}
      </div>

      <p style={{ ...sec, borderTop:'none', paddingTop:0 }}>AV — {ojo}</p>
      <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 60px', background:'#f8fafc', padding:'5px 10px', fontSize:'0.72rem', color:'#64748b', fontWeight:600 }}>
          <span>Defocus</span><span style={{textAlign:'center'}}>AV</span><span style={{textAlign:'right'}}>LogMAR</span>
        </div>
        {DEFOCUS.map((d,i) => {
          const lm = toLogMAR(valsOjo[d], tipoAV)
          return (
            <div key={d} style={{ display:'grid', gridTemplateColumns:'80px 1fr 60px', alignItems:'center', padding:'2px 10px', background:i%2===0?'white':'#fafafa', borderTop:'1px solid #f1f5f9' }}>
              <span style={{ fontSize:'0.82rem', color:'#334155', fontWeight:500 }}>{d} D</span>
              <input
                ref={el=>inputRefs.current[d]=el}
                type={tipoAV==='snellen'?'text':'number'} step="0.05"
                style={{ margin:'2px 8px', padding:'3px 6px', border:'1px solid #e2e8f0', borderRadius:'5px', fontSize:'0.85rem', textAlign:'center' }}
                placeholder={placeholder}
                value={valsOjo[d]||''}
                onChange={e=>handleValor(d,e.target.value)}
                onKeyDown={e=>handleKeyDown(e,i)}
                onFocus={e=>e.target.style.borderColor='#1e40af'}
                onBlur={e=>e.target.style.borderColor='#e2e8f0'}
              />
              <span style={{ fontSize:'0.72rem', textAlign:'right', fontWeight:lm!==null&&lm<=0.2?600:400, color:lm!==null?(lm<=0.1?'#16a34a':lm<=0.2?'#d97706':lm<=0.3?'#ea580c':'#94a3b8'):'#e2e8f0' }}>
                {lm!==null?lm:'—'}
              </span>
            </div>
          )
        })}
      </div>

      <button onClick={handleGuardar} disabled={guardando||!paciente}
        style={{ marginTop:'0.75rem', width:'100%', padding:'0.6rem', background:paciente?'#1e40af':'#94a3b8', color:'white', border:'none', borderRadius:'8px', fontSize:'0.9rem', cursor:paciente?'pointer':'default', fontWeight:500 }}>
        {guardando?'Guardando...':`💾 Guardar curva ${ojo}`}
      </button>
    </div>
  )
}
