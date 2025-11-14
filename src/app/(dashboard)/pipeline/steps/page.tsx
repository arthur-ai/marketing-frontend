'use client'

import { Suspense } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import { StepExecutor } from '@/components/pipeline/step-executor'

// Force dynamic rendering since this page uses useSearchParams
export const dynamic = 'force-dynamic'

function StepExecutorFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress />
    </Box>
  )
}

export default function PipelineStepsPage() {
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SettingsApplicationsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Execute Pipeline Step
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Execute individual pipeline steps independently with custom inputs
        </Typography>
      </Box>

      {/* Step Executor Component - Wrapped in Suspense for useSearchParams */}
      <Suspense fallback={<StepExecutorFallback />}>
        <StepExecutor />
      </Suspense>
    </Box>
  )
}

