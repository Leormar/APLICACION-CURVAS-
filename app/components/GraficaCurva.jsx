'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Label } from 'recharts'

const VERGENCIAS = { '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m','-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm','-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm' }

const verg = (d) => VERGENCIAS[String(parseFloat(d))] || ''

const colores = { OD: '#1e40af', OI: '#0f766e', AO: '#7c3aed' }
const nombres = { OD: 'Ojo Derecho', OI: 'Ojo Izquierdo', AO: 'Ambos Ojos' }

const CustomTick = ({ x, y, payload }) => {
  const v = verg(payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={13} textAnchor="middle" fill="#64748b" fontSize={10}>{payload.value}</text>
      {v && <text x={0} y={0} dy={24} textAnchor="middle" fill="#94a3b8" fontSize={9}>{v}</text>}
    </g>
  )
}

export default function GraficaCurva({ ojo, mediciones }) {
  const datos = [...mediciones].sort((a, b) => a.defocus - b.defocus)
  const color = colores[ojo] || '#1e40af'
  const funcional = datos.filter(d => d.agudeza <= 0.2)

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: color, marginRight: 6 }}></span>
          Curva de desenfoque — {nombres[ojo]}
        </h2>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{datos.length} puntos</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={datos} margin={{ top: 5, right: 30, left: 10, bottom: 45 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="defocus" tick={<CustomTick />} height={50} interval={0}>
            <Label value="Defocus (D)" offset={-8} position="insideBottom" style={{ fontSize: 10, fill: '#475569' }} />
          </XAxis>
          <YAxis reversed domain={[-0.1, 1.3]} tick={{ fontSize: 10 }} width={35}>
            <Label value="LogMAR" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 10, fill: '#475569' }} />
          </YAxis>
          <Tooltip formatter={v => [v + ' LogMAR', 'AV']} labelFormatter={l => `${l}D — ${verg(l)}`} />
          <ReferenceLine y={0.1} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '20/25', position: 'right', fontSize: 9, fill: '#22c55e' }} />
          <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '20/32', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
          <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '20/40', position: 'right', fontSize: 9, fill: '#ef4444' }} />
          <Line type="monotone" dataKey="agudeza" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
      {funcional.length > 0 && (
        <div style={{ fontSize: '0.78rem', color: '#0369a1', background: '#f0f9ff', padding: '5px 10px', borderRadius: '6px', border: '1px solid #bae6fd' }}>
          <strong>Rango funcional (≤0.2):</strong> {funcional.map(d => `${d.defocus}D`).join(', ')}
        </div>
      )}
    </div>
  )
}
