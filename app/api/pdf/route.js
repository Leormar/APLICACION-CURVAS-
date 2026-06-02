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

// Limpia texto lateral por ojo (todo el texto)
const limpiarLateral = (t) => {
  if (!t) return ''
  return t
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/---/g, '')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .trim()
}

// Para el bloque final: solo COMPORTAMIENTO, IMPACTO y RECOMENDACIONES
const limpiarFinal = (t) => {
  if (!t) return ''
  const lineas = t.split('\n')
  let incluir = false
  const resultado = []
  for (const linea of lineas) {
    const upper = linea.toUpperCase()
    if (upper.includes('COMPORTAMIENTO DEL IOL') ||
        upper.includes('IMPACTO REFRACTIVO') ||
        upper.includes('RECOMENDACIONES')) {
      incluir = true
    } else if (upper.includes('ANALISIS OJO') || upper.includes('ANALISIS BINOCULAR')) {
      incluir = false
    }
    if (incluir) resultado.push(linea)
  }
  return resultado.join('\n')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/(COMPORTAMIENTO DEL IOL[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(IMPACTO REFRACTIVO[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/(RECOMENDACIONES[^\n]*)/gi, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .trim()
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, iolIA, iolSugerido, refOD, refOI, tipoAV, curvas, interpretacion, secciones, perfil } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })
    const edad = calcEdad(fechaNac)

    // Etiqueta del LIO por ojo:
    // - elegido manualmente por IA en la biblioteca → "X (seleccionado por IA · examen ciego · %)"
    // - "valoración ciega" (__ciega__) → "Y (LIO elegido por IA · examen ciego · %)"
    // - LIO implantado (nombre) → "X" o "X · Según curva (IA): Y (%)"
    // - sin LIO / ojo no operado ("") → "Sin LIO"
    const iolLabel = (ojo) => {
      const v = lentes?.[ojo]
      const ia = iolIA?.[ojo]
      const sug = iolSugerido?.[ojo]
      if (ia && v) return `${v} (seleccionado por IA · examen ciego · ${ia.similitud}%)`
      if (v === '__ciega__') return sug ? `${sug.nombre} (LIO elegido por IA · examen ciego · ${sug.similitud}%)` : 'Valoración ciega'
      if (v && v !== '__ciega__') return sug ? `${v} · Según curva (IA): ${sug.nombre} (${sug.similitud}%)` : v
      return 'Sin LIO'
    }

    // Sección por ojo: encabezado (ojo + LIO), y al lado la curva + su análisis (correspondencia clara).
    const seccionOjo = (med, titulo, color, iol, textoAI) => {
      if (!med || med.length === 0) return ''
      const datos = med.map(m=>({defocus:parseFloat(m.defocus),agudeza:parseFloat(m.agudeza)})).sort((a,b)=>a.defocus-b.defocus)
      const funcional = datos.filter(m=>m.agudeza<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      const txt = textoAI
        ? `<div class="ojo-txt">${limpiarLateral(textoAI)}</div>`
        : `<div class="ojo-txt" style="color:#94a3b8;font-style:italic">Presiona "Interpretar curva" antes de generar el PDF para incluir el análisis de este ojo.</div>`
      return `<div class="ojo-card" style="border-top:3px solid ${color}">
        <div class="ojo-head">
          <span style="font-weight:800;color:${color}">${titulo}</span>
          ${iol ? `<span class="ojo-iol">${iol}</span>` : ''}
        </div>
        <div class="ojo-body">
          <div class="ojo-graf">
            ${graficaSVG(med, color)}
            <div class="grafica-func">Rango funcional (≤0.2 LogMAR): <strong>${funcional}</strong></div>
          </div>
          ${txt}
        </div>
      </div>`
    }

    const nombreDoctor = perfil?.nombre_completo || 'Dr. Leonardo Orjuela'
    const especialidad = perfil?.especialidad || 'Contactologia Especializada y Optometria Especializada'
    const emailProf = perfil?.email_profesional || 'drorjuela@lentesespecializados.com'
    const telefono = perfil?.telefono || ''
    const ciudad = perfil?.ciudad || 'Medellin'
    const logoHtml = perfil?.logo_base64
      ? `<img src="${perfil.logo_base64}" style="height:52px;max-width:140px;object-fit:contain;margin-right:12px" />`
      : ''

    const textoFinal = interpretacion ? limpiarFinal(interpretacion) : ''

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>CurvaDesenfoque_${(paciente||'paciente').replace(/\s+/g,'_')}_${documento||''}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;padding:20px 28px}
  .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #1e40af;padding-bottom:10px;margin-bottom:10px}
  .logo-nombre{font-size:18px;font-weight:900;color:#1e40af;letter-spacing:1px;line-height:1.3}
  .logo-sub{font-size:9px;font-weight:normal;color:#64748b;display:block}
  .paciente-bar{background:#f8fafc;border-radius:8px;padding:8px 14px;margin-bottom:8px;border-left:4px solid #1e40af;display:flex;flex-wrap:wrap;gap:16px;align-items:center}
  .paciente-nombre{font-size:15px;font-weight:800;color:#1e293b;flex:1;min-width:200px}
  .paciente-dato{font-size:10px;color:#475569;white-space:nowrap}
  .paciente-dato strong{color:#1e293b;font-size:11px;display:block}
  .refbar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
  .ref-item{background:white;border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:10px;color:#475569;flex:1;min-width:120px}
  .ref-item strong{display:block;font-size:11px;color:#1e293b;margin-bottom:1px}
  .seccion-titulo{font-size:12px;font-weight:800;color:#1e40af;text-transform:uppercase;letter-spacing:1px;border-left:4px solid #1e40af;padding-left:9px;margin:16px 0 9px}
  .ojo-card{border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px 11px;margin-bottom:11px;page-break-inside:avoid}
  .ojo-head{display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:7px;flex-wrap:wrap;gap:4px;border-bottom:1px solid #f1f5f9;padding-bottom:5px}
  .ojo-iol{font-size:10.5px;font-weight:600;color:#475569;background:#f1f5f9;padding:2px 9px;border-radius:10px}
  .ojo-body{display:flex;flex-direction:row;gap:16px;align-items:flex-start}
  .ojo-graf{flex-shrink:0;width:340px}
  .ojo-graf svg{max-width:100%;height:auto}
  .ojo-txt{flex:1;min-width:0;font-size:11px;line-height:1.8;color:#1e293b}
  .grafica-func{font-size:9px;color:#0369a1;margin-top:5px;padding:4px 8px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1}
  .analisis{border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;page-break-inside:avoid}
  .conclusion{font-size:11px;line-height:1.85;color:#1e293b}
  .disclaimer{margin-top:10px;padding:5px 10px;background:#fef3c7;border-radius:4px;border-left:3px solid #f59e0b;font-size:8.5px;color:#92400e}
  .footer{margin-top:14px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
  @media print{body{padding:10px 16px}@page{margin:0.5cm;size:A4}}
</style></head><body>

<div class="header">
  <div style="display:flex;align-items:center">
    ${logoHtml}
    <div>
      <div class="logo-nombre">${nombreDoctor}</div>
      <span class="logo-sub">${especialidad}</span>
      <span class="logo-sub">${emailProf}${telefono?' · '+telefono:''}</span>
      <span class="logo-sub">${ciudad}, Colombia</span>
    </div>
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

<div class="refbar">
  <div class="ref-item"><strong>Refracción OD</strong>${refOD||'—'}</div>
  <div class="ref-item"><strong>Refracción OI</strong>${refOI||'—'}</div>
  <div class="ref-item"><strong>IOL OD</strong>${iolLabel('OD')||'—'}</div>
  <div class="ref-item"><strong>IOL OI</strong>${iolLabel('OI')||'—'}</div>
</div>

<div class="seccion-titulo">Curvas de Desenfoque y Análisis por Ojo</div>
${seccionOjo(curvas?.OD,'Ojo Derecho (OD)','#1e40af',iolLabel('OD'),secciones?.OD)}
${seccionOjo(curvas?.OI,'Ojo Izquierdo (OI)','#0f766e',iolLabel('OI'),secciones?.OI)}
${seccionOjo(curvas?.AO,'Ambos Ojos (AO)','#7c3aed','',secciones?.AO)}

${textoFinal?`
<div class="seccion-titulo">Conclusión Clínica · MAIdx sd Bench</div>
<div class="analisis">
  <div class="conclusion">${textoFinal}</div>
  <div class="disclaimer">Análisis generado por MAIdx sd Bench como apoyo diagnóstico. La interpretación clínica final es responsabilidad del profesional tratante.</div>
</div>`:''}

<div class="footer">${nombreDoctor} · ${ciudad}, Colombia · ${fecha}</div>
</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch(e) {
    return new Response(`<html><body><p>Error: ${e.message}</p></body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }
}
