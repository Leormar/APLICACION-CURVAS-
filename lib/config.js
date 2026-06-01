// Dominio canónico de la app. Se puede sobrescribir con NEXT_PUBLIC_APP_URL.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://curvasdesenfoque.com').replace(/\/$/, '')

// Email de contacto / soporte mostrado en correos y en la página de soporte.
export const SOPORTE_EMAIL = process.env.SOPORTE_EMAIL || 'drorjuela@lentesespecializados.com'
