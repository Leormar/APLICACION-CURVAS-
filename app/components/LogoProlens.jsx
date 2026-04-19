export default function LogoProlens({ size = 80 }) {
  const cx = size/2, cy = size/2, r = size/2
  const lR = size*0.35
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgL" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#0c2461"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bgL)"/>
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="3.5"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.8"/>
      <circle cx="50" cy="50" r="17" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5"/>
      <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2"/>
      <circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.95)"/>
      <path d="M17,50 C10,35 5,38 4,52" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M83,50 C90,65 95,62 96,48" fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}
