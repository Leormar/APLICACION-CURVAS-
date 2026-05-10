import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
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
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_PRIVATE_KEY,
      authorization: {
        params: {
          scope: 'name email'
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
            [email, name||email, image||'', 'pendiente']
          )
          await enviarEmail({
            to: 'lorjuela7@gmail.com',
            subject: '🔔 Nueva solicitud de acceso - PROLENS',
            html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px">
              <h2
