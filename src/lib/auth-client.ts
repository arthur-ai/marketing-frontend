'use client'

import { createAuthClient } from 'better-auth/react'
import { genericOAuthClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  basePath: '/auth',
  plugins: [genericOAuthClient()],
})
