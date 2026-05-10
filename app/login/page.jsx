'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import LogoProlens from '../components/LogoProlens'

function LoginContent() {
  const params = useSearchParams()
  const error = params.get('error')

  const handleLogin = () => {
    // Forzar selector de cuenta cada vez
    signIn('google', {
      callbackUrl: '/',
      prompt: 'select_account'
    })
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 65%, #1d4ed8 100%)', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', color:'white', maxWidth:'380px', width:'100%' }}>
        <div style={{ marginBottom:'1rem', filter:'drop-shadow(0 6px 20px rgba(0,0,0,0.4))' }}>
          <LogoProlens size={110} />
        </div>
        <h1 style={{ margin:'0 0 4px', fontSize:'2.5rem', fontWeight:900, letterSpacing:'2px' }}>PROLENS</h1>
        <p style={{ margin:'0 0 4px', fontSize:'1.1rem', fontWeight:600, opacity:0.95 }}>Curvas de Desenfoque</p>
        <p style={{ margin:'0 0 8px', fontSize:'0.82rem', opacity:0.7 }}>Dr. Leonardo Orjuela · Medellín</p>
        <div style={{ display:'inline-block', background:'rgba(255,255,255,0.2)', borderRadius:'20px', padding:'5px 18px', marginBottom:'1.5rem', fontSize:'0.82rem', fontWeight:700, letterSpacing:'1px' }}>
          MAIdx sd Bench
        </div>

        <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'14px', padding:'1.25rem', marginBottom:'1.5rem', border:'1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ margin:'0 0 0.75rem', fontSize:'0.92rem', lineHeight:1.7, opacity:0.95 }}>
            Herramienta clínica para análisis de curvas de desenfoque en pacientes con IOL multifocal y EDOF.
          </p>
          <p style={{ margin:0, fontSize:'0.78rem', opacity:0.7 }}>
            Uso exclusivo para profesionales autorizados
          </p>
        </div>

        <button onClick={handleLogin}
          style={{ width:'100%', padding:'1rem', background:'white', color:'#1e293b', border:'none', borderRadius:'12px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'0.6rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.8 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C40.9 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Ingresar con Google
        </button>
        <button onClick={() => signIn('apple', { callbackUrl: '/' })}
          style={{ width:'100%', padding:'1rem', background:'#000', color:'white', border:'none', borderRadius:'12px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'0.75rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Ingresar con Apple
        </button>
        {error === 'OAuthCallback' || error === 'invalid_redirect_url' ? (
          <p style={{ margin:'0 0 6px', fontSize:'0.78rem', color:'#fecaca', background:'rgba(127,29,29,0.4)', padding:'8px 12px', borderRadius:'8px' }}>
            Error de autenticación. Verifica que el dominio esté autorizado.
          </p>
        ) : null}
        <p style={{ margin:0, fontSize:'0.72rem', opacity:0.55 }}>
          Puedes elegir con qué cuenta ingresar
        </p>
      </div>
    </div>
  )
}

export default function Login() {
  return <Suspense fallback={null}><LoginContent /></Suspense>
}
