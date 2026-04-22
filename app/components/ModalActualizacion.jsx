'use client'
import { signOut } from 'next-auth/react'
import LogoProlens from './LogoProlens'

export default function ModalActualizacion({ version }) {
  const handleAceptar = async () => {
    await fetch('/api/auth/version', { method: 'POST' })
    window.location.reload()
  }

  const handleSalir = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'2rem', maxWidth:'420px', width:'100%', textAlign:'center' }}>
        <LogoProlens size={64} />
        <h2 style={{ margin:'1rem 0 0.5rem', color:'#1e40af', fontSize:'1.3rem', fontWeight:800 }}>
          App actualizada
        </h2>
        <div style={{ background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:'8px', padding:'12px', margin:'1rem 0', fontSize:'0.85rem', color:'#92400e', lineHeight:1.6 }}>
          <strong>⚠️ Nueva versión disponible</strong>
          <p style={{ margin:'6px 0 0' }}>
            Se han realizado mejoras importantes en la aplicación. Por seguridad, tu sesión ha sido cerrada. Vuelve a ingresar para continuar.
          </p>
        </div>
        <p style={{ fontSize:'0.8rem', color:'#64748b', margin:'0 0 1.5rem' }}>
          Versión {version}
        </p>
        <button onClick={handleAceptar}
          style={{ width:'100%', padding:'0.9rem', background:'#1e40af', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700, marginBottom:'8px' }}>
          ✅ Entendido — Volver a ingresar
        </button>
        <button onClick={handleSalir}
          style={{ width:'100%', padding:'8px', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:'0.85rem' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
