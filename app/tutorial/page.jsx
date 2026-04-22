'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

const IconoOjo = ({color='#1e40af'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

const IconoRegla = ({color='#1e40af'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z"/><path d="M3 9h4M3 15h4M9 3v4M15 3v4"/></svg>

const IconoClipboard = ({color='#1e40af'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>

const IconoGrafica = ({color='#7c3aed'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>

const IconoLente = ({color='#7c3aed'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/><path d="M4 12H2M22 12h-2M12 4V2M12 22v-2"/></svg>

const IconoComparar = ({color='#7c3aed'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/><path d="M11 12h2"/></svg>

const TUTORIAL = [
  {
    tema: 'Medición por vergencias',
    color: '#1e40af',
    bg: '#eff6ff',
    pasos: [
      {
        titulo: 'Corrección subjetiva',
        contenido: 'El examen se realiza con la mejor corrección subjetiva del paciente. Se refracta al paciente y si mejora la AV en visión lejana por encima de 20/25, se usa esa corrección durante toda la medición de la curva de desenfoque.',
        icono: <IconoOjo />
      },
      {
        titulo: 'Orden de medición',
        contenido: 'Se mide desde visión próxima (-5D) hacia visión lejana (0D) en pasos de 0.50D usando lentes de prueba o foróptero. Luego se continúa con vergencias positivas (+0.50D y +1.00D).',
        icono: <IconoRegla />
      },
      {
        titulo: 'Registro de AV',
        contenido: 'En cada vergencia se registra la mejor agudeza visual lograda en escala Decimal, LogMAR o Snellen. Se deben esperar 3-5 segundos de adaptación antes de anotar el valor.',
        icono: <IconoClipboard />
      }
    ],
    preguntas: [
      {
        pregunta: '¿Con qué corrección se debe realizar el examen de curva de desenfoque?',
        opciones: ['Con la corrección habitual sin importar la AV','Con la mejor corrección subjetiva si mejora AV lejana por encima de 20/25','Sin ninguna corrección para evaluar el IOL solo','Con corrección para visión cercana únicamente'],
        correcta: 1
      },
      {
        pregunta: '¿En qué orden se deben medir las vergencias?',
        opciones: ['De visión lejana (0D) hacia visión próxima (-5D)','De forma aleatoria','De visión próxima (-5D) hacia visión lejana (0D) en pasos de 0.50D','Solo medir visión lejana y cercana'],
        correcta: 2
      },
      {
        pregunta: '¿Cuántos segundos de adaptación se recomiendan antes de registrar la AV?',
        opciones: ['No se necesita adaptación','10-15 segundos mínimo','3-5 segundos','30 segundos'],
        correcta: 2
      }
    ]
  },
  {
    tema: 'Interpretación de la curva',
    color: '#7c3aed',
    bg: '#faf5ff',
    pasos: [
      {
        titulo: 'Rango funcional',
        contenido: 'El rango funcional corresponde a todas las vergencias donde el paciente logra una AV de 0.2 LogMAR o mejor (equivalente a 20/32 en Snellen). Este rango indica las distancias donde el paciente tiene visión funcionalmente útil para las actividades diarias.',
        icono: <IconoGrafica />
      },
      {
        titulo: 'Tipos de curva según IOL',
        contenido: 'Una curva trifocal muestra 3 picos definidos (lejos, intermedio y cerca). Una EDOF muestra una meseta extendida sin caídas bruscas. Una multifocal full range combina ambas características mostrando una curva amplia y continua desde visión lejana hasta muy próxima sin valles significativos.',
        icono: <IconoLente />
      },
      {
        titulo: 'Comparación OD vs OI vs AO',
        contenido: 'La comparación entre ojo derecho, ojo izquierdo y ambos ojos permite detectar asimetrías. La curva binocular (AO) debe mostrar sumación binocular positiva, es decir, un rendimiento igual o superior al mejor ojo individual.',
        icono: <IconoComparar />
      }
    ],
    preguntas: [
      {
        pregunta: '¿Qué valor de LogMAR define el límite del rango funcional?',
        opciones: ['0.1 LogMAR (20/25)','0.3 LogMAR (20/40)','0.2 LogMAR (20/32)','0.5 LogMAR (20/63)'],
        correcta: 2
      },
      {
        pregunta: '¿Cómo se diferencia una curva EDOF de una trifocal?',
        opciones: ['La EDOF tiene 3 picos y la trifocal una meseta','La EDOF muestra meseta extendida sin caídas, la trifocal 3 picos definidos','No hay diferencia','La trifocal siempre tiene mejor visión lejana'],
        correcta: 1
      },
      {
        pregunta: '¿Qué indica la sumación binocular positiva?',
        opciones: ['El ojo izquierdo es siempre mejor','La visión binocular es peor que monocular','La curva AO tiene rendimiento igual o superior al mejor ojo individual','Los dos ojos tienen exactamente la misma curva'],
        correcta: 2
      }
    ]
  }
]

export default function Tutorial() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fase, setFase] = useState('tutorial')
  const [temaActual, setTemaActual] = useState(0)
  const [pasoActual, setPasoActual] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [temaTest, setTemaTest] = useState(0)
  const [seleccion, setSeleccion] = useState(null)
  const [mostrandoFeedback, setMostrandoFeedback] = useState(false)

  const tema = TUTORIAL[temaActual]
  const paso = tema?.pasos[pasoActual]
  const temaTestActual = TUTORIAL[temaTest]
  const pregunta = temaTestActual?.preguntas[preguntaActual]
  const totalPreguntas = TUTORIAL.reduce((acc,t)=>acc+t.preguntas.length,0)

  const correctas = Object.entries(respuestas).filter(([key,val])=>{
    const [t,p] = key.split('-').map(Number)
    return TUTORIAL[t].preguntas[p].correcta === val
  }).length

  const handleSiguientePaso = () => {
    if (pasoActual < tema.pasos.length-1) setPasoActual(pasoActual+1)
    else if (temaActual < TUTORIAL.length-1) { setTemaActual(temaActual+1); setPasoActual(0) }
    else { setFase('test'); setTemaTest(0); setPreguntaActual(0) }
  }

  const handleResponder = (idx) => {
    if (mostrandoFeedback) return
    setSeleccion(idx)
    setMostrandoFeedback(true)
    setRespuestas(prev=>({...prev,[`${temaTest}-${preguntaActual}`]:idx}))
  }

  const handleSiguientePregunta = () => {
    setSeleccion(null)
    setMostrandoFeedback(false)
    if (preguntaActual < temaTestActual.preguntas.length-1) setPreguntaActual(preguntaActual+1)
    else if (temaTest < TUTORIAL.length-1) { setTemaTest(temaTest+1); setPreguntaActual(0) }
    else setFase('resultado')
  }

  const handleTerminar = async () => {
    if (correctas >= 4) {
      await fetch('/api/tutorial-completado', {method:'POST'})
      router.push('/')
    } else {
      setFase('tutorial'); setTemaActual(0); setPasoActual(0)
      setRespuestas({}); setPreguntaActual(0); setTemaTest(0)
      setSeleccion(null); setMostrandoFeedback(false)
    }
  }

  const progreso = fase==='tutorial'
    ? ((temaActual*3+pasoActual)/6)*100
    : fase==='test' ? ((temaTest*3+preguntaActual)/6)*100 : 100

  if (status==='loading') return null

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0c2461 0%,#1e40af 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'white',borderRadius:'20px',maxWidth:'600px',width:'100%',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.35)'}}>

        {/* Header */}
        <div style={{background:`linear-gradient(135deg,${fase==='tutorial'?(TUTORIAL[temaActual]?.color||'#1e40af'):'#7c3aed'},#0c2461)`,padding:'1.5rem 2rem',display:'flex',alignItems:'center',gap:'14px'}}>
          <LogoProlens size={44} />
          <div>
            <h1 style={{margin:0,color:'white',fontSize:'1.2rem',fontWeight:800,letterSpacing:'0.5px'}}>PROLENS · Formación clínica</h1>
            <p style={{margin:0,color:'rgba(255,255,255,0.75)',fontSize:'0.85rem'}}>
              {fase==='tutorial'?'Tutorial de uso clínico':fase==='test'?'Evaluación de conocimientos':'Resultado final'}
            </p>
          </div>
          <a href="/" style={{marginLeft:'auto',padding:'6px 14px',background:'rgba(255,255,255,0.2)',color:'white',borderRadius:'8px',textDecoration:'none',fontSize:'0.8rem'}}>← Volver</a>
        </div>

        {/* Progreso */}
        <div style={{height:5,background:'#e2e8f0'}}>
          <div style={{height:'100%',background:`linear-gradient(90deg,${TUTORIAL[temaActual]?.color||'#1e40af'},#7c3aed)`,width:`${progreso}%`,transition:'width 0.4s ease'}}/>
        </div>

        <div style={{padding:'2rem'}}>

          {/* TUTORIAL */}
          {fase==='tutorial' && paso && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.25rem'}}>
                <div style={{padding:'8px',background:tema.bg,borderRadius:'10px'}}>
                  {paso.icono}
                </div>
                <div>
                  <div style={{fontSize:'0.78rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                    Tema {temaActual+1} de {TUTORIAL.length} · Paso {pasoActual+1}/{tema.pasos.length}
                  </div>
                  <div style={{fontSize:'1.15rem',fontWeight:800,color:tema.color}}>{tema.tema}</div>
                </div>
              </div>

              <div style={{background:tema.bg,borderRadius:'14px',padding:'1.5rem',marginBottom:'1.5rem',borderLeft:`5px solid ${tema.color}`}}>
                <h2 style={{margin:'0 0 1rem',fontSize:'1.2rem',color:'#1e293b',fontWeight:700}}>{paso.titulo}</h2>
                <p style={{margin:0,fontSize:'1rem',color:'#475569',lineHeight:1.85}}>{paso.contenido}</p>
              </div>

              <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'1.5rem'}}>
                {tema.pasos.map((_,i)=>(
                  <div key={i} style={{width:10,height:10,borderRadius:'50%',background:i<=pasoActual?tema.color:'#e2e8f0',transition:'background 0.3s'}}/>
                ))}
              </div>

              <button onClick={handleSiguientePaso}
                style={{width:'100%',padding:'1rem',background:tema.color,color:'white',border:'none',borderRadius:'12px',fontSize:'1.1rem',cursor:'pointer',fontWeight:700,letterSpacing:'0.3px'}}>
                {pasoActual<tema.pasos.length-1?'Siguiente →':temaActual<TUTORIAL.length-1?'Siguiente tema →':'✅ Iniciar evaluación'}
              </button>
            </div>
          )}

          {/* TEST */}
          {fase==='test' && pregunta && (
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.25rem'}}>
                <div style={{padding:'8px',background:temaTestActual.bg,borderRadius:'10px'}}>
                  {temaTestActual.pasos[0].icono}
                </div>
                <div>
                  <div style={{fontSize:'0.78rem',color:'#94a3b8',fontWeight:600,textTransform:'uppercase'}}>
                    Evaluación · Pregunta {temaTest*3+preguntaActual+1}/{totalPreguntas}
                  </div>
                  <div style={{fontSize:'1.1rem',fontWeight:800,color:temaTestActual.color}}>{temaTestActual.tema}</div>
                </div>
              </div>

              <div style={{background:'#f8fafc',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.25rem',border:'1px solid #e2e8f0'}}>
                <p style={{margin:0,fontSize:'1rem',color:'#1e293b',fontWeight:600,lineHeight:1.7}}>{pregunta.pregunta}</p>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'1rem'}}>
                {pregunta.opciones.map((op,i)=>{
                  let bg='white',border='#e2e8f0',color='#1e293b'
                  if (mostrandoFeedback) {
                    if (i===pregunta.correcta) {bg='#dcfce7';border='#22c55e';color='#166534'}
                    else if (i===seleccion) {bg='#fee2e2';border='#ef4444';color='#991b1b'}
                  } else if (seleccion===i) {bg='#eff6ff';border=temaTestActual.color;color=temaTestActual.color}
                  return (
                    <button key={i} onClick={()=>handleResponder(i)}
                      style={{padding:'1rem 1.1rem',background:bg,border:`2px solid ${border}`,borderRadius:'10px',fontSize:'0.95rem',color,cursor:'pointer',textAlign:'left',lineHeight:1.5,fontWeight:mostrandoFeedback&&i===pregunta.correcta?600:400,transition:'all 0.2s'}}>
                      <span style={{fontWeight:700,marginRight:10,fontSize:'1rem'}}>{['A','B','C','D'][i]}.</span>{op}
                    </button>
                  )
                })}
              </div>

              {mostrandoFeedback && (
                <div style={{padding:'12px 16px',borderRadius:'10px',marginBottom:'1rem',background:seleccion===pregunta.correcta?'#dcfce7':'#fee2e2',border:`1px solid ${seleccion===pregunta.correcta?'#22c55e':'#ef4444'}`,fontSize:'0.95rem',color:seleccion===pregunta.correcta?'#166534':'#991b1b',fontWeight:500}}>
                  {seleccion===pregunta.correcta?'✅ ¡Correcto!':`❌ La respuesta correcta es: ${pregunta.opciones[pregunta.correcta]}`}
                </div>
              )}

              {mostrandoFeedback && (
                <button onClick={handleSiguientePregunta}
                  style={{width:'100%',padding:'1rem',background:temaTestActual.color,color:'white',border:'none',borderRadius:'12px',fontSize:'1.1rem',cursor:'pointer',fontWeight:700}}>
                  {temaTest===TUTORIAL.length-1&&preguntaActual===temaTestActual.preguntas.length-1?'Ver resultado':'Siguiente →'}
                </button>
              )}
            </div>
          )}

          {/* RESULTADO */}
          {fase==='resultado' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'5rem',marginBottom:'0.5rem'}}>{correctas>=4?'🎉':'📚'}</div>
              <h2 style={{margin:'0 0 0.5rem',fontSize:'1.6rem',fontWeight:800,color:correctas>=4?'#166534':'#92400e'}}>
                {correctas>=4?'¡Evaluación aprobada!':'Necesitas repasar'}
              </h2>
              <p style={{color:'#475569',margin:'0 0 1.5rem',fontSize:'1rem'}}>
                Respondiste <strong>{correctas} de {totalPreguntas}</strong> preguntas correctamente
              </p>
              <div style={{display:'flex',justifyContent:'center',gap:'10px',marginBottom:'1.5rem'}}>
                {Array.from({length:totalPreguntas}).map((_,i)=>{
                  const t=Math.floor(i/3),p=i%3
                  const ok=respuestas[`${t}-${p}`]===TUTORIAL[t].preguntas[p].correcta
                  return <div key={i} style={{width:40,height:40,borderRadius:'50%',background:ok?'#22c55e':'#ef4444',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'1rem',fontWeight:700}}>{ok?'✓':'✗'}</div>
                })}
              </div>
              <div style={{background:correctas>=4?'#f0fdf4':'#fefce8',border:`1px solid ${correctas>=4?'#86efac':'#fde68a'}`,borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem',fontSize:'1rem',color:correctas>=4?'#166534':'#92400e',lineHeight:1.7}}>
                {correctas>=4
                  ?'Excelente. Ya puedes usar PROLENS Curvas de Desenfoque. Encontrarás un paciente de prueba disponible en el buscador para que practiques.'
                  :'Se requieren mínimo 4 respuestas correctas. Por favor repasa el tutorial e intenta de nuevo.'}
              </div>
              <button onClick={handleTerminar}
                style={{width:'100%',padding:'1rem',background:correctas>=4?'#1e40af':'#f59e0b',color:'white',border:'none',borderRadius:'12px',fontSize:'1.1rem',cursor:'pointer',fontWeight:800}}>
                {correctas>=4?'🚀 Ingresar a la app':'📚 Repasar tutorial'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
