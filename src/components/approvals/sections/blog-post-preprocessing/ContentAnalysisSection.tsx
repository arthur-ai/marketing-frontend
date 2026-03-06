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
  LinearProgress,
  TextField,
  IconButton,
  Slider,
} from '@mui/material'
import {
  Psychology,
  Article,
  People,
  Topic,
  Add,
  Delete,
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
  isEditing?: boolean
  onUpdate?: (field: string, value: any) => void
}

export function ContentAnalysisSection({ data, isEditing = false, onUpdate }: ContentAnalysisSectionProps) {
  const {
    readability_score,
    completeness_score,
    content_type,
    target_audience,
    key_topics = [],
    potential_keywords = [],
    headings = [],
  } = data

  const [newTopic, setNewTopic] = useState('')
  const [newKeyword, setNewKeyword] = useState('')
  const [newHeading, setNewHeading] = useState('')

  const hasData = readability_score !== undefined ||
    completeness_score !== undefined ||
    content_type ||
    target_audience ||
    key_topics.length > 0 ||
    potential_keywords.length > 0 ||
    headings.length > 0

  if (!hasData && !isEditing) {
    return null
  }

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return 'default'
    if (score >= 70) return 'success'
    if (score >= 50) return 'warning'
    return 'error'
  }

  const handleAddItem = (field: string, items: string[], newItem: string, clearFn: () => void) => {
    const trimmed = newItem.trim()
    if (trimmed && !items.includes(trimmed) && onUpdate) {
      onUpdate(field, [...items, trimmed])
      clearFn()
    }
  }

  const handleRemoveItem = (field: string, items: string[], item: string) => {
    if (onUpdate) onUpdate(field, items.filter(i => i !== item))
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
              {isEditing ? (
                <Slider
                  value={readability_score}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(_, val) => onUpdate?.('readability_score', val)}
                  color={getScoreColor(readability_score) as any}
                  size="small"
                />
              ) : (
                <>
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
                </>
              )}
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
                {isEditing ? (
                  <Slider
                    value={completeness_score}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={(_, val) => onUpdate?.('completeness_score', val)}
                    color={getScoreColor(completeness_score) as any}
                    size="small"
                  />
                ) : (
                  <>
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
                  </>
                )}
              </Box>
            </>
          )}

          {/* Content Type */}
          {(content_type || isEditing) && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Article fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Content Type
                  </Typography>
                </Box>
                {isEditing ? (
                  <TextField
                    size="small"
                    fullWidth
                    value={content_type || ''}
                    onChange={(e) => onUpdate?.('content_type', e.target.value)}
                    placeholder="e.g. tutorial, opinion, news"
                  />
                ) : (
                  <Chip label={content_type} size="small" color="secondary" variant="outlined" />
                )}
              </Box>
            </>
          )}

          {/* Target Audience */}
          {(target_audience || isEditing) && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <People fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Target Audience
                  </Typography>
                </Box>
                {isEditing ? (
                  <TextField
                    size="small"
                    fullWidth
                    value={target_audience || ''}
                    onChange={(e) => onUpdate?.('target_audience', e.target.value)}
                    placeholder="e.g. developers, marketers"
                  />
                ) : (
                  <Chip label={target_audience} size="small" color="info" variant="outlined" />
                )}
              </Box>
            </>
          )}

          {/* Key Topics */}
          {(key_topics.length > 0 || isEditing) && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type || target_audience) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Topic fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Key Topics ({key_topics.length})
                  </Typography>
                </Box>
                {isEditing ? (
                  <Stack spacing={1}>
                    {key_topics.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {key_topics.map((topic, index) => (
                          <Chip
                            key={index}
                            label={topic}
                            size="small"
                            color="info"
                            variant="outlined"
                            onDelete={() => handleRemoveItem('key_topics', key_topics, topic)}
                            deleteIcon={<Delete fontSize="small" />}
                          />
                        ))}
                      </Stack>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add topic"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem('key_topics', key_topics, newTopic, () => setNewTopic(''))
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAddItem('key_topics', key_topics, newTopic, () => setNewTopic(''))}
                        disabled={!newTopic.trim() || key_topics.includes(newTopic.trim())}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {key_topics.map((topic, index) => (
                      <Chip key={index} label={topic} size="small" color="info" variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* Potential Keywords */}
          {(potential_keywords.length > 0 || isEditing) && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type || target_audience || key_topics.length > 0) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Topic fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Potential Keywords ({potential_keywords.length})
                  </Typography>
                </Box>
                {isEditing ? (
                  <Stack spacing={1}>
                    {potential_keywords.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {potential_keywords.map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onDelete={() => handleRemoveItem('potential_keywords', potential_keywords, keyword)}
                            deleteIcon={<Delete fontSize="small" />}
                          />
                        ))}
                      </Stack>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add keyword"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem('potential_keywords', potential_keywords, newKeyword, () => setNewKeyword(''))
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAddItem('potential_keywords', potential_keywords, newKeyword, () => setNewKeyword(''))}
                        disabled={!newKeyword.trim() || potential_keywords.includes(newKeyword.trim())}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {potential_keywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" color="primary" variant="outlined" />
                    ))}
                  </Stack>
                )}
              </Box>
            </>
          )}

          {/* Headings */}
          {(headings.length > 0 || isEditing) && (
            <>
              {(readability_score !== undefined || completeness_score !== undefined || content_type || target_audience || key_topics.length > 0 || potential_keywords.length > 0) && <Divider />}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Article fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Headings ({headings.length})
                  </Typography>
                </Box>
                {isEditing ? (
                  <Stack spacing={1}>
                    {headings.map((heading, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          sx={{ flex: 1, p: 1, bgcolor: 'grey.50', borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.875rem' }}
                        >
                          {heading}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveItem('headings', headings, heading)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add heading"
                        value={newHeading}
                        onChange={(e) => setNewHeading(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddItem('headings', headings, newHeading, () => setNewHeading(''))
                        }}
                        sx={{ flex: 1 }}
                      />
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAddItem('headings', headings, newHeading, () => setNewHeading(''))}
                        disabled={!newHeading.trim()}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Stack>
                ) : (
                  <Stack spacing={0.5}>
                    {headings.map((heading, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 0.5, fontFamily: 'monospace', fontSize: '0.875rem' }}
                      >
                        {heading}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
