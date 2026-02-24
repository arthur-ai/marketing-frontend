import { betterAuth } from 'better-auth'
import { genericOAuth, keycloak } from 'better-auth/plugins'
import { Pool } from 'pg'

// Validate required environment variables
if (!process.env.KEYCLOAK_CLIENT_ID) {
  throw new Error('KEYCLOAK_CLIENT_ID is required')
}
if (!process.env.KEYCLOAK_ISSUER) {
  throw new Error('KEYCLOAK_ISSUER is required')
}

// Reuse the backend PostgreSQL database. Better Auth creates its own tables
// (user, session, account, verification) alongside the backend's tables.
// Run `npx @better-auth/cli migrate` once to create those tables.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : undefined

const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

export const auth = betterAuth({
  baseURL,
  basePath: '/auth',
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  database: pool,
  trustedOrigins: [
    baseURL,
    baseURL.replace(/^https?:\/\//, 'http://'),
    baseURL.replace(/^https?:\/\//, 'https://'),
  ],
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    genericOAuth({
      config: [
        keycloak({
          providerId: 'keycloak',
          clientId: process.env.KEYCLOAK_CLIENT_ID,
          clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
          issuer: process.env.KEYCLOAK_ISSUER,
        }),
      ],
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      strategy: 'jwe',
      refreshCache: true,
    },
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  },
  account: {
    storeStateStrategy: 'cookie',
  },
})

export type Session = typeof auth.$Infer.Session
