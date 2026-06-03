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
import { nombreIOLDisplay } from '../lib/iol-constants'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [curvas, setCurvas] = useState({ OD: [], OI: [], AO: [] })
  const [lentes, setLentes] = useState({ OD: '', OI: '' })
  const [iolIA, setIolIA] = useState({})
  const [iolSugerido, setIolSugerido] = useState({})
  const [datos, setDatos] = useState(null)
  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [pacienteCargado, setPacienteCargado] = useState(null)
  const [interpretacion, setInterpretacion] = useState('')
  const [secciones, setSecciones] = useState(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [compartiendo, setCompartiendo] = useState(false)
  const [mostrarInforme, setMostrarInforme] = useState(false)
  const [perfil, setPerfil] = useState(null)
  const [mostrarPerfil, setMostrarPerfil] = useState(false)
  const [vistaMovil, setVistaMovil] = useState('formulario')
  const [formKey, setFormKey] = useState(0)
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(null)
  const [aceptoTerminos, setAceptoTerminos] = useState(false)
  const [mostrarTerminos, setMostrarTerminos] = useState(false)
  const [esPacientePrueba, setEsPacientePrueba] = useState(false)

  const cargarPacientePrueba = () => {
    fetch('/api/pacientes?q=Paciente+de+Prueba&tipo=apellido')
      .then(r=>r.json())
      .then(data => {
        if (!data.pacientes || data.pacientes.length === 0) {
          alert('No se encontró el "Paciente de Prueba" en la base de datos.')
          return
        }
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
        setIolIA({})
        setIolSugerido({})
        setEsPacientePrueba(true)
        setVistaMovil('graficas')
      })
      .catch(() => alert('Error cargando paciente de prueba.'))
  }

  // Si el usuario está autenticado y aprobado, cargar perfil y (solo una vez) el paciente de prueba.
  // No re-cargar al re-evaluar la sesión: en iOS Safari useSession refresca por foco/touch y borraba datos del usuario.
  useEffect(() => {
    if (session?.user?.estado !== 'aprobado') return
    setAceptoTerminos(true)
    fetch('/api/perfil').then(r=>r.json()).then(d => {
      if (d.perfil) setPerfil(d.perfil)
      else setMostrarPerfil(true)
    }).catch(()=>{})

    // Guarda contra recargas: solo una vez por pestaña, y solo si el usuario no tiene datos en pantalla.
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('prueba_cargada') === 'true') return
    if (pacienteCargado || datos) return
    sessionStorage.setItem('prueba_cargada', 'true')
    cargarPacientePrueba()
  }, [session?.user?.estado])

  const handleNuevoExamen = () => {
    setCurvas({ OD: [], OI: [], AO: [] })
    setLentes({ OD: '', OI: '' })
    setIolIA({})
    setIolSugerido({})
    setDatos(null)
    setPacienteCargado(null)
    setInterpretacion('')
    setSecciones(null)
    setVistaMovil('formulario')
    setFormKey(k => k + 1)
    setEsPacientePrueba(false)
  }

  const handleMediciones = (ojo, mediciones, lente) => {
    setCurvas(prev => ({ ...prev, [ojo]: mediciones }))
    if (ojo === 'AO') return
    // No pisar un LIO elegido por IA con un valor vacío del formulario.
    if (!lente && iolIA[ojo]) return
    setLentes(prev => ({ ...prev, [ojo]: lente }))
    // Un cambio manual real de LIO invalida la marca de IA.
    if (lente && iolIA[ojo]) setIolIA(prev => { const n = { ...prev }; delete n[ojo]; return n })
  }

  // LIO elegido por IA (examen ciego) desde la biblioteca: queda seteado para PDF y lectura.
  const handleSeleccionIOL = (ojo, nombre, similitud) => {
    setLentes(prev => ({ ...prev, [ojo]: nombre }))
    setIolIA(prev => ({ ...prev, [ojo]: { similitud } }))
  }

  // Cambio explícito del LIO en el desplegable del formulario (autoritativo).
  // Limpia cualquier marca/sugerencia previa para ese ojo.
  const handleLenteChange = (ojo, val) => {
    setLentes(prev => ({ ...prev, [ojo]: val }))
    setIolIA(prev => { if (!prev[ojo]) return prev; const n = { ...prev }; delete n[ojo]; return n })
    setIolSugerido(prev => { if (!prev[ojo]) return prev; const n = { ...prev }; delete n[ojo]; return n })
  }

  const handleGuardado = async (d) => {
  setDatos(d)
  setVistaMovil('graficas')
  // Enviar email de feedback si es la primera curva
  if (session?.user?.id && session?.user?.email) {
    try {
      await fetch('/api/feedback-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: session.user.id,
          usuarioEmail: session.user.email,
          usuarioNombre: session.user.name || session.user.email
        })
      })
    } catch(e) { console.error('feedback email error:', e) }
  }
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
    setIolIA({})
    setIolSugerido({})
    setInterpretacion('')
    setSecciones(null)
    setPacienteCargado({ paciente, examenes, refOD, refOI })
    setDatos({ paciente: paciente.nombre, documento: paciente.documento, fechaNac: paciente.fecha_nacimiento?.split?.('T')[0]||'', lentes: nuevosLentes, refOD, refOI, tipoAV: 'logmar' })
    setMostrarBuscador(false)
    setVistaMovil('graficas')
    setEsPacientePrueba(/paciente\s+de\s+prueba/i.test(paciente?.nombre || ''))
  }

  // Garantiza que haya interpretación (la genera si falta) para que el informe salga completo.
  const asegurarInterpretacion = async () => {
    if (interpretacion) return { interp: interpretacion, secc: secciones, sug: iolSugerido }
    const r = await fetch('/api/interpretar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ datos:{...datos, lentes}, curvas }) })
    const j = await r.json()
    if (j.error || !j.interpretacion) return { interp: '', secc: null, sug: iolSugerido }
    const interp = j.interpretacion.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim()
    setInterpretacion(interp); setSecciones(j.secciones||null); if (j.iolSugerido) setIolSugerido(j.iolSugerido)
    return { interp, secc: j.secciones||null, sug: j.iolSugerido||iolSugerido }
  }

  const generarPDF = async (modo='medico') => {
    if (!datos) return
    setGenerandoPDF(true)
    try {
      const { interp, secc, sug } = await asegurarInterpretacion()
      const res = await fetch('/api/pdf', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...datos, curvas, lentes, iolIA, iolSugerido:sug, interpretacion:interp, secciones:secc, perfil, modo}) })
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

  const compartirInforme = async (modo='medico') => {
    if (!datos) return
    setCompartiendo(true)
    try {
      const { interp, secc, sug } = await asegurarInterpretacion()
      const res = await fetch('/api/informe', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...datos, curvas, lentes, iolIA, iolSugerido:sug, interpretacion:interp, secciones:secc, perfil, modo}) })
      const data = await res.json()
      if (!data.url) throw new Error(data.error || 'No se pudo generar el enlace')
      if (navigator.share) {
        await navigator.share({ title: `Informe ${datos.paciente||''}`.trim(), text: 'Informe de curva de desenfoque (solo lectura)', url: data.url })
      } else {
        try { await navigator.clipboard.writeText(data.url) } catch(e) {}
        window.prompt('Enlace de solo lectura (cópialo y envíalo al médico):', data.url)
      }
    } catch(e) { if (e.name !== 'AbortError') alert('Error: ' + e.message) }
    setCompartiendo(false)
  }

  const ojosConDatos = Object.entries(curvas).filter(([,m])=>m.length>=2)

  // ¿A qué ojo se parece más la curva binocular (AO)? Indica qué LIO predomina en la calidad visual binocular.
  const ojoDominanteAO = () => {
    const ao = curvas.AO || [], od = curvas.OD || [], oi = curvas.OI || []
    if (ao.length < 2) return null
    const distancia = (otra) => {
      let suma = 0, n = 0
      ao.forEach(a => {
        const m = otra.find(o => parseFloat(o.defocus) === parseFloat(a.defocus))
        if (m) { suma += Math.abs(parseFloat(a.agudeza) - parseFloat(m.agudeza)); n++ }
      })
      return n > 0 ? suma / n : null
    }
    const dOD = od.length >= 2 ? distancia(od) : null
    const dOI = oi.length >= 2 ? distancia(oi) : null
    if (dOD == null && dOI == null) return null
    if (dOD == null) return { ojo:'OI' }
    if (dOI == null) return { ojo:'OD' }
    if (Math.abs(dOD - dOI) < 0.02) return { ojo:'ambos' }
    return dOD < dOI ? { ojo:'OD' } : { ojo:'OI' }
  }

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
                <strong>Términos de uso clínico</strong>
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
                <strong>Privacidad:</strong> Información en servidores seguros. No se comparte ni usa para entrenar modelos.
              </div>
              <button
                onClick={() => { setMostrarTerminos(false); signIn('google', { callbackUrl: '/', redirect: true }) }}
                style={{ width:'100%', padding:'0.9rem', background:'#1e40af', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.8 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Acepto · Ingresar con Google
              </button>
              <button
                onClick={() => { setMostrarTerminos(false); signIn('apple', { callbackUrl: '/', redirect: true }) }}
                style={{ width:'100%', padding:'0.9rem', background:'#000', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Acepto · Ingresar con Apple
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
                {['Curvas OD · OI · AO','Buscador por nombre o ID','Informes PDF con análisis clínico','App para iPhone y Android'].map((item,i) => (
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
        .btn3d { border: none; border-radius: 11px; color: #fff; font-weight: 700; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: transform .07s ease, box-shadow .07s ease, filter .12s ease; }
        .btn3d:hover { filter: brightness(1.06); }
        .btn3d:active { transform: translateY(3px); }
        .btn3d:disabled { opacity: .6; cursor: default; transform: none; }
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
              <a href="/admin" className="btn3d" style={{ padding:'0.5rem 0.9rem', background:'#7c3aed', color:'white', fontSize:'0.8rem', textDecoration:'none', boxShadow:'0 3px 0 #5b21b6, 0 5px 12px rgba(0,0,0,0.16)', display:'inline-block' }}>
                Admin
              </a>
            )}
            {datos && (
              <button onClick={handleNuevoExamen} className="btn3d"
                style={{ padding:'0.5rem 0.9rem', background:'#166534', fontSize:'0.8rem', boxShadow:'0 3px 0 #0f4424, 0 5px 12px rgba(0,0,0,0.16)', whiteSpace:'nowrap' }}>
                Nuevo examen
              </button>
            )}
            <a href="/tutorial" className="btn3d"
              style={{ padding:'0.5rem 0.9rem', background:'#475569', color:'white', fontSize:'0.8rem', textDecoration:'none', boxShadow:'0 3px 0 #334155, 0 5px 12px rgba(0,0,0,0.16)', display:'inline-block', whiteSpace:'nowrap' }}>
              Tutorial
            </a>
            <button onClick={()=>setMostrarBuscador(true)} className="btn3d"
              style={{ padding:'0.5rem 0.9rem', background:'#1e40af', fontSize:'0.8rem', boxShadow:'0 3px 0 #15307d, 0 5px 12px rgba(0,0,0,0.16)' }}>
              Buscar
            </button>
            <button onClick={cargarPacientePrueba} title="Cargar paciente de prueba" className="btn3d"
              style={{ padding:'0.5rem 0.9rem', background:'#d97706', fontSize:'0.8rem', boxShadow:'0 3px 0 #b45309, 0 5px 12px rgba(0,0,0,0.16)', whiteSpace:'nowrap' }}>
              Demo
            </button>
            {datos && (
              <button onClick={()=>setMostrarInforme(true)} disabled={generandoPDF||compartiendo} className="btn3d"
                style={{ padding:'0.5rem 1rem', background:'#0f766e', fontSize:'0.82rem', boxShadow:'0 3px 0 #0a4f48, 0 5px 12px rgba(0,0,0,0.18)', whiteSpace:'nowrap' }}>
                {(generandoPDF||compartiendo)?'…':'Informe'}
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
        {esPacientePrueba && (
          <div style={{ marginBottom:'0.75rem', padding:'0.6rem 0.9rem', background:'linear-gradient(90deg, #fef3c7, #fde68a)', border:'1px solid #f59e0b', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div>
                <strong style={{ fontSize:'0.85rem', color:'#92400e' }}>MODO DEMO — Paciente de Prueba</strong>
                <p style={{ margin:0, fontSize:'0.72rem', color:'#a16207' }}>Estos son datos de ejemplo. Crea un examen nuevo para empezar.</p>
              </div>
            </div>
            <button onClick={handleNuevoExamen} className="btn3d"
              style={{ padding:'0.5rem 0.9rem', background:'#166534', color:'white', fontSize:'0.78rem', whiteSpace:'nowrap', boxShadow:'0 3px 0 #0f4424, 0 5px 12px rgba(0,0,0,0.16)' }}>
              Nuevo examen
            </button>
          </div>
        )}
        <div className="mobile-tabs" style={{ display:'none', marginBottom:'0.75rem', background:'#f1f5f9', borderRadius:'10px', padding:'3px', gap:'3px' }}>
          {['formulario','graficas'].map(tab => (
            <button key={tab} onClick={()=>setVistaMovil(tab)}
              style={{ flex:1, padding:'8px', border:'none', borderRadius:'8px', background:vistaMovil===tab?'white':'transparent', color:vistaMovil===tab?'#1e40af':'#64748b', fontWeight:vistaMovil===tab?600:400, fontSize:'0.85rem', cursor:'pointer', boxShadow:vistaMovil===tab?'0 1px 3px rgba(0,0,0,0.1)':'none' }}>
              {tab==='formulario'?'Formulario':'Gráficas'}
            </button>
          ))}
        </div>
        <div className="layout-grid" style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:'1rem' }}>
          <div className="panel-formulario">
            <FormularioCurva key={formKey} onMedicionesChange={handleMediciones} onGuardado={handleGuardado} pacienteCargado={pacienteCargado} onLenteChange={handleLenteChange} />
          </div>
          <div className="panel-graficas" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {ojosConDatos.length===0 && (
              <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.9rem', border:'2px dashed #e2e8f0', borderRadius:'12px', flexDirection:'column', gap:'8px' }}>
                <span>Ingresa valores o busca un paciente</span>
              </div>
            )}
            {ojosConDatos.map(([ojo,med])=>(
  <div key={ojo}>
    <GraficaCurva ojo={ojo} mediciones={med} lente={lentes[ojo]} iolIA={iolIA[ojo]} />
    {ojo === 'AO' ? (() => {
      const dom = ojoDominanteAO()
      if (!dom) return null
      const lenteDe = (o) => nombreIOLDisplay(lentes[o]) ? ` (${nombreIOLDisplay(lentes[o])})` : ''
      const texto = dom.ojo === 'ambos'
        ? 'La calidad visual binocular es equilibrada: ambos ojos aportan de forma similar.'
        : `La calidad visual binocular se asemeja más al ${dom.ojo === 'OD' ? 'ojo derecho (OD)' : 'ojo izquierdo (OI)'}${lenteDe(dom.ojo)} — ese LIO predomina en la visión binocular.`
      return (
        <div style={{ marginTop:'6px', padding:'8px 12px', background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:'8px', fontSize:'0.78rem', color:'#6b21a8', lineHeight:1.55 }}>
          {texto}
        </div>
      )
    })() : (
      <button onClick={() => setMostrarBiblioteca(ojo)}
        style={{ width:'100%', marginTop:'6px', padding:'8px', background:'#eff6ff', color:'#1e40af', border:'1.5px solid #1e40af', borderRadius:'8px', fontSize:'0.78rem', cursor:'pointer', fontWeight:600 }}>
        Ver referencia IOL · {ojo}
      </button>
    )}
  </div>
))}
            {ojosConDatos.length >= 2 && (
  <GraficaComparativa curvas={curvas} lentes={lentes} />
)}
            {ojosConDatos.length>0 && (<InterpretacionAI datos={{...datos,lentes}} curvas={curvas} onInterpretacion={setInterpretacion} onSecciones={setSecciones} onSugeridos={setIolSugerido} />)}
          </div>
        </div>
        {datos && (
          <div style={{ marginTop:'0.75rem', padding:'0.6rem 1rem', background:'#dcfce7', color:'#166534', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontSize:'0.85rem' }}>{datos.paciente} · {datos.documento}</span>
            <button onClick={()=>setMostrarInforme(true)} disabled={generandoPDF||compartiendo} className="btn3d" style={{ padding:'0.5rem 1rem', background:'#166534', fontSize:'0.82rem', boxShadow:'0 3px 0 #0f4424, 0 5px 12px rgba(0,0,0,0.18)' }}>
              Informe
            </button>
          </div>
        )}
        <div style={{ marginTop:'1.5rem', textAlign:'center', padding:'0.75rem', borderTop:'1px solid #e2e8f0', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <LogoProlens size={24} />
          <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}><strong style={{ color:'#1e40af' }}>PROLENS</strong> · Dr. Leonardo Orjuela · Medellín</p>
          <p style={{ margin:0, fontSize:'0.68rem', color:'#cbd5e1' }}>MAIdx sd Bench · Análisis clínico asistido</p>
        </div>
      {mostrarInforme && (
        <div onClick={e=>e.target===e.currentTarget&&setMostrarInforme(false)}
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:'18px', padding:'1.75rem', maxWidth:'400px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.35)' }}>
            <h2 style={{ margin:'0 0 2px', fontSize:'1.15rem', color:'#1e293b' }}>Generar informe</h2>
            <p style={{ margin:'0 0 1.25rem', fontSize:'0.85rem', color:'#64748b' }}>{datos?.paciente}</p>

            <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.5rem' }}>Descargar PDF</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem', marginBottom:'1.25rem' }}>
              <button className="btn3d" disabled={generandoPDF} onClick={()=>{ setMostrarInforme(false); generarPDF('medico') }}
                style={{ padding:'0.85rem', background:'#1e40af', boxShadow:'0 4px 0 #15307d, 0 6px 14px rgba(0,0,0,0.2)', fontSize:'0.95rem' }}>
                Informe para el médico
              </button>
              <button className="btn3d" disabled={generandoPDF} onClick={()=>{ setMostrarInforme(false); generarPDF('paciente') }}
                style={{ padding:'0.85rem', background:'#0f766e', boxShadow:'0 4px 0 #0a4f48, 0 6px 14px rgba(0,0,0,0.2)', fontSize:'0.95rem' }}>
                Informe para el paciente
              </button>
            </div>

            <div style={{ fontSize:'0.7rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.5rem' }}>Compartir enlace · solo lectura</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              <button className="btn3d" disabled={compartiendo} onClick={()=>{ setMostrarInforme(false); compartirInforme('medico') }}
                style={{ padding:'0.8rem', background:'#3730a3', boxShadow:'0 4px 0 #272080, 0 6px 14px rgba(0,0,0,0.2)', fontSize:'0.92rem' }}>
                Enlace para el médico
              </button>
              <button className="btn3d" disabled={compartiendo} onClick={()=>{ setMostrarInforme(false); compartirInforme('paciente') }}
                style={{ padding:'0.8rem', background:'#7c3aed', boxShadow:'0 4px 0 #5b21b6, 0 6px 14px rgba(0,0,0,0.2)', fontSize:'0.92rem' }}>
                Enlace para el paciente
              </button>
            </div>

            <button onClick={()=>setMostrarInforme(false)}
              style={{ marginTop:'1.25rem', width:'100%', padding:'0.6rem', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'0.9rem' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {mostrarBiblioteca && (
          <BibliotecaIOL
            curvaActual={curvas[mostrarBiblioteca]}
            nombreIOL={lentes[mostrarBiblioteca]}
            ojo={mostrarBiblioteca}
            onCerrar={() => setMostrarBiblioteca(null)}
            onSeleccionarIOL={handleSeleccionIOL}
          />
        )}
      </main>
    </>
  )
}
