'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material'
import {
  TrendingUp,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material'

interface QualityMetricsDisplayProps {
  data: Record<string, any>
}

export function QualityMetricsDisplay({ data }: QualityMetricsDisplayProps) {
  const metrics: Array<{
    label: string
    value: number
    maxValue: number
    color: 'success' | 'warning' | 'error' | 'info'
  }> = []

  // Extract confidence score (0-1 scale)
  if (typeof data.confidence_score === 'number') {
    metrics.push({
      label: 'Confidence Score',
      value: data.confidence_score * 100,
      maxValue: 100,
      color: data.confidence_score >= 0.7 ? 'success' : data.confidence_score >= 0.5 ? 'warning' : 'error',
    })
  }

  // Extract other scores (0-100 scale)
  const scoreFields = [
    'relevance_score',
    'seo_score',
    'readability_score',
    'engagement_score',
    'strategy_alignment_score',
    'keyword_optimization_score',
    'accessibility_score',
    'formatting_quality_score',
    'design_quality_score',
    'brand_consistency_score',
  ]

  for (const field of scoreFields) {
    if (typeof data[field] === 'number') {
      metrics.push({
        label: field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: data[field],
        maxValue: 100,
        color: data[field] >= 70 ? 'success' : data[field] >= 50 ? 'warning' : 'error',
      })
    }
  }

  if (metrics.length === 0) {
    return null
  }

  return (
    <Card variant="outlined" sx={{ mb: 2, bgcolor: 'grey.50' }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Quality Metrics
        </Typography>
        <Stack spacing={2}>
          {metrics.map((metric, index) => (
            <Box key={index}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">
                  {metric.label}
                </Typography>
                <Chip
                  label={`${metric.value.toFixed(1)}%`}
                  size="small"
                  color={metric.color}
                  icon={
                    metric.color === 'success' ? <CheckCircle /> :
                    metric.color === 'warning' ? <Warning /> :
                    <Error />
                  }
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={metric.value}
                color={metric.color}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

