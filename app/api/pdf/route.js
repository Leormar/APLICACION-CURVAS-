const VERGENCIAS = {
  '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
  '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
  '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
}

const generarGraficaSVG = (mediciones, color, titulo) => {
  if (!mediciones || mediciones.length < 2) return ''
  const datos = [...mediciones].sort((a,b)=>a.defocus-b.defocus)
  const W = 500, H = 200
  const padL = 45, padR = 20, padT = 15, padB = 45
  const gW = W - padL - padR
  const gH = H - padT - padB

  const defMin = -5, defMax = 1
  const avMin = -0.2, avMax = 1.3

  const xPos = d => padL + ((d - defMin)/(defMax - defMin)) * gW
  const yPos = v => padT + ((v - avMin)/(avMax - avMin)) * gH

  // Grid lines
  const gridH = [-0.1,0,0.1,0.2,0.3,0.5,0.7,1.0,1.3].map(v =>
    `<line x1="${padL}" y1="${yPos(v).toFixed(1)}" x2="${W-padR}" y2="${yPos(v).toFixed(1)}" stroke="#f1f5f9" stroke-width="0.5"/>`
  ).join('')

  const gridV = [-5,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,-0.5,0,0.5,1].map(d =>
    `<line x1="${xPos(d).toFixed(1)}" y1="${padT}" x2="${xPos(d).toFixed(1)}" y2="${H-padB}" stroke="#f1f5f9" stroke-width="0.5"/>`
  ).join('')

  // Reference lines
  const ref01 = yPos(0.1).toFixed(1)
  const ref02 = yPos(0.2).toFixed(1)
  const ref03 = yPos(0.3).toFixed(1)

  // Line path
  const points = datos.map(m => `${xPos(m.defocus).toFixed(1)},${yPos(m.agudeza).toFixed(1)}`).join(' ')
  const path = datos.map((m,i) => `${i===0?'M':'L'}${xPos(m.defocus).toFixed(1)},${yPos(m.agudeza).toFixed(1)}`).join(' ')

  // Dots
  const dots = datos.map(m =>
    `<circle cx="${xPos(m.defocus).toFixed(1)}" cy="${yPos(m.agudeza).toFixed(1)}" r="3" fill="${color}" stroke="white" stroke-width="1"/>`
  ).join('')

  // X axis labels
  const xLabels = [-5,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,-0.5,0,0.5,1].map(d => {
    const v = VERGENCIAS[String(d)] || ''
    return `<text x="${xPos(d).toFixed(1)}" y="${H-padB+12}" text-anchor="middle" font-size="7" fill="#64748b">${d}</text>
            <text x="${xPos(d).toFixed(1)}" y="${H-padB+22}" text-anchor="middle" font-size="6" fill="#94a3b8">${v}</text>`
  }).join('')

  // Y axis labels
  const yLabels = [0,0.1,0.2,0.3,0.5,0.7,1.0].map(v =>
    `<text x="${padL-4}" y="${yPos(v).toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-size="7" fill="#64748b">${v}</text>`
  ).join('')

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:8px 0">
    <rect width="${W}" height="${H}" fill="white"/>
    ${gridH}${gridV}
    <line x1="${padL}" y1="${ref01}" x2="${W-padR}" y2="${ref01}" stroke="#22c55e" stroke-width="0.8" stroke-dasharray="3,3"/>
    <text x="${W-padR+2}" y="${ref01}" dominant-baseline="middle" font-size="7" fill="#22c55e">20/25</text>
    <line x1="${padL}" y1="${ref02}" x2="${W-padR}" y2="${ref02}" stroke="#f59e0b" stroke-width="0.8" stroke-dasharray="3,3"/>
    <text x="${W-padR+2}" y="${ref02}" dominant-baseline="middle" font-size="7" fill="#f59e0b">20/32</text>
    <line x1="${padL}" y1="${ref03}" x2="${W-padR}" y2="${ref03}" stroke="#ef4444" stroke-width="0.8" stroke-dasharray="3,3"/>
    <text x="${W-padR+2}" y="${ref03}" dominant-baseline="middle" font-size="7" fill="#ef4444">20/40</text>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2"/>
    ${dots}
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#cbd5e1" stroke-width="0.8"/>
    <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#cbd5e1" stroke-width="0.8"/>
    ${xLabels}${yLabels}
    <text x="${W/2}" y="${H-2}" text-anchor="middle" font-size="8" fill="#475569">Defocus (D) / Vergencia</text>
    <text x="10" y="${H/2}" text-anchor="middle" font-size="8" fill="#475569" transform="rotate(-90,10,${H/2})">LogMAR</text>
  </svg>`
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, refOD, refOI, tipoAV, curvas, interpretacion } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

    const seccionOjo = (med, titulo, color, iol) => {
      if (!med || med.length === 0) return ''
      const datos = [...med].sort((a,b)=>a.defocus-b.defocus)
      const funcional = datos.filter(m=>parseFloat(m.agudeza)<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      const grafica = generarGraficaSVG(med, color, titulo)
      return `<div style="page-break-inside:avoid;margin-top:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
        <div style="background:${color};color:white;padding:7px 14px;font-size:12px;font-weight:bold">${titulo} ${iol&&iol!=='—'?'· '+iol:''}</div>
        <div style="padding:10px 14px">
          ${grafica}
          <div style="font-size:10px;color:#0369a1;margin:4px 0;padding:4px 8px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1">
            Rango funcional (≤0.2 LogMAR): <strong>${funcional}</strong>
          </div>
        </div>
      </div>`
    }

    const limpiar = (t) => t ? t.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim() : ''

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:24px 32px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e40af;padding-bottom:12px;margin-bottom:16px}
  .logo{font-size:17px;font-weight:bold;color:#1e40af;line-height:1.4}
  .logo small{display:block;font-size:9px;font-weight:normal;color:#64748b;margin-top:2px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:14px}
  .field{background:#f8fafc;padding:6px 10px;border-radius:4px;border-left:2px solid #dbeafe}
  .field label{font-size:8px;color:#94a3b8;display:block;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1px}
  .field span{font-weight:bold;font-size:11px}
  .interpretacion{margin-top:20px;padding:12px 14px;background:#faf5ff;border-radius:8px;border:1px solid #e9d5ff;font-size:10px;line-height:1.8;white-space:pre-wrap}
  .disclaimer{margin-top:8px;padding:6px 10px;background:#fef3c7;border-radius:5px;border-left:3px solid #f59e0b;font-size:9px;color:#92400e}
  .footer{margin-top:20px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:16px 20px}@page{margin:1cm}}
</style></head><body>

<div class="header">
  <div class="logo">PROLENS
    <small>Especialistas en Contactologia y Cirugia Refractiva · Medellin</small>
    <small>Dr. Leonardo Orjuela · lorjuela7@gmail.com</small>
  </div>
  <div style="text-align:right;font-size:10px;color:#64748b">
    <strong style="font-size:11px;color:#1e293b">Informe — Curva de Desenfoque</strong><br>
    ${fecha}
  </div>
</div>

<div class="grid">
  <div class="field"><label>Paciente</label><span>${paciente||'—'}</span></div>
  <div class="field"><label>Documento</label><span>${documento||'—'}</span></div>
  <div class="field"><label>Fecha de nacimiento</label><span>${fechaNac||'—'}</span></div>
  <div class="field"><label>Tipo AV</label><span>${tipoAV||'decimal'}</span></div>
  <div class="field"><label>Refraccion OD</label><span>${refOD||'—'}</span></div>
  <div class="field"><label>Refraccion OI</label><span>${refOI||'—'}</span></div>
  <div class="field"><label>IOL OD</label><span>${lentes?.OD||'—'}</span></div>
  <div class="field"><label>IOL OI</label><span>${lentes?.OI||'—'}</span></div>
</div>

${seccionOjo(curvas?.OD, 'Ojo Derecho (OD)', '#1e40af', lentes?.OD)}
${seccionOjo(curvas?.OI, 'Ojo Izquierdo (OI)', '#0f766e', lentes?.OI)}
${seccionOjo(curvas?.AO, 'Ambos Ojos (AO)', '#7c3aed', '')}

${interpretacion?`<div class="interpretacion">
  <div style="color:#7c3aed;font-size:11px;font-weight:bold;margin-bottom:8px">Analisis clinico AI</div>
  ${limpiar(interpretacion)}
  <div class="disclaimer">Este analisis es generado por inteligencia artificial como apoyo diagnostico. La interpretacion clinica final es responsabilidad del profesional tratante.</div>
</div>`:''}

<div class="footer">PROLENS · Lentesespecializados · Medellin, Colombia · ${fecha}</div>
</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch(e) {
    return new Response(`<html><body><h1>Error</h1><p>${e.message}</p></body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }
}
