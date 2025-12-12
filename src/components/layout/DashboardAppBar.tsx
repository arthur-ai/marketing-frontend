'use client'

import AppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import MenuIcon from '@mui/icons-material/Menu'
import { UserProfile } from '@/components/auth/UserProfile'

interface DashboardAppBarProps {
  onMenuClick: () => void
  drawerWidth: number
}

export function DashboardAppBar({ onMenuClick, drawerWidth }: DashboardAppBarProps) {
  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, color: 'text.primary' }}
        >
          Marketing Pipeline
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <UserProfile />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

