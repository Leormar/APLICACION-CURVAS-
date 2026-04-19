'use client'
import { useState } from 'react'
import GraficaCurva from './components/GraficaCurva'
import FormularioCurva from './components/FormularioCurva'
import InterpretacionAI from './components/InterpretacionAI'
import BuscadorPacientes from './components/BuscadorPacientes'

export default function Home() {
  const [curvas, setCurvas] = useState({ OD: [], OI: [], AO: [] })
  const [lentes, setLentes] = useState({ OD: '', OI: '' })
  const [datos, setDatos] = useState(null)
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [pacienteCargado, setPacienteCargado] = useState(null)
  const [interpretacion, setInterpretacion] = useState('')
  const [generandoPDF, setGenerandoPDF] = useState(false)

  const handleMediciones = (ojo, mediciones, lente) => {
    setCurvas(prev => ({ ...prev, [ojo]: mediciones }))
    if (ojo !== 'AO') setLentes(prev => ({ ...prev, [ojo]: lente }))
  }

  const handleGuardado = (d) => setDatos(d)

  const handleCargarExamen = ({ paciente, examenes }) => {
    const nuevasCurvas = { OD: [], OI: [], AO: [] }
    const nuevosLentes = { OD: '', OI: '' }
    let refOD = '', refOI = ''
    examenes.forEach(curva => {
      const mediciones = (curva.mediciones || [])
        .filter(m => m && m.defocus !== null && m.agudeza !== null)
        .map(m => ({ defocus: parseFloat(m.defocus), agudeza: parseFloat(m.agudeza) }))
        .sort((a, b) => a.defocus - b.defocus)
      const ojoKey = curva.ojo || 'OD'
      if (mediciones.length > 0) nuevasCurvas[ojoKey] = mediciones
      if (ojoKey !== 'AO') nuevosLentes[ojoKey] = curva.iol || ''
      if (curva.refOD) refOD = curva.refOD
      if (curva.refOI) refOI = curva.refOI
    })
    setCurvas(nuevasCurvas)
    setLentes(nuevosLentes)
    setInterpretacion('')
    setPacienteCargado({ paciente, examenes, refOD, refOI })
    setDatos({
      paciente: paciente.nombre,
      documento: paciente.documento,
      fechaNac: paciente.fecha_nacimiento?.split?.('T')[0] || '',
      lentes: nuevosLentes,
      refOD, refOI,
      tipoAV: 'logmar'
    })
    setMostrarBuscador(false)
  }

  const generarPDF = async () => {
    if (!datos) return
    setGenerandoPDF(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, curvas, lentes, interpretacion })
      })
      if (!res.ok) throw new Error('Error ' + res.status)
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (!win) {
        const a = document.createElement('a')
        a.href = url
        a.download = `curva-${datos.paciente?.replace(/\s+/g,'-')}-${new Date().toISOString().split('T')[0]}.html`
        a.click()
      } else {
        setTimeout(() => win.print(), 800)
      }
    } catch(e) {
      alert('Error generando PDF: ' + e.message)
    }
    setGenerandoPDF(false)
  }

  const ojosConDatos = Object.entries(curvas).filter(([, m]) => m.length >= 2)

  return (
    <main style={{ padding:'1.5rem', maxWidth:'1200px', margin:'0 auto' }}>
      {mostrarBuscador && (
        <BuscadorPacientes
          onCargar={handleCargarExamen}
          onCerrar={() => setMostrarBuscador(false)}
        />
      )}

      <div style={{ marginBottom:'1.5rem', borderBottom:'2px solid #1e40af', paddingBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <h1 style={{ margin:0, color:'#1e40af', fontSize:'1.4rem' }}>Curvas de Desenfoque</h1>
          <p style={{ margin:'4px 0 0', color:'#64748b', fontSize:'0.9rem' }}>Análisis de IOL multifocal · PROLENS Medellín</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={() => setMostrarBuscador(true)}
            style={{ padding:'0.5rem 1rem', background:'white', color:'#1e40af', border:'2px solid #1e40af', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer', fontWeight:500 }}>
            🔍 Buscar paciente
          </button>
          {datos && (
            <button onClick={generarPDF} disabled={generandoPDF}
              style={{ padding:'0.5rem 1rem', background:generandoPDF?'#94a3b8':'#0f766e', color:'white', border:'none', borderRadius:'8px', fontSize:'0.9rem', cursor:generandoPDF?'default':'pointer', fontWeight:500 }}>
              {generandoPDF ? '⏳ Generando...' : '📄 PDF'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:'1.5rem' }}>
        <FormularioCurva
          onMedicionesChange={handleMediciones}
          onGuardado={handleGuardado}
          pacienteCargado={pacienteCargado}
        />
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {ojosConDatos.length === 0 && (
            <div style={{ height:'180px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.9rem', border:'2px dashed #e2e8f0', borderRadius:'12px', flexDirection:'column', gap:'8px' }}>
              <span style={{ fontSize:'2rem' }}>📈</span>
              <span>Ingresa valores o busca un paciente</span>
            </div>
          )}
          {ojosConDatos.map(([ojo, mediciones]) => (
            <GraficaCurva key={ojo} ojo={ojo} mediciones={mediciones} lente={lentes[ojo]} />
          ))}
          {ojosConDatos.length > 0 && (
            <InterpretacionAI
              datos={{ ...datos, lentes }}
              curvas={curvas}
              onInterpretacion={setInterpretacion}
            />
          )}
        </div>
      </div>

      {datos && (
        <div style={{ marginTop:'1rem', padding:'0.75rem 1rem', background:'#dcfce7', color:'#166534', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>✓ {datos.paciente}</span>
          <button onClick={generarPDF} disabled={generandoPDF}
            style={{ padding:'4px 14px', background:'#166534', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }}>
            Imprimir / PDF
          </button>
        </div>
      )}
    </main>
  )
}
