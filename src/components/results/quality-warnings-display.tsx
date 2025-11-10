'use client'

import { Box, Typography, Alert, AlertTitle, List, ListItem, ListItemIcon } from '@mui/material'
import { Warning, CheckCircle, Info } from '@mui/icons-material'
import type { JobResultsSummary } from '@/types/api'

interface QualityWarningsDisplayProps {
  jobResults: JobResultsSummary
}

export function QualityWarningsDisplay({ jobResults }: QualityWarningsDisplayProps) {
  const warnings = jobResults.quality_warnings || []
  
  if (warnings.length === 0) {
    return (
      <Alert severity="success" sx={{ mb: 3 }}>
        <CheckCircle sx={{ mr: 1 }} />
        <Typography variant="body2">
          No quality warnings - all checks passed
        </Typography>
      </Alert>
    )
  }
  
  return (
    <Alert 
      severity="warning" 
      sx={{ mb: 3 }}
      icon={<Warning />}
    >
      <AlertTitle>
        Quality Warnings ({warnings.length})
      </AlertTitle>
      <List dense sx={{ mt: 1 }}>
        {warnings.map((warning, idx) => (
          <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Info fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">{warning}</Typography>
          </ListItem>
        ))}
      </List>
    </Alert>
  )
}

