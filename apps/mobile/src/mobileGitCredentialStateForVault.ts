import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import type { MobileGitCredentialState } from './mobileGitSyncPlan'
import { createMobileVaultConfig } from './mobileVaultConfig'
import type { MobileVaultMetadata } from './mobileVaultMetadata'

export async function loadMobileGitCredentialStateForVault({
  credentialStorage,
  vault,
}: {
  credentialStorage: MobileGitCredentialStorage
  vault: MobileVaultMetadata
}): Promise<MobileGitCredentialState> {
  const result = createMobileVaultConfig(vault)
  if (!result.ok || result.config.sync.state === 'localOnly') {
    return { state: 'missing' }
  }

  return credentialStorage.loadState(result.config.sync.authRequirement)
}
