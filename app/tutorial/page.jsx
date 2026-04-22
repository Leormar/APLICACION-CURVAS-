'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

const TUTORIAL = [
  {
    tema: 'Medición por vergencias',
    icono: '🔬',
    color: '#1e40af',
    pasos: [
      {
        titulo: 'Corrección subjetiva',
        contenido: 'El examen se realiza con la mejor corrección subjetiva del paciente. Se refracta al paciente y si mejora la AV en visión lejana por encima de 20/25, se usa esa corrección durante toda la medición de la curva de desenfoque.',
        imagen: '👓'
      },
      {
        titulo: 'Orden de medición',
        contenido: 'Se mide desde visión próxima (-5D) hacia visión lejana (0D) en pasos de 0.50D usando lentes de prueba o foróptero. Luego se continúa con vergencias positivas (+0.50D y +1.00D).',
        imagen: '📏'
      },
      {
        titulo: 'Registro de AV',
        contenido: 'En cada vergencia se registra la mejor agudeza visual lograda en escala Decimal, LogMAR o Snellen. Se deben esperar 3-5 segundos de adaptación antes de anotar el valor.',
        imagen: '📋'
      }
    ],
    preguntas: [
      {
        pregunta: '¿Con qué corrección se debe realizar el examen de curva de desenfoque?',
        opciones: [
          'Con la corrección habitual del paciente sin importar la AV',
          'Con la mejor corrección subjetiva si mejora AV lejana por encima de 20/25',
          'Sin ninguna corrección para evaluar el IOL solo',
          'Con corrección para visión cercana únicamente'
        ],
        correcta: 1
      },
      {
        pregunta: '¿En qué orden se deben medir las vergencias?',
        opciones: [
          'De visión lejana (0D) hacia visión próxima (-5D)',
          'De forma aleatoria según la comodidad del paciente',
          'De visión próxima (-5D) hacia visión lejana (0D) en pasos de 0.50D',
          'Solo medir visión lejana y cercana sin intermedios'
        ],
        correcta: 2
      },
      {
        pregunta: '¿Cuántos segundos de adaptación se recomiendan antes de registrar la AV en cada vergencia?',
        opciones: [
          'No se necesita tiempo de adaptación',
          '10-15 segundos mínimo',
          '3-5 segundos',
          '30 segundos para mayor precisión'
        ],
        correcta: 2
      }
    ]
  },
  {
    tema: 'Interpretación de la curva',
    icono: '📈',
    color: '#7c3aed',
    pasos: [
      {
        titulo: 'Rango funcional',
        contenido: 'El rango funcional corresponde a todas las vergencias donde el paciente logra una AV de 0.2 LogMAR o mejor (equivalente a 20/32 en Snellen). Este rango indica las distancias donde el paciente tiene visión funcionalmente útil para las actividades diarias.',
        imagen: '✅'
      },
      {
        titulo: 'Tipos de curva según IOL',
        contenido: 'Una curva trifocal muestra 3 picos definidos (lejos, intermedio y cerca). Una EDOF muestra una meseta extendida sin caídas bruscas. Una multifocal full range combina ambas características mostrando una curva amplia y continua desde visión lejana hasta muy próxima sin valles significativos.',
        imagen: '🔭'
      },
      {
        titulo: 'Comparación OD vs OI vs AO',
        contenido: 'La comparación entre ojo derecho, ojo izquierdo y ambos ojos permite detectar asimetrías entre los dos ojos. La curva binocular (AO) debe mostrar sumación binocular positiva, es decir, un rendimiento igual o superior al mejor ojo individual.',
        imagen: '👁'
      }
    ],
    preguntas: [
      {
        pregunta: '¿Qué valor de LogMAR define el límite del rango funcional?',
        opciones: [
          '0.1 LogMAR (20/25)',
          '0.3 LogMAR (20/40)',
          '0.2 LogMAR (20/32)',
          '0.5 LogMAR (20/63)'
        ],
        correcta: 2
      },
      {
        pregunta: '¿Cómo se diferencia una curva EDOF de una trifocal?',
        opciones: [
          'La EDOF tiene 3 picos definidos y la trifocal una meseta continua',
          'La EDOF muestra una meseta extendida sin caídas bruscas, la trifocal 3 picos definidos',
          'No hay diferencia entre ambas curvas',
          'La trifocal siempre tiene mejor visión lejana que la EDOF'
        ],
        correcta: 1
      },
      {
        pregunta: '¿Qué indica la sumación binocular positiva en la curva AO?',
        opciones: [
          'Que el ojo izquierdo es siempre mejor que el derecho',
          'Que la visión con ambos ojos es peor que con cada ojo por separado',
          'Que la curva binocular tiene rendimiento igual o superior al mejor ojo individual',
          'Que los dos ojos tienen exactamente la misma curva'
        ],
        correcta: 2
      }
    ]
  }
]

