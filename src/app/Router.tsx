import { useEffect, useState } from 'react'
import { useAppStore, type Step } from '@/store/useAppStore'
import { UploadStep } from '@/features/upload/UploadStep'
import { CropStep } from '@/features/crop/CropStep'
import { TuneStep } from '@/features/tune/TuneStep'
import { ExportStep } from '@/features/export/ExportStep'

const STEPS: Step[] = ['upload', 'crop', 'tune', 'export']

function parseHash(): Step {
  const h = location.hash.replace('#/', '')
  return (STEPS as string[]).includes(h) ? (h as Step) : 'upload'
}

export function Router() {
  const [step, setStepLocal] = useState<Step>(parseHash())
  const store = useAppStore()

  useEffect(() => {
    const onHash = () => {
      const next = parseHash()
      if (next !== 'upload' && !store.image) {
        location.hash = '#/upload'
        return
      }
      setStepLocal(next)
      store.setStep(next)
    }
    window.addEventListener('hashchange', onHash)
    onHash()
    return () => window.removeEventListener('hashchange', onHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.image])

  switch (step) {
    case 'upload': return <UploadStep />
    case 'crop': return <CropStep />
    case 'tune': return <TuneStep />
    case 'export': return <ExportStep />
  }
}

