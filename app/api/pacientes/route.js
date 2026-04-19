import pool from '../../../lib/db'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const tipo = searchParams.get('tipo') || 'apellido'
    const campo = tipo === 'documento' ? 'p.documento' : 'p.nombre'

    const res = await pool.query(
      `SELECT p.id, p.nombre, p.documento, p.fecha_nacimiento,
        c.id as curva_id, c.ojo, c.notas, c.fecha,
        COALESCE(json_agg(json_build_object('defocus', m.defocus, 'agudeza', m.agudeza) ORDER BY m.defocus) FILTER (WHERE m.id IS NOT NULL), '[]'::json) as mediciones
       FROM pacientes p
       LEFT JOIN curvas c ON c.paciente_id = p.id
       LEFT JOIN mediciones m ON m.curva_id = c.id
       WHERE ${campo} ILIKE $1
       GROUP BY p.id, p.nombre, p.documento, p.fecha_nacimiento, c.id, c.ojo, c.notas, c.fecha
       ORDER BY p.nombre, c.fecha DESC`,
      ['%' + q + '%']
    )
    return Response.json({ pacientes: res.rows })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
