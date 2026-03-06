'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Stack,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import { useSubmitCompetitorResearch } from '@/hooks/useApi'
import type { CompetitorResearchRequest } from '@/types/api'

const PLATFORM_OPTIONS = ['linkedin', 'twitter', 'instagram', 'facebook', 'hackernews']

const GOAL_OPTIONS = [
  'Increase organic traffic',
  'Build thought leadership',
  'Drive sign-ups / demos',
  'Generate leads',
  'Educate the market',
  'Competitive positioning',
]

const DEFAULT_NICHE = 'AI observability, MLOps, enterprise AI'

export default function NewCompetitorResearchPage() {
  const router = useRouter()
  const submitMutation = useSubmitCompetitorResearch()

  // Form state
  const [contentType, setContentType] = useState<'blog' | 'social_media' | 'both'>('both')
  const [niche, setNiche] = useState(DEFAULT_NICHE)
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [urls, setUrls] = useState<string[]>([''])
  const [focusPlatforms, setFocusPlatforms] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  const togglePlatform = (platform: string) => {
    setFocusPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  const addUrl = () => setUrls((prev) => [...prev, ''])
  const removeUrl = (i: number) => setUrls((prev) => prev.filter((_, idx) => idx !== i))
  const updateUrl = (i: number, value: string) =>
    setUrls((prev) => prev.map((u, idx) => (idx === i ? value : u)))

  const handleSubmit = async () => {
    setError(null)

    const validUrls = urls.filter((u) => u.trim().length > 0)
    if (validUrls.length === 0) {
      setError('Add at least one competitor URL to analyze.')
      return
    }

    const request: CompetitorResearchRequest = {
      competitor_urls: validUrls,
      content_type: contentType,
      your_niche: niche.trim() || undefined,
      your_content_goals: selectedGoals.length > 0 ? selectedGoals.join(', ') : undefined,
      focus_platforms: focusPlatforms.length > 0 ? focusPlatforms : undefined,
    }

    try {
      const res = await submitMutation.mutateAsync(request)
      const jobId = res.data.job_id
      router.push(`/competitor-research/${jobId}`)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to submit research job.')
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <TravelExploreIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            New Competitor Research
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze what makes competitor content perform well
          </Typography>
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* Context */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Your Context
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Helps the AI tailor insights to your specific situation.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Your niche / industry"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                fullWidth
                size="small"
                helperText="Pre-filled for Arthur AI — edit if needed"
              />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Your content goals (optional)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {GOAL_OPTIONS.map((goal) => (
                    <Chip
                      key={goal}
                      label={goal}
                      onClick={() => toggleGoal(goal)}
                      color={selectedGoals.includes(goal) ? 'primary' : 'default'}
                      variant={selectedGoals.includes(goal) ? 'filled' : 'outlined'}
                      size="small"
                      clickable
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Content type */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Content Type
            </Typography>
            <FormControl>
              <RadioGroup
                row
                value={contentType}
                onChange={(e) => setContentType(e.target.value as typeof contentType)}
              >
                <FormControlLabel value="both" control={<Radio />} label="Both (blogs + social)" />
                <FormControlLabel value="blog" control={<Radio />} label="Blog posts only" />
                <FormControlLabel value="social_media" control={<Radio />} label="Social media only" />
              </RadioGroup>
            </FormControl>

            {contentType !== 'blog' && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Focus platforms (optional)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {PLATFORM_OPTIONS.map((p) => (
                    <Chip
                      key={p}
                      label={p.charAt(0).toUpperCase() + p.slice(1)}
                      onClick={() => togglePlatform(p)}
                      color={focusPlatforms.includes(p) ? 'primary' : 'default'}
                      variant={focusPlatforms.includes(p) ? 'filled' : 'outlined'}
                      size="small"
                      clickable
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* URLs */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Competitor URLs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste blog posts or social media post URLs you want to analyze. The AI will study
              what makes each piece of content work.
            </Typography>
            <Stack spacing={1.5}>
              {urls.map((url, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    value={url}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://competitor.com/blog/great-post"
                    fullWidth
                    size="small"
                    type="url"
                  />
                  {urls.length > 1 && (
                    <IconButton size="small" onClick={() => removeUrl(i)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addUrl}
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              >
                Add another URL
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {error && <Alert severity="error">{error}</Alert>}

        <Divider />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => router.back()} disabled={submitMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            startIcon={submitMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <TravelExploreIcon />}
          >
            {submitMutation.isPending ? 'Submitting…' : 'Run Analysis'}
          </Button>
        </Box>
      </Stack>
    </Container>
  )
}
