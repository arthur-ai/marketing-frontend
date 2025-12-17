'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Chip,
  Grid,
  Alert,
  Divider,
} from '@mui/material'
import {
  AutoAwesome as SparklesIcon,
  AttachMoney as DollarSignIcon,
} from '@mui/icons-material'
import type { PipelineConfig, PipelineStepConfig } from '@/types/api'

interface PipelineModelConfigSettingsProps {
  config: PipelineConfig
  onChange: (config: PipelineConfig) => void
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4.1', label: 'GPT-4.1', cost: 'Medium', speed: 'Medium', description: 'Smartest non-reasoning model' },
  { value: 'gpt-5', label: 'GPT-5', cost: 'High', speed: 'Medium', description: 'Previous intelligent reasoning model for coding and agentic tasks with configurable reasoning effort' },
  { value: 'gpt-5-mini', label: 'GPT-5 mini', cost: 'Medium', speed: 'Fast', description: 'A faster, cost-efficient version of GPT-5 for well-defined tasks' },
  { value: 'gpt-5-nano', label: 'GPT-5 nano', cost: 'Low', speed: 'Fast', description: 'Fastest, most cost-efficient version of GPT-5' },
  { value: 'gpt-5-pro', label: 'GPT-5 pro', cost: 'High', speed: 'Slow', description: 'Version of GPT-5 that produces smarter and more precise responses' },
  { value: 'gpt-5.1', label: 'GPT-5.1', cost: 'High', speed: 'Slow', description: 'The best model for coding and agentic tasks with configurable reasoning effort' },
  { value: 'gpt-5.2', label: 'GPT-5.2', cost: 'High', speed: 'Slow', description: 'Latest version with enhanced reasoning capabilities for coding and agentic tasks' },
]

const PIPELINE_STEPS = [
  { name: 'seo_keywords', label: 'SEO Keywords', complexity: 'Simple', recommended: 'gpt-5-nano' },
  { name: 'marketing_brief', label: 'Marketing Brief', complexity: 'Medium', recommended: 'gpt-5-mini' },
  { name: 'article_generation', label: 'Article Generation', complexity: 'Complex', recommended: 'gpt-5.1' },
  { name: 'seo_optimization', label: 'SEO Optimization', complexity: 'Medium', recommended: 'gpt-5-mini' },
  { name: 'suggested_links', label: 'Suggested Links', complexity: 'Simple', recommended: 'gpt-5-nano' },
  { name: 'content_formatting', label: 'Content Formatting', complexity: 'Simple', recommended: 'gpt-5-nano' },
  { name: 'design_kit', label: 'Design Kit', complexity: 'Simple', recommended: 'gpt-5-nano' },
  // Social Media Pipeline Steps
  { name: 'social_media_marketing_brief', label: 'Social Media Marketing Brief', complexity: 'Medium', recommended: 'gpt-5-mini' },
  { name: 'social_media_angle_hook', label: 'Social Media Angle & Hook', complexity: 'Medium', recommended: 'gpt-5-mini' },
  { name: 'social_media_post_generation', label: 'Social Media Post Generation', complexity: 'Complex', recommended: 'gpt-5.1' },
]

