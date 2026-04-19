import pool from '../../../lib/db'
export async function POST(req) {
  try {
    const { paciente, ojo, iol, mediciones } = await req.json()
    const pacRes = await pool.query('INSERT INTO pacientes (nombre) VALUES ($1) RETURNING id', [paciente])
    const pacienteId = pacRes.rows[0].id
    const curvaRes = await pool.query('INSERT INTO curvas (paciente_id, ojo, notas) VALUES ($1, $2, $3) RETURNING id', [pacienteId, ojo, iol])
    const curvaId = curvaRes.rows[0].id
    for (const m of mediciones) {
      await pool.query('INSERT INTO mediciones (curva_id, defocus, agudeza) VALUES ($1, $2, $3)', [curvaId, m.defocus, m.agudeza])
    }
    return Response.json({ ok: true, curvaId })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
