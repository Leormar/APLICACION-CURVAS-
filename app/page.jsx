'use client'
import { useState } from 'react'
import GraficaCurva from './components/GraficaCurva'
import FormularioCurva from './components/FormularioCurva'

export default function Home() {
  const [mediciones, setMediciones] = useState([])
  const [guardado, setGuardado] = useState(false)
  return (
    <main style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '2px solid #1e40af', paddingBottom: '1rem' }}>
        <h1 style={{ margin: 0, color: '#1e40af', fontSize: '1.4rem' }}>Curvas de Desenfoque</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Análisis de IOL multifocal</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <FormularioCurva onMedicionesChange={setMediciones} onGuardado={setGuardado} />
        <GraficaCurva mediciones={mediciones} />
      </div>
      {guardado && <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px' }}>✓ Curva guardada</div>}
    </main>
  )
}
