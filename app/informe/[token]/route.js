import pool from '../../../lib/db'
import { APP_URL } from '../../../lib/config'

function paginaMensaje(titulo, msg) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo} · PROLENS</title></head>
<body style="font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f8fafc;margin:0">
  <div style="text-align:center;padding:2rem;max-width:420px">
    <div style="font-size:1.4rem;font-weight:800;color:#1e40af;letter-spacing:1px">PROLENS</div>
    <h2 style="color:#1e293b;margin:1rem 0 .5rem">${titulo}</h2>
    <p style="color:#64748b;line-height:1.6">${msg}</p>
  </div>
</body></html>`
}

// Enlace de solo lectura: muestra el informe guardado. No requiere sesión ni permite editar.
export async function GET(req, { params }) {
  const { token } = params
  try {
    const r = await pool.query('SELECT payload, expira_at FROM informes_compartidos WHERE token=$1', [token])
    const row = r.rows[0]
    if (!row) {
      return new Response(paginaMensaje('Enlace no válido', 'Este informe no existe o fue eliminado. Solicita un nuevo enlace al profesional.'),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
    if (row.expira_at && new Date(row.expira_at) < new Date()) {
      return new Response(paginaMensaje('Enlace caducado', 'Este enlace de solo lectura ya expiró. Solicita uno nuevo al profesional.'),
        { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    // Reutiliza el render del informe (ruta /api/pdf, que solo arma el HTML).
    const res = await fetch(`${APP_URL}/api/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row.payload),
    })
    let html = await res.text()

    // Banner de solo lectura (sin auto-impresión).
    const banner = `<div style="background:#1e40af;color:#fff;text-align:center;padding:9px 12px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.3px">Informe de solo lectura · PROLENS · curvasdesenfoque.com</div>`
    html = html.replace('<body>', `<body>${banner}`)

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (e) {
    console.error('Error informe compartido:', e)
    return new Response(paginaMensaje('Error', 'No se pudo cargar el informe en este momento.'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}
