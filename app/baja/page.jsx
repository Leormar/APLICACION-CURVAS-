'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

function BajaContenido() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const error = searchParams.get('error')
  const [motivo, setMotivo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const enviarMotivo = async () => {
    if (!motivo.trim() || !token) { setEnviado(true); return }
    setEnviando(true)
    try {
      await fetch('/api/baja-motivo', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token, motivo }) })
    } catch (e) { /* no bloqueamos al usuario por esto */ }
    setEnviando(false)
    setEnviado(true)
  }

  const card = { background:'white', borderRadius:'20px', maxWidth:'520px', width:'100%', overflow:'hidden' }
  const wrap = { minHeight:'100vh', background:'linear-gradient(160deg,#0c2461,#1e40af)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }

  if (error) return (
    <div style={wrap}>
      <div style={{ ...card, padding:'2.5rem', textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚠️</div>
        <h2 style={{ color:'#991b1b', margin:'0 0 1rem' }}>Enlace no válido</h2>
        <p style={{ color:'#475569', lineHeight:1.7 }}>No pudimos procesar la cancelación. El enlace puede haber caducado. Si sigues recibiendo correos, responde a este mensaje y lo gestionamos manualmente.</p>
        <a href="/" style={{ display:'inline-block', marginTop:'1.5rem', padding:'0.75rem 2rem', background:'#1e40af', color:'white', borderRadius:'10px', textDecoration:'none', fontWeight:700 }}>Ir a la app</a>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ background:'linear-gradient(135deg,#1e40af,#7c3aed)', padding:'1.5rem 2rem', textAlign:'center' }}>
          <LogoProlens size={48} />
          <h1 style={{ color:'white', margin:'0.75rem 0 0.25rem', fontSize:'1.2rem', fontWeight:800 }}>PROLENS · Curvas de Desenfoque</h1>
        </div>
        <div style={{ padding:'2rem' }}>
          <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'3rem' }}>✅</div>
            <h2 style={{ color:'#166534', margin:'0.5rem 0 0.5rem' }}>Has cancelado los recordatorios</h2>
            <p style={{ color:'#475569', lineHeight:1.7, margin:0 }}>No volverás a recibir correos de recordatorio. Tu cuenta sigue activa y puedes entrar a la app cuando quieras.</p>
          </div>

          {!enviado ? (
            <>
              <p style={{ fontWeight:600, color:'#1e293b', margin:'0 0 0.75rem', fontSize:'0.95rem' }}>¿Nos cuentas por qué? <span style={{ color:'#94a3b8', fontWeight:400 }}>(opcional)</span></p>
              <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Tu opinión nos ayuda a mejorar..." style={{ width:'100%', minHeight:'90px', border:'2px solid #e2e8f0', borderRadius:'10px', padding:'12px', fontSize:'0.9rem', fontFamily:'inherit', resize:'vertical', boxSizing:'border-box' }} />
              <button onClick={enviarMotivo} disabled={enviando} style={{ width:'100%', marginTop:'1rem', padding:'0.9rem', background:enviando?'#94a3b8':'#1e40af', color:'white', border:'none', borderRadius:'12px', fontSize:'1rem', cursor:'pointer', fontWeight:700 }}>
                {enviando ? 'Enviando...' : 'Enviar opinión'}
              </button>
              <a href="/" style={{ display:'block', textAlign:'center', marginTop:'1rem', color:'#1e40af', textDecoration:'none', fontSize:'0.9rem' }}>Volver a la app</a>
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <p style={{ color:'#166534', fontWeight:600 }}>🙏 Gracias por tu opinión</p>
              <a href="/" style={{ display:'inline-block', marginTop:'0.5rem', padding:'0.75rem 2rem', background:'#1e40af', color:'white', borderRadius:'10px', textDecoration:'none', fontWeight:700 }}>Volver a la app</a>
            </div>
          )}
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:'0.78rem', marginTop:'1.5rem' }}>PROLENS · Dr. Leonardo Orjuela · Medellín</p>
        </div>
      </div>
    </div>
  )
}

export default function BajaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <BajaContenido />
    </Suspense>
  )
}
