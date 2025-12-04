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
} from '@mui/material'
import {
  Psychology,
  School,
  Article,
  People,
  Topic,
} from '@mui/icons-material'

interface ContentAnalysisSectionProps {
  data: {
    readability_score?: number
    completeness_score?: number
    content_type?: string
    target_audience?: string
    key_topics?: string[]
    potential_keywords?: string[]
    headings?: string[]
  }
}

export function ContentAnalysisSection({ data }: ContentAnalysisSectionProps) {
  const {
    readability_score,
    completeness_score,
    content_type,
    target_audience,
    key_topics = [],
    potential_keywords = [],
    headings = [],
  } = data

  const hasData = readability_score !== undefined || 
    completeness_score !== undefined || 
    content_type || 
    target_audience || 
    key_topics.length > 0 || 
    potential_keywords.length > 0 ||
    headings.length > 0

  if (!hasData) {
    return null
  }

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'default'
    if (score >= 70) return 'success'
    if (score >= 50) return 'warning'
    return 'error'
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Content Analysis
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Readability Score */}
          {readability_score !== undefined && readability_score !== null && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Readability Score
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight="bold">
                  {readability_score.toFixed(1)}/100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={readability_score}
                color={getScoreColor(readability_score)}
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {readability_score >= 70
                  ? 'Highly readable'
                  : readability_score >= 50
                  ? 'Moderately readable'
                  : 'Needs improvement'}
              </Typography>
            </Box>
          )}

          {/* Completeness Score */}
          {completeness_score !== undefined && completeness_score !== null && (
            <>
              {readability_score !== undefined && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Article fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Completeness Score
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {completeness_score.toFixed(1)}/100
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={completeness_score}
                  color={getScoreColor(completeness_score)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {completeness_score >= 70
                    ? 'Well structured'
                    : completeness_score >= 50
                    ? 'Moderately complete'
                    : 'Needs more content'}
                </Typography>
              </Box>
            </>
          )}

          {/* Content Type */}
          {content_type && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Article fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Content Type
                  </Typography>
                </Box>
                <Chip
                  label={content_type}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              </Box>
            </>
          )}

          {/* Target Audience */}
          {target_audience && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <People fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Target Audience
                  </Typography>
                </Box>
                <Chip
                  label={target_audience}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Box>
            </>
          )}

          {/* Key Topics */}
          {key_topics.length > 0 && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type || target_audience) && <Divider />}
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

          {/* Potential Keywords */}
          {potential_keywords.length > 0 && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type || target_audience || key_topics.length > 0) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Topic fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Potential Keywords ({potential_keywords.length})
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {potential_keywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {/* Headings */}
          {headings.length > 0 && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type || target_audience || key_topics.length > 0 || potential_keywords.length > 0) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Article fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Headings ({headings.length})
                  </Typography>
                </Box>
                <Stack spacing={0.5}>
                  {headings.map((heading, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      {heading}
                    </Typography>
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

