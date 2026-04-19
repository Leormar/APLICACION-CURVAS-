'use client'
import { useState, useRef } from 'react'

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
  const [iol, setIol] = useState('')
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
    onMedicionesChange(ojo, getMediciones(nuevos[ojo], tipoAV))
  }

  const handleOjo = (o) => {
    setOjo(o)
    onMedicionesChange(o, getMediciones(valores[o], tipoAV))
  }

  const handleTipoAV = (t) => {
    setTipoAV(t)
    onMedicionesChange(ojo, getMediciones(valores[ojo], t))
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); inputRefs.current[DEFOCUS[idx+1]]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); inputRefs.current[DEFOCUS[idx-1]]?.focus() }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const mediciones = getMediciones(valores[ojo], tipoAV)
      const res = await fetch('/api/curvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente, documento, fechaNac, ojo, iol, refOD, refOI, mediciones })
      })
      if (res.ok) onGuardado({ paciente, documento, fechaNac, ojo, iol, refOD, refOI, tipoAV })
    } catch(e) { console.error(e) }
    setGuardando(false)
  }

  const inp = { width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.8rem', color: '#475569', marginBottom: '4px', display: 'block' }
  const sec = { fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', margin: '0.75rem 0 0.4rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }
  const valsOjo = valores[ojo] || {}
  const placeholder = tipoAV==='decimal'?'0.8':tipoAV==='logmar'?'0.1':'20/25'

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1e293b' }}>Datos del paciente</h2>
      <div style={{ marginBottom: '0.6rem' }}>
        <label style={lbl}>Nombre completo</label>
        <input style={inp} value={paciente} onChange={e => setPaciente(e.target.value)} placeholder="Nombre completo" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <div><label style={lbl}>Documento / ID</label><input style={inp} value={documento} onChange={e => setDocumento(e.target.value)} placeholder="CC / Pasaporte" /></div>
        <div><label style={lbl}>Fecha de nacimiento</label><input type="date" style={inp} value={fechaNac} onChange={e => setFechaNac(e.target.value)} /></div>
      </div>
      <p style={sec}>Refracción</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div><label style={lbl}>OD</label><input style={inp} value={refOD} onChange={e => setRefOD(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
        <div><label style={lbl}>OI</label><input style={inp} value={refOI} onChange={e => setRefOI(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
      </div>
      <p style={sec}>IOL y ojo a medir</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div><label style={lbl}>IOL implantada</label><input style={inp} value={iol} onChange={e => setIol(e.target.value)} placeholder="Ej: PanOptix" /></div>
        <div>
          <label style={lbl}>Ojo activo</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['OD','OI','AO'].map(o => (
              <button key={o} onClick={() => handleOjo(o)}
                style={{ flex:1, padding:'6px', border:`1px solid ${ojo===o?'#1e40af':'#cbd5e1'}`, borderRadius:'6px', background:ojo===o?'#1e40af':'white', color:ojo===o?'white':'#475569', fontSize:'0.85rem', cursor:'pointer', fontWeight: ojo===o?600:400 }}>
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p style={sec}>Tipo de AV</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '0.6rem' }}>
        {['decimal','logmar','snellen'].map(t => (
          <button key={t} onClick={() => handleTipoAV(t)}
            style={{ flex:1, padding:'5px', border:`1px solid ${tipoAV===t?'#1e40af':'#cbd5e1'}`, borderRadius:'6px', background:tipoAV===t?'#1e40af':'white', color:tipoAV===t?'white':'#475569', fontSize:'0.8rem', cursor:'pointer' }}>
            {t==='logmar'?'LogMAR':t==='decimal'?'Decimal':'Snellen'}
          </button>
        ))}
      </div>
      <p style={{ ...sec, borderTop: 'none', paddingTop: 0 }}>AV por vergencia — {ojo}</p>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', background: '#f8fafc', padding: '5px 10px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
          <span>Defocus</span><span style={{textAlign:'center'}}>AV</span><span style={{textAlign:'right'}}>LogMAR</span>
        </div>
        {DEFOCUS.map((d, i) => {
          const lm = toLogMAR(valsOjo[d], tipoAV)
          return (
            <div key={d} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', alignItems: 'center', padding: '2px 10px', background: i%2===0?'white':'#fafafa', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 500 }}>{d} D</span>
              <input
                ref={el => inputRefs.current[d] = el}
                type={tipoAV==='snellen'?'text':'number'} step="0.05"
                style={{ margin: '2px 8px', padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: '5px', fontSize: '0.85rem', textAlign: 'center' }}
                placeholder={placeholder}
                value={valsOjo[d]||''}
                onChange={e => handleValor(d, e.target.value)}
                onKeyDown={e => handleKeyDown(e, i)}
                onFocus={e => e.target.style.borderColor='#1e40af'}
                onBlur={e => e.target.style.borderColor='#e2e8f0'}
              />
              <span style={{ fontSize: '0.75rem', textAlign: 'right', color: lm!==null?(lm<=0.1?'#16a34a':lm<=0.2?'#d97706':lm<=0.3?'#ea580c':'#94a3b8'):'#e2e8f0', fontWeight: lm!==null&&lm<=0.2?600:400 }}>
                {lm !== null ? lm : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <button onClick={handleGuardar} disabled={guardando||!paciente}
        style={{ marginTop: '0.75rem', width: '100%', padding: '0.6rem', background: paciente?'#1e40af':'#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: paciente?'pointer':'default', fontWeight: 500 }}>
        {guardando ? 'Guardando...' : `💾 Guardar curva ${ojo}`}
      </button>
    </div>
  )
}
