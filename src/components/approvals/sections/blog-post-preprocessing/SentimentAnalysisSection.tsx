'use client'

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
} from '@mui/material'
import {
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Psychology,
} from '@mui/icons-material'

const SENTIMENT_OPTIONS = ['positive', 'neutral', 'negative', 'mixed']

interface SentimentAnalysisSectionProps {
  data: {
    overall_sentiment?: string
    sentiment_score?: number
    sentiment_confidence?: number
    emotional_tone?: string
    sentiment_by_section?: Record<string, any>
  }
  isEditing?: boolean
  onUpdate?: (field: string, value: any) => void
}

export function SentimentAnalysisSection({ data, isEditing = false, onUpdate }: SentimentAnalysisSectionProps) {
  const {
    overall_sentiment,
    sentiment_score,
    sentiment_confidence,
    emotional_tone,
    sentiment_by_section,
  } = data

  const hasData = overall_sentiment ||
    sentiment_score !== undefined ||
    sentiment_confidence !== undefined ||
    emotional_tone ||
    (sentiment_by_section && Object.keys(sentiment_by_section).length > 0)

  if (!hasData && !isEditing) {
    return null
  }

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) return null
    const lower = sentiment.toLowerCase()
    if (lower.includes('positive')) return <SentimentSatisfied color="success" />
    if (lower.includes('negative')) return <SentimentDissatisfied color="error" />
    return <SentimentNeutral color="warning" />
  }

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'default'
    const lower = sentiment.toLowerCase()
    if (lower.includes('positive')) return 'success'
    if (lower.includes('negative')) return 'error'
    return 'warning'
  }

  const getSentimentScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'default'
    if (score >= 0.3) return 'success'
    if (score <= -0.3) return 'error'
    return 'warning'
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Psychology fontSize="small" color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Sentiment Analysis
          </Typography>
        </Box>

        <Stack spacing={2}>
          {/* Overall Sentiment */}
          {(overall_sentiment || isEditing) && (
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Overall Sentiment
              </Typography>
              {isEditing ? (
                <FormControl size="small" fullWidth>
                  <InputLabel>Sentiment</InputLabel>
                  <Select
                    value={overall_sentiment || ''}
                    label="Sentiment"
                    onChange={(e) => onUpdate?.('overall_sentiment', e.target.value)}
                  >
                    {SENTIMENT_OPTIONS.map((opt) => (
                      <MenuItem key={opt} value={opt}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSentimentIcon(opt)}
                          <span style={{ textTransform: 'capitalize' }}>{opt}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getSentimentIcon(overall_sentiment)}
                  <Chip
                    label={overall_sentiment}
                    size="small"
                    color={getSentimentColor(overall_sentiment)}
                    variant="filled"
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Sentiment Score */}
          {(sentiment_score !== undefined && sentiment_score !== null) && (
            <>
              {overall_sentiment && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Sentiment Score
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {sentiment_score >= 0 ? '+' : ''}{sentiment_score.toFixed(2)}
                  </Typography>
                </Box>
                {isEditing ? (
                  <Slider
                    value={sentiment_score}
                    min={-1}
                    max={1}
                    step={0.01}
                    onChange={(_, val) => onUpdate?.('sentiment_score', val)}
                    color={getSentimentScoreColor(sentiment_score) as any}
                    size="small"
                    marks={[{ value: -1, label: '-1' }, { value: 0, label: '0' }, { value: 1, label: '+1' }]}
                  />
                ) : (
                  <>
                    <LinearProgress
                      variant="determinate"
                      value={((sentiment_score + 1) / 2) * 100}
                      color={getSentimentScoreColor(sentiment_score)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Very Negative</Typography>
                      <Typography variant="caption" color="text.secondary">Very Positive</Typography>
                    </Box>
                  </>
                )}
              </Box>
            </>
          )}

          {/* Sentiment Confidence (read-only) */}
          {sentiment_confidence !== undefined && sentiment_confidence !== null && (
            <>
              {(overall_sentiment || sentiment_score !== undefined) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Confidence
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(sentiment_confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={sentiment_confidence * 100}
                  color={sentiment_confidence >= 0.7 ? 'success' : sentiment_confidence >= 0.5 ? 'warning' : 'error'}
                  sx={{ height: 6, borderRadius: 1 }}
                />
              </Box>
            </>
          )}

          {/* Emotional Tone */}
          {(emotional_tone || isEditing) && (
            <>
              {(overall_sentiment || sentiment_score !== undefined || sentiment_confidence !== undefined) && <Divider />}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Emotional Tone
                </Typography>
                {isEditing ? (
                  <TextField
                    size="small"
                    fullWidth
                    value={emotional_tone || ''}
                    onChange={(e) => onUpdate?.('emotional_tone', e.target.value)}
                    placeholder="e.g. enthusiastic, informative, urgent"
                  />
                ) : (
                  <Chip label={emotional_tone} size="small" color="secondary" variant="outlined" />
                )}
              </Box>
            </>
          )}

          {/* Sentiment by Section (read-only) */}
          {sentiment_by_section && Object.keys(sentiment_by_section).length > 0 && (
            <>
              {(overall_sentiment || sentiment_score !== undefined || sentiment_confidence !== undefined || emotional_tone) && <Divider />}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Sentiment by Section
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(sentiment_by_section).map(([section, sentimentData]: [string, any]) => (
                    <Box
                      key={section}
                      sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}
                    >
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        {section}
                      </Typography>
                      {sentimentData.sentiment && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          {getSentimentIcon(sentimentData.sentiment)}
                          <Chip
                            label={sentimentData.sentiment}
                            size="small"
                            color={getSentimentColor(sentimentData.sentiment)}
                            variant="outlined"
                          />
                          {sentimentData.score !== undefined && (
                            <Typography variant="caption" color="text.secondary">
                              ({sentimentData.score >= 0 ? '+' : ''}{sentimentData.score.toFixed(2)})
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