export default function Tutorial() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fase, setFase] = useState('tutorial') // tutorial | test | resultado
  const [temaActual, setTemaActual] = useState(0)
  const [pasoActual, setPasoActual] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [temaTest, setTemaTest] = useState(0)
  const [seleccion, setSeleccion] = useState(null)
  const [mostrandoFeedback, setMostrandoFeedback] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push('/login'); return }
    // Verificar si ya completó el tutorial
    const completado = localStorage.getItem(`tutorial_${session.user.email}`)
    if (completado) router.push('/')
  }, [session, status])

  const tema = TUTORIAL[temaActual]
  const paso = tema?.pasos[pasoActual]
  const temaTestActual = TUTORIAL[temaTest]
  const pregunta = temaTestActual?.preguntas[preguntaActual]

  const totalPreguntas = TUTORIAL.reduce((acc, t) => acc + t.preguntas.length, 0)
  const correctas = Object.entries(respuestas).filter(([key, val]) => {
    const [t, p] = key.split('-').map(Number)
    return TUTORIAL[t].preguntas[p].correcta === val
  }).length

  const handleSiguientePaso = () => {
    if (pasoActual < tema.pasos.length - 1) {
      setPasoActual(pasoActual + 1)
    } else if (temaActual < TUTORIAL.length - 1) {
      setTemaActual(temaActual + 1)
      setPasoActual(0)
    } else {
      setFase('test')
      setTemaTest(0)
      setPreguntaActual(0)
    }
  }

  const handleResponder = (idx) => {
    if (mostrandoFeedback) return
    setSeleccion(idx)
    setMostrandoFeedback(true)
    setRespuestas(prev => ({ ...prev, [`${temaTest}-${preguntaActual}`]: idx }))
  }

  const handleSiguientePregunta = () => {
    setSeleccion(null)
    setMostrandoFeedback(false)
    if (preguntaActual < temaTestActual.preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1)
    } else if (temaTest < TUTORIAL.length - 1) {
      setTemaTest(temaTest + 1)
      setPreguntaActual(0)
    } else {
      setFase('resultado')
    }
  }

  const handleTerminar = async () => {
    if (correctas >= 4) {
      localStorage.setItem(`tutorial_${session.user.email}`, 'true')
      // Marcar en DB
      await fetch('/api/tutorial-completado', { method: 'POST' })
      router.push('/')
    } else {
      // Reintentar
      setFase('tutorial')
      setTemaActual(0)
      setPasoActual(0)
      setRespuestas({})
      setPreguntaActual(0)
      setTemaTest(0)
      setSeleccion(null)
      setMostrandoFeedback(false)
    }
  }

  const progreso = fase === 'tutorial'
    ? ((temaActual * 3 + pasoActual) / 6) * 100
    : fase === 'test'
    ? ((temaTest * 3 + preguntaActual) / 6) * 100
    : 100

  if (status === 'loading') return null

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'16px', maxWidth:'560px', width:'100%', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg, #1e40af, #7c3aed)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'12px' }}>
          <LogoProlens size={40} />
          <div>
            <h1 style={{ margin:0, color:'white', fontSize:'1.1rem', fontWeight:800 }}>PROLENS · Formación clínica</h1>
            <p style={{ margin:0, color:'rgba(255,255,255,0.75)', fontSize:'0.78rem' }}>
              {fase==='tutorial' ? 'Tutorial de uso clínico' : fase==='test' ? 'Evaluación de conocimientos' : 'Resultado final'}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div style={{ height:6, background:'#e2e8f0' }}>
          <div style={{ height:'100%', background:'linear-gradient(90deg, #1e40af, #7c3aed)', width:`${progreso}%`, transition:'width 0.4s ease' }} />
        </div>

        <div style={{ padding:'1.5rem' }}>

          {/* FASE TUTORIAL */}
          {fase === 'tutorial' && paso && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem' }}>
                <span style={{ fontSize:'1.5rem' }}>{tema.icono}</span>
                <div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                    Tema {temaActual+1} de {TUTORIAL.length}
                  </div>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:tema.color }}>{tema.tema}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:'0.75rem', color:'#94a3b8' }}>
                  Paso {pasoActual+1}/{tema.pasos.length}
                </div>
              </div>

              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.25rem', borderLeft:`4px solid ${tema.color}` }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem', textAlign:'center' }}>{paso.imagen}</div>
                <h2 style={{ margin:'0 0 0.75rem', fontSize:'1.1rem', color:'#1e293b', fontWeight:700 }}>{paso.titulo}</h2>
                <p style={{ margin:0, fontSize:'0.92rem', color:'#475569', lineHeight:1.75 }}>{paso.contenido}</p>
              </div>

              {/* Indicadores de pasos */}
              <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginBottom:'1.25rem' }}>
                {tema.pasos.map((_, i) => (
                  <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:i<=pasoActual?tema.color:'#e2e8f0', transition:'background 0.3s' }} />
                ))}
              </div>

              <button onClick={handleSiguientePaso}
                style={{ width:'100%', padding:'0.9rem', background:tema.color, color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700 }}>
                {pasoActual < tema.pasos.length-1 ? 'Siguiente →' : temaActual < TUTORIAL.length-1 ? 'Siguiente tema →' : '✅ Iniciar evaluación'}
              </button>
            </div>
          )}

          {/* FASE TEST */}
          {fase === 'test' && pregunta && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem' }}>
                <span style={{ fontSize:'1.5rem' }}>{temaTestActual.icono}</span>
                <div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:500, textTransform:'uppercase' }}>
                    Evaluación · Tema {temaTest+1}
                  </div>
                  <div style={{ fontSize:'1rem', fontWeight:700, color:temaTestActual.color }}>{temaTestActual.tema}</div>
                </div>
                <div style={{ marginLeft:'auto', fontSize:'0.75rem', color:'#94a3b8' }}>
                  {temaTest*3+preguntaActual+1}/{totalPreguntas}
                </div>
              </div>

              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'1.25rem', marginBottom:'1rem' }}>
                <p style={{ margin:0, fontSize:'0.95rem', color:'#1e293b', fontWeight:600, lineHeight:1.6 }}>{pregunta.pregunta}</p>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'1rem' }}>
                {pregunta.opciones.map((op, i) => {
                  let bg = 'white', border = '#e2e8f0', color = '#1e293b'
                  if (mostrandoFeedback) {
                    if (i === pregunta.correcta) { bg='#dcfce7'; border='#22c55e'; color='#166534' }
                    else if (i === seleccion && i !== pregunta.correcta) { bg='#fee2e2'; border='#ef4444'; color='#991b1b' }
                  } else if (seleccion === i) {
                    bg='#eff6ff'; border=temaTestActual.color; color=temaTestActual.color
                  }
                  return (
                    <button key={i} onClick={() => handleResponder(i)}
                      style={{ padding:'0.85rem 1rem', background:bg, border:`2px solid ${border}`, borderRadius:'8px', fontSize:'0.88rem', color, cursor:'pointer', textAlign:'left', lineHeight:1.5, fontWeight:mostrandoFeedback&&i===pregunta.correcta?600:400, transition:'all 0.2s' }}>
                      <span style={{ fontWeight:700, marginRight:8 }}>{['A','B','C','D'][i]}.</span>{op}
                    </button>
                  )
                })}
              </div>

              {mostrandoFeedback && (
                <div style={{ padding:'10px 14px', borderRadius:'8px', marginBottom:'1rem', background:seleccion===pregunta.correcta?'#dcfce7':'#fee2e2', border:`1px solid ${seleccion===pregunta.correcta?'#22c55e':'#ef4444'}`, fontSize:'0.85rem', color:seleccion===pregunta.correcta?'#166534':'#991b1b' }}>
                  {seleccion===pregunta.correcta ? '✅ ¡Correcto!' : `❌ Incorrecto. La respuesta correcta es: ${pregunta.opciones[pregunta.correcta]}`}
                </div>
              )}

              {mostrandoFeedback && (
                <button onClick={handleSiguientePregunta}
                  style={{ width:'100%', padding:'0.9rem', background:temaTestActual.color, color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700 }}>
                  {temaTest===TUTORIAL.length-1 && preguntaActual===temaTestActual.preguntas.length-1 ? 'Ver resultado' : 'Siguiente pregunta →'}
                </button>
              )}
            </div>
          )}

          {/* FASE RESULTADO */}
          {fase === 'resultado' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'4rem', marginBottom:'0.5rem' }}>
                {correctas >= 4 ? '🎉' : '📚'}
              </div>
              <h2 style={{ margin:'0 0 0.5rem', fontSize:'1.4rem', color:correctas>=4?'#166534':'#92400e' }}>
                {correctas >= 4 ? '¡Evaluación aprobada!' : 'Necesitas repasar'}
              </h2>
              <p style={{ color:'#475569', margin:'0 0 1.5rem', fontSize:'0.95rem' }}>
                Respondiste correctamente <strong>{correctas} de {totalPreguntas}</strong> preguntas
              </p>

              <div style={{ display:'flex', justifyContent:'center', gap:'12px', marginBottom:'1.5rem' }}>
                {Array.from({length:totalPreguntas}).map((_,i) => {
                  const t = Math.floor(i/3)
                  const p = i%3
                  const correcta = respuestas[`${t}-${p}`] === TUTORIAL[t].preguntas[p].correcta
                  return <div key={i} style={{ width:36, height:36, borderRadius:'50%', background:correcta?'#22c55e':'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.85rem', fontWeight:700 }}>{correcta?'✓':'✗'}</div>
                })}
              </div>

              <div style={{ background:correctas>=4?'#f0fdf4':'#fefce8', border:`1px solid ${correctas>=4?'#86efac':'#fde68a'}`, borderRadius:'10px', padding:'1rem', marginBottom:'1.5rem', fontSize:'0.88rem', color:correctas>=4?'#166534':'#92400e', lineHeight:1.6 }}>
                {correctas >= 4
                  ? 'Excelente. Ya puedes usar PROLENS Curvas de Desenfoque. Encontrarás un paciente de prueba precargado para que practiques.'
                  : 'Se requieren mínimo 4 respuestas correctas para acceder a la app. Por favor repasa el tutorial e intenta de nuevo.'}
              </div>

              <button onClick={handleTerminar}
                style={{ width:'100%', padding:'0.9rem', background:correctas>=4?'#1e40af':'#f59e0b', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700 }}>
                {correctas >= 4 ? '🚀 Ingresar a la app' : '📚 Repasar tutorial'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
