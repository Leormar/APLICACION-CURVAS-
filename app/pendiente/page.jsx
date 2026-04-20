import LogoProlens from '../components/LogoProlens'

export default function Pendiente() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #0c2461 0%, #1e40af 65%)', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', color:'white', maxWidth:'380px' }}>
        <LogoProlens size={80} />
        <h2 style={{ margin:'1rem 0 0.5rem', fontSize:'1.5rem' }}>Solicitud enviada</h2>
        <p style={{ opacity:0.85, lineHeight:1.7 }}>
          Tu solicitud de acceso está <strong>pendiente de aprobación</strong>. El administrador revisará tu cuenta y recibirás acceso una vez aprobada.
        </p>
        <p style={{ opacity:0.6, fontSize:'0.85rem', marginTop:'1rem' }}>
          Contacta al Dr. Leonardo Orjuela si necesitas acceso urgente.
        </p>
        <a href="/login" style={{ display:'inline-block', marginTop:'1.5rem', padding:'0.75rem 2rem', background:'white', color:'#1e40af', borderRadius:'10px', fontWeight:700, textDecoration:'none' }}>
          Volver
        </a>
      </div>
    </div>
  )
}
