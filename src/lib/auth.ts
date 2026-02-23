import { betterAuth } from 'better-auth'
import { genericOAuth, keycloak } from 'better-auth/plugins'

// Validate required environment variables
if (!process.env.KEYCLOAK_CLIENT_ID) {
  throw new Error('KEYCLOAK_CLIENT_ID is required')
}
if (!process.env.KEYCLOAK_ISSUER) {
  throw new Error('KEYCLOAK_ISSUER is required')
}

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET, // For cookie encryption
  emailAndPassword: {
    enabled: false, // Disable email/password since we're using Keycloak OAuth
  },
  plugins: [
    genericOAuth({
      config: [
        keycloak({
          providerId: 'keycloak', // Explicitly set provider ID
          clientId: process.env.KEYCLOAK_CLIENT_ID,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
          issuer: process.env.KEYCLOAK_ISSUER,
        }),
      ],
    }),
  ],
  session: {
    // Stateless session management using cookies (no database required)
    cookieCache: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      strategy: 'jwe', // JWE (JSON Web Encryption) - encrypted and secure
      refreshCache: true, // Automatically refresh cookie before expiration
    },
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  account: {
    // Store OAuth account data in cookies after OAuth flow
    storeStateStrategy: 'cookie',
    storeAccountCookie: true,
  },
  // No database configuration needed - using stateless cookie-based sessions
})

export type Session = typeof auth.$Infer.Session
