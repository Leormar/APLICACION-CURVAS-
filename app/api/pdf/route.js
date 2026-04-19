const VERGENCIAS = {
  '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
  '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
  '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
}

const graficaSVG = (med, color) => {
  if (!med || med.length < 2) return '<p style="color:#94a3b8;font-size:10px">Sin datos suficientes</p>'
  const datos = [...med].map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
  
  const W=500, H=200, pL=38, pR=48, pT=8, pB=48
  const gW=W-pL-pR, gH=H-pT-pB

  // Rangos fijos
  const dMin=-5, dMax=1
  const aMin=-0.2, aMax=1.4

  // x: defocus izquierda(-5) a derecha(+1)
  const px = d => pL + ((d - dMin) / (dMax - dMin)) * gW
  // y: LogMAR 0 arriba (pT), 1.4 abajo (pT+gH)
  const py = v => pT + ((v - aMin) / (aMax - aMin)) * gH

  const defTicks = [-5,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,-0.5,0,0.5,1]
  const avTicks = [0,0.1,0.2,0.3,0.5,0.7,1.0,1.3]

  // Verificar que los puntos caen dentro del área
  const puntosValidos = datos.filter(m => 
    m.defocus >= dMin && m.defocus <= dMax && 
    m.agudeza >= aMin && m.agudeza <= aMax
  )

  if (puntosValidos.length < 2) return '<p style="color:#94a3b8;font-size:10px">Datos fuera de rango</p>'

  const pathD = puntosValidos.map((m,i) => {
    const cx = px(m.defocus).toFixed(1)
    const cy = py(m.agudeza).toFixed(1)
    return `${i===0?'M':'L'}${cx},${cy}`
  }).join(' ')

  const dots = puntosValidos.map(m => {
    const cx = px(m.defocus).toFixed(1)
    const cy = py(m.agudeza).toFixed(1)
    return `<circle cx="${cx}" cy="${cy}" r="4" fill="${color}" stroke="white" stroke-width="1.5"/>`
  }).join('')

  const gridH = avTicks.map(v => {
    const cy = py(v).toFixed(1)
    return `<line x1="${pL}" y1="${cy}" x2="${W-pR}" y2="${cy}" stroke="#e8edf2" stroke-width="0.8"/>`
  }).join('')

  const gridV = defTicks.map(d => {
    const cx = px(d).toFixed(1)
    return `<line x1="${cx}" y1="${pT}" x2="${cx}" y2="${H-pB}" stroke="#e8edf2" stroke-width="0.8"/>`
  }).join('')

  const refs = [
    {v:0.1, c:'#22c55e', l:'20/25'},
    {v:0.2, c:'#f59e0b', l:'20/32'},
    {v:0.3, c:'#ef4444', l:'20/40'}
  ].map(r => {
    const cy = py(r.v).toFixed(1)
    return `<line x1="${pL}" y1="${cy}" x2="${W-pR}" y2="${cy}" stroke="${r.c}" stroke-width="1" stroke-dasharray="5,3"/>
    <text x="${W-pR+3}" y="${cy}" dominant-baseline="middle" font-family="Arial" font-size="7" fill="${r.c}">${r.l}</text>`
  }).join('')

  const xLabels = defTicks.map(d => {
    const cx = px(d).toFixed(1)
    const verg = VERGENCIAS[String(d)] || ''
    return `<text x="${cx}" y="${H-pB+12}" text-anchor="middle" font-family="Arial" font-size="7" fill="#475569">${d}</text>
    <text x="${cx}" y="${H-pB+22}" text-anchor="middle" font-family="Arial" font-size="6" fill="#94a3b8">${verg}</text>`
  }).join('')

  const yLabels = avTicks.map(v => {
    const cy = py(v).toFixed(1)
    return `<text x="${pL-4}" y="${cy}" text-anchor="end" dominant-baseline="middle" font-family="Arial" font-size="7" fill="#475569">${v.toFixed(1)}</text>`
  }).join('')

  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;max-width:100%">
    <rect width="${W}" height="${H}" fill="white"/>
    ${gridH}
    ${gridV}
    ${refs}
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${H-pB}" stroke="#64748b" stroke-width="1"/>
    <line x1="${pL}" y1="${H-pB}" x2="${W-pR}" y2="${H-pB}" stroke="#64748b" stroke-width="1"/>
    ${xLabels}
    ${yLabels}
    <text x="${pL+gW/2}" y="${H-1}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">Defocus (D) / Vergencia</text>
    <text x="10" y="${pT+gH/2}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569" transform="rotate(-90,10,${pT+gH/2})">LogMAR</text>
  </svg>`
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, refOD, refOI, tipoAV, curvas, interpretacion } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

    const seccion = (med, titulo, color, iol) => {
      if (!med || med.length === 0) return ''
      const datos = med.map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
      const funcional = datos.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      return `<div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;page-break-inside:avoid">
        <div style="background:${color};color:white;padding:7px 14px;font-size:11px;font-weight:bold">${titulo}${iol&&iol!=='—'&&iol?' · '+iol:''}</div>
        <div style="padding:8px 12px">
          ${graficaSVG(med, color)}
          <div style="font-size:9px;color:#0369a1;margin:4px 0 0;padding:4px 8px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1">
            Rango funcional (≤0.2 LogMAR): <strong>${funcional}</strong>
          </div>
        </div>
      </div>`
    }

    const limpiar = t => t ? t.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim() : ''

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>CurvaDesenfoque_${(paciente||'paciente').replace(/\s+/g,'_')}_${documento||''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:22px 28px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e40af;padding-bottom:12px;margin-bottom:14px}
  .logo{font-size:16px;font-weight:bold;color:#1e40af;line-height:1.4}
  .logo small{display:block;font-size:9px;font-weight:normal;color:#64748b;margin-top:1px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:12px}
  .field{background:#f8fafc;padding:5px 10px;border-radius:4px;border-left:2px solid #dbeafe}
  .field label{font-size:8px;color:#94a3b8;display:block;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:1px}
  .field span{font-weight:bold;font-size:11px}
  .ai-box{margin-top:14px;padding:12px 14px;background:#faf5ff;border-radius:8px;border:1px solid #e9d5ff;font-size:10px;line-height:1.9;white-space:pre-wrap}
  .disclaimer{margin-top:8px;padding:5px 8px;background:#fef3c7;border-radius:4px;border-left:3px solid #f59e0b;font-size:8px;color:#92400e}
  .footer{margin-top:14px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:10px 14px}@page{margin:0.6cm;size:A4}}
</style></head><body>
<div class="header">
  <div class="logo">PROLENS
    <small>Especialistas en Contactologia y Cirugia Refractiva · Medellin</small>
    <small>Dr. Leonardo Orjuela · lorjuela7@gmail.com</small>
  </div>
  <div style="text-align:right;font-size:10px;color:#64748b;line-height:1.6">
    <strong style="font-size:12px;color:#1e293b">Curva de Desenfoque</strong><br>${fecha}
  </div>
</div>
<div class="grid">
  <div class="field"><label>Paciente</label><span>${paciente||'—'}</span></div>
  <div class="field"><label>Documento</label><span>${documento||'—'}</span></div>
  <div class="field"><label>Fecha de nacimiento</label><span>${fechaNac||'—'}</span></div>
  <div class="field"><label>Tipo AV</label><span>${tipoAV||'logmar'}</span></div>
  <div class="field"><label>Refraccion OD</label><span>${refOD||'—'}</span></div>
  <div class="field"><label>Refraccion OI</label><span>${refOI||'—'}</span></div>
  <div class="field"><label>IOL OD</label><span>${lentes?.OD||'—'}</span></div>
  <div class="field"><label>IOL OI</label><span>${lentes?.OI||'—'}</span></div>
</div>
${seccion(curvas?.OD,'Ojo Derecho (OD)','#1e40af',lentes?.OD)}
${seccion(curvas?.OI,'Ojo Izquierdo (OI)','#0f766e',lentes?.OI)}
${seccion(curvas?.AO,'Ambos Ojos (AO)','#7c3aed','')}
${interpretacion?`<div class="ai-box">
  <div style="color:#7c3aed;font-size:11px;font-weight:bold;margin-bottom:6px">Analisis clinico AI</div>
  ${limpiar(interpretacion)}
  <div class="disclaimer">Analisis generado por inteligencia artificial como apoyo diagnostico. La interpretacion clinica final es responsabilidad del profesional tratante.</div>
</div>`:''}
<div class="footer">PROLENS · Lentesespecializados · Medellin, Colombia · ${fecha}</div>
</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch(e) {
    return new Response(`<html><body><p>Error: ${e.message}</p></body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }
}
