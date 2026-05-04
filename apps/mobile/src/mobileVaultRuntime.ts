import type { MobileAppStateStorage } from './mobileAppStateStorage'
import type { MobileNote } from './demoData'
import {
  defaultMobileVaultMetadata,
  selectActiveMobileVaultMetadata,
  type MobileVaultMetadata,
} from './mobileVaultMetadata'
import type { MobileVaultMetadataStorage } from './mobileVaultMetadataStorage'

export type MobileVaultRuntime = {
  activeVault: MobileVaultMetadata
  notes: MobileNote[]
  selectedNoteId: string | null
}

export async function loadMobileVaultRuntime({
  appStateStorage,
  loadNotes,
  metadataStorage,
}: {
  appStateStorage: MobileAppStateStorage
  loadNotes: (vault: MobileVaultMetadata) => Promise<MobileNote[]>
  metadataStorage: MobileVaultMetadataStorage
}): Promise<MobileVaultRuntime> {
  const activeVault = selectActiveMobileVaultMetadata({
    activeVaultId: defaultMobileVaultMetadata.id,
    vaults: await metadataStorage.load(),
  })
  const [appState, notes] = await Promise.all([
    appStateStorage.load(activeVault.id),
    loadNotes(activeVault),
  ])

  return {
    activeVault,
    notes,
    selectedNoteId: appState.selectedNoteId,
  }
}
