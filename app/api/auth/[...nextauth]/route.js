import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import pool from '../../../../lib/db'
import { enviarEmail } from '../../../../lib/email'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        const { email, name, image } = user
        const existing = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email])
        if (existing.rows.length === 0) {
          await pool.query(
            'INSERT INTO usuarios (email, nombre, foto, estado) VALUES ($1,$2,$3,$4)',
            [email, name, image, 'pendiente']
          )
          await enviarEmail({
            to: 'lorjuela7@gmail.com',
            subject: '🔔 Nueva solicitud de acceso - PROLENS',
            html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
              <h2 style="color:#1e40af">Nueva solicitud de acceso</h2>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p>Ingresa al panel de administración para aprobar o rechazar.</p>
              <a href="https://curvasdesenfoque.com/admin" style="display:inline-block;padding:12px 24px;background:#1e40af;color:white;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
                Ver panel de admin
              </a>
            </div>`
          })
          return '/pendiente'
        }
        const u = existing.rows[0]
        if (u.estado === 'aprobado') return true
        if (u.estado === 'rechazado') return '/rechazado'
        return '/pendiente'
      } catch(e) {
        console.error('Auth error:', e)
        return false
      }
    },
    async session({ session }) {
      try {
        const res = await pool.query('SELECT * FROM usuarios WHERE email=$1', [session.user.email])
        if (res.rows.length > 0) {
          session.user.estado = res.rows[0].estado
          session.user.rol = res.rows[0].rol
          session.user.id = res.rows[0].id
          session.user.tutorial_completado = res.rows[0].tutorial_completado
        }
      } catch(e) {}
      return session
    },
    async jwt({ token, trigger }) {
      // Forzar reload en cada session update
      return { ...token, iat: Date.now() }
    }
  },
  pages: { signIn: '/login', error: '/login' },
events: {
  async signInError({ error, user }) {
    try {
      await enviarEmail({
        to: 'lorjuela7@gmail.com',
        subject: '⚠️ Error de acceso - PROLENS',
        html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f8fafc">
          <div style="background:#991b1b;padding:16px 20px;border-radius:12px 12px 0 0">
            <h2 style="color:white;margin:0;font-size:18px">⚠️ Error de acceso en PROLENS</h2>
          </div>
          <div style="background:white;padding:20px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0">
            <p><strong>Error:</strong> ${error || 'redirect_uri_mismatch u otro error OAuth'}</p>
            <p><strong>Usuario:</strong> ${user?.email || 'desconocido'}</p>
            <p><strong>Hora:</strong> ${new Date().toLocaleString('es-CO', {timeZone:'America/Bogota'})}</p>
            <p style="color:#64748b;font-size:13px;margin-top:16px">Verifica la configuración OAuth en Google Cloud Console si el error persiste.</p>
            <a href="https://console.cloud.google.com" style="display:inline-block;padding:10px 20px;background:#1e40af;color:white;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
              Ir a Google Cloud Console
            </a>
          </div>
        </div>`
      })
    } catch(e) { console.error('Error enviando notificación:', e) }
  }
},
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
