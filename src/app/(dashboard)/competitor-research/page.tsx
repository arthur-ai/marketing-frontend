'use client'

import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ErrorIcon from '@mui/icons-material/Error'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import { useCompetitorResearchJobs } from '@/hooks/useApi'
import type { CompetitorResearchListItem } from '@/types/api'

function statusChip(status: string) {
  switch (status) {
    case 'completed':
      return <Chip icon={<CheckCircleIcon />} label="Completed" color="success" size="small" />
    case 'processing':
      return <Chip icon={<AutorenewIcon />} label="Processing" color="info" size="small" />
    case 'pending':
      return <Chip icon={<HourglassEmptyIcon />} label="Pending" color="warning" size="small" />
    case 'failed':
      return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />
    default:
      return <Chip label={status} size="small" />
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CompetitorResearchPage() {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useCompetitorResearchJobs()

  const jobs: CompetitorResearchListItem[] = data?.data ?? []

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TravelExploreIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Competitor Research
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyze why competitors&apos; blogs and social posts perform well
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/competitor-research/new')}
        >
          New Research
        </Button>
      </Box>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
          Failed to load research jobs.
        </Alert>
      )}

      {/* Empty state */}
      {!isLoading && !error && jobs.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <TravelExploreIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No competitor research yet
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Analyze your competitors&apos; blogs and social posts to discover what makes their
              content perform well.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/competitor-research/new')}
            >
              Start your first analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Jobs list */}
      {!isLoading && jobs.length > 0 && (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <Card key={job.job_id} variant="outlined">
              <CardActionArea onClick={() => router.push(`/competitor-research/${job.job_id}`)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {statusChip(job.status)}
                        <Chip
                          label={job.content_type}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>
                      <Typography variant="body1" fontWeight={600} noWrap>
                        {job.your_niche ? `${job.your_niche} — ` : ''}
                        {job.competitor_count} competitor{job.competitor_count !== 1 ? 's' : ''} analyzed
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created {formatDate(job.created_at)}
                        {job.completed_at && ` · Completed ${formatDate(job.completed_at)}`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
