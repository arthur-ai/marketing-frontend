'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Alert,
} from '@mui/material'
import {
  Info,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material'

interface ParsingInfoSectionProps {
  data: {
    detected_format?: string
    parsing_confidence?: number
    parsing_warnings?: string[]
  }
}

export function ParsingInfoSection({ data }: ParsingInfoSectionProps) {
  const {
    detected_format,
    parsing_confidence,
    parsing_warnings = [],
  } = data

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'default'
    if (confidence >= 0.8) return 'success'
    if (confidence >= 0.5) return 'warning'
    return 'error'
  }

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unknown'
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.5) return 'Medium'
    return 'Low'
  }

  if (!detected_format && !parsing_confidence && parsing_warnings.length === 0) {
    return null
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Info fontSize="small" color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Parsing Information
          </Typography>
        </Box>

        <Stack spacing={2}>
          {/* Detected Format */}
          {detected_format && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Detected Format
              </Typography>
              <Chip
                label={detected_format.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}

          {/* Parsing Confidence */}
          {parsing_confidence !== undefined && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Parsing Confidence
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${(parsing_confidence * 100).toFixed(1)}% - ${getConfidenceLabel(parsing_confidence)}`}
                  size="small"
                  color={getConfidenceColor(parsing_confidence)}
                  icon={
                    parsing_confidence >= 0.8 ? <CheckCircle /> :
                    parsing_confidence >= 0.5 ? <Warning /> :
                    <Error />
                  }
                />
                <Typography variant="body2" color="text.secondary">
                  {parsing_confidence >= 0.8
                    ? 'Parser worked well, data is reliable'
                    : parsing_confidence >= 0.5
                    ? 'Parser had some issues, verify data'
                    : 'Parser struggled, manual review recommended'}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Parsing Warnings */}
          {parsing_warnings.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="warning.main">
                Parsing Warnings ({parsing_warnings.length})
              </Typography>
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Stack spacing={0.5}>
                  {parsing_warnings.map((warning, index) => (
                    <Typography key={index} variant="body2">
                      • {warning}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

