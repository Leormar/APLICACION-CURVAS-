'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Label, Legend } from 'recharts'

const VERGENCIAS = { '1':'VP ext','0.5':'VP','0':'VL','-0.5':'2m','-1':'1m','-1.5':'67cm','-2':'50cm','-2.5':'40cm','-3':'33cm','-3.5':'29cm','-4':'25cm','-4.5':'22cm','-5':'20cm' }
const verg = d => VERGENCIAS[String(parseFloat(d))] || ''

const CustomTick = ({ x, y, payload }) => {
  const v = verg(payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={13} textAnchor="middle" fill="#64748b" fontSize={10}>{payload.value}</text>
      {v && <text x={0} y={0} dy={24} textAnchor="middle" fill="#94a3b8" fontSize={9}>{v}</text>}
    </g>
  )
}

export default function GraficaComparativa({ curvas, lentes }) {
  // Unir todos los defocus de los 3 ojos
  const todosDefocus = [...new Set([
    ...(curvas.OD||[]).map(m => m.defocus),
    ...(curvas.OI||[]).map(m => m.defocus),
    ...(curvas.AO||[]).map(m => m.defocus)
  ])].sort((a,b) => a - b)

  if (todosDefocus.length === 0) return null

  // Construir datos unificados por defocus
  const datos = todosDefocus.map(d => {
    const od = (curvas.OD||[]).find(m => m.defocus === d)
    const oi = (curvas.OI||[]).find(m => m.defocus === d)
    const ao = (curvas.AO||[]).find(m => m.defocus === d)
    return {
      defocus: d,
      avOD: od ? -od.agudeza : null,
      avOI: oi ? -oi.agudeza : null,
      avAO: ao ? -ao.agudeza : null,
    }
  })

  const ticksY = [-1.3, -1.0, -0.7, -0.5, -0.3, -0.2, -0.1, 0]
  const tickFormatter = v => (-v).toFixed(1)

  const hayOD = (curvas.OD||[]).length >= 2
  const hayOI = (curvas.OI||[]).length >= 2
  const hayAO = (curvas.AO||[]).length >= 2

  if (!hayOD && !hayOI && !hayAO) return null

  return (
    <div style={{ background:'white', borderRadius:'12px', padding:'1rem 1.25rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ marginBottom:'0.75rem' }}>
        <h2 style={{ margin:0, fontSize:'0.95rem', color:'#1e293b' }}>
          📊 Comparativa OD · OI · AO
        </h2>
        <div style={{ display:'flex', gap:'16px', marginTop:'6px', flexWrap:'wrap' }}>
          {hayOD && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.78rem', color:'#475569' }}>
              <div style={{ width:24, height:3, background:'#1e40af', borderRadius:2 }}></div>
              OD {lentes?.OD ? `· ${lentes.OD}` : ''}
            </div>
          )}
          {hayOI && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.78rem', color:'#475569' }}>
              <div style={{ width:24, height:3, background:'#0f766e', borderRadius:2 }}></div>
              OI {lentes?.OI ? `· ${lentes.OI}` : ''}
            </div>
          )}
          {hayAO && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.78rem', color:'#475569' }}>
              <div style={{ width:24, height:3, background:'#7c3aed', borderRadius:2 }}></div>
              AO Binocular
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={datos} margin={{ top:5, right:50, left:10, bottom:50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="defocus" tick={<CustomTick />} height={55} interval={0}>
            <Label value="Defocus (D)" offset={-8} position="insideBottom" style={{ fontSize:11, fill:'#475569' }} />
          </XAxis>
          <YAxis
            domain={[-1.3, 0.1]}
            ticks={ticksY}
            tickFormatter={tickFormatter}
            tick={{ fontSize:10 }}
            width={35}
          >
            <Label value="LogMAR" angle={-90} position="insideLeft" offset={10} style={{ fontSize:11, fill:'#475569' }} />
          </YAxis>
          <Tooltip
            formatter={(v, name) => {
              if (v === null) return ['—', name]
              return [(-v).toFixed(2)+' LogMAR', name]
            }}
            labelFormatter={l => `${l}D — ${verg(l)}`}
          />
          <ReferenceLine y={-0.1} stroke="#22c55e" strokeDasharray="4 4" label={{ value:'20/25', position:'right', fontSize:9, fill:'#22c55e' }} />
          <ReferenceLine y={-0.2} stroke="#f59e0b" strokeDasharray="4 4" label={{ value:'20/32', position:'right', fontSize:9, fill:'#f59e0b' }} />
          <ReferenceLine y={-0.3} stroke="#ef4444" strokeDasharray="4 4" label={{ value:'20/40', position:'right', fontSize:9, fill:'#ef4444' }} />
          {hayOD && <Line type="monotone" dataKey="avOD" name="OD" stroke="#1e40af" strokeWidth={2.5} dot={{ r:3, fill:'#1e40af' }} activeDot={{ r:5 }} connectNulls={false} />}
          {hayOI && <Line type="monotone" dataKey="avOI" name="OI" stroke="#0f766e" strokeWidth={2.5} dot={{ r:3, fill:'#0f766e' }} activeDot={{ r:5 }} connectNulls={false} />}
          {hayAO && <Line type="monotone" dataKey="avAO" name="AO" stroke="#7c3aed" strokeWidth={2.5} dot={{ r:3, fill:'#7c3aed' }} activeDot={{ r:5 }} connectNulls={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
