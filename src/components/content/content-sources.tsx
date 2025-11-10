'use client'

import { useContentSources } from '@/hooks/useApi'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Grid from '@mui/material/Grid'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import StorageIcon from '@mui/icons-material/Storage'
import ArticleIcon from '@mui/icons-material/Article'
import PublicIcon from '@mui/icons-material/Public'

const getSourceIcon = (type: string) => {
  switch (type) {
    case 'file':
      return <ArticleIcon sx={{ fontSize: 20 }} />
    case 'api':
      return <PublicIcon sx={{ fontSize: 20 }} />
    case 'database':
      return <StorageIcon sx={{ fontSize: 20 }} />
    default:
      return <ArticleIcon sx={{ fontSize: 20 }} />
  }
}

const getStatusIcon = (healthy: boolean) => {
  if (healthy) {
    return <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
  }
  return <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
}

const getStatusColor = (healthy: boolean): 'success' | 'error' => {
  return healthy ? 'success' : 'error'
}

export function ContentSources() {
  const { data, isLoading, error } = useContentSources()

  if (isLoading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 3 }, (_, i) => `loading-${i}`).map((key) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
            <Card elevation={2}>
              <CardContent sx={{ p: 3 }}>
                <Skeleton variant="text" width="70%" height={32} />
                <Skeleton variant="text" width="50%" height={24} sx={{ mt: 1 }} />
                <Skeleton variant="rectangular" height={80} sx={{ mt: 2, borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  if (error) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <CancelIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load content sources
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (!data?.data?.sources?.length) {
    return (
      <Card elevation={2}>
        <CardContent sx={{ p: 6, textAlign: 'center' }}>
          <StorageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
            No content sources configured
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Check your configuration or add new sources.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Grid container spacing={3}>
      {data.data.sources.map((source: { name: string; type: string; healthy: boolean; status: string; metadata: { enabled: boolean; path: string; priority: number }; last_check?: string }) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={source.name}>
          <Card 
            elevation={2}
            sx={{
              height: '100%',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {getSourceIcon(source.type)}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {source.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getStatusIcon(source.healthy)}
                  <Chip
                    label={source.status}
                    color={getStatusColor(source.healthy)}
                    size="small"
                    sx={{ height: 22, fontWeight: 600 }}
                  />
                </Box>
              </Box>

              {/* Metadata */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Type: {source.type}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Priority: {source.metadata.priority}
                </Typography>
              </Box>

              {/* Details */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Enabled:
                  </Typography>
                  <Chip
                    label={source.metadata.enabled ? 'Yes' : 'No'}
                    color={source.metadata.enabled ? 'success' : 'error'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Path:
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      color: 'text.disabled',
                      maxWidth: '60%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {source.metadata.path}
                  </Typography>
                </Box>
                
                {source.last_check && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Check:
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(source.last_check).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
