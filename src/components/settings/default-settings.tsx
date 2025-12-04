'use client'

import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import type { PipelineConfig } from '@/types/api'

interface DefaultSettingsProps {
  config: PipelineConfig
  onChange: (config: PipelineConfig) => void
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4.1', label: 'GPT-4.1', cost: 'Medium', speed: 'Medium' },
  { value: 'gpt-5', label: 'GPT-5', cost: 'High', speed: 'Medium' },
  { value: 'gpt-5-mini', label: 'GPT-5 mini', cost: 'Medium', speed: 'Fast' },
  { value: 'gpt-5-nano', label: 'GPT-5 nano', cost: 'Low', speed: 'Fast' },
  { value: 'gpt-5-pro', label: 'GPT-5 pro', cost: 'High', speed: 'Slow' },
  { value: 'gpt-5.1', label: 'GPT-5.1', cost: 'High', speed: 'Slow' },
]

export function DefaultSettings({ config, onChange }: DefaultSettingsProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Default Pipeline Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure default settings that apply to all pipeline steps unless overridden in the Model
        Configuration tab.
      </Typography>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        These defaults are used when no step-specific configuration is provided. You can override
        them per-step in the Model Configuration tab.
      </Alert>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Default Model</InputLabel>
              <Select
                value={config.default_model || 'gpt-5.1'}
                label="Default Model"
                onChange={(e) => onChange({ ...config, default_model: e.target.value })}
              >
                {AVAILABLE_MODELS.map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    {model.label} ({model.cost}, {model.speed})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              The default AI model used for all pipeline steps
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Default Temperature"
              type="number"
              inputProps={{ min: 0, max: 2, step: 0.1 }}
              value={config.default_temperature || 0.7}
              onChange={(e) =>
                onChange({ ...config, default_temperature: parseFloat(e.target.value) || 0.7 })
              }
              helperText="Controls randomness (0.0 = deterministic, 2.0 = very creative)"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Default Max Retries"
              type="number"
              inputProps={{ min: 0, max: 10 }}
              value={config.default_max_retries || 2}
              onChange={(e) =>
                onChange({ ...config, default_max_retries: parseInt(e.target.value) || 2 })
              }
              helperText="Number of retry attempts for failed API calls"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Model Recommendations
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 1 }}>
          <li>
            <strong>gpt-4.1:</strong> Smartest non-reasoning model. Good for general tasks.
          </li>
          <li>
            <strong>gpt-5-nano:</strong> Fastest, most cost-efficient version of GPT-5. Best for simple tasks.
          </li>
          <li>
            <strong>gpt-5-mini:</strong> Faster, cost-efficient version of GPT-5 for well-defined tasks.
          </li>
          <li>
            <strong>gpt-5:</strong> Intelligent reasoning model for coding and agentic tasks with configurable reasoning effort.
          </li>
          <li>
            <strong>gpt-5-pro:</strong> Version of GPT-5 that produces smarter and more precise responses.
          </li>
          <li>
            <strong>gpt-5.1:</strong> The best model for coding and agentic tasks with configurable reasoning effort.
          </li>
        </Box>
      </Box>
    </Box>
  )
}

