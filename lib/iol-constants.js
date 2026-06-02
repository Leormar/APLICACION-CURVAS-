// Marca para "valoración ciega": el ojo tiene LIO pero el tipo no se especificó,
// y se quiere que la IA lo sugiera por la curva. Distinto de "" (sin LIO / ojo no operado).
export const IOL_CIEGA = '__ciega__'

// ¿el valor representa un LIO real (un nombre del catálogo)?
export const esIOLReal = (v) => !!v && v !== IOL_CIEGA && v !== '__otro__'

// ¿se debe pedir sugerencia de la IA para este ojo? (ciega o con LIO real → sí; sin LIO → no)
export const pideSugerencia = (v) => v === IOL_CIEGA || esIOLReal(v)

// Texto para mostrar en pantalla/PDF a partir del valor crudo.
export const nombreIOLDisplay = (v) => {
  if (v === IOL_CIEGA) return 'Valoración ciega'
  if (esIOLReal(v)) return v
  return '' // sin LIO / ojo no operado
}
