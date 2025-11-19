'use client'

import { useState, useEffect, useMemo, useId } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import ArticleIcon from '@mui/icons-material/Article'
import MicIcon from '@mui/icons-material/Mic'
import CampaignIcon from '@mui/icons-material/Campaign'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PersonIcon from '@mui/icons-material/Person'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useSourceContent, useContentSources } from '@/hooks/useApi'
import type { ContentItem } from '@/types/api'

interface ContentSelectorProps {
  onContentSelect: (content: ContentItem) => void
  selectedContent?: ContentItem
}

export function ContentSelector({ onContentSelect, selectedContent }: ContentSelectorProps) {
  // Fetch available content sources
  const { data: sourcesData } = useContentSources()
  const sources = useMemo(() => sourcesData?.data?.sources || [], [sourcesData?.data?.sources])
  
  const [selectedSource, setSelectedSource] = useState<string>('all')
  const [initialized, setInitialized] = useState(false)
  const selectId = useId()
  
  // Set the default source when sources are loaded
  useEffect(() => {
    if (sources.length > 0 && !initialized) {
      // First, try to find an enabled and healthy source
      const enabledHealthySource = sources.find(
        (source) => source.metadata?.enabled !== false && source.healthy
      )
      if (enabledHealthySource) {
        setSelectedSource(enabledHealthySource.name)
      } else {
        // Fall back to "all" to fetch from all sources
        setSelectedSource('all')
      }
      setInitialized(true)
    }
  }, [sources, initialized])
  
  // Fetch content from the selected source
  const { data: contentData, isLoading, error } = useSourceContent(selectedSource, 20)

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'transcript':
        return <MicIcon fontSize="small" />
      case 'blog_post':
        return <ArticleIcon fontSize="small" />
      case 'release_notes':
        return <CampaignIcon fontSize="small" />
      default:
        return <ArticleIcon fontSize="small" />
    }
  }

  const getContentTypeColor = (type: string): 'primary' | 'success' | 'secondary' | 'default' => {
    switch (type) {
      case 'transcript':
        return 'primary'
      case 'blog_post':
        return 'success'
      case 'release_notes':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading content...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          Failed to load content
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Please try again later
        </Typography>
      </Box>
    )
  }

  const contentItems = contentData?.data?.content_items || []

  return (
    <Box>
      {/* Source selector */}
      {sources.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel id={`${selectId}-label`}>Content Source</InputLabel>
            <Select
              labelId={`${selectId}-label`}
              id={selectId}
              value={selectedSource}
              label="Content Source"
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              <MenuItem value="all">All Sources</MenuItem>
              {sources.map((source) => (
                <MenuItem key={source.name} value={source.name}>
                  {source.name} {source.healthy ? '✓' : '✗'} {source.metadata?.enabled === false ? '(disabled)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
      
      {contentItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            No content available
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Upload some content to get started
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 480, overflowY: 'auto' }}>
          {contentItems.map((item: ContentItem) => {
            const icon = getContentTypeIcon(item.metadata?.type || 'blog_post')
            const isSelected = selectedContent?.id === item.id
            
            return (
              <Paper
                key={item.id}
                elevation={0}
                onClick={() => onContentSelect(item)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  border: 2,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.50' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: isSelected ? 'primary.main' : 'primary.light',
                    bgcolor: isSelected ? 'primary.50' : 'action.hover',
                    boxShadow: 1,
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                    {icon}
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ fontWeight: 600 }} 
                        noWrap
                      >
                        {item.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={(item.metadata?.type || 'blog post').replace('_', ' ')}
                          color={getContentTypeColor(item.metadata?.type || 'blog_post')}
                          size="small"
                          sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.7rem' }}
                        />
                        {isSelected && (
                          <CheckCircleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        )}
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: 1,
                      }}
                    >
                      {item.snippet || item.content?.substring(0, 150) + '...'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">
                          {item.metadata?.author || 'Unknown'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(item.created_at)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.content?.length || 0} chars
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
