'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

export default function Admin() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState('usuarios')
  const [usuarios, setUsuarios] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoPacientes, setCargandoPacientes] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [confirmando, setConfirmando] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.rol !== 'admin') { router.push('/'); return }
    cargarUsuarios()
  }, [session, status])

  useEffect(() => {
    if (tab === 'pacientes' && pacientes.length === 0) cargarPacientes()
  }, [tab])

  const cargarUsuarios = async () => {
    const res = await fetch('/api/admin/usuarios')
    const data = await res.json()
    setUsuarios(data.usuarios || [])
    setCargando(false)
  }

  const cargarPacientes = async () => {
    setCargandoPacientes(true)
    const res = await fetch('/api/admin/pacientes')
    const data = await res.json()
    setPacientes(data.pacientes || [])
    setCargandoPacientes(false)
  }

  const cambiarEstado = async (id, estado) => {
    await fetch('/api/admin/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado, aprobado_por: session.user.email })
    })
    cargarUsuarios()
  }

  const borrarPaciente = async (paciente) => {
    const res = await fetch('/api/admin/pacientes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: paciente.id })
    })
    const data = await res.json()
    if (data.error) { alert('Error: ' + data.error); return }
    setConfirmando(null)
    setPacientes(prev => prev.filter(p => p.id !== paciente.id))
  }

  const pacientesFiltrados = pacientes.filter(p =>
    !busqueda ||
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.documento?.includes(busqueda) ||
    p.creado_por?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.doctor_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const formatFecha = (f) => {
    if (!f) return '—'
    return new Date(f).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' })
  }

  if (status === 'loading' || cargando) return <div style={{ padding:'2rem', textAlign:'center' }}>Cargando...</div>

  const colores = { pendiente:'#f59e0b', aprobado:'#22c55e', rechazado:'#ef4444' }

  return (
    <div style={{ padding:'1.5rem', maxWidth:'960px', margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1.5rem', borderBottom:'2px solid #1e40af', paddingBottom:'1rem' }}>
        <LogoProlens size={40} />
        <div>
          <h1 style={{ margin:0, color:'#1e40af', fontSize:'1.3rem' }}>Panel de Administración</h1>
          <p style={{ margin:0, color:'#64748b', fontSize:'0.8rem' }}>PROLENS · Curvas IOL IAdx</p>
        </div>
        <a href="/" style={{ marginLeft:'auto', padding:'6px 16px', background:'#1e40af', color:'white', borderRadius:'8px', textDecoration:'none', fontSize:'0.85rem' }}>
          Volver a la app
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem', background:'#f1f5f9', borderRadius:'10px', padding:'4px' }}>
        {[
          { val:'usuarios', label:`Usuarios (${usuarios.length})` },
          { val:'pacientes', label:`Pacientes (${pacientes.length || '…'})` }
        ].map(t => (
          <button key={t.val} onClick={() => setTab(t.val)}
            style={{ flex:1, padding:'8px', border:'none', borderRadius:'7px', cursor:'pointer', fontSize:'0.88rem', fontWeight:600,
              background: tab === t.val ? 'white' : 'transparent',
              color: tab === t.val ? '#1e40af' : '#64748b',
              boxShadow: tab === t.val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB USUARIOS ── */}
      {tab === 'usuarios' && (
        <>
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
        </>
      )}

      {/* ── TAB PACIENTES ── */}
      {tab === 'pacientes' && (
        <>
          <div style={{ marginBottom:'1rem' }}>
            <input
              placeholder="Buscar por paciente, doctor o documento..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width:'100%', padding:'9px 14px', border:'2px solid #e2e8f0', borderRadius:'9px', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#1e40af'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}
            />
          </div>

          <div style={{ background:'white', borderRadius:'12px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid #f1f5f9', fontWeight:600, color:'#1e293b', display:'flex', justifyContent:'space-between' }}>
              <span>Pacientes ({pacientesFiltrados.length}{busqueda ? ` de ${pacientes.length}` : ''})</span>
              <button onClick={cargarPacientes} style={{ background:'none', border:'none', color:'#64748b', fontSize:'0.8rem', cursor:'pointer' }}>
                ↻ Actualizar
              </button>
            </div>

            {cargandoPacientes && (
              <div style={{ padding:'3rem', textAlign:'center', color:'#94a3b8' }}>Cargando pacientes…</div>
            )}

            {!cargandoPacientes && pacientesFiltrados.map(p => (
              <div key={p.id} style={{ padding:'0.875rem 1.25rem', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:'200px' }}>
                  <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.9rem' }}>{p.nombre}</div>
                  {p.documento && <div style={{ fontSize:'0.75rem', color:'#64748b' }}>Doc: {p.documento}</div>}
                  <div style={{ fontSize:'0.75rem', color:'#7c3aed', marginTop:'2px' }}>
                    Doctor: <strong>{p.doctor_nombre || p.creado_por || 'Desconocido'}</strong>
                    {p.doctor_nombre && p.creado_por && <span style={{ color:'#94a3b8' }}> · {p.creado_por}</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', fontSize:'0.75rem', color:'#64748b' }}>
                  <div>{p.total_examenes} examen{p.total_examenes != 1 ? 'es' : ''}</div>
                  <div>Último: {formatFecha(p.ultimo_examen)}</div>
                </div>
                <button onClick={() => setConfirmando(p)}
                  style={{ padding:'5px 12px', background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:500 }}>
                  Eliminar
                </button>
              </div>
            ))}

            {!cargandoPacientes && pacientesFiltrados.length === 0 && (
              <div style={{ padding:'2rem', textAlign:'center', color:'#94a3b8' }}>
                {busqueda ? 'No se encontraron pacientes con ese filtro' : 'No hay pacientes registrados'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de confirmación borrado */}
      {confirmando && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
          onClick={e => e.target === e.currentTarget && setConfirmando(null)}>
          <div style={{ background:'white', borderRadius:'14px', padding:'1.75rem', maxWidth:'400px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin:'0 0 8px', color:'#dc2626' }}>⚠️ Eliminar paciente</h3>
            <p style={{ margin:'0 0 16px', color:'#374151', fontSize:'0.9rem', lineHeight:1.6 }}>
              ¿Estás seguro de eliminar a <strong>{confirmando.nombre}</strong> y todos sus exámenes?
            </p>
            <div style={{ background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px', fontSize:'0.82rem', color:'#92400e' }}>
              Se notificará por email al doctor <strong>{confirmando.doctor_nombre || confirmando.creado_por || 'registrado'}</strong> que el paciente fue eliminado por falta de uso.
            </div>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmando(null)}
                style={{ padding:'8px 18px', background:'#f1f5f9', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.88rem', color:'#64748b' }}>
                Cancelar
              </button>
              <button onClick={() => borrarPaciente(confirmando)}
                style={{ padding:'8px 18px', background:'#ef4444', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.88rem', fontWeight:600 }}>
                Sí, eliminar y notificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
