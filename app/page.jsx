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
  const [secciones, setSecciones] = useState(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [vistaMovil, setVistaMovil] = useState('formulario')

  const handleMediciones = (ojo, mediciones, lente) => {
    setCurvas(prev => ({ ...prev, [ojo]: mediciones }))
    if (ojo !== 'AO') setLentes(prev => ({ ...prev, [ojo]: lente }))
  }

  const handleGuardado = (d) => {
    setDatos(d)
    setVistaMovil('graficas')
  }

  const handleCargarExamen = ({ paciente, examenes }) => {
    const nuevasCurvas = { OD: [], OI: [], AO: [] }
    const nuevosLentes = { OD: '', OI: '' }
    let refOD = '', refOI = ''
    examenes.forEach(curva => {
      const med = (curva.mediciones||[])
        .filter(m=>m&&m.defocus!==null&&m.agudeza!==null)
        .map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)}))
        .sort((a,b)=>a.defocus-b.defocus)
      const ojoKey = curva.ojo||'OD'
      if (med.length > 0) nuevasCurvas[ojoKey] = med
      if (ojoKey !== 'AO') nuevosLentes[ojoKey] = curva.iol||''
      if (curva.refOD) refOD = curva.refOD
      if (curva.refOI) refOI = curva.refOI
    })
    setCurvas(nuevasCurvas)
    setLentes(nuevosLentes)
    setInterpretacion('')
    setSecciones(null)
    setPacienteCargado({ paciente, examenes, refOD, refOI })
    setDatos({
      paciente: paciente.nombre,
      documento: paciente.documento,
      fechaNac: paciente.fecha_nacimiento?.split?.('T')[0]||'',
      lentes: nuevosLentes,
      refOD, refOI,
      tipoAV: 'logmar'
    })
    setMostrarBuscador(false)
    setVistaMovil('graficas')
  }

  const generarPDF = async () => {
    if (!datos) return
    setGenerandoPDF(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, curvas, lentes, interpretacion, secciones })
      })
      if (!res.ok) throw new Error('Error ' + res.status)
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const nombre = `CurvaDesenfoque_${(datos.paciente||'p').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}_${datos.documento||''}`
      const win = window.open(url, '_blank')
      if (!win) {
        const a = document.createElement('a')
        a.href = url
        a.download = nombre + '.html'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        win.addEventListener('load', () => {
          try { win.document.title = nombre } catch(e){}
          setTimeout(() => win.print(), 700)
        })
      }
    } catch(e) { alert('Error: ' + e.message) }
    setGenerandoPDF(false)
  }

  const ojosConDatos = Object.entries(curvas).filter(([,m])=>m.length>=2)

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .layout-grid { grid-template-columns: 1fr !important; }
          .desktop-only { display: none !important; }
          .mobile-tabs { display: flex !important; }
          .panel-formulario { display: ${vistaMovil==='formulario'?'block':'none'} !important; }
          .panel-graficas { display: ${vistaMovil==='graficas'?'block':'none'} !important; }
        }
        @media (min-width: 769px) {
          .mobile-tabs { display: none !important; }
          .panel-formulario { display: block !important; }
          .panel-graficas { display: block !important; }
        }
      `}</style>

      <main style={{ padding:'1rem', maxWidth:'1200px', margin:'0 auto' }}>
        {mostrarBuscador && <BuscadorPacientes onCargar={handleCargarExamen} onCerrar={()=>setMostrarBuscador(false)} />}

        {/* Header */}
        <div style={{ marginBottom:'1rem', borderBottom:'2px solid #1e40af', paddingBottom:'0.75rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'8px' }}>
          <div>
            <h1 style={{ margin:0, color:'#1e40af', fontSize:'1.2rem' }}>Curvas de Desenfoque</h1>
            <p style={{ margin:'2px 0 0', color:'#64748b', fontSize:'0.8rem' }}>IOL multifocal · PROLENS Medellín</p>
          </div>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            <button onClick={()=>setMostrarBuscador(true)}
              style={{ padding:'0.4rem 0.8rem', background:'white', color:'#1e40af', border:'2px solid #1e40af', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500 }}>
              🔍 Buscar
            </button>
            {datos && (
              <button onClick={generarPDF} disabled={generandoPDF}
                style={{ padding:'0.4rem 0.8rem', background:generandoPDF?'#94a3b8':'#0f766e', color:'white', border:'none', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500 }}>
                {generandoPDF?'⏳':'📄 PDF'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs móvil */}
        <div className="mobile-tabs" style={{ display:'none', marginBottom:'1rem', background:'#f1f5f9', borderRadius:'10px', padding:'4px', gap:'4px' }}>
          {['formulario','graficas'].map(tab => (
            <button key={tab} onClick={()=>setVistaMovil(tab)}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:'7px', background:vistaMovil===tab?'white':'transparent', color:vistaMovil===tab?'#1e40af':'#64748b', fontWeight:vistaMovil===tab?600:400, fontSize:'0.85rem', cursor:'pointer', boxShadow:vistaMovil===tab?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
              {tab==='formulario'?'📋 Formulario':'📈 Gráficas'}
            </button>
          ))}
        </div>

        {/* Layout */}
        <div className="layout-grid" style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:'1.25rem' }}>

          {/* Panel formulario */}
          <div className="panel-formulario">
            <FormularioCurva onMedicionesChange={handleMediciones} onGuardado={handleGuardado} pacienteCargado={pacienteCargado} />
          </div>

          {/* Panel gráficas */}
          <div className="panel-graficas" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {ojosConDatos.length===0 && (
              <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.9rem', border:'2px dashed #e2e8f0', borderRadius:'12px', flexDirection:'column', gap:'8px' }}>
                <span style={{ fontSize:'2rem' }}>📈</span>
                <span>Ingresa valores o busca un paciente</span>
              </div>
            )}
            {ojosConDatos.map(([ojo,med])=>(
              <GraficaCurva key={ojo} ojo={ojo} mediciones={med} lente={lentes[ojo]} />
            ))}
            {ojosConDatos.length>0 && (
              <InterpretacionAI datos={{...datos,lentes}} curvas={curvas} onInterpretacion={setInterpretacion} onSecciones={setSecciones} />
            )}
          </div>
        </div>

        {datos && (
          <div style={{ marginTop:'1rem', padding:'0.6rem 1rem', background:'#dcfce7', color:'#166534', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontSize:'0.85rem' }}>✓ {datos.paciente} · {datos.documento}</span>
            <button onClick={generarPDF} disabled={generandoPDF}
              style={{ padding:'4px 14px', background:'#166534', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.82rem' }}>
              Imprimir / PDF
            </button>
          </div>
        )}
      </main>
    </>
  )
}
