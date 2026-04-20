import pool from '../../../lib/db'
import { getServerSession } from 'next-auth'

export async function GET(req) {
  try {
    const session = await getServerSession()
    const email = session?.user?.email
    if (!email) return Response.json({ error: 'No autenticado' }, { status: 401 })
    const res = await pool.query('SELECT * FROM perfiles WHERE usuario_email=$1', [email])
    return Response.json({ perfil: res.rows[0] || null })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession()
    const email = session?.user?.email
    if (!email) return Response.json({ error: 'No autenticado' }, { status: 401 })
    const { nombre_completo, especialidad, email_profesional, telefono, ciudad, logo_base64 } = await req.json()
    await pool.query(`
      INSERT INTO perfiles (usuario_email, nombre_completo, especialidad, email_profesional, telefono, ciudad, logo_base64)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (usuario_email) DO UPDATE SET
        nombre_completo=$2, especialidad=$3, email_profesional=$4,
        telefono=$5, ciudad=$6, logo_base64=$7, updated_at=NOW()
    `, [email, nombre_completo, especialidad, email_profesional, telefono, ciudad, logo_base64||null])
    return Response.json({ ok: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
