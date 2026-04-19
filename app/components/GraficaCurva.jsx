'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Label } from 'recharts'

const VERGENCIAS = { '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m','-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm','-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm' }
const verg = d => VERGENCIAS[String(parseFloat(d))] || ''
const colores = { OD:'#1e40af', OI:'#0f766e', AO:'#7c3aed' }
const nombres = { OD:'Ojo Derecho', OI:'Ojo Izquierdo', AO:'Ambos Ojos' }

const CustomTick = ({ x, y, payload }) => {
  const v = verg(payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={13} textAnchor="middle" fill="#64748b" fontSize={10}>{payload.value}</text>
      {v && <text x={0} y={0} dy={24} textAnchor="middle" fill="#94a3b8" fontSize={9}>{v}</text>}
    </g>
  )
}

export default function GraficaCurva({ ojo, mediciones, lente }) {
  const datos = [...mediciones].sort((a, b) => a.defocus - b.defocus)
  const color = colores[ojo] || '#1e40af'
  const funcional = datos.filter(d => d.agudeza <= 0.2)

  const categoriaLente = (nombre) => {
    if (!nombre) return { label:'Monofocal', color:'#64748b' }
    if (nombre.includes('PanOptix')||nombre.includes('Synergy')||nombre.includes('LISA tri')||nombre.includes('FineVision')||nombre.includes('Trifocal')) return { label:'Trifocal', color:'#7c3aed' }
    if (nombre.includes('Vivity')||nombre.includes('Eyhance')||nombre.includes('LARA')||nombre.includes('EMV')||nombre.includes('MiniWell')||nombre.includes('EDOF')) return { label:'EDOF', color:'#0f766e' }
    if (nombre.includes('+2')||nombre.includes('+3')||nombre.includes('ReSTOR')||nombre.includes('Bifocal')) return { label:'Bifocal', color:'#d97706' }
    return { label:'Monofocal', color:'#64748b' }
  }

  const cat = categoriaLente(lente)

  return (
    <div style={{ background:'white', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
        <div>
          <h2 style={{ margin:0, fontSize:'0.95rem', color:'#1e293b' }}>
            <span style={{ display:'inline-block', width:10, height:10, borderRadius:'50%', background:color, marginRight:6 }}></span>
            {nombres[ojo]}
          </h2>
          {lente && lente !== '__otro__' && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
              <span style={{ fontSize:'0.78rem', color:'#475569' }}>{lente}</span>
              <span style={{ fontSize:'0.7rem', padding:'1px 7px', borderRadius:'10px', background:cat.color+'22', color:cat.color, fontWeight:600 }}>{cat.label}</span>
            </div>
          )}
        </div>
        <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{datos.length} puntos</span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={datos} margin={{ top:5, right:50, left:10, bottom:50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="defocus" tick={<CustomTick />} height={55} interval={0}>
            <Label value="Defocus (D)" offset={-8} position="insideBottom" style={{ fontSize:11, fill:'#475569' }} />
          </XAxis>
          <YAxis
            domain={[1.3, -0.1]}
            reversed={false}
            ticks={[1.3, 1.0, 0.7, 0.5, 0.3, 0.2, 0.1, 0.0]}
            tick={{ fontSize:10 }}
            width={35}
          >
            <Label value="LogMAR" angle={-90} position="insideLeft" offset={10} style={{ fontSize:11, fill:'#475569' }} />
          </YAxis>
          <Tooltip formatter={v=>[v+' LogMAR','AV']} labelFormatter={l=>`${l}D — ${verg(l)}`} />
          <ReferenceLine y={0.1} stroke="#22c55e" strokeDasharray="4 4" label={{ value:'20/25', position:'right', fontSize:9, fill:'#22c55e' }} />
          <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="4 4" label={{ value:'20/32', position:'right', fontSize:9, fill:'#f59e0b' }} />
          <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="4 4" label={{ value:'20/40', position:'right', fontSize:9, fill:'#ef4444' }} />
          <Line type="monotone" dataKey="agudeza" stroke={color} strokeWidth={2.5} dot={{ r:3, fill:color }} activeDot={{ r:5 }} />
        </LineChart>
      </ResponsiveContainer>

      {funcional.length > 0 && (
        <div style={{ fontSize:'0.75rem', color:'#0369a1', background:'#f0f9ff', padding:'5px 10px', borderRadius:'6px', border:'1px solid #bae6fd', marginTop:'4px' }}>
          <strong>Rango funcional (≤0.2):</strong> {funcional.map(d=>`${d.defocus}D`).join(', ')}
        </div>
      )}
    </div>
  )
}
