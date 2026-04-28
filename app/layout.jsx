import './globals.css'
import { SessionProvider } from './components/SessionProvider'

export const metadata = {
  title: 'Curvas de Desenfoque · PROLENS',
  description: 'App clínica para análisis de IOL multifocal',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CurvasIOL" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" async></script>
<script dangerouslySetInnerHTML={{ __html: `
  function googleTranslateElementInit() {
    new google.translate.TranslateElement({
      pageLanguage: 'es',
      includedLanguages: 'en,it,ca,fr,es',
      autoDisplay: true,
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
  }
` }} />
      </head>
      <body><div id="google_translate_element" style={{position:'fixed',top:'12px',right:'12px',zIndex:9999,background:'white',padding:'4px 10px',borderRadius:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.15)',border:'1px solid #e2e8f0'}}></div>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
