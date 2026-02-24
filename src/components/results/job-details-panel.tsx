'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Description,
  Download,
} from '@mui/icons-material';
import type { JobResults } from '@/types/results';
import type { FinalResult } from '@/types/results';
import { JobHeader } from './job-header';
import { JobStepsList } from './job-steps-list';
import { FinalResultViewer } from './final-result-viewer';
import { QualityWarningsDisplay } from './quality-warnings-display';
import { InlineApprovalPanel } from './inline-approval-panel';
import { apiClient } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { AccordionSection } from '@/components/shared/AccordionSection';
import { JsonDisplay } from '@/components/shared/JsonDisplay';
import { CopyButton } from '@/components/shared/CopyButton';

interface JobDetailsPanelProps {
  selectedJob: JobResults;
  finalResult: FinalResult | null;
  loadingFinalResult: boolean;
  onNavigateToParent?: (parentJobId: string) => void;
  onNavigateToSubjob?: (subjobId: string) => void;
  onViewStepIO: (stepName: string) => void;
  onResumePipeline?: (jobId: string) => void;
  isResuming?: boolean;
  onDecisionMade?: (decision: string) => void;
}

export function JobDetailsPanel({
  selectedJob,
  finalResult,
  loadingFinalResult,
  onNavigateToParent,
  onNavigateToSubjob,
  onViewStepIO,
  onResumePipeline,
  isResuming = false,
  onDecisionMade,
}: JobDetailsPanelProps) {
  const inputContent =
    selectedJob.metadata.input_content ||
    finalResult?.input_content ||
    undefined;

  const hasFailedSubjobs =
    (selectedJob.metadata as unknown as Record<string, unknown>).subjob_status &&
    typeof (selectedJob.metadata as unknown as Record<string, unknown>).subjob_status === 'object' &&
    ((selectedJob.metadata as unknown as Record<string, unknown>).subjob_status as Record<string, unknown>)
      ?.failed &&
    ((selectedJob.metadata as unknown as Record<string, unknown>).subjob_status as Record<string, unknown>)
      ?.failed !== 0;

  const firstPendingApproval = selectedJob.pending_approvals?.[0];

  const hasPendingApprovals =
    selectedJob.metadata.status !== 'failed' &&
    !hasFailedSubjobs &&
    (selectedJob.metadata.status === 'waiting_for_approval' || !!firstPendingApproval);

  return (
    <Card>
      <CardContent>
        <JobHeader
          job={selectedJob}
          onNavigateToParent={onNavigateToParent}
          onNavigateToSubjob={onNavigateToSubjob}
        />

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">Content Type</Typography>
            <Chip label={selectedJob.metadata.content_type} size="small" color="primary" />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip
              label={
                hasFailedSubjobs && selectedJob.metadata.status === 'waiting_for_approval'
                  ? 'failed'
                  : selectedJob.metadata.status || 'completed'
              }
              size="small"
              color={
                hasFailedSubjobs && selectedJob.metadata.status === 'waiting_for_approval'
                  ? 'error'
                  : selectedJob.metadata.status === 'waiting_for_approval'
                    ? 'warning'
                    : selectedJob.metadata.status === 'failed'
                      ? 'error'
                      : 'success'
              }
            />
          </Grid>
          {(selectedJob.metadata.triggered_by_user_id || selectedJob.metadata.triggered_by_username || selectedJob.metadata.triggered_by_email) && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">Triggered By</Typography>
              <Typography variant="body2">
                {selectedJob.metadata.triggered_by_username || selectedJob.metadata.triggered_by_email || selectedJob.metadata.triggered_by_user_id}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Inline Approval Panel — shown first for waiting_for_approval */}
        {hasPendingApprovals && firstPendingApproval && onDecisionMade && (
          <InlineApprovalPanel
            approval={firstPendingApproval}
            onDecisionMade={onDecisionMade}
          />
        )}

        {/* Resume Pipeline button — fallback when waiting_for_approval but no pending approval */}
        {!hasFailedSubjobs &&
          selectedJob.metadata.status === 'waiting_for_approval' &&
          !firstPendingApproval &&
          onResumePipeline && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onResumePipeline(selectedJob.job_id)}
                disabled={isResuming}
              >
                {isResuming ? 'Resuming...' : 'Resume Pipeline'}
              </Button>
            </Box>
          )}

        {/* Failed Optional Steps */}
        {selectedJob.metadata.failed_steps && selectedJob.metadata.failed_steps.length > 0 && (
          <Box sx={{ mb: 3, mt: 3 }}>
            <AccordionSection
              title={
                <Typography variant="h6" color="warning.main">
                  Failed Optional Steps ({selectedJob.metadata.failed_steps.length})
                </Typography>
              }
              defaultExpanded={true}
            >
              <List>
                {selectedJob.metadata.failed_steps.map((failedStep, idx) => {
                  const stepKey = typeof failedStep === 'string'
                    ? failedStep
                    : (failedStep as Record<string, unknown>).step_name as string || `step-${idx}`
                  const uniqueKey = `failed-${stepKey}-${selectedJob.job_id}-${idx}`
                  return (
                    <ListItem key={uniqueKey}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {typeof failedStep === 'string'
                                ? failedStep.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                                : (failedStep as Record<string, unknown>).step_name
                                ? String((failedStep as Record<string, unknown>).step_name)
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())
                                : 'Unknown Step'}
                            </Typography>
                            <Chip label="Optional" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {typeof failedStep === 'object' && (failedStep as Record<string, unknown>).error
                              ? `Error: ${String((failedStep as Record<string, unknown>).error)}`
                              : 'Step failed but did not stop the pipeline'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  )
                })}
              </List>
            </AccordionSection>
          </Box>
        )}

        {/* Quality Warnings */}
        {selectedJob.quality_warnings && selectedJob.quality_warnings.length > 0 && (
          <Box sx={{ mb: 3, mt: 3 }}>
            <AccordionSection title="Quality Warnings" defaultExpanded={true}>
              <QualityWarningsDisplay jobResults={selectedJob} />
            </AccordionSection>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Input Content Section */}
        {selectedJob.metadata && (
          <Box sx={{ mb: 3 }}>
            <AccordionSection
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Description sx={{ color: '#2196f3' }} />
                  <Typography variant="h6">Input Content</Typography>
                </Box>
              }
              defaultExpanded={false}
            >
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={async () => {
                    try {
                      const response = await apiClient.get(
                        `/v1/results/jobs/${selectedJob.job_id}/steps/00_input.json/download`,
                        { responseType: 'blob' }
                      )
                      if (response.status === 200) {
                        const blob = response.data
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        const fileName =
                          selectedJob.metadata.title || selectedJob.metadata.content_id || 'input.json'
                        a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        showSuccessToast('Download Started', 'Original file download started')
                      } else {
                        showErrorToast('Download Failed', 'Could not download original file. It may not exist.')
                      }
                    } catch (err) {
                      showErrorToast('Download Failed', err instanceof Error ? err.message : 'Failed to download file')
                    }
                  }}
                >
                  Download Original File
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {selectedJob.metadata.title || selectedJob.metadata.content_id || 'Original file'}
                </Typography>
              </Box>
              {!inputContent ? (
                <Typography variant="body2" color="text.secondary">No input content available</Typography>
              ) : typeof inputContent === 'string' ? (
                <Box sx={{ position: 'relative', border: 1, borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper', maxHeight: '400px', overflow: 'auto' }}>
                  <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem', m: 0 }}>
                    {inputContent}
                  </Box>
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <CopyButton text={inputContent} label="Input Content" />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <JsonDisplay data={inputContent} maxHeight="400px" />
                  <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <CopyButton text={JSON.stringify(inputContent, null, 2)} label="Input Content" />
                  </Box>
                </Box>
              )}
            </AccordionSection>
          </Box>
        )}

        {/* Pipeline Steps Section */}
        {selectedJob.steps && selectedJob.steps.length > 0 && !selectedJob.parent_job_id && (
          <JobStepsList steps={selectedJob.steps} jobId={selectedJob.job_id} onViewStepIO={onViewStepIO} />
        )}

        {/* Final Result Section */}
        {finalResult?.final_content && !finalResult?.results_by_platform && (
          <FinalResultViewer
            finalResult={finalResult}
            contentType={selectedJob.metadata.content_type}
            jobId={selectedJob.job_id}
            onCompare={() => {}}
          />
        )}

        {loadingFinalResult && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Loading final result...</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
