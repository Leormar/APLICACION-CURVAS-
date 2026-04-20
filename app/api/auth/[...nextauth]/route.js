import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import pool from '../../../../lib/db'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        const { email, name, image } = user
        // Buscar usuario
        const existing = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email])
        if (existing.rows.length === 0) {
          // Crear usuario pendiente
          await pool.query(
            'INSERT INTO usuarios (email, nombre, foto, estado) VALUES ($1,$2,$3,$4)',
            [email, name, image, 'pendiente']
          )
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
    async session({ session, token }) {
      try {
        const res = await pool.query('SELECT * FROM usuarios WHERE email=$1', [session.user.email])
        if (res.rows.length > 0) {
          session.user.estado = res.rows[0].estado
          session.user.rol = res.rows[0].rol
          session.user.id = res.rows[0].id
        }
      } catch(e) {}
      return session
    },
    async jwt({ token }) { return token }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
