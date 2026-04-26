'use client'
import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import GraficaCurva from './components/GraficaCurva'
import FormularioCurva from './components/FormularioCurva'
import InterpretacionAI from './components/InterpretacionAI'

import GraficaComparativa from './components/GraficaComparativa'
import BuscadorPacientes from './components/BuscadorPacientes'
import LogoProlens from './components/LogoProlens'
import BibliotecaIOL from './components/BibliotecaIOL'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [curvas, setCurvas] = useState({ OD: [], OI: [], AO: [] })
  const [lentes, setLentes] = useState({ OD: '', OI: '' })
  const [datos, setDatos] = useState(null)
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [pacienteCargado, setPacienteCargado] = useState(null)
  const [interpretacion, setInterpretacion] = useState('')
  const [secciones, setSecciones] = useState(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const [vistaMovil, setVistaMovil] = useState('formulario')
  const [formKey, setFormKey] = useState(0)
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(null)
  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [mostrarTerminos, setMostrarTerminos] = useState(false)

  // Si el usuario está autenticado y aprobado, no necesita aceptar términos manualmente
  useEffect(() => {
    if (session?.user?.estado === 'aprobado') {
      setAceptoTerminos(true)
      fetch('/api/perfil').then(r=>r.json()).then(d => {
        if (d.perfil) setPerfil(d.perfil)
        else setMostrarPerfil(true)
      })
      // Cargar paciente de prueba automaticamente
      fetch('/api/pacientes?q=Paciente+de+Prueba&tipo=apellido')
        .then(r=>r.json())
        .then(data => {
          if (!data.pacientes || data.pacientes.length === 0) return
          const rows = data.pacientes
          const pac = { nombre: rows[0].nombre, documento: rows[0].documento, fecha_nacimiento: rows[0].fecha_nacimiento }
          const examenes = rows.map(r => ({
            ojo: r.ojo,
            iol: r.notas ? (()=>{ try{ return JSON.parse(r.notas).iol||'' }catch(e){ return '' } })() : '',
            mediciones: r.mediciones || [],
            refOD: r.notas ? (()=>{ try{ return JSON.parse(r.notas).refOD||'' }catch(e){ return '' } })() : '',
            refOI: r.notas ? (()=>{ try{ return JSON.parse(r.notas).refOI||'' }catch(e){ return '' } })() : ''
          }))
          const refOD = examenes[0]?.refOD || ''
          const refOI = examenes[0]?.refOI || ''
          setPacienteCargado({ paciente: pac, examenes, refOD, refOI })
          setDatos({ paciente: pac.nombre, documento: pac.documento, fechaNac: pac.fecha_nacimiento?.split?.('T')[0]||'', lentes:{OD:'',OI:''}, refOD, refOI, tipoAV:'logmar' })
        })
        .catch(()=>{})
      // Cargar paciente de prueba si es primera vez
      const yaVioPrueba = sessionStorage.getItem('prueba_cargada')
      if (!yaVioPrueba) {
        sessionStorage.setItem('prueba_cargada', 'true')
        fetch('/api/pacientes?q=Paciente+de+Prueba&tipo=apellido')
          .then(r=>r.json())
          .then(data => {
            if (data.pacientes && data.pacientes.length > 0) {
              // Agrupar por paciente
              const p = data.pacientes[0]
              const examenes = data.pacientes.filter(x=>x.nombre===p.nombre)
              if (examenes.length > 0) {
                setPacienteCargado({
                  paciente: { nombre: p.nombre, documento: p.documento, fecha_nacimiento: p.fecha_nacimiento },
                  examenes: examenes.map(e=>({
                    ojo: e.ojo,
                    iol: e.notas ? JSON.parse(e.notas||'{}').iol : '',
                    mediciones: e.mediciones || [],
                    refOD: '', refOI: ''
                  })),
                  refOD: '', refOI: ''
                })
              }
            }
          })
          .catch(()=>{})
      }
    } else {
    }
  }, [session])

  const handleNuevoExamen = () => {
    setCurvas({ OD: [], OI: [], AO: [] })
    setLentes({ OD: '', OI: '' })
    setDatos(null)
    setPacienteCargado(null)
    setInterpretacion('')
    setSecciones(null)
    setVistaMovil('formulario')
    setFormKey(k => k + 1)
  }

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

  // Cargando sesión
  if (status === 'loading') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 100%)' }}>
        <div style={{ textAlign:'center', color:'white' }}>
          <LogoProlens size={80} />
          <p style={{ marginTop:'1rem', opacity:0.8 }}>Cargando...</p>
        </div>
      </div>
    )
  }

  // No autenticado → pantalla de login
  if (!session) {
    return (
      <>
        {mostrarTerminos && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
            <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', maxWidth:'480px', width:'100%', maxHeight:'88vh', overflowY:'auto' }}>
              <div style={{ textAlign:'center', marginBottom:'1rem' }}>
                <LogoProlens size={64} />
                <h2 style={{ margin:'10px 0 2px', color:'#1e40af', fontSize:'1.1rem', fontWeight:800 }}>PROLENS</h2>
                <p style={{ margin:0, fontSize:'0.8rem', color:'#64748b' }}>Curvas de Desenfoque · MAIdx sd Bench</p>
              </div>
              <div style={{ background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:'8px', padding:'0.75rem', marginBottom:'1rem', fontSize:'0.82rem', color:'#92400e', lineHeight:1.65 }}>
                <strong>⚠️ Términos de uso clínico</strong>
                <p style={{ margin:'6px 0 0' }}>Esta aplicación está diseñada con el modelo <strong>MAIdx sd Bench</strong> para análisis clínico de curvas de desenfoque. Los informes son <strong>únicamente apoyo diagnóstico</strong> y no reemplazan el criterio del profesional.</p>
              </div>
              <div style={{ fontSize:'0.82rem', color:'#334155', lineHeight:1.75, marginBottom:'1rem' }}>
                <p><strong>Al usar esta aplicación usted acepta:</strong></p>
                <ul style={{ paddingLeft:'1.2rem', margin:'6px 0' }}>
                  <li>Los informes son orientativos y deben ser validados por un profesional.</li>
                  <li>Los datos se almacenan de forma segura y no se comparten con terceros.</li>
                  <li>El uso de la información es responsabilidad del profesional tratante.</li>
                  <li>PROLENS no se responsabiliza por decisiones basadas solo en los informes.</li>
                  <li>Uso exclusivo para profesionales de la salud visual.</li>
                </ul>
              </div>
              <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:'8px', padding:'0.75rem', marginBottom:'1.25rem', fontSize:'0.8rem', color:'#0369a1', lineHeight:1.6 }}>
                <strong>🔒 Privacidad:</strong> Información en servidores seguros. No se comparte ni usa para entrenar modelos.
              </div>
              <button
                onClick={() => { setMostrarTerminos(false); signIn('google', { callbackUrl: '/' }) }}
                style={{ width:'100%', padding:'0.9rem', background:'#1e40af', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.8 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Acepto · Ingresar con Google
              </button>
              <button onClick={() => setMostrarTerminos(false)} style={{ width:'100%', padding:'8px', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'0.85rem' }}>Cancelar</button>
            </div>
          </div>
        )}
        <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 65%, #1d4ed8 100%)', padding:'1.5rem' }}>
          <div style={{ textAlign:'center', color:'white', maxWidth:'360px', width:'100%' }}>
            <div style={{ marginBottom:'1rem', filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.4))' }}>
              <LogoProlens size={110} />
            </div>
            <h1 style={{ margin:'0 0 4px', fontSize:'2.8rem', fontWeight:900, letterSpacing:'3px', textShadow:'0 2px 16px rgba(0,0,0,0.3)' }}>PROLENS</h1>
            <p style={{ margin:'0 0 4px', fontSize:'1.2rem', fontWeight:600, opacity:0.92 }}>Curvas de Desenfoque</p>
            <p style={{ margin:'0 0 8px', fontSize:'0.85rem', opacity:0.7 }}>Dr. Leonardo Orjuela · Medellín</p>
            <div style={{ display:'inline-block', background:'rgba(255,255,255,0.2)', borderRadius:'20px', padding:'5px 18px', marginBottom:'1.5rem', fontSize:'0.82rem', fontWeight:700, letterSpacing:'1px', border:'1px solid rgba(255,255,255,0.3)' }}>
              MAIdx sd Bench
            </div>
            <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'14px', padding:'1.25rem', marginBottom:'1.5rem', border:'1px solid rgba(255,255,255,0.18)', textAlign:'left' }}>
              <p style={{ margin:'0 0 0.75rem', fontSize:'0.95rem', lineHeight:1.7, opacity:0.95, textAlign:'center' }}>
                Herramienta clínica para análisis, registro y seguimiento de curvas de desenfoque en pacientes con IOL multifocal y EDOF.
              </p>
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:'0.75rem', display:'flex', flexDirection:'column', gap:'6px' }}>
                {['📈  Curvas OD · OI · AO','🔍  Buscador por nombre o ID','📄  Informes PDF con análisis clínico','📱  App para iPhone y Android'].map((item,i) => (
                  <div key={i} style={{ fontSize:'0.88rem', opacity:0.88 }}>{item}</div>
                ))}
              </div>
            </div>
            <button onClick={() => setMostrarTerminos(true)}
              style={{ width:'100%', padding:'1rem', background:'white', color:'#1e40af', border:'none', borderRadius:'12px', fontSize:'1.1rem', cursor:'pointer', fontWeight:800, marginBottom:'0.75rem', boxShadow:'0 4px 24px rgba(0,0,0,0.25)' }}>
              Ingresar
            </button>
            <p style={{ margin:0, fontSize:'0.75rem', opacity:0.5 }}>Uso exclusivo para profesionales de salud visual</p>
          </div>
        </div>
      </>
    )
  }

  // Autenticado pero pendiente/rechazado
  if (session.user.estado === 'pendiente') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 65%)', padding:'1.5rem' }}>
        <div style={{ textAlign:'center', color:'white', maxWidth:'380px' }}>
          <LogoProlens size={80} />
          <h2 style={{ margin:'1rem 0 0.5rem', fontSize:'1.5rem' }}>Solicitud pendiente</h2>
          <p style={{ opacity:0.85, lineHeight:1.7 }}>Hola <strong>{session.user.name}</strong>, tu solicitud está pendiente de aprobación por el administrador.</p>
          <p style={{ opacity:0.6, fontSize:'0.85rem', marginTop:'0.75rem' }}>Contacta al Dr. Leonardo Orjuela si necesitas acceso urgente.</p>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ marginTop:'1.5rem', padding:'0.75rem 2rem', background:'white', color:'#1e40af', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  if (session.user.estado === 'rechazado') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #7f1d1d 0%, #991b1b 65%)', padding:'1.5rem' }}>
        <div style={{ textAlign:'center', color:'white', maxWidth:'380px' }}>
          <LogoProlens size={80} />
          <h2 style={{ margin:'1rem 0 0.5rem' }}>Acceso denegado</h2>
          <p style={{ opacity:0.85 }}>Tu solicitud fue rechazada. Contacta al administrador.</p>
          <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ marginTop:'1.5rem', padding:'0.75rem 2rem', background:'white', color:'#991b1b', border:'none', borderRadius:'10px', fontWeight:700, cursor:'pointer' }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // App principal
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
          <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
            {session.user.rol === 'admin' && (
              <a href="/admin" style={{ padding:'0.4rem 0.8rem', background:'#7c3aed', color:'white', borderRadius:'8px', fontSize:'0.78rem', textDecoration:'none', fontWeight:500 }}>
                ⚙️ Admin
              </a>
            )}
            {datos && (
              <button onClick={handleNuevoExamen}
                style={{padding:'0.45rem 0.8rem',background:'#f0fdf4',color:'#166534',border:'2px solid #166534',borderRadius:'8px',fontSize:'0.82rem',cursor:'pointer',fontWeight:600,touchAction:'manipulation',whiteSpace:'nowrap'}}>
                ➕ Nuevo examen
              </button>
            )}
            <a href="/tutorial"
              style={{padding:'0.45rem 0.8rem',background:'#f1f5f9',color:'#475569',border:'1px solid #e2e8f0',borderRadius:'8px',fontSize:'0.78rem',textDecoration:'none',fontWeight:500,whiteSpace:'nowrap'}}>
              📚 Tutorial
            </a>
            <button onClick={()=>setMostrarBuscador(true)}
              style={{ padding:'0.45rem 0.8rem', background:'white', color:'#1e40af', border:'2px solid #1e40af', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500 }}>
              🔍 Buscar
            </button>
            {datos && (
              <button onClick={generarPDF} disabled={generandoPDF}
                style={{ padding:'0.45rem 0.8rem', background:generandoPDF?'#94a3b8':'#0f766e', color:'white', border:'none', borderRadius:'8px', fontSize:'0.82rem', cursor:'pointer', fontWeight:500 }}>
                {generandoPDF?'⏳':'📄 PDF'}
              </button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 10px', background:'#f1f5f9', borderRadius:'20px' }}>
              {session.user.image && <img src={session.user.image} style={{ width:26, height:26, borderRadius:'50%' }} />}
              <span style={{ fontSize:'0.72rem', color:'#475569', fontWeight:500, maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.user.email}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ padding:'5px 12px', background:'#ef4444', color:'white', border:'none', borderRadius:'14px', fontSize:'0.75rem', cursor:'pointer', fontWeight:600 }}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <div className="mobile-tabs" style={{ display:'none', marginBottom:'0.75rem', background:'#f1f5f9', borderRadius:'10px', padding:'3px', gap:'3px' }}>
          {['formulario','graficas'].map(tab => (
            <button key={tab} onClick={()=>setVistaMovil(tab)}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:'8px', background:vistaMovil===tab?'white':'transparent', color:vistaMovil===tab?'#1e40af':'#64748b', fontWeight:vistaMovil===tab?600:400, fontSize:'0.85rem', cursor:'pointer', boxShadow:vistaMovil===tab?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
              {tab==='formulario'?'📋 Formulario':'📈 Gráficas'}
            </button>
          ))}
        </div>
        <div className="layout-grid" style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:'1rem' }}>
          <div className="panel-formulario">
            <FormularioCurva key={formKey} onMedicionesChange={handleMediciones} onGuardado={handleGuardado} pacienteCargado={pacienteCargado} />
          </div>
          <div className="panel-graficas" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {ojosConDatos.length===0 && (
              <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.9rem', border:'2px dashed #e2e8f0', borderRadius:'12px', flexDirection:'column', gap:'8px' }}>
                <span style={{ fontSize:'2rem' }}>📈</span>
                <span>Ingresa valores o busca un paciente</span>
              </div>
            )}
            {ojosConDatos.map(([ojo,med])=>(
  <div key={ojo}>
    <GraficaCurva ojo={ojo} mediciones={med} lente={lentes[ojo]} />
    <button onClick={() => setMostrarBiblioteca(ojo)}
      style={{ width:'100%', marginTop:'6px', padding:'7px', background:'#eff6ff', color:'#1e40af', border:'1.5px solid #1e40af', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:600 }}>
      📚 Ver referencia IOL · {ojo}
    </button>
  </div>
))}
            {ojosConDatos.length >= 2 && (
  <GraficaComparativa curvas={curvas} lentes={lentes} />
)}
            {ojosConDatos.length>0 && (<InterpretacionAI datos={{...datos,lentes}} curvas={curvas} onInterpretacion={setInterpretacion} onSecciones={setSecciones} />)}
          </div>
        </div>
        {datos && (
          <div style={{ marginTop:'0.75rem', padding:'0.6rem 1rem', background:'#dcfce7', color:'#166534', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontSize:'0.85rem' }}>✓ {datos.paciente} · {datos.documento}</span>
            <button onClick={generarPDF} disabled={generandoPDF} style={{ padding:'4px 14px', background:'#166534', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.82rem' }}>
              Imprimir / PDF
            </button>
          </div>
        )}
        <div style={{ marginTop:'1.5rem', textAlign:'center', padding:'0.75rem', borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <LogoProlens size={24} />
          <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}><strong style={{ color:'#1e40af' }}>PROLENS</strong> · Dr. Leonardo Orjuela · Medellín</p>
          <p style={{ margin:0, fontSize:'0.68rem', color:'#cbd5e1' }}>MAIdx sd Bench · Análisis clínico asistido</p>
        </div>
      {mostrarBiblioteca && (
          <BibliotecaIOL
            curvaActual={curvas[mostrarBiblioteca]}
            nombreIOL={lentes[mostrarBiblioteca]}
            ojo={mostrarBiblioteca}
            onCerrar={() => setMostrarBiblioteca(null)}
          />
        )}
      </main>
    </>
  )
}
