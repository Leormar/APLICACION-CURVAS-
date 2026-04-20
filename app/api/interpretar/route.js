export async function POST(req) {
  try {
    const { datos, curvas } = await req.json()

    const VERGENCIAS = {
      '1':'VP extrema','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
      '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
      '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
    }

    const formatearOjo = (med, ojo) => {
      if (!med || med.length === 0) return ''
      const lente = datos?.lentes?.[ojo] || 'no especificado'
      const lineas = med.sort((a,b)=>a.defocus-b.defocus).map(m => {
        const v = VERGENCIAS[String(parseFloat(m.defocus))] || ''
        return `  ${m.defocus}D (${v}): ${m.agudeza} LogMAR`
      }).join('\n')
      const funcional = med.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      return `${ojo} — IOL: ${lente}\n${lineas}\nRango funcional: ${funcional}`
    }

    const ojosConDatos = ['OD','OI','AO'].filter(o => curvas[o] && curvas[o].length >= 2)
    const seccionesOjo = ojosConDatos.map(o => formatearOjo(curvas[o], o)).join('\n\n')

    const prompt = `Eres un optometrista especialista en lentes intraoculares multifocales y EDOF. Analiza estas curvas de desenfoque y genera un informe clinico en español. Escribe en texto plano sin simbolos markdown ni asteriscos.

DATOS DEL PACIENTE:
Nombre: ${datos?.paciente || 'No especificado'}
Refraccion OD: ${datos?.refOD || 'no registrada'}
Refraccion OI: ${datos?.refOI || 'no registrada'}
IOL OD: ${datos?.lentes?.OD || 'no especificado'}
IOL OI: ${datos?.lentes?.OI || 'no especificado'}

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
Escribe aqui el tipo de curva y si corresponde al IOL implantado en 2-3 oraciones.

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
        model: 'claude-sonnet-4-20250514',
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

    return Response.json({ interpretacion, secciones })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
