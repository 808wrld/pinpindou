import type { Step } from '@/store/useAppStore'

export function go(step: Step) {
  location.hash = `#/${step}`
}
