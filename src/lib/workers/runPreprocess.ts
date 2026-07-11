import type { PreprocessRequest, PreprocessResponse } from '@/workers/protocol'

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, (res: PreprocessResponse) => void>()
const pendingReject = new Map<number, (err: unknown) => void>()

function resetWorker(err: unknown): void {
  for (const reject of pendingReject.values()) reject(err)
  pending.clear()
  pendingReject.clear()
  worker?.terminate()
  worker = null
}

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('@/workers/preprocess.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<PreprocessResponse>) => {
    const cb = pending.get(e.data.id)
    if (cb) { pending.delete(e.data.id); pendingReject.delete(e.data.id); cb(e.data) }
  }
  worker.onerror = (e: ErrorEvent) => {
    resetWorker(e.error ?? new Error(e.message))
  }
  worker.onmessageerror = (e: MessageEvent) => {
    resetWorker(new Error(`preprocess worker messageerror: ${String(e.data)}`))
  }
  return worker
}

export function runPreprocess(req: Omit<PreprocessRequest, 'type' | 'id'>): Promise<PreprocessResponse> {
  const w = ensureWorker()
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, resolve)
    pendingReject.set(id, reject)
    w.postMessage({ type: 'preprocess', id, ...req }, [req.pixels.buffer])
  })
}
