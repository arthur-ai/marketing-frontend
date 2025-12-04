import type { JobResultsSummary, JobListItem } from './api';

/**
 * Extended JobMetadata interface with all properties used in the results page
 */
export interface JobMetadata {
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
  // Extended properties
  progress?: number;
  current_step?: string;
  failed_steps?: string[];
  pipeline_config?: {
    default_model?: string;
    step_configs?: Record<string, { model?: string; [key: string]: unknown }>;
    [key: string]: unknown;
  };
  platform?: string;
  platform_quality_scores?: Record<string, unknown>;
  input_content?: unknown;
  output_content_type?: string;
  email_type?: string;
}

/**
 * Extended JobResults interface with properly typed metadata
 */
export interface JobResults extends JobResultsSummary {
  metadata: JobMetadata;
  progress?: number;
  current_step?: string;
  status?: string;
}

/**
 * Type for subjob results record
 */
export type SubjobResults = Record<string, {
  step_results?: Record<string, unknown>;
  final_content?: string;
  metadata?: {
    step_info?: Array<{
      step_number?: number;
      step_name?: string;
      execution_time?: number;
      tokens_used?: number;
      status?: string;
      error_message?: string;
    }>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}>;

/**
 * Type for final result data
 */
export interface FinalResult {
  final_content?: string;
  subject_line?: string;
  input_content?: unknown;
  step_results?: Record<string, unknown>;
  results_by_platform?: Record<string, unknown>;
  variations?: Array<Record<string, unknown>>;
  metadata?: {
    step_info?: Array<{
      step_number?: number;
      step_name?: string;
      execution_time?: number;
      tokens_used?: number;
      status?: string;
      error_message?: string;
    }>;
    completed_at?: string;
    execution_time_seconds?: number;
    total_tokens_used?: number;
    [key: string]: unknown;
  };
  quality_warnings?: string[];
  [key: string]: unknown;
}

/**
 * Comparison modal types
 */
export type ComparisonType = 'input-output' | 'step' | null;

/**
 * Job response from API before transformation
 */
export interface JobResponse {
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
    title?: string;
    input_content?: {
      title?: string;
      [key: string]: unknown;
    };
    original_content_type?: string;
    resume_job_id?: string;
    [key: string]: unknown;
  };
}
