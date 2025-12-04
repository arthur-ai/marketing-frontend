'use client'

import { Box, Typography, Paper, Checkbox, FormControlLabel, Alert, Chip } from '@mui/material'
import { Warning as WarningIcon } from '@mui/icons-material'

interface OptionalStepsSettingsProps {
  optionalSteps: Set<string>
  onChange: (steps: Set<string>) => void
}

const PIPELINE_STEPS = [
  { name: 'seo_keywords', label: 'SEO Keywords', description: 'Keyword extraction and analysis', impact: 'high' },
  { name: 'marketing_brief', label: 'Marketing Brief', description: 'Strategic marketing recommendations', impact: 'high' },
  { name: 'article_generation', label: 'Article Generation', description: 'AI-generated article content', impact: 'high' },
  { name: 'seo_optimization', label: 'SEO Optimization', description: 'SEO recommendations and optimizations', impact: 'medium' },
  { name: 'suggested_links', label: 'Suggested Links', description: 'Suggest internal links to add to the article', impact: 'low' },
  { name: 'content_formatting', label: 'Content Formatting', description: 'Final content formatting and structure', impact: 'medium' },
  { name: 'design_kit', label: 'Design Kit', description: 'Design and visual recommendations', impact: 'low' },
]

export function OptionalStepsSettings({ optionalSteps, onChange }: OptionalStepsSettingsProps) {
  const handleToggle = (stepName: string) => {
    const newSteps = new Set(optionalSteps)
    if (newSteps.has(stepName)) {
      newSteps.delete(stepName)
    } else {
      newSteps.add(stepName)
    }
    onChange(newSteps)
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Optional Steps Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure which pipeline steps are optional. If an optional step fails, the pipeline will
        continue execution and log a warning. Required steps will stop the pipeline if they fail.
      </Typography>

      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Warning:</strong> Making high-impact steps optional may result in incomplete
          results. Only mark steps as optional if their failure won't prevent the pipeline from
          producing usable output.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {PIPELINE_STEPS.map((step) => {
          const isOptional = optionalSteps.has(step.name)

          return (
            <Paper
              key={step.name}
              variant="outlined"
              sx={{
                p: 2,
                borderColor: isOptional ? 'warning.main' : 'divider',
                bgcolor: isOptional ? 'warning.50' : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Checkbox
                  checked={isOptional}
                  onChange={() => handleToggle(step.name)}
                  color="warning"
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {step.label}
                    </Typography>
                    <Chip
                      label={step.impact}
                      size="small"
                      color={getImpactColor(step.impact)}
                    />
                    {isOptional && (
                      <Chip label="Optional" size="small" color="warning" />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  {isOptional && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      This step will not stop the pipeline if it fails
                    </Alert>
                  )}
                </Box>
              </Box>
            </Paper>
          )
        })}
      </Box>

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Current Configuration:</strong> {optionalSteps.size} step(s) marked as optional.
          The pipeline will continue even if these steps fail.
        </Typography>
      </Alert>
    </Box>
  )
}

