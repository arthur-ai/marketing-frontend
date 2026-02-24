import { toNextJsHandler } from 'better-auth/next-js'

export async function GET(req: Request) {
  const { auth } = await import('@/lib/auth')
  const { GET } = toNextJsHandler(auth)
  return GET(req)
}

export async function POST(req: Request) {
  const { auth } = await import('@/lib/auth')
  const { POST } = toNextJsHandler(auth)
  return POST(req)
}
