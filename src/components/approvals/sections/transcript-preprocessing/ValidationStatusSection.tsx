'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Alert,
  Divider,
  LinearProgress,
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  AlertCircle,
} from '@mui/icons-material'

interface ValidationStatusSectionProps {
  data: {
    is_valid?: boolean
    speakers_validated?: boolean
    duration_validated?: boolean
    content_validated?: boolean
    transcript_type_validated?: boolean
    validation_issues?: string[]
    confidence_score?: number
    requires_approval?: boolean
    parsing_confidence?: number
    quality_metrics?: Record<string, number>
  }
}

export function ValidationStatusSection({ data }: ValidationStatusSectionProps) {
  const {
    is_valid = false,
    speakers_validated = false,
    duration_validated = false,
    content_validated = false,
    transcript_type_validated = false,
    validation_issues = [],
    confidence_score,
    requires_approval = false,
    parsing_confidence,
    quality_metrics,
  } = data

  const getStatusIcon = (valid: boolean) => {
    return valid ? (
      <CheckCircle color="success" fontSize="small" />
    ) : (
      <Cancel color="error" fontSize="small" />
    )
  }

  const getStatusChip = (valid: boolean, label: string) => {
    return (
      <Chip
        icon={getStatusIcon(valid)}
        label={label}
        color={valid ? 'success' : 'error'}
        variant={valid ? 'filled' : 'outlined'}
        size="small"
      />
    )
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Validation Status
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Overall Status */}
          <Box>
            <Alert
              severity={is_valid ? 'success' : 'error'}
              icon={is_valid ? <CheckCircle /> : <Cancel />}
            >
              <Typography variant="body1" fontWeight="bold">
                Overall Status: {is_valid ? 'Valid' : 'Invalid'}
              </Typography>
              {requires_approval && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Human approval is required before proceeding.
                </Typography>
              )}
            </Alert>
          </Box>

          {/* Confidence Scores */}
          {(confidence_score !== undefined || parsing_confidence !== undefined) && (
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Confidence Scores
              </Typography>
              <Stack spacing={1.5}>
                {confidence_score !== undefined && confidence_score !== null && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Validation Confidence</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(confidence_score * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={confidence_score * 100}
                      color={confidence_score >= 0.7 ? 'success' : confidence_score >= 0.5 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                )}
                {parsing_confidence !== undefined && parsing_confidence !== null && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Parsing Confidence</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(parsing_confidence * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parsing_confidence * 100}
                      color={parsing_confidence >= 0.8 ? 'success' : parsing_confidence >= 0.5 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Quality Metrics */}
          {quality_metrics && Object.keys(quality_metrics).length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Quality Metrics
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {Object.entries(quality_metrics).map(([metric, value]) => {
                    const percentage = value <= 1 ? value * 100 : value
                    return (
                      <Box key={metric}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">
                            {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          color={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            </>
          )}

          <Divider />

          {/* Field Validation Status */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Field Validation
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              {getStatusChip(speakers_validated, 'Speakers')}
              {getStatusChip(duration_validated, 'Duration')}
              {getStatusChip(content_validated, 'Content')}
              {getStatusChip(transcript_type_validated, 'Transcript Type')}
            </Stack>
          </Box>

          {/* Validation Issues */}
          {validation_issues.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="error">
                Validation Issues ({validation_issues.length})
              </Typography>
              <Alert severity="error" sx={{ mt: 1 }}>
                <Stack spacing={0.5}>
                  {validation_issues.map((issue, index) => (
                    <Typography key={index} variant="body2">
                      • {issue}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            </Box>
          )}

          {/* All Valid Message */}
          {is_valid && validation_issues.length === 0 && (
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="body2">
                All transcript fields have been validated successfully.
              </Typography>
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

