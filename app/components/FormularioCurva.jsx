'use client'
import { useState, useRef, useEffect } from 'react'
import { LENTES } from '../data/lentes'

const DEFOCUS = ['-5.00','-4.50','-4.00','-3.50','-3.00','-2.50','-2.00','-1.50','-1.00','-0.50','0.00','+0.50','+1.00']

// Convierte cualquier tipo a LogMAR
const toLogMAR = (valor, tipo) => {
  const str = String(valor).trim()
  if (!str || str === '') return null
  if (tipo === 'logmar') {
    const v = parseFloat(str)
    return isNaN(v) ? null : parseFloat(v.toFixed(2))
  }
  if (tipo === 'decimal') {
    const v = parseFloat(str)
    if (isNaN(v) || v <= 0) return 1.3
    return parseFloat((-Math.log10(v)).toFixed(2))
  }
  if (tipo === 'snellen') {
    let dec
    if (str.includes('/')) {
      const parts = str.split('/')
      dec = parseFloat(parts[0]) / parseFloat(parts[1])
    } else {
      const denom = parseFloat(str)
      dec = isNaN(denom) || denom <= 0 ? 0 : 20 / denom
    }
    if (dec <= 0 || isNaN(dec)) return 1.3
    return parseFloat((-Math.log10(dec)).toFixed(2))
  }
  return null
}

// Convierte LogMAR a otro tipo para mostrar
const fromLogMAR = (logmar, tipo) => {
  if (logmar === null || logmar === undefined || logmar === '') return ''
  const v = parseFloat(logmar)
  if (isNaN(v)) return ''
  if (tipo === 'logmar') return v.toFixed(2)
  if (tipo === 'decimal') {
    const dec = Math.pow(10, -v)
    return dec.toFixed(2)
  }
  if (tipo === 'snellen') {
    const dec = Math.pow(10, -v)
    const denom = Math.round(20 / dec)
    return String(denom)
  }
  return ''
}

const defocusToKey = (defVal) => {
  const num = parseFloat(defVal)
  const match = DEFOCUS.find(d => Math.abs(parseFloat(d) - num) < 0.001)
  if (match) return match
  return num >= 0 ? '+' + num.toFixed(2) : num.toFixed(2)
}

