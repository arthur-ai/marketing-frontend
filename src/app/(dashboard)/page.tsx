'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import { useRouter } from 'next/navigation'
import { useDashboardStats, useRecentActivity, usePendingApprovals } from '@/hooks/useApi'
import { ClientOnly } from '@/components/providers/ClientOnly'
import { formatDistanceToNow } from 'date-fns'
import { getChipStyle } from '@/utils/jobStatus'

function JobRowSkeleton({ last }: { last: boolean }) {
  return (
    <Box
      sx={{
        px: 3,
        py: 1.75,
        borderBottom: last ? 'none' : '1px solid #2A251F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Skeleton
          variant="text"
          width="52%"
          height={18}
          sx={{ bgcolor: '#2A251F', borderRadius: '3px', mb: 0.5 }}
        />
        <Skeleton
          variant="text"
          width="32%"
          height={14}
          sx={{ bgcolor: '#2A251F', borderRadius: '3px' }}
        />
      </Box>
      <Skeleton
        variant="rectangular"
        width={58}
        height={20}
        sx={{ bgcolor: '#2A251F', borderRadius: '3px', flexShrink: 0 }}
      />
    </Box>
  )
}

function CommandCenterContent() {
  const router = useRouter()
  const { data: statsData } = useDashboardStats()
  const { data: activityData, isLoading: activityLoading, isError: activityError, refetch } = useRecentActivity(7)
  const { data: pendingData } = usePendingApprovals(undefined, true)

  const stats = statsData?.data
  const activities = activityData?.data?.activities?.slice(0, 10) || []
  const pendingCount = pendingData?.data?.pending || 0
  const processingCount = stats?.jobs_processing || 0

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 400,
              lineHeight: 1.2,
              color: '#F0E8D8',
              mb: 0.5,
            }}
          >
            Jobs
          </Typography>
          {(processingCount > 0 || pendingCount > 0) && (
            <Typography
              component="div"
              sx={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontFeatureSettings: '"tnum"',
                color: '#6B6154',
              }}
            >
              {processingCount > 0 && (
                <Box component="span" sx={{ color: '#E8A238' }}>
                  {processingCount} running
                </Box>
              )}
              {processingCount > 0 && pendingCount > 0 && (
                <Box component="span"> · </Box>
              )}
              {pendingCount > 0 && (
                <Box component="span" sx={{ color: '#E8A238' }}>
                  {pendingCount} need approval
                </Box>
              )}
            </Typography>
          )}
        </Box>

        <Button
          onClick={() => router.push('/pipeline')}
          aria-label="Create new pipeline run"
          sx={{
            bgcolor: '#E8A238',
            color: '#0F0D0A',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600,
            fontSize: '13px',
            borderRadius: '6px',
            px: 2,
            py: 1,
            textTransform: 'none',
            flexShrink: 0,
            lineHeight: 1.5,
            '&:hover': { bgcolor: '#d49130' },
            transition: 'background-color 75ms',
          }}
        >
          + New Pipeline Run
        </Button>
      </Box>

      {/* Pending approvals strip */}
      {pendingCount > 0 && (
        <Box
          role="alert"
          aria-label={`${pendingCount} items pending approval`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            bgcolor: '#1A1713',
            border: '1px solid #E8A238',
            borderRadius: '6px',
            px: 2,
            py: 1.5,
            mb: 3,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 600,
              color: '#E8A238',
            }}
          >
            {pendingCount} {pendingCount === 1 ? 'item needs' : 'items need'} your review
          </Typography>
          <Button
            onClick={() => router.push('/approvals')}
            size="small"
            sx={{
              color: '#E8A238',
              border: '1px solid #E8A238',
              borderRadius: '3px',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'none',
              py: 0.5,
              px: 1.5,
              minWidth: 0,
              lineHeight: 1.5,
              '&:hover': { bgcolor: '#E8A23820' },
              transition: 'background-color 75ms',
            }}
          >
            Review →
          </Button>
        </Box>
      )}

      {/* Recent jobs list */}
      <Box
        sx={{
          bgcolor: '#1A1713',
          borderRadius: '6px',
          border: '1px solid #2A251F',
          overflow: 'hidden',
        }}
      >
        {activityLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <JobRowSkeleton key={i} last={i === 4} />
          ))
        ) : activityError ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 4 }}>
            <Typography
              sx={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                color: '#C45C3B',
                mb: 2,
              }}
            >
              Couldn&apos;t load jobs
            </Typography>
            <Button
              onClick={() => refetch()}
              sx={{
                color: '#C45C3B',
                border: '1px solid #C45C3B',
                borderRadius: '3px',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                textTransform: 'none',
                py: 0.5,
                px: 1.5,
                '&:hover': { bgcolor: '#C45C3B20' },
              }}
            >
              Retry
            </Button>
          </Box>
        ) : activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
            <Typography
              sx={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 400,
                color: '#F0E8D8',
                mb: 1.5,
              }}
            >
              No jobs yet.
            </Typography>
            <Typography
              sx={{
                fontFamily: 'var(--font-sans)',
                fontSize: '14px',
                color: '#6B6154',
                mb: 3,
              }}
            >
              Run your first pipeline to see results here.
            </Typography>
            <Button
              onClick={() => router.push('/pipeline')}
              aria-label="Create new pipeline run"
              sx={{
                bgcolor: '#E8A238',
                color: '#0F0D0A',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '6px',
                px: 2,
                py: 1,
                textTransform: 'none',
                '&:hover': { bgcolor: '#d49130' },
              }}
            >
              + New Pipeline Run
            </Button>
          </Box>
        ) : (
          activities.map((activity, i) => {
            const isProcessing = activity.status === 'processing'
            const chipStyle = getChipStyle(activity.status)
            const title =
              activity.title ||
              (activity.job_type ? activity.job_type.replace(/_/g, ' ') : `Job #${activity.job_id?.substring(0, 6)}`)
            const relativeTime = activity.created_at
              ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
              : ''

            return (
              <Box
                key={activity.job_id}
                onClick={() => router.push(`/results?job=${activity.job_id}`)}
                sx={{
                  px: 3,
                  py: 1.75,
                  borderBottom: !isProcessing && i < activities.length - 1 ? '1px solid #2A251F' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'background-color 75ms',
                  '&:hover': { bgcolor: '#232019' },
                  // Amber progress trace on processing rows (keyframe defined in globals.css)
                  ...(isProcessing && {
                    backgroundImage: 'linear-gradient(#E8A23899, #E8A23899)',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'bottom left',
                    backgroundSize: '0% 2px',
                    animation: 'amberTrace 2s ease-in-out infinite',
                  }),
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#F0E8D8',
                      mb: 0.25,
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      color: '#6B6154',
                    }}
                  >
                    {activity.job_type?.replace(/_/g, ' ')}
                    {relativeTime && (
                      <Box
                        component="span"
                        sx={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                      >
                        {' '}· {relativeTime}
                      </Box>
                    )}
                  </Typography>
                </Box>

                <Chip
                  label={chipStyle.label}
                  size="small"
                  aria-label={`Status: ${chipStyle.label}`}
                  sx={{
                    bgcolor: chipStyle.bgcolor,
                    color: chipStyle.color,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    borderRadius: '3px',
                    height: 20,
                    flexShrink: 0,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}

export default function DashboardPage() {
  return (
    <ClientOnly
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            bgcolor: '#0F0D0A',
          }}
        >
          <Box sx={{ color: '#6B6154', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
            Loading...
          </Box>
        </Box>
      }
    >
      <CommandCenterContent />
    </ClientOnly>
  )
}
