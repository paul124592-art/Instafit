export const PRESETS = [
  { id: 'square', label: 'Square post', size: '1080 × 1080', w: 1080, h: 1080, free: true },
  { id: 'portrait', label: 'Portrait post', size: '1080 × 1350', w: 1080, h: 1350, free: true },
  { id: 'story', label: 'Story / Reel', size: '1080 × 1920', w: 1080, h: 1920, free: true },
  { id: 'landscape', label: 'Landscape post', size: '1080 × 566', w: 1080, h: 566, free: false },
  { id: 'profile', label: 'Profile picture', size: '320 × 320', w: 320, h: 320, free: false },
]

export const FREE_EXPORTS_PER_DAY = 5
export const FREE_COMPRESS_PER_DAY = 5

const PREMIUM_KEY = 'instafit_premium'
const EXPORTS_KEY = 'instafit_exports'
const COMPRESS_KEY = 'instafit_compresses'

export function isPremium() {
  try {
    return localStorage.getItem(PREMIUM_KEY) === 'true'
  } catch {
    return false
  }
}

export function setPremium(value) {
  try {
    localStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false')
  } catch {
    // storage unavailable — premium stays off for this session
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function readCount(storageKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (raw.date !== todayKey()) return { date: todayKey(), count: 0 }
    return raw
  } catch {
    return { date: todayKey(), count: 0 }
  }
}

function writeCount(storageKey, count) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ date: todayKey(), count }))
  } catch {
    // ignore storage errors
  }
}

export function exportsLeftToday() {
  if (isPremium()) return Infinity
  return Math.max(0, FREE_EXPORTS_PER_DAY - readCount(EXPORTS_KEY).count)
}

export function canExport() {
  return exportsLeftToday() > 0
}

export function recordExport() {
  if (isPremium()) return
  writeCount(EXPORTS_KEY, readCount(EXPORTS_KEY).count + 1)
}

export function compressesLeftToday() {
  if (isPremium()) return Infinity
  return Math.max(0, FREE_COMPRESS_PER_DAY - readCount(COMPRESS_KEY).count)
}

export function canCompress() {
  return compressesLeftToday() > 0
}

export function recordCompress() {
  if (isPremium()) return
  writeCount(COMPRESS_KEY, readCount(COMPRESS_KEY).count + 1)
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 KB'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** A built-in demo photo (sunset scene) so people can try the tools with no upload. */
export function makeSamplePhoto() {
  const c = document.createElement('canvas')
  c.width = 1200
  c.height = 900
  const ctx = c.getContext('2d')
  const sky = ctx.createLinearGradient(0, 0, 0, 900)
  sky.addColorStop(0, '#fda4af')
  sky.addColorStop(0.55, '#fde68a')
  sky.addColorStop(1, '#86efac')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 1200, 900)
  ctx.fillStyle = '#fff7ed'
  ctx.beginPath()
  ctx.arc(950, 180, 110, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#166534'
  ctx.beginPath()
  ctx.moveTo(0, 900)
  ctx.quadraticCurveTo(300, 520, 650, 900)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#14532d'
  ctx.beginPath()
  ctx.moveTo(550, 900)
  ctx.quadraticCurveTo(900, 600, 1200, 900)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#7c2d12'
  ctx.fillRect(590, 480, 24, 220)
  ctx.fillStyle = '#15803d'
  ctx.beginPath()
  ctx.arc(602, 430, 130, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(500, 480, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(700, 480, 80, 0, Math.PI * 2)
  ctx.fill()
  const img = new Image()
  img.src = c.toDataURL('image/png')
  return img
}

/** Draw the composed image onto a canvas at its full output size. */
export function drawComposed(ctx, img, opts) {
  const { w, h, fitMode, bg, bgColor, zoom, offsetX, offsetY, filters, text } = opts
  ctx.save()
  ctx.clearRect(0, 0, w, h)

  // Background
  if (bg === 'color') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)
  } else {
    // Blurred cover of the same photo
    const cover = Math.max(w / img.width, h / img.height)
    const bw = img.width * cover
    const bh = img.height * cover
    ctx.save()
    ctx.filter = `blur(${Math.max(24, Math.round(w / 24))}px)`
    ctx.drawImage(img, (w - bw) / 2, (h - bh) / 2, bw, bh)
    ctx.restore()
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.fillRect(0, 0, w, h)
  }

  // Foreground photo with filters
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`
  const base =
    fitMode === 'fill'
      ? Math.max(w / img.width, h / img.height)
      : Math.min(w / img.width, h / img.height)
  const scale = base * zoom
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2 + offsetX, (h - dh) / 2 + offsetY, dw, dh)
  ctx.filter = 'none'

  // Text overlay
  if (text && text.value.trim()) {
    let fontPx = Math.round(w * (text.sizePct / 100))
    const weight = text.bold ? '800' : '600'
    const setFont = (px) => {
      ctx.font = `${weight} ${px}px Inter, sans-serif`
    }
    setFont(fontPx)
    const maxWidth = w * 0.9
    const measured = ctx.measureText(text.value).width
    if (measured > maxWidth) fontPx = Math.max(10, Math.floor(fontPx * (maxWidth / measured)))
    setFont(fontPx)
    const y = Math.round(h * (text.yPct / 100))
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (text.pill) {
      const tw = ctx.measureText(text.value).width
      const padX = Math.round(fontPx * 0.6)
      const padY = Math.round(fontPx * 0.45)
      const bw = tw + padX * 2
      const bh = fontPx + padY * 2
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      roundRect(ctx, (w - bw) / 2, y - bh / 2, bw, bh, Math.round(bh / 2))
      ctx.fill()
    }
    ctx.fillStyle = text.color
    ctx.fillText(text.value, w / 2, y)
  }
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
