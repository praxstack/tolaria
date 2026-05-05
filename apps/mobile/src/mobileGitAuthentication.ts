import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import type { MobileGitSyncPlan } from './mobileGitSyncPlan'
import { connectMobileGitHubOAuth, type MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'

export type MobileGitAuthenticationResult =
  | {
      state: 'connected'
    }
  | {
      state: 'cancelled'
    }
  | {
      message: string
      state: 'failed'
    }
  | {
      state: 'ignored'
    }

export async function authenticateMobileGitSyncPlan({
  credentialStorage,
  createGitHubOAuthSession,
  now,
  plan,
}: {
  credentialStorage: MobileGitCredentialStorage
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  now: () => string
  plan: MobileGitSyncPlan
}): Promise<MobileGitAuthenticationResult> {
  if (!canAuthenticate(plan)) {
    return { state: 'ignored' }
  }

  if (authStrategy(plan) !== 'githubOAuth') {
    return {
      message: 'SSH credential setup is not available yet.',
      state: 'failed',
    }
  }

  return connectMobileGitHubOAuth({
    credentialStorage,
    now,
    session: createGitHubOAuthSession(),
  })
}

function canAuthenticate(plan: MobileGitSyncPlan) {
  return plan.state === 'authRequired' || plan.state === 'failed'
}

function authStrategy(plan: Extract<MobileGitSyncPlan, { state: 'authRequired' | 'failed' }>) {
  return plan.state === 'authRequired' ? plan.authStrategy : plan.remote.authStrategy
}
