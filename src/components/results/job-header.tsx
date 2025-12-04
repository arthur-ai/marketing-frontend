'use client';

import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Chip,
  Badge,
} from '@mui/material';
import { NavigateNext, VerifiedUser } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { JobResults } from '@/types/results';
import type { ApprovalListItem } from '@/types/api';
import { formatJobDisplayName } from '@/utils/contentFormatters';

interface JobHeaderProps {
  job: JobResults;
  approvalsData?: {
    data?: {
      total?: number;
      pending?: number;
      approvals?: ApprovalListItem[];
    };
  };
  onNavigateToParent?: (parentJobId: string) => void;
  onNavigateToSubjob?: (subjobId: string) => void;
}

export function JobHeader({
  job,
  approvalsData,
  onNavigateToParent,
  onNavigateToSubjob,
}: JobHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Breadcrumb Navigation */}
      {(job.metadata.parent_job_id || job.metadata.resume_job_id) && (
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1 }}>
            {job.metadata.parent_job_id && (
              <Link
                component="button"
                variant="body2"
                onClick={() => {
                  if (job.metadata.parent_job_id && onNavigateToParent) {
                    onNavigateToParent(job.metadata.parent_job_id);
                  }
                }}
                sx={{ cursor: 'pointer' }}
              >
                Parent Job
              </Link>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.primary">
                {job.metadata.parent_job_id ? 'Subjob' : 'Job'} ({job.job_id.substring(0, 8)}...)
              </Typography>
              {job.metadata.parent_job_id && (
                <Chip label="Subjob" size="small" color="info" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
            </Box>
          </Breadcrumbs>
          {/* Next Job Link */}
          {job.metadata.parent_job_id && job.metadata.resume_job_id && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Next Job:
              </Typography>
              <Link
                component="button"
                variant="caption"
                onClick={() => {
                  if (job.metadata.resume_job_id && onNavigateToSubjob) {
                    onNavigateToSubjob(job.metadata.resume_job_id);
                  }
                }}
                sx={{ cursor: 'pointer', fontWeight: 'medium' }}
              >
                {job.metadata.resume_job_id.substring(0, 8)}... →
              </Link>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h6" gutterBottom={false}>
                {formatJobDisplayName(job.metadata)}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => router.push(`/jobs/${job.job_id}`)}
              >
                View Job
              </Button>
            </Box>
            {job.metadata.title && (
              <Typography variant="subtitle2" color="text.secondary">
                {job.metadata.title}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Job ID: {job.job_id.substring(0, 8)}...
            </Typography>
          </Box>

          {/* Approval Status Badge - Only show if not failed */}
          {job.metadata.status !== 'failed' &&
            approvalsData?.data &&
            approvalsData.data.total !== undefined &&
            approvalsData.data.total > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge
                  badgeContent={approvalsData.data.pending}
                  color="warning"
                  max={99}
                >
                  <Chip
                    icon={<VerifiedUser />}
                    label={`${approvalsData.data.pending || 0} Pending Approval${(approvalsData.data.pending || 0) !== 1 ? 's' : ''}`}
                    size="small"
                    color={approvalsData.data.pending && approvalsData.data.pending > 0 ? 'warning' : 'success'}
                    sx={{ height: 28 }}
                  />
                </Badge>
              </Box>
            )}
        </Box>
      </Box>
    </>
  );
}
