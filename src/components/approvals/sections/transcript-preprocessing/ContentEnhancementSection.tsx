'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
} from '@mui/material'
import {
  Language,
  Topic,
  Timeline,
} from '@mui/icons-material'

interface ContentEnhancementSectionProps {
  data: {
    detected_language?: string
    key_topics?: string[]
    conversation_flow?: {
      type?: string
      question_count?: number
      answer_count?: number
      patterns?: string[]
    }
  }
}

export function ContentEnhancementSection({ data }: ContentEnhancementSectionProps) {
  const {
    detected_language,
    key_topics = [],
    conversation_flow,
  } = data

  if (!detected_language && key_topics.length === 0 && !conversation_flow) {
    return null
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Content Enhancement
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Detected Language */}
          {detected_language && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Language fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight="bold">
                  Detected Language
                </Typography>
              </Box>
              <Chip
                label={detected_language.toUpperCase()}
                size="small"
                color="secondary"
                variant="outlined"
              />
            </Box>
          )}

          {/* Key Topics */}
          {key_topics.length > 0 && (
            <>
              {detected_language && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Topic fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Key Topics ({key_topics.length})
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {key_topics.map((topic, index) => (
                    <Chip
                      key={index}
                      label={topic}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Conversation Flow */}
          {conversation_flow && (
            <>
              {(detected_language || key_topics.length > 0) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Timeline fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Conversation Flow
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {conversation_flow.type && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Flow Type:
                      </Typography>
                      <Chip
                        label={conversation_flow.type}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  )}
                  {(conversation_flow.question_count !== undefined || 
                    conversation_flow.answer_count !== undefined) && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Analysis:
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        {conversation_flow.question_count !== undefined && (
                          <Typography variant="body2">
                            <strong>Questions:</strong> {conversation_flow.question_count}
                          </Typography>
                        )}
                        {conversation_flow.answer_count !== undefined && (
                          <Typography variant="body2">
                            <strong>Answers:</strong> {conversation_flow.answer_count}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  )}
                  {conversation_flow.patterns && conversation_flow.patterns.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Patterns:
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {conversation_flow.patterns.map((pattern, index) => (
                          <Chip
                            key={index}
                            label={pattern}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

