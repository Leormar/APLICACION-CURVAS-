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
      host: 'mail.privateemail.com',
      port: 587,
      user: process.env.EMAIL_INFO_USER,
      pass: process.env.EMAIL_INFO_PASS,
      to: usuarioEmail,
      subject: 'Su opinión sobre PROLENS — Curvas de Desenfoque',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">Estimado/a ${usuarioNombre},</h2>
          <p>Gracias por usar <strong>PROLENS — Curvas de Desenfoque</strong>. Nos gustaría conocer su experiencia.</p>
          <p>Por favor responda estas breves preguntas respondiendo directamente a este correo:</p>
          <ol style="line-height:2">
            <li>¿La aplicación <strong>curvasdesenfoque.com</strong> le pareció fácil de usar? <em>(Sí / No / Podría mejorar)</em></li>
            <li>¿Completó el <strong>tutorial clínico</strong>? <em>(Sí / No)</em></li>
            <li>¿Probó el <strong>paciente de prueba</strong>? <em>(Sí / No)</em></li>
            <li>¿Registró una curva de desenfoque real? <em>(Sí / No)</em></li>
            <li>¿El análisis con IA <strong>MAIdx sd Bench</strong> le aportó al diagnóstico? <em>(Sí / No / Podría mejorar)</em></li>
            <li>¿Qué piensa de la herramienta? <em>(Comentario libre)</em></li>
          </ol>
          <p style="color:#64748b;font-size:0.85rem">Su opinión es muy valiosa para mejorar la plataforma.</p>
          <p>Atentamente,<br><strong>Dr. Leonardo Orjuela</strong><br>PROLENS · curvasdesenfoque.com</p>
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
