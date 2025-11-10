'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import {DashboardSidebar} from '@/components/layout/DashboardSidebar'
import { DashboardAppBar } from '@/components/layout/DashboardAppBar'
import { PendingApprovalsBanner } from '@/components/approvals/pending-approvals-banner'

const DRAWER_WIDTH = 280

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  
  // Hide banner on approvals page (page itself shows approvals)
  const showBanner = pathname !== '/approvals'

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
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
        {showBanner && <PendingApprovalsBanner />}
        {children}
      </Box>
    </Box>
  )
}

