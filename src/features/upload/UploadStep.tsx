import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { go } from '@/app/navigation'
import { validateFile } from './validate'

export function UploadStep() {
  const { t } = useTranslation()
  const setImage = useAppStore((s) => s.setImage)
  const setCrop = useAppStore((s) => s.setCrop)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const v = validateFile(file)
    if (v) {
      if (v.code === 'type') setErr(t('upload.err.type'))
      if (v.code === 'size') setErr(t('upload.err.size', { size: v.size }))
      return
    }
    setErr(null)
    try {
      const dataUrl = await readAsDataUrl(file)
      const dims = await imageSize(dataUrl)
      setImage({ dataUrl, width: dims.w, height: dims.h, name: file.name })
      const side = Math.min(dims.w, dims.h)
      setCrop({
        x: Math.floor((dims.w - side) / 2),
        y: Math.floor((dims.h - side) / 2),
        w: side,
        h: side,
      })
      go('crop')
    } catch {
      setErr(t('upload.err.decode'))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) void handleFile(f)
        }}
        className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-white p-12 text-center hover:bg-slate-50"
      >
        <p className="text-lg font-medium">{t('upload.drop')}</p>
        <p className="mt-2 text-sm text-slate-500">{t('upload.formats')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
        />
      </div>
      {err && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{err}</p>}
    </div>
  )
}

function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(f)
  })
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}
