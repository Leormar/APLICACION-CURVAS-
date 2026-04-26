import pool from '../../../lib/db'
import { getServerSession } from 'next-auth'
import { enviarEmail } from '../../../lib/email'

// GET - Obtener IOLs de referencia
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const categoria = searchParams.get('categoria')
    const nombre = searchParams.get('nombre')

    let query = 'SELECT * FROM iol_referencias WHERE validado = true'
    const params = []

    if (categoria) {
      params.push(categoria)
      query += ` AND categoria = $${params.length}`
    }

    if (nombre) {
      params.push(`%${nombre}%`)
      query += ` AND nombre ILIKE $${params.length}`
    }

    query += ' ORDER BY categoria, nombre'

    const res = await pool.query(query, params)
    return Response.json({ iol: res.rows })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST - Proponer nuevo IOL
export async function POST(req) {
  try {
    const session = await getServerSession()
    const email = session?.user?.email
    const nombre_doctor = session?.user?.name

    const {
      nombre, casa_comercial, categoria, tecnologia,
      referencia_bibliografica,
      v_pos1, v_pos05, v_0, v_neg05, v_neg1, v_neg15,
      v_neg2, v_neg25, v_neg3, v_neg35, v_neg4, v_neg45, v_neg5
    } = await req.json()

    if (!nombre || !casa_comercial || !categoria) {
      return Response.json({ error: 'Nombre, casa comercial y categoría son requeridos' }, { status: 400 })
    }

    // Guardar propuesta
    await pool.query(`
      INSERT INTO iol_propuestas (
        nombre, casa_comercial, categoria, tecnologia,
        referencia_bibliografica, propuesto_por_email, propuesto_por_nombre,
        v_pos1, v_pos05, v_0, v_neg05, v_neg1, v_neg15,
        v_neg2, v_neg25, v_neg3, v_neg35, v_neg4, v_neg45, v_neg5
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    `, [
      nombre, casa_comercial, categoria, tecnologia,
      referencia_bibliografica, email, nombre_doctor,
      v_pos1||null, v_pos05||null, v_0||null, v_neg05||null, v_neg1||null, v_neg15||null,
      v_neg2||null, v_neg25||null, v_neg3||null, v_neg35||null, v_neg4||null, v_neg45||null, v_neg5||null
    ])

    // Notificar al admin por email
    await enviarEmail({
      to: 'drorjuela@lentesespecializados.com',
      subject: `🔬 Nueva propuesta de IOL: ${nombre}`,
      html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
        <div style="background:#1e40af;padding:20px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:20px">PROLENS · Nueva propuesta IOL</h1>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
          <h2 style="color:#1e40af;margin:0 0 16px">🔬 ${nombre}</h2>
          <p><strong>Casa:</strong> ${casa_comercial}</p>
          <p><strong>Categoría:</strong> ${categoria}</p>
          <p><strong>Tecnología:</strong> ${tecnologia||'—'}</p>
          <p><strong>Referencia:</strong> ${referencia_bibliografica||'—'}</p>
          <p><strong>Propuesto por:</strong> ${nombre_doctor} (${email})</p>
          <div style="margin-top:16px;padding:12px;background:#f0f9ff;border-radius:8px;font-size:12px">
            <strong>Curva de referencia:</strong><br>
            +1D: ${v_pos1||'—'} | 0D: ${v_0||'—'} | -1D: ${v_neg1||'—'} | 
            -2D: ${v_neg2||'—'} | -3D: ${v_neg3||'—'}
          </div>
          <div style="text-align:center;margin-top:20px">
            <a href="https://aplicacion-curvas.vercel.app/admin" 
              style="display:inline-block;padding:12px 28px;background:#1e40af;color:white;border-radius:10px;text-decoration:none;font-weight:700">
              Revisar en panel admin →
            </a>
          </div>
        </div>
      </div>`
    })

    return Response.json({ ok: true, mensaje: 'Propuesta enviada para validación' })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
