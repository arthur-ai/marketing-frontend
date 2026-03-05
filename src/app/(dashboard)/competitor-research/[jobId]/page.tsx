'use client'

import { use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ArticleIcon from '@mui/icons-material/Article'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useCompetitorResearchResult, useCrawledUrlContent } from '@/hooks/useApi'
import type {
  CompetitorContentAnalysis,
  CompetitorResearchSummary,
  ContentStrengthFactor,
  ContentWeaknessFactor,
  CrawledUrlContent,
} from '@/types/api'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function impactColor(impact: string) {
  if (impact === 'high') return 'error'
  if (impact === 'medium') return 'warning'
  return 'default'
}

function performanceBadge(tier?: string | null) {
  const map: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'error' }> = {
    top: { label: 'Top performer', color: 'success' },
    above_average: { label: 'Above average', color: 'info' },
    average: { label: 'Average', color: 'warning' },
    below_average: { label: 'Below average', color: 'error' },
  }
  if (!tier || !map[tier]) return null
  const { label, color } = map[tier]
  return <Chip label={label} color={color} size="small" />
}

function useSendToPipeline() {
  const router = useRouter()
  return useCallback((title: string, content: string, source_url?: string) => {
    sessionStorage.setItem('pipeline_prefill', JSON.stringify({ title, content, source_url }))
    router.push('/pipeline')
  }, [router])
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StrategicSummary({ summary }: { summary: CompetitorResearchSummary }) {
  const sections = [
    { label: 'Top content patterns', items: summary.top_content_patterns, color: '#2563eb' },
    { label: 'Winning formats', items: summary.winning_content_formats, color: '#7c3aed' },
    { label: 'Common topics', items: summary.common_topics, color: '#0891b2' },
    { label: 'Content gaps (opportunities)', items: summary.content_gaps, color: '#16a34a' },
    { label: 'SEO opportunities', items: summary.seo_opportunities, color: '#b45309' },
    { label: 'Social media tactics', items: summary.social_media_tactics, color: '#db2777' },
  ]

  return (
    <Stack spacing={3}>
      {/* Strategy recommendation */}
      {summary.recommended_content_strategy && (
        <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <LightbulbIcon sx={{ color: 'primary.main', mt: 0.3 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                  Recommended Strategy
                </Typography>
                <Typography variant="body2">{summary.recommended_content_strategy}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quick wins */}
      {summary.quick_wins.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Quick Wins
          </Typography>
          <Stack spacing={1}>
            {summary.quick_wins.map((win, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                <Typography variant="body2">{win}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Pattern grids */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {sections.map(({ label, items, color }) =>
          items.length > 0 ? (
            <Card key={label} variant="outlined">
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{ color, textTransform: 'uppercase', letterSpacing: 0.5 }}
                  gutterBottom
                >
                  {label}
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {items.map((item, i) => (
                    <Typography key={i} variant="body2" sx={{ display: 'flex', gap: 1 }}>
                      <span style={{ color, fontWeight: 700 }}>·</span> {item}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ) : null
        )}
      </Box>
    </Stack>
  )
}

function ContentAnalysisCard({ analysis, index, onSendToPipeline, fullContentByUrl }: { analysis: CompetitorContentAnalysis; index: number; onSendToPipeline: (title: string, content: string, url?: string) => void; fullContentByUrl: Record<string, string> }) {
  const score = analysis.overall_quality_score

  return (
    <Accordion defaultExpanded={index === 0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1, mr: 1, minWidth: 0 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {analysis.title || analysis.url || `Content ${index + 1}`}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {performanceBadge(analysis.performance_tier)}
              {analysis.content_type !== 'unknown' && (
                <Chip label={analysis.content_type} size="small" variant="outlined" />
              )}
              {analysis.platform && (
                <Chip label={analysis.platform} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
          {score != null && (
            <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
              <Typography variant="h6" fontWeight={700} color={score >= 7 ? 'success.main' : score >= 5 ? 'warning.main' : 'error.main'}>
                {score.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">/ 10</Typography>
            </Box>
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={3}>
          {/* URL + meta */}
          {analysis.url && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ flexGrow: 1 }}>
                {analysis.url}
              </Typography>
              <Tooltip title="Open URL">
                <IconButton size="small" component="a" href={analysis.url} target="_blank" rel="noopener noreferrer">
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {/* Send to pipeline */}
          {(analysis.url && fullContentByUrl[analysis.url]) || analysis.content_snippet ? (
            <Box>
              <Tooltip title="Pre-fill the pipeline with the full crawled content">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayArrowIcon fontSize="small" />}
                  onClick={() => {
                    const content = (analysis.url && fullContentByUrl[analysis.url]) || analysis.content_snippet!
                    onSendToPipeline(
                      analysis.title || analysis.url || 'Competitor content',
                      content,
                      analysis.url ?? undefined,
                    )
                  }}
                >
                  Use in Pipeline
                </Button>
              </Tooltip>
            </Box>
          ) : null}

          {/* Meta info */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {analysis.tone_and_voice && (
              <Chip label={`Tone: ${analysis.tone_and_voice}`} size="small" variant="outlined" />
            )}
            {analysis.target_audience && (
              <Chip label={`Audience: ${analysis.target_audience}`} size="small" variant="outlined" />
            )}
            {analysis.structure?.content_format && (
              <Chip label={`Format: ${analysis.structure.content_format}`} size="small" variant="outlined" />
            )}
            {analysis.structure?.word_count && (
              <Chip label={`${analysis.structure.word_count.toLocaleString()} words`} size="small" variant="outlined" />
            )}
            {analysis.structure?.estimated_read_time_minutes && (
              <Chip label={`~${analysis.structure.estimated_read_time_minutes} min read`} size="small" variant="outlined" />
            )}
          </Box>

          {/* Unique angle */}
          {analysis.unique_angle && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Unique Angle
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{analysis.unique_angle}</Typography>
            </Box>
          )}

          {/* Key topics */}
          {analysis.key_topics_covered.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Topics Covered
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                {analysis.key_topics_covered.map((t, i) => (
                  <Chip key={i} label={t} size="small" />
                ))}
              </Box>
            </Box>
          )}

          <Divider />

          {/* Strengths */}
          {analysis.strength_factors.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                  Why It Performs Well
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {analysis.strength_factors.map((f, i) => (
                  <Box key={i}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{f.factor}</Typography>
                      <Chip label={f.impact} size="small" color={impactColor(f.impact) as any} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">{f.description}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Weaknesses / opportunities */}
          {analysis.weakness_factors.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TrendingDownIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700} color="warning.main">
                  Gaps & Your Opportunities
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {analysis.weakness_factors.map((f, i) => (
                  <Box key={i}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>{f.factor}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>{f.description}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', bgcolor: 'success.50', borderRadius: 1, p: 1, mt: 0.5 }}>
                      <LightbulbIcon sx={{ color: 'success.main', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
                      <Typography variant="body2" color="success.dark">{f.opportunity}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Actionable insights */}
          {analysis.actionable_insights.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Actionable Insights
              </Typography>
              <Stack spacing={0.75}>
                {analysis.actionable_insights.map((insight, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 16, mt: 0.25, flexShrink: 0 }} />
                    <Typography variant="body2">{insight}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Social signals */}
          {analysis.social_signals && analysis.content_type === 'social_media' && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Social Signals</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {analysis.social_signals.hook_strength && (
                  <Chip label={`Hook: ${analysis.social_signals.hook_strength}`} size="small" variant="outlined" />
                )}
                {analysis.social_signals.media_type && (
                  <Chip label={`Media: ${analysis.social_signals.media_type}`} size="small" variant="outlined" />
                )}
                {analysis.social_signals.hashtag_count != null && (
                  <Chip label={`${analysis.social_signals.hashtag_count} hashtags`} size="small" variant="outlined" />
                )}
                {analysis.social_signals.engagement_format && (
                  <Chip label={analysis.social_signals.engagement_format} size="small" variant="outlined" />
                )}
              </Box>
              {analysis.social_signals.hook_text && (
                <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Opening hook:</Typography>
                  <Typography variant="body2" fontStyle="italic">&ldquo;{analysis.social_signals.hook_text}&rdquo;</Typography>
                </Box>
              )}
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

function CrawledContentSection({ items, isLoading, onSendToPipeline }: { items: CrawledUrlContent[]; isLoading: boolean; onSendToPipeline: (title: string, content: string, url?: string) => void }) {
  if (isLoading) return <CircularProgress size={20} />
  if (items.length === 0) return (
    <Typography variant="body2" color="text.secondary">No crawled content stored for this job.</Typography>
  )

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Accordion key={item.id} variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexGrow: 1, mr: 1 }}>
              <ArticleIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {item.title || item.url}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {item.url}
                </Typography>
              </Box>
              <Chip
                label={`${(item.word_count ?? 0).toLocaleString()} words`}
                size="small"
                variant="outlined"
                sx={{ flexShrink: 0 }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              {item.meta_description && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Meta Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{item.meta_description}</Typography>
                </Box>
              )}
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Full Content
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    p: 1.5,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    maxHeight: 300,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.full_content || '(no content extracted)'}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Fetched {new Date(item.fetched_at).toLocaleString()}
                </Typography>
                {item.full_content && (
                  <Tooltip title="Pre-fill the pipeline with the full crawled content">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon fontSize="small" />}
                      onClick={() => onSendToPipeline(
                        item.title || item.url,
                        item.full_content!,
                        item.url,
                      )}
                    >
                      Use in Pipeline
                    </Button>
                  </Tooltip>
                )}
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function CompetitorResearchResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = use(params)
  const router = useRouter()
  const sendToPipeline = useSendToPipeline()

  const isPolling = true // always poll until completed/failed
  const { data, isLoading, error } = useCompetitorResearchResult(jobId, isPolling)
  const { data: crawledData, isLoading: crawledLoading } = useCrawledUrlContent(jobId, true)

  const record = data?.data
  const status = record?.status
  const result = record?.result_data
  const inProgress = status === 'pending' || status === 'processing'

  const crawledItems: CrawledUrlContent[] = crawledData?.data ?? []
  const fullContentByUrl: Record<string, string> = Object.fromEntries(
    crawledItems.filter((i) => i.full_content).map((i) => [i.url, i.full_content!])
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.push('/competitor-research')}>
          <ArrowBackIcon />
        </IconButton>
        <TravelExploreIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Competitor Research
          </Typography>
          {record?.your_niche && (
            <Typography variant="body2" color="text.secondary">
              {record.your_niche}
            </Typography>
          )}
        </Box>
        <Box sx={{ ml: 'auto' }}>
          {status === 'completed' && <Chip label="Completed" color="success" icon={<CheckCircleIcon />} />}
          {inProgress && <Chip label="Analyzing…" color="info" icon={<AutorenewIcon />} />}
          {status === 'failed' && <Chip label="Failed" color="error" />}
        </Box>
      </Box>

      {/* Loading skeleton */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error">Failed to load research result.</Alert>
      )}

      {/* In progress */}
      {!isLoading && inProgress && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <AutorenewIcon sx={{ fontSize: 48, color: 'info.main', mb: 2, animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />
            <Typography variant="h6" gutterBottom>
              Analyzing {record?.competitor_count ?? '…'} competitor{(record?.competitor_count ?? 0) !== 1 ? 's' : ''}…
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The AI is studying each piece of content. This usually takes 30–90 seconds.
            </Typography>
            <LinearProgress sx={{ maxWidth: 400, mx: 'auto', borderRadius: 1 }} />
          </CardContent>
        </Card>
      )}

      {/* Failed */}
      {!isLoading && status === 'failed' && (
        <Alert severity="error">
          {record?.error ?? 'The analysis job failed. Please try again.'}
        </Alert>
      )}

      {/* Results */}
      {!isLoading && status === 'completed' && result && (
        <Stack spacing={4}>
          {/* Strategic summary */}
          {result.summary && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Strategic Summary
              </Typography>
              <StrategicSummary summary={result.summary} />
            </Box>
          )}

          <Divider />

          {/* Individual analyses */}
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Individual Content Analyses ({result.analyses.length})
            </Typography>
            <Stack spacing={1}>
              {result.analyses.map((analysis, i) => (
                <ContentAnalysisCard key={i} analysis={analysis} index={i} onSendToPipeline={sendToPipeline} fullContentByUrl={fullContentByUrl} />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Raw crawled content */}
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Crawled Page Content
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Raw text extracted from each URL at the time of analysis.
            </Typography>
            <CrawledContentSection items={crawledItems} isLoading={crawledLoading} onSendToPipeline={sendToPipeline} />
          </Box>

          {/* Meta info */}
          <Typography variant="caption" color="text.secondary">
            Analysis completed {result.completed_at ? formatDate(result.completed_at) : ''}
          </Typography>
        </Stack>
      )}
    </Container>
  )
}
