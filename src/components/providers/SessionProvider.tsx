'use client'

import { ReactNode } from 'react'

interface SessionProviderProps {
  children: ReactNode
}

/**
 * Better Auth doesn't require a provider component.
 * The authClient created with createAuthClient provides hooks directly.
 * This component is kept for compatibility with existing Providers structure,
 * but it just passes through children without wrapping.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  // Better Auth works without a provider - authClient.useSession() works directly
  // No provider needed - just return children
  return <>{children}</>
}
