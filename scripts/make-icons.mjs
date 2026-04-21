import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svg = Buffer.from(`<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="100%" stop-color="#0c2461"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <circle cx="256" cy="230" r="130" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="18"/>
  <circle cx="256" cy="230" r="95" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="10"/>
  <circle cx="256" cy="230" r="62" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="8"/>
  <circle cx="256" cy="230" r="32" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="6"/>
  <circle cx="256" cy="230" r="18" fill="white" opacity="0.95"/>
  <path d="M126,230 C95,170 70,178 65,235" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="14" stroke-linecap="round"/>
  <path d="M386,230 C417,290 442,282 447,225" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="14" stroke-linecap="round"/>
  <text x="256" y="420" text-anchor="middle" font-family="Arial" font-weight="900" font-size="68" fill="white" opacity="0.95" letter-spacing="4">PROLENS</text>
  <text x="256" y="465" text-anchor="middle" font-family="Arial" font-weight="400" font-size="32" fill="rgba(255,255,255,0.7)">Curvas IOL</text>
</svg>`)

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for (const s of sizes) {
  await sharp(svg).resize(s, s).png().toFile(`public/icons/icon-${s}x${s}.png`)
  console.log(`✅ icon-${s}x${s}.png`)
}
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
await sharp(svg).resize(32, 32).png().toFile('public/favicon-32.png')
await sharp(svg).resize(16, 16).png().toFile('public/favicon-16.png')
console.log('✅ Todos los iconos generados')
