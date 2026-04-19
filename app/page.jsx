'use client'
import { useState } from 'react'
import GraficaCurva from './components/GraficaCurva'
import FormularioCurva from './components/FormularioCurva'
import InterpretacionAI from './components/InterpretacionAI'

export default function Home() {
  const [curvas, setCurvas] = useState({ OD: [], OI: [], AO: [] })
  const [lentes, setLentes] = useState({ OD: '', OI: '', AO: '' })
  const [datos, setDatos] = useState(null)

  const handleMediciones = (ojo, mediciones, lente) => {
    setCurvas(prev => ({ ...prev, [ojo]: mediciones }))
    setLentes(prev => ({ ...prev, [ojo]: lente }))
  }

  const handleGuardado = (d) => setDatos(d)

  const generarPDF = async () => {
    if (!datos) return
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, curvas, lentes })
    })
    const html = await res.text()
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const ojosConDatos = Object.entries(curvas).filter(([, m]) => m.length >= 2)

  return (
    <main style={{ padding:'1.5rem', maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem', borderBottom:'2px solid #1e40af', paddingBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <h1 style={{ margin:0, color:'#1e40af', fontSize:'1.4rem' }}>Curvas de Desenfoque</h1>
          <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:'0.9rem' }}>Análisis de IOL multifocal · PROLENS Medellín</p>
        </div>
        {datos && (
          <button onClick={generarPDF}
            style={{ padding:'0.5rem 1.2rem', background:'#0f766e', color:'white', border:'none', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer', fontWeight:500 }}>
            📄 Imprimir / PDF
          </button>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:'1.5rem' }}>
        <FormularioCurva onMedicionesChange={handleMediciones} onGuardado={handleGuardado} />
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {ojosConDatos.length === 0 && (
            <div style={{ height:'180px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.9rem', border:'2px dashed #e2e8f0', borderRadius:'12px' }}>
              Ingresa valores para ver las curvas
            </div>
          )}
          {ojosConDatos.map(([ojo, mediciones]) => (
            <GraficaCurva key={ojo} ojo={ojo} mediciones={mediciones} lente={lentes[ojo]} />
          ))}
          {datos && <InterpretacionAI datos={{ ...datos, lentes }} curvas={curvas} />}
        </div>
      </div>
      {datos && (
        <div style={{ marginTop:'1rem', padding:'0.75rem 1rem', background:'#dcfce7', color:'#166534', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>✓ Curva guardada correctamente</span>
          <button onClick={generarPDF} style={{ padding:'4px 14px', background:'#166534', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }}>
            Imprimir / PDF
          </button>
        </div>
      )}
    </main>
  )
}
