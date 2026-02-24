'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'

export interface User {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  roles?: string[]
}

export interface Session {
  user: User
  accessToken?: string
  expires?: string
}

const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

const DEV_USER: User = {
  id: 'dev-user-id',
  name: 'Dev User',
  email: 'dev@localhost',
  roles: ['admin', 'user', 'content_editor', 'approver'],
}

function extractRolesFromToken(accessToken: string): string[] {
  try {
    // JWT payload is base64url encoded — normalize padding before decoding
    const base64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return payload?.realm_access?.roles ?? []
  } catch {
    return []
  }
}

export function useAuth() {
  // Always call hooks unconditionally (Rules of Hooks)
  const { data: session, isPending } = authClient.useSession()
  const [roles, setRoles] = useState<string[]>([])

  useEffect(() => {
    if (DEV_BYPASS) return
    if (!session?.user?.id) {
      setRoles([])
      return
    }
    // Fetch the Keycloak access token and decode roles from it.
    // Keycloak is the source of truth — roles are never stored in the DB.
    authClient
      .getAccessToken({ providerId: 'keycloak' })
      .then((tokenResponse: any) => {
        const token =
          typeof tokenResponse === 'string'
            ? tokenResponse
            : (tokenResponse?.accessToken ?? tokenResponse?.data?.accessToken)
        if (token) setRoles(extractRolesFromToken(token))
      })
      .catch(() => {})
  }, [session?.user?.id])

  // In dev bypass mode, return a mock dev user without Keycloak
  if (DEV_BYPASS) {
    return {
      user: DEV_USER,
      session: { user: DEV_USER } as Session,
      isAuthenticated: true,
      isLoading: false,
      hasRole: (role: string) => DEV_USER.roles!.includes(role),
      hasAnyRole: (rolesToCheck: string[]) => rolesToCheck.some((r) => DEV_USER.roles!.includes(r)),
      hasAllRoles: (rolesToCheck: string[]) => rolesToCheck.every((r) => DEV_USER.roles!.includes(r)),
    }
  }

  const user: User | undefined = session?.user
    ? { ...session.user, roles }
    : undefined

  const isAuthenticated = !!session && !!session.user
  const isLoading = isPending

  const hasRole = (role: string): boolean => roles.includes(role)
  const hasAnyRole = (rolesToCheck: string[]): boolean => rolesToCheck.some((r) => roles.includes(r))
  const hasAllRoles = (rolesToCheck: string[]): boolean => rolesToCheck.every((r) => roles.includes(r))

  return {
    user,
    session: session as Session | null,
    isAuthenticated,
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  }
}
