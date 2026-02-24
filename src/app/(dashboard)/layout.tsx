'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Box from '@mui/material/Box'
import {DashboardSidebar} from '@/components/layout/DashboardSidebar'
import { DashboardAppBar } from '@/components/layout/DashboardAppBar'
import { GlobalNotificationWatcher } from '@/components/approvals/pending-approvals-banner'
import { ClientOnly } from '@/components/providers/ClientOnly'

const DRAWER_WIDTH = 280

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

  // Redirect to login if session is invalid or expired
  useEffect(() => {
    if (devBypass) return

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname

    // Only redirect if we're not already on the login page
    if (typeof window !== 'undefined' && currentPath.includes('/login')) {
      return
    }

    // Check if session is invalid (user is null)
    if (!isPending && (!session || !session.user)) {
      console.log('[DashboardLayout] No valid session, redirecting to login')
      router.push('/login')
    }
  }, [isPending, session, router, pathname, devBypass])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Show loading state while checking session (skip in dev bypass mode)
  if (!devBypass && isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </Box>
    )
  }

  // Don't render dashboard if not authenticated (skip in dev bypass mode)
  if (!devBypass && (!session || !session.user)) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardAppBar onMenuClick={handleDrawerToggle} drawerWidth={DRAWER_WIDTH} />
      <DashboardSidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </Box>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ClientOnly>
  )
}

