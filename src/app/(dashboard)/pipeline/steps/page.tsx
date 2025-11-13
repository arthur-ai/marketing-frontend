'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications'
import { StepExecutor } from '@/components/pipeline/step-executor'

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

      {/* Step Executor Component */}
      <StepExecutor />
    </Box>
  )
}

