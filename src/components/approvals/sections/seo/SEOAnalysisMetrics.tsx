'use client'

import { Card, CardContent, Typography, Stack } from '@mui/material'
import { KeyMetricsRow } from './KeyMetricsRow'
import { ScoreBars } from './ScoreBars'
import { KeywordDensityLegacy } from './KeywordDensityLegacy'
import { LongTailKeywords } from './LongTailKeywords'
import { KeywordDifficultyScores } from './KeywordDifficultyScores'
import { KeywordDensityAnalysis } from './KeywordDensityAnalysis'
import { PrimaryKeywordsMetadata } from './PrimaryKeywordsMetadata'
import { KeywordClusters } from './KeywordClusters'
import { SearchVolumeSummary } from './SearchVolumeSummary'
import { OptimizationRecommendations } from './OptimizationRecommendations'

interface SEOAnalysisMetricsProps {
  outputData: any
}

export function SEOAnalysisMetrics({ outputData }: SEOAnalysisMetricsProps) {
  if (!outputData) {
    return null
  }
  
  const searchIntent = outputData.search_intent
  const keywordDifficulty = outputData.keyword_difficulty
  const relevanceScore = outputData.relevance_score
  const confidenceScore = outputData.confidence_score
  const keywordDensity = outputData.keyword_density || {}
  const primaryKeywords = outputData.primary_keywords || []
  const mainKeyword = outputData.main_keyword
  
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          SEO Analysis Metrics
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <KeyMetricsRow
            searchIntent={searchIntent}
            keywordDifficulty={keywordDifficulty}
            relevanceScore={relevanceScore}
            confidenceScore={confidenceScore}
          />
          
          <ScoreBars
            relevanceScore={relevanceScore}
            confidenceScore={confidenceScore}
          />
          
          <KeywordDensityLegacy
            keywordDensity={keywordDensity}
            primaryKeywords={primaryKeywords}
            mainKeyword={mainKeyword}
          />
          
          <LongTailKeywords keywords={outputData.long_tail_keywords || []} />
          
          {outputData.keyword_difficulty && 
           typeof outputData.keyword_difficulty === 'object' && 
           !Array.isArray(outputData.keyword_difficulty) && 
           Object.keys(outputData.keyword_difficulty).length > 0 && (
            <KeywordDifficultyScores difficultyScores={outputData.keyword_difficulty} />
          )}
          
          <KeywordDensityAnalysis analyses={outputData.keyword_density_analysis || []} />
          
          <PrimaryKeywordsMetadata metadata={outputData.primary_keywords_metadata || []} />
          
          <KeywordClusters clusters={outputData.keyword_clusters || []} />
          
          <SearchVolumeSummary summary={outputData.search_volume_summary || {}} />
          
          <OptimizationRecommendations recommendations={outputData.optimization_recommendations || []} />
        </Stack>
      </CardContent>
    </Card>
  )
}

