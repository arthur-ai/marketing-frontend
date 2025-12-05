'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import ReactMarkdown from 'react-markdown'
import { SyntaxHighlighter, vs2015 } from '@/lib/syntax-highlighter'
import FileTextIcon from '@mui/icons-material/Description'
import BarChartIcon from '@mui/icons-material/BarChart'
import TargetIcon from '@mui/icons-material/TrackChanges'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CodeIcon from '@mui/icons-material/Code'
import VisibilityIcon from '@mui/icons-material/Visibility'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CancelIcon from '@mui/icons-material/Cancel'
import type { SEOKeywordsResult, KeywordDensityAnalysis, KeywordCluster } from '@/types/api'
import { KeywordMetadataDisplay } from './keyword-metadata-display'


interface StepApproval {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  reviewed_by?: string
  reviewed_at?: string
}

interface ResultViewerProps {
  result: Record<string, unknown>
  stepApprovals?: Record<string, StepApproval>
  onViewApproval?: (approvalId: string) => void
}

interface StepInfo {
  step_name: string
  step_number?: number
  status: string
  execution_time?: number
  tokens_used?: number
  error_message?: string | null
  execution_context_id?: string
}

export function ResultViewer({ result, stepApprovals, onViewApproval }: ResultViewerProps) {
  const [tabValue, setTabValue] = useState(0)
  
  const pipelineResult = (result.pipeline_result as Record<string, unknown>) || {}
  const stepResults = (pipelineResult.step_results as Record<string, unknown>) || {}
  const metadata = (pipelineResult.metadata as Record<string, unknown>) || {}
  
  // Extract content for Preview tab
  const contentFormatting = stepResults.content_formatting as Record<string, unknown> | undefined
  const articleGeneration = stepResults.article_generation as Record<string, unknown> | undefined
  const contentHtml = (pipelineResult.final_content as string) || (contentFormatting?.formatted_html as string)
  const contentMarkdown = articleGeneration?.article_content as string | undefined
  
  // Extract SEO data
  const seoKeywordsData = (stepResults.seo_keywords as SEOKeywordsResult) || {} as SEOKeywordsResult
  const seoOptimizationData = (stepResults.seo_optimization as Record<string, unknown>) || {}
  const allKeywords = [
    ...((seoKeywordsData.primary_keywords as string[]) || []),
    ...((seoKeywordsData.secondary_keywords as string[]) || []),
    ...((seoKeywordsData.lsi_keywords as string[]) || [])
  ]
  
  // Extract processing steps from metadata
  const processingSteps = (metadata.step_info as (StepInfo | string)[]) || []
  
  const getApprovalChip = (status: string) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" size="small" sx={{ bgcolor: 'warning.50', color: 'warning.main', border: '1px solid', borderColor: 'warning.300' }} />
      case 'approved':
        return <Chip label="Approved" size="small" sx={{ bgcolor: 'success.50', color: 'success.main', border: '1px solid', borderColor: 'success.300' }} />
      case 'rejected':
        return <Chip label="Rejected" size="small" sx={{ bgcolor: 'error.50', color: 'error.main', border: '1px solid', borderColor: 'error.300' }} />
      case 'modified':
        return <Chip label="Modified" size="small" sx={{ bgcolor: 'info.50', color: 'info.main', border: '1px solid', borderColor: 'info.300' }} />
      default:
        return null
    }
  }
  
  const getApprovalIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <WarningIcon sx={{ fontSize: 18, color: 'warning.main' }} />
      case 'approved':
        return <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'success.main' }} />
      case 'rejected':
        return <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />
      case 'modified':
        return <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'info.main' }} />
      default:
        return <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
    }
  }

  const tabLabels = ['Preview', 'Metadata', 'SEO', 'Steps', 'Raw JSON']
  const tabIcons = [
    <FileTextIcon key="preview" />, 
    <BarChartIcon key="metadata" />, 
    <TargetIcon key="seo" />, 
    <CheckCircleIcon key="steps" />, 
    <CodeIcon key="json" />
  ]

  return (
    <Box>
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {tabLabels.map((label, index) => (
            <Tab 
              key={label}
              label={label}
              icon={tabIcons[index]}
              iconPosition="start"
              sx={{ textTransform: 'none', minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>
      
      {/* Preview Tab */}
      {tabValue === 0 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                Generated Content
              </Typography>
              {(result.validation as string) && (
                <Chip
                  label={result.validation as string}
                  color={(result.validation as string) === 'passed' ? 'success' : 'error'}
                  size="small"
                />
              )}
            </Box>
            {contentHtml ? (
              <Box
                component="div"
                sx={{
                  '& p': { mb: 2 },
                  '& h1, & h2, & h3, & h4': { mt: 2, mb: 1, fontWeight: 600 },
                  '& ul, & ol': { pl: 3, mb: 2 },
                  '& code': { bgcolor: 'grey.100', px: 0.5, py: 0.25, borderRadius: 0.5, fontSize: '0.875rem' },
                  '& hr': { my: 3, borderColor: 'divider' }
                }}
                dangerouslySetInnerHTML={{ __html: contentHtml || '' }}
              />
            ) : contentMarkdown ? (
              <Box
                component="div"
                sx={{
                  '& p': { mb: 2 },
                  '& h1, & h2, & h3, & h4': { mt: 2, mb: 1, fontWeight: 600 },
                  '& ul, & ol': { pl: 3, mb: 2 },
                  '& code': { bgcolor: 'grey.100', px: 0.5, py: 0.25, borderRadius: 0.5, fontSize: '0.875rem' },
                  '& hr': { my: 3, borderColor: 'divider' }
                }}
              >
                <ReactMarkdown>
                  {contentMarkdown}
                </ReactMarkdown>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No content generated
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Metadata Tab */}
      {tabValue === 1 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Content Metadata
            </Typography>
            {Object.keys(metadata).length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                {Object.entries(metadata).map(([key, value]) => {
                  const displayValue = Array.isArray(value) 
                    ? (value as unknown[]).join(', ') 
                    : String(value ?? '')
                  return (
                    <Paper
                      key={key}
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize', display: 'block', mb: 0.5 }}>
                        {key.replace(/_/g, ' ')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {displayValue}
                      </Typography>
                    </Paper>
                  )
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No metadata available
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* SEO Tab */}
      {tabValue === 2 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TargetIcon sx={{ color: 'primary.main' }} />
              SEO Analysis
            </Typography>
            
            {/* Primary Keywords */}
            {((seoKeywordsData.primary_keywords as string[]) || []).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Primary Keywords ({((seoKeywordsData.primary_keywords as string[]) || []).length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {((seoKeywordsData.primary_keywords as string[]) || []).map((keyword: string) => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      sx={{ bgcolor: 'primary.100', color: 'primary.dark', fontWeight: 500 }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Secondary Keywords */}
            {((seoKeywordsData.secondary_keywords as string[]) || []).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Secondary Keywords ({((seoKeywordsData.secondary_keywords as string[]) || []).length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {((seoKeywordsData.secondary_keywords as string[]) || []).map((keyword: string) => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      sx={{ bgcolor: 'secondary.100', color: 'secondary.dark', fontWeight: 500 }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* LSI Keywords */}
            {((seoKeywordsData.lsi_keywords as string[]) || []).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  LSI Keywords ({((seoKeywordsData.lsi_keywords as string[]) || []).length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {((seoKeywordsData.lsi_keywords as string[]) || []).map((keyword: string) => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      sx={{ bgcolor: 'info.100', color: 'info.dark', fontWeight: 500 }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Long-tail Keywords */}
            {((seoKeywordsData.long_tail_keywords as string[]) || []).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Long-tail Keywords ({((seoKeywordsData.long_tail_keywords as string[]) || []).length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {((seoKeywordsData.long_tail_keywords as string[]) || []).map((keyword: string) => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      sx={{ bgcolor: 'success.100', color: 'success.dark', fontWeight: 500 }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Primary Keywords Metadata */}
            {seoKeywordsData.primary_keywords_metadata && seoKeywordsData.primary_keywords_metadata.length > 0 && (
              <KeywordMetadataDisplay 
                metadata={seoKeywordsData.primary_keywords_metadata} 
                title="Primary Keywords Metadata"
              />
            )}
            
            {/* Secondary Keywords Metadata */}
            {seoKeywordsData.secondary_keywords_metadata && seoKeywordsData.secondary_keywords_metadata.length > 0 && (
              <KeywordMetadataDisplay 
                metadata={seoKeywordsData.secondary_keywords_metadata} 
                title="Secondary Keywords Metadata"
              />
            )}
            
            {/* Long-tail Keywords Metadata */}
            {seoKeywordsData.long_tail_keywords_metadata && seoKeywordsData.long_tail_keywords_metadata.length > 0 && (
              <KeywordMetadataDisplay 
                metadata={seoKeywordsData.long_tail_keywords_metadata} 
                title="Long-tail Keywords Metadata"
              />
            )}
            
            {/* Keyword Difficulty (Dict format) */}
            {seoKeywordsData.keyword_difficulty && typeof seoKeywordsData.keyword_difficulty === 'object' && !Array.isArray(seoKeywordsData.keyword_difficulty) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Keyword Difficulty Scores
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(seoKeywordsData.keyword_difficulty as Record<string, number>).map(([keyword, score]) => (
                    <Chip
                      key={keyword}
                      label={`${keyword}: ${score.toFixed(0)}`}
                      sx={{ 
                        bgcolor: score > 70 ? 'error.50' : score > 40 ? 'warning.50' : 'success.50',
                        color: score > 70 ? 'error.dark' : score > 40 ? 'warning.dark' : 'success.dark',
                        fontWeight: 500 
                      }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Keyword Density Analysis */}
            {seoKeywordsData.keyword_density_analysis && seoKeywordsData.keyword_density_analysis.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Keyword Density Analysis
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {seoKeywordsData.keyword_density_analysis.map((analysis: KeywordDensityAnalysis, index: number) => (
                    <Paper key={index} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        {analysis.keyword}
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Current Density
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {analysis.current_density.toFixed(2)}%
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Optimal Density
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {analysis.optimal_density.toFixed(2)}%
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Occurrences
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {analysis.occurrences}
                          </Typography>
                        </Box>
                        {analysis.placement_locations && analysis.placement_locations.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Locations
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {analysis.placement_locations.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Keyword Clusters */}
            {seoKeywordsData.keyword_clusters && seoKeywordsData.keyword_clusters.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Keyword Clusters ({seoKeywordsData.keyword_clusters.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {seoKeywordsData.keyword_clusters.map((cluster: KeywordCluster, index: number) => (
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
            )}
            
            {/* Search Volume Summary */}
            {seoKeywordsData.search_volume_summary && typeof seoKeywordsData.search_volume_summary === 'object' && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Search Volume Summary
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {Object.entries(seoKeywordsData.search_volume_summary as Record<string, number>).map(([category, volume]) => (
                    <Paper key={category} elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5} sx={{ textTransform: 'capitalize' }}>
                        {category.replace(/_/g, ' ')} Keywords
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {volume.toLocaleString()}/mo
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Optimization Recommendations */}
            {((seoKeywordsData.optimization_recommendations as string[]) || []).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Optimization Recommendations
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {((seoKeywordsData.optimization_recommendations as string[]) || []).map((recommendation: string, index: number) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, bgcolor: 'info.50', borderRadius: 1 }}>
                      <Typography sx={{ color: 'info.main', mt: 0.25 }}>•</Typography>
                      <Typography variant="body2">{recommendation}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* SEO Scores */}
            {(seoKeywordsData.confidence_score || seoKeywordsData.relevance_score || seoOptimizationData.seo_score) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  SEO Scores
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {(seoKeywordsData.confidence_score !== undefined) && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Confidence Score
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {((seoKeywordsData.confidence_score as number) * 100).toFixed(0)}%
                      </Typography>
                    </Paper>
                  )}
                  {(seoKeywordsData.relevance_score !== undefined) && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Relevance Score
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {seoKeywordsData.relevance_score as number}%
                      </Typography>
                    </Paper>
                  )}
                  {(seoOptimizationData.seo_score !== undefined) && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        SEO Score
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {seoOptimizationData.seo_score as number}%
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>
            )}
            
            {/* Meta Tags */}
            {((seoOptimizationData.meta_title as string) || (seoOptimizationData.meta_description as string)) && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Meta Tags
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(seoOptimizationData.meta_title as string) && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Meta Title
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {seoOptimizationData.meta_title as string}
                      </Typography>
                    </Paper>
                  )}
                  {(seoOptimizationData.meta_description as string) && (
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Meta Description
                      </Typography>
                      <Typography variant="body2">
                        {seoOptimizationData.meta_description as string}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>
            )}
            
            {/* No SEO Data */}
            {allKeywords.length === 0 && !(seoOptimizationData.meta_title as string) && !(seoOptimizationData.meta_description as string) && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No SEO data available
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Processing Steps Tab */}
      {tabValue === 3 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon sx={{ color: 'success.main' }} />
              Processing Steps
            </Typography>
            {processingSteps.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {processingSteps.map((step: StepInfo | string, index: number) => {
                  const stepInfo: StepInfo = typeof step === 'string' 
                    ? { step_name: step, status: 'success' } 
                    : step
                  const stepName = stepInfo.step_name
                  const stepStatus = stepInfo.status || 'success'
                  const approval = stepApprovals?.[stepName]
                  const hasApproval = !!approval
                  const isSuccess = stepStatus === 'success'
                  
                  return (
                    <Paper
                      key={stepName}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: hasApproval ? 'primary.50' : isSuccess ? 'success.50' : 'error.50',
                        border: 1,
                        borderColor: hasApproval ? 'primary.200' : isSuccess ? 'success.200' : 'error.200',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: hasApproval ? 'primary.main' : isSuccess ? 'success.main' : 'error.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            flexShrink: 0
                          }}
                        >
                          {stepInfo.step_number || index + 1}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                              {String(stepName).replace(/_/g, ' ')}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              {isSuccess ? (
                                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                              ) : (
                                <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />
                              )}
                              <Chip
                                label={stepStatus}
                                size="small"
                                sx={{
                                  bgcolor: isSuccess ? 'success.100' : 'error.100',
                                  color: isSuccess ? 'success.dark' : 'error.dark',
                                  fontWeight: 500
                                }}
                              />
                              {stepInfo.execution_context_id && (
                                <Chip
                                  label={`Context ${stepInfo.execution_context_id}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Step Details */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                            {stepInfo.execution_time !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                ⏱️ {stepInfo.execution_time.toFixed(2)}s
                              </Typography>
                            )}
                            {stepInfo.tokens_used !== undefined && (
                              <Typography variant="caption" color="text.secondary">
                                🔢 {stepInfo.tokens_used.toLocaleString()} tokens
                              </Typography>
                            )}
                            {stepInfo.error_message && (
                              <Typography variant="caption" color="error.main" sx={{ display: 'block', width: '100%' }}>
                                ❌ {stepInfo.error_message}
                              </Typography>
                            )}
                          </Box>
                          
                          {/* Approval Status */}
                          {hasApproval && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                              {getApprovalIcon(approval.status)}
                              {getApprovalChip(approval.status)}
                              
                              {/* Reviewer Info */}
                              {approval.reviewed_by && approval.status !== 'pending' && (
                                <Typography variant="caption" color="text.secondary">
                                  by {approval.reviewed_by}
                                </Typography>
                              )}
                              
                              {/* Review Button */}
                              {onViewApproval && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<VisibilityIcon />}
                                  onClick={() => onViewApproval(approval.id)}
                                  sx={{ textTransform: 'none', ml: 'auto' }}
                                >
                                  Review
                                </Button>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  )
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No processing steps recorded
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Raw JSON Tab */}
      {tabValue === 4 && (
        <Card elevation={2} sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon />
              Raw JSON Response
            </Typography>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: '#1e1e1e'
              }}
            >
              <SyntaxHighlighter 
                language="json" 
                style={vs2015}
                customStyle={{
                  margin: 0,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  padding: '16px'
                }}
              >
                {JSON.stringify(result, null, 2)}
              </SyntaxHighlighter>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
