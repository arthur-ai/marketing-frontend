"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Divider,
  Stack,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Download,
  Refresh,
  Code,
  CheckCircle,
  Description,
  VerifiedUser,
  Cancel,
  ContentCopy,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { useJobApprovals, useResumeJob, useApproval } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { SubjobVisualizer } from '@/components/results/subjob-visualizer';
import { PerformanceMetrics } from '@/components/results/performance-metrics';
import { QualityWarningsDisplay } from '@/components/results/quality-warnings-display';
import JobHierarchyTree from '@/components/results/job-hierarchy-tree';
import type { StepInfo, JobResultsSummary, JobListItem as JobListItemType, ApprovalListItem } from '@/types/api';
import { Breadcrumbs, Link, TextField, MenuItem, Select, FormControl, InputLabel, Tabs, Tab } from '@mui/material';
import { NavigateNext, Search, FilterList } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

// Types (using from api.ts but keeping local for backward compatibility)
interface JobMetadata {
  job_id: string;
  content_type: string;
  content_id: string;
  started_at: string;
  completed_at: string;
  blog_type?: string;
  title?: string;
  status?: string;
  parent_job_id?: string;
  subjob_ids?: string[];
  resume_job_id?: string;
  original_job_id?: string;
  approved_at?: string;
}

