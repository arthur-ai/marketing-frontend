import { QueryProvider } from '@/components/providers/QueryProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

export const metadata = {
  title: 'Marketing Tool - AI-Powered Content Pipeline',
  description: 'Transform your marketing content with AI-powered automation and intelligent workflows',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider>
            <QueryProvider>
              <ToastProvider />
              {children}
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}