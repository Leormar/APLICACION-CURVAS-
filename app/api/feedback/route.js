import pool from '../../../lib/db'
import { enviarEmail } from '../../../lib/email'

export async function POST(req) {
  try {
    const { facil_usar, completo_tutorial, probo_paciente, registro_curva, aporto_ia, comentario, token } = await req.json()

    // Buscar usuario por token
    const userRes = await pool.query('SELECT * FROM usuarios WHERE id=$1', [token])
    const usuario = userRes.rows[0]

    // Guardar en DB
    await pool.query(
      `INSERT INTO feedback (usuario_id, usuario_email, usuario_nombre, facil_usar, completo_tutorial, probo_paciente, registro_curva, aporto_ia, comentario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [usuario?.id||null, usuario?.email||'', usuario?.nombre||'', facil_usar, completo_tutorial, probo_paciente, registro_curva, aporto_ia, comentario||'']
    )

    // Notificar al Dr. Orjuela
    await enviarEmail({
      to: 'lorjuela7@gmail.com',
      subject: 'Nuevo feedback PROLENS',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#1e40af">Nuevo feedback recibido</h2>
          <p><strong>Usuario:</strong> ${usuario?.nombre||'Anonimo'} (${usuario?.email||''})</p>
          <hr/>
          <p><strong>Facil de usar:</strong> ${facil_usar}</p>
          <p><strong>Completo tutorial:</strong> ${completo_tutorial}</p>
          <p><strong>Probo paciente:</strong> ${probo_paciente}</p>
          <p><strong>Registro curva:</strong> ${registro_curva}</p>
          <p><strong>IA aporto al diagnostico:</strong> ${aporto_ia}</p>
          <p><strong>Comentario:</strong> ${comentario||'Sin comentario'}</p>
        </div>
      `
    })

    return Response.json({ ok: true })
  } catch(e) {
    console.error(e)
    return Response.json({ ok: false, error: e.message })
  }
}
