import pool from '../../../lib/db'
import { getServerSession } from 'next-auth'

export async function POST() {
  try {
    const session = await getServerSession()
    const email = session?.user?.email
    if (!email) return Response.json({ error: 'No autenticado' }, { status: 401 })
    await pool.query(
      'UPDATE usuarios SET notas=$1 WHERE email=$2',
      ['tutorial_completado', email]
    )
    return Response.json({ ok: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
