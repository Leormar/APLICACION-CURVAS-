'use client'
import { useState } from 'react'

export default function InterpretacionAI({ datos, curvas, onInterpretacion }) {
  const [interpretacion, setInterpretacion] = useState('')
  const [cargando, setCargando] = useState(false)

  const interpretar = async () => {
    setCargando(true)
    setInterpretacion('')
    try {
      const res = await fetch('/api/interpretar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, curvas })
      })
      const json = await res.json()
      const texto = json.interpretacion || json.error || 'Error al interpretar'
      const limpio = texto.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim()
      setInterpretacion(limpio)
      if (onInterpretacion) onInterpretacion(limpio)
    } catch(e) {
      setInterpretacion('Error: ' + e.message)
    }
    setCargando(false)
  }

  return (
    <div style={{ background:'white', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
        <h2 style={{ margin:0, fontSize:'1rem', color:'#1e293b' }}>🤖 Análisis clínico AI</h2>
        <button onClick={interpretar} disabled={cargando}
          style={{ padding:'6px 16px', background:cargando?'#94a3b8':'#7c3aed', color:'white', border:'none', borderRadius:'7px', fontSize:'0.85rem', cursor:cargando?'default':'pointer', fontWeight:500 }}>
          {cargando ? '⏳ Analizando...' : '✨ Interpretar curva'}
        </button>
      </div>
      {interpretacion ? (
        <div style={{ fontSize:'0.875rem', color:'#1e293b', lineHeight:1.8, whiteSpace:'pre-wrap', background:'#faf5ff', padding:'1rem', borderRadius:'8px', border:'1px solid #e9d5ff' }}>
          {interpretacion}
        </div>
      ) : (
        <p style={{ color:'#94a3b8', fontSize:'0.85rem', margin:0 }}>
          Click en "Interpretar curva" para análisis clínico por vergencias, predominancia visual y efecto refractivo. La interpretación se incluirá en el PDF.
        </p>
      )}
    </div>
  )
}
