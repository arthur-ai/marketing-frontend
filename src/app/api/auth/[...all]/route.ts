import { toNextJsHandler } from 'better-auth/next-js'

export async function GET(req: Request) {
  const { auth } = await import('@/lib/auth')
  return toNextJsHandler(auth)(req)
}

export async function POST(req: Request) {
  const { auth } = await import('@/lib/auth')
  return toNextJsHandler(auth)(req)
}
