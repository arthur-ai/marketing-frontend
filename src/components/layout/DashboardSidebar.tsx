'use client'

import { usePathname, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ArticleIcon from '@mui/icons-material/Article'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import FolderIcon from '@mui/icons-material/Folder'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import DescriptionIcon from '@mui/icons-material/Description'
import PaletteIcon from '@mui/icons-material/Palette'
import Badge from '@mui/material/Badge'
import { usePendingApprovals } from '@/hooks/useApi'

interface DashboardSidebarProps {
  drawerWidth: number
  mobileOpen: boolean
  onDrawerToggle: () => void
}

const menuItems = [
  { title: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { title: 'Content', icon: <ArticleIcon />, path: '/content' },
  { title: 'Pipeline', icon: <AccountTreeIcon />, path: '/pipeline' },
  { title: 'Results', icon: <FolderIcon />, path: '/results' },
  { title: 'Approvals', icon: <VerifiedUserIcon />, path: '/approvals' },
  { title: 'Upload', icon: <UploadFileIcon />, path: '/upload' },
  { title: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
  { title: 'Internal Docs', icon: <DescriptionIcon />, path: '/internal-docs' },
  { title: 'Design Kit', icon: <PaletteIcon />, path: '/design-kit' },
]

// const bottomItems = [
//   { title: 'Settings', icon: <SettingsIcon />, path: '/settings' },
// ]

export function DashboardSidebar({
  drawerWidth,
  mobileOpen,
  onDrawerToggle,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Only enable polling on results, pipeline, and approvals pages
  const shouldPoll = pathname === '/results' || pathname === '/pipeline' || pathname === '/approvals'
  const { data: pendingData } = usePendingApprovals(undefined, shouldPoll)
  const pendingCount = pendingData?.data?.pending || 0

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #2563eb 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RocketLaunchIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Marketing Tool
          </Typography>
          <Chip
            label="v1.0.0"
            size="small"
            sx={{
              height: 18,
              fontSize: '0.65rem',
              mt: 0.5,
              bgcolor: 'primary.50',
              color: 'primary.main',
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      <Divider />

      {/* Main Menu */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
            
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: 2,
                    bgcolor: isActive ? 'primary.50' : 'transparent',
                    color: isActive ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.100' : 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.path === '/approvals' && pendingCount > 0 ? (
                      <Badge badgeContent={pendingCount} color="error">
                        {item.icon}
                      </Badge>
                    ) : (
                      item.icon
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
        </List>
      </Box>

      <Divider />

      {/* Bottom Menu */}
      <List sx={{ p: 2 }}>
        {bottomItems.map((item) => {
          const isActive = pathname === item.path
          
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.50' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.100' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  )
}

