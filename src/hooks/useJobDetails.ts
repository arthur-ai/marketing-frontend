import { useState, useCallback } from 'react';
import { api, apiClient } from '@/lib/api';
import type { StepInfo, JobResultsSummary } from '@/types/api';
import type { JobResults } from '@/types/results';
import {
  extractStepInfoFromResult,
  aggregateSubjobSteps,
  getSubjobChain,
  normalizeResultStructure,
} from '@/utils/jobTransformers';

interface UseJobDetailsReturn {
  selectedJob: JobResults | null;
  error: string | null;
  fetchJobDetails: (jobId: string) => Promise<void>;
  fetchSubjobDetails: (subjobId: string) => Promise<void>;
  onStepDataAdd?: (key: string, value: unknown) => void;
}

interface UseJobDetailsOptions {
  jobs?: Array<{ job_id: string; status?: string }>;
  onFinalResultReset?: () => void;
  onFinalResultFetch?: (jobId: string) => Promise<void>;
  onStepDataAdd?: (key: string, value: unknown) => void;
}

export function useJobDetails(options: UseJobDetailsOptions = {}): UseJobDetailsReturn {
  const { jobs = [], onFinalResultReset, onFinalResultFetch, onStepDataAdd } = options;
  const [selectedJob, setSelectedJob] = useState<JobResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetailsInternal = useCallback(
    async (jobId: string, redirectToParent: boolean = true) => {
      try {
        // Reset final result when switching jobs
        onFinalResultReset?.();

        // First, check if this is a resume_pipeline job - if so, redirect to parent (unless explicitly disabled)
        if (redirectToParent) {
          const jobCheckResponse = await api.getJob(jobId);
          if (jobCheckResponse.status === 200) {
            const jobCheckData = jobCheckResponse.data;
            const jobCheck = jobCheckData.job;

            // If this is a resume_pipeline job or has original_job_id, fetch parent instead
            if (jobCheck.type === 'resume_pipeline' || jobCheck.metadata?.original_job_id) {
              const parentJobId =
                jobCheck.metadata?.original_job_id ||
                (jobCheck.result &&
                  typeof jobCheck.result === 'object' &&
                  (jobCheck.result as Record<string, unknown>).original_job_id);
              if (parentJobId && typeof parentJobId === 'string') {
                // Recursively fetch parent job details
                await fetchJobDetailsInternal(parentJobId, true);
                return;
              }
            }
          }
        }

        // Try results API first (has step details), fallback to jobs API
        const response = await apiClient.get(`/v1/results/jobs/${jobId}`).catch(() => null);
        if (!response || response.status !== 200) {
          // Fallback: Try to get job.result if job is completed
          const jobResponse = await api.getJob(jobId);
          if (jobResponse.status !== 200) {
            throw new Error('Failed to fetch job details');
          }
          const jobData = jobResponse.data;
          const job = jobData.job;

          // Get content type - use original_content_type for resume_pipeline jobs
          const contentType =
            job.type === 'resume_pipeline'
              ? (job.metadata?.original_content_type as string | undefined) || job.type
              : job.type;

          // If job has result, try to extract step info from it
          let steps: StepInfo[] = [];
          let performanceMetrics: JobResultsSummary['performance_metrics'] = undefined;
          let qualityWarnings: string[] | undefined = undefined;

          if (job.result && job.status === 'completed') {
            const actualResult = normalizeResultStructure(job.result);

            if (actualResult && typeof actualResult === 'object') {
              const resultObj = actualResult as Record<string, unknown>;
              const resultMetadata = (resultObj.metadata as Record<string, unknown>) || {};
              const stepInfo = (resultMetadata.step_info as Array<{
                step_number?: number;
                step_name?: string;
                execution_time?: number;
                tokens_used?: number;
                status?: string;
                error_message?: string;
              }>) || [];

              const stepResults = (resultObj.step_results as Record<string, unknown>) || {};

              steps = stepInfo.map((step, idx) => {
                const stepName = step.step_name || `step_${idx}`;
                const stepResult = stepResults[stepName];

                // Pre-populate stepData if step_results are available
                if (stepResult && onStepDataAdd) {
                  const cacheKey = `${jobId}_step_${step.step_number ?? idx}.json`;
                  onStepDataAdd(cacheKey, stepResult);
                }

                return {
                  filename: `step_${step.step_number ?? idx}.json`,
                  step_number: step.step_number ?? idx,
                  step_name: stepName,
                  timestamp:
                    (resultMetadata.completed_at as string) ||
                    job.completed_at ||
                    new Date().toISOString(),
                  has_result: stepName in stepResults,
                  file_size: 0,
                  execution_time: step.execution_time,
                  tokens_used: step.tokens_used,
                  status: step.status || 'completed',
                  error_message: step.error_message,
                  job_id: jobId,
                };
              });

              performanceMetrics = {
                execution_time_seconds: resultMetadata.execution_time_seconds as number | undefined,
                total_tokens_used: resultMetadata.total_tokens_used as number | undefined,
                step_info: stepInfo,
              };

              qualityWarnings = (resultObj.quality_warnings as string[] | undefined) || [];
            }
          }

          // Follow the chain of resume_job_id to get all subjobs
          const subjobIds = await getSubjobChain(job.metadata?.resume_job_id as string | undefined, (id) =>
            api.getJob(id)
          );

          // If parent job has subjobs but no steps, aggregate steps from subjobs
          if (subjobIds.length > 0 && steps.length === 0) {
            try {
              const allSteps: StepInfo[] = [];
              // Fetch steps from each subjob
              for (const subjobId of subjobIds) {
                try {
                  const subjobResponse = await apiClient
                    .get(`/v1/results/jobs/${subjobId}`)
                    .catch(() => null);
                  if (subjobResponse && subjobResponse.status === 200) {
                    const subjobData = subjobResponse.data;
                    if (subjobData.steps && Array.isArray(subjobData.steps) && subjobData.steps.length > 0) {
                      // Add job_id to each step to identify which subjob it belongs to
                      const subjobSteps = subjobData.steps.map((step: StepInfo) => ({
                        ...step,
                        job_id: subjobId,
                      }));
                      allSteps.push(...subjobSteps);
                    }
                  }
                } catch (err) {
                  console.error(`Failed to fetch steps from subjob ${subjobId}:`, err);
                }
              }

              if (allSteps.length > 0) {
                steps = aggregateSubjobSteps(
                  allSteps.map((step) => ({
                    subjobId: step.job_id || '',
                    steps: [step],
                  }))
                );

                // Pre-populate stepData from subjob results
                for (const subjobId of subjobIds) {
                  try {
                    const subjobResultResponse = await api.getJobResult(subjobId);
                    if (subjobResultResponse.status === 200) {
                      const subjobResultData = subjobResultResponse.data;
                      const subjobActualResult = normalizeResultStructure(subjobResultData.result);

                      if (
                        subjobActualResult &&
                        typeof subjobActualResult === 'object' &&
                        onStepDataAdd
                      ) {
                        const resultObj = subjobActualResult as Record<string, unknown>;
                        const stepResults = (resultObj.step_results as Record<string, unknown>) || {};
                        steps
                          .filter((step) => step.job_id === subjobId)
                          .forEach((step) => {
                            const stepName = step.step_name;
                            const stepResult = stepResults[stepName];
                            if (stepResult) {
                              const cacheKey = `${subjobId}_${step.filename}`;
                              onStepDataAdd(cacheKey, stepResult);
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

          const jobResults: JobResults = {
            job_id: job.id,
            metadata: {
              job_id: job.id,
              content_type: contentType,
              content_id: job.content_id,
              started_at: job.started_at,
              completed_at: job.completed_at,
              status: job.status,
              title:
                (job.metadata?.title as string | undefined) ||
                ((job.metadata?.input_content as Record<string, unknown>)?.title as string | undefined),
              parent_job_id: job.metadata?.original_job_id as string | undefined,
              subjob_ids: subjobIds,
              resume_job_id: job.metadata?.resume_job_id as string | undefined,
              original_job_id: job.metadata?.original_job_id as string | undefined,
            },
            steps: steps,
            total_steps: steps.length,
            subjobs: subjobIds.length > 0 ? subjobIds : undefined,
            parent_job_id: job.metadata?.original_job_id as string | undefined,
            performance_metrics: performanceMetrics,
            quality_warnings: qualityWarnings,
          };
          setSelectedJob(jobResults);

          // Fetch final result if job is completed
          const jobStatus = job.status || 'completed';
          if (jobStatus === 'completed' || jobStatus !== 'waiting_for_approval') {
            await onFinalResultFetch?.(jobId);
          } else {
            onFinalResultReset?.();
          }
        } else {
          const data = response.data;
          // Ensure status is preserved from job list if not in results
          const jobFromList = jobs.find((j) => j.job_id === jobId);
          if (jobFromList?.status) {
            data.metadata = {
              ...data.metadata,
              status: jobFromList.status, // Use status from job list
            };
          }
          // Fix content type for resume_pipeline jobs - use original_content_type if available
          if (data.metadata?.content_type === 'resume_pipeline') {
            // Try to get original_content_type from the job itself
            const jobResponse = await api.getJob(jobId);
            if (jobResponse.status === 200) {
              const jobData = jobResponse.data;
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
              const jobResponse = await api.getJob(jobId);
              if (jobResponse.status === 200) {
                const jobData = jobResponse.data;
                const job = jobData.job;
                if (job.metadata?.resume_job_id) {
                  jobResults.metadata.resume_job_id = job.metadata.resume_job_id as string;
                }
              }
            } catch (err) {
              console.error('Failed to fetch job details for resume_job_id:', err);
            }
          }

          // Follow the chain of resume_job_id to get all subjobs if not already in jobResults
          let allSubjobIds = jobResults.subjobs || [];
          if (allSubjobIds.length === 0 && jobResults.metadata?.resume_job_id) {
            allSubjobIds = await getSubjobChain(jobResults.metadata.resume_job_id, (id) =>
              api.getJob(id)
            );
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
                  const subjobResponse = await apiClient
                    .get(`/v1/results/jobs/${subjobId}`)
                    .catch(() => null);
                  if (subjobResponse && subjobResponse.status === 200) {
                    const subjobData = subjobResponse.data;
                    if (subjobData.steps && Array.isArray(subjobData.steps) && subjobData.steps.length > 0) {
                      // Add job_id to each step to identify which subjob it belongs to
                      const subjobSteps = subjobData.steps.map((step: StepInfo) => ({
                        ...step,
                        job_id: subjobId,
                      }));
                      allSteps.push(...subjobSteps);
                    }
                  }
                } catch (err) {
                  console.error(`Failed to fetch steps from subjob ${subjobId}:`, err);
                }
              }

              if (allSteps.length > 0) {
                const aggregated = aggregateSubjobSteps(
                  allSteps.map((step) => ({
                    subjobId: step.job_id || '',
                    steps: [step],
                  }))
                );
                jobResults.steps = aggregated;
                jobResults.total_steps = aggregated.length;
              }
            } catch (err) {
              console.error('Failed to aggregate steps from subjobs:', err);
            }
          }

          // Pre-populate stepData from step_results if available in the results
          if (jobResults.steps && jobResults.steps.length > 0 && onStepDataAdd) {
            // Try to get step results from job result API
            try {
              const resultResponse = await api.getJobResult(jobId);
              if (resultResponse.status === 200) {
                const resultData = resultResponse.data;
                const actualResult = normalizeResultStructure(resultData.result);

                if (actualResult && typeof actualResult === 'object') {
                  const resultObj = actualResult as Record<string, unknown>;
                  const stepResults = (resultObj.step_results as Record<string, unknown>) || {};
                  jobResults.steps.forEach((step) => {
                    const stepName = step.step_name;
                    const stepResult = stepResults[stepName];
                    if (stepResult) {
                      const cacheKey = `${jobId}_${step.filename}`;
                      onStepDataAdd(cacheKey, stepResult);
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
                  const subjobResultResponse = await api.getJobResult(subjobId);
                  if (subjobResultResponse.status === 200) {
                    const subjobResultData = subjobResultResponse.data;
                    const subjobActualResult = normalizeResultStructure(subjobResultData.result);

                    if (subjobActualResult && typeof subjobActualResult === 'object') {
                      const resultObj = subjobActualResult as Record<string, unknown>;
                      const stepResults = (resultObj.step_results as Record<string, unknown>) || {};
                      // Find steps that belong to this subjob
                      jobResults.steps
                        .filter((step) => step.job_id === subjobId)
                        .forEach((step) => {
                          const stepName = step.step_name;
                          const stepResult = stepResults[stepName];
                          if (stepResult) {
                            const cacheKey = `${subjobId}_${step.filename}`;
                            onStepDataAdd(cacheKey, stepResult);
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
            await onFinalResultFetch?.(jobId);
          } else {
            onFinalResultReset?.();
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job details');
      }
    },
    [jobs, onFinalResultReset, onFinalResultFetch, onStepDataAdd]
  );

  // Fetch details for a specific job (public function that redirects to parent for subjobs)
  const fetchJobDetails = useCallback(
    async (jobId: string) => {
      await fetchJobDetailsInternal(jobId, true);
    },
    [fetchJobDetailsInternal]
  );

  // Fetch subjob details directly (without redirecting to parent)
  const fetchSubjobDetails = useCallback(
    async (subjobId: string) => {
      await fetchJobDetailsInternal(subjobId, false);
    },
    [fetchJobDetailsInternal]
  );

  return {
    selectedJob,
    error,
    fetchJobDetails,
    fetchSubjobDetails,
    onStepDataAdd,
  };
}
