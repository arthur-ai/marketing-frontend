'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Person,
  AccessTime,
  Group,
} from '@mui/icons-material'

interface SpeakerAnalysisSectionProps {
  data: {
    speakers?: string[]
    speaking_time_per_speaker?: Record<string, number>
    speaker_mapping?: Record<string, string>
  }
}

export function SpeakerAnalysisSection({ data }: SpeakerAnalysisSectionProps) {
  const {
    speakers = [],
    speaking_time_per_speaker = {},
    speaker_mapping = {},
  } = data || {}

  // Ensure we have valid objects (not null/undefined)
  const safeSpeakingTime = speaking_time_per_speaker && typeof speaking_time_per_speaker === 'object' ? speaking_time_per_speaker : {}
  const safeSpeakerMapping = speaker_mapping && typeof speaker_mapping === 'object' ? speaker_mapping : {}
  const safeSpeakers = Array.isArray(speakers) ? speakers : []

  if (safeSpeakers.length === 0 && Object.keys(safeSpeakingTime).length === 0) {
    return null
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  const hasNormalization = Object.keys(safeSpeakerMapping).length > 0 && 
    Object.values(safeSpeakerMapping).some((normalized, idx) => 
      Object.keys(safeSpeakerMapping)[idx] !== normalized
    )

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Group fontSize="small" color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Speaker Analysis
          </Typography>
        </Box>

        <Stack spacing={2}>
          {/* Speaker List */}
          {safeSpeakers.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Person fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Speakers ({safeSpeakers.length})
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {safeSpeakers.map((speaker, index) => (
                  <Chip
                    key={index}
                    label={speaker}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Speaker Normalization */}
          {hasNormalization && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Speaker Name Normalization
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  The following speaker name variations were normalized:
                </Typography>
                <Stack spacing={0.5}>
                  {Object.entries(safeSpeakerMapping).map(([original, normalized], index) => {
                    if (original !== normalized) {
                      return (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            "{original}"
                          </Typography>
                          <Typography variant="body2">→</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            "{normalized}"
                          </Typography>
                        </Box>
                      )
                    }
                    return null
                  })}
                </Stack>
              </Box>
            </>
          )}

          {/* Speaking Time */}
          {Object.keys(safeSpeakingTime).length > 0 && (
            <>
              <Divider />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Speaking Time per Speaker
                  </Typography>
                </Box>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Speaker</strong></TableCell>
                        <TableCell align="right"><strong>Time</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(safeSpeakingTime)
                        .sort(([, a], [, b]) => b - a)
                        .map(([speaker, seconds]) => (
                          <TableRow key={speaker}>
                            <TableCell>{speaker}</TableCell>
                            <TableCell align="right">{formatTime(seconds)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

