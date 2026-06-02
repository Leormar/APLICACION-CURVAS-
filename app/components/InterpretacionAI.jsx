'use client'
import { useState } from 'react'

export default function InterpretacionAI({ datos, curvas, onInterpretacion, onSecciones, onSugeridos }) {
  const [interpretacion, setInterpretacion] = useState('')
  const [cargando, setCargando] = useState(false)
  const [confirmFaltante, setConfirmFaltante] = useState(null)

  const ejecutarInterpretacion = async () => {
    setCargando(true)
    setInterpretacion('')
    try {
      const res = await fetch('/api/interpretar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, curvas })
      })
      const json = await res.json()
      const texto = json.interpretacion || json.error || 'Error'
      const limpio = texto.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim()
      setInterpretacion(limpio)
      if (onInterpretacion) onInterpretacion(limpio)
      if (onSecciones && json.secciones) onSecciones(json.secciones)
      if (onSugeridos && json.iolSugerido) onSugeridos(json.iolSugerido)
    } catch(e) {
      setInterpretacion('Error: ' + e.message)
    }
    setCargando(false)
  }

  const interpretar = () => {
    const odTiene = (curvas?.OD?.length || 0) >= 2
    const oiTiene = (curvas?.OI?.length || 0) >= 2
    if (odTiene && !oiTiene) { setConfirmFaltante('OI'); return }
    if (oiTiene && !odTiene) { setConfirmFaltante('OD'); return }
    ejecutarInterpretacion()
  }

  const proceder = () => {
    setConfirmFaltante(null)
    ejecutarInterpretacion()
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

      {confirmFaltante && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:'14px', padding:'1.5rem', maxWidth:'380px', width:'100%', boxShadow:'0 10px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize:'2rem', textAlign:'center', marginBottom:'0.5rem' }}>⚠️</div>
            <h3 style={{ margin:'0 0 0.5rem', fontSize:'1.05rem', textAlign:'center', color:'#1e293b' }}>
              Falta la curva del ojo {confirmFaltante === 'OD' ? 'derecho (OD)' : 'izquierdo (OI)'}
            </h3>
            <p style={{ margin:'0 0 1.25rem', fontSize:'0.88rem', color:'#475569', textAlign:'center', lineHeight:1.55 }}>
              Solo hay datos para {confirmFaltante === 'OD' ? 'el ojo izquierdo' : 'el ojo derecho'}. ¿Deseas continuar con la interpretación de un solo ojo?
            </p>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setConfirmFaltante(null)}
                style={{ flex:1, padding:'10px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:'9px', fontSize:'0.9rem', cursor:'pointer', fontWeight:500 }}>
                Cancelar
              </button>
              <button onClick={proceder}
                style={{ flex:1, padding:'10px', background:'#7c3aed', color:'white', border:'none', borderRadius:'9px', fontSize:'0.9rem', cursor:'pointer', fontWeight:600 }}>
                Proceder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
