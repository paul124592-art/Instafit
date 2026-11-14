import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PRESETS,
  canExport,
  drawComposed,
  exportsLeftToday,
  recordExport,
} from '../lib/sizes'

const BG_COLORS = ['#ffffff', '#111827', '#db2777', '#1e3a8a', '#fef3c7', '#10b981']
const DEFAULT_FILTERS = { brightness: 100, contrast: 100, saturate: 100 }
const DEFAULT_TEXT = { value: '', sizePct: 6, color: '#ffffff', yPct: 50, bold: false, pill: false }
const TEXT_COLORS = ['#ffffff', '#111827']

export default function Editor({ image, fileName, isPremium, onUpgrade, onNewPhoto }) {
  const [preset, setPreset] = useState(PRESETS[0])
  const [fitMode, setFitMode] = useState('fit')
  const [bg, setBg] = useState('blur')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [text, setText] = useState(DEFAULT_TEXT)
  const [format, setFormat] = useState('png')
  const [notice, setNotice] = useState('')
  const [exportsLeft, setExportsLeft] = useState(exportsLeftToday())
  const [dragging, setDragging] = useState(null)

  const canvasRef = useRef(null)

  const previewScale = Math.min(1, 520 / Math.max(preset.w, preset.h))
  const previewW = Math.max(1, Math.round(preset.w * previewScale))
  const previewH = Math.max(1, Math.round(preset.h * previewScale))

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    drawComposed(ctx, image, {
      w: previewW,
      h: previewH,
      fitMode,
      bg,
      bgColor,
      zoom,
      offsetX: offset.x * previewScale,
      offsetY: offset.y * previewScale,
      filters,
      text,
    })
  }, [image, previewW, previewH, fitMode, bg, bgColor, zoom, offset, filters, text, previewScale])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  const resetAdjust = () => {
    setZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  const pickPreset = (p) => {
    if (!p.free && !isPremium) {
      setNotice(`"${p.label}" is a Premium size — upgrade to unlock it.`)
      onUpgrade()
      return
    }
    setPreset(p)
    resetAdjust()
  }

  const pickBg = (value) => {
    if (value === 'color' && !isPremium) {
      setNotice('Solid color backgrounds are Premium — upgrade to unlock them.')
      onUpgrade()
      return
    }
    setBg(value)
  }

  const setFilter = (key, value) => {
    if (!isPremium) {
      setNotice('Filters are Premium — upgrade to unlock them.')
      onUpgrade()
      return
    }
    setFilters((f) => ({ ...f, [key]: Number(value) }))
  }

  const onPointerDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    setDragging({ startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y })
  }

  const onPointerMove = (e) => {
    if (!dragging) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const dx = (e.clientX - dragging.startX) * scaleX
    const dy = (e.clientY - dragging.startY) * scaleX
    setOffset({
      x: dragging.ox + dx / previewScale,
      y: dragging.oy + dy / previewScale,
    })
  }

  const onPointerUp = () => setDragging(null)

  const download = () => {
    if (!image) return
    if (!canExport()) {
      setNotice(
        `You've used all ${5} free exports for today. Upgrade to Premium for unlimited exports.`,
      )
      onUpgrade()
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = preset.w
    canvas.height = preset.h
    const ctx = canvas.getContext('2d')
    drawComposed(ctx, image, {
      w: preset.w,
      h: preset.h,
      fitMode,
      bg,
      bgColor,
      zoom,
      offsetX: offset.x,
      offsetY: offset.y,
      filters,
      text,
    })
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const base = (fileName || 'photo').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-')
      a.href = url
      a.download = `instafit-${preset.id}-${base}.${format === 'jpeg' ? 'jpg' : 'png'}`
      a.click()
      URL.revokeObjectURL(url)
      recordExport()
      setExportsLeft(exportsLeftToday())
      setNotice(
        isPremium
          ? 'Downloaded — looking good.'
          : `Downloaded. ${exportsLeftToday()} free export${
              exportsLeftToday() === 1 ? '' : 's'
            } left today.`,
      )
    }, mime, 0.92)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="card flex justify-center overflow-hidden bg-slate-900 p-4">
          <canvas
            ref={canvasRef}
            width={previewW}
            height={previewH}
            className="max-w-full cursor-grab touch-none rounded-lg bg-white active:cursor-grabbing"
            style={{ width: previewW, maxWidth: '100%', height: 'auto' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
        </div>
        <p className="mt-2 text-center text-sm text-slate-500">
          Drag the photo to move it · {preset.label} · {preset.size}
        </p>
        {notice && (
          <p className="mt-3 rounded-lg bg-pink-50 px-3 py-2 text-center text-sm text-pink-800">
            {notice}
          </p>
        )}
      </div>

      <div className="space-y-5">
        <div className="card p-4">
          <h3 className="font-semibold">Instagram size</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => pickPreset(p)}
                className={`rounded-xl border p-3 text-left text-sm ${
                  preset.id === p.id
                    ? 'border-pink-600 bg-pink-50 ring-1 ring-pink-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="block font-semibold">
                  {p.label}
                  {!p.free && !isPremium && (
                    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                      PRO
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500">{p.size}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold">How it fits</h3>
          <div className="mt-3 flex gap-2">
            {[
              ['fit', 'Fit — whole photo, no crop'],
              ['fill', 'Fill — crop to fill'],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setFitMode(value)
                  resetAdjust()
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  fitMode === value
                    ? 'border-pink-600 bg-pink-50 text-pink-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <h3 className="mt-5 font-semibold">Background</h3>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => pickBg('blur')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                bg === 'blur'
                  ? 'border-pink-600 bg-pink-50 text-pink-700'
                  : 'border-slate-200 bg-white'
              }`}
            >
              Blurred photo
            </button>
            <button
              onClick={() => pickBg('color')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                bg === 'color'
                  ? 'border-pink-600 bg-pink-50 text-pink-700'
                  : 'border-slate-200 bg-white'
              }`}
            >
              Solid color {!isPremium && '· PRO'}
            </button>
          </div>
          {bg === 'color' && (
            <div className="mt-3 flex items-center gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  aria-label={`Background ${c}`}
                  className={`h-8 w-8 rounded-full border-2 ${
                    bgColor === c ? 'border-pink-600' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-8 w-10 cursor-pointer !p-0"
                aria-label="Pick a custom background color"
              />
            </div>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold">Adjust</h3>
          <div className="mt-3">
            <label htmlFor="zoom">Zoom — {Math.round(zoom * 100)}%</label>
            <input
              id="zoom"
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['brightness', 'Brightness', 50, 150],
              ['contrast', 'Contrast', 50, 150],
              ['saturate', 'Saturation', 0, 200],
            ].map(([key, label, min, max]) => (
              <div key={key}>
                <label htmlFor={`filter-${key}`}>
                  {label} — {filters[key]}% {!isPremium && '· PRO'}
                </label>
                <input
                  id={`filter-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  value={filters[key]}
                  onChange={(e) => setFilter(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <button className="btn-secondary mt-3 w-full" onClick={() => {
            setFilters(DEFAULT_FILTERS)
            resetAdjust()
          }}>
            Reset adjustments
          </button>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold">Text on photo</h3>
          <div className="mt-3">
            <label htmlFor="overlay-text">Your text</label>
            <input
              id="overlay-text"
              type="text"
              value={text.value}
              onChange={(e) => setText((t) => ({ ...t, value: e.target.value }))}
              placeholder="e.g. Summer 2026 🌞"
              maxLength={60}
            />
          </div>
          {text.value.trim() && (
            <>
              <div className="mt-3">
                <label htmlFor="text-size">Text size — {text.sizePct}%</label>
                <input
                  id="text-size"
                  type="range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={text.sizePct}
                  onChange={(e) => setText((t) => ({ ...t, sizePct: Number(e.target.value) }))}
                />
              </div>
              <div className="mt-3">
                <label>Position</label>
                <div className="flex gap-2">
                  {[
                    ['Top', 12],
                    ['Center', 50],
                    ['Bottom', 88],
                  ].map(([label, y]) => (
                    <button
                      key={label}
                      onClick={() => setText((t) => ({ ...t, yPct: y }))}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                        text.yPct === y
                          ? 'border-pink-600 bg-pink-50 text-pink-700'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={text.yPct}
                  onChange={(e) => setText((t) => ({ ...t, yPct: Number(e.target.value) }))}
                  aria-label="Fine-tune text height"
                  className="mt-2"
                />
              </div>
              <div className="mt-3">
                <label>Color</label>
                <div className="flex items-center gap-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setText((t) => ({ ...t, color: c }))}
                      aria-label={`Text color ${c}`}
                      className={`h-8 w-8 rounded-full border-2 ${
                        text.color === c ? 'border-pink-600' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={TEXT_COLORS.includes(text.color) ? '#db2777' : text.color}
                    onChange={(e) => {
                      if (!isPremium) {
                        setNotice('Custom text colors are Premium — upgrade to unlock them.')
                        onUpgrade()
                        return
                      }
                      setText((t) => ({ ...t, color: e.target.value }))
                    }}
                    className="h-8 w-10 cursor-pointer !p-0"
                    aria-label="Pick a custom text color (Premium)"
                  />
                  <span className="text-xs text-slate-500">Custom color · PRO</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    if (!isPremium) {
                      setNotice('Bold text is Premium — upgrade to unlock it.')
                      onUpgrade()
                      return
                    }
                    setText((t) => ({ ...t, bold: !t.bold }))
                  }}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    text.bold ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-slate-200 bg-white'
                  }`}
                >
                  Bold {!isPremium && '· PRO'}
                </button>
                <button
                  onClick={() => {
                    if (!isPremium) {
                      setNotice('Text background is Premium — upgrade to unlock it.')
                      onUpgrade()
                      return
                    }
                    setText((t) => ({ ...t, pill: !t.pill }))
                  }}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                    text.pill ? 'border-pink-600 bg-pink-50 text-pink-700' : 'border-slate-200 bg-white'
                  }`}
                >
                  Background {!isPremium && '· PRO'}
                </button>
                <button
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold"
                  onClick={() => setText(DEFAULT_TEXT)}
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-semibold">Download</h3>
          <div className="mt-3 flex gap-2">
            {[
              ['png', 'PNG'],
              ['jpeg', 'JPG'],
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
          <button className="btn-primary mt-3 w-full !py-3 !text-base" onClick={download}>
            Download {preset.size}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            {isPremium
              ? 'Premium — unlimited exports.'
              : `${exportsLeft} of 5 free exports left today.`}
          </p>
          {!isPremium && (
            <button
              className="mt-2 w-full text-center text-sm font-semibold text-pink-700 hover:underline"
              onClick={onUpgrade}
            >
              Upgrade to Premium — $4/mo for unlimited exports
            </button>
          )}
          <button className="btn-secondary mt-3 w-full" onClick={onNewPhoto}>
            Use a different photo
          </button>
        </div>
      </div>
    </div>
  )
}
