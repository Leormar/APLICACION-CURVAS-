import { enviarEmail } from '../../../lib/email'
import pool from '../../../lib/db'

export async function POST(req) {
  try {
    const { usuarioId, usuarioEmail, usuarioNombre } = await req.json()

    // Verificar que no se haya enviado ya
    const check = await pool.query(
      'SELECT feedback_enviado FROM usuarios WHERE id=$1',
      [usuarioId]
    )
    if (check.rows[0]?.feedback_enviado) {
      return Response.json({ ok: false, msg: 'ya enviado' })
    }

    // Enviar email
    await enviarEmail({
      to: usuarioEmail,
      subject: 'Su opinion sobre PROLENS - Curvas de Desenfoque',
      useInfo: true,
    html: `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
    <h2 style="color:#1e40af">Estimado/a ${usuarioNombre},</h2>
    <p>Gracias por usar <strong>PROLENS - Curvas de Desenfoque</strong>. Nos gustaria conocer su experiencia.</p>
    <p>Por favor complete nuestra breve encuesta haciendo clic en el boton:</p>
    <div style="text-align:center;margin:2rem 0">
      <a href="https://curvasdesenfoque.com/feedback?token=${usuarioId}"
        style="display:inline-block;padding:14px 32px;background:#1e40af;color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:1rem">
        Responder encuesta
      </a>
    </div>
    <p style="color:#64748b;font-size:0.85rem">Solo toma 2 minutos. Su opinion es muy valiosa para mejorar la plataforma.</p>
    <p>Atentamente,<br><strong>Dr. Leonardo Orjuela</strong><br>PROLENS - curvasdesenfoque.com</p>
  </div>
      `
    })

    // Marcar como enviado
    await pool.query(
      'UPDATE usuarios SET feedback_enviado=TRUE WHERE id=$1',
      [usuarioId]
    )

    return Response.json({ ok: true })
  } catch(e) {
    console.error(e)
    return Response.json({ ok: false, error: e.message })
  }
}
