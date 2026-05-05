import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import { loadMobileGitCredentialStateForVault } from './mobileGitCredentialStateForVault'
import type { MobileGitCredentialState } from './mobileGitSyncPlan'
import { createMobileGitSyncPlanForVault } from './mobileGitSyncRuntimePlan'
import { authenticateMobileGitSyncPlan } from './mobileGitAuthentication'
import type { MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'
import type { MobileVaultMetadata } from './mobileVaultMetadata'

export function useMobileGitSyncFlow({
  createGitHubOAuthSession,
  credentialStorage,
  vault,
}: {
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  credentialStorage: MobileGitCredentialStorage
  vault: MobileVaultMetadata
}) {
  const [authFailureMessage, setAuthFailureMessage] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<MobileGitCredentialState>({ state: 'missing' })
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const refreshCredentials = useCallback(() => {
    void loadMobileGitCredentialStateForVault({ credentialStorage, vault })
      .then(setCredentials)
      .catch(() => setCredentials({ state: 'missing' }))
  }, [credentialStorage, vault])
  const gitSyncPlan = useMemo(
    () => createMobileGitSyncPlanForVault({
      credentials,
      ...(authFailureMessage ? { failure: { message: authFailureMessage, operation: 'clone' } } : {}),
      ...(isAuthenticating ? { operation: 'clone' } : {}),
      vault,
    }),
    [authFailureMessage, credentials, isAuthenticating, vault],
  )
  const authenticate = useCallback(() => {
    if (isAuthenticating) {
      return
    }

    setAuthFailureMessage(null)
    setIsAuthenticating(true)
    void authenticateMobileGitSyncPlan({
      credentialStorage,
      createGitHubOAuthSession,
      now: () => new Date().toISOString(),
      plan: gitSyncPlan,
    })
      .then((result) => {
        if (result.state === 'connected') {
          refreshCredentials()
          return
        }

        if (result.state === 'failed') {
          setAuthFailureMessage(result.message)
        }
      })
      .catch(() => setAuthFailureMessage('GitHub authentication failed.'))
      .finally(() => setIsAuthenticating(false))
  }, [createGitHubOAuthSession, credentialStorage, gitSyncPlan, isAuthenticating, refreshCredentials])

  useEffect(refreshCredentials, [refreshCredentials])

  return {
    authenticate,
    gitSyncPlan,
  }
}
