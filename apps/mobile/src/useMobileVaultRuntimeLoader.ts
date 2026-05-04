import { useEffect } from 'react'
import type { MobileAppStateStorage } from './mobileAppStateStorage'
import type { MobileNote } from './demoData'
import type { MobileVaultMetadata } from './mobileVaultMetadata'
import type { MobileVaultMetadataStorage } from './mobileVaultMetadataStorage'
import { loadMobileVaultRuntime } from './mobileVaultRuntime'

export function useMobileVaultRuntimeLoader({
  appStateStorage,
  loadNotes,
  metadataStorage,
  onLoaded,
}: {
  appStateStorage: MobileAppStateStorage
  loadNotes: (vault: MobileVaultMetadata) => Promise<MobileNote[]>
  metadataStorage: MobileVaultMetadataStorage
  onLoaded: (runtime: {
    activeVault: MobileVaultMetadata
    notes: MobileNote[]
    selectedNoteId: string | null
  }) => void
}) {
  useEffect(() => {
    let isActive = true

    void loadMobileVaultRuntime({ appStateStorage, loadNotes, metadataStorage })
      .then((runtime) => {
        if (isActive && runtime.notes.length > 0) {
          onLoaded(runtime)
        }
      })
      .catch(() => {})

    return () => {
      isActive = false
    }
  }, [appStateStorage, loadNotes, metadataStorage, onLoaded])
}
