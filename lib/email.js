import nodemailer from 'nodemailer'

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

export const enviarEmail = async ({ to, subject, html, useInfo = false, headers }) => {
  try {
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
