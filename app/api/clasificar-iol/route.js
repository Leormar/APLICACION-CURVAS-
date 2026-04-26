import pool from '../../../lib/db'

export async function POST(req) {
  try {
    const { mediciones } = await req.json()
    // mediciones = [{defocus: -5, agudeza: 0.8}, ...]

    if (!mediciones || mediciones.length < 3) {
      return Response.json({ error: 'Mínimo 3 puntos requeridos' }, { status: 400 })
    }

    // Vergencias estándar
    const VERGENCIAS = [1, 0.5, 0, -0.5, -1, -1.5, -2, -2.5, -3, -3.5, -4, -4.5, -5]
    const CAMPOS = ['v_pos1','v_pos05','v_0','v_neg05','v_neg1','v_neg15','v_neg2','v_neg25','v_neg3','v_neg35','v_neg4','v_neg45','v_neg5']

    // Interpolar curva del paciente a vergencias estándar
    const curvaP = VERGENCIAS.map(v => {
      const exacto = mediciones.find(m => parseFloat(m.defocus) === v)
      if (exacto) return parseFloat(exacto.agudeza)
      // Interpolación lineal
      const antes = mediciones.filter(m => parseFloat(m.defocus) > v).sort((a,b) => parseFloat(a.defocus) - parseFloat(b.defocus)).pop()
      const despues = mediciones.filter(m => parseFloat(m.defocus) < v).sort((a,b) => parseFloat(a.defocus) - parseFloat(b.defocus))[0]
      if (!antes || !despues) return null
      const t = (v - parseFloat(antes.defocus)) / (parseFloat(despues.defocus) - parseFloat(antes.defocus))
      return parseFloat(antes.agudeza) + t * (parseFloat(despues.agudeza) - parseFloat(antes.agudeza))
    })

    // Obtener todas las referencias validadas
    const refs = await pool.query('SELECT * FROM iol_referencias WHERE validado = true')

    // Calcular distancia euclidiana vs cada IOL
    const similitudes = refs.rows.map(iol => {
      const curvaRef = CAMPOS.map(c => iol[c] !== null ? parseFloat(iol[c]) : null)
      let sumaDiff = 0
      let puntos = 0
      VERGENCIAS.forEach((v, i) => {
        if (curvaP[i] !== null && curvaRef[i] !== null) {
          sumaDiff += Math.pow(curvaP[i] - curvaRef[i], 2)
          puntos++
        }
      })
      const distancia = puntos > 0 ? Math.sqrt(sumaDiff / puntos) : 999
      const similitud = Math.max(0, Math.round((1 - distancia * 2) * 100))
      return {
        id: iol.id,
        nombre: iol.nombre,
        casa_comercial: iol.casa_comercial,
        categoria: iol.categoria,
        tecnologia: iol.tecnologia,
        distancia: parseFloat(distancia.toFixed(4)),
        similitud,
        curva: curvaRef
      }
    })

    // Ordenar por similitud
    similitudes.sort((a, b) => a.distancia - b.distancia)
    const top3 = similitudes.slice(0, 3)

    // Detectar morfología de la curva del paciente
    const morfologia = detectarMorfologia(curvaP, VERGENCIAS)

    return Response.json({
      ok: true,
      morfologia,
      top3,
      curva_paciente: curvaP
    })

  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

function detectarMorfologia(curva, vergencias) {
  // Valores en puntos clave
  const v0   = curva[2]  // 0D - VL
  const vn1  = curva[4]  // -1D
  const vn15 = curva[5]  // -1.5D
  const vn2  = curva[6]  // -2D
  const vn25 = curva[7]  // -2.5D
  const vn3  = curva[8]  // -3D

  // Detectar picos (trifocal)
  const tienePicos = vn2 !== null && vn15 !== null && vn25 !== null &&
    (vn15 < vn2 - 0.05 || vn25 < vn2 - 0.05)

  // Detectar meseta amplia (EDOF)
  const valoresMeseta = [v0, vn1, vn15, vn2].filter(v => v !== null)
  const rangoMeseta = valoresMeseta.length > 0 ?
    Math.max(...valoresMeseta) - Math.min(...valoresMeseta) : 1
  const tieneMeseta = rangoMeseta < 0.15

  // Detectar caída rápida (monofocal)
  const caida = vn2 !== null && v0 !== null ? vn2 - v0 : 0
  const caidaRapida = caida > 0.35

  // Rango funcional (≤0.2)
  const funcional = vergencias.filter((v, i) => curva[i] !== null && curva[i] <= 0.2)
  const rangoFuncional = funcional.length > 0 ?
    Math.max(...funcional) - Math.min(...funcional) : 0

  if (tienePicos) return {
    tipo: 'trifocal',
    descripcion: 'Patrón trifocal — picos definidos en lejos, intermedio y cerca',
    categoria_sugerida: 'trifocal'
  }
  if (tieneMeseta && rangoFuncional >= 2) return {
    tipo: 'full_range',
    descripcion: 'Patrón full range — meseta continua de lejos a cerca sin discontinuidades',
    categoria_sugerida: 'full_range'
  }
  if (tieneMeseta && rangoFuncional >= 1.5) return {
    tipo: 'edof',
    descripcion: 'Patrón EDOF — meseta amplia en lejos-intermedio con visión cercana funcional',
    categoria_sugerida: 'edof_refractivo'
  }
  if (caidaRapida) return {
    tipo: 'monofocal_plus',
    descripcion: 'Patrón monofocal plus — excelente lejos con extensión leve de intermedio',
    categoria_sugerida: 'monofocal_plus'
  }
  return {
    tipo: 'indeterminado',
    descripcion: 'Perfil mixto — características de múltiples categorías',
    categoria_sugerida: 'edof_refractivo'
  }
}
