'use client'
import { useState } from 'react'
import GraficaCurva from './components/GraficaCurva'
import FormularioCurva from './components/FormularioCurva'

export default function Home() {
  const [mediciones, setMediciones] = useState([])
  const [guardado, setGuardado] = useState(false)
  const [datos, setDatos] = useState(null)

  const handleGuardado = (d) => {
    setGuardado(true)
    setDatos(d)
  }

  const generarPDF = async () => {
    if (!datos) return
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...datos, mediciones })
    })
    const html = await res.text()
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.print()
  }

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #1e40af', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e40af', fontSize: '1.4rem' }}>Curvas de Desenfoque</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Análisis de IOL multifocal · PROLENS Medellín</p>
        </div>
        {guardado && (
          <button onClick={generarPDF}
            style={{ padding: '0.5rem 1rem', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
            📄 Generar PDF
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <FormularioCurva onMedicionesChange={setMediciones} onGuardado={handleGuardado} />
        <GraficaCurva mediciones={mediciones} />
      </div>
      {guardado && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ Curva guardada en base de datos</span>
          <button onClick={generarPDF} style={{ padding: '4px 12px', background: '#166534', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Imprimir / PDF
          </button>
        </div>
      )}
    </main>
  )
}
