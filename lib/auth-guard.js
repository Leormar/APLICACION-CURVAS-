import { getToken } from 'next-auth/jwt'
import pool from './db'

// Devuelve el usuario aprobado a partir de la sesión NextAuth (JWT),
// o null si no hay sesión válida o el usuario no está aprobado.
export async function getUsuarioAprobado(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const email = token?.email
    if (!email) return null
    const res = await pool.query('SELECT id, email, nombre, estado FROM usuarios WHERE email=$1', [email])
    const u = res.rows[0]
    if (!u || u.estado !== 'aprobado') return null
    return u
  } catch (e) {
    console.error('auth-guard error:', e.message)
    return null
  }
}
