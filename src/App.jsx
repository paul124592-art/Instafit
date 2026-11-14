import { useRef, useState } from 'react'
import Editor from './components/Editor'
import Compressor from './components/Compressor'
import { PRESETS, isPremium as readPremium, makeSamplePhoto, setPremium } from './lib/sizes'

export default function App() {
  const [image, setImage] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [mode, setMode] = useState('resize') // 'resize' | 'compress'
  const [premium, setPremiumState] = useState(readPremium())
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK

  const loadFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('That file is not a photo — please choose an image file.')
      return
    }
    setError('')
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImage(img)
      setFileName(file.name)
      setFileSize(file.size || 0)
    }
    img.onerror = () => setError('Could not read that photo. Try a different file.')
    img.src = url
  }

  const loadImage = (img, name, size) => {
    setError('')
    setImage(img)
    setFileName(name)
    setFileSize(size || 0)
  }

  const useSample = () => {
    const img = makeSamplePhoto()
    img.onload = () => loadImage(img, 'sample-sunset.png', 0)
  }

  const unlockPremium = () => {
    setPremium(true)
    setPremiumState(true)
    setShowUpgrade(false)
  }

  const newPhoto = () => {
    setImage(null)
    setFileName('')
    setFileSize(0)
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <p className="text-lg font-extrabold">
            <span className="text-pink-600">▣</span> InstaFit
          </p>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {[
                ['resize', '✂️ Resize'],
                ['compress', '🗜️ Compress'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                    mode === value ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {premium ? (
              <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-700">
                Premium
              </span>
            ) : (
              <button className="btn-primary" onClick={() => setShowUpgrade(true)}>
                Upgrade — $4/mo
              </button>
            )}
            {image && (
              <button className="btn-secondary" onClick={newPhoto}>
                New photo
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {!image ? (
          <>
            <section className="py-10 text-center sm:py-14">
              <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
                {mode === 'resize'
                  ? 'Your whole photo fits Instagram. No cropping.'
                  : 'Make any photo smaller. Keep it looking great.'}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
                {mode === 'resize'
                  ? 'Upload a photo, pick the Instagram size, and InstaFit fits it in with a blurred or colored background — heads and feet stay in the picture.'
                  : 'Upload a photo and shrink it to a fraction of the size — pick the quality, resize it, and download it as JPG, PNG, or WebP.'}
              </p>

              <div
                className={`mx-auto mt-8 max-w-xl rounded-2xl border-2 border-dashed p-8 ${
                  dragOver ? 'border-pink-500 bg-pink-50' : 'border-slate-300 bg-white'
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  loadFile(e.dataTransfer.files?.[0])
                }}
              >
                <p className="text-4xl">📸</p>
                <p className="mt-2 font-semibold">Drop your photo here</p>
                <p className="text-sm text-slate-500">or</p>
                <button className="btn-primary mt-3" onClick={() => inputRef.current?.click()}>
                  Choose a photo
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => loadFile(e.target.files?.[0])}
                />
                <p className="mt-3 text-xs text-slate-400">
                  Your photo never leaves your device — everything runs in your browser.
                </p>
              </div>
              {error && (
                <p className="mx-auto mt-3 max-w-xl rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                className="mt-4 text-sm font-semibold text-pink-700 hover:underline"
                onClick={useSample}
              >
                No photo handy? Try a sample photo →
              </button>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <button
                className={`card p-5 text-left ${mode === 'resize' ? 'ring-2 ring-pink-600' : ''}`}
                onClick={() => setMode('resize')}
              >
                <p className="text-2xl">✂️</p>
                <h3 className="mt-2 font-semibold">Resize for Instagram</h3>
                <p className="text-sm text-slate-500">
                  Square 1080×1080, portrait 1080×1350, story 1080×1920 — the whole photo
                  fits, no cropping.
                </p>
              </button>
              <button
                className={`card p-5 text-left ${mode === 'compress' ? 'ring-2 ring-pink-600' : ''}`}
                onClick={() => setMode('compress')}
              >
                <p className="text-2xl">🗜️</p>
                <h3 className="mt-2 font-semibold">Compress any photo</h3>
                <p className="text-sm text-slate-500">
                  Shrink photos by up to 90% with a quality slider — download as JPG, PNG,
                  or WebP.
                </p>
              </button>
            </section>

            <section className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
              {[
                ['1. Upload', 'Pick any photo from your phone or computer.'],
                ['2. Pick what to do', 'Resize it for Instagram, or compress it smaller.'],
                ['3. Download', 'Save it at full quality and post or share it.'],
              ].map(([title, text]) => (
                <div key={title} className="text-center">
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              ))}
            </section>

            <section className="card mx-auto mt-12 max-w-2xl p-6 text-center">
              <h2 className="text-xl font-bold">Free vs Premium</h2>
              <div className="mt-4 grid gap-4 text-left sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold">Free — $0</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>✓ Square, portrait & story sizes</li>
                    <li>✓ Blurred background, fit or fill</li>
                    <li>✓ Zoom & drag to position</li>
                    <li>✓ 5 resizes + 5 compressions a day</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-pink-500 p-4">
                  <p className="font-semibold text-pink-700">Premium — $4/month</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>✓ All sizes, incl. landscape & profile</li>
                    <li>✓ Solid color backgrounds & filters</li>
                    <li>✓ Unlimited resizes & compressions</li>
                    <li>✓ JPG, PNG & WebP downloads</li>
                  </ul>
                </div>
              </div>
              <button className="btn-primary mt-5" onClick={() => setShowUpgrade(true)}>
                Get Premium — $4/mo
              </button>
            </section>

            <section className="mx-auto mt-12 max-w-2xl">
              <h2 className="text-center text-xl font-bold">Frequently asked questions</h2>
              <div className="mt-4 space-y-3 text-left">
                {[
                  [
                    'How do I resize a photo for Instagram without cropping?',
                    'Upload your photo to InstaFit, pick the Instagram size — square 1080×1080, portrait 1080×1350, or story 1080×1920 — and InstaFit fits the whole photo in with a blurred or colored background. Nothing gets cut off.',
                  ],
                  [
                    'How do I compress an image to a smaller file size?',
                    'Upload your photo, use the quality slider to shrink it, and download it as JPG, PNG, or WebP. InstaFit shows you the original size, the new size, and exactly how much you saved.',
                  ],
                  [
                    'What size should an Instagram post be?',
                    'Square posts are 1080×1080, portrait posts are 1080×1350, and stories and reels are 1080×1920. InstaFit has all three built in, plus landscape 1080×566 and profile pictures on Premium.',
                  ],
                  [
                    'Is my photo uploaded to a server?',
                    'No. Everything runs in your browser — your photo never leaves your device.',
                  ],
                  [
                    'How much does InstaFit cost?',
                    'Free: 5 resizes and 5 compressions a day. Premium is $4 a month for unlimited resizes and compressions, all sizes, solid color backgrounds, filters, and custom text colors.',
                  ],
                ].map(([q, a]) => (
                  <div key={q} className="card p-4">
                    <p className="font-semibold">{q}</p>
                    <p className="mt-1 text-sm text-slate-600">{a}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : mode === 'resize' ? (
          <Editor
            image={image}
            fileName={fileName}
            isPremium={premium}
            onUpgrade={() => setShowUpgrade(true)}
            onNewPhoto={newPhoto}
          />
        ) : (
          <Compressor
            image={image}
            fileName={fileName}
            fileSize={fileSize}
            isPremium={premium}
            onUpgrade={() => setShowUpgrade(true)}
            onNewPhoto={newPhoto}
            onImageLoaded={loadImage}
          />
        )}
      </main>

      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">InstaFit Premium — $4/month</h2>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setShowUpgrade(false)}
              >
                ✕
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>✓ All Instagram sizes, including landscape & profile picture</li>
              <li>✓ Solid color backgrounds</li>
              <li>✓ Brightness, contrast & saturation filters</li>
              <li>✓ Unlimited resizes and compressions — no daily limit</li>
            </ul>
            <a
              className="btn-primary mt-5 w-full !py-3"
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
            >
              Pay $4/month with Stripe
            </a>
            <button className="btn-secondary mt-2 w-full" onClick={unlockPremium}>
              I&apos;ve upgraded — unlock Premium
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              After paying, come back here and tap &ldquo;I&apos;ve upgraded&rdquo; to unlock
              Premium on this device.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
