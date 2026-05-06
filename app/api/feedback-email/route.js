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
          <p>Por favor responda estas breves preguntas respondiendo directamente a este correo:</p>
          <ol style="line-height:2">
            <li>La aplicacion curvasdesenfoque.com le parecio facil de usar? (Si / No / Podria mejorar)</li>
            <li>Completo el tutorial clinico? (Si / No)</li>
            <li>Probo el paciente de prueba? (Si / No)</li>
            <li>Registro una curva de desenfoque real? (Si / No)</li>
            <li>El analisis con IA MAIdx sd Bench le aporto al diagnostico? (Si / No / Podria mejorar)</li>
            <li>Que piensa de la herramienta? (Comentario libre)</li>
          </ol>
          <p style="color:#64748b;font-size:0.85rem">Su opinion es muy valiosa para mejorar la plataforma.</p>
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
