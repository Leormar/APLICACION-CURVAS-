import pool from '../../../../lib/db'
import { getServerSession } from 'next-auth'
import { enviarEmail } from '../../../../lib/email'

export async function GET() {
  try {
    const session = await getServerSession()
    if (session?.user?.rol !== 'admin') return Response.json({ error: 'No autorizado' }, { status: 403 })

    const res = await pool.query(`
      SELECT
        p.id, p.nombre, p.documento, p.fecha_nacimiento, p.creado_por,
        COUNT(DISTINCT c.id) as total_examenes,
        MAX(c.fecha) as ultimo_examen,
        u.nombre as doctor_nombre
      FROM pacientes p
      LEFT JOIN curvas c ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON u.email = p.creado_por
      GROUP BY p.id, p.nombre, p.documento, p.fecha_nacimiento, p.creado_por, u.nombre
      ORDER BY p.nombre ASC
    `)
    return Response.json({ pacientes: res.rows })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession()
    if (session?.user?.rol !== 'admin') return Response.json({ error: 'No autorizado' }, { status: 403 })

    const { id } = await req.json()
    if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

    // Obtener info del paciente y doctor antes de borrar
    const pRes = await pool.query(
      `SELECT p.*, u.email as doctor_email, u.nombre as doctor_nombre
       FROM pacientes p
       LEFT JOIN usuarios u ON u.email = p.creado_por
       WHERE p.id = $1`, [id]
    )
    if (pRes.rows.length === 0) return Response.json({ error: 'Paciente no encontrado' }, { status: 404 })
    const paciente = pRes.rows[0]

    // Borrar mediciones → curvas → paciente
    await pool.query(`DELETE FROM mediciones WHERE curva_id IN (SELECT id FROM curvas WHERE paciente_id = $1)`, [id])
    await pool.query(`DELETE FROM curvas WHERE paciente_id = $1`, [id])
    await pool.query(`DELETE FROM pacientes WHERE id = $1`, [id])

    // Notificar al doctor si tiene email registrado
    if (paciente.doctor_email) {
      await enviarEmail({
        to: paciente.doctor_email,
        subject: 'Paciente eliminado por el administrador - PROLENS',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
            <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:24px;border-radius:14px 14px 0 0;text-align:center">
              <h1 style="color:white;margin:0;font-size:22px;font-weight:900;letter-spacing:2px">PROLENS</h1>
              <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Curvas de Desenfoque · Curvas IOL IAdx</p>
            </div>
            <div style="background:white;padding:28px 24px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0">
              <h2 style="color:#b45309;margin:0 0 16px">⚠️ Paciente eliminado</h2>
              <p style="color:#374151;line-height:1.7;font-size:14px">Hola <strong>${paciente.doctor_nombre || paciente.doctor_email}</strong>,</p>
              <p style="color:#374151;line-height:1.7;font-size:14px">
                El administrador eliminó el registro del siguiente paciente de la plataforma PROLENS
                por <strong>falta de uso o inactividad</strong>:
              </p>
              <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:10px;padding:16px;margin:16px 0">
                <p style="margin:0 0 6px;font-size:14px"><strong>Paciente:</strong> ${paciente.nombre}</p>
                ${paciente.documento ? `<p style="margin:0;font-size:14px;color:#64748b"><strong>Documento:</strong> ${paciente.documento}</p>` : ''}
              </div>
              <p style="color:#374151;line-height:1.7;font-size:14px">
                Si consideras que esta eliminación fue un error o necesitas recuperar la información,
                comunícate directamente con el Dr. Leonardo Orjuela.
              </p>
              <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center">
                PROLENS · Dr. Leonardo Orjuela · Medellín, Colombia
              </p>
            </div>
          </div>`
      })
    }

    return Response.json({ ok: true, notificado: !!paciente.doctor_email })
  } catch(e) {
    console.error('Error DELETE paciente admin:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
