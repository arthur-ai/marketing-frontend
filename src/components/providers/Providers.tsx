'use client'

import { QueryProvider } from './QueryProvider'
import { SessionProvider } from './SessionProvider'
import { ToastProvider } from './ToastProvider'
import { ThemeProvider } from './ThemeProvider'

/**
 * Combined providers component that wraps all client-side providers.
 * This ensures a single client component boundary and proper React context.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryProvider>
          <ToastProvider />
          {children}
        </QueryProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
