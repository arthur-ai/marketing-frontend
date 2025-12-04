'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Description,
  Download,
  ContentCopy,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import type { JobResults } from '@/types/results';
import type { FinalResult, SubjobResults } from '@/types/results';
import type { ApprovalListItem } from '@/types/api';
import { JobHeader } from './job-header';
import { JobStepsList } from './job-steps-list';
import { FinalResultViewer } from './final-result-viewer';
import { PerformanceMetrics } from './performance-metrics';
import { QualityWarningsDisplay } from './quality-warnings-display';
import { PlatformQualityScores } from './platform-quality-scores';
import JobHierarchyTree from './job-hierarchy-tree';
import { SubjobVisualizer } from './subjob-visualizer';
import { PipelineFlowViewer } from '@/components/pipeline/pipeline-flow-viewer';
import { MultiPlatformResults } from '@/components/pipeline/multi-platform-results';
import { ContentVariations } from '@/components/pipeline/content-variations';
import { PostPreviewEditor } from '@/components/pipeline/post-preview-editor';
import { api, apiClient } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { getApprovalRoute } from '@/lib/approval-routing';
import { getJobRoute } from '@/lib/job-routing';

interface JobDetailsPanelProps {
  selectedJob: JobResults;
  finalResult: FinalResult | null;
  subjobApprovals: Record<string, ApprovalListItem[]>;
  subjobResults: SubjobResults;
  approvalsData?: {
    data?: {
      total?: number;
      pending?: number;
      approvals?: ApprovalListItem[];
    };
  };
  loadingFinalResult: boolean;
  onNavigateToParent?: (parentJobId: string) => void;
  onNavigateToSubjob?: (subjobId: string) => void;
  onViewStepIO: (stepName: string) => void;
  onCompare: () => void;
  onResumePipeline?: (jobId: string) => void;
  isResuming?: boolean;
  onFinalResultUpdate?: (result: FinalResult) => void;
}

export function JobDetailsPanel({
  selectedJob,
  finalResult,
  subjobApprovals,
  subjobResults,
  approvalsData,
  loadingFinalResult,
  onNavigateToParent,
  onNavigateToSubjob,
  onViewStepIO,
  onCompare,
  onResumePipeline,
  isResuming = false,
  onFinalResultUpdate,
}: JobDetailsPanelProps) {
  const router = useRouter();

  const copyToClipboard = async (text: string, label: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast('Copied!', `${label} copied to clipboard`);
    } catch {
      showErrorToast('Copy Failed', 'Failed to copy to clipboard');
    }
  };

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

  return (
    <Card>
      <CardContent>
        <JobHeader
          job={selectedJob}
          approvalsData={approvalsData}
          onNavigateToParent={onNavigateToParent}
          onNavigateToSubjob={onNavigateToSubjob}
        />

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Content Type
            </Typography>
            <Chip label={selectedJob.metadata.content_type} size="small" color="primary" />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
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
        </Grid>

        {/* Resume Pipeline button */}
        {!hasFailedSubjobs &&
          selectedJob.metadata.status === 'waiting_for_approval' &&
          onResumePipeline && (
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => onResumePipeline(selectedJob.job_id)}
                disabled={isResuming}
                sx={{ mt: 2 }}
              >
                {isResuming ? 'Resuming...' : 'Resume Pipeline'}
              </Button>
            </Grid>
          )}

        {/* Failed Optional Steps */}
        {selectedJob.metadata.failed_steps && selectedJob.metadata.failed_steps.length > 0 && (
          <Box sx={{ mb: 3, mt: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" color="warning.main">
                  Failed Optional Steps ({selectedJob.metadata.failed_steps.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {selectedJob.metadata.failed_steps.map((failedStep, idx) => {
                    const stepKey = typeof failedStep === 'string' 
                      ? failedStep 
                      : (failedStep as Record<string, unknown>).step_name as string || `step-${idx}`;
                    const uniqueKey = `failed-${stepKey}-${selectedJob.job_id}-${idx}`;
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
                    );
                  })}
                </List>
                <Alert severity="info" sx={{ mt: 2 }}>
                  These steps failed but did not stop the pipeline. The pipeline completed with partial results.
                </Alert>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Quality Warnings */}
        {selectedJob.quality_warnings && selectedJob.quality_warnings.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Quality Warnings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <QualityWarningsDisplay jobResults={selectedJob} />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Performance Metrics */}
        {selectedJob.performance_metrics && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Performance Metrics</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PerformanceMetrics jobResults={selectedJob} />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Platform Quality Scores */}
        {selectedJob.metadata.platform && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Platform Quality Scores</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PlatformQualityScores
                  platform={selectedJob.metadata.platform}
                  qualityScores={selectedJob.metadata.platform_quality_scores}
                  stepResults={finalResult?.step_results as Record<string, unknown>}
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Job Hierarchy Tree */}
        <Box sx={{ mb: 3 }}>
          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Job Hierarchy</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <JobHierarchyTree
                jobId={selectedJob.job_id}
                selectedJobId={selectedJob.job_id}
                onJobClick={onNavigateToSubjob || (() => {})}
              />
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Subjob Visualizer */}
        {selectedJob.subjobs && selectedJob.subjobs.length > 0 && !selectedJob.parent_job_id && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Subjobs</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <SubjobVisualizer
                  jobResults={selectedJob}
                  approvalTimestamp={selectedJob.metadata.approved_at}
                  onSubjobClick={onNavigateToSubjob || (() => {})}
                  subjobApprovals={subjobApprovals}
                  subjobResults={subjobResults}
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Pending Approvals Section */}
        {selectedJob.metadata.status !== 'failed' &&
          !hasFailedSubjobs &&
          ((approvalsData?.data && approvalsData.data.pending !== undefined && approvalsData.data.pending > 0) ||
            selectedJob.metadata.status === 'waiting_for_approval') && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Pending Approvals
              </Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {selectedJob.metadata.status === 'waiting_for_approval'
                        ? 'Job Waiting for Approval'
                        : 'Pending Approvals'}
                    </Typography>
                    <Typography variant="body2">
                      {selectedJob.metadata.status === 'waiting_for_approval'
                        ? `This job is paused and waiting for approval. ${approvalsData?.data?.pending || 0} approval${(approvalsData?.data?.pending || 0) !== 1 ? 's' : ''} need${(approvalsData?.data?.pending || 0) !== 1 ? '' : 's'} review.`
                        : `${approvalsData?.data?.pending || 0} approval${(approvalsData?.data?.pending || 0) !== 1 ? 's' : ''} waiting for review`}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    onClick={() => router.push('/approvals')}
                  >
                    Go to Approvals Page
                  </Button>
                </Box>

                {approvalsData?.data?.approvals && approvalsData.data.approvals.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                      Approvals for this job:
                    </Typography>
                    <List dense>
                      {approvalsData.data.approvals
                        .filter((a) => a.status === 'pending')
                        .map((approval) => (
                          <ListItem
                            key={approval.id}
                            sx={{
                              border: 1,
                              borderColor: 'warning.main',
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: 'warning.50',
                            }}
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => router.push(getJobRoute(approval.pipeline_step, approval.job_id))}
                                >
                                  View Job
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => router.push(getApprovalRoute(approval.pipeline_step, approval.id))}
                                >
                                  Review
                                </Button>
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={
                                <Typography variant="body2" fontWeight="bold">
                                  {(approval.agent_name || 'Unknown Step').replace(/_/g, ' ').toUpperCase()}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {approval.step_name || 'No step name'}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                )}
              </Alert>
            </>
          )}

        <Divider sx={{ my: 3 }} />

        {/* Input Content Section */}
        {selectedJob.metadata && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Description sx={{ color: '#2196f3' }} />
                  <Typography variant="h6">Input Content</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
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
                        );
                        if (response.status === 200) {
                          const blob = response.data;
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          const fileName =
                            selectedJob.metadata.title || selectedJob.metadata.content_id || 'input.json';
                          a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          showSuccessToast('Download Started', 'Original file download started');
                        } else {
                          showErrorToast('Download Failed', 'Could not download original file. It may not exist.');
                        }
                      } catch (err) {
                        showErrorToast('Download Failed', err instanceof Error ? err.message : 'Failed to download file');
                      }
                    }}
                  >
                    Download Original File
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {selectedJob.metadata.title || selectedJob.metadata.content_id || 'Original file'}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    bgcolor: 'background.paper',
                    maxHeight: '400px',
                    overflow: 'auto',
                    position: 'relative',
                  }}
                >
                  {!inputContent ? (
                    <Typography variant="body2" color="text.secondary">
                      No input content available
                    </Typography>
                  ) : (
                    <>
                      <Box
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontSize: '0.875rem',
                          m: 0,
                          bgcolor: typeof inputContent === 'string' ? 'transparent' : 'grey.100',
                          p: typeof inputContent === 'string' ? 0 : 2,
                          borderRadius: typeof inputContent === 'string' ? 0 : 1,
                        }}
                      >
                        {typeof inputContent === 'string'
                          ? inputContent
                          : JSON.stringify(inputContent, null, 2)}
                      </Box>
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            size="small"
                            onClick={() =>
                              copyToClipboard(
                                typeof inputContent === 'string'
                                  ? inputContent
                                  : JSON.stringify(inputContent, null, 2),
                                'Input Content'
                              )
                            }
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Pipeline Steps Section */}
        {selectedJob.steps && selectedJob.steps.length > 0 && !selectedJob.parent_job_id && (
          <JobStepsList steps={selectedJob.steps} jobId={selectedJob.job_id} onViewStepIO={onViewStepIO} />
        )}

        {/* Pipeline Flow Section */}
        {selectedJob && !selectedJob.parent_job_id && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6">Pipeline Flow</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <PipelineFlowViewer jobId={selectedJob.job_id} />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Multi-Platform Results Section */}
        {finalResult?.results_by_platform && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Multi-Platform Results</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MultiPlatformResults
                  results={
                    finalResult as {
                      platforms: string[];
                      results_by_platform: Record<string, {
                        platform: string;
                        step_results: Record<string, unknown>;
                        final_content: string;
                        quality_warnings: string[];
                        platform_quality_scores?: Record<string, number>;
                      }>;
                      shared_steps?: {
                        seo_keywords?: unknown;
                        social_media_marketing_brief?: unknown;
                      };
                    }
                  }
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Content Variations Section */}
        {finalResult?.variations && Array.isArray(finalResult.variations) && finalResult.variations.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Accordion defaultExpanded={true}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Content Variations ({finalResult.variations.length} versions)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ContentVariations
                  variations={
                    finalResult.variations as unknown as Array<{
                      variation_id: string;
                      content: string;
                      subject_line?: string;
                      hashtags?: string[];
                      call_to_action?: string;
                      confidence_score?: number;
                      engagement_score?: number;
                      linkedin_score?: number;
                      hackernews_score?: number;
                      email_score?: number;
                      temperature_used?: number;
                    }>
                  }
                  platform={selectedJob.metadata.platform || 'linkedin'}
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Post Preview & Editor Section */}
        {finalResult?.final_content &&
          !finalResult?.results_by_platform &&
          selectedJob.metadata.output_content_type === 'social_media_post' && (
            <Box sx={{ mb: 3 }}>
              <Accordion defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Post Preview & Editor</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <PostPreviewEditor
                    content={finalResult.final_content}
                    platform={selectedJob.metadata.platform || 'linkedin'}
                    emailType={selectedJob.metadata.email_type}
                    subjectLine={finalResult.subject_line}
                    onSave={async (updatedContent, updatedSubjectLine) => {
                      try {
                        const response = await api.updateSocialMediaPost({
                          job_id: selectedJob.job_id,
                          content: updatedContent,
                          platform: selectedJob.metadata.platform || 'linkedin',
                          email_type: selectedJob.metadata.email_type,
                          subject_line: updatedSubjectLine,
                        });

                        if (response.data.success) {
                          const updatedResult: FinalResult = {
                            ...finalResult,
                            final_content: updatedContent,
                            ...(updatedSubjectLine && { subject_line: updatedSubjectLine }),
                          };
                          onFinalResultUpdate?.(updatedResult);
                          showSuccessToast('Post Updated', 'Post content has been saved successfully');
                        } else {
                          showErrorToast('Save Failed', response.data.message || 'Failed to save post');
                        }
                      } catch (error) {
                        console.error('Failed to save post:', error);
                        showErrorToast(
                          'Save Failed',
                          error instanceof Error ? error.message : 'Failed to save post'
                        );
                      }
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

        {/* Final Result Section */}
        {finalResult?.final_content && !finalResult?.results_by_platform && (
          <FinalResultViewer
            finalResult={finalResult}
            contentType={selectedJob.metadata.content_type}
            jobId={selectedJob.job_id}
            onCompare={onCompare}
          />
        )}

        {loadingFinalResult && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Loading final result...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
