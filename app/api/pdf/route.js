const VERGENCIAS = {
  '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
  '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
  '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
}

const graficaSVG = (med, color) => {
  if (!med || med.length < 2) return ''
  const datos = [...med].sort((a,b)=>a.defocus-b.defocus)
  const W=520, H=220, pL=42, pR=52, pT=12, pB=52
  const gW=W-pL-pR, gH=H-pT-pB
  const defMin=-5, defMax=1, avMin=-0.3, avMax=1.4

  // Y: 0 arriba (buena visión), 1.4 abajo (mala visión)
  const x = d => pL + ((d-defMin)/(defMax-defMin))*gW
  const y = v => pT + ((v-avMin)/(avMax-avMin))*gH

  const defTicks = [-5,-4.5,-4,-3.5,-3,-2.5,-2,-1.5,-1,-0.5,0,0.5,1]
  const avTicks = [0,0.1,0.2,0.3,0.5,0.7,1.0,1.3]

  const gridH = avTicks.map(v=>`<line x1="${pL}" y1="${y(v).toFixed(1)}" x2="${W-pR}" y2="${y(v).toFixed(1)}" stroke="#f0f4f8" stroke-width="0.8"/>`).join('')
  const gridV = defTicks.map(d=>`<line x1="${x(d).toFixed(1)}" y1="${pT}" x2="${x(d).toFixed(1)}" y2="${H-pB}" stroke="#f0f4f8" stroke-width="0.8"/>`).join('')

  const path = datos.map((m,i)=>`${i===0?'M':'L'}${x(m.defocus).toFixed(1)},${y(m.agudeza).toFixed(1)}`).join(' ')
  const dots = datos.map(m=>`<circle cx="${x(m.defocus).toFixed(1)}" cy="${y(m.agudeza).toFixed(1)}" r="3.5" fill="${color}" stroke="white" stroke-width="1.5"/>`).join('')

  const xLabels = defTicks.map(d=>`
    <text x="${x(d).toFixed(1)}" y="${H-pB+13}" text-anchor="middle" font-family="Arial" font-size="7.5" fill="#475569">${d}</text>
    <text x="${x(d).toFixed(1)}" y="${H-pB+24}" text-anchor="middle" font-family="Arial" font-size="6.5" fill="#94a3b8">${VERGENCIAS[String(d)]||''}</text>
  `).join('')

  const yLabels = avTicks.map(v=>`<text x="${pL-5}" y="${y(v).toFixed(1)}" text-anchor="end" dominant-baseline="middle" font-family="Arial" font-size="7.5" fill="#475569">${v.toFixed(1)}</text>`).join('')

  const refs = [
    {v:0.1,color:'#22c55e',label:'20/25'},
    {v:0.2,color:'#f59e0b',label:'20/32'},
    {v:0.3,color:'#ef4444',label:'20/40'}
  ].map(r=>`
    <line x1="${pL}" y1="${y(r.v).toFixed(1)}" x2="${W-pR}" y2="${y(r.v).toFixed(1)}" stroke="${r.color}" stroke-width="1" stroke-dasharray="4,3"/>
    <text x="${W-pR+4}" y="${y(r.v).toFixed(1)}" dominant-baseline="middle" font-family="Arial" font-size="7.5" fill="${r.color}">${r.label}</text>
  `).join('')

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect width="${W}" height="${H}" fill="white"/>
    ${gridH}${gridV}${refs}
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${H-pB}" stroke="#94a3b8" stroke-width="1"/>
    <line x1="${pL}" y1="${H-pB}" x2="${W-pR}" y2="${H-pB}" stroke="#94a3b8" stroke-width="1"/>
    ${xLabels}${yLabels}
    <text x="${pL+(gW/2)}" y="${H-2}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569">Defocus (D) / Vergencia</text>
    <text x="11" y="${pT+(gH/2)}" text-anchor="middle" font-family="Arial" font-size="8" fill="#475569" transform="rotate(-90,11,${pT+(gH/2)})">LogMAR</text>
  </svg>`
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, refOD, refOI, tipoAV, curvas, interpretacion } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

    const seccion = (med, titulo, color, iol) => {
      if (!med || med.length === 0) return ''
      const datos = [...med].sort((a,b)=>a.defocus-b.defocus)
      const funcional = datos.filter(m=>parseFloat(m.agudeza)<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      return `<div style="margin-top:14px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;page-break-inside:avoid">
        <div style="background:${color};color:white;padding:7px 14px;font-size:12px;font-weight:bold">
          ${titulo}${iol&&iol!=='—'&&iol?'  ·  '+iol:''}
        </div>
        <div style="padding:8px 12px">
          ${graficaSVG(med, color)}
          <div style="font-size:9.5px;color:#0369a1;margin:5px 0 0;padding:4px 10px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1">
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
  .disclaimer{margin-top:8px;padding:5px 8px;background:#fef3c7;border-radius:4px;border-left:3px solid #f59e0b;font-size:8.5px;color:#92400e}
  .footer{margin-top:14px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:12px 16px}@page{margin:0.7cm;size:A4}}
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
