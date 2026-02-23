import { Providers } from '@/components/providers/Providers'
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}