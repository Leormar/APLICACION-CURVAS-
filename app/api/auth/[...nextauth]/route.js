import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import CredentialsProvider from 'next-auth/providers/credentials'
import { SignJWT, importPKCS8 } from 'jose'
import pool from '../../../../lib/db'
import { enviarEmail } from '../../../../lib/email'

async function generateAppleClientSecret() {
  let pem = process.env.APPLE_PRIVATE_KEY || ''
  if (pem.includes('\\n')) pem = pem.replace(/\\n/g, '\n')
  if (!pem.includes('BEGIN')) pem = Buffer.from(pem, 'base64').toString('utf-8')

  const privateKey = await importPKCS8(pem.trim(), 'ES256')

  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID)
    .setAudience('https://appleid.apple.com')
    .setSubject(process.env.APPLE_ID)
    .setIssuedAt()
    .setExpirationTime('180d')
    .sign(privateKey)
}

let appleSecretPromise = null
function getAppleSecret() {
  if (!appleSecretPromise) appleSecretPromise = generateAppleClientSecret()
  return appleSecretPromise
}

const useSecureCookies = (process.env.NEXTAUTH_URL || '').startsWith('https://')
const cookiePrefix = useSecureCookies ? '__Secure-' : ''

async function buildOptions() {
  const providers = [
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
  ]

  // Acceso con correo/contraseña SOLO para el revisor de App Store (no depende de Google/Apple).
  const REV_EMAIL = (process.env.REVISOR_EMAIL || 'revisor@prolens.app').toLowerCase()
  const REV_PASS = process.env.REVISOR_PASS || 'RevisionApple2026'
  providers.push(CredentialsProvider({
    id: 'revisor',
    name: 'Correo',
    credentials: { email: { label: 'Correo', type: 'email' }, password: { label: 'Contraseña', type: 'password' } },
    async authorize(creds) {
      const email = (creds?.email || '').toLowerCase().trim()
      const password = creds?.password || ''
      if (email !== REV_EMAIL || password !== REV_PASS) return null
      try {
        const ex = await pool.query('SELECT id, estado FROM usuarios WHERE email=$1', [email])
        if (ex.rows.length === 0) {
          await pool.query("INSERT INTO usuarios (email, nombre, foto, estado) VALUES ($1,$2,$3,'aprobado')", [email, 'Revisor App Store', ''])
        } else if (ex.rows[0].estado !== 'aprobado') {
          await pool.query("UPDATE usuarios SET estado='aprobado' WHERE email=$1", [email])
        }
      } catch (e) { console.error('revisor authorize:', e.message) }
      return { id: email, email, name: 'Revisor App Store' }
    }
  }))

  const appleConfigured = process.env.APPLE_ID && process.env.APPLE_TEAM_ID
    && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY
  if (appleConfigured) {
    try {
      const clientSecret = await getAppleSecret()
      providers.push(AppleProvider({
        clientId: process.env.APPLE_ID,
        clientSecret,
      }))
    } catch (e) {
      console.error('Apple provider disabled — secret generation failed:', e.message)
      appleSecretPromise = null
    }
  }

  return {
    providers,
    callbacks: {
      async signIn({ user }) {
        try {
          const email = user?.email
          if (!email) return false
          // Cuentas que se aprueban automáticamente (revisor de App Store).
          const EMAILS_AUTO = ['revisor@prolens.app']
          const esAuto = EMAILS_AUTO.includes(email.toLowerCase())
          const name = user.name || email
          const image = user.image || ''
          const existing = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email])
          if (existing.rows.length === 0) {
            await pool.query(
              'INSERT INTO usuarios (email, nombre, foto, estado) VALUES ($1,$2,$3,$4)',
              [email, name, image, esAuto ? 'aprobado' : 'pendiente']
            )
            if (esAuto) return true
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
          // El revisor siempre queda aprobado (por si estaba pendiente/rechazado/inactivo).
          if (esAuto && u.estado !== 'aprobado') {
            await pool.query("UPDATE usuarios SET estado='aprobado' WHERE id=$1", [u.id])
            return true
          }
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
      async jwt({ token }) {
        return { ...token, iat: Date.now() }
      }
    },
    // Apple posts the callback from appleid.apple.com (form_post),
    // so the state/pkce/nonce cookies must be SameSite=None to be sent.
    cookies: {
      state: {
        name: `${cookiePrefix}next-auth.state`,
        options: { httpOnly: true, sameSite: useSecureCookies ? 'none' : 'lax', path: '/', secure: useSecureCookies, maxAge: 900 }
      },
      pkceCodeVerifier: {
        name: `${cookiePrefix}next-auth.pkce.code_verifier`,
        options: { httpOnly: true, sameSite: useSecureCookies ? 'none' : 'lax', path: '/', secure: useSecureCookies, maxAge: 900 }
      },
      nonce: {
        name: `${cookiePrefix}next-auth.nonce`,
        options: { httpOnly: true, sameSite: useSecureCookies ? 'none' : 'lax', path: '/', secure: useSecureCookies }
      },
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
                <p style="color:#64748b;font-size:13px;margin-top:16px">Verifica la configuración OAuth si el error persiste.</p>
              </div>
            </div>`
          })
        } catch(e) { console.error('Error enviando notificación:', e) }
      }
    },
    secret: process.env.NEXTAUTH_SECRET,
  }
}

let cachedHandler = null
async function handler(req, ctx) {
  if (!cachedHandler) cachedHandler = NextAuth(await buildOptions())
  return cachedHandler(req, ctx)
}

export { handler as GET, handler as POST }
