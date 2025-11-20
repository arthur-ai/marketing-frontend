'use client'

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  TextField,
  IconButton,
  InputAdornment,
  Autocomplete,
  Button,
} from '@mui/material'
import {
  Person,
  AccessTime,
  Description,
  Tag,
  Add,
  Delete,
  Edit,
} from '@mui/icons-material'

interface TranscriptDetailsSectionProps {
  data: {
    speakers?: string[]
    duration?: number
    transcript_type?: string
    content_summary?: string
    detected_format?: string
    detected_language?: string
  }
  isEditing?: boolean
  onUpdate?: (field: string, value: any) => void
}

export function TranscriptDetailsSection({ 
  data, 
  isEditing = false,
  onUpdate 
}: TranscriptDetailsSectionProps) {
  const {
    speakers = [],
    duration,
    transcript_type,
    content_summary,
    detected_format,
    detected_language,
  } = data

  // Helper functions - defined before useState to avoid hoisting issues
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Not specified'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  const formatDurationForInput = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const [newSpeaker, setNewSpeaker] = useState('')
  const [durationInput, setDurationInput] = useState(
    duration ? formatDurationForInput(duration) : ''
  )
  const [transcriptTypeInput, setTranscriptTypeInput] = useState(transcript_type || '')

  const parseDurationInput = (input: string): number | null => {
    if (!input.trim()) return null
    
    // Try parsing as seconds (just a number)
    const asNumber = parseInt(input, 10)
    if (!isNaN(asNumber)) {
      return asNumber
    }

    // Try parsing as time format (HH:MM:SS or MM:SS)
    const parts = input.split(':').map(p => parseInt(p.trim(), 10))
    if (parts.length === 2 && !parts.some(isNaN)) {
      // MM:SS format
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3 && !parts.some(isNaN)) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }

    return null
  }

  const handleAddSpeaker = () => {
    if (newSpeaker.trim() && !speakers.includes(newSpeaker.trim()) && onUpdate) {
      onUpdate('speakers', [...speakers, newSpeaker.trim()])
      setNewSpeaker('')
    }
  }

  const handleRemoveSpeaker = (speakerToRemove: string) => {
    if (onUpdate) {
      onUpdate('speakers', speakers.filter(s => s !== speakerToRemove))
    }
  }

  const handleDurationChange = (value: string) => {
    setDurationInput(value)
    const parsed = parseDurationInput(value)
    if (parsed !== null && onUpdate) {
      onUpdate('duration', parsed)
    } else if (value === '' && onUpdate) {
      onUpdate('duration', null)
    }
  }

  const handleTranscriptTypeChange = (value: string) => {
    setTranscriptTypeInput(value)
    if (onUpdate) {
      onUpdate('transcript_type', value || null)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Transcript Details
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Speakers */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Person fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                Speakers ({speakers.length})
              </Typography>
            </Box>
            {isEditing ? (
              <Stack spacing={1}>
                {speakers.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {speakers.map((speaker, index) => (
                      <Chip
                        key={index}
                        label={speaker}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={() => handleRemoveSpeaker(speaker)}
                        deleteIcon={<Delete fontSize="small" />}
                      />
                    ))}
                  </Stack>
                )}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Add speaker name"
                    value={newSpeaker}
                    onChange={(e) => setNewSpeaker(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSpeaker()
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleAddSpeaker}
                    disabled={!newSpeaker.trim() || speakers.includes(newSpeaker.trim())}
                    color="primary"
                  >
                    <Add />
                  </IconButton>
                </Box>
              </Stack>
            ) : (
              <>
                {speakers.length > 0 ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {speakers.map((speaker, index) => (
                      <Chip
                        key={index}
                        label={speaker}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No speakers found
                  </Typography>
                )}
              </>
            )}
          </Box>

          <Divider />

          {/* Duration */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccessTime fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                Duration
              </Typography>
            </Box>
            {isEditing ? (
              <TextField
                size="small"
                fullWidth
                value={durationInput}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder="e.g., 120 (seconds) or 2:00 (MM:SS) or 1:02:00 (HH:MM:SS)"
                helperText={duration ? `Current: ${formatDuration(duration)}` : 'Enter duration in seconds or time format'}
                InputProps={{
                  endAdornment: duration && (
                    <InputAdornment position="end">
                      <Typography variant="caption" color="text.secondary">
                        {formatDuration(duration)}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <Typography variant="body1">
                {formatDuration(duration)}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Transcript Type */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Tag fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                Transcript Type
              </Typography>
            </Box>
            {isEditing ? (
              <Autocomplete
                freeSolo
                size="small"
                options={['podcast', 'meeting', 'interview', 'video', 'webinar', 'conference']}
                value={transcriptTypeInput}
                onChange={(_, newValue) => handleTranscriptTypeChange(newValue || '')}
                onInputChange={(_, newInputValue) => handleTranscriptTypeChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Enter transcript type"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Chip
                      label={option}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                )}
              />
            ) : (
              transcript_type ? (
                <Chip
                  label={transcript_type}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not specified
                </Typography>
              )
            )}
          </Box>

          {transcript_type && !isEditing && <Divider />}

          {/* Detected Format */}
          {detected_format && (
            <>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Tag fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Detected Format
                  </Typography>
                </Box>
                <Chip
                  label={detected_format.toUpperCase()}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Box>
              <Divider />
            </>
          )}

          {/* Detected Language */}
          {detected_language && (
            <>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Tag fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Detected Language
                  </Typography>
                </Box>
                <Chip
                  label={detected_language.toUpperCase()}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Box>
              <Divider />
            </>
          )}

          {/* Content Summary */}
          {content_summary && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Description fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Content Preview
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  {content_summary}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

