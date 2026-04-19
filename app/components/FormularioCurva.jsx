'use client'
import { useState } from 'react'
const DEFOCUS = ['+2.00','+1.50','+1.00','+0.50','0.00','-0.50','-1.00','-1.50','-2.00','-2.50','-3.00','-3.50','-4.00']
export default function FormularioCurva({ onMedicionesChange, onGuardado }) {
  const [paciente, setPaciente] = useState('')
  const [ojo, setOjo] = useState('AO')
  const [iol, setIol] = useState('')
  const [valores, setValores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const handleValor = (d, v) => {
    const nuevo = { ...valores, [d]: v }
    setValores(nuevo)
    onMedicionesChange(Object.entries(nuevo).filter(([,v])=>v!=='').map(([d,v])=>({ defocus: parseFloat(d), agudeza: parseFloat(v) })).sort((a,b)=>b.defocus-a.defocus))
  }
  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const res = await fetch('/api/curvas', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ paciente, ojo, iol, mediciones: Object.entries(valores).map(([d,v])=>({ defocus: parseFloat(d), agudeza: parseFloat(v) })) }) })
      if (res.ok) onGuardado(true)
    } catch(e) { console.error(e) }
    setGuardando(false)
  }
  const inp = { width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.8rem', color: '#475569', marginBottom: '4px', display: 'block' }
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b' }}>Datos del paciente</h2>
      <div style={{ marginBottom: '0.75rem' }}><label style={lbl}>Nombre</label><input style={inp} value={paciente} onChange={e=>setPaciente(e.target.value)} placeholder="Nombre completo" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div><label style={lbl}>Ojo</label><select style={inp} value={ojo} onChange={e=>setOjo(e.target.value)}><option value="AO">Ambos (AO)</option><option value="OD">Derecho (OD)</option><option value="OI">Izquierdo (OI)</option></select></div>
        <div><label style={lbl}>IOL</label><input style={inp} value={iol} onChange={e=>setIol(e.target.value)} placeholder="Ej: PanOptix" /></div>
      </div>
      <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#1e293b' }}>Agudeza visual (LogMAR)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
        {DEFOCUS.map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', width: '48px', textAlign: 'right' }}>{d}D</span>
            <input type="number" step="0.1" min="-0.3" max="1.3" style={{ ...inp, width: '80px' }} placeholder="—" value={valores[d]||''} onChange={e=>handleValor(d,e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={handleGuardar} disabled={guardando||!paciente} style={{ marginTop: '1rem', width: '100%', padding: '0.6rem', background: paciente?'#1e40af':'#94a3b8', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: paciente?'pointer':'default' }}>
        {guardando ? 'Guardando...' : 'Guardar curva'}
      </button>
    </div>
  )
}
