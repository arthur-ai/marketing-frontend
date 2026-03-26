'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { UserProfile } from '@/components/auth/UserProfile'
import { usePendingApprovals } from '@/hooks/useApi'

const NAV_ITEMS = [
  { label: 'Jobs', path: '/' },
  { label: 'Content', path: '/content' },
  { label: 'Pipeline', path: '/pipeline' },
  { label: 'Approvals', path: '/approvals' },
  { label: 'Brand Kit', path: '/brand-kit' },
  { label: 'Settings', path: '/settings' },
]

function isActivePath(itemPath: string, pathname: string) {
  if (itemPath === '/') return pathname === '/'
  return pathname.startsWith(itemPath)
}

export function DashboardAppBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: pendingData } = usePendingApprovals(undefined, true)
  const pendingCount = pendingData?.data?.pending || 0

  const navigate = (path: string) => {
    router.push(path)
    setDrawerOpen(false)
  }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        component="header"
        sx={{
          bgcolor: '#0F0D0A',
          borderBottom: '1px solid #2A251F',
          height: '48px',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          disableGutters
          sx={{ height: '48px', minHeight: '48px !important', px: 2, gap: 0 }}
        >
          {/* Hamburger — mobile only */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            sx={{
              display: { md: 'none' },
              color: '#6B6154',
              mr: 1,
              p: 0.75,
              '&:hover': { color: '#F0E8D8', bgcolor: 'transparent' },
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Logo */}
          <Box
            role="button"
            tabIndex={0}
            onClick={() => navigate('/')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/') }}
            aria-label="Go to home"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mr: 3,
              cursor: 'pointer',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                bgcolor: '#E8A238',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                sx={{
                  color: '#0F0D0A',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: '14px',
                  lineHeight: 1,
                }}
              >
                P
              </Typography>
            </Box>
            <Typography
              sx={{
                color: '#F0E8D8',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Profound AI
            </Typography>
          </Box>

          {/* Nav items — desktop */}
          <Box
            component="nav"
            role="navigation"
            aria-label="Main navigation"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'stretch',
              height: '48px',
              flexGrow: 1,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(item.path, pathname)
              const showBadge = item.path === '/approvals' && pendingCount > 0
              return (
                <Box
                  key={item.path}
                  component="button"
                  onClick={() => navigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? '2px solid #E8A238' : '2px solid transparent',
                    cursor: 'pointer',
                    px: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#F0E8D8' : '#6B6154',
                    transition: 'color 75ms, border-color 75ms',
                    whiteSpace: 'nowrap',
                    '&:hover': { color: '#F0E8D8' },
                    minHeight: '44px',
                  }}
                >
                  {item.label}
                  {showBadge && (
                    <Box
                      aria-label={`${pendingCount} pending`}
                      sx={{
                        bgcolor: '#E8A238',
                        color: '#0F0D0A',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 600,
                        borderRadius: '3px',
                        px: 0.5,
                        lineHeight: '16px',
                        minWidth: 16,
                        textAlign: 'center',
                      }}
                    >
                      {pendingCount}
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>

          <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
          <UserProfile showRoles={false} />
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { md: 'none' },
          '& .MuiDrawer-paper': {
            width: 240,
            bgcolor: '#0F0D0A',
            borderRight: '1px solid #2A251F',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #2A251F',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                bgcolor: '#E8A238',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#0F0D0A', fontWeight: 700, fontSize: '12px' }}>P</Typography>
            </Box>
            <Typography
              sx={{
                color: '#F0E8D8',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Profound AI
            </Typography>
          </Box>
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: '#6B6154', p: 0.5, '&:hover': { color: '#F0E8D8', bgcolor: 'transparent' } }}
            aria-label="Close navigation"
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <List component="nav" aria-label="Mobile navigation" sx={{ pt: 1, px: 0.5 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(item.path, pathname)
            const showBadge = item.path === '/approvals' && pendingCount > 0
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    borderRadius: '6px',
                    borderLeft: active ? '2px solid #E8A238' : '2px solid transparent',
                    bgcolor: active ? '#1A1713' : 'transparent',
                    py: 1,
                    minHeight: '44px',
                    '&:hover': { bgcolor: '#1A1713' },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '13px',
                      fontWeight: active ? 600 : 500,
                      fontFamily: 'var(--font-sans)',
                      color: active ? '#F0E8D8' : '#6B6154',
                    }}
                  />
                  {showBadge && (
                    <Box
                      sx={{
                        ml: 1,
                        px: 0.75,
                        bgcolor: '#E8A23820',
                        color: '#E8A238',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        borderRadius: '3px',
                        fontWeight: 500,
                        lineHeight: '20px',
                      }}
                    >
                      {pendingCount}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Drawer>
    </>
  )
}
