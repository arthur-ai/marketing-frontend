'use client'

import { Box, Typography, LinearProgress, Chip, Grid, Card, CardContent } from '@mui/material'
import { TrendingUp, Assessment } from '@mui/icons-material'

interface PlatformQualityScoresProps {
  platform?: string
  qualityScores?: {
    linkedin_score?: number
    hackernews_score?: number
    email_score?: number
    engagement_score?: number
    confidence_score?: number
  }
  stepResults?: Record<string, unknown>
}

export function PlatformQualityScores({ 
  platform, 
  qualityScores,
  stepResults 
}: PlatformQualityScoresProps) {
  // Extract quality scores from step results if not provided directly
  let scores = qualityScores
  if (!scores && stepResults?.social_media_post_generation) {
    const postResult = stepResults.social_media_post_generation as {
      linkedin_score?: number
      hackernews_score?: number
      email_score?: number
      engagement_score?: number
      confidence_score?: number
    }
    scores = postResult
  }

  if (!scores || !platform) return null

  // Get platform-specific score
  const getPlatformScore = () => {
    if (platform === 'linkedin') return scores?.linkedin_score
    if (platform === 'hackernews') return scores?.hackernews_score
    if (platform === 'email') return scores?.email_score
    return null
  }

  const platformScore = getPlatformScore()
  const engagementScore = scores?.engagement_score
  const confidenceScore = scores?.confidence_score

  if (!platformScore && !engagementScore && !confidenceScore) return null

  const getScoreColor = (score?: number) => {
    if (!score) return 'default'
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const getScoreLabel = (score?: number) => {
    if (!score) return 'N/A'
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {platformScore !== undefined && (
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)} Quality
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {platformScore.toFixed(0)}
                    </Typography>
                    <Chip 
                      label={getScoreLabel(platformScore)} 
                      size="small" 
                      color={getScoreColor(platformScore)}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={platformScore} 
                    color={getScoreColor(platformScore)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Platform-specific quality assessment
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {engagementScore !== undefined && (
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Engagement Potential
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {engagementScore.toFixed(0)}
                    </Typography>
                    <Chip 
                      label={getScoreLabel(engagementScore)} 
                      size="small" 
                      color={getScoreColor(engagementScore)}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={engagementScore} 
                    color={getScoreColor(engagementScore)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Predicted engagement potential
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {confidenceScore !== undefined && (
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Assessment color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Confidence
                  </Typography>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {(confidenceScore * 100).toFixed(0)}%
                    </Typography>
                    <Chip 
                      label={getScoreLabel(confidenceScore * 100)} 
                      size="small" 
                      color={getScoreColor(confidenceScore * 100)}
                    />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={confidenceScore * 100} 
                    color={getScoreColor(confidenceScore * 100)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Model confidence in output quality
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

