'use client'

import { Box, Typography, Card, CardContent, Grid, Button, Chip, RadioGroup, FormControlLabel, Radio } from '@mui/material'
import { useState } from 'react'
import { PlatformQualityScores } from '@/components/results/platform-quality-scores'
import ReactMarkdown from 'react-markdown'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

interface ContentVariation {
  variation_id: string
  content: string
  subject_line?: string
  hashtags?: string[]
  call_to_action?: string
  confidence_score?: number
  engagement_score?: number
  linkedin_score?: number
  hackernews_score?: number
  email_score?: number
  temperature_used?: number
}

interface ContentVariationsProps {
  variations: ContentVariation[]
  platform: string
  onSelectVariation?: (variationId: string) => void
  selectedVariationId?: string
}

export function ContentVariations({ 
  variations, 
  platform, 
  onSelectVariation,
  selectedVariationId 
}: ContentVariationsProps) {
  const [localSelected, setLocalSelected] = useState<string>(selectedVariationId || variations[0]?.variation_id || '')

  const handleSelect = (variationId: string) => {
    setLocalSelected(variationId)
    if (onSelectVariation) {
      onSelectVariation(variationId)
    }
  }

  const selectedVariation = variations.find(v => v.variation_id === localSelected) || variations[0]

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Content Variations ({variations.length} versions)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Compare different versions and select the best one for your needs
      </Typography>

      {/* Variation Selector */}
      <RadioGroup
        value={localSelected}
        onChange={(e) => handleSelect(e.target.value)}
        sx={{ mb: 3 }}
      >
        <Grid container spacing={2}>
          {variations.map((variation, index) => (
            <Grid item xs={12} md={6} key={variation.variation_id}>
              <Card 
                variant={localSelected === variation.variation_id ? "outlined" : "outlined"}
                sx={{
                  border: localSelected === variation.variation_id ? 2 : 1,
                  borderColor: localSelected === variation.variation_id ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.light',
                  },
                }}
                onClick={() => handleSelect(variation.variation_id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <FormControlLabel
                      value={variation.variation_id}
                      control={<Radio />}
                      label={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {variation.variation_id === 'base' ? 'Base Version' : `Variation ${index + 1}`}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                    {localSelected === variation.variation_id && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Selected"
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Quality Scores */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {variation.confidence_score !== undefined && (
                      <Chip
                        label={`Confidence: ${(variation.confidence_score * 100).toFixed(0)}%`}
                        size="small"
                        color={variation.confidence_score > 0.8 ? 'success' : variation.confidence_score > 0.6 ? 'warning' : 'default'}
                      />
                    )}
                    {variation.engagement_score !== undefined && (
                      <Chip
                        label={`Engagement: ${variation.engagement_score.toFixed(0)}`}
                        size="small"
                        color={variation.engagement_score > 80 ? 'success' : variation.engagement_score > 60 ? 'warning' : 'default'}
                      />
                    )}
                    {variation.temperature_used && (
                      <Chip
                        label={`Temp: ${variation.temperature_used}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Content Preview */}
                  <Box
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 1.5,
                      bgcolor: 'background.paper',
                      maxHeight: '200px',
                      overflow: 'auto',
                      fontSize: '0.875rem',
                    }}
                  >
                    <ReactMarkdown>{variation.content.substring(0, 300)}{variation.content.length > 300 ? '...' : ''}</ReactMarkdown>
                  </Box>

                  {/* Character Count */}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {variation.content.length} characters
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>

      {/* Selected Variation Details */}
      {selectedVariation && (
        <Card variant="outlined" sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {selectedVariation.variation_id === 'base' ? 'Base Version' : `Selected Variation`} - Full Content
            </Typography>

            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                bgcolor: 'background.paper',
                mb: 2,
              }}
            >
              <ReactMarkdown>{selectedVariation.content}</ReactMarkdown>
            </Box>

            {selectedVariation.subject_line && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Subject Line:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {selectedVariation.subject_line}
                </Typography>
              </Box>
            )}

            {selectedVariation.hashtags && selectedVariation.hashtags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Hashtags:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {selectedVariation.hashtags.map((tag, idx) => (
                    <Chip key={idx} label={`#${tag}`} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {selectedVariation.call_to_action && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Call to Action:
                </Typography>
                <Typography variant="body2">
                  {selectedVariation.call_to_action}
                </Typography>
              </Box>
            )}

            {/* Quality Scores */}
            <Box sx={{ mt: 2 }}>
              <PlatformQualityScores
                platform={platform}
                qualityScores={{
                  confidence_score: selectedVariation.confidence_score,
                  engagement_score: selectedVariation.engagement_score,
                  linkedin_score: selectedVariation.linkedin_score,
                  hackernews_score: selectedVariation.hackernews_score,
                  email_score: selectedVariation.email_score,
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

