'use client'

import { Box, Button, Chip, Typography } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface ChipData {
  label: string
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
}

interface PageHeaderProps {
  title: string
  backPath: string
  backLabel?: string
  chips?: ChipData[]
  actions?: ReactNode
}

export function PageHeader({ title, backPath, backLabel, chips, actions }: PageHeaderProps) {
  const router = useRouter()

  return (
    <Box sx={{ mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => router.push(backPath)} sx={{ mb: 2 }}>
        {backLabel || `Back to ${backPath.split('/').pop()?.replace('-', ' ') || 'Previous'}`}
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            {title}
          </Typography>
          {chips && chips.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              {chips.map((chip, index) => (
                <Chip
                  key={index}
                  label={chip.label}
                  color={chip.color || 'default'}
                  sx={chip.label === chip.label.toUpperCase() ? { textTransform: 'uppercase' } : {}}
                />
              ))}
            </Box>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Box>
    </Box>
  )
}
