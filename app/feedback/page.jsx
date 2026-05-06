'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LogoProlens from '../components/LogoProlens'

function FeedbackForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [form, setForm] = useState({ facil_usar:'', completo_tutorial:'', probo_paciente:'', registro_curva:'', aporto_ia:'', comentario:'' })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const opciones2 = ['Si', 'No']
  const opciones3 = ['Si', 'No', 'Podria mejorar']
  const preguntas = [
    { key:'facil_usar', label:'La aplicacion curvasdesenfoque.com le parecio facil de usar?', opciones:opciones3 },
    { key:'completo_tutorial', label:'Completo el tutorial clinico?', opciones:opciones2 },
    { key:'probo_paciente', label:'Probo el paciente de prueba?', opciones:opciones2 },
    { key:'registro_curva', label:'Registro una curva de desenfoque real?', opciones:opciones2 },
    { key:'aporto_ia', label:'El analisis con IA MAIdx sd Bench le aporto al diagnostico?', opciones:opciones3 },
  ]
  const enviar = async () => {
    if (!form.facil_usar||!form.completo_tutorial||!form.probo_paciente||!form.registro_curva||!form.aporto_ia) { setError('Por favor responda todas las preguntas.'); return }
    setEnviando(true); setError('')
    try {
      const res = await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, token}) })
      const data = await res.json()
      if (data.ok) setEnviado(true)
      else setError('Error al enviar. Intente de nuevo.')
    } catch(e) { setError('Error de conexion.') }
    setEnviando(false)
  }
  if (enviado) return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0c2461,#1e40af)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'white',borderRadius:'20px',padding:'2.5rem',maxWidth:'480px',width:'100%',textAlign:'center'}}>
        <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🎉</div>cc
        <h2 style={{color:'#166534',margin:'0 0 1rem'}}>Gracias por su opinion</h2>
        <p style={{color:'#475569',lineHeight:1.7}}>Su feedback es muy valioso para mejorar CURVASDESENFOQUE.COM.</p>
        <a href="/" style={{display:'inline-block',marginTop:'1.5rem',padding:'0.75rem 2rem',background:'#1e40af',color:'white',borderRadius:'10px',textDecoration:'none',fontWeight:700}}>Volver a la app</a>
      </div>
    </div>
  )
  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#0c2461,#1e40af)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{background:'white',borderRadius:'20px',maxWidth:'560px',width:'100%',overflow:'hidden'}}>
        <div style={{background:'linear-gradient(135deg,#1e40af,#7c3aed)',padding:'1.5rem 2rem',textAlign:'center'}}>
          <LogoProlens size={48} />
          <h1 style={{color:'white',margin:'0.75rem 0 0.25rem',fontSize:'1.2rem',fontWeight:800}}>PROLENS - Curvas de Desenfoque</h1>
          <p style={{color:'rgba(255,255,255,0.8)',margin:0,fontSize:'0.85rem'}}>Cuentenos su experiencia con la plataforma</p>
        </div>
        <div style={{padding:'2rem'}}>
          {preguntas.map((p,idx) => (
            <div key={p.key} style={{marginBottom:'1.5rem'}}>
              <p style={{fontWeight:600,color:'#1e293b',margin:'0 0 0.75rem',fontSize:'0.95rem'}}>{idx+1}. {p.label}</p>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                {p.opciones.map(op => (
                  <button key={op} onClick={() => setForm(f=>({...f,[p.key]:op}))}
                    style={{padding:'8px 20px',border:`2px solid ${form[p.key]===op?'#1e40af':'#e2e8f0'}`,borderRadius:'20px',background:form[p.key]===op?'#1e40af':'white',color:form[p.key]===op?'white':'#475569',cursor:'pointer',fontWeight:form[p.key]===op?700:400,fontSize:'0.9rem'}}>
                    {op}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div style={{marginBottom:'1.5rem'}}>
            <p style={{fontWeight:600,color:'#1e293b',margin:'0 0 0.75rem',fontSize:'0.95rem'}}>6. Que piensa de la herramienta? (Comentario libre)</p>
            <textarea value={form.comentario} onChange={e=>setForm(f=>({...f,comentario:e.target.value}))} placeholder="Escriba aqui su opinion..." style={{width:'100%',minHeight:'100px',border:'2px solid #e2e8f0',borderRadius:'10px',padding:'12px',fontSize:'0.9rem',fontFamily:'inherit',resize:'vertical',boxSizing:'border-box'}}/>
          </div>
          {error && <div style={{background:'#fee2e2',color:'#991b1b',padding:'10px 16px',borderRadius:'8px',marginBottom:'1rem',fontSize:'0.9rem'}}>{error}</div>}
          <button onClick={enviar} disabled={enviando} style={{width:'100%',padding:'1rem',background:enviando?'#94a3b8':'#1e40af',color:'white',border:'none',borderRadius:'12px',fontSize:'1.05rem',cursor:'pointer',fontWeight:700}}>
            {enviando?'Enviando...':'Enviar mi opinion'}
          </button>
          <p style={{textAlign:'center',color:'#94a3b8',fontSize:'0.78rem',marginTop:'1rem'}}>PROLENS - Dr. Leonardo Orjuela - Medellin</p>
        </div>
      </div>
    </div>
  )
}
export default function FeedbackPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FeedbackForm />
    </Suspense>
  )
}
