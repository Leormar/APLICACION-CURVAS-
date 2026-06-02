import pool from '../../../lib/db'
import { getServerSession } from 'next-auth'

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, ojo, iol, refOD, refOI, mediciones } = await req.json()
    const session = await getServerSession()
    const usuarioEmail = session?.user?.email || null

    if (!paciente) return Response.json({ error: 'Nombre requerido' }, { status: 400 })

    let pacienteId
    if (documento) {
      const existe = await pool.query(
        'SELECT id FROM pacientes WHERE documento=$1 AND (creado_por=$2 OR creado_por IS NULL)',
        [documento, usuarioEmail]
      )
      if (existe.rows.length > 0) {
        await pool.query(
          'UPDATE pacientes SET nombre=$1, fecha_nacimiento=$2 WHERE id=$3',
          [paciente, fechaNac||null, existe.rows[0].id]
        )
        pacienteId = existe.rows[0].id
      } else {
        const nuevo = await pool.query(
          'INSERT INTO pacientes (nombre, documento, fecha_nacimiento, creado_por) VALUES ($1,$2,$3,$4) RETURNING id',
          [paciente, documento, fechaNac||null, usuarioEmail]
        )
        pacienteId = nuevo.rows[0].id
      }
    } else {
      const nuevo = await pool.query(
        'INSERT INTO pacientes (nombre, documento, fecha_nacimiento, creado_por) VALUES ($1,$2,$3,$4) RETURNING id',
        [paciente, null, fechaNac||null, usuarioEmail]
      )
      pacienteId = nuevo.rows[0].id
    }

    const notasCompletas = JSON.stringify({ iol, refOD, refOI })

    // Reusar la curva del mismo ojo y día si ya existe, en vez de crear una nueva
    // (evita acumular versiones por cada "Guardar"). Se actualiza la más reciente.
    const existeCurva = await pool.query(
      'SELECT id FROM curvas WHERE paciente_id=$1 AND ojo=$2 AND fecha=CURRENT_DATE ORDER BY id DESC LIMIT 1',
      [pacienteId, ojo]
    )
    let curvaId
    if (existeCurva.rows.length > 0) {
      curvaId = existeCurva.rows[0].id
      await pool.query(
        'UPDATE curvas SET notas=$1, usuario_email=$2 WHERE id=$3',
        [notasCompletas, usuarioEmail, curvaId]
      )
      await pool.query('DELETE FROM mediciones WHERE curva_id=$1', [curvaId])
    } else {
      const curvaRes = await pool.query(
        'INSERT INTO curvas (paciente_id, ojo, notas, fecha, usuario_email) VALUES ($1,$2,$3,CURRENT_DATE,$4) RETURNING id',
        [pacienteId, ojo, notasCompletas, usuarioEmail]
      )
      curvaId = curvaRes.rows[0].id
    }

    for (const m of mediciones) {
      if (m.agudeza !== null && m.agudeza !== undefined) {
        await pool.query(
          'INSERT INTO mediciones (curva_id, defocus, agudeza) VALUES ($1,$2,$3)',
          [curvaId, m.defocus, m.agudeza]
        )
      }
    }

    return Response.json({ ok: true, curvaId, pacienteId })
  } catch(e) {
    console.error('Error guardar curva:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
