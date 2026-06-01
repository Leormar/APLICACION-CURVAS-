import { SOPORTE_EMAIL } from '../../lib/config'

export const metadata = { title: 'Privacidad · PROLENS' }

export default function PrivacidadPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:'2rem 1rem' }}>
      <div style={{ maxWidth:'720px', margin:'0 auto', background:'white', borderRadius:'16px', padding:'2.5rem', border:'1px solid #e2e8f0' }}>
        <h1 style={{ color:'#1e40af', marginTop:0 }}>Política de Privacidad</h1>
        <p style={{ color:'#64748b', fontSize:'0.85rem' }}>PROLENS · Curvas de Desenfoque · Dr. Leonardo Orjuela</p>

        <h2 style={{ color:'#1e293b', fontSize:'1.1rem' }}>Qué datos guardamos</h2>
        <p style={{ color:'#475569', lineHeight:1.7 }}>
          Para dar acceso a la plataforma guardamos tu nombre y correo electrónico (obtenidos al iniciar
          sesión con Google o Apple) y los datos clínicos de curvas de desenfoque que tú registras
          (nombre del paciente, refracción, LIO y mediciones de agudeza). Esta información se usa
          únicamente para prestar el servicio dentro de PROLENS.
        </p>

        <h2 style={{ color:'#1e293b', fontSize:'1.1rem' }}>Correos que enviamos</h2>
        <p style={{ color:'#475569', lineHeight:1.7 }}>
          Podemos enviarte correos relacionados con tu cuenta (aprobación de acceso) y recordatorios
          para empezar a usar la app. Puedes cancelar los recordatorios en cualquier momento desde el
          enlace <strong>“Cancelar estos recordatorios”</strong> que aparece al final de cada correo,
          o con el botón de cancelar suscripción de tu cliente de correo.
        </p>

        <h2 style={{ color:'#1e293b', fontSize:'1.1rem' }}>Tus derechos</h2>
        <p style={{ color:'#475569', lineHeight:1.7 }}>
          Puedes solicitar el acceso, la corrección o la eliminación de tus datos escribiéndonos a{' '}
          <a href={`mailto:${SOPORTE_EMAIL}`} style={{ color:'#1e40af' }}>{SOPORTE_EMAIL}</a>.
        </p>

        <h2 style={{ color:'#1e293b', fontSize:'1.1rem' }}>Contacto</h2>
        <p style={{ color:'#475569', lineHeight:1.7 }}>
          Dr. Leonardo Orjuela · Medellín, Colombia ·{' '}
          <a href={`mailto:${SOPORTE_EMAIL}`} style={{ color:'#1e40af' }}>{SOPORTE_EMAIL}</a>
        </p>

        <a href="/" style={{ display:'inline-block', marginTop:'1.5rem', padding:'0.7rem 1.6rem', background:'#1e40af', color:'white', borderRadius:'10px', textDecoration:'none', fontWeight:700 }}>Volver a la app</a>
      </div>
    </div>
  )
}
