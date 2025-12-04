'use client'

import { Box, Typography, Card, CardContent, Tabs, Tab, Grid, Chip } from '@mui/material'
import { useState } from 'react'
import { getPlatformConfig } from '@/lib/platform-config'
import { PlatformQualityScores } from '@/components/results/platform-quality-scores'
import ReactMarkdown from 'react-markdown'

interface MultiPlatformResultsProps {
  results: {
    platforms: string[]
    results_by_platform: Record<string, {
      platform: string
      step_results: Record<string, unknown>
      final_content: string
      quality_warnings: string[]
      platform_quality_scores?: Record<string, number>
    }>
    shared_steps?: {
      seo_keywords?: unknown
      social_media_marketing_brief?: unknown
    }
  }
}

export function MultiPlatformResults({ results }: MultiPlatformResultsProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(results.platforms[0] || '')
  const [viewTab, setViewTab] = useState(0) // 0 = Preview, 1 = Comparison

  const platformResult = results.results_by_platform[selectedPlatform]

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Multi-Platform Results ({results.platforms.length} platforms)
      </Typography>

      {/* Platform Tabs */}
      <Tabs 
        value={selectedPlatform} 
        onChange={(_, newValue) => setSelectedPlatform(newValue)}
        sx={{ mb: 2 }}
      >
        {results.platforms.map((platform) => {
          const config = getPlatformConfig(platform)
          return (
            <Tab
              key={platform}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{config?.name || platform}</span>
                  {results.results_by_platform[platform]?.quality_warnings?.length > 0 && (
                    <Chip label="!" size="small" color="warning" />
                  )}
                </Box>
              }
              value={platform}
            />
          )
        })}
      </Tabs>

      {/* View Tabs */}
      <Tabs value={viewTab} onChange={(_, newValue) => setViewTab(newValue)} sx={{ mb: 2 }}>
        <Tab label="Preview" />
        <Tab label="Side-by-Side Comparison" />
      </Tabs>

      {viewTab === 0 ? (
        // Single Platform Preview
        platformResult && (
          <Box>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {getPlatformConfig(selectedPlatform)?.name || selectedPlatform} Post
                </Typography>
                
                {platformResult.quality_warnings.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {platformResult.quality_warnings.map((warning, idx) => (
                      <Chip
                        key={idx}
                        label={warning}
                        color="warning"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}

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
                  <ReactMarkdown>{platformResult.final_content}</ReactMarkdown>
                </Box>

                {platformResult.platform_quality_scores && (
                  <PlatformQualityScores
                    platform={selectedPlatform}
                    qualityScores={platformResult.platform_quality_scores}
                  />
                )}
              </CardContent>
            </Card>
          </Box>
        )
      ) : (
        // Side-by-Side Comparison
        <Grid container spacing={2}>
          {results.platforms.map((platform) => {
            const result = results.results_by_platform[platform]
            const config = getPlatformConfig(platform)
            return (
              <Grid item xs={12} md={6} key={platform}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {config?.name || platform}
                    </Typography>
                    <Chip
                      label={`${result.final_content.length} chars`}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Box
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        bgcolor: 'background.paper',
                        maxHeight: '400px',
                        overflow: 'auto',
                      }}
                    >
                      <ReactMarkdown>{result.final_content}</ReactMarkdown>
                    </Box>
                    {result.platform_quality_scores && (
                      <Box sx={{ mt: 2 }}>
                        <PlatformQualityScores
                          platform={platform}
                          qualityScores={result.platform_quality_scores}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}

