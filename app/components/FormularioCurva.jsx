'use client'
import { useState, useRef } from 'react'

const DEFOCUS = ['-5.00','-4.50','-4.00','-3.50','-3.00','-2.50','-2.00','-1.50','-1.00','-0.50','0.00','+0.50','+1.00']

const toLogMAR = (valor, tipo) => {
  const v = parseFloat(valor)
  if (isNaN(v) || valor === '') return null
  if (tipo === 'logmar') return parseFloat(v.toFixed(2))
  if (tipo === 'decimal') {
    if (v <= 0) return 1.3
    return parseFloat((-Math.log10(v)).toFixed(2))
  }
  if (tipo === 'snellen') {
    const parts = String(valor).split('/')
    if (parts.length === 2) {
      const dec = parseFloat(parts[0]) / parseFloat(parts[1])
      if (dec <= 0 || isNaN(dec)) return 1.3
      return parseFloat((-Math.log10(dec)).toFixed(2))
    }
    return null
  }
  return null
}

export default function FormularioCurva({ onMedicionesChange, onGuardado }) {
  const [paciente, setPaciente] = useState('')
  const [documento, setDocumento] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [ojo, setOjo] = useState('AO')
  const [iol, setIol] = useState('')
  const [refOD, setRefOD] = useState('')
  const [refOI, setRefOI] = useState('')
  const [tipoAV, setTipoAV] = useState('decimal')
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const inputRefs = useRef({})

  const getMediciones = (vals, tipo) =>
    Object.entries(vals)
      .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: toLogMAR(v, tipo) }))
      .filter(m => m.agudeza !== null)
      .sort((a, b) => a.defocus - b.defocus)

  const handleValor = (d, v) => {
    const nuevo = { ...valores, [d]: v }
    setValores(nuevo)
    onMedicionesChange(getMediciones(nuevo, tipoAV))
  }

  const handleTipoAV = (t) => {
    setTipoAV(t)
    onMedicionesChange(getMediciones(valores, t))
  }

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = DEFOCUS[idx + 1]
      if (next && inputRefs.current[next]) inputRefs.current[next].focus()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = DEFOCUS[idx - 1]
      if (prev && inputRefs.current[prev]) inputRefs.current[prev].focus()
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const mediciones = getMediciones(valores, tipoAV)
      const res = await fetch('/api/curvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente, documento, fechaNac, ojo, iol, refOD, refOI, mediciones })
      })
      if (res.ok) {
        onGuardado({ paciente, documento, fechaNac, ojo, iol, refOD, refOI, tipoAV, mediciones })
      }
    } catch(e) { console.error(e) }
    setGuardando(false)
  }

  const inp = { width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.8rem', color: '#475569', marginBottom: '4px', display: 'block' }
  const sec = { fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: '1rem 0 0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }

  const placeholder = tipoAV === 'logmar' ? '0.0' : tipoAV === 'decimal' ? '0.8' : '20/25'

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b' }}>Datos del paciente</h2>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={lbl}>Nombre completo</label>
        <input style={inp} value={paciente} onChange={e => setPaciente(e.target.value)} placeholder="Nombre completo" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div><label style={lbl}>Documento / ID</label><input style={inp} value={documento} onChange={e => setDocumento(e.target.value)} placeholder="CC / Pasaporte" /></div>
        <div><label style={lbl}>Fecha de nacimiento</label><input type="date" style={inp} value={fechaNac} onChange={e => setFechaNac(e.target.value)} /></div>
      </div>
      <p style={sec}>Refracción</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div><label style={lbl}>OD (Esf / Cil / Eje)</label><input style={inp} value={refOD} onChange={e => setRefOD(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
        <div><label style={lbl}>OI (Esf / Cil / Eje)</label><input style={inp} value={refOI} onChange={e => setRefOI(e.target.value)} placeholder="+1.00 -0.50 x 90" /></div>
      </div>
      <p style={sec}>IOL y medición</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div><label style={lbl}>Ojo evaluado</label>
          <select style={inp} value={ojo} onChange={e => setOjo(e.target.value)}>
            <option value="AO">Ambos (AO)</option>
            <option value="OD">Derecho (OD)</option>
            <option value="OI">Izquierdo (OI)</option>
          </select>
        </div>
        <div><label style={lbl}>IOL implantada</label><input style={inp} value={iol} onChange={e => setIol(e.target.value)} placeholder="Ej: PanOptix" /></div>
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={lbl}>Tipo de AV ingresada</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['decimal','logmar','snellen'].map(t => (
            <button key={t} onClick={() => handleTipoAV(t)}
              style={{ flex: 1, padding: '6px', border: `1px solid ${tipoAV===t?'#1e40af':'#cbd5e1'}`, borderRadius: '6px', background: tipoAV===t?'#1e40af':'white', color: tipoAV===t?'white':'#475569', fontSize: '0.8rem', cursor: 'pointer' }}>
              {t==='logmar'?'LogMAR':t==='decimal'?'Decimal':'Snellen'}
            </button>
          ))}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
          {tipoAV==='decimal'?'Ej: 1.0, 0.8, 0.5':tipoAV==='snellen'?'Ej: 20/20, 20/40':'Ej: 0.0, 0.1, 0.3'} · Enter o ↑↓ para navegar
        </p>
      </div>
      <p style={sec}>Agudeza visual por vergencia</p>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', background: '#f8fafc', padding: '6px 12px', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
          <span>Defocus</span><span style={{textAlign:'center'}}>AV ({tipoAV})</span><span style={{textAlign:'right'}}>LogMAR</span>
        </div>
        {DEFOCUS.map((d, i) => {
          const lm = toLogMAR(valores[d], tipoAV)
          return (
            <div key={d} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', alignItems: 'center', padding: '3px 12px', background: i%2===0?'white':'#fafafa', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>{d} D</span>
              <input
                ref={el => inputRefs.current[d] = el}
                type={tipoAV==='snellen'?'text':'number'}
                step={tipoAV==='decimal'?'0.05':'0.1'}
                style={{ margin: '2px 8px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '5px', fontSize: '0.85rem', textAlign: 'center', outline: 'none' }}
                placeholder={placeholder}
                value={valores[d]||''}
                onChange={e => handleValor(d, e.target.value)}
                onKeyDown={e => handleKeyDown(e, i)}
                onFocus={e => e.target.style.borderColor='#1e40af'}
                onBlur={e => e.target.style.borderColor='#e2e8f0'}
              />
              <span style={{ fontSize: '0.75rem', textAlign: 'right', color: lm !== null ? (lm <= 0.1 ? '#16a34a' : lm <= 0.2 ? '#d97706' : lm <= 0.3 ? '#ea580c' : '#94a3b8') : '#e2e8f0', fontWeight: lm !== null && lm <= 0.2 ? 600 : 400 }}>
                {lm !== null ? lm : '—'}
              </span>
            </div>
          )
        })}
      </div>
      <button onClick={handleGuardar} disabled={guardando||!paciente}
        style={{ marginTop: '1rem', width: '100%', padding: '0.65rem', background: paciente?'#1e40af':'#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: paciente?'pointer':'default', fontWeight: 500 }}>
        {guardando ? 'Guardando...' : '💾 Guardar curva'}
      </button>
    </div>
  )
}
