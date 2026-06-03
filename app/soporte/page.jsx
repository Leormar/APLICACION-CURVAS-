import { SOPORTE_EMAIL } from '../../lib/config'

export const metadata = { title: 'Soporte · PROLENS' }

export default function SoportePage() {
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:'2rem 1rem' }}>
      <div style={{ maxWidth:'640px', margin:'0 auto', background:'white', borderRadius:'16px', padding:'2.5rem', border:'1px solid #e2e8f0', textAlign:'center' }}>
        <h1 style={{ color:'#1e40af', margin:'0 0 0.5rem' }}>Soporte</h1>
        <p style={{ color:'#475569', lineHeight:1.7 }}>
          ¿Tienes dudas, encontraste un problema o quieres sugerir algo? Escríbenos y te respondemos.
        </p>
        <a href={`mailto:${SOPORTE_EMAIL}?subject=Soporte%20PROLENS`} style={{ display:'inline-block', margin:'1rem 0', padding:'0.85rem 2rem', background:'#1e40af', color:'white', borderRadius:'12px', textDecoration:'none', fontWeight:700 }}>
          Escribir a soporte
        </a>
        <p style={{ color:'#64748b', fontSize:'0.9rem' }}>
          {SOPORTE_EMAIL}
        </p>
        <p style={{ color:'#94a3b8', fontSize:'0.8rem', marginTop:'1.5rem' }}>
          Dr. Leonardo Orjuela · PROLENS · Medellín, Colombia
        </p>
        <a href="/" style={{ display:'inline-block', marginTop:'0.5rem', color:'#1e40af', textDecoration:'none', fontWeight:600 }}>Volver a la app</a>
      </div>
    </div>
  )
}
