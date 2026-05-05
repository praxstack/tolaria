import { createNativeMobileGitHubOAuthSession } from './mobileNativeGitHubOAuthSession'
import type { MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'

declare const process: { env?: Record<string, string | undefined> } | undefined

export function createNativeMobileGitHubOAuthSessionFromEnvironment(): MobileGitHubOAuthSession {
  const clientId = process?.env?.EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID?.trim() ?? ''
  if (!clientId) {
    return {
      authorize: async () => ({
        message: 'GitHub OAuth client ID is not configured.',
        state: 'failed',
      }),
    }
  }

  return createNativeMobileGitHubOAuthSession({ clientId })
}
