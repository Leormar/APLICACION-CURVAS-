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
              <a href="https://aplicacion-curvas.vercel.app/admin" style="display:inline-block;padding:12px 24px;background:#1e40af;color:white;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
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
    async jwt({ token }) { return token }
  },
  pages: { signIn: '/login', error: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
