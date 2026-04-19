'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Label } from 'recharts'

const vergencia = (d) => {
  const v = { '+1.00':'VP extrema','+0.50':'VP cerca', '0.00':'VL', '-0.50':'2m', '-1.00':'1m', '-1.50':'67cm', '-2.00':'50cm', '-2.50':'40cm', '-3.00':'33cm', '-3.50':'29cm', '-4.00':'25cm', '-4.50':'22cm', '-5.00':'20cm' }
  return v[parseFloat(d).toFixed(2)] || ''
}

const CustomTick = ({ x, y, payload }) => {
  const verg = vergencia(parseFloat(payload.value).toFixed(2))
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#64748b" fontSize={10}>{payload.value}</text>
      {verg && <text x={0} y={0} dy={26} textAnchor="middle" fill="#94a3b8" fontSize={9}>{verg}</text>}
    </g>
  )
}

export default function GraficaCurva({ mediciones }) {
  const datos = [...mediciones].sort((a,b) => a.defocus - b.defocus)

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b' }}>Curva de desenfoque</h2>
      {datos.length < 2 ? (
        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
          Ingresa valores para ver la curva
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={datos} margin={{ top: 10, right: 20, left: 20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="defocus" tick={<CustomTick />} height={55} interval={0}>
              <Label value="Defocus (D) / Vergencia" offset={-10} position="insideBottom" style={{ fontSize: 11, fill: '#475569' }} />
            </XAxis>
            <YAxis reversed domain={[-0.1, 1.3]} tick={{ fontSize: 11 }}>
              <Label value="Agudeza visual (LogMAR)" angle={-90} position="insideLeft" offset={-5} style={{ fontSize: 11, fill: '#475569' }} />
            </YAxis>
            <Tooltip
              formatter={(v) => [v + ' LogMAR', 'AV']}
              labelFormatter={(l) => `${l} D — ${vergencia(parseFloat(l).toFixed(2))}`}
            />
            <ReferenceLine y={0.1} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '20/25', position: 'right', fontSize: 10, fill: '#22c55e' }} />
            <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '20/32', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
            <ReferenceLine y={0.3} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '20/40', position: 'right', fontSize: 10, fill: '#ef4444' }} />
            <Line type="monotone" dataKey="agudeza" stroke="#1e40af" strokeWidth={2.5} dot={{ r: 4, fill: '#1e40af' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {datos.length >= 2 && (
        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.8rem', color: '#0369a1', border: '1px solid #bae6fd' }}>
          <strong>Rango funcional (≤0.2 LogMAR):</strong> {datos.filter(d => d.agudeza <= 0.2).map(d => `${d.defocus}D`).join(', ') || 'ninguno'}
        </div>
      )}
    </div>
  )
}
