export const metadata = {
  title: 'Curvas de Desenfoque',
  description: 'App clínica para análisis de IOL multifocal',
}
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        {children}
      </body>
    </html>
  )
}
