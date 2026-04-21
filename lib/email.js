import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

export const enviarEmail = async ({ to, subject, html }) => {
  try {
    const result = await transporter.sendMail({
      from: `PROLENS Curvas <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    })
    console.log('Email enviado:', result.messageId)
    return { ok: true }
  } catch(e) {
    console.error('Error email:', e.message)
    return { ok: false, error: e.message }
  }
}
