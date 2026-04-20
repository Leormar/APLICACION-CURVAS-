import LogoProlens from '../components/LogoProlens'

export default function Rechazado() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg, #7f1d1d 0%, #991b1b 65%)', padding:'1.5rem' }}>
      <div style={{ textAlign:'center', color:'white', maxWidth:'380px' }}>
        <LogoProlens size={80} />
        <h2 style={{ margin:'1rem 0 0.5rem', fontSize:'1.5rem' }}>Acceso denegado</h2>
        <p style={{ opacity:0.85, lineHeight:1.7 }}>
          Tu solicitud de acceso fue <strong>rechazada</strong>. Contacta al administrador si crees que es un error.
        </p>
        <a href="/login" style={{ display:'inline-block', marginTop:'1.5rem', padding:'0.75rem 2rem', background:'white', color:'#991b1b', borderRadius:'10px', fontWeight:700, textDecoration:'none' }}>
          Volver
        </a>
      </div>
    </div>
  )
}
