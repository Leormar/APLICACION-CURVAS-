import pool from '../../../../lib/db'
import { getServerSession } from 'next-auth'

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
    return Response.json({ ok: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
