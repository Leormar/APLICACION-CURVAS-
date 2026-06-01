import { SignJWT, jwtVerify } from 'jose'

// Clave HMAC derivada del secreto de NextAuth (ya configurado en el proyecto).
function getSecret() {
  const s = process.env.NEXTAUTH_SECRET
  if (!s) throw new Error('NEXTAUTH_SECRET no configurado')
  return new TextEncoder().encode(s)
}

// Crea un token firmado para dar de baja a un usuario concreto.
// No expira pronto: los correos pueden leerse días después.
export async function crearTokenBaja(userId) {
  return await new SignJWT({ t: 'baja' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .sign(getSecret())
}

// Verifica el token y devuelve el userId (string) o null si es inválido.
export async function verificarTokenBaja(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (payload.t !== 'baja' || !payload.sub) return null
    return payload.sub
  } catch {
    return null
  }
}
