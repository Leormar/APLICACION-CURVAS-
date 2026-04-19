export async function POST(req) {
  try {
    const { datos, curvas } = await req.json()

    const VERGENCIAS = {
      '1': 'VP extrema', '0.5': 'VP', '0': 'VL',
      '-0.5': '2m', '-1': '1m', '-1.5': '67cm',
      '-2': '50cm', '-2.5': '40cm', '-3': '33cm',
      '-3.5': '29cm', '-4': '25cm', '-4.5': '22cm', '-5': '20cm'
    }

    const formatearCurva = (med, ojo) => {
      if (!med || med.length === 0) return ''
      const lineas = med.sort((a,b)=>a.defocus-b.defocus).map(m => {
        const v = VERGENCIAS[String(parseFloat(m.defocus))] || ''
        return `  ${m.defocus}D (${v}): ${m.agudeza} LogMAR`
      }).join('\n')
      const funcional = med.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ')
      const lente = datos.lentes?.[ojo] || 'no especificado'
      return `${ojo} — IOL: ${lente}\n${lineas}\nRango funcional (≤0.2 LogMAR): ${funcional || 'ninguno'}`
    }

    const seccionesOjo = ['OD','OI','AO']
      .filter(o => curvas[o] && curvas[o].length >= 2)
      .map(o => formatearCurva(curvas[o], o))
      .join('\n\n')

    const prompt = `Eres un optometrista especialista en lentes intraoculares (IOL) multifocales y EDOF. Analiza estas curvas de desenfoque y genera un informe clínico detallado en español.

DATOS DEL PACIENTE:
Nombre: ${datos.paciente}
Refracción OD: ${datos.refOD || 'no registrada'}
Refracción OI: ${datos.refOI || 'no registrada'}

CURVAS DE DESENFOQUE:
${seccionesOjo}

Genera un informe clínico con estas secciones:

1. RENDIMIENTO POR DISTANCIA
   - Visión lejana (VL, 0D): calidad y simetría OD/OI
   - Visión intermedia (-1.5D a -2D, 67-50cm): funcionalidad
   - Visión cercana (-2.5D a -3D, 40-33cm): lectura y detalle
   - Visión muy cercana (-3.5D a -5D): limitaciones

2. ANÁLISIS POR VERGENCIAS
   Para cada rango vergencial indica AV LogMAR y equivalente Snellen aproximado

3. COMPORTAMIENTO DEL IOL
   - Predominancia visual (¿para qué distancia está optimizado?)
   - ¿El perfil de la curva es típico para este tipo de IOL?
   - Comparación OD vs OI si hay diferencia clínica significativa

4. IMPACTO REFRACTIVO
   - ¿La refracción registrada puede estar afectando el rendimiento?
   - ¿Se sugiere ajuste refractivo o es el resultado esperado post-implante?

5. RECOMENDACIONES CLÍNICAS
   - Conducta a seguir
   - ¿Requiere control, corrección adicional o neuroadaptación?

Sé preciso, usa terminología optométrica apropiada y basa el análisis en los datos reales de la curva.`

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
