import '@testing-library/jest-dom'

// Mock better-auth client (used by useAuth, LoginButton, UserProfile, api.ts)
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: jest.fn(() => ({ data: null, isPending: false })),
    signIn: {
      oauth2: jest.fn(),
    },
    signOut: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue({ data: null, error: null }),
    getAccessToken: jest.fn().mockResolvedValue(null),
  },
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Setup MSW if needed
if (typeof window !== 'undefined') {
  // Browser environment setup
}
