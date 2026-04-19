'use client'
import { useState } from 'react'

const DEFOCUS = ['-5.00','-4.50','-4.00','-3.50','-3.00','-2.50','-2.00','-1.50','-1.00','-0.50','0.00','+0.50','+1.00']

const toLogMAR = (valor, tipo) => {
  const v = parseFloat(valor)
  if (isNaN(v)) return ''
  if (tipo === 'logmar') return v
  if (tipo === 'decimal') return v <= 0 ? 1.3 : parseFloat((-Math.log10(v)).toFixed(2))
  if (tipo === 'snellen') {
    const dec = v / 20
    return dec <= 0 ? 1.3 : parseFloat((-Math.log10(dec)).toFixed(2))
  }
  return v
}

export default function FormularioCurva({ onMedicionesChange, onGuardado }) {
  const [paciente, setPaciente] = useState('')
  const [documento, setDocumento] = useState('')
  const [fechaNac, setFechaNac] = useState('')
  const [ojo, setOjo] = useState('AO')
  const [iol, setIol] = useState('')
  const [refOD, setRefOD] = useState('')
  const [refOI, setRefOI] = useState('')
  const [tipoAV, setTipoAV] = useState('logmar')
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const handleValor = (d, v) => {
    const nuevo = { ...valores, [d]: v }
    setValores(nuevo)
    onMedicionesChange(
      Object.entries(nuevo)
        .filter(([, v]) => v !== '')
        .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: toLogMAR(v, tipoAV) }))
        .sort((a, b) => a.defocus - b.defocus)
    )
  }

  const handleTipoAV = (nuevoTipo) => {
    setTipoAV(nuevoTipo)
    onMedicionesChange(
      Object.entries(valores)
        .filter(([, v]) => v !== '')
        .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: toLogMAR(v, nuevoTipo) }))
        .sort((a, b) => a.defocus - b.defocus)
    )
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const mediciones = Object.entries(valores)
        .filter(([, v]) => v !== '')
        .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: toLogMAR(v, tipoAV) }))
      const res = await fetch('/api/curvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paciente, documento, fechaNac, ojo, iol, refOD, refOI, mediciones })
      })
      if (res.ok) onGuardado(true)
    } catch(e) { console.error(e) }
    setGuardando(false)
  }

  const inp = { width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.8rem', color: '#475569', marginBottom: '4px', display: 'block' }
  const sec = { fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: '1rem 0 0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b' }}>Datos del paciente</h2>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={lbl}>Nombre completo</label>
        <input style={inp} value={paciente} onChange={e => setPaciente(e.target.value)} placeholder="Nombre completo" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={lbl}>Documento / ID</label>
          <input style={inp} value={documento} onChange={e => setDocumento(e.target.value)} placeholder="CC / Pasaporte" />
        </div>
        <div>
          <label style={lbl}>Fecha de nacimiento</label>
          <input type="date" style={inp} value={fechaNac} onChange={e => setFechaNac(e.target.value)} />
        </div>
      </div>

      <p style={sec}>Refracción</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={lbl}>OD (Esf / Cil / Eje)</label>
          <input style={inp} value={refOD} onChange={e => setRefOD(e.target.value)} placeholder="+1.00 -0.50 x 90" />
        </div>
        <div>
          <label style={lbl}>OI (Esf / Cil / Eje)</label>
          <input style={inp} value={refOI} onChange={e => setRefOI(e.target.value)} placeholder="+1.00 -0.50 x 90" />
        </div>
      </div>

      <p style={sec}>IOL y medición</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={lbl}>Ojo evaluado</label>
          <select style={inp} value={ojo} onChange={e => setOjo(e.target.value)}>
            <option value="AO">Ambos (AO)</option>
            <option value="OD">Derecho (OD)</option>
            <option value="OI">Izquierdo (OI)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>IOL implantada</label>
          <input style={inp} value={iol} onChange={e => setIol(e.target.value)} placeholder="Ej: PanOptix" />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={lbl}>Tipo de AV ingresada</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['logmar','decimal','snellen'].map(t => (
            <button key={t} onClick={() => handleTipoAV(t)}
              style={{ flex: 1, padding: '6px', border: `1px solid ${tipoAV===t?'#1e40af':'#cbd5e1'}`, borderRadius: '6px', background: tipoAV===t?'#1e40af':'white', color: tipoAV===t?'white':'#475569', fontSize: '0.8rem', cursor: 'pointer' }}>
              {t==='logmar'?'LogMAR':t==='decimal'?'Decimal':'Snellen'}
            </button>
          ))}
        </div>
        {tipoAV !== 'logmar' && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Conversión automática a LogMAR</p>}
      </div>

      <p style={sec}>Agudeza visual por vergencia</p>
      <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', background: '#f8fafc', padding: '6px 12px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
          <span>Defocus</span><span style={{textAlign:'center'}}>AV</span><span style={{textAlign:'right'}}>LogMAR</span>
        </div>
        {DEFOCUS.map((d, i) => (
          <div key={d} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', alignItems: 'center', padding: '4px 12px', background: i%2===0?'white':'#fafafa', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>{d} D</span>
            <input type={tipoAV==='snellen'?'text':'number'} step="0.05"
              style={{ margin: '0 8px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '5px', fontSize: '0.85rem', textAlign: 'center' }}
              placeholder={tipoAV==='logmar'?'0.0':tipoAV==='decimal'?'0.8':'20/25'}
              value={valores[d]||''} onChange={e => handleValor(d, e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
              {valores[d] ? toLogMAR(valores[d], tipoAV) : '—'}
            </span>
          </div>
        ))}
      </div>

      <button onClick={handleGuardar} disabled={guardando||!paciente}
        style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', background: paciente?'#1e40af':'#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: paciente?'pointer':'default' }}>
        {guardando ? 'Guardando...' : 'Guardar curva'}
      </button>
    </div>
  )
}
