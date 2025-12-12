'use client'

import { useSession } from 'next-auth/react'

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

export function useAuth() {
  const { data: session, status } = useSession()

  const user = session?.user as User | undefined
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const hasRole = (role: string): boolean => {
    if (!user?.roles) return false
    return user.roles.includes(role)
  }

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user?.roles) return false
    return roles.some((role) => user.roles!.includes(role))
  }

  const hasAllRoles = (roles: string[]): boolean => {
    if (!user?.roles) return false
    return roles.every((role) => user.roles!.includes(role))
  }

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
