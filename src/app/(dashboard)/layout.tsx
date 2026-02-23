'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import Box from '@mui/material/Box'
import {DashboardSidebar} from '@/components/layout/DashboardSidebar'
import { DashboardAppBar } from '@/components/layout/DashboardAppBar'
import { PendingApprovalsBanner } from '@/components/approvals/pending-approvals-banner'
import { RealTimeJobMonitor } from '@/components/jobs/RealTimeJobMonitor'
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
  
  // Hide banner on approvals page (page itself shows approvals)
  const showBanner = pathname !== '/approvals'

  // Redirect to login if session is invalid or expired
  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname
    console.log('[DashboardLayout] Session check:', {
      isPending,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      currentPath,
      isLoginPage: currentPath.includes('/login'),
      sessionKeys: session ? Object.keys(session) : [],
    })

    // Only redirect if we're not already on the login page
    if (typeof window !== 'undefined' && currentPath.includes('/login')) {
      console.log('[DashboardLayout] Already on login page, skipping redirect check')
      return
    }
    
    // Check if session is invalid (user is null)
    // Better Auth stores OAuth tokens separately - accessToken will be fetched when needed for API calls
    if (!isPending && (!session || !session.user)) {
      console.log('[DashboardLayout] No valid session, redirecting to login')
      router.push('/login')
      return
    } else if (!isPending && session?.user) {
      console.log('[DashboardLayout] Valid session found, staying on dashboard')
    }
  }, [isPending, session, router, pathname])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Show loading state while checking session
  if (isPending) {
    console.log('[DashboardLayout] Session pending, showing loading')
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        Loading...
      </Box>
    )
  }

  // Don't render dashboard if not authenticated
  // Better Auth stores OAuth tokens separately - accessToken will be fetched when needed
  if (!session || !session.user) {
    console.log('[DashboardLayout] No session or user, returning null (will redirect via useEffect)')
    return null
  }

  console.log('[DashboardLayout] Rendering dashboard for user:', session.user.email || session.user.id)

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
        {showBanner && <PendingApprovalsBanner />}
        {children}
      </Box>
      {/* Real-time job monitor - fixed bottom-right */}
      <RealTimeJobMonitor />
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

