import nodemailer from 'nodemailer'
import { Resend } from 'resend'

const gmailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

const infoTransporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_INFO_USER,
    pass: process.env.EMAIL_INFO_PASS,
  },
})

// Resend solo se activa si hay una API key real (en Vercel puede venir vacía).
const resendKey = (process.env.RESEND_API_KEY || '').trim()
const resend = resendKey ? new Resend(resendKey) : null
const RESEND_FROM = process.env.RESEND_FROM || 'PROLENS Curvas <recordatorios@curvasdesenfoque.com>'

async function enviarConResend({ to, subject, html, headers }) {
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
    ...(headers ? { headers } : {}),
  })
  if (error) throw new Error(error.message || JSON.stringify(error))
  return data?.id
}

// provider: 'resend' intenta enviar por Resend; si no hay API key, cae a Gmail.
export const enviarEmail = async ({ to, subject, html, useInfo = false, headers, provider }) => {
  try {
    if (provider === 'resend' && resend) {
      try {
        const id = await enviarConResend({ to, subject, html, headers })
        console.log('Email enviado (resend):', id)
        return { ok: true }
      } catch (err) {
        // Si Resend falla (dominio sin verificar, etc.) no perdemos el correo: caemos a Gmail.
        console.warn('Resend falló, usando Gmail como respaldo:', err.message)
      }
    } else if (provider === 'resend') {
      console.warn('RESEND_API_KEY no configurada; usando Gmail como respaldo.')
    }

    const transporter = useInfo ? infoTransporter : gmailTransporter
    const from = useInfo
      ? `PROLENS Curvas <${process.env.EMAIL_INFO_USER}>`
      : `PROLENS Curvas <${process.env.GMAIL_USER}>`
    const result = await transporter.sendMail({ from, to, subject, html, ...(headers ? { headers } : {}) })
    console.log('Email enviado:', result.messageId)
    return { ok: true }
  } catch(e) {
    console.error('Error email:', e.message)
    return { ok: false, error: e.message }
  }
}
