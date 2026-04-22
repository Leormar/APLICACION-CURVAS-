import pool from '../../../lib/db'
import { getServerSession } from 'next-auth'

export async function POST() {
  try {
    const session = await getServerSession()
    const email = session?.user?.email
    if (!email) return Response.json({ error: 'No autenticado' }, { status: 401 })
    await pool.query(
      'UPDATE usuarios SET tutorial_completado=TRUE WHERE email=$1',
      [email]
    )
    return Response.json({ ok: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
