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
  Autocomplete,
} from '@mui/material'
import {
  Person,
  AccessTime,
  Description,
  Tag,
  Category,
  Add,
  Delete,
} from '@mui/icons-material'

interface BlogPostDetailsSectionProps {
  data: {
    author?: string
    category?: string
    tags?: string[]
    word_count?: number
    reading_time?: number
    content_summary?: string
    snippet?: string
    detected_format?: string
    detected_language?: string
  }
  isEditing?: boolean
  onUpdate?: (field: string, value: any) => void
}

export function BlogPostDetailsSection({ 
  data, 
  isEditing = false,
  onUpdate 
}: BlogPostDetailsSectionProps) {
  const {
    author,
    category,
    tags = [],
    word_count,
    reading_time,
    content_summary,
    snippet,
    detected_format,
    detected_language,
  } = data

  const [newTag, setNewTag] = useState('')
  const [authorInput, setAuthorInput] = useState(author || '')
  const [categoryInput, setCategoryInput] = useState(category || '')

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && onUpdate) {
      onUpdate('tags', [...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (onUpdate) {
      onUpdate('tags', tags.filter(t => t !== tagToRemove))
    }
  }

  const handleAuthorChange = (value: string) => {
    setAuthorInput(value)
    if (onUpdate) {
      onUpdate('author', value || null)
    }
  }

  const handleCategoryChange = (value: string) => {
    setCategoryInput(value)
    if (onUpdate) {
      onUpdate('category', value || null)
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Blog Post Details
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Author */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Person fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                Author
              </Typography>
            </Box>
            {isEditing ? (
              <TextField
                size="small"
                fullWidth
                value={authorInput}
                onChange={(e) => handleAuthorChange(e.target.value)}
                placeholder="Enter author name"
              />
            ) : (
              author ? (
                <Typography variant="body1">{author}</Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not specified
                </Typography>
              )
            )}
          </Box>

          <Divider />

          {/* Category */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Category fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                Category
              </Typography>
            </Box>
            {isEditing ? (
              <Autocomplete
                freeSolo
                size="small"
                options={['Technology', 'Business', 'Marketing', 'Design', 'Development', 'Lifestyle', 'News', 'Opinion', 'Tutorial', 'Guide']}
                value={categoryInput}
                onChange={(_, newValue) => handleCategoryChange(newValue || '')}
                onInputChange={(_, newInputValue) => handleCategoryChange(newInputValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Enter category"
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
              category ? (
                <Chip
                  label={category}
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

          <Divider />

          {/* Tags */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Tag fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight="bold">
                Tags ({tags.length})
              </Typography>
            </Box>
            {isEditing ? (
              <Stack spacing={1}>
                {tags.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onDelete={() => handleRemoveTag(tag)}
                        deleteIcon={<Delete fontSize="small" />}
                      />
                    ))}
                  </Stack>
                )}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag()
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || tags.includes(newTag.trim())}
                    color="primary"
                  >
                    <Add />
                  </IconButton>
                </Box>
              </Stack>
            ) : (
              <>
                {tags.length > 0 ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags found
                  </Typography>
                )}
              </>
            )}
          </Box>

          <Divider />

          {/* Word Count & Reading Time */}
          <Box>
            <Stack direction="row" spacing={3}>
              {word_count !== undefined && word_count !== null && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Word Count
                  </Typography>
                  <Typography variant="body1">
                    {word_count.toLocaleString()} words
                  </Typography>
                </Box>
              )}
              {reading_time !== undefined && reading_time !== null && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Reading Time
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {reading_time} {reading_time === 1 ? 'minute' : 'minutes'}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Detected Format */}
          {detected_format && (
            <>
              <Divider />
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
            </>
          )}

          {/* Detected Language */}
          {detected_language && (
            <>
              <Divider />
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
            </>
          )}

          {/* Snippet */}
          {snippet && (
            <>
              <Divider />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Description fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Snippet
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
                    }}
                  >
                    {snippet}
                  </Typography>
                </Box>
              </Box>
            </>
          )}

          {/* Content Summary */}
          {content_summary && (
            <>
              <Divider />
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
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

