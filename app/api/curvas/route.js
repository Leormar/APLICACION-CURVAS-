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
    const curvaRes = await pool.query(
      'INSERT INTO curvas (paciente_id, ojo, notas, fecha, usuario_email) VALUES ($1,$2,$3,CURRENT_DATE,$4) RETURNING id',
      [pacienteId, ojo, notasCompletas, usuarioEmail]
    )
    const curvaId = curvaRes.rows[0].id

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
