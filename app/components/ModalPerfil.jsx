'use client'
import { useState, useRef } from 'react'
import LogoProlens from './LogoProlens'

export default function ModalPerfil({ onGuardado, perfilInicial, obligatorio }) {
  const [nombre, setNombre] = useState(perfilInicial?.nombre_completo || '')
  const [especialidad, setEspecialidad] = useState(perfilInicial?.especialidad || '')
  const [emailProf, setEmailProf] = useState(perfilInicial?.email_profesional || '')
  const [telefono, setTelefono] = useState(perfilInicial?.telefono || '')
  const [ciudad, setCiudad] = useState(perfilInicial?.ciudad || '')
  const [logo, setLogo] = useState(perfilInicial?.logo_base64 || null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  const handleLogo = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500000) { setError('Logo muy grande, máximo 500KB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleGuardar = async () => {
    if (!nombre || !especialidad || !emailProf || !ciudad) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const res = await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_completo: nombre, especialidad, email_profesional: emailProf, telefono, ciudad, logo_base64: logo })
      })
      if (res.ok) onGuardado({ nombre_completo: nombre, especialidad, email_profesional: emailProf, telefono, ciudad, logo_base64: logo })
    } catch(e) { setError('Error guardando perfil') }
    setGuardando(false)
  }

  const s = {
    inp: { width:'100%', padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:'8px', fontSize:'15px', boxSizing:'border-box' },
    lbl: { fontSize:'0.8rem', color:'#475569', marginBottom:'4px', display:'block', fontWeight:600 },
    row: { marginBottom:'0.75rem' }
  }

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'1.5rem', maxWidth:'500px', width:'100%', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
          <LogoProlens size={56} />
          <h2 style={{ margin:'10px 0 4px', color:'#1e40af', fontSize:'1.2rem', fontWeight:800 }}>Perfil del profesional</h2>
          <p style={{ margin:0, fontSize:'0.82rem', color:obligatorio?'#dc2626':'#64748b', fontWeight:obligatorio?600:400 }}>
    {obligatorio ? '⚠️ Completa tu perfil para continuar — aparecerá en tus informes PDF' : 'Esta información aparecerá en los informes PDF'}
  </p>
        </div>

        {/* Logo */}
        <div style={{ ...s.row, textAlign:'center' }}>
          <label style={s.lbl}>Logo del consultorio</label>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', justifyContent:'center' }}>
            {logo
              ? <img src={logo} style={{ height:60, maxWidth:180, objectFit:'contain', borderRadius:'8px', border:'1px solid #e2e8f0' }} />
              : <div style={{ width:80, height:60, background:'#f1f5f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.75rem' }}>Sin logo</div>
            }
            <button onClick={()=>fileRef.current.click()}
              style={{ padding:'8px 16px', background:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'8px', cursor:'pointer', fontSize:'0.85rem', color:'#475569' }}>
              {logo ? 'Cambiar' : 'Subir logo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogo} />
          </div>
          <p style={{ fontSize:'0.72rem', color:'#94a3b8', margin:'4px 0 0' }}>PNG, JPG · Máximo 500KB</p>
        </div>

        <div style={s.row}>
          <label style={s.lbl}>Nombre completo *</label>
          <input style={s.inp} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Dr. Leonardo Orjuela" />
        </div>

        <div style={s.row}>
          <label style={s.lbl}>Especialidad *</label>
          <input style={s.inp} value={especialidad} onChange={e=>setEspecialidad(e.target.value)} placeholder="Contactología Especializada y Optometría Especializada" />
        </div>

        <div style={s.row}>
          <label style={s.lbl}>Email profesional *</label>
          <input style={s.inp} value={emailProf} onChange={e=>setEmailProf(e.target.value)} placeholder="drorjuela@lentesespecializados.com" type="email" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
          <div>
            <label style={s.lbl}>Teléfono</label>
            <input style={s.inp} value={telefono} onChange={e=>setTelefono(e.target.value)} placeholder="+57 300 000 0000" />
          </div>
          <div>
            <label style={s.lbl}>Ciudad *</label>
            <input style={s.inp} value={ciudad} onChange={e=>setCiudad(e.target.value)} placeholder="Medellín" />
          </div>
        </div>

        {obligatorio && (
          <div style={{ background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:'8px', padding:'10px 12px', marginBottom:'0.75rem', fontSize:'0.82rem', color:'#92400e' }}>
            <strong>Primera vez en la app</strong> — necesitas completar tu perfil profesional para generar informes PDF correctamente.
          </div>
        )}
        {error && <p style={{ color:'#ef4444', fontSize:'0.82rem', margin:'0 0 0.75rem', padding:'8px', background:'#fef2f2', borderRadius:'6px' }}>{error}</p>}

        <button onClick={handleGuardar} disabled={guardando}
          style={{ width:'100%', padding:'0.9rem', background:'#1e40af', color:'white', border:'none', borderRadius:'10px', fontSize:'1rem', cursor:'pointer', fontWeight:700 }}>
          {guardando ? 'Guardando...' : '💾 Guardar perfil'}
        </button>
      </div>
    </div>
  )
}