interface JobResults extends JobResultsSummary {
  metadata: JobMetadata;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Component to display keyword selection for seo_keywords step
interface KeywordSelectionDisplayProps {
  stepData: {
    primary_keywords?: string[];
    secondary_keywords?: string[];
    lsi_keywords?: string[];
    long_tail_keywords?: string[];
    [key: string]: unknown;
  };
  approvals: Array<{
    id: string;
    pipeline_step: string;
    status: string;
  }>;
  jobId: string;
}

function KeywordSelectionDisplay({ 
  stepData, 
  approvals, 
  jobId 
}: KeywordSelectionDisplayProps) {
  // Find approval ID for seo_keywords step
  const keywordApprovalId = approvals.find(
    (a) => a.agent_name === 'seo_keywords' && a.status === 'approved'
  )?.id;

  // Fetch full approval details (always call hook, but enable conditionally)
  const approvalQuery = useApproval(keywordApprovalId || '');
  const approvalData = keywordApprovalId ? approvalQuery.data : null;

  const keywordApproval = approvalData?.data;
  const hasFilteredKeywords = keywordApproval?.modified_output !== undefined && 
    keywordApproval.modified_output !== null &&
    typeof keywordApproval.modified_output === 'object';
  const originalKeywords = stepData;
  const filteredKeywords = hasFilteredKeywords && keywordApproval?.modified_output && 
    typeof keywordApproval.modified_output === 'object' &&
    'primary_keywords' in keywordApproval.modified_output
    ? keywordApproval.modified_output as {
        primary_keywords?: string[];
        secondary_keywords?: string[];
        lsi_keywords?: string[];
        long_tail_keywords?: string[];
      }
    : null;

  return (
    <Box sx={{ mt: 1 }}>
      {hasFilteredKeywords && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList fontSize="small" />
            <Typography variant="body2">
              Keywords were filtered during approval. Selected keywords shown below.
            </Typography>
          </Box>
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Primary Keywords */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Primary Keywords
              </Typography>
              {(() => {
                const keywords = hasFilteredKeywords && filteredKeywords 
                  ? (filteredKeywords.primary_keywords || [])
                  : (originalKeywords.primary_keywords || []);
                return keywords.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {keywords.map((kw: string) => (
                      <Chip
                        key={kw}
                        label={kw}
                        size="small"
                        color="primary"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No primary keywords
                  </Typography>
                );
              })()}
              {hasFilteredKeywords && filteredKeywords && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {filteredKeywords.primary_keywords?.length || 0} of {originalKeywords.primary_keywords?.length || 0} selected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Secondary Keywords */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Secondary Keywords
              </Typography>
              {(() => {
                const keywords = hasFilteredKeywords && filteredKeywords 
                  ? (filteredKeywords.secondary_keywords || [])
                  : (originalKeywords.secondary_keywords || []);
                return keywords.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {keywords.map((kw: string) => (
                      <Chip
                        key={kw}
                        label={kw}
                        size="small"
                        color="secondary"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No secondary keywords
                  </Typography>
                );
              })()}
              {hasFilteredKeywords && filteredKeywords && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {filteredKeywords.secondary_keywords?.length || 0} of {originalKeywords.secondary_keywords?.length || 0} selected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* LSI Keywords */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                LSI Keywords
              </Typography>
              {(() => {
                const keywords = hasFilteredKeywords && filteredKeywords 
                  ? (filteredKeywords.lsi_keywords || [])
                  : (originalKeywords.lsi_keywords || []);
                return keywords.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {keywords.map((kw: string) => (
                      <Chip
                        key={kw}
                        label={kw}
                        size="small"
                        color="info"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No LSI keywords
                  </Typography>
                );
              })()}
              {hasFilteredKeywords && filteredKeywords && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {filteredKeywords.lsi_keywords?.length || 0} of {originalKeywords.lsi_keywords?.length || 0} selected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Long-tail Keywords */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Long-tail Keywords
              </Typography>
              {(() => {
                const keywords = hasFilteredKeywords && filteredKeywords 
                  ? (filteredKeywords.long_tail_keywords || [])
                  : (originalKeywords.long_tail_keywords || []);
                return keywords.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {keywords.map((kw: string) => (
                      <Chip
                        key={kw}
                        label={kw}
                        size="small"
                        color="success"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No long-tail keywords
                  </Typography>
                );
              })()}
              {hasFilteredKeywords && filteredKeywords && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {filteredKeywords.long_tail_keywords?.length || 0} of {originalKeywords.long_tail_keywords?.length || 0} selected
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {hasFilteredKeywords && keywordApproval && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Approval ID: {keywordApproval.id} • Reviewed: {keywordApproval.reviewed_at ? new Date(keywordApproval.reviewed_at).toLocaleString() : 'N/A'}
          </Typography>
        </Box>
      )}

      {/* Raw JSON toggle */}
      <Box sx={{ mt: 2 }}>
        <Button
          size="small"
          onClick={() => {
            // Toggle raw JSON view
            const rawView = document.getElementById(`raw-json-${jobId}`);
            if (rawView) {
              rawView.style.display = rawView.style.display === 'none' ? 'block' : 'none';
            }
          }}
        >
          {hasFilteredKeywords ? 'Show Original Keywords' : 'Show Raw JSON'}
        </Button>
        <Box
          id={`raw-json-${jobId}`}
          component="pre"
          sx={{
            display: 'none',
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 300,
            fontSize: '0.75rem',
            mt: 1,
          }}
        >
          {JSON.stringify(originalKeywords, null, 2)}
        </Box>
      </Box>
    </Box>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListItemType[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<{ final_content?: string; [key: string]: unknown } | null>(null);
  const [loadingFinalResult, setLoadingFinalResult] = useState(false);
  const [outputViewTab, setOutputViewTab] = useState(0); // 0 = Preview, 1 = Markdown
  const [stepData, setStepData] = useState<Record<string, unknown>>({}); // Kept for backward compatibility, not displayed in UI
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Fetch approvals for selected job
  const { data: approvalsData } = useJobApprovals(
    selectedJob?.job_id || '',
    undefined
  );
  
  // Fetch approvals for all subjobs in parallel
  const subjobApprovalsQueries = useQueries({
    queries: (selectedJob?.subjobs || []).map((subjobId) => ({
      queryKey: ['approvals', 'job', subjobId],
      queryFn: async () => {
        try {
          const result = await api.getJobApprovals(subjobId);
          return result ?? { approvals: [], total: 0, pending: 0 };
        } catch (err) {
          console.error(`Failed to fetch subjob approvals for ${subjobId}:`, err);
          return { approvals: [], total: 0, pending: 0 };
        }
      },
      enabled: !!subjobId && !!selectedJob && !selectedJob.parent_job_id,
      refetchInterval: 5000,
    })),
  });
  
  // Fetch results for all subjobs in parallel
  const subjobResultsQueries = useQueries({
    queries: (selectedJob?.subjobs || []).map((subjobId) => ({
      queryKey: ['job-result', subjobId],
      queryFn: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${subjobId}/result`);
          if (response.ok) {
            const data = await response.json();
            // Handle nested result structure: result.result
            let resultData = data.result;
            if (resultData && resultData.result) {
              resultData = resultData.result;
            }
            // Ensure we always return a value, not undefined
            return resultData ?? null;
          }
          return null;
        } catch (err) {
          console.error(`Failed to fetch subjob result for ${subjobId}:`, err);
          return null;
        }
      },
      enabled: !!subjobId && !!selectedJob && !selectedJob.parent_job_id,
      refetchInterval: 10000,
    })),
  });
  
  // Transform subjob approvals into a record for easy lookup
  const subjobApprovals: Record<string, ApprovalListItem[]> = {};
  (selectedJob?.subjobs || []).forEach((subjobId, index) => {
    const queryResult = subjobApprovalsQueries[index];
    if (queryResult?.data?.data?.approvals) {
      subjobApprovals[subjobId] = queryResult.data.data.approvals;
    }
  });
  
  // Transform subjob results into a record for easy lookup
  const subjobResults: Record<string, any> = {};
  (selectedJob?.subjobs || []).forEach((subjobId, index) => {
    const queryResult = subjobResultsQueries[index];
    if (queryResult?.data) {
      subjobResults[subjobId] = queryResult.data;
    }
  });
  
  // Resume job mutation
  const resumeJobMutation = useResumeJob();
  
  // Handle resume pipeline
  const handleResumePipeline = async (jobId: string) => {
    try {
      const result = await resumeJobMutation.mutateAsync(jobId);
      showSuccessToast(
        'Pipeline Resumed',
        `Pipeline resumed from step ${result.data.resuming_from_step}. New job ID: ${result.data.resume_job_id.substring(0, 8)}...`
      );
      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      showErrorToast(
        'Resume Failed',
        error instanceof Error ? error.message : 'Failed to resume pipeline'
      );
    }
  };

  // Fetch list of jobs
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Use the jobs API endpoint with subjob status included
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs?include_subjob_status=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      // Transform Job objects to JobListItem format
      interface JobResponse {
        id: string;
        type: string;
        content_id: string;
        started_at: string;
        completed_at: string;
        created_at: string;
        status: string;
        metadata?: {
          step_count?: number;
          original_job_id?: string;
          subjob_status?: {
            total: number;
            completed: number;
            pending: number;
            processing: number;
            waiting_for_approval: number;
            failed: number;
          };
          chain_status?: string;
        };
      }
      const jobsList: JobListItemType[] = (data.jobs || [])
        // Filter out cancelled jobs, resume_pipeline jobs, and jobs with original_job_id (subjobs)
        .filter((job: JobResponse) => 
          job.status !== 'cancelled' && 
          job.type !== 'resume_pipeline' && 
          !job.metadata?.original_job_id
        )
        .map((job: JobResponse) => ({
          job_id: job.id,
          content_type: job.type,
          content_id: job.content_id,
          started_at: job.started_at,
          completed_at: job.completed_at,
          step_count: job.metadata?.step_count || 0,
          created_at: job.created_at,
          status: job.status,
          subjob_count: job.metadata?.subjob_status?.total,
          subjob_status: job.metadata?.subjob_status,
          chain_status: job.metadata?.chain_status,
        }));
      setJobs(jobsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch final result for a job
  const fetchFinalResult = async (jobId: string) => {
    try {
      setLoadingFinalResult(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/result`);
      if (response.ok) {
        const data = await response.json();
        console.log('Final result API response:', data);
        
        // Handle nested result structure: result.result
        let resultData = data.result;
        if (resultData && resultData.result) {
          resultData = resultData.result;
          
          // Extract step_results and populate stepData
          if (resultData.step_results) {
            const stepResults = resultData.step_results;
            const stepInfo = resultData.metadata?.step_info || [];
            
            stepInfo.forEach((step: { step_number?: number; step_name?: string }, idx: number) => {
              const stepName = step.step_name || `step_${idx}`;
              const stepResult = stepResults[stepName];
              if (stepResult) {
                const cacheKey = `${jobId}_step_${step.step_number || idx}.json`;
                setStepData((prev) => ({ ...prev, [cacheKey]: stepResult }));
              }
            });
          }
        }
        
        if (resultData) {
          console.log('Final result data:', resultData);
          console.log('Final content:', resultData.final_content);
          setFinalResult(resultData);
        } else {
          console.log('No result in API response');
          setFinalResult(null);
        }
      } else if (response.status === 202) {
        // Job still processing
        console.log('Job still processing');
        setFinalResult(null);
      } else {
        // Try to get from job details
        console.log('Result API failed, trying job details endpoint');
        const jobResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          console.log('Job details response:', jobData);
          if (jobData.job?.result) {
            // Handle nested result structure
            let resultData = jobData.job.result;
            if (resultData && resultData.result) {
              resultData = resultData.result;
              
              // Extract step_results and populate stepData
              if (resultData.step_results) {
                const stepResults = resultData.step_results;
                const stepInfo = resultData.metadata?.step_info || [];
                
                stepInfo.forEach((step: { step_number?: number; step_name?: string }, idx: number) => {
                  const stepName = step.step_name || `step_${idx}`;
                  const stepResult = stepResults[stepName];
                  if (stepResult) {
                    const cacheKey = `${jobId}_step_${step.step_number || idx}.json`;
                    setStepData((prev) => ({ ...prev, [cacheKey]: stepResult }));
                  }
                });
              }
            }
            
            console.log('Job result from details:', resultData);
            console.log('Final content from details:', resultData.final_content);
            setFinalResult(resultData);
          } else {
            console.log('No result in job details');
            setFinalResult(null);
          }
        } else {
          console.log('Job details API also failed');
          setFinalResult(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch final result:', err);
      setFinalResult(null);
    } finally {
      setLoadingFinalResult(false);
    }
  };

  // Fetch subjob details directly (without redirecting to parent)
  const fetchSubjobDetails = async (subjobId: string) => {
    try {
      // Reset final result when switching jobs
      setFinalResult(null);
      
      // Fetch subjob details directly
      await fetchJobDetailsInternal(subjobId, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjob details');
    }
  };

  // Internal function to fetch job details with option to redirect to parent
  const fetchJobDetailsInternal = async (jobId: string, redirectToParent: boolean = true) => {
    try {
      // Reset final result when switching jobs
      setFinalResult(null);
      
      // First, check if this is a resume_pipeline job - if so, redirect to parent (unless explicitly disabled)
      if (redirectToParent) {
        const jobCheckResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
        if (jobCheckResponse.ok) {
          const jobCheckData = await jobCheckResponse.json();
          const jobCheck = jobCheckData.job;
          
          // If this is a resume_pipeline job or has original_job_id, fetch parent instead
          if (jobCheck.type === 'resume_pipeline' || jobCheck.metadata?.original_job_id) {
            const parentJobId = jobCheck.metadata?.original_job_id || 
                               (jobCheck.result && typeof jobCheck.result === 'object' && jobCheck.result.original_job_id);
            if (parentJobId) {
              // Recursively fetch parent job details
              await fetchJobDetailsInternal(parentJobId, true);
              return;
            }
          }
        }
      }
      
      // Try results API first (has step details), fallback to jobs API
      const response = await fetch(`${API_BASE_URL}/api/v1/results/jobs/${jobId}`);
      if (!response.ok) {
        // Fallback: Try to get job.result if job is completed
        const jobResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
        if (!jobResponse.ok) {
          throw new Error('Failed to fetch job details');
        }
        const jobData = await jobResponse.json();
        const job = jobData.job;
        
        // Get content type - use original_content_type for resume_pipeline jobs
        const contentType = job.type === 'resume_pipeline' 
          ? (job.metadata?.original_content_type || job.type)
          : job.type;
        
        // If job has result, try to extract step info from it
        let steps: StepInfo[] = [];
        let performanceMetrics = undefined;
        let qualityWarnings = undefined;
        
        if (job.result && job.status === 'completed') {
          // Handle nested result structure: result.result.step_results
          const actualResult = (job.result as any).result || job.result;
          const resultMetadata = actualResult.metadata || {};
          const stepInfo = resultMetadata.step_info || [];
          
          // Extract step_results if available
          const stepResults = actualResult.step_results || {};
          
          steps = stepInfo.map((step: { step_number?: number; step_name?: string; execution_time?: number; tokens_used?: number; status?: string; error_message?: string }, idx: number) => {
            const stepName = step.step_name || `step_${idx}`;
            const stepResult = stepResults[stepName];
            
            // Pre-populate stepData if step_results are available
            if (stepResult) {
              const cacheKey = `${jobId}_step_${step.step_number || idx}.json`;
              setStepData((prev) => ({ ...prev, [cacheKey]: stepResult }));
            }
            
            return {
              filename: `step_${step.step_number || idx}.json`,
              step_number: step.step_number || idx,
              step_name: stepName,
              timestamp: resultMetadata.completed_at || job.completed_at || new Date().toISOString(),
              has_result: true,
              file_size: 0,
              execution_time: step.execution_time,
              tokens_used: step.tokens_used,
              status: step.status || 'completed',
              error_message: step.error_message,
              job_id: jobId // Include job_id for subjob steps
            };
          });
          
          performanceMetrics = {
            execution_time_seconds: resultMetadata.execution_time_seconds,
            total_tokens_used: resultMetadata.total_tokens_used,
            step_info: stepInfo
          };
          
          qualityWarnings = actualResult.quality_warnings || [];
          
          // Also set final result if available
          if (actualResult.final_content) {
            setFinalResult(actualResult);
          }
        }
        
        // Follow the chain of resume_job_id to get all subjobs
        const subjobIds: string[] = [];
        let currentJobId = job.metadata?.resume_job_id;
        const visited = new Set<string>();
        
        while (currentJobId && !visited.has(currentJobId)) {
          visited.add(currentJobId);
          subjobIds.push(currentJobId);
          
          try {
            const nextJobResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${currentJobId}`);
            if (nextJobResponse.ok) {
              const nextJobData = await nextJobResponse.json();
              const nextJob = nextJobData.job;
              currentJobId = nextJob?.metadata?.resume_job_id;
            } else {
              break;
            }
          } catch (err) {
            console.error(`Failed to fetch next job in chain ${currentJobId}:`, err);
            break;
          }
        }
        
        // If parent job has subjobs but no steps, aggregate steps from subjobs
        if (subjobIds.length > 0 && steps.length === 0) {
          try {
            const allSteps: StepInfo[] = [];
            // Fetch steps from each subjob
            for (const subjobId of subjobIds) {
              try {
                const subjobResponse = await fetch(`${API_BASE_URL}/api/v1/results/jobs/${subjobId}`);
                if (subjobResponse.ok) {
                  const subjobData = await subjobResponse.json();
                  if (subjobData.steps && subjobData.steps.length > 0) {
                    // Add job_id to each step to identify which subjob it belongs to
                    const subjobSteps = subjobData.steps.map((step: StepInfo) => ({
                      ...step,
                      job_id: subjobId
                    }));
                    allSteps.push(...subjobSteps);
                  }
                }
              } catch (err) {
                console.error(`Failed to fetch steps from subjob ${subjobId}:`, err);
              }
            }
            
            if (allSteps.length > 0) {
              // Sort steps by timestamp
              allSteps.sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeA - timeB;
              });
              
              steps = allSteps;
              
              // Pre-populate stepData from subjob results
              for (const subjobId of subjobIds) {
                try {
                  const subjobResultResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${subjobId}/result`);
                  if (subjobResultResponse.ok) {
                    const subjobResultData = await subjobResultResponse.json();
                    let subjobActualResult = subjobResultData.result;
                    if (subjobActualResult && subjobActualResult.result) {
                      subjobActualResult = subjobActualResult.result;
                    }
                    
                    if (subjobActualResult?.step_results) {
                      const subjobStepResults = subjobActualResult.step_results;
                      steps
                        .filter(step => step.job_id === subjobId)
                        .forEach((step) => {
                          const stepName = step.step_name;
                          const stepResult = subjobStepResults[stepName];
                          if (stepResult) {
                            const cacheKey = `${subjobId}_${step.filename}`;
                            setStepData((prev) => ({ ...prev, [cacheKey]: stepResult }));
                          }
                        });
                    }
                  }
                } catch (err) {
                  console.error(`Failed to fetch step results from subjob ${subjobId}:`, err);
                }
              }
            }
          } catch (err) {
            console.error('Failed to aggregate steps from subjobs:', err);
          }
        }
        
        const jobResults = {
          job_id: job.id,
          metadata: {
            job_id: job.id,
            content_type: contentType,
            content_id: job.content_id,
            started_at: job.started_at,
            completed_at: job.completed_at,
            status: job.status,
            title: job.metadata?.title || job.metadata?.input_content?.title,
            parent_job_id: job.metadata?.original_job_id,
            subjob_ids: subjobIds,
            resume_job_id: job.metadata?.resume_job_id,
            original_job_id: job.metadata?.original_job_id,
          },
          steps: steps,
          total_steps: steps.length,
          subjobs: subjobIds.length > 0 ? subjobIds : undefined,
          parent_job_id: job.metadata?.original_job_id,
          performance_metrics: performanceMetrics,
          quality_warnings: qualityWarnings,
        };
        setSelectedJob(jobResults);
        
        // Fetch final result if job is completed
        const jobStatus = job.status || 'completed';
        if (jobStatus === 'completed' || jobStatus !== 'waiting_for_approval') {
          await fetchFinalResult(jobId);
        } else {
          setFinalResult(null);
        }
      } else {
        const data = await response.json();
        // Ensure status is preserved from job list if not in results
        const jobFromList = jobs.find(j => j.job_id === jobId);
        if (jobFromList?.status) {
          data.metadata = {
            ...data.metadata,
            status: jobFromList.status, // Use status from job list
          };
        }
        // Fix content type for resume_pipeline jobs - use original_content_type if available
        if (data.metadata?.content_type === 'resume_pipeline') {
          // Try to get original_content_type from the job itself
          const jobResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            const job = jobData.job;
            if (job.metadata?.original_content_type) {
              data.metadata.content_type = job.metadata.original_content_type;
            }
          }
        }
        // Ensure the response matches JobResults type
        const jobResults = data as JobResults;
        
        // Fetch job details to get resume_job_id if not in metadata
        if (!jobResults.metadata.resume_job_id) {
          try {
            const jobResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}`);
            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              const job = jobData.job;
              if (job.metadata?.resume_job_id) {
                jobResults.metadata.resume_job_id = job.metadata.resume_job_id;
              }
            }
          } catch (err) {
            console.error('Failed to fetch job details for resume_job_id:', err);
          }
        }
        
        // Follow the chain of resume_job_id to get all subjobs if not already in jobResults
        let allSubjobIds = jobResults.subjobs || [];
        if (allSubjobIds.length === 0 && jobResults.metadata?.resume_job_id) {
          allSubjobIds = [];
          let currentJobId = jobResults.metadata.resume_job_id;
          const visited = new Set<string>();
          
          while (currentJobId && !visited.has(currentJobId)) {
            visited.add(currentJobId);
            allSubjobIds.push(currentJobId);
            
            try {
              const nextJobResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${currentJobId}`);
              if (nextJobResponse.ok) {
                const nextJobData = await nextJobResponse.json();
                const nextJob = nextJobData.job;
                currentJobId = nextJob?.metadata?.resume_job_id;
              } else {
                break;
              }
            } catch (err) {
              console.error(`Failed to fetch next job in chain ${currentJobId}:`, err);
              break;
            }
          }
          
          // Update jobResults with all subjobs
          jobResults.subjobs = allSubjobIds;
        }
        
        // If parent job has subjobs but no steps, aggregate steps from subjobs
        if (allSubjobIds.length > 0 && (!jobResults.steps || jobResults.steps.length === 0)) {
          try {
            const allSteps: StepInfo[] = [];
            // Fetch steps from each subjob
            for (const subjobId of allSubjobIds) {
              try {
                const subjobResponse = await fetch(`${API_BASE_URL}/api/v1/results/jobs/${subjobId}`);
                if (subjobResponse.ok) {
                  const subjobData = await subjobResponse.json();
                  if (subjobData.steps && subjobData.steps.length > 0) {
                    // Add job_id to each step to identify which subjob it belongs to
                    const subjobSteps = subjobData.steps.map((step: StepInfo) => ({
                      ...step,
                      job_id: subjobId
                    }));
                    allSteps.push(...subjobSteps);
                  }
                }
              } catch (err) {
                console.error(`Failed to fetch steps from subjob ${subjobId}:`, err);
              }
            }
            
            if (allSteps.length > 0) {
              // Sort steps by timestamp
              allSteps.sort((a, b) => {
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
                return timeA - timeB;
              });
              
              jobResults.steps = allSteps;
              jobResults.total_steps = allSteps.length;
            }
          } catch (err) {
            console.error('Failed to aggregate steps from subjobs:', err);
          }
        }
        
        // Pre-populate stepData from step_results if available in the results
        if (jobResults.steps && jobResults.steps.length > 0) {
          // Try to get step results from job result API
          try {
            const resultResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${jobId}/result`);
            if (resultResponse.ok) {
              const resultData = await resultResponse.json();
              let actualResult = resultData.result;
              if (actualResult && actualResult.result) {
                actualResult = actualResult.result;
              }
              
              if (actualResult?.step_results) {
                const stepResults = actualResult.step_results;
                jobResults.steps.forEach((step) => {
                  const stepName = step.step_name;
                  const stepResult = stepResults[stepName];
                  if (stepResult) {
                    const cacheKey = `${jobId}_${step.filename}`;
                    setStepData((prev) => ({ ...prev, [cacheKey]: stepResult }));
                  }
                });
              }
            }
          } catch (err) {
            console.error('Failed to pre-populate step data:', err);
          }
          
          // Also fetch step results from subjobs
          if (allSubjobIds.length > 0) {
            for (const subjobId of allSubjobIds) {
              try {
                const subjobResultResponse = await fetch(`${API_BASE_URL}/api/v1/jobs/${subjobId}/result`);
                if (subjobResultResponse.ok) {
                  const subjobResultData = await subjobResultResponse.json();
                  let subjobActualResult = subjobResultData.result;
                  if (subjobActualResult && subjobActualResult.result) {
                    subjobActualResult = subjobActualResult.result;
                  }
                  
                  if (subjobActualResult?.step_results) {
                    const subjobStepResults = subjobActualResult.step_results;
                    // Find steps that belong to this subjob
                    jobResults.steps
                      .filter(step => step.job_id === subjobId)
                      .forEach((step) => {
                        const stepName = step.step_name;
                        const stepResult = subjobStepResults[stepName];
                        if (stepResult) {
                          const cacheKey = `${subjobId}_${step.filename}`;
                          setStepData((prev) => ({ ...prev, [cacheKey]: stepResult }));
                        }
                      });
                  }
                }
              } catch (err) {
                console.error(`Failed to fetch step results from subjob ${subjobId}:`, err);
              }
            }
          }
        }
        
        setSelectedJob(jobResults);
        
        // Fetch final result if job is completed
        const jobStatus = jobResults.metadata?.status || 'completed';
        if (jobStatus === 'completed' || jobStatus !== 'waiting_for_approval') {
          await fetchFinalResult(jobId);
        } else {
          setFinalResult(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    }
  };

  // Fetch details for a specific job (public function that redirects to parent for subjobs)
  const fetchJobDetails = async (jobId: string) => {
    await fetchJobDetailsInternal(jobId, true);
  };


  // Copy to clipboard helper
  const copyToClipboard = async (text: string, label: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccessToast('Copied!', `${label} copied to clipboard`);
    } catch (err) {
      showErrorToast('Copy Failed', 'Failed to copy to clipboard');
    }
  };

  // Convert HTML to markdown (simple implementation)
  const htmlToMarkdown = (html: string): string => {
    // Simple conversion - remove HTML tags and convert basic elements
    let markdown = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<ul[^>]*>/gi, '\n')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<ol[^>]*>/gi, '\n')
      .replace(/<\/ol>/gi, '\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();
    return markdown;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        job.job_id.toLowerCase().includes(query) ||
        job.content_type?.toLowerCase().includes(query) ||
        job.content_id?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filterType !== 'all' && job.content_type !== filterType) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && job.status !== filterStatus) {
      return false;
    }
    
    return true;
  });
  
  // Get unique content types for filter
  const contentTypes = Array.from(new Set(jobs.map(j => j.content_type).filter(Boolean)));

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading && jobs.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading results...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Pipeline Results
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchJobs}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Jobs List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Jobs ({filteredJobs.length}/{jobs.length})
              </Typography>
              
              {/* Search and Filters */}
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="all">All Types</MenuItem>
                      {contentTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="processing">Processing</MenuItem>
                      <MenuItem value="waiting_for_approval">Waiting for Approval</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <List sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
                {filteredJobs.map((job) => (
                  <ListItem
                    key={job.job_id}
                    disablePadding
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemButton
                      selected={selectedJob?.job_id === job.job_id}
                      onClick={() => fetchJobDetails(job.job_id)}
                      sx={{
                        borderRadius: 1,
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          '&:hover': {
                            bgcolor: 'primary.light',
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box>
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {(() => {
                                // Format: "Original File - Date Time - End State"
                                // Try to get a meaningful file name - content_id might be a UUID, so use it as fallback
                                const originalFile = job.content_id || 'Unknown File';
                                const date = job.completed_at || job.created_at || job.started_at;
                                const dateTimeStr = date ? new Date(date).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                }) : 'Unknown date';
                                const endState = job.status === 'completed' ? 'blog post' : 
                                                 job.status === 'failed' ? 'failed' :
                                                 job.status === 'waiting_for_approval' ? 'waiting' :
                                                 job.status || 'processing';
                                return `${originalFile} - ${dateTimeStr} - ${endState}`;
                              })()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Steps: {job.step_count}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {job.completed_at
                                ? `Completed: ${formatTimestamp(job.completed_at)}`
                                : 'In Progress'}
                            </Typography>
                          </Stack>
                        }
                        secondaryTypographyProps={{
                          component: 'div' as const,
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                        {job.status === 'waiting_for_approval' && 
                         job.chain_status !== 'failed' && 
                         !(job.subjob_status && job.subjob_status.failed && job.subjob_status.failed > 0) && (
                          <Chip
                            label="Waiting for Approval"
                            size="small"
                            color="warning"
                          />
                        )}
                        {job.subjob_count && job.subjob_count > 0 && (
                          <Tooltip
                            title={
                              job.subjob_status
                                ? `${job.subjob_status.completed}/${job.subjob_status.total} subjobs completed`
                                : `${job.subjob_count} subjobs`
                            }
                          >
                            <Chip
                              label={`${job.subjob_count} subjob${job.subjob_count !== 1 ? 's' : ''}`}
                              size="small"
                              color={
                                job.chain_status === 'all_completed'
                                  ? 'success'
                                  : job.chain_status === 'blocked'
                                  ? 'warning'
                                  : job.chain_status === 'failed'
                                  ? 'error'
                                  : 'info'
                              }
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Tooltip>
                        )}
                        {job.chain_status && job.chain_status !== 'all_completed' && (
                          <Chip
                            label={job.chain_status.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                            color={
                              job.chain_status === 'blocked'
                                ? 'warning'
                                : job.chain_status === 'failed'
                                ? 'error'
                                : 'info'
                            }
                            sx={{ fontSize: '0.65rem', height: 18 }}
                          />
                        )}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Job Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedJob ? (
            <Card>
              <CardContent>
                {/* Breadcrumb Navigation */}
                {(selectedJob.metadata.parent_job_id || selectedJob.metadata.resume_job_id) && (
                  <Box sx={{ mb: 2 }}>
                    <Breadcrumbs
                      separator={<NavigateNext fontSize="small" />}
                      sx={{ mb: 1 }}
                    >
                      {selectedJob.metadata.parent_job_id && (
                        <Link
                          component="button"
                          variant="body2"
                          onClick={() => {
                            if (selectedJob.metadata.parent_job_id) {
                              fetchJobDetails(selectedJob.metadata.parent_job_id);
                            }
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          Parent Job
                        </Link>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.primary">
                          {selectedJob.metadata.parent_job_id ? 'Subjob' : 'Job'} ({selectedJob.job_id.substring(0, 8)}...)
                        </Typography>
                        {selectedJob.metadata.parent_job_id && (
                          <Chip
                            label="Subjob"
                            size="small"
                            color="info"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    </Breadcrumbs>
                    {/* Next Job Link */}
                    {selectedJob.metadata.parent_job_id && selectedJob.metadata.resume_job_id && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Next Job:
                        </Typography>
                        <Link
                          component="button"
                          variant="caption"
                          onClick={() => {
                            if (selectedJob.metadata.resume_job_id) {
                              fetchSubjobDetails(selectedJob.metadata.resume_job_id);
                            }
                          }}
                          sx={{ cursor: 'pointer', fontWeight: 'medium' }}
                        >
                          {selectedJob.metadata.resume_job_id.substring(0, 8)}... →
                        </Link>
                      </Box>
                    )}
                  </Box>
                )}
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {(() => {
                          // Format: "Original File - Date Time - End State"
                          const originalFile = selectedJob.metadata.title || 
                                             selectedJob.metadata.content_id || 
                                             'Unknown File';
                          const date = selectedJob.metadata.completed_at || selectedJob.metadata.started_at;
                          const dateTimeStr = date ? new Date(date).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          }) : 'Unknown date';
                          const endState = selectedJob.metadata.status === 'completed' ? 'blog post' :
                                         selectedJob.metadata.status === 'failed' ? 'failed' :
                                         selectedJob.metadata.status === 'waiting_for_approval' ? 'waiting' :
                                         selectedJob.metadata.status || 'processing';
                          return `${originalFile} - ${dateTimeStr} - ${endState}`;
                        })()}
                      </Typography>
                      {selectedJob.metadata.title && (
                        <Typography variant="subtitle2" color="text.secondary">
                          {selectedJob.metadata.title}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Job ID: {selectedJob.job_id.substring(0, 8)}...
                      </Typography>
                    </Box>
                    
                    {/* Approval Status Badge - Only show if not failed */}
                    {selectedJob.metadata.status !== 'failed' && 
                     !((selectedJob.metadata as any).subjob_status?.failed && (selectedJob.metadata as any).subjob_status.failed > 0) &&
                     approvalsData?.data && approvalsData.data.total > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge 
                          badgeContent={approvalsData.data.pending} 
                          color="warning"
                          sx={{ mr: 2 }}
                        >
                          <VerifiedUser color="action" />
                        </Badge>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Approvals
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {approvalsData.data.total - approvalsData.data.pending} / {approvalsData.data.total} approved
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Content Type
                      </Typography>
                      <Chip
                        label={selectedJob.metadata.content_type}
                        size="small"
                        color="primary"
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={(() => {
                          const hasFailedSubjobs = (selectedJob.metadata as any).subjob_status?.failed && (selectedJob.metadata as any).subjob_status.failed > 0;
                          // If subjobs have failed, show "failed" instead of "waiting_for_approval"
                          if (hasFailedSubjobs && selectedJob.metadata.status === 'waiting_for_approval') {
                            return 'failed';
                          }
                          return selectedJob.metadata.status || 'completed';
                        })()}
                        size="small"
                        color={(() => {
                          const hasFailedSubjobs = (selectedJob.metadata as any).subjob_status?.failed && (selectedJob.metadata as any).subjob_status.failed > 0;
                          // If subjobs have failed, show error color instead of warning
                          if (hasFailedSubjobs && selectedJob.metadata.status === 'waiting_for_approval') {
                            return 'error';
                          }
                          return selectedJob.metadata.status === 'waiting_for_approval' ? 'warning' :
                                 selectedJob.metadata.status === 'failed' ? 'error' :
                                 'success';
                        })()}
                      />
                    </Grid>
                    {/* Resume Pipeline button - Hidden when subjobs have failed */}
                    {(() => {
                      const hasFailedSubjobs = (selectedJob.metadata as any).subjob_status?.failed && (selectedJob.metadata as any).subjob_status.failed > 0;
                      const isFailed = selectedJob.metadata.status === 'failed';
                      const isWaitingForApproval = selectedJob.metadata.status === 'waiting_for_approval';
                      
                      // Don't show resume button if subjobs have failed
                      if (hasFailedSubjobs) {
                        return null;
                      }
                      
                      return isWaitingForApproval && !isFailed ? (
                        <Grid size={{ xs: 12 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleResumePipeline(selectedJob.job_id)}
                            disabled={resumeJobMutation.isPending}
                            sx={{ mt: 2 }}
                          >
                            {resumeJobMutation.isPending ? 'Resuming...' : 'Resume Pipeline'}
                          </Button>
                        </Grid>
                      ) : null;
                    })()}
                  </Grid>
                </Box>

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

                {/* Job Hierarchy Tree */}
                {selectedJob && (
                  <Box sx={{ mb: 3 }}>
                    <Accordion defaultExpanded={false}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Job Hierarchy</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <JobHierarchyTree
                          jobId={selectedJob.job_id}
                          selectedJobId={selectedJob.job_id}
                          onJobClick={fetchSubjobDetails}
                        />
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                )}


                {/* Subjob Visualizer - Only show for parent jobs */}
                {selectedJob.subjobs && selectedJob.subjobs.length > 0 && !selectedJob.parent_job_id ? (
                  <Box sx={{ mb: 3 }}>
                    <Accordion defaultExpanded={true}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Subjobs</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <SubjobVisualizer 
                          jobResults={selectedJob}
                          approvalTimestamp={selectedJob.metadata.approved_at}
                          onSubjobClick={fetchSubjobDetails}
                          subjobApprovals={subjobApprovals}
                          subjobResults={subjobResults}
                        />
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ) : null}

                {/* Pending Approvals Section - Only show if not failed */}
                {selectedJob.metadata.status !== 'failed' && 
                 !((selectedJob.metadata as any).subjob_status?.failed && (selectedJob.metadata as any).subjob_status.failed > 0) &&
                 ((approvalsData?.data && approvalsData.data.pending > 0) || selectedJob.metadata.status === 'waiting_for_approval') ? (
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
                          onClick={() => {
                            router.push('/approvals');
                          }}
                        >
                          Go to Approvals Page
                        </Button>
                      </Box>
                      
                      {/* Show pending approvals for this job */}
                      {approvalsData?.data?.approvals && approvalsData.data.approvals.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                            Approvals for this job:
                          </Typography>
                          <List dense>
                            {approvalsData.data.approvals
                              .filter(a => a.status === 'pending')
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
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                      onClick={() => {
                                        router.push(`/approvals/${approval.id}`);
                                      }}
                                    >
                                      Review
                                    </Button>
                                  }
                                >
                                  <ListItemText
                                    primary={
                                      <Typography variant="body2" fontWeight="bold">
                                        {(approval.agent_name || 'Unknown Step')
                                          .replace(/_/g, ' ')
                                          .toUpperCase()}
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
                ) : null}

                <Divider sx={{ my: 3 }} />

                {/* Input Content Section */}
                {selectedJob.metadata && (
                  <Box sx={{ mb: 3 }}>
                    <Accordion defaultExpanded={false}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Description sx={{ color: '#2196f3' }} />
                          <Typography variant="h6">
                            Input Content
                          </Typography>
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
                                const response = await fetch(
                                  `${API_BASE_URL}/api/v1/results/jobs/${selectedJob.job_id}/steps/00_input.json/download`
                                );
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  const fileName = selectedJob.metadata.title || 
                                                  selectedJob.metadata.content_id || 
                                                  'input.json';
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
                          {(() => {
                            // Try to get input_content from various sources
                            const inputContent = 
                              selectedJob.metadata.input_content ||
                              (finalResult as any)?.input_content ||
                              (selectedJob as any)?.input_content;
                            
                            if (!inputContent) {
                              return (
                                <Typography variant="body2" color="text.secondary">
                                  No input content available
                                </Typography>
                              );
                            }
                            
                            const contentString = typeof inputContent === 'string' 
                              ? inputContent 
                              : JSON.stringify(inputContent, null, 2);
                            
                            return (
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
                                  {contentString}
                                </Box>
                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                  <Tooltip title="Copy to clipboard">
                                    <IconButton
                                      size="small"
                                      onClick={() => copyToClipboard(contentString, 'Input Content')}
                                    >
                                      <ContentCopy fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </>
                            );
                          })()}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                )}

                {/* Final Result Section */}
                {finalResult?.final_content && (
                  <Box sx={{ mb: 3 }}>
                    <Accordion defaultExpanded={false}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <CheckCircle sx={{ color: '#4caf50' }} />
                          <Typography variant="h6">
                            Output
                          </Typography>
                          <Chip
                            label="Completed"
                            size="small"
                            color="success"
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ mb: 2 }}>
                          <Tabs value={outputViewTab} onChange={(_, newValue) => setOutputViewTab(newValue)}>
                            <Tab label="Preview" />
                            <Tab label="Markdown" />
                          </Tabs>
                        </Box>
                        <Box
                          sx={{
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 2,
                            bgcolor: 'background.paper',
                            maxHeight: '600px',
                            overflow: 'auto',
                            position: 'relative',
                          }}
                        >
                          {outputViewTab === 0 ? (
                            // Preview View
                            selectedJob.metadata.content_type === 'blog_post' ? (
                              <Box
                                sx={{
                                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                                    mt: 2,
                                    mb: 1,
                                    fontWeight: 'bold',
                                  },
                                  '& p': {
                                    mb: 1.5,
                                    lineHeight: 1.8,
                                  },
                                  '& ul, & ol': {
                                    mb: 1.5,
                                    pl: 3,
                                  },
                                  '& li': {
                                    mb: 0.5,
                                  },
                                  '& code': {
                                    bgcolor: 'grey.100',
                                    px: 0.5,
                                    py: 0.25,
                                    borderRadius: 0.5,
                                    fontSize: '0.875em',
                                  },
                                  '& pre': {
                                    bgcolor: 'grey.100',
                                    p: 2,
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    mb: 1.5,
                                  },
                                  '& blockquote': {
                                    borderLeft: 3,
                                    borderColor: 'primary.main',
                                    pl: 2,
                                    ml: 0,
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                  },
                                }}
                                dangerouslySetInnerHTML={{ __html: finalResult.final_content }}
                              />
                            ) : (
                              <Box
                                component="pre"
                                sx={{
                                  bgcolor: 'grey.100',
                                  p: 2,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  fontSize: '0.875rem',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {typeof finalResult.final_content === 'string'
                                  ? finalResult.final_content
                                  : JSON.stringify(finalResult.final_content, null, 2)}
                              </Box>
                            )
                          ) : (
                            // Markdown View
                            <Box
                              sx={{
                                '& p': { mb: 1.5 },
                                '& h1, & h2, & h3, & h4': { mt: 2, mb: 1, fontWeight: 600 },
                                '& ul, & ol': { pl: 2, mb: 1.5 },
                                '& code': { 
                                  bgcolor: 'grey.200', 
                                  px: 0.5, 
                                  py: 0.25, 
                                  borderRadius: 0.5,
                                  fontSize: '0.875rem',
                                  fontFamily: 'monospace'
                                },
                                '& pre': {
                                  bgcolor: 'grey.100',
                                  p: 2,
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  mb: 1.5,
                                  '& code': {
                                    bgcolor: 'transparent',
                                    color: 'inherit',
                                    p: 0
                                  }
                                }
                              }}
                            >
                              {selectedJob.metadata.content_type === 'blog_post' ? (
                                <ReactMarkdown>
                                  {htmlToMarkdown(finalResult.final_content)}
                                </ReactMarkdown>
                              ) : (
                                <Box
                                  component="pre"
                                  sx={{
                                    bgcolor: 'grey.100',
                                    p: 2,
                                    borderRadius: 1,
                                    overflow: 'auto',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {typeof finalResult.final_content === 'string'
                                    ? finalResult.final_content
                                    : JSON.stringify(finalResult.final_content, null, 2)}
                                </Box>
                              )}
                            </Box>
                          )}
                          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                            <Tooltip title="Copy to clipboard">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const contentToCopy = outputViewTab === 0
                                    ? (selectedJob.metadata.content_type === 'blog_post' 
                                        ? finalResult.final_content 
                                        : (typeof finalResult.final_content === 'string'
                                            ? finalResult.final_content
                                            : JSON.stringify(finalResult.final_content, null, 2)))
                                    : (selectedJob.metadata.content_type === 'blog_post'
                                        ? htmlToMarkdown(finalResult.final_content)
                                        : (typeof finalResult.final_content === 'string'
                                            ? finalResult.final_content
                                            : JSON.stringify(finalResult.final_content, null, 2)));
                                  copyToClipboard(contentToCopy, 'Output');
                                }}
                              >
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Download />}
                            onClick={() => {
                              const blob = new Blob(
                                [typeof finalResult.final_content === 'string' 
                                  ? finalResult.final_content 
                                  : JSON.stringify(finalResult.final_content, null, 2)],
                                { type: selectedJob.metadata.content_type === 'blog_post' ? 'text/html' : 'application/json' }
                              );
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `final_result_${selectedJob.job_id.substring(0, 8)}.${selectedJob.metadata.content_type === 'blog_post' ? 'html' : 'json'}`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            }}
                          >
                            Download Final Result
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
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
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  Select a job to view details
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}


