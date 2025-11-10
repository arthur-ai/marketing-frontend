'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material'
import { Edit } from '@mui/icons-material'

interface CategoryCardProps {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  badge?: string
  onEdit?: () => void
  isEditing?: boolean
}

export function CategoryCard({
  icon,
  title,
  children,
  color = 'primary',
  badge,
  onEdit,
  isEditing = false,
}: CategoryCardProps) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: `${color}.main`,
              color: 'white',
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
            {title}
          </Typography>
          {badge && (
            <Chip label={badge} size="small" color={color} sx={{ mr: 1 }} />
          )}
          {!isEditing && onEdit && (
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  )
}

