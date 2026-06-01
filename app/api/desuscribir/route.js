import pool from '../../../lib/db'
import { verificarTokenBaja } from '../../../lib/unsubscribe'
import { APP_URL } from '../../../lib/config'

// Asegura que exista la columna que marca la baja (idempotente).
async function ensureColumna() {
  await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS desuscrito BOOLEAN DEFAULT FALSE')
}

async function darDeBaja(token) {
  const userId = await verificarTokenBaja(token)
  if (!userId) return false
  await ensureColumna()
  await pool.query('UPDATE usuarios SET desuscrito=TRUE WHERE id=$1', [userId])
  return true
}

// Clic en el enlace del correo → marca la baja y lleva a la página de confirmación.
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  try {
    const ok = await darDeBaja(token)
    const destino = ok
      ? `${APP_URL}/baja?token=${encodeURIComponent(token)}`
      : `${APP_URL}/baja?error=1`
    return Response.redirect(destino, 302)
  } catch (e) {
    console.error('Error baja GET:', e)
    return Response.redirect(`${APP_URL}/baja?error=1`, 302)
  }
}

// One-click unsubscribe (RFC 8058) que envían Gmail/Apple Mail.
export async function POST(req) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  try {
    await darDeBaja(token)
  } catch (e) {
    console.error('Error baja POST:', e)
  }
  // Los clientes de correo esperan un 200 simple.
  return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } })
}
