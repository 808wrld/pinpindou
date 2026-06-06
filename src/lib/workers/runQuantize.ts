import type { QuantizeRequest, QuantizeResponse } from '@/workers/protocol'

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, (res: QuantizeResponse) => void>()

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('@/workers/quantize.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<QuantizeResponse>) => {
    const cb = pending.get(e.data.id)
    if (cb) { pending.delete(e.data.id); cb(e.data) }
  }
  return worker
}

export function runQuantize(req: Omit<QuantizeRequest, 'type' | 'id'>): Promise<QuantizeResponse> {
  const w = ensureWorker()
  const id = nextId++
  return new Promise(resolve => {
    pending.set(id, resolve)
    // NOTE: req.pixels.buffer is TRANSFERRED to the worker; do not reuse after this call.
    w.postMessage({ type: 'quantize', id, ...req }, [req.pixels.buffer])
  })
}
