const VERGENCIAS = {
  '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
  '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
  '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
}

const graficaSVG = (med, color) => {
  if (!med || med.length < 2) return ''
  const datos = [...med].map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
  const W=340, H=180, pL=35, pR=42, pT=8, pB=44
  const gW=W-pL-pR, gH=H-pT-pB
  const dMin=-5, dMax=1, aTop=0, aBot=1.4
  const px = d => pL + ((d-dMin)/(dMax-dMin))*gW
  const py = v => pT + ((v-aTop)/(aBot-aTop))*gH
  const defTicks = [-5,-4,-3,-2,-1,0,1]
  const avTicks = [0,0.1,0.2,0.3,0.5,0.7,1.0,1.3]
  const pValidos = datos.filter(m=>m.defocus>=dMin&&m.defocus<=dMax&&m.agudeza>=0&&m.agudeza<=1.4)
  if (pValidos.length < 2) return ''
  const pathD = pValidos.map((m,i)=>`${i===0?'M':'L'}${px(m.defocus).toFixed(1)},${py(m.agudeza).toFixed(1)}`).join(' ')
  const dots = pValidos.map(m=>`<circle cx="${px(m.defocus).toFixed(1)}" cy="${py(m.agudeza).toFixed(1)}" r="3" fill="${color}" stroke="white" stroke-width="1.2"/>`).join('')
  const gridH = avTicks.map(v=>`<line x1="${pL}" y1="${py(v).toFixed(1)}" x2="${W-pR}" y2="${py(v).toFixed(1)}" stroke="#edf2f7" stroke-width="0.8"/>`).join('')
  const refs = [{v:0.1,c:'#22c55e',l:'20/25'},{v:0.2,c:'#f59e0b',l:'20/32'},{v:0.3,c:'#ef4444',l:'20/40'}].map(r=>
    `<line x1="${pL}" y1="${py(r.v).toFixed(1)}" x2="${W-pR}" y2="${py(r.v).toFixed(1)}" stroke="${r.c}" stroke-width="0.8" stroke-dasharray="4,3"/>
     <text x="${W-pR+3}" y="${py(r.v).toFixed(1)}" dominant-baseline="middle" font-family="Arial" font-size="6.5" fill="${r.c}">${r.l}</text>`
  ).join('')
  const xLabels = defTicks.map(d=>`
    <text x="${px(d).toFixed(1)}" y="${H-pB+12}" text-anchor="middle" font-family="Arial" font-size="6.5" fill="#475569">${d}</text>
    <text x="${px(d).toFixed(1)}" y="${H-pB+21}" text-anchor="middle" font-family="Arial" font-size="5.5" fill="#94a3b8">${VERGENCIAS[String(d)]||''}</text>
  `).join('')
  const yLabels = avTicks.map(v=>`<text x="${pL-3}" y="${py(v).toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-family="Arial" font-size="6.5" fill="#475569">${v.toFixed(1)}</text>`).join('')
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect width="${W}" height="${H}" fill="white"/>
    ${gridH}${refs}
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${H-pB}" stroke="#64748b" stroke-width="0.8"/>
    <line x1="${pL}" y1="${H-pB}" x2="${W-pR}" y2="${H-pB}" stroke="#64748b" stroke-width="0.8"/>
    ${xLabels}${yLabels}
    <text x="${pL+gW/2}" y="${H-1}" text-anchor="middle" font-family="Arial" font-size="7" fill="#475569">Defocus (D)</text>
    <text x="9" y="${pT+gH/2}" text-anchor="middle" font-family="Arial" font-size="7" fill="#475569" transform="rotate(-90,9,${pT+gH/2})">LogMAR</text>
  </svg>`
}

const calcEdad = (fechaNac) => {
  if (!fechaNac) return ''
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad + ' años'
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, refOD, refOI, tipoAV, curvas, interpretacion, secciones } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
    const edad = calcEdad(fechaNac)
    const limpiar = (t) => {
  return t
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---/g, '')
    .replace(/(ANALISIS OJO DERECHO[^\n]*)/gi, '<strong></strong>')
    .replace(/(ANALISIS OJO IZQUIERDO[^\n]*)/gi, '<strong></strong>')
    .replace(/(ANALISIS BINOCULAR[^\n]*)/gi, '<strong></strong>')
    .replace(/(COMPORTAMIENTO DEL IOL[^\n]*)/gi, '<strong></strong>')
    .replace(/(IMPACTO REFRACTIVO[^\n]*)/gi, '<strong></strong>')
    .replace(/(RECOMENDACIONES[^\n]*)/gi, '<strong></strong>')
    .trim()
}

const limpiarFinal = (t) => {
  const lineas = t.split('\n')
  let incluir = false
  const resultado = []
  for (const linea of lineas) {
    const upper = linea.toUpperCase()
    if (upper.includes('COMPORTAMIENTO DEL IOL') || upper.includes('IMPACTO REFRACTIVO') || upper.includes('RECOMENDACIONES')) {
      incluir = true
    } else if (upper.includes('ANALISIS OJO') || upper.includes('ANALISIS BINOCULAR')) {
      incluir = false
    }
    if (incluir) resultado.push(linea)
  }
  return resultado.join('\n')
    .replace(/(COMPORTAMIENTO DEL IOL[^\n]*)/gi, '<strong></strong>')
    .replace(/(IMPACTO REFRACTIVO[^\n]*)/gi, '<strong></strong>')
    .replace(/(RECOMENDACIONES[^\n]*)/gi, '<strong></strong>')
    .trim()
}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---/g, '')
    .replace(/(ANALISIS OJO DERECHO[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(ANALISIS OJO IZQUIERDO[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(ANALISIS BINOCULAR[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(COMPORTAMIENTO DEL IOL[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(IMPACTO REFRACTIVO[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(RECOMENDACIONES[^\n]*)/gi, '<strong>$1</strong>')
    .trim()
}

    const seccion = (med, titulo, color, iol, textoAI) => {
      if (!med || med.length === 0) return ''
      const datos = med.map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
      const funcional = datos.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      const tituloSeccion = titulo.includes("OD") ? "Análisis OD" : titulo.includes("OI") ? "Análisis OI" : "Análisis Binocular"
      const columnaTexto = textoAI
        ? `<div><div style="font-size:11px;font-weight:bold;color:#1e293b;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #e2e8f0">${tituloSeccion}</div><div style="font-size:11px;color:#1e293b;line-height:1.9">${limpiar(textoAI).replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')}</div></div>`
        : `<div style="font-size:10px;color:#64748b;line-height:1.8;padding-top:4px;font-style:italic">Presiona "Interpretar curva" antes de generar el PDF para obtener el análisis clínico al lado de la gráfica.</div>`
      return `<div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;page-break-inside:avoid">
        <div style="background:${color};color:white;padding:9px 16px;font-size:14px;font-weight:bold;letter-spacing:0.3px">
          ${titulo}${iol&&iol!=='—'&&iol?' · <span style="font-weight:400;font-size:12px">${iol}</span>':''}
        </div>
        <div style="padding:10px 14px;display:grid;grid-template-columns:355px 1fr;gap:16px;align-items:start">
          <div>
            ${graficaSVG(med, color)}
            <div style="font-size:9px;color:#0369a1;margin:4px 0 0;padding:4px 8px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1">
              Rango funcional (≤0.2 LogMAR): <strong>${funcional}</strong>
            </div>
          </div>
          ${columnaTexto}
        </div>
      </div>`
    }

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>CurvaDesenfoque_${(paciente||'paciente').replace(/\s+/g,'_')}_${documento||''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:20px 28px}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e40af;padding-bottom:10px;margin-bottom:10px}
  .logo{font-size:20px;font-weight:900;color:#1e40af;letter-spacing:1px;line-height:1.2}
  .logo small{display:block;font-size:9px;font-weight:normal;color:#64748b;letter-spacing:0}
  .paciente-bar{background:#f8fafc;border-radius:8px;padding:8px 14px;margin-bottom:10px;border-left:4px solid #1e40af;display:flex;flex-wrap:wrap;gap:16px;align-items:center}
  .paciente-nombre{font-size:15px;font-weight:800;color:#1e293b;flex:1;min-width:200px}
  .paciente-dato{font-size:10px;color:#475569;white-space:nowrap}
  .paciente-dato strong{color:#1e293b;font-size:11px}
  .refraccion-bar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
  .ref-item{background:white;border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:10px;color:#475569;flex:1;min-width:120px}
  .ref-item strong{display:block;font-size:11px;color:#1e293b}
  .ai-final{margin-top:14px;padding:12px 16px;background:#faf5ff;border-radius:8px;border:1px solid #e9d5ff;font-size:11px;line-height:1.9}
  .disclaimer{margin-top:8px;padding:5px 10px;background:#fef3c7;border-radius:4px;border-left:3px solid #f59e0b;font-size:8.5px;color:#92400e}
  .footer{margin-top:14px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:10px 16px}@page{margin:0.5cm;size:A4}}
</style></head><body>

<div class="header">
  <div class="logo">PROLENS
    <small>Contactologia Especializada y Optometria Especializada</small>
    <small>drorjuela@lentesespecializados.com</small>
  </div>
  <div style="text-align:right;font-size:10px;color:#64748b;line-height:1.7">
    <strong style="font-size:13px;color:#1e293b;display:block">Curva de Desenfoque</strong>
    ${fecha}
  </div>
</div>

<div class="paciente-bar">
  <div class="paciente-nombre">${paciente||'—'}</div>
  ${documento?`<div class="paciente-dato"><strong>${documento}</strong>CC / ID</div>`:''}
  ${fechaNac?`<div class="paciente-dato"><strong>${fechaNac}</strong>Nacimiento</div>`:''}
  ${edad?`<div class="paciente-dato"><strong>${edad}</strong>Edad</div>`:''}
  <div class="paciente-dato"><strong>${tipoAV||'LogMAR'}</strong>Tipo AV</div>
</div>

<div class="refraccion-bar">
  <div class="ref-item"><strong>Refracción OD</strong>${refOD||'—'}</div>
  <div class="ref-item"><strong>Refracción OI</strong>${refOI||'—'}</div>
  <div class="ref-item"><strong>IOL OD</strong>${lentes?.OD||'—'}</div>
  <div class="ref-item"><strong>IOL OI</strong>${lentes?.OI||'—'}</div>
</div>

${seccion(curvas?.OD,'Ojo Derecho (OD)','#1e40af',lentes?.OD,secciones?.OD)}
${seccion(curvas?.OI,'Ojo Izquierdo (OI)','#0f766e',lentes?.OI,secciones?.OI)}
${seccion(curvas?.AO,'Ambos Ojos (AO)','#7c3aed','',secciones?.AO)}

${interpretacion?`<div class="ai-final">
  
  ${limpiarFinal(interpretacion).replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')}
  <div class="disclaimer">Análisis generado por MAIdx sd Bench como apoyo diagnóstico. La interpretación clínica final es responsabilidad del profesional tratante.</div>
</div>`:''}

<div class="footer">PROLENS · Lentesespecializados · Medellín, Colombia · ${fecha}</div>
</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch(e) {
    return new Response(`<html><body><p>Error: ${e.message}</p></body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }
}
