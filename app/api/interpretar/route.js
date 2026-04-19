export async function POST(req) {
  try {
    const { datos, mediciones } = await req.json()

    const tabla = mediciones.map(m => `  ${m.defocus}D: ${m.agudeza} LogMAR`).join('\n')
    const funcional = mediciones.filter(m => m.agudeza <= 0.2).map(m => `${m.defocus}D`).join(', ')

    const prompt = `Eres un optometrista especialista en lentes intraoculares multifocales. Analiza esta curva de desenfoque y genera un informe clínico conciso en español.

Paciente: ${datos.paciente}
IOL: ${datos.iol}
Ojo: ${datos.ojo}
Refracción OD: ${datos.refOD || 'no registrada'}
Refracción OI: ${datos.refOI || 'no registrada'}

Mediciones (LogMAR):
${tabla}

Rango funcional (≤0.2 LogMAR): ${funcional || 'ninguno'}

Proporciona:
1. Evaluación del rendimiento visual en visión lejana, intermedia y cercana
2. Análisis del rango funcional
3. Correlación con el tipo de IOL
4. Recomendaciones clínicas

Sé conciso y usa lenguaje clínico apropiado.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const json = await response.json()
    const interpretacion = json.content?.[0]?.text || 'No se pudo generar la interpretación.'
    return Response.json({ interpretacion })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