export default function FormularioCurva({ onMedicionesChange, onGuardado, pacienteCargado }) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [documento, setDocumento] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [ojo, setOjo] = useState('OD')
  const [lentes, setLentes] = useState({ OD: '', OI: '' })
  const [refOD, setRefOD] = useState('')
  const [refOI, setRefOI] = useState('')
  const [tipoAV, setTipoAV] = useState('decimal')
  // Guardamos siempre en LogMAR internamente
  const [valoresLogMAR, setValoresLogMAR] = useState({ OD: {}, OI: {}, AO: {} })
  // Lo que el usuario ve/escribe en pantalla
  const [valoresDisplay, setValoresDisplay] = useState({ OD: {}, OI: {}, AO: {} })
  const [guardando, setGuardando] = useState(false)
  const inputRefs = useRef({})

  const nombreCompleto = `${nombre} ${apellido}`.trim()

  useEffect(() => {
    if (!pacienteCargado) return
    const { paciente: p, examenes, refOD: rOD, refOI: rOI } = pacienteCargado
    const partes = (p.nombre || '').trim().split(' ')
    if (partes.length >= 2) { setNombre(partes.slice(0,-1).join(' ')); setApellido(partes[partes.length-1]) }
    else { setNombre(p.nombre||''); setApellido('') }
    setDocumento(p.documento||'')
    if (p.fecha_nacimiento) setFechaNac(p.fecha_nacimiento.split('T')[0])
    if (rOD) setRefOD(rOD)
    if (rOI) setRefOI(rOI)

    const nuevosLogMAR = { OD: {}, OI: {}, AO: {} }
    const nuevosDisplay = { OD: {}, OI: {}, AO: {} }
    const nuevosLentes = { OD: '', OI: '' }

    examenes?.forEach(curva => {
      const ojoKey = curva.ojo
      if (!nuevosLogMAR[ojoKey]) { nuevosLogMAR[ojoKey] = {}; nuevosDisplay[ojoKey] = {} }
      if (ojoKey !== 'AO' && curva.iol && curva.iol !== '—') nuevosLentes[ojoKey] = curva.iol
      curva.mediciones?.forEach(m => {
        if (m.defocus !== null && m.agudeza !== null) {
          const key = defocusToKey(m.defocus)
          const lm = parseFloat(m.agudeza)
          nuevosLogMAR[ojoKey][key] = lm
          nuevosDisplay[ojoKey][key] = fromLogMAR(lm, tipoAV)
        }
      })
    })

    setValoresLogMAR(nuevosLogMAR)
    setValoresDisplay(nuevosDisplay)
    setLentes(nuevosLentes)
    setTipoAV('logmar')

    const primerOjo = examenes?.find(c => c.mediciones?.length > 0)?.ojo || 'OD'
    setOjo(primerOjo)

    setTimeout(() => {
      examenes?.forEach(curva => {
        const ojoKey = curva.ojo
        const med = curva.mediciones?.filter(m => m.defocus !== null && m.agudeza !== null)
          .map(m => ({ defocus: parseFloat(m.defocus), agudeza: parseFloat(m.agudeza) }))
          .sort((a,b) => a.defocus - b.defocus) || []
        if (med.length > 0) onMedicionesChange(ojoKey, med, nuevosLentes[ojoKey]||'')
      })
    }, 100)
  }, [pacienteCargado])

  const getMedicionesFromLogMAR = (lmVals) =>
    Object.entries(lmVals)
      .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: v }))
      .filter(m => m.agudeza !== null && m.agudeza !== undefined && !isNaN(m.agudeza))
      .sort((a, b) => a.defocus - b.defocus)

  const handleValor = (d, displayVal) => {
    const lm = toLogMAR(displayVal, tipoAV)
    const nuevosLM = { ...valoresLogMAR, [ojo]: { ...valoresLogMAR[ojo], [d]: lm } }
    const nuevosDisplay = { ...valoresDisplay, [ojo]: { ...valoresDisplay[ojo], [d]: displayVal } }
    setValoresLogMAR(nuevosLM)
    setValoresDisplay(nuevosDisplay)
    onMedicionesChange(ojo, getMedicionesFromLogMAR(nuevosLM[ojo]), ojo==='AO'?'':lentes[ojo])
  }

  const handleOjo = (o) => {
    setOjo(o)
    onMedicionesChange(o, getMedicionesFromLogMAR(valoresLogMAR[o]||{}), o==='AO'?'':lentes[o])
  }

  const handleTipoAV = (nuevoTipo) => {
    setTipoAV(nuevoTipo)
    // Reconvertir displays desde LogMAR sin cambiar la gráfica
    const nuevosDisplay = { OD: {}, OI: {}, AO: {} }
    Object.keys(valoresLogMAR).forEach(o => {
      nuevosDisplay[o] = {}
      Object.entries(valoresLogMAR[o]).forEach(([d, lm]) => {
        if (lm !== null && lm !== undefined && !isNaN(lm)) {
          nuevosDisplay[o][d] = fromLogMAR(lm, nuevoTipo)
        }
      })
    })
    setValoresDisplay(nuevosDisplay)
    // La gráfica NO cambia porque sigue usando valoresLogMAR
  }

  const handleKeyDown = (e, idx) => {
    if (e.key==='Enter'||e.key==='ArrowDown') { e.preventDefault(); inputRefs.current[DEFOCUS[idx+1]]?.focus() }
    if (e.key==='ArrowUp') { e.preventDefault(); inputRefs.current[DEFOCUS[idx-1]]?.focus() }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const mediciones = getMedicionesFromLogMAR(valoresLogMAR[ojo]||{})
      const res = await fetch('/api/curvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente: nombreCompleto, documento, fechaNac, ojo, iol: ojo==='AO'?'':lentes[ojo], refOD, refOI, mediciones })
      })
      if (res.ok) onGuardado({ paciente: nombreCompleto, documento, fechaNac, ojo, lentes, refOD, refOI, tipoAV })
    } catch(e) { console.error(e) }
    setGuardando(false)
  }

  const valsDisplay = valoresDisplay[ojo] || {}
  const valsLM = valoresLogMAR[ojo] || {}
  const placeholder = tipoAV==='decimal'?'0.8':tipoAV==='logmar'?'0.1':'25'

  const s = {
    inp: { width:'100%', padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:'8px', fontSize:'16px', boxSizing:'border-box', WebkitAppearance:'none' },
    lbl: { fontSize:'0.75rem', color:'#475569', marginBottom:'4px', display:'block', fontWeight:500 },
    sec: { fontSize:'0.85rem', fontWeight:600, color:'#1e293b', margin:'0.8rem 0 0.4rem', borderTop:'1px solid #f1f5f9', paddingTop:'0.6rem' },
    btn: (active) => ({ flex:1, padding:'10px', border:`2px solid ${active?'#1e40af':'#e2e8f0'}`, borderRadius:'8px', background:active?'#1e40af':'white', color:active?'white':'#64748b', fontSize:'0.9rem', cursor:'pointer', fontWeight:active?700:400, touchAction:'manipulation' })
  }

  return (
    <div style={{ background:'white', borderRadius:'12px', padding:'1rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin:'0 0 0.75rem', fontSize:'1rem', color:'#1e293b' }}>Datos del paciente</h2>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
        <div><label style={s.lbl}>Nombre</label><input style={s.inp} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Nombre" /></div>
        <div><label style={s.lbl}>Apellido</label><input style={s.inp} value={apellido} onChange={e=>setApellido(e.target.value)} placeholder="Apellido" /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
        <div><label style={s.lbl}>Documento / ID</label><input style={s.inp} value={documento} onChange={e=>setDocumento(e.target.value)} placeholder="CC / Pasaporte" inputMode="numeric" /></div>
        <div><label style={s.lbl}>Fecha nacimiento</label><input type="date" style={s.inp} value={fechaNac} onChange={e=>setFechaNac(e.target.value)} /></div>
      </div>

      <p style={s.sec}>Refracción</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
        <div><label style={s.lbl}>OD</label><input style={s.inp} value={refOD} onChange={e=>setRefOD(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
        <div><label style={s.lbl}>OI</label><input style={s.inp} value={refOI} onChange={e=>setRefOI(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
      </div>

      <p style={s.sec}>IOL implantada</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
        {['OD','OI'].map(o => (
          <div key={o}>
            <label style={s.lbl}>{o==='OD'?'Ojo Derecho':'Ojo Izquierdo'}</label>
            <select style={s.inp} value={lentes[o]} onChange={e=>setLentes(prev=>({...prev,[o]:e.target.value}))}>
              <option value="">— Sin IOL —</option>
              {Object.entries(LENTES).map(([cat,lista]) => (
                <optgroup key={cat} label={cat}>
                  {lista.map(l=><option key={l} value={l}>{l}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p style={s.sec}>Ojo a evaluar</p>
      <div style={{ display:'flex', gap:'6px', marginBottom:'0.5rem' }}>
        {['OD','OI','AO'].map(o => (
          <button key={o} onClick={()=>handleOjo(o)} style={s.btn(ojo===o)}>{o}</button>
        ))}
      </div>

      <p style={s.sec}>Tipo de AV</p>
      <div style={{ display:'flex', gap:'6px', marginBottom:'4px' }}>
        {['decimal','logmar','snellen'].map(t => (
          <button key={t} onClick={()=>handleTipoAV(t)} style={s.btn(tipoAV===t)}>
            {t==='logmar'?'LogMAR':t==='decimal'?'Decimal':'Snellen'}
          </button>
        ))}
      </div>
      {tipoAV==='snellen' && (
        <p style={{ fontSize:'0.75rem', color:'#64748b', margin:'4px 0 8px', padding:'4px 8px', background:'#f0f9ff', borderRadius:'6px' }}>
          Solo escribe el denominador — ej: <strong>25</strong> para 20/25, <strong>40</strong> para 20/40
        </p>
      )}

      <p style={{ ...s.sec, borderTop:'none', paddingTop:0 }}>AV — {ojo}</p>
      <div style={{ border:'1px solid #e2e8f0', borderRadius:'8px', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 70px', background:'#f8fafc', padding:'6px 10px', fontSize:'0.72rem', color:'#64748b', fontWeight:600 }}>
          <span>Defocus</span>
          <span style={{textAlign:'center'}}>
            {tipoAV==='snellen'?'20/X (denominador)':tipoAV==='decimal'?'Decimal':'LogMAR'}
          </span>
          <span style={{textAlign:'right'}}>LogMAR</span>
        </div>
        {DEFOCUS.map((d,i) => {
          const lm = valsLM[d]
          const lmValido = lm !== null && lm !== undefined && !isNaN(lm)
          return (
            <div key={d} style={{ display:'grid', gridTemplateColumns:'70px 1fr 70px', alignItems:'center', padding:'3px 10px', background:i%2===0?'white':'#fafafa', borderTop:'1px solid #f1f5f9' }}>
              <span style={{ fontSize:'0.82rem', color:'#334155', fontWeight:500 }}>{d}D</span>
              <input
                ref={el=>inputRefs.current[d]=el}
                type="number"
                step="0.05"
                inputMode="decimal"
                style={{ margin:'2px 8px', padding:'6px 8px', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'16px', textAlign:'center', width:'calc(100% - 16px)' }}
                placeholder={placeholder}
                value={valsDisplay[d]||''}
                onChange={e=>handleValor(d,e.target.value)}
                onKeyDown={e=>handleKeyDown(e,i)}
                onFocus={e=>e.target.style.borderColor='#1e40af'}
                onBlur={e=>e.target.style.borderColor='#e2e8f0'}
              />
              <span style={{ fontSize:'0.72rem', textAlign:'right', fontWeight:lmValido&&lm<=0.2?600:400, color:lmValido?(lm<=0.1?'#16a34a':lm<=0.2?'#d97706':lm<=0.3?'#ea580c':'#94a3b8'):'#e2e8f0' }}>
                {lmValido?lm.toFixed(2):'—'}
              </span>
            </div>
          )
        })}
      </div>

      <button onClick={handleGuardar} disabled={guardando||!nombreCompleto}
        style={{ marginTop:'0.75rem', width:'100%', padding:'0.75rem', background:nombreCompleto?'#1e40af':'#94a3b8', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:nombreCompleto?'pointer':'default', fontWeight:600, touchAction:'manipulation' }}>
        {guardando?'Guardando...':`💾 Guardar curva ${ojo}`}
      </button>
    </div>
  )
}
