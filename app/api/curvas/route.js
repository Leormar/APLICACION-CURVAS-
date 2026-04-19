import pool from '../../../lib/db'

export async function POST(req) {
  try {
    const { paciente, documento, fechaNac, ojo, iol, refOD, refOI, mediciones } = await req.json()

    if (!paciente) return Response.json({ error: 'Nombre requerido' }, { status: 400 })

    // Buscar paciente existente por documento o crear nuevo
    let pacienteId
    if (documento) {
      const existe = await pool.query(
        'SELECT id FROM pacientes WHERE documento = $1', [documento]
      )
      if (existe.rows.length > 0) {
        // Actualizar datos del paciente existente
        await pool.query(
          `UPDATE pacientes SET nombre=$1, fecha_nacimiento=$2 WHERE documento=$3`,
          [paciente, fechaNac || null, documento]
        )
        pacienteId = existe.rows[0].id
      } else {
        const nuevo = await pool.query(
          `INSERT INTO pacientes (nombre, documento, fecha_nacimiento) VALUES ($1, $2, $3) RETURNING id`,
          [paciente, documento, fechaNac || null]
        )
        pacienteId = nuevo.rows[0].id
      }
    } else {
      const nuevo = await pool.query(
        `INSERT INTO pacientes (nombre, documento, fecha_nacimiento) VALUES ($1, $2, $3) RETURNING id`,
        [paciente, null, fechaNac || null]
      )
      pacienteId = nuevo.rows[0].id
    }

    // Guardar curva con toda la info clínica en notas
    const notasCompletas = JSON.stringify({ iol, refOD, refOI })
    const curvaRes = await pool.query(
      `INSERT INTO curvas (paciente_id, ojo, notas, fecha) VALUES ($1, $2, $3, CURRENT_DATE) RETURNING id`,
      [pacienteId, ojo, notasCompletas]
    )
    const curvaId = curvaRes.rows[0].id

    // Guardar mediciones
    for (const m of mediciones) {
      if (m.agudeza !== null && m.agudeza !== undefined) {
        await pool.query(
          'INSERT INTO mediciones (curva_id, defocus, agudeza) VALUES ($1, $2, $3)',
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
