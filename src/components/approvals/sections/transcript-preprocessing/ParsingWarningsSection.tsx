'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
} from '@mui/material'
import {
  Warning,
} from '@mui/icons-material'

interface ParsingWarningsSectionProps {
  data: {
    parsing_warnings?: string[]
    validation_issues?: string[]
    approval_suggestions?: string[]
  }
}

export function ParsingWarningsSection({ data }: ParsingWarningsSectionProps) {
  const {
    parsing_warnings = [],
    validation_issues = [],
    approval_suggestions = [],
  } = data

  const allWarnings = [...parsing_warnings, ...validation_issues]
  const hasWarnings = allWarnings.length > 0
  const hasSuggestions = approval_suggestions.length > 0

  if (!hasWarnings && !hasSuggestions) {
    return null
  }

  return (
    <Stack spacing={2}>
      {/* Warnings */}
      {hasWarnings && (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning fontSize="small" color="warning" />
              <Typography variant="h6" fontWeight="bold" color="warning.main">
                Warnings & Issues ({allWarnings.length})
              </Typography>
            </Box>
            <Alert severity="warning">
              <Stack spacing={0.5}>
                {allWarnings.map((warning, index) => (
                  <Typography key={index} variant="body2">
                    • {warning}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {hasSuggestions && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Suggestions for Review
            </Typography>
            <Alert severity="info">
              <Stack spacing={0.5}>
                {approval_suggestions.map((suggestion, index) => (
                  <Typography key={index} variant="body2">
                    • {suggestion}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

