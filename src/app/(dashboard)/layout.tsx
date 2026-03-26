'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Box from '@mui/material/Box'
import { DashboardAppBar } from '@/components/layout/DashboardAppBar'
import { GlobalNotificationWatcher } from '@/components/approvals/pending-approvals-banner'
import { ClientOnly } from '@/components/providers/ClientOnly'

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

  useEffect(() => {
    if (devBypass) return

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname

    if (typeof window !== 'undefined' && currentPath.includes('/login')) {
      return
    }

    if (!isPending && (!session || !session.user)) {
      console.log('[DashboardLayout] No valid session, redirecting to login')
      router.push('/login')
    }
  }, [isPending, session, router, pathname, devBypass])

  if (!devBypass && isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0F0D0A' }}>
        <Box sx={{ color: '#6B6154', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>Loading...</Box>
      </Box>
    )
  }

  if (!devBypass && (!session || !session.user)) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0F0D0A' }}>
      <DashboardAppBar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '48px',
          width: '100%',
        }}
      >
        <GlobalNotificationWatcher />
        {children}
      </Box>
    </Box>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClientOnly fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#0F0D0A' }}>
        <Box sx={{ color: '#6B6154', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>Loading...</Box>
      </Box>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ClientOnly>
  )
}
