'use client'
import { useState } from 'react'

export default function InterpretacionAI({ datos, mediciones }) {
  const [interpretacion, setInterpretacion] = useState('')
  const [cargando, setCargando] = useState(false)

  const interpretar = async () => {
    setCargando(true)
    try {
      const res = await fetch('/api/interpretar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, mediciones })
      })
      const json = await res.json()
      setInterpretacion(json.interpretacion)
    } catch(e) { console.error(e) }
    setCargando(false)
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>🤖 Interpretación clínica AI</h2>
        <button onClick={interpretar} disabled={cargando}
          style={{ padding: '6px 14px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '7px', fontSize: '0.85rem', cursor: 'pointer' }}>
          {cargando ? 'Analizando...' : 'Interpretar curva'}
        </button>
      </div>
      {interpretacion ? (
        <div style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: '#faf5ff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
          {interpretacion}
        </div>
      ) : (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Guarda la curva y haz click en "Interpretar curva" para obtener un análisis clínico automatizado.</p>
      )}
    </div>
  )
}
