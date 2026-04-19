'use client'
import { useState } from 'react'

const DEFOCUS = ['+1.00','+0.50','0.00','-0.50','-1.00','-1.50','-2.00','-2.50','-3.00','-3.50','-4.00','-4.50','-5.00']

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
  const [ojo, setOjo] = useState('AO')
  const [iol, setIol] = useState('')
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
        .sort((a, b) => b.defocus - a.defocus)
    )
  }

  const handleTipoAV = (nuevoTipo) => {
    setTipoAV(nuevoTipo)
    onMedicionesChange(
      Object.entries(valores)
        .filter(([, v]) => v !== '')
        .map(([d, v]) => ({ defocus: parseFloat(d), agudeza: toLogMAR(v, nuevoTipo) }))
        .sort((a, b) => b.defocus - a.defocus)
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
        body: JSON.stringify({ paciente, ojo, iol, mediciones })
      })
      if (res.ok) onGuardado(true)
    } catch(e) { console.error(e) }
    setGuardando(false)
  }

  const inp = { width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.8rem', color: '#475569', marginBottom: '4px', display: 'block' }

  const placeholder = tipoAV === 'logmar' ? '0.0' : tipoAV === 'decimal' ? '0.8' : '20/25'

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b' }}>Datos del paciente</h2>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={lbl}>Nombre</label>
        <input style={inp} value={paciente} onChange={e => setPaciente(e.target.value)} placeholder="Nombre completo" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={lbl}>Ojo</label>
          <select style={inp} value={ojo} onChange={e => setOjo(e.target.value)}>
            <option value="AO">Ambos (AO)</option>
            <option value="OD">Derecho (OD)</option>
            <option value="OI">Izquierdo (OI)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>IOL</label>
          <input style={inp} value={iol} onChange={e => setIol(e.target.value)} placeholder="Ej: PanOptix" />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={lbl}>Tipo de AV ingresada</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['logmar', 'decimal', 'snellen'].map(t => (
            <button key={t} onClick={() => handleTipoAV(t)}
              style={{ flex: 1, padding: '6px', border: `1px solid ${tipoAV === t ? '#1e40af' : '#cbd5e1'}`, borderRadius: '6px', background: tipoAV === t ? '#1e40af' : 'white', color: tipoAV === t ? 'white' : '#475569', fontSize: '0.8rem', cursor: 'pointer', fontWeight: tipoAV === t ? 600 : 400 }}>
              {t === 'logmar' ? 'LogMAR' : t === 'decimal' ? 'Decimal' : 'Snellen'}
            </button>
          ))}
        </div>
        {tipoAV !== 'logmar' && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Se convierte automáticamente a LogMAR</p>}
      </div>

      <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#1e293b' }}>Agudeza visual</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        {DEFOCUS.map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', width: '52px', textAlign: 'right' }}>{d}D</span>
            <input type={tipoAV === 'snellen' ? 'text' : 'number'} step="0.05"
              style={{ ...inp, width: '80px' }} placeholder={placeholder}
              value={valores[d] || ''} onChange={e => handleValor(d, e.target.value)} />
            {valores[d] && tipoAV !== 'logmar' && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{toLogMAR(valores[d], tipoAV)}</span>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleGuardar} disabled={guardando || !paciente}
        style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', background: paciente ? '#1e40af' : '#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: paciente ? 'pointer' : 'default' }}>
        {guardando ? 'Guardando...' : 'Guardar curva'}
      </button>
    </div>
  )
}
