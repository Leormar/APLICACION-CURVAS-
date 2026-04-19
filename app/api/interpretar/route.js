export async function POST(req) {
  try {
    const { datos, curvas } = await req.json()

    const VERGENCIAS = {
      '1':'VP extrema','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
      '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
      '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
    }

    const formatearCurva = (med, ojo) => {
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
    const seccionesOjo = ojosConDatos.map(o => formatearCurva(curvas[o], o)).join('\n\n')

    const prompt = `Eres un optometrista especialista en lentes intraoculares multifocales y EDOF. Analiza estas curvas de desenfoque y genera un informe clínico en español. Escribe en texto plano sin símbolos markdown, sin asteriscos, sin numerales, sin guiones como viñetas. Usa solo texto corrido con saltos de línea para separar secciones.

DATOS DEL PACIENTE:
Nombre: ${datos?.paciente || 'No especificado'}
Refracción OD: ${datos?.refOD || 'no registrada'}
Refracción OI: ${datos?.refOI || 'no registrada'}

CURVAS DE DESENFOQUE:
${seccionesOjo}

Genera el informe con estas secciones claramente separadas, en texto plano:

RENDIMIENTO POR DISTANCIA
Describe visión lejana, intermedia, cercana y muy cercana con los valores LogMAR y equivalente Snellen aproximado para cada ojo evaluado.

ANÁLISIS POR VERGENCIAS
Para cada ojo, indica el rendimiento en cada rango vergencial en texto corrido.

COMPORTAMIENTO DEL IOL
Describe si el perfil de la curva es típico para el tipo de IOL implantado, si hay predominancia para alguna distancia, y si hay diferencia significativa entre OD y OI.

IMPACTO REFRACTIVO
Evalúa si la refracción registrada puede estar afectando el rendimiento visual y si se sugiere ajuste.

RECOMENDACIONES CLÍNICAS
Indica conducta a seguir, si requiere control, corrección adicional o neuroadaptación.`

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
    const interpretacion = json.content?.[0]?.text || 'No se pudo generar la interpretación.'
    return Response.json({ interpretacion })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
