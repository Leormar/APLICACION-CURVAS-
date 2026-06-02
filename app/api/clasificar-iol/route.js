import pool from '../../../lib/db'
import { clasificarCurva } from '../../../lib/iol-match'

export async function POST(req) {
  try {
    const { mediciones } = await req.json()
    // mediciones = [{defocus: -5, agudeza: 0.8}, ...]

    if (!mediciones || mediciones.length < 3) {
      return Response.json({ error: 'Mínimo 3 puntos requeridos' }, { status: 400 })
    }

    const refs = await pool.query('SELECT * FROM iol_referencias WHERE validado = true')
    const resultado = clasificarCurva(mediciones, refs.rows)
    if (!resultado) {
      return Response.json({ error: 'No se pudo clasificar la curva' }, { status: 400 })
    }

    return Response.json({ ok: true, ...resultado })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
