export const metadata = {
  title: 'Curvas de Desenfoque · PROLENS',
  description: 'App clínica para análisis de IOL multifocal',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#1e40af',
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
      </head>
      <body style={{ margin:0, fontFamily:'system-ui, sans-serif', background:'#f8fafc' }}>
        {children}
      </body>
    </html>
  )
}
