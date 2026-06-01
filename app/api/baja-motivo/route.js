import pool from '../../../lib/db'
import { enviarEmail } from '../../../lib/email'
import { verificarTokenBaja } from '../../../lib/unsubscribe'

// Guarda el motivo opcional por el que un usuario canceló los recordatorios.
export async function POST(req) {
  try {
    const { token, motivo } = await req.json()
    const userId = await verificarTokenBaja(token)
    if (!userId) return Response.json({ ok: false, error: 'token invalido' }, { status: 400 })

    const texto = (motivo || '').trim()
    if (!texto) return Response.json({ ok: true }) // baja ya hecha; sin motivo no guardamos nada

    const userRes = await pool.query('SELECT id, email, nombre FROM usuarios WHERE id=$1', [userId])
    const usuario = userRes.rows[0]

    await pool.query(
      `INSERT INTO feedback (usuario_id, usuario_email, usuario_nombre, facil_usar, completo_tutorial, probo_paciente, registro_curva, aporto_ia, comentario)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [usuario?.id || null, usuario?.email || '', usuario?.nombre || '', null, null, null, null, null, `[Motivo de baja] ${texto}`]
    )

    // Aviso breve al Dr. Orjuela (mismo patrón que /api/feedback).
    await enviarEmail({
      to: 'lorjuela7@gmail.com',
      subject: 'Baja de recordatorios PROLENS',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#991b1b">Un usuario canceló los recordatorios</h2>
          <p><strong>Usuario:</strong> ${usuario?.nombre || 'Anonimo'} (${usuario?.email || ''})</p>
          <hr/>
          <p><strong>Motivo:</strong> ${texto}</p>
        </div>`
    })

    return Response.json({ ok: true })
  } catch (e) {
    console.error('Error baja-motivo:', e)
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
