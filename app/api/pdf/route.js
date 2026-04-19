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
  const dMin=-5, dMax=1
  // Y invertido: 0 LogMAR (mejor) ARRIBA = y pequeño, 1.3 (peor) ABAJO = y grande
  const aTop=0, aBot=1.4  // aTop arriba, aBot abajo
  const px = d => pL + ((d-dMin)/(dMax-dMin))*gW
  const py = v => pT + ((v-aTop)/(aBot-aTop))*gH  // 0→pT(arriba), 1.4→pT+gH(abajo)

  const defTicks = [-5,-4,-3,-2,-1,0,1]
  const avTicks = [0,0.1,0.2,0.3,0.5,0.7,1.0,1.3]
  const pValidos = datos.filter(m=>m.defocus>=dMin&&m.defocus<=dMax&&m.agudeza>=0&&m.agudeza<=1.4)
  if (pValidos.length < 2) return ''

  const pathD = pValidos.map((m,i)=>`${i===0?'M':'L'}${px(m.defocus).toFixed(1)},${py(m.agudeza).toFixed(1)}`).join(' ')
  const dots = pValidos.map(m=>`<circle cx="${px(m.defocus).toFixed(1)}" cy="${py(m.agudeza).toFixed(1)}" r="3" fill="${color}" stroke="white" stroke-width="1.2"/>`).join('')
  const gridH = avTicks.map(v=>`<line x1="${pL}" y1="${py(v).toFixed(1)}" x2="${W-pR}" y2="${py(v).toFixed(1)}" stroke="#edf2f7" stroke-width="0.8"/>`).join('')
  const refs = [
    {v:0.1,c:'#22c55e',l:'20/25'},
    {v:0.2,c:'#f59e0b',l:'20/32'},
    {v:0.3,c:'#ef4444',l:'20/40'}
  ].map(r=>`
    <line x1="${pL}" y1="${py(r.v).toFixed(1)}" x2="${W-pR}" y2="${py(r.v).toFixed(1)}" stroke="${r.c}" stroke-width="0.8" stroke-dasharray="4,3"/>
    <text x="${W-pR+3}" y="${py(r.v).toFixed(1)}" dominant-baseline="middle" font-family="Arial" font-size="6.5" fill="${r.c}">${r.l}</text>
  `).join('')
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
    <text x="${pL+gW/2}" y="${H-1}" text-anchor="middle" font-family="Arial" font-size="7" fill="#475569">Defocus (D) / Vergencia</text>
    <text x="9" y="${pT+gH/2}" text-anchor="middle" font-family="Arial" font-size="7" fill="#475569" transform="rotate(-90,9,${pT+gH/2})">LogMAR</text>
  </svg>`
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, refOD, refOI, tipoAV, curvas, interpretacion, secciones } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
    const limpiar = t => t ? t.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim() : ''

    const resumenNumericos = (med) => {
      if (!med || med.length === 0) return ''
      const datos = med.map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
      const vl = datos.find(m=>Math.abs(m.defocus)<0.01)
      const vi = datos.filter(m=>m.defocus>=-2&&m.defocus<=-1.5)
      const vc = datos.filter(m=>m.defocus>=-3&&m.defocus<=-2.5)
      const funcional = datos.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      const lines = []
      if (vl) lines.push(`VL (0D): ${vl.agudeza.toFixed(2)} LogMAR`)
      if (vi.length) lines.push(`VI (67-50cm): ${vi.map(m=>m.agudeza.toFixed(2)).join(' / ')} LogMAR`)
      if (vc.length) lines.push(`VC (40-33cm): ${vc.map(m=>m.agudeza.toFixed(2)).join(' / ')} LogMAR`)
      lines.push(`Funcional: ${funcional}`)
      return lines.map(l=>`<div style="margin-bottom:3px">${l}</div>`).join('')
    }

    const seccion = (med, titulo, color, iol, textoAI) => {
      if (!med || med.length === 0) return ''
      const datos = med.map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
      const funcional = datos.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'

      const columnaTexto = textoAI
        ? `<div style="font-size:8.8px;color:#1e293b;line-height:1.85;padding-top:2px">${limpiar(textoAI).replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')}</div>`
        : `<div style="font-size:8.5px;color:#475569;line-height:1.8">${resumenNumericos(med)}<div style="margin-top:6px;font-size:8px;color:#94a3b8;font-style:italic">Use "Interpretar curva" para análisis AI</div></div>`

      return `<div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;page-break-inside:avoid">
        <div style="background:${color};color:white;padding:6px 14px;font-size:11px;font-weight:bold">${titulo}${iol&&iol!=='—'&&iol?' · '+iol:''}</div>
        <div style="padding:8px 12px;display:grid;grid-template-columns:355px 1fr;gap:14px;align-items:start">
          <div>
            ${graficaSVG(med, color)}
            <div style="font-size:8.5px;color:#0369a1;margin:3px 0 0;padding:3px 8px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1">
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
  body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:20px 26px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1e40af;padding-bottom:10px;margin-bottom:12px}
  .logo{font-size:15px;font-weight:bold;color:#1e40af;line-height:1.4}
  .logo small{display:block;font-size:8.5px;font-weight:normal;color:#64748b;margin-top:1px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px}
  .field{background:#f8fafc;padding:5px 10px;border-radius:4px;border-left:2px solid #dbeafe}
  .field label{font-size:7.5px;color:#94a3b8;display:block;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:1px}
  .field span{font-weight:bold;font-size:10.5px}
  .ai-final{margin-top:12px;padding:10px 14px;background:#faf5ff;border-radius:8px;border:1px solid #e9d5ff;font-size:9px;line-height:1.85;white-space:pre-wrap}
  .disclaimer{margin-top:6px;padding:4px 8px;background:#fef3c7;border-radius:4px;border-left:3px solid #f59e0b;font-size:7.5px;color:#92400e}
  .footer{margin-top:12px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:8px 12px}@page{margin:0.5cm;size:A4}}
</style></head><body>
<div class="header">
  <div class="logo">PROLENS
    <small>Especialistas en Contactologia y Cirugia Refractiva · Medellin</small>
    <small>Dr. Leonardo Orjuela · lorjuela7@gmail.com</small>
  </div>
  <div style="text-align:right;font-size:9.5px;color:#64748b;line-height:1.6">
    <strong style="font-size:11px;color:#1e293b">Curva de Desenfoque</strong><br>${fecha}
  </div>
</div>
<div class="grid">
  <div class="field"><label>Paciente</label><span>${paciente||'—'}</span></div>
  <div class="field"><label>Documento</label><span>${documento||'—'}</span></div>
  <div class="field"><label>Fecha nacimiento</label><span>${fechaNac||'—'}</span></div>
  <div class="field"><label>Tipo AV</label><span>${tipoAV||'logmar'}</span></div>
  <div class="field"><label>Refraccion OD</label><span>${refOD||'—'}</span></div>
  <div class="field"><label>Refraccion OI</label><span>${refOI||'—'}</span></div>
  <div class="field"><label>IOL OD</label><span>${lentes?.OD||'—'}</span></div>
  <div class="field"><label>IOL OI</label><span>${lentes?.OI||'—'}</span></div>
</div>
${seccion(curvas?.OD,'Ojo Derecho (OD)','#1e40af',lentes?.OD,secciones?.OD)}
${seccion(curvas?.OI,'Ojo Izquierdo (OI)','#0f766e',lentes?.OI,secciones?.OI)}
${seccion(curvas?.AO,'Ambos Ojos (AO)','#7c3aed','',secciones?.AO)}
${interpretacion?`<div class="ai-final">
  <div style="color:#7c3aed;font-size:10px;font-weight:bold;margin-bottom:6px">Analisis clinico completo AI</div>
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
