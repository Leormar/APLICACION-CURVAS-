'use client'
import { useState } from 'react'
import GraficaCurva from './components/GraficaCurva'
import FormularioCurva from './components/FormularioCurva'
import InterpretacionAI from './components/InterpretacionAI'
import BuscadorPacientes from './components/BuscadorPacientes'
import LogoProlens from './components/LogoProlens'

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
  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [mostrarTerminos, setMostrarTerminos] = useState(false)

  const handleMediciones = (ojo, mediciones, lente) => {
    setCurvas(prev => ({ ...prev, [ojo]: mediciones }))
    if (ojo !== 'AO') setLentes(prev => ({ ...prev, [ojo]: lente }))
  }

  const handleGuardado = (d) => { setDatos(d); setVistaMovil('graficas') }

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
    setDatos({ paciente: paciente.nombre, documento: paciente.documento, fechaNac: paciente.fecha_nacimiento?.split?.('T')[0]||'', lentes: nuevosLentes, refOD, refOI, tipoAV: 'logmar' })
    setMostrarBuscador(false)
    setVistaMovil('graficas')
  }

  const generarPDF = async () => {
    if (!datos) return
    setGenerandoPDF(true)
    try {
      const res = await fetch('/api/pdf', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...datos, curvas, lentes, interpretacion, secciones}) })
      if (!res.ok) throw new Error('Error ' + res.status)
      const html = await res.text()
      const blob = new Blob([html], { type:'text/html; charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const nombre = `CurvaDesenfoque_${(datos.paciente||'p').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}_${datos.documento||''}`
      const win = window.open(url, '_blank')
      if (!win) { const a=document.createElement('a'); a.href=url; a.download=nombre+'.html'; document.body.appendChild(a); a.click(); document.body.removeChild(a) }
      else { win.addEventListener('load', () => { try{win.document.title=nombre}catch(e){} setTimeout(()=>win.print(),700) }) }
    } catch(e) { alert('Error: '+e.message) }
    setGenerandoPDF(false)
  }

  const ojosConDatos = Object.entries(curvas).filter(([,m])=>m.length>=2)

  const ModalTerminos = () => (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', maxWidth:'480px', width:'100%', maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ textAlign:'center', marginBottom:'1rem' }}>
          <LogoProlens size={72} />
          <h2 style={{ margin:'10px 0 2px', color:'#1e40af', fontSize:'1.15rem', fontWeight:800 }}>PROLENS</h2>
          <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b' }}>Curvas de Desenfoque · MAIdx sd Bench</p>
        </div>
        <div style={{ background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.82rem', color:'#92400e', lineHeight:1.65 }}>
          <strong>⚠️ Términos de uso clínico</strong>
          <p style={{ margin:'6px 0 0' }}>Esta aplicación está diseñada con el modelo <strong>MAIdx sd Bench</strong> para el análisis clínico de curvas de desenfoque. Los informes generados son <strong>únicamente un apoyo diagnóstico</strong> y no reemplazan el criterio del profesional de la salud visual.</p>
        </div>
        <div style={{ fontSize:'0.82rem', color:'#334155', lineHeight:1.75, marginBottom:'1rem' }}>
          <p><strong>Al usar esta aplicación usted acepta:</strong></p>
          <ul style={{ paddingLeft:'1.2rem', margin:'6px 0' }}>
            <li>Los informes clínicos son orientativos y deben ser validados por un profesional calificado.</li>
            <li>Los datos clínicos se almacenan de forma segura y no se comparten con terceros.</li>
            <li>El uso de la información clínica es responsabilidad del profesional tratante.</li>
            <li>PROLENS no se hace responsable por decisiones clínicas basadas únicamente en los informes generados.</li>
            <li>Esta herramienta es de uso exclusivo para profesionales de la salud visual.</li>
          </ul>
        </div>
        <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'0.75rem', marginBottom:'1.25rem', fontSize:'0.8rem', color:'#0369a1', lineHeight:1.6 }}>
          <strong>🔒 Privacidad:</strong> La información se almacena en servidores seguros y encriptados. No se comparte con terceros ni se usa para entrenar modelos.
        </div>
        <button onClick={() => { setAceptoTerminos(true); setMostrarTerminos(false) }}
          style={{ width:'100%', padding:'0.9rem', background:'#1e40af', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'8px', touchAction:'manipulation' }}>
          ✅ Acepto — Ingresar a la app
        </button>
        <p style={{ textAlign:'center', fontSize:'0.72rem', color:'#94a3b8', margin:0 }}>Dr. Leonardo Orjuela · PROLENS · Medellín</p>
      </div>
    </div>
  )

  if (!aceptoTerminos) {
    return (
      <>
        {mostrarTerminos && <ModalTerminos />}
        <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 65%, #1d4ed8 100%)', padding:'1.5rem' }}>
          <div style={{ textAlign:'center', color:'white', maxWidth:'360px', width:'100%' }}>

            {/* Logo IOL */}
            <div style={{ marginBottom:'1rem', filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.4))' }}>
              <LogoProlens size={100} />
            </div>

            <h1 style={{ margin:'0 0 2px', fontSize:'2.2rem', fontWeight:900, letterSpacing:'2px' }}>PROLENS</h1>
            <p style={{ margin:'0 0 2px', fontSize:'1rem', fontWeight:600, opacity:0.92 }}>Curvas de Desenfoque</p>
            <p style={{ margin:'0 0 6px', fontSize:'0.78rem', opacity:0.65 }}>Dr. Leonardo Orjuela · Medellín</p>

            <div style={{ display:'inline-block', background:'rgba(255,255,255,0.18)', borderRadius:'20px', padding:'4px 16px', marginBottom:'1.5rem', fontSize:'0.75rem', fontWeight:700, letterSpacing:'1px', backdropFilter:'blur(4px)', border:'1px solid rgba(255,255,255,0.25)' }}>
              MAIdx sd Bench
            </div>

            <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'14px', padding:'1.25rem', marginBottom:'1.5rem', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.18)', textAlign:'left' }}>
              <p style={{ margin:'0 0 0.75rem', fontSize:'0.88rem', lineHeight:1.7, opacity:0.95, textAlign:'center' }}>
                Herramienta clínica para el análisis, registro y seguimiento de curvas de desenfoque en pacientes con lente intraocular multifocal y EDOF.
              </p>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:'6px' }}>
                {[
                  '📈  Curvas de desenfoque OD · OI · AO',
                  '🔍  Buscador de pacientes por nombre o ID',
                  '📄  Informes PDF con análisis clínico',
                  '📱  Disponible como app en iPhone y Android',
                ].map((item,i) => (
                  <div key={i} style={{ fontSize:'0.82rem', opacity:0.88, display:'flex', alignItems:'center', gap:'6px' }}>{item}</div>
                ))}
              </div>
            </div>

            <button onClick={() => setMostrarTerminos(true)}
              style={{ width:'100%', padding:'1rem', background:'white', color:'#1e40af', border:'none', borderRadius:'12px', fontSize:'1.1rem', cursor:'pointer', fontWeight:800, marginBottom:'0.75rem', boxShadow:'0 4px 24px rgba(0,0,0,0.25)', touchAction:'manipulation' }}>
              Ingresar
            </button>
            <p style={{ margin:0, fontSize:'0.72rem', opacity:0.5 }}>Uso exclusivo para profesionales de salud visual</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .layout-grid { grid-template-columns: 1fr !important; }
          .panel-formulario { display: ${vistaMovil==='formulario'?'block':'none'} !important; }
          .panel-graficas { display: ${vistaMovil==='graficas'?'block':'none'} !important; }
          .mobile-tabs { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-tabs { display: none !important; }
          .panel-formulario { display: block !important; }
          .panel-graficas { display: block !important; }
        }
      `}</style>
      <main style={{ padding:'0.75rem', maxWidth:'1200px', margin:'0 auto', paddingBottom:'2rem' }}>
        {mostrarBuscador && <BuscadorPacientes onCargar={handleCargarExamen} onCerrar={()=>setMostrarBuscador(false)} />}
        <div style={{ marginBottom:'0.75rem', borderBottom:'2px solid #1e40af', paddingBottom:'0.6rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'6px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <LogoProlens size={36} />
            <div>
              <h1 style={{ margin:0, color:'#1e40af', fontSize:'1.1rem', lineHeight:1.2, fontWeight:800 }}>PROLENS</h1>
              <p style={{ margin:0, color:'#64748b', fontSize:'0.72rem' }}>Dr. Leonardo Orjuela · Medellín</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'6px' }}>
            <button onClick={()=>setMostrarBuscador(true)}
              style={{ padding:'0.45rem 0.8rem', background:'white', color:'#1e40af', border:'2px solid #1e40af', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500, touchAction:'manipulation' }}>
              🔍 Buscar
            </button>
            {datos && (
              <button onClick={generarPDF} disabled={generandoPDF}
                style={{ padding:'0.45rem 0.8rem', background:generandoPDF?'#94a3b8':'#0f766e', color:'white', border:'none', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500, touchAction:'manipulation' }}>
                {generandoPDF?'⏳':'📄 PDF'}
              </button>
            )}
          </div>
        </div>
        <div className="mobile-tabs" style={{ display:'none', marginBottom:'0.75rem', background:'#f1f5f9', borderRadius:'10px', padding:'3px', gap:'3px' }}>
          {['formulario','graficas'].map(tab => (
            <button key={tab} onClick={()=>setVistaMovil(tab)}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:'8px', background:vistaMovil===tab?'white':'transparent', color:vistaMovil===tab?'#1e40af':'#64748b', fontWeight:vistaMovil===tab?600:400, fontSize:'0.85rem', cursor:'pointer', boxShadow:vistaMovil===tab?'0 1px 3px rgba(0,0,0,0.1)':'none', touchAction:'manipulation' }}>
              {tab==='formulario'?'📋 Formulario':'📈 Gráficas'}
            </button>
          ))}
        </div>
        <div className="layout-grid" style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:'1rem' }}>
          <div className="panel-formulario">
            <FormularioCurva onMedicionesChange={handleMediciones} onGuardado={handleGuardado} pacienteCargado={pacienteCargado} />
          </div>
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
          <div style={{ marginTop:'0.75rem', padding:'0.6rem 1rem', background:'#dcfce7', color:'#166534', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontSize:'0.85rem' }}>✓ {datos.paciente} · {datos.documento}</span>
            <button onClick={generarPDF} disabled={generandoPDF}
              style={{ padding:'4px 14px', background:'#166534', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.82rem', touchAction:'manipulation' }}>
              Imprimir / PDF
            </button>
          </div>
        )}
        <div style={{ marginTop:'1.5rem', textAlign:'center', padding:'0.75rem', borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <LogoProlens size={28} />
          <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>
            <strong style={{ color:'#1e40af' }}>PROLENS</strong> · Dr. Leonardo Orjuela · Medellín, Colombia
          </p>
          <p style={{ margin:0, fontSize:'0.68rem', color:'#cbd5e1' }}>MAIdx sd Bench · Análisis clínico asistido</p>
        </div>
      </main>
    </>
  )
}
