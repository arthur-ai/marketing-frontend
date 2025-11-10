'use client'

import { Box, Typography, Paper, Chip } from '@mui/material'

interface KeywordCluster {
  cluster_name: string
  topic_theme?: string
  primary_keyword?: string
  keywords?: string[]
}

interface KeywordClustersProps {
  clusters: KeywordCluster[]
}

export function KeywordClusters({ clusters }: KeywordClustersProps) {
  if (!clusters || clusters.length === 0) {
    return null
  }
  
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
        Keyword Clusters ({clusters.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {clusters.map((cluster, index) => (
          <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {cluster.cluster_name}
            </Typography>
            {cluster.topic_theme && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Theme: {cluster.topic_theme}
              </Typography>
            )}
            {cluster.primary_keyword && (
              <Typography variant="caption" color="primary.main" display="block" sx={{ mb: 1, fontWeight: 500 }}>
                Primary: {cluster.primary_keyword}
              </Typography>
            )}
            {cluster.keywords && cluster.keywords.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {cluster.keywords.map((keyword: string) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

