import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Use the Edge-compatible auth instance — pg cannot run in the Edge runtime.
// authEdge verifies sessions via the JWE cookie written by auth.ts (Node.js).
import { authEdge } from '@/lib/auth-edge'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/logout', '/api/auth', '/api/health']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // Allow public paths
  if (isPublicPath) {
    console.log('[Proxy] Public path, allowing:', pathname)
    return NextResponse.next()
  }

  // Check for authentication session using the Edge-compatible Better Auth instance
  try {
    console.log('[Proxy] Checking session for path:', pathname)
    const session = await authEdge.api.getSession({
      headers: request.headers,
    })

    console.log('[Proxy] Session check result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
    })

    // If no session and trying to access protected route, redirect to login
    if (!session || !session.user) {
      console.log('[Proxy] No valid session, redirecting to login from:', pathname)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    console.log('[Proxy] Valid session found, allowing access to:', pathname)
  } catch (error) {
    // If session check fails, redirect to login
    console.error('[Proxy] Failed to get session, redirecting to login:', {
      error: error instanceof Error ? error.message : String(error),
      pathname,
      stack: error instanceof Error ? error.stack : undefined,
    })
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
