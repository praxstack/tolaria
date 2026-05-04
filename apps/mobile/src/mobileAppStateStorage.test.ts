import { describe, expect, it } from 'vitest'
import {
  createMobileAppStateStorage,
  type MobileAppStateFileSystem,
} from './mobileAppStateStorage'

describe('mobile app state storage', () => {
  it('returns default state when no app state file exists', async () => {
    const storage = createMobileAppStateStorage(createMemoryAppStateFileSystem())

    await expect(storage.load('personal')).resolves.toEqual({
      activeVaultId: 'personal',
      selectedNoteId: null,
    })
  })

  it('persists and restores selected note id for the active vault', async () => {
    const fileSystem = createMemoryAppStateFileSystem()
    const storage = createMobileAppStateStorage(fileSystem)

    await storage.save({ activeVaultId: 'personal', selectedNoteId: 'workflow' })

    await expect(storage.load('personal')).resolves.toEqual({
      activeVaultId: 'personal',
      selectedNoteId: 'workflow',
    })
  })

  it('ignores corrupt or mismatched state files', async () => {
    const fileSystem = createMemoryAppStateFileSystem({
      'file:///docs/state/app-state.json': '{"activeVaultId":"other","selectedNoteId":"workflow"}',
    })
    const storage = createMobileAppStateStorage(fileSystem)

    await expect(storage.load('personal')).resolves.toEqual({
      activeVaultId: 'personal',
      selectedNoteId: null,
    })
  })
})

function createMemoryAppStateFileSystem(files: Record<string, string> = {}): MobileAppStateFileSystem {
  const fileByUri = new Map(Object.entries(files))
  const directoryUris = new Set(['file:///docs'])

  return {
    documentDirectory: 'file:///docs/',
    getInfoAsync: async (uri) => ({
      exists: fileByUri.has(uri) || directoryUris.has(uri),
      isDirectory: directoryUris.has(uri),
    }),
    makeDirectoryAsync: async (uri) => {
      directoryUris.add(uri)
    },
    readAsStringAsync: async (uri) => fileByUri.get(uri) ?? '',
    writeAsStringAsync: async (uri, content) => {
      fileByUri.set(uri, content)
    },
  }
}
