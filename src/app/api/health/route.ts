import { NextResponse } from 'next/server'

/**
 * Health check endpoint for container orchestration (ECS, Kubernetes, etc.)
 * This is a lightweight endpoint that doesn't require database or external service connections
 * Returns 200 OK if the Next.js server is running
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'healthy',
        service: 'marketing-frontend',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'marketing-frontend',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

