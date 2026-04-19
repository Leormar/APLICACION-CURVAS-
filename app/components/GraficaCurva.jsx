'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
export default function GraficaCurva({ mediciones }) {
  const datos = [...mediciones].sort((a,b)=>b.defocus-a.defocus)
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', color: '#1e293b' }}>Curva de desenfoque</h2>
      {datos.length < 2 ? (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>Ingresa valores para ver la curva</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="defocus" tick={{ fontSize: 11 }} />
            <YAxis reversed tick={{ fontSize: 11 }} domain={[-0.3, 1.3]} />
            <Tooltip formatter={v=>[v+' LogMAR','AV']} labelFormatter={l=>l+' D'} />
            <ReferenceLine y={0.1} stroke="#22c55e" strokeDasharray="4 4" />
            <ReferenceLine y={0.2} stroke="#f59e0b" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="agudeza" stroke="#1e40af" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
      {datos.length >= 2 && <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', color: '#475569' }}>Rango funcional (≤0.2): {datos.filter(d=>d.agudeza<=0.2).map(d=>d.defocus+'D').join(', ')||'ninguno'}</div>}
    </div>
  )
}
