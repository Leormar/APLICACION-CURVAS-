import pool from '../../../../lib/db'
import { enviarEmail } from '../../../../lib/email'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const res = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.fecha_aprobacion
      FROM usuarios u
      WHERE u.estado = 'aprobado'
        AND u.fecha_aprobacion <= NOW() - INTERVAL '7 days'
        AND u.email NOT IN (
          SELECT DISTINCT usuario_email FROM curvas WHERE usuario_email IS NOT NULL
        )
    `)

    const usuarios = res.rows
    let enviados = 0

    for (const usuario of usuarios) {
      await enviarEmail({
        to: usuario.email,
        subject: '📊 ¿Ya registraste tus primeras curvas? - PROLENS',
        html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f8fafc">
          <div style="background:linear-gradient(135deg,#1e40af,#1d4ed8);padding:28px 24px;border-radius:14px 14px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px;font-weight:900;letter-spacing:2px">PROLENS</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Curvas de Desenfoque · MAIdx sd Bench</p>
          </div>
          <div style="background:white;padding:28px 24px;border-radius:0 0 14px 14px;border:1px solid #e2e8f0">
            <h2 style="color:#1e293b;margin:0 0 12px;font-size:18px">Hola <strong>${usuario.nombre}</strong> 👋</h2>
            <p style="color:#475569;line-height:1.7;font-size:14px;margin-bottom:16px">
              Notamos que aún no has registrado ninguna curva de desenfoque en PROLENS. ¡Ya tienes acceso completo y todo listo para empezar!
            </p>
            <div style="background:#f0f9ff;border-radius:10px;padding:16px 20px;margin-bottom:20px;border-left:4px solid #1e40af">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#1e40af">Con PROLENS puedes:</p>
              <div style="font-size:13px;color:#334155;line-height:2">
                📊 Registrar curvas de desenfoque OD · OI · AO<br>
                🤖 Obtener análisis clínico con inteligencia artificial<br>
                📄 Generar informes PDF profesionales al instante<br>
                🔍 Buscar y hacer seguimiento de tus pacientes
              </div>
            </div>
            <div style="text-align:center;margin-bottom:20px">
              <a href="https://aplicacion-curvas.vercel.app" style="display:inline-block;padding:14px 36px;background:#1e40af;color:white;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
                Registrar mi primera curva →
              </a>
            </div>
            <div style="text-align:center;margin-bottom:20px">
              <a href="https://aplicacion-curvas.vercel.app/tutorial" style="font-size:13px;color:#1e40af;text-decoration:none">
                ¿Necesitas ayuda? Ver tutorial paso a paso
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
            <p style="color:#94a3b8;font-size:11px;text-align:center;line-height:1.6;margin:0">
              Dr. Leonardo Orjuela · PROLENS · Medellín, Colombia<br>
              <a href="https://aplicacion-curvas.vercel.app/soporte" style="color:#94a3b8">Soporte</a> · 
              <a href="https://aplicacion-curvas.vercel.app/privacidad" style="color:#94a3b8">Privacidad</a>
            </p>
          </div>
        </div>`
      })
      enviados++
    }

    return Response.json({ ok: true, usuarios_inactivos: usuarios.length, emails_enviados: enviados })

  } catch(e) {
    console.error('Error cron recordatorio:', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
