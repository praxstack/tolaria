export type MobileAppState = {
  activeVaultId: string
  selectedNoteId: string | null
}

export type MobileAppStateFileInfo = {
  exists: boolean
  isDirectory?: boolean
}

export type MobileAppStateFileSystem = {
  documentDirectory: string | null
  getInfoAsync: (uri: string) => Promise<MobileAppStateFileInfo>
  makeDirectoryAsync: (uri: string, options: { intermediates: true }) => Promise<void>
  readAsStringAsync: (uri: string) => Promise<string>
  writeAsStringAsync: (uri: string, content: string) => Promise<void>
}

export type MobileAppStateStorage = {
  load: (activeVaultId: string) => Promise<MobileAppState>
  save: (state: MobileAppState) => Promise<void>
}

export function createMobileAppStateStorage(
  fileSystem: MobileAppStateFileSystem,
): MobileAppStateStorage {
  return {
    load: async (activeVaultId) => loadMobileAppState({ activeVaultId, fileSystem }),
    save: async (state) => saveMobileAppState({ fileSystem, state }),
  }
}

async function loadMobileAppState({
  activeVaultId,
  fileSystem,
}: {
  activeVaultId: string
  fileSystem: MobileAppStateFileSystem
}) {
  const fileUri = appStateFileUri(fileSystem)
  const info = await fileSystem.getInfoAsync(fileUri)
  if (!info.exists || info.isDirectory) {
    return defaultMobileAppState(activeVaultId)
  }

  return parseMobileAppState({
    activeVaultId,
    content: await fileSystem.readAsStringAsync(fileUri),
  })
}

async function saveMobileAppState({
  fileSystem,
  state,
}: {
  fileSystem: MobileAppStateFileSystem
  state: MobileAppState
}) {
  const rootUri = appStateRootUri(fileSystem)
  await ensureDirectory({ fileSystem, uri: rootUri })
  await fileSystem.writeAsStringAsync(appStateFileUri(fileSystem), JSON.stringify(state))
}

function parseMobileAppState({
  activeVaultId,
  content,
}: {
  activeVaultId: string
  content: string
}) {
  try {
    return coerceMobileAppState({ activeVaultId, value: JSON.parse(content) })
  } catch {
    return defaultMobileAppState(activeVaultId)
  }
}

function coerceMobileAppState({
  activeVaultId,
  value,
}: {
  activeVaultId: string
  value: unknown
}): MobileAppState {
  if (!isStateRecord(value) || value.activeVaultId !== activeVaultId) {
    return defaultMobileAppState(activeVaultId)
  }

  return {
    activeVaultId,
    selectedNoteId: typeof value.selectedNoteId === 'string' ? value.selectedNoteId : null,
  }
}

function defaultMobileAppState(activeVaultId: string): MobileAppState {
  return { activeVaultId, selectedNoteId: null }
}

async function ensureDirectory({
  fileSystem,
  uri,
}: {
  fileSystem: MobileAppStateFileSystem
  uri: string
}) {
  const info = await fileSystem.getInfoAsync(uri)
  if (!info.exists) {
    await fileSystem.makeDirectoryAsync(uri, { intermediates: true })
  }
}

function appStateFileUri(fileSystem: MobileAppStateFileSystem) {
  return `${appStateRootUri(fileSystem)}/app-state.json`
}

function appStateRootUri(fileSystem: MobileAppStateFileSystem) {
  if (!fileSystem.documentDirectory) {
    throw new Error('Expo FileSystem documentDirectory is unavailable')
  }

  return `${fileSystem.documentDirectory.replace(/\/+$/, '')}/state`
}

function isStateRecord(value: unknown): value is { activeVaultId?: unknown; selectedNoteId?: unknown } {
  return typeof value === 'object' && value !== null
}
