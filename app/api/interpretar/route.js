import { getUsuarioAprobado } from '../../../lib/auth-guard'
import pool from '../../../lib/db'
import { clasificarCurva } from '../../../lib/iol-match'
import { pideSugerencia, IOL_CIEGA } from '../../../lib/iol-constants'

export async function POST(req) {
  try {
    const usuario = await getUsuarioAprobado(req)
    if (!usuario) {
      return Response.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { datos, curvas } = await req.json()

    // LIO sugerido por la curva (determinístico, sin tokens).
    // Solo para ojos con LIO real (comparación) o en "valoración ciega"; NUNCA si está sin LIO.
    const lentesIn = datos?.lentes || {}
    const iolSugerido = {}
    try {
      const refs = await pool.query('SELECT * FROM iol_referencias WHERE validado = true')
      for (const o of ['OD','OI','AO']) {
        if (!pideSugerencia(lentesIn[o])) continue
        const med = curvas?.[o]
        if (med && med.length >= 3) {
          const r = clasificarCurva(med, refs.rows)
          if (r?.top3?.[0]) iolSugerido[o] = { nombre: r.top3[0].nombre, similitud: r.top3[0].similitud }
        }
      }
    } catch (e) { console.error('iol-match en interpretar:', e.message) }

    const VERGENCIAS = {
      '1':'VP extrema','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
      '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
      '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
    }

    const formatearOjo = (med, ojo) => {
      if (!med || med.length === 0) return ''
      const lenteRaw = datos?.lentes?.[ojo]
      const lente = lenteRaw === IOL_CIEGA
        ? 'valoración ciega (tipo de LIO no especificado)'
        : (lenteRaw && lenteRaw.trim()) ? lenteRaw : 'sin implante de LIO'
      const lineas = med.sort((a,b)=>a.defocus-b.defocus).map(m => {
        const v = VERGENCIAS[String(parseFloat(m.defocus))] || ''
        return `  ${m.defocus}D (${v}): ${m.agudeza} LogMAR`
      }).join('\n')
      const funcional = med.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      const sug = iolSugerido[ojo]
      const lineaSug = sug ? `\nLIO segun curva (MAIdx): ${sug.nombre} (${sug.similitud}% de similitud)` : ''
      return `${ojo} — IOL: ${lente}${lineaSug}\n${lineas}\nRango funcional: ${funcional}`
    }

    const iolPara = (ojo) => {
      const v = datos?.lentes?.[ojo]
      if (v === IOL_CIEGA) return 'valoración ciega'
      return (v && v.trim()) ? v : 'sin implante de LIO'
    }

    const ojosConDatos = ['OD','OI','AO'].filter(o => curvas[o] && curvas[o].length >= 2)
    const seccionesOjo = ojosConDatos.map(o => formatearOjo(curvas[o], o)).join('\n\n')

    const prompt = `Eres un optometrista especialista en lentes intraoculares multifocales y EDOF. Analiza estas curvas de desenfoque y genera un informe clinico en español. Escribe en texto plano sin simbolos markdown ni asteriscos.

DATOS DEL PACIENTE:
Nombre: ${datos?.paciente || 'No especificado'}
Refraccion OD: ${datos?.refOD || 'no registrada'}
Refraccion OI: ${datos?.refOI || 'no registrada'}
IOL OD: ${iolPara('OD')}
IOL OI: ${iolPara('OI')}

Si un ojo aparece como "sin implante de LIO", refierete a el con esa frase exacta en el informe; no uses "no especificado" ni "sin LIO".

CURVAS DE DESENFOQUE:
${seccionesOjo}

Genera el informe con EXACTAMENTE este formato, usando estas lineas como encabezados:

ANALISIS OJO DERECHO (OD)
Escribe aqui el analisis de OD en 3-4 oraciones sobre vision lejana, intermedia, cercana y comportamiento del IOL.

ANALISIS OJO IZQUIERDO (OI)
Escribe aqui el analisis de OI en 3-4 oraciones.

ANALISIS BINOCULAR (AO)
Escribe aqui como se complementan ambos ojos en 2-3 oraciones.

COMPORTAMIENTO DEL IOL
Escribe aqui el tipo de curva en 2-3 oraciones. Para cada ojo:
- si tiene un LIO implantado (un nombre): usa "LIO segun curva (MAIdx)" para comparar si la
  morfologia concuerda con ese LIO o si se asemeja mas al de MAIdx (concordancia o discrepancia).
- si esta en "valoracion ciega": indica que el tipo de LIO no se especifico y que, por la
  morfologia, la curva corresponde al LIO indicado por MAIdx (LIO sugerido por IA).
- si esta "sin implante de LIO": tratalo como ojo no operado / sin LIO; NO asignes ni sugieras
  ningun LIO.

IMPACTO REFRACTIVO
Escribe aqui si la refraccion afecta los resultados en 2 oraciones.

RECOMENDACIONES
Escribe aqui la conducta clinica y seguimiento en 3-4 oraciones.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const json = await response.json()
    if (json.error) return Response.json({ error: json.error.message }, { status: 500 })
    const interpretacion = json.content?.[0]?.text || 'No se pudo generar.'

    // Extraer secciones por ojo
    const extraerSeccion = (texto, encabezado) => {
      const lineas = texto.split('\n')
      let capturando = false
      const resultado = []
      for (const linea of lineas) {
        if (linea.toUpperCase().includes(encabezado.toUpperCase())) {
          capturando = true
          continue
        }
        if (capturando) {
          const esEncabezado = /^[A-ZÁÉÍÓÚ\s\(\)]{6,}$/.test(linea.trim()) && linea.trim().length > 4
          if (esEncabezado) break
          resultado.push(linea)
        }
      }
      return resultado.join('\n').trim()
    }

    const secciones = {
      OD: extraerSeccion(interpretacion, 'ANALISIS OJO DERECHO'),
      OI: extraerSeccion(interpretacion, 'ANALISIS OJO IZQUIERDO'),
      AO: extraerSeccion(interpretacion, 'ANALISIS BINOCULAR'),
      completo: interpretacion
    }

    return Response.json({ interpretacion, secciones, iolSugerido })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
