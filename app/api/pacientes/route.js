import pool from '../../../lib/db'
import { getServerSession } from 'next-auth'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const tipo = searchParams.get('tipo') || 'apellido'
    const session = await getServerSession()
    const usuarioEmail = session?.user?.email
    const esAdmin = session?.user?.rol === 'admin'

    const campo = tipo === 'documento' ? 'p.documento' : 'p.nombre'

    // Admin ve todos, usuario solo los suyos
    const filtroUsuario = esAdmin
      ? ''
      : `AND (p.creado_por = '${usuarioEmail}' OR p.creado_por IS NULL OR p.creado_por = 'sistema')`

    const res = await pool.query(
      `SELECT
        p.id, p.nombre, p.documento, p.fecha_nacimiento, p.creado_por,
        c.id as curva_id, c.ojo, c.notas, c.fecha, c.usuario_email,
        COALESCE(
          json_agg(
            json_build_object('defocus', m.defocus, 'agudeza', m.agudeza)
            ORDER BY m.defocus
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) as mediciones
       FROM pacientes p
       LEFT JOIN curvas c ON c.paciente_id = p.id
       LEFT JOIN mediciones m ON m.curva_id = c.id
       WHERE ${campo} ILIKE $1 ${filtroUsuario}
       GROUP BY p.id, p.nombre, p.documento, p.fecha_nacimiento, p.creado_por,
                c.id, c.ojo, c.notas, c.fecha, c.usuario_email
       ORDER BY p.nombre, c.fecha DESC`,
      [`%${q}%`]
    )
    return Response.json({ pacientes: res.rows })
  } catch(e) {
    console.error('Error búsqueda:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
