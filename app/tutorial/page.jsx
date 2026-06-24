'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

const IconoOjo = ({color='#1e40af'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 5C7 5 2.5 9.5 1.5 12c1 2.5 5.5 7 10.5 7s9.5-4.5 10.5-7C21.5 9.5 17 5 12 5z"/>
  <circle cx="12" cy="12" r="3.5"/>
  <circle cx="12" cy="12" r="1.5" fill={color}/>
  <path d="M12 8.5V7M12 17v-1.5M7.5 12H6M18 12h-1.5" strokeWidth="1"/>
</svg>

const IconoRegla = ({color='#1e40af'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <rect x="2" y="6" width="20" height="12" rx="2"/>
  <path d="M6 6v3M9 6v2M12 6v3M15 6v2M18 6v3"/>
  <path d="M2 12h20" strokeWidth="0.75" strokeDasharray="2,1"/>
</svg>

const IconoClipboard = ({color='#1e40af'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
  <rect x="9" y="3" width="6" height="4" rx="1.5"/>
  <path d="M9 12h6M9 16h4"/>
  <circle cx="7.5" cy="12" r="0.75" fill={color}/>
  <circle cx="7.5" cy="16" r="0.75" fill={color}/>
</svg>

const IconoGrafica = ({color='#7c3aed'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 20h18M3 20V4"/>
  <path d="M3 16l4-4 3 3 4-5 4 2" strokeWidth="2" strokeLinejoin="round"/>
  <circle cx="7" cy="12" r="1.5" fill={color}/>
  <circle cx="10" cy="15" r="1.5" fill={color}/>
  <circle cx="14" cy="10" r="1.5" fill={color}/>
  <circle cx="18" cy="12" r="1.5" fill={color}/>
  <line x1="3" y1="14" x2="21" y2="14" stroke={color} strokeWidth="0.6" strokeDasharray="3,2" opacity="0.5"/>
</svg>

const IconoLente = ({color='#7c3aed'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <ellipse cx="12" cy="12" rx="10" ry="6"/>
  <ellipse cx="12" cy="12" rx="6" ry="6"/>
  <circle cx="12" cy="12" r="2.5" fill={color} opacity="0.3"/>
  <circle cx="12" cy="12" r="1" fill={color}/>
  <path d="M2 12h3M19 12h3" strokeWidth="1.2"/>
  <path d="M9.5 6.5l1 1M14.5 6.5l-1 1" strokeWidth="1" opacity="0.6"/>
</svg>

const IconoComparar = ({color='#7c3aed'}) => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 18l4-8 3 5 2-3 4 6" stroke="#1e40af" strokeWidth="2" strokeLinejoin="round"/>
  <path d="M3 18l4-6 3 3 2-4 4 4" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeDasharray="2,1"/>
  <line x1="3" y1="14" x2="21" y2="14" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="3,2"/>
  <path d="M3 4v16M3 20h18" stroke="#94a3b8" strokeWidth="1"/>
</svg>

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
  },
  {
    tema: 'Tipos de LIO y modo de examen',
    color: '#0f766e',
    bg: '#f0fdfa',
    pasos: [
      {
        titulo: 'Tipos de LIO y su curva',
        contenido: 'Cada tipo de LIO deja una forma de curva distinta. Monofocal / Monofocal plus: enfocan sobre todo de lejos (la plus extiende algo el intermedio). EDOF (rango extendido): meseta continua de lejos a intermedio con visión cercana funcional. Trifocal: tres focos definidos (lejos, intermedio y cerca), su curva muestra tres picos. Full range: visión continua y amplia de lejos a cerca, sin valles marcados. Por eso la forma de la curva permite reconocer a qué LIO se parece.',
        icono: <IconoLente color="#0f766e" />
      },
      {
        titulo: 'Modo de examen: con LIO, ciego o sin LIO',
        contenido: 'En cada ojo eliges una de tres opciones. 1) Un LIO del catálogo: cuando conoces el modelo implantado; la app compara la curva con ese LIO. 2) Valoración ciega: hay LIO implantado pero no sabes cuál; la app lo deduce por la forma de la curva (evaluación no sesgada por conocer el lente). 3) Sin IOL · ojo no operado: el ojo conserva su cristalino natural; la app no sugiere ningún lente.',
        icono: <IconoOjo color="#0f766e" />
      },
      {
        titulo: '¿Cuándo usa la app la inteligencia artificial?',
        contenido: 'Son dos cosas distintas. (a) La identificación del LIO por la curva es un CÁLCULO matemático de similitud: no usa IA generativa ni consume créditos, y es reproducible. (b) La interpretación clínica escrita del informe SÍ usa IA (Claude de Anthropic). En un ojo marcado "sin LIO" la app no sugiere ningún lente. En todos los casos tú revisas y decides.',
        icono: <IconoComparar color="#0f766e" />
      }
    ],
    preguntas: [
      {
        pregunta: '¿Qué patrón de curva corresponde a un LIO trifocal?',
        opciones: ['Una meseta plana sin picos','Tres picos definidos: lejos, intermedio y cerca','Una caída brusca después de lejos','Una sola subida en cerca'],
        correcta: 1
      },
      {
        pregunta: 'El ojo tiene LIO implantado pero no conoces el modelo. ¿Qué opción eliges?',
        opciones: ['Sin IOL · ojo no operado','Valoración ciega (la app lo deduce por la curva)','Cualquier LIO del catálogo al azar','No registrar ese ojo'],
        correcta: 1
      },
      {
        pregunta: '¿La identificación del LIO por la curva usa IA generativa?',
        opciones: ['Sí, escribe el informe con IA','No, es un cálculo de similitud; la IA solo redacta la interpretación clínica','Sí, y consume créditos cada vez','No hace ningún cálculo'],
        correcta: 1
      }
    ]
  },
  {
    tema: 'Registro e informes',
    color: '#7c3aed',
    bg: '#faf5ff',
    pasos: [
      {
        titulo: 'Identificar el LIO por la curva',
        contenido: 'En "Ver referencia IOL" comparas la curva del paciente contra las curvas de referencia publicadas. El algoritmo calcula el porcentaje de similitud (Pareto) e indica el LIO más parecido; si hay un LIO implantado, señala si la curva concuerda con ese lente o se asemeja más a otro. Con "Usar este LIO" lo dejas asignado al examen.',
        icono: <IconoComparar color="#7c3aed" />
      },
      {
        titulo: 'Informe del médico',
        contenido: 'Es el informe completo: curvas de cada ojo con su análisis al lado, comportamiento del IOL, impacto refractivo, conclusión clínica y recomendaciones. Lo generas con el botón "Informe" como PDF o enlace de solo lectura.',
        icono: <IconoClipboard color="#7c3aed" />
      },
      {
        titulo: 'Informe del paciente y compartir',
        contenido: 'El informe del paciente muestra las curvas y su interpretación por ojo, SIN recomendaciones ni comparaciones técnicas que puedan confundirlo. Con "Compartir" generas un enlace de solo lectura (caduca a los 30 días) para enviar al paciente o a otro médico, que lo ve sin poder modificarlo.',
        icono: <IconoClipboard color="#7c3aed" />
      }
    ],
    preguntas: [
      {
        pregunta: '¿Qué muestra el informe del PACIENTE respecto al del médico?',
        opciones: ['Exactamente lo mismo','Curvas e interpretación por ojo, sin conclusión ni recomendaciones','Solo el nombre del paciente','Solo las recomendaciones'],
        correcta: 1
      },
      {
        pregunta: '¿Para qué sirve "Identificar IOL por curva"?',
        opciones: ['Para cambiar la refracción','Para encontrar el LIO de referencia más parecido a la curva','Para imprimir el informe','Para borrar el examen'],
        correcta: 1
      },
      {
        pregunta: '¿Qué hace el botón "Compartir"?',
        opciones: ['Borra el examen','Genera un enlace de solo lectura para enviar el informe','Cambia el tipo de LIO','Cierra la sesión'],
        correcta: 1
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
  const totalPasos = TUTORIAL.reduce((acc,t)=>acc+t.pasos.length,0)

  const correctas = Object.entries(respuestas).filter(([key,val])=>{
    const [t,p] = key.split('-').map(Number)
    return TUTORIAL[t].preguntas[p].correcta === val
  }).length
  const minAprobar = Math.ceil(totalPreguntas * 0.66)
  const aprobado = correctas >= minAprobar

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
    if (aprobado) {
      await fetch('/api/tutorial-completado', {method:'POST'})
      router.push('/')
    } else {
      setFase('tutorial'); setTemaActual(0); setPasoActual(0)
      setRespuestas({}); setPreguntaActual(0); setTemaTest(0)
      setSeleccion(null); setMostrandoFeedback(false)
    }
  }

  const progreso = fase==='tutorial'
    ? ((temaActual*3+pasoActual)/totalPasos)*100
    : fase==='test' ? ((temaTest*3+preguntaActual)/totalPreguntas)*100 : 100

  if (status==='loading') return null

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0c2461 0%,#1e40af 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <style>{`.btn3d{-webkit-tap-highlight-color:transparent;transition:transform .07s ease,filter .12s ease}.btn3d:hover{filter:brightness(1.06)}.btn3d:active{transform:translateY(3px)}`}</style>
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

              <button onClick={handleSiguientePaso} className="btn3d"
                style={{width:'100%',padding:'1rem',background:tema.color,color:'white',border:'none',borderRadius:'12px',fontSize:'1.1rem',cursor:'pointer',fontWeight:700,letterSpacing:'0.3px',boxShadow:'0 4px 0 rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.18)'}}>
                {pasoActual<tema.pasos.length-1?'Siguiente':temaActual<TUTORIAL.length-1?'Siguiente tema':'Iniciar evaluación'}
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
                  {seleccion===pregunta.correcta?'¡Correcto!':`Respuesta correcta: ${pregunta.opciones[pregunta.correcta]}`}
                </div>
              )}

              {mostrandoFeedback && (
                <button onClick={handleSiguientePregunta} className="btn3d"
                  style={{width:'100%',padding:'1rem',background:temaTestActual.color,color:'white',border:'none',borderRadius:'12px',fontSize:'1.1rem',cursor:'pointer',fontWeight:700,boxShadow:'0 4px 0 rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.18)'}}>
                  {temaTest===TUTORIAL.length-1&&preguntaActual===temaTestActual.preguntas.length-1?'Ver resultado':'Siguiente'}
                </button>
              )}
            </div>
          )}

          {/* RESULTADO */}
          {fase==='resultado' && (
            <div style={{textAlign:'center'}}>
              <div style={{width:84,height:84,borderRadius:'50%',margin:'0 auto 1rem',display:'flex',alignItems:'center',justifyContent:'center',background:aprobado?'#dcfce7':'#fef3c7'}}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={aprobado?'#16a34a':'#d97706'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {aprobado ? <path d="M5 13l4 4L19 7"/> : <g><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></g>}
                </svg>
              </div>
              <h2 style={{margin:'0 0 0.5rem',fontSize:'1.6rem',fontWeight:800,color:aprobado?'#166534':'#92400e'}}>
                {aprobado?'¡Evaluación aprobada!':'Necesitas repasar'}
              </h2>
              <p style={{color:'#475569',margin:'0 0 1.5rem',fontSize:'1rem'}}>
                Respondiste <strong>{correctas} de {totalPreguntas}</strong> preguntas correctamente
              </p>
              <div style={{display:'flex',justifyContent:'center',gap:'10px',marginBottom:'1.5rem'}}>
                {Array.from({length:totalPreguntas}).map((_,i)=>{
                  const t=Math.floor(i/3),p=i%3
                  const ok=respuestas[`${t}-${p}`]===TUTORIAL[t].preguntas[p].correcta
                  return <div key={i} style={{width:40,height:40,borderRadius:'50%',background:ok?'#22c55e':'#ef4444',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{ok?<path d="M5 13l4 4L19 7"/>:<path d="M6 6l12 12M18 6L6 18"/>}</svg>
                  </div>
                })}
              </div>
              <div style={{background:aprobado?'#f0fdf4':'#fefce8',border:`1px solid ${aprobado?'#86efac':'#fde68a'}`,borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem',fontSize:'1rem',color:aprobado?'#166534':'#92400e',lineHeight:1.7}}>
                {aprobado
                  ?'Excelente. Ya puedes usar PROLENS Curvas de Desenfoque. Encontrarás un paciente de prueba disponible en el buscador para que practiques.'
                  :`Se requieren mínimo ${minAprobar} respuestas correctas. Por favor repasa el tutorial e intenta de nuevo.`}
              </div>
              <button onClick={handleTerminar} className="btn3d"
                style={{width:'100%',padding:'1rem',background:aprobado?'#1e40af':'#f59e0b',color:'white',border:'none',borderRadius:'12px',fontSize:'1.1rem',cursor:'pointer',fontWeight:800,boxShadow:'0 4px 0 rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.18)'}}>
                {aprobado?'Ingresar a la app':'Repasar tutorial'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
