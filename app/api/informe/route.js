import { randomUUID } from 'crypto'
import pool from '../../../lib/db'
import { getUsuarioAprobado } from '../../../lib/auth-guard'
import { APP_URL } from '../../../lib/config'

// Crea la tabla de informes compartidos si no existe (auto-migración idempotente).
async function ensureTabla() {
  await pool.query(`CREATE TABLE IF NOT EXISTS informes_compartidos (
    token TEXT PRIMARY KEY,
    paciente TEXT,
    documento TEXT,
    payload JSONB NOT NULL,
    creado_por TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    expira_at TIMESTAMPTZ
  )`)
}

// Genera un enlace de solo lectura con una foto del informe actual. Caduca a los 30 días.
export async function POST(req) {
  try {
    const usuario = await getUsuarioAprobado(req)
    if (!usuario) return Response.json({ error: 'No autorizado' }, { status: 401 })

    await ensureTabla()
    const b = await req.json()
    const payload = {
      paciente: b.paciente || '', documento: b.documento || '', fechaNac: b.fechaNac || '',
      lentes: b.lentes || {}, iolIA: b.iolIA || {}, iolSugerido: b.iolSugerido || {},
      refOD: b.refOD || '', refOI: b.refOI || '', tipoAV: b.tipoAV || 'logmar',
      curvas: b.curvas || {}, interpretacion: b.interpretacion || '', secciones: b.secciones || null,
      perfil: b.perfil || null,
    }
    const token = (randomUUID() + randomUUID()).replace(/-/g, '')

    await pool.query(
      `INSERT INTO informes_compartidos (token, paciente, documento, payload, creado_por, expira_at)
       VALUES ($1,$2,$3,$4,$5, now() + interval '30 days')`,
      [token, payload.paciente, payload.documento, JSON.stringify(payload), usuario.email]
    )

    return Response.json({ ok: true, url: `${APP_URL}/informe/${token}` })
  } catch (e) {
    console.error('Error crear informe compartido:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
