'use client'

import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  Alert,
  Divider,
} from '@mui/material'
import { Info as InfoIcon, Warning as WarningIcon } from '@mui/icons-material'
import type { RetryStrategyConfig } from '@/types/api'

// Re-export for backward compatibility
export type { RetryStrategyConfig }

interface RetryStrategySettingsProps {
  config: RetryStrategyConfig
  onChange: (config: RetryStrategyConfig) => void
}

export function RetryStrategySettings({ config, onChange }: RetryStrategySettingsProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Retry Strategy Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how the pipeline handles failures and retries. The adaptive retry strategy uses
        different delays based on error types, and the circuit breaker prevents cascading failures.
      </Typography>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Adaptive Retry:</strong> The system automatically uses different retry delays
          based on error type:
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
          <li>Network errors: Fast retry (1s, 2s, 4s)</li>
          <li>Rate limit errors: Longer delays (60s, 120s, 240s)</li>
          <li>Validation errors: No retry (immediate failure)</li>
          <li>Timeout errors: Exponential backoff (1s, 2s, 4s, 8s, 16s)</li>
          <li>Server errors: Exponential backoff (1s, 2s, 4s, 8s)</li>
        </Box>
      </Alert>

      {/* Max Retries */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Maximum Retries
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Maximum number of retry attempts for failed API calls. This applies to all steps unless
          overridden in step-specific configuration.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Retries"
              type="number"
              inputProps={{ min: 0, max: 10 }}
              value={config.max_retries}
              onChange={(e) =>
                onChange({
                  ...config,
                  max_retries: parseInt(e.target.value) || 3,
                })
              }
              helperText="Number of retry attempts (0-10)"
            />
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Circuit Breaker */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Circuit Breaker Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The circuit breaker prevents cascading failures by temporarily stopping requests when
          failures exceed a threshold. This helps protect the system during outages.
        </Typography>

        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>How it works:</strong> When failures reach the threshold, the circuit opens and
            all requests fail fast. After the recovery timeout, it enters a half-open state to test
            if the service has recovered.
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Failure Threshold"
              type="number"
              inputProps={{ min: 1, max: 50 }}
              value={config.circuit_breaker.failure_threshold}
              onChange={(e) =>
                onChange({
                  ...config,
                  circuit_breaker: {
                    ...config.circuit_breaker,
                    failure_threshold: parseInt(e.target.value) || 5,
                  },
                })
              }
              helperText="Failures before opening circuit (1-50)"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Recovery Timeout (seconds)"
              type="number"
              inputProps={{ min: 10, max: 600 }}
              value={config.circuit_breaker.recovery_timeout}
              onChange={(e) =>
                onChange({
                  ...config,
                  circuit_breaker: {
                    ...config.circuit_breaker,
                    recovery_timeout: parseInt(e.target.value) || 60,
                  },
                })
              }
              helperText="Seconds to wait before recovery test (10-600)"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Half-Open Max Calls"
              type="number"
              inputProps={{ min: 1, max: 10 }}
              value={config.circuit_breaker.half_open_max_calls}
              onChange={(e) =>
                onChange({
                  ...config,
                  circuit_breaker: {
                    ...config.circuit_breaker,
                    half_open_max_calls: parseInt(e.target.value) || 3,
                  },
                })
              }
              helperText="Max calls allowed in half-open state (1-10)"
            />
          </Grid>
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Default Values:</strong> These settings use sensible defaults. Only adjust if you
          have specific requirements or are experiencing issues with retries or circuit breaker
          behavior.
        </Typography>
      </Alert>
    </Box>
  )
}

