const VERGENCIAS = {
  '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m',
  '-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm',
  '-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm'
}

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, lentes, refOD, refOI, tipoAV, curvas, interpretacion } = await req.json()
    const fecha = new Date().toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' })

    const tablaOjo = (med, titulo, color) => {
      if (!med || med.length === 0) return ''
      const filas = med.sort((a,b)=>a.defocus-b.defocus).map(m => {
        const v = VERGENCIAS[String(parseFloat(m.defocus))] || ''
        const esFunc = parseFloat(m.agudeza) <= 0.2
        return `<tr style="background:${esFunc?'#f0fdf4':'white'}">
          <td>${m.defocus} D</td><td>${v}</td>
          <td style="font-weight:${esFunc?'bold':'normal'};color:${esFunc?'#166534':'inherit'}">${parseFloat(m.agudeza).toFixed(2)}</td>
        </tr>`
      }).join('')
      const funcional = med.filter(m=>parseFloat(m.agudeza)<=0.2).map(m=>`${m.defocus}D`).join(', ') || 'ninguno'
      return `<div style="margin-top:18px;page-break-inside:avoid">
        <div style="background:${color};color:white;padding:6px 12px;border-radius:5px;font-size:12px;font-weight:bold;margin-bottom:6px">${titulo}</div>
        <table><thead><tr><th>Defocus</th><th>Vergencia</th><th>AV LogMAR</th></tr></thead><tbody>${filas}</tbody></table>
        <div style="font-size:10px;color:#0369a1;margin:5px 0 0;padding:4px 8px;background:#f0f9ff;border-radius:4px;border-left:3px solid #0369a1">
          Rango funcional (<=0.2 LogMAR): <strong>${funcional}</strong>
        </div>
      </div>`
    }

    const limpiar = (texto) => {
      if (!texto) return ''
      return texto.replace(/#{1,6}\s*/g,'').replace(/\*\*/g,'').replace(/\*/g,'').replace(/---/g,'').trim()
    }

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; font-size:11px; color:#1e293b; padding:24px 32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1e40af; padding-bottom:12px; margin-bottom:16px; }
  .logo { font-size:18px; font-weight:bold; color:#1e40af; line-height:1.4; }
  .logo small { display:block; font-size:9px; font-weight:normal; color:#64748b; margin-top:2px; }
  .fecha-box { text-align:right; font-size:10px; color:#64748b; line-height:1.6; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:14px; }
  .field { background:#f8fafc; padding:6px 10px; border-radius:4px; border-left:2px solid #dbeafe; }
  .field label { font-size:8px; color:#94a3b8; display:block; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:1px; }
  .field span { font-weight:bold; font-size:11px; }
  table { width:100%; border-collapse:collapse; font-size:10px; }
  th { background:#1e40af; color:white; padding:5px 8px; text-align:left; }
  td { padding:4px 8px; border-bottom:1px solid #f1f5f9; }
  .interpretacion { margin-top:18px; padding:12px 14px; background:#faf5ff; border-radius:8px; border:1px solid #e9d5ff; font-size:10px; line-height:1.8; white-space:pre-wrap; }
  .interpretacion-titulo { color:#7c3aed; font-size:11px; font-weight:bold; margin-bottom:8px; }
  .disclaimer { margin-top:8px; padding:6px 10px; background:#fef3c7; border-radius:5px; border-left:3px solid #f59e0b; font-size:9px; color:#92400e; }
  .footer { margin-top:20px; text-align:center; font-size:8px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:8px; }
  @media print { body { padding:16px 20px; } @page { margin:1cm; } }
</style></head><body>
<div class="header">
  <div class="logo">PROLENS
    <small>Especialistas en Contactologia y Cirugia Refractiva - Medellin</small>
    <small>Dr. Leonardo Orjuela - lorjuela7@gmail.com</small>
  </div>
  <div class="fecha-box"><strong style="font-size:11px;color:#1e293b">Informe - Curva de Desenfoque</strong><br>Fecha: ${fecha}</div>
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
${tablaOjo(curvas?.OD,'Ojo Derecho (OD)','#1e40af')}
${tablaOjo(curvas?.OI,'Ojo Izquierdo (OI)','#0f766e')}
${tablaOjo(curvas?.AO,'Ambos Ojos (AO)','#7c3aed')}
${interpretacion?`<div class="interpretacion"><div class="interpretacion-titulo">Analisis clinico AI</div>${limpiar(interpretacion)}<div class="disclaimer">Este analisis es generado por inteligencia artificial como apoyo diagnostico. La interpretacion clinica final es responsabilidad del profesional tratante.</div></div>`:''}
<div class="footer">PROLENS - Lentesespecializados - Medellin, Colombia - ${fecha}</div>
</body></html>`

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch(e) {
    return new Response(`<html><body><h1>Error</h1><p>${e.message}</p></body></html>`, { headers: { 'Content-Type': 'text/html' } })
  }
}