export function PipelineModelConfigSettings({
  config,
  onChange,
}: PipelineModelConfigSettingsProps) {
  const updateStepConfig = (stepName: string, stepConfig: Partial<PipelineStepConfig>) => {
    const newConfig = {
      ...config,
      step_configs: {
        ...config.step_configs,
        [stepName]: {
          step_name: stepName,
          ...config.step_configs?.[stepName],
          ...stepConfig,
        },
      },
    }
    onChange(newConfig)
  }

  const removeStepConfig = (stepName: string) => {
    const newStepConfigs = { ...config.step_configs }
    delete newStepConfigs[stepName]
    const newConfig = { ...config, step_configs: newStepConfigs }
    onChange(newConfig)
  }

  const applyRecommended = () => {
    const recommendedConfig: PipelineConfig = {
      ...config,
      default_model: 'gpt-4o',
      step_configs: {},
    }

    PIPELINE_STEPS.forEach((step) => {
      recommendedConfig.step_configs![step.name] = {
        step_name: step.name,
        model: step.recommended as any,
      }
    })

    onChange(recommendedConfig)
  }

  return (
    <Box sx={{ space: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Per-Step Model Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Configure different AI models for each pipeline step to optimize cost and quality. Simple
          steps can use cheaper models, while complex steps benefit from more powerful models.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<SparklesIcon />}
          onClick={applyRecommended}
          sx={{ mb: 2 }}
        >
          Apply Recommended Configuration
        </Button>
      </Box>

      {/* Cost Optimization Info */}
      <Alert severity="info" icon={<DollarSignIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Cost Optimization Tip:</strong> Using cheaper models (gpt-4o-mini) for simple
          steps and powerful models (gpt-5.1) for complex steps can reduce costs by 40-60% while
          maintaining quality.
        </Typography>
      </Alert>

      {/* Default Configuration */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Default Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These settings apply to all steps unless overridden below.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
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
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Default Temperature"
              type="number"
              inputProps={{ min: 0, max: 2, step: 0.1 }}
              value={config.default_temperature || 0.7}
              onChange={(e) =>
                onChange({ ...config, default_temperature: parseFloat(e.target.value) || 0.7 })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Default Max Retries"
              type="number"
              inputProps={{ min: 0, max: 10 }}
              value={config.default_max_retries || 2}
              onChange={(e) =>
                onChange({ ...config, default_max_retries: parseInt(e.target.value) || 2 })
              }
            />
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Step-Specific Configuration */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Step-Specific Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Override default settings for specific steps. Leave as "Use Default" to use the default
          model.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PIPELINE_STEPS.map((step) => {
            const stepConfig = config.step_configs?.[step.name]
            const model = stepConfig?.model || config.default_model || 'gpt-5.1'
            const isCustomized = !!stepConfig?.model

            return (
              <Paper key={step.name} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body1" fontWeight="medium">
                        {step.label}
                      </Typography>
                      <Chip
                        label={step.complexity}
                        size="small"
                        color={step.complexity === 'Simple' ? 'success' : step.complexity === 'Medium' ? 'warning' : 'error'}
                      />
                      {isCustomized && (
                        <Chip label="Custom" size="small" color="primary" />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Recommended: {step.recommended}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={model}
                        label="Model"
                        onChange={(e) => {
                          if (e.target.value === config.default_model) {
                            removeStepConfig(step.name)
                          } else {
                            updateStepConfig(step.name, { model: e.target.value as any })
                          }
                        }}
                      >
                        <MenuItem value={config.default_model || 'gpt-5.1'}>
                          Use Default ({config.default_model || 'gpt-5.1'})
                        </MenuItem>
                        {AVAILABLE_MODELS.map((m) => (
                          <MenuItem key={m.value} value={m.value}>
                            {m.label} ({m.cost}, {m.speed})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Temperature"
                      type="number"
                      inputProps={{ min: 0, max: 2, step: 0.1 }}
                      value={stepConfig?.temperature ?? config.default_temperature ?? 0.7}
                      onChange={(e) =>
                        updateStepConfig(step.name, {
                          temperature: parseFloat(e.target.value) || undefined,
                        })
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Max Retries"
                      type="number"
                      inputProps={{ min: 0, max: 10 }}
                      value={stepConfig?.max_retries ?? config.default_max_retries ?? 2}
                      onChange={(e) =>
                        updateStepConfig(step.name, {
                          max_retries: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </Grid>
                </Grid>

                {isCustomized && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => removeStepConfig(step.name)}
                    >
                      Reset to Default
                    </Button>
                  </Box>
                )}
              </Paper>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}

