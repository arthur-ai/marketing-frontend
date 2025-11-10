'use client'

import { useSourceContent } from '@/hooks/useApi'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Link from '@mui/material/Link'
import Divider from '@mui/material/Divider'
import ArticleIcon from '@mui/icons-material/Article'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import StarIcon from '@mui/icons-material/Star'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import BarChartIcon from '@mui/icons-material/BarChart'
import type { ContentItem } from '@/types/api'

interface ContentListProps {
  sourceName: string
  limit?: number
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString()
  } catch {
    return 'Unknown'
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function ContentList({ sourceName, limit = 10 }: ContentListProps) {
  const { data, isLoading, error } = useSourceContent(sourceName, limit)

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {Array.from({ length: 3 }, (_, i) => `loading-${i}`).map((key) => (
          <Card key={key} elevation={2}>
            <CardContent sx={{ p: 3 }}>
              <Skeleton variant="text" width="70%" height={32} />
              <Skeleton variant="text" width="50%" height={24} sx={{ mt: 1 }} />
              <Skeleton variant="rectangular" height={60} sx={{ mt: 2, borderRadius: 1 }} />
            </CardContent>
          </Card>
        ))}
      </Box>
    )
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load content from {sourceName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (!data?.data?.content_items?.length) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
            No content found in {sourceName}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Try uploading some content or check your source configuration.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  // Fields to exclude from metadata display
  const excludedFields = ['file_path', 'file_name', 'file_size', 'type']
  
  const getMetricChipColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {data.data.content_items.map((item: ContentItem) => {
        const metadata = item.metadata || {}
        const seoScore = metadata.seo_score
        const engagementScore = metadata.engagement_score
        const featured = metadata.featured
        
        // Filter out technical metadata
        const displayMetadata = Object.entries(metadata).filter(
          ([key]) => !excludedFields.includes(key) && 
                     key !== 'seo_score' && 
                     key !== 'engagement_score' && 
                     key !== 'featured'
        )
        
        return (
          <Card 
            key={item.id} 
            elevation={2}
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    {featured && (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 16 }} />}
                        label="Featured"
                        color="warning"
                        size="small"
                        sx={{ height: 24, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.created_at)}
                      </Typography>
                    </Box>
                    
                    <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />
                    
                    <Chip
                      label={metadata?.type || 'content'}
                      variant="outlined"
                      size="small"
                      sx={{ height: 22, textTransform: 'capitalize' }}
                    />
                    
                    {seoScore !== undefined && (
                      <Chip
                        icon={<BarChartIcon sx={{ fontSize: 14 }} />}
                        label={`SEO: ${seoScore}`}
                        color={getMetricChipColor(seoScore)}
                        size="small"
                        sx={{ height: 22, fontWeight: 600 }}
                      />
                    )}
                    
                    {engagementScore !== undefined && (
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                        label={`Engagement: ${engagementScore}`}
                        color={getMetricChipColor(engagementScore)}
                        size="small"
                        sx={{ height: 22, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Box>
                
                {item.source_url && (
                  <Link
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                  >
                    <OpenInNewIcon sx={{ fontSize: 20 }} />
                  </Link>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                {truncateText(item.snippet || item.content, 150)}
              </Typography>
              
              {displayMetadata.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {displayMetadata.map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key.replace(/_/g, ' ')}: ${String(value)}`}
                      size="small"
                      variant="filled"
                      sx={{ 
                        height: 24, 
                        fontSize: '0.7rem',
                        bgcolor: 'grey.200',
                        textTransform: 'capitalize',
                      }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}
