import type { PreprocessRequest, PreprocessResponse } from '@/workers/protocol'

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, (res: PreprocessResponse) => void>()

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('@/workers/preprocess.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<PreprocessResponse>) => {
    const cb = pending.get(e.data.id)
    if (cb) { pending.delete(e.data.id); cb(e.data) }
  }
  return worker
}

export function runPreprocess(req: Omit<PreprocessRequest, 'type' | 'id'>): Promise<PreprocessResponse> {
  const w = ensureWorker()
  const id = nextId++
  return new Promise(resolve => {
    pending.set(id, resolve)
    w.postMessage({ type: 'preprocess', id, ...req }, [req.pixels.buffer])
  })
}
