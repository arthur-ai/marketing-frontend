/**
 * Edge-compatible auth instance used exclusively by proxy.ts (middleware).
 *
 * WHY A SEPARATE INSTANCE:
 * Next.js middleware runs in the Edge runtime (V8 isolate). The Edge runtime
 * cannot open TCP connections, so `pg` (PostgreSQL client) cannot run there.
 *
 * This instance has no database. It verifies sessions by decrypting the JWE
 * `better-auth.session_data` cookie that the full Node.js auth instance
 * (auth.ts) writes after a successful login or first `/api/auth/get-session`
 * call. No database call is required — the session is embedded in the cookie.
 *
 * REQUIREMENTS:
 * - Must share the exact same secret as auth.ts (BETTER_AUTH_SECRET)
 * - Must share the same cookieCache.strategy, maxAge, and basePath as auth.ts
 */
import { betterAuth } from 'better-auth'

export const authEdge = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  basePath: '/auth',
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days — must match auth.ts
      strategy: 'jwe',
      refreshCache: true,
    },
    expiresIn: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
})
