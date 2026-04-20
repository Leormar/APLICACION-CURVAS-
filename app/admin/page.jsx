'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.rol !== 'admin') { router.push('/'); return }
    cargarUsuarios()
  }, [session, status])

  const cargarUsuarios = async () => {
    const res = await fetch('/api/admin/usuarios')
    const data = await res.json()
    setUsuarios(data.usuarios || [])
    setCargando(false)
  }

  const cambiarEstado = async (id, estado) => {
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado, aprobado_por: session.user.email })
    })
    cargarUsuarios()
  }

  if (status === 'loading' || cargando) return <div style={{ padding:'2rem', textAlign:'center' }}>Cargando...</div>

  const colores = { pendiente:'#f59e0b', aprobado:'#22c55e', rechazado:'#ef4444' }

  return (
    <div style={{ padding:'1.5rem', maxWidth:'900px', margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1.5rem', borderBottom:'2px solid #1e40af', paddingBottom:'1rem' }}>
        <LogoProlens size={40} />
        <div>
          <h1 style={{ margin:0, color:'#1e40af', fontSize:'1.3rem' }}>Panel de Administración</h1>
          <p style={{ margin:0, color:'#64748b', fontSize:'0.8rem' }}>PROLENS · Gestión de usuarios</p>
        </div>
        <a href="/" style={{ marginLeft:'auto', padding:'6px 16px', background:'#1e40af', color:'white', borderRadius:'8px', textDecoration:'none', fontSize:'0.85rem' }}>
          ← App
        </a>
      </div>

      <div style={{ display:'flex', gap:'12px', marginBottom:'1.5rem' }}>
        {['pendiente','aprobado','rechazado'].map(e => (
          <div key={e} style={{ flex:1, background:'white', borderRadius:'10px', padding:'1rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', textAlign:'center', borderTop:`3px solid ${colores[e]}` }}>
            <div style={{ fontSize:'1.5rem', fontWeight:700, color:colores[e] }}>{usuarios.filter(u=>u.estado===e).length}</div>
            <div style={{ fontSize:'0.8rem', color:'#64748b', textTransform:'capitalize' }}>{e}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'white', borderRadius:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden' }}>
        <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9', fontWeight:600, color:'#1e293b' }}>
          Usuarios ({usuarios.length})
        </div>
        {usuarios.map(u => (
          <div key={u.id} style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            {u.foto && <img src={u.foto} style={{ width:36, height:36, borderRadius:'50%' }} />}
            <div style={{ flex:1, minWidth:'200px' }}>
              <div style={{ fontWeight:500, color:'#1e293b', fontSize:'0.9rem' }}>{u.nombre}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b' }}>{u.email}</div>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{new Date(u.fecha_solicitud).toLocaleDateString('es-CO')}</div>
            </div>
            <span style={{ padding:'2px 10px', borderRadius:'10px', fontSize:'0.75rem', fontWeight:600, background:colores[u.estado]+'22', color:colores[u.estado] }}>
              {u.estado}
            </span>
            {u.rol !== 'admin' && (
              <div style={{ display:'flex', gap:'6px' }}>
                {u.estado !== 'aprobado' && (
                  <button onClick={()=>cambiarEstado(u.id,'aprobado')}
                    style={{ padding:'5px 12px', background:'#22c55e', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:500 }}>
                    Aprobar
                  </button>
                )}
                {u.estado !== 'rechazado' && (
                  <button onClick={()=>cambiarEstado(u.id,'rechazado')}
                    style={{ padding:'5px 12px', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:500 }}>
                    Rechazar
                  </button>
                )}
              </div>
            )}
            {u.rol === 'admin' && <span style={{ fontSize:'0.75rem', color:'#7c3aed', fontWeight:600 }}>Admin</span>}
          </div>
        ))}
        {usuarios.length === 0 && <div style={{ padding:'2rem', textAlign:'center', color:'#94a3b8' }}>No hay usuarios registrados</div>}
      </div>
    </div>
  )
}
