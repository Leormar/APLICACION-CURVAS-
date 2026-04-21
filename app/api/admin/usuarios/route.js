import pool from '../../../../lib/db'
import { enviarEmail } from '../../../../lib/email'

export async function GET() {
  try {
    const res = await pool.query('SELECT * FROM usuarios ORDER BY fecha_solicitud DESC')
    return Response.json({ usuarios: res.rows })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const { id, estado, aprobado_por } = await req.json()
    await pool.query(
      'UPDATE usuarios SET estado=$1, aprobado_por=$2, fecha_aprobacion=NOW() WHERE id=$3',
      [estado, aprobado_por, id]
    )

    const u = await pool.query('SELECT * FROM usuarios WHERE id=$1', [id])
    const usuario = u.rows[0]

    if (estado === 'aprobado') {
      await enviarEmail({
        to: usuario.email,
        subject: '✅ Acceso aprobado - PROLENS Curvas de Desenfoque',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f8fafc">
          <div style="background:#1e40af;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:22px">PROLENS</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Curvas de Desenfoque</p>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <h2 style="color:#166534;margin:0 0 16px">✅ ¡Acceso aprobado!</h2>
            <p style="color:#374151;line-height:1.6">Hola <strong>${usuario.nombre}</strong>,</p>
            <p style="color:#374151;line-height:1.6">Tu solicitud de acceso a <strong>PROLENS Curvas de Desenfoque</strong> ha sido <strong>aprobada</strong>. Ya puedes ingresar con tu cuenta de Google.</p>
            <div style="text-align:center;margin:24px 0">
              <a href="https://aplicacion-curvas.vercel.app" style="display:inline-block;padding:14px 28px;background:#1e40af;color:white;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px">
                Ingresar a la app
              </a>
            </div>
            <p style="color:#6b7280;font-size:12px;margin-top:16px;text-align:center">
              Dr. Leonardo Orjuela · PROLENS · Medellín, Colombia
            </p>
          </div>
        </div>`
      })
    } else if (estado === 'rechazado') {
      await enviarEmail({
        to: usuario.email,
        subject: 'Solicitud de acceso - PROLENS',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <div style="background:#991b1b;padding:20px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0">PROLENS</h1>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <h2 style="color:#991b1b;margin:0 0 16px">Solicitud no aprobada</h2>
            <p style="color:#374151;line-height:1.6">Hola <strong>${usuario.nombre}</strong>,</p>
            <p style="color:#374151;line-height:1.6">Tu solicitud de acceso a PROLENS Curvas de Desenfoque no fue aprobada. Si crees que es un error contacta al Dr. Leonardo Orjuela.</p>
            <p style="color:#6b7280;font-size:12px;margin-top:16px;text-align:center">PROLENS · Medellín, Colombia</p>
          </div>
        </div>`
      })
    }

    return Response.json({ ok: true })
  } catch(e) {
    console.error('Error PATCH usuarios:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
