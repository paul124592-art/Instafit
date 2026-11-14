import { useCallback, useEffect, useRef, useState } from 'react'
import {
  canCompress,
  compressesLeftToday,
  formatBytes,
  makeSamplePhoto,
  recordCompress,
} from '../lib/sizes'

const MAX_WIDTHS = [
  { value: 0, label: 'Keep original size' },
  { value: 1920, label: 'Max width 1920px' },
  { value: 1200, label: 'Max width 1200px' },
  { value: 800, label: 'Max width 800px' },
]

export default function Compressor({ image, fileName, fileSize, isPremium, onUpgrade, onNewPhoto, onImageLoaded }) {
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(0)
  const [format, setFormat] = useState('jpeg')
  const [result, setResult] = useState(null) // { blob, url, size, width, height }
  const [notice, setNotice] = useState('')
  const [left, setLeft] = useState(compressesLeftToday())
  const [working, setWorking] = useState(false)
  const prevUrlRef = useRef(null)

  const runCompress = useCallback(() => {
    if (!image) return
    setWorking(true)
    const scale =
      maxWidth > 0 && image.width > maxWidth ? maxWidth / image.width : 1
    const w = Math.max(1, Math.round(image.width * scale))
    const h = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    // JPEG has no transparency — paint white behind photos with alpha.
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(image, 0, 0, w, h)
    const mime =
      format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
    canvas.toBlob(
      (blob) => {
        setWorking(false)
        if (!blob) {
          setNotice('Something went wrong compressing that photo. Try another one.')
          return
        }
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
        const url = URL.createObjectURL(blob)
        prevUrlRef.current = url
        setResult({ blob, url, size: blob.size, width: w, height: h })
      },
      mime,
      format === 'png' ? undefined : quality / 100,
    )
  }, [image, quality, maxWidth, format])

  useEffect(() => {
    runCompress()
  }, [runCompress])

  const download = () => {
    if (!result) return
    if (!canCompress()) {
      setNotice(
        "You've used all 5 free compressions for today. Upgrade to Premium for unlimited compressions.",
      )
      onUpgrade()
      return
    }
    const a = document.createElement('a')
    const base = (fileName || 'photo').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-')
    const ext = format === 'jpeg' ? 'jpg' : format
    a.href = result.url
    a.download = `instafit-compressed-${base}.${ext}`
    a.click()
    recordCompress()
    setLeft(compressesLeftToday())
    setNotice(
      isPremium
        ? 'Downloaded — looking good.'
        : `Downloaded. ${compressesLeftToday()} free compression${
            compressesLeftToday() === 1 ? '' : 's'
          } left today.`,
    )
  }

  const saved = fileSize && result ? Math.max(0, fileSize - result.size) : 0
  const savedPct = fileSize && result && fileSize > 0 ? Math.round((saved / fileSize) * 100) : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="card flex justify-center overflow-hidden bg-slate-900 p-4">
          {result ? (
            <img
              src={result.url}
              alt="Compressed preview"
              className="max-h-[480px] max-w-full rounded-lg object-contain"
            />
          ) : (
            <p className="py-16 text-slate-400">{working ? 'Compressing…' : 'Loading…'}</p>
          )}
        </div>

        {fileSize && result && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="card p-3">
              <p className="text-xs text-slate-500">Original</p>
              <p className="font-bold">{formatBytes(fileSize)}</p>
            </div>
            <div className="card p-3">
              <p className="text-xs text-slate-500">Compressed</p>
              <p className="font-bold text-pink-700">{formatBytes(result.size)}</p>
            </div>
            <div className="card p-3">
              <p className="text-xs text-slate-500">You save</p>
              <p className="font-bold text-emerald-700">
                {formatBytes(saved)} ({savedPct}%)
              </p>
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-sm text-slate-500">
          {result ? `${result.width} × ${result.height}px` : ''} · Preview shows the compressed
          result at full quality
        </p>
        {notice && (
          <p className="mt-3 rounded-lg bg-pink-50 px-3 py-2 text-center text-sm text-pink-800">
            {notice}
          </p>
        )}
      </div>

      <div className="space-y-5">
        <div className="card p-4">
          <h3 className="font-semibold">Compression</h3>
          <div className="mt-3">
            <label htmlFor="quality">Quality — {quality}%</label>
            <input
              id="quality"
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              Lower quality = smaller file. 80% looks great for photos on the web.
            </p>
          </div>
          <div className="mt-4">
            <label htmlFor="max-width">Resize</label>
            <select
              id="max-width"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
            >
              {MAX_WIDTHS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4">
            <label>Output format</label>
            <div className="flex gap-2">
              {[
                ['jpeg', 'JPG'],
                ['png', 'PNG'],
                ['webp', 'WebP'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFormat(value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                    format === value
                      ? 'border-pink-600 bg-pink-50 text-pink-700'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              JPG is smallest for photos. WebP is smaller still and works everywhere modern.
              PNG keeps every pixel (best for screenshots and logos).
            </p>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold">Download</h3>
          <button
            className="btn-primary mt-3 w-full !py-3 !text-base"
            onClick={download}
            disabled={!result || working}
          >
            Download compressed photo
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            {isPremium ? 'Premium — unlimited compressions.' : `${left} of 5 free compressions left today.`}
          </p>
          {!isPremium && (
            <button
              className="mt-2 w-full text-center text-sm font-semibold text-pink-700 hover:underline"
              onClick={onUpgrade}
            >
              Upgrade to Premium — $4/mo for unlimited everything
            </button>
          )}
          <button className="btn-secondary mt-3 w-full" onClick={onNewPhoto}>
            Use a different photo
          </button>
          <button
            className="mt-2 w-full text-center text-sm text-slate-500 hover:underline"
            onClick={() => {
              const img = makeSamplePhoto()
              img.onload = () => onImageLoaded(img, 'sample-sunset.png', 0)
            }}
          >
            Try a sample photo
          </button>
        </div>
      </div>
    </div>
  )
}
