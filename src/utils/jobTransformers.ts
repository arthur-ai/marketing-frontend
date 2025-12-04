import type { JobListItem, StepInfo } from '@/types/api';
import type { JobResponse } from '@/types/results';

/**
 * Normalize result structure - handle pipeline_result vs result nesting
 */
export function normalizeResultStructure(result: unknown): unknown {
  if (!result || typeof result !== 'object') {
    return result;
  }

  const resultObj = result as Record<string, unknown>;
  
  // Check for pipeline_result first (new structure)
  if (resultObj.pipeline_result) {
    return resultObj.pipeline_result;
  }
  
  // Fallback to nested result (old structure)
  if (resultObj.result) {
    return resultObj.result;
  }
  
  return result;
}

/**
 * Transform JobResponse to JobListItem format
 */
export function transformJobResponseToListItem(job: JobResponse): JobListItem {
  return {
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
    chain_status: job.metadata?.chain_status as
      | 'all_completed'
      | 'in_progress'
      | 'blocked'
      | 'failed'
      | undefined,
  };
}

/**
 * Extract step info from result structure
 */
export function extractStepInfoFromResult(
  result: unknown,
  jobId: string,
  completedAt?: string
): StepInfo[] {
  const normalizedResult = normalizeResultStructure(result);
  
  if (!normalizedResult || typeof normalizedResult !== 'object') {
    return [];
  }

  const resultObj = normalizedResult as Record<string, unknown>;
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

  return stepInfo.map((step, idx) => {
    const stepName = step.step_name || `step_${idx}`;
    
    return {
      filename: `step_${step.step_number ?? idx}.json`,
      step_number: step.step_number ?? idx,
      step_name: stepName,
      timestamp: (resultMetadata.completed_at as string) || completedAt || new Date().toISOString(),
      has_result: stepName in stepResults,
      file_size: 0,
      execution_time: step.execution_time,
      tokens_used: step.tokens_used,
      status: step.status || 'completed',
      error_message: step.error_message,
      job_id: jobId,
    };
  });
}

/**
 * Aggregate steps from multiple subjobs
 */
export function aggregateSubjobSteps(
  subjobSteps: Array<{ subjobId: string; steps: StepInfo[] }>
): StepInfo[] {
  const allSteps: StepInfo[] = [];
  
  for (const { subjobId, steps } of subjobSteps) {
    const subjobStepsWithId = steps.map((step) => ({
      ...step,
      job_id: subjobId,
    }));
    allSteps.push(...subjobStepsWithId);
  }
  
  // Sort steps by timestamp
  allSteps.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });
  
  return allSteps;
}

/**
 * Follow the chain of resume_job_id to get all subjob IDs
 */
export async function getSubjobChain(
  startJobId: string | undefined,
  getJob: (jobId: string) => Promise<{
    status: number;
    data: { job: { metadata?: { resume_job_id?: string } } };
  }>
): Promise<string[]> {
  const subjobIds: string[] = [];
  let currentJobId = startJobId;
  const visited = new Set<string>();

  while (currentJobId && !visited.has(currentJobId)) {
    visited.add(currentJobId);
    subjobIds.push(currentJobId);

    try {
      const nextJobResponse = await getJob(currentJobId);
      if (nextJobResponse.status === 200) {
        const nextJob = nextJobResponse.data.job;
        currentJobId = nextJob?.metadata?.resume_job_id;
      } else {
        break;
      }
    } catch (err) {
      console.error(`Failed to fetch next job in chain ${currentJobId}:`, err);
      break;
    }
  }

  return subjobIds;
}
