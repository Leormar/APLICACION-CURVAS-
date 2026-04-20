import { writeFileSync, mkdirSync } from 'fs'

const SVG = `<svg width="512" height="512" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#0c2461"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#bg)"/>
  <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2"/>
  <circle cx="50" cy="50" r="17" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="1.6"/>
  <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.3"/>
  <circle cx="50" cy="50" r="5" fill="white" opacity="0.95"/>
  <path d="M16,50 C9,34 4,37 3,51" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="2.8" stroke-linecap="round"/>
  <path d="M84,50 C91,66 96,63 97,49" fill="none" stroke="rgba(255,255,255,0.82)" stroke-width="2.8" stroke-linecap="round"/>
  <text x="50" y="88" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="11" fill="rgba(255,255,255,0.9)">PROLENS</text>
</svg>`

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icon.svg', SVG)
writeFileSync('public/icons/icon-72.svg', SVG)
writeFileSync('public/icons/icon-96.svg', SVG)
writeFileSync('public/icons/icon-128.svg', SVG)
writeFileSync('public/icons/icon-144.svg', SVG)
writeFileSync('public/icons/icon-152.svg', SVG)
writeFileSync('public/icons/icon-192.svg', SVG)
writeFileSync('public/icons/icon-384.svg', SVG)
writeFileSync('public/icons/icon-512.svg', SVG)
console.log('SVG icons generados')
