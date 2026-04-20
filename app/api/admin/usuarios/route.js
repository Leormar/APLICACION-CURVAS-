import pool from '../../../../lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Obtener datos del usuario
    const u = await pool.query('SELECT * FROM usuarios WHERE id=$1', [id])
    const usuario = u.rows[0]

    if (estado === 'aprobado') {
      await resend.emails.send({
        from: 'PROLENS <onboarding@resend.dev>',
        to: usuario.email,
        subject: '✅ Acceso aprobado - PROLENS Curvas de Desenfoque',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">¡Acceso aprobado!</h2>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Tu solicitud de acceso a <strong>PROLENS Curvas de Desenfoque</strong> ha sido aprobada.</p>
          <p>Ya puedes ingresar a la aplicación con tu cuenta de Google.</p>
          <a href="https://aplicacion-curvas.vercel.app" style="display:inline-block;padding:12px 24px;background:#1e40af;color:white;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
            Ingresar a la app
          </a>
          <p style="margin-top:20px;font-size:12px;color:#64748b">
            Dr. Leonardo Orjuela · PROLENS · Medellín, Colombia
          </p>
        </div>`
      })
    } else if (estado === 'rechazado') {
      await resend.emails.send({
        from: 'PROLENS <onboarding@resend.dev>',
        to: usuario.email,
        subject: 'Solicitud de acceso - PROLENS',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#991b1b">Solicitud no aprobada</h2>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Tu solicitud de acceso a PROLENS Curvas de Desenfoque no fue aprobada.</p>
          <p>Si crees que es un error, contacta al Dr. Leonardo Orjuela.</p>
          <p style="margin-top:20px;font-size:12px;color:#64748b">
            PROLENS · Medellín, Colombia
          </p>
        </div>`
      })
    }

    return Response.json({ ok: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
