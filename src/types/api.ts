// API Response Types based on your backend models

// Job Management Types
export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface PipelineStepInfo {
  step_name: string
  step_number: number
  status: string
  execution_time?: number
  tokens_used?: number
  error_message?: string
}

export interface Job {
  id: string
  type: string
  status: JobStatus
  content_id: string
  created_at: string
  started_at?: string
  completed_at?: string
  progress: number
  current_step?: string
  result?: Record<string, any>
  error?: string
  metadata: Record<string, any>
  // Subjob relationships
  subjobs?: string[]
  parent_job_id?: string
  // Performance metrics (from result.metadata)
  performance_metrics?: {
    execution_time_seconds?: number
    total_tokens_used?: number
    step_info?: PipelineStepInfo[]
  }
  // Quality warnings (from result.quality_warnings)
  quality_warnings?: string[]
}

export interface JobSubmissionResponse {
  success: boolean
  message: string
  job_id: string
  content_id: string
  status_url: string
}

export interface JobResponse {
  success: boolean
  message: string
  job: Job
}

export interface JobStatusResponse {
  success: boolean
  message: string
  job_id: string
  status: JobStatus
  progress: number
  current_step?: string
  result?: Record<string, any>
  error?: string
}

export interface JobListResponse {
  success: boolean
  message: string
  jobs: Job[]
  total: number
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  service: string
  version: string
  checks: {
    config_loaded: boolean
    prompts_dir_exists: boolean
  }
}

export interface ReadyResponse {
  status: 'ready' | 'not_ready'
  service: string
  checks: {
    config_loaded: boolean
    prompts_dir_exists: boolean
  }
}

export interface ContentSource {
  name: string
  type: string
  status: string
  healthy: boolean
  last_check: string | null
  metadata: {
    enabled: boolean
    priority: number
    path: string
  }
}

export interface ContentItem {
  id: string
  title: string
  content: string
  snippet: string
  created_at: string
  source_url?: string
  metadata: Record<string, any>
}

// Base content fields
interface BaseContent {
  id: string
  title: string
  content: string
  snippet: string
  created_at: string
  source_url?: string
  metadata: Record<string, any>
}

// Blog Post Content
interface BlogPostContent extends BaseContent {
  type: 'blog_post'
  author: string
  tags: string[]
  category: string
  word_count: number
}

// Transcript Content
interface TranscriptContent extends BaseContent {
  type: 'transcript'
  speakers: string[]
  duration: number
  transcript_type: string
}

// Release Notes Content
interface ReleaseNotesContent extends BaseContent {
  type: 'release_notes'
  version: string
  release_date: string
  changes: string[]
  features: string[]
  bug_fixes: string[]
}

export type ContentContext = BlogPostContent | TranscriptContent | ReleaseNotesContent

export interface AnalyzeRequest {
  content: ContentContext
  options?: Record<string, any>
}

export interface PipelineRequest {
  content: ContentContext
  options?: {
    skip_seo?: boolean
    lang?: string
    [key: string]: any
  }
}

export interface ContentAnalysisResponse {
  success: boolean
  message: string
  analysis: any
  content_id: string
}

export interface PipelineResult {
  pipeline_status: string
  step_results: Record<string, any>
  final_content: any
  quality_metrics: Record<string, number>
  performance_analysis: Record<string, any>
  error_log: string[]
  recommendations: string[]
  next_steps: string[]
  // Step-by-step results based on pipeline.yml
  content_analysis_result?: any
  seo_keywords_result?: any
  marketing_brief_result?: any
  article_result?: any
  seo_optimized_result?: any
  suggested_links_result?: any
  formatted_content_result?: any
  final_content_result?: any
}

export interface PipelineResponse {
  success: boolean
  message: string
  result: PipelineResult
  content_id: string
}

export interface ContentSourceListResponse {
  success: boolean
  message: string
  sources: ContentSource[]
}

export interface ContentSourceResponse {
  success: boolean
  message: string
  source: {
    name: string
    type: string
    status: string
    last_checked: string | null
    config: {
      enabled: boolean
      priority: number
      metadata: Record<string, any>
    }
  }
}

export interface ContentFetchResponse {
  success: boolean
  message: string
  content_items: ContentItem[]
  total_count: number
  source_name: string
  error_message?: string
}

export interface SystemInfo {
  service: string
  version: string
  python_version: string
  platform: string
  environment: {
    debug: boolean
    log_level: string
    template_version: string
  }
  configuration: {
    pipeline_loaded: boolean
    prompts_dir_exists: boolean
    prompts_dir: string
  }
}

export interface FileUploadResponse {
  success: boolean
  message: string
  file_id: string
  filename: string
  size: number
  content_type: 'blog_post' | 'transcript' | 'release_notes'
  upload_path: string
  processed_path: string
}

export interface FileUploadStatusResponse {
  file_id: string
  status: 'pending' | 'processing' | 'processed' | 'failed'
  message: string
}

// Processor-specific request types
export type OutputContentType = 'blog_post' | 'press_release' | 'case_study' | 'social_media_post'
export type SocialMediaPlatform = 'linkedin' | 'hackernews' | 'email'
export type EmailType = 'newsletter' | 'promotional'

export interface BlogProcessorRequest {
  content: BlogPostContent
  output_content_type?: OutputContentType
  social_media_platform?: SocialMediaPlatform
  email_type?: EmailType
  options?: Record<string, any>
}

export interface ReleaseNotesProcessorRequest {
  content: ReleaseNotesContent
  output_content_type?: OutputContentType
  options?: Record<string, any>
}

export interface TranscriptProcessorRequest {
  content: TranscriptContent
  output_content_type?: OutputContentType
  options?: Record<string, any>
}

// Processor-specific response types
export interface ProcessorResponse {
  success: boolean
  message: string
  content_id: string
  content_type: string
  timestamp: string
}

export interface BlogProcessorResponse extends ProcessorResponse {
  blog_type?: string
  metadata?: Record<string, any>
  pipeline_result?: Record<string, any>
  validation?: string
  processing_steps_completed?: string[]
}

export interface ReleaseNotesProcessorResponse extends ProcessorResponse {
  release_type?: string
  metadata?: Record<string, any>
  pipeline_result?: Record<string, any>
  validation?: string
  processing_steps_completed?: string[]
}

export interface TranscriptProcessorResponse extends ProcessorResponse {
  transcript_type?: string
  metadata?: Record<string, any>
  pipeline_result?: Record<string, any>
  validation?: string
  processing_steps_completed?: string[]
}

// Approval System Types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'modified'
export type ApprovalDecision = 'approve' | 'reject' | 'modify'

export interface SelectedKeywords {
  primary?: string[]
  secondary?: string[]
  lsi?: string[]
  long_tail?: string[]
}

export interface ApprovalRequest {
  id: string
  job_id: string
  pipeline_step: string
  step_name: string
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  status: ApprovalStatus
  user_comment?: string
  modified_output?: Record<string, unknown>
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  confidence_score?: number
  suggestions?: string[]
}

export interface ApprovalListItem {
  id: string
  job_id: string
  agent_name: string
  step_name: string
  pipeline_step?: string
  status: ApprovalStatus
  created_at: string
  reviewed_at?: string
  input_title?: string
}

export interface PendingApprovalsResponse {
  approvals: ApprovalListItem[]
  total: number
  pending: number
}

export interface ApprovalDecisionRequest {
  decision: ApprovalDecision
  comment?: string
  modified_output?: Record<string, unknown>
  selected_keywords?: SelectedKeywords
  main_keyword?: string
  reviewed_by?: string
  auto_retry?: boolean
}

export interface ApprovalSettings {
  require_approval: boolean
  approval_agents: string[]
  auto_approve_threshold?: number
  timeout_seconds?: number
}

export interface ApprovalStats {
  total_requests: number
  pending: number
  approved: number
  rejected: number
  modified: number
  avg_review_time_seconds?: number
  approval_rate: number
}

// Analytics Types
export interface DashboardStats {
  total_content: number
  total_jobs: number
  jobs_completed: number
  jobs_processing: number
  jobs_failed: number
  jobs_queued: number
  success_rate: number
  content_change_percent?: number
  jobs_change_percent?: number
  success_rate_change_percent?: number
}

export interface PipelineStats {
  total_runs: number
  completed: number
  in_progress: number
  failed: number
  queued: number
  avg_duration_seconds?: number
  success_rate: number
  completed_change_percent?: number
  total_change_percent?: number
}

export interface ContentSourceStats {
  source_name: string
  total_items: number
  active: boolean
}

export interface ContentStats {
  total_content: number
  by_source: ContentSourceStats[]
  active_sources: number
}

export interface RecentActivityItem {
  job_id: string
  job_type: string
  title?: string
  status: string
  progress: number
  created_at: string
  completed_at?: string
  error?: string
}

export interface RecentActivity {
  activities: RecentActivityItem[]
  total: number
}

export interface TrendDataPoint {
  date: string
  total_jobs: number
  completed: number
  failed: number
  success_rate: number
}

export interface TrendData {
  data_points: TrendDataPoint[]
  start_date: string
  end_date: string
  days: number
}

// Results API Types
export interface StepInfo {
  execution_context_id?: string;
  root_job_id?: string;
  filename: string
  step_number: number
  step_name: string
  timestamp: string
  has_result: boolean
  file_size: number
  job_id?: string
  execution_time?: number
  tokens_used?: number
  status?: string
  error_message?: string
}

export interface JobResultsSummary {
  job_id: string
  metadata: Record<string, any>
  steps: StepInfo[]
  total_steps: number
  subjobs?: string[]
  parent_job_id?: string
  performance_metrics?: {
    execution_time_seconds?: number
    total_tokens_used?: number
    step_info?: PipelineStepInfo[]
  }
  quality_warnings?: string[]
}

export interface JobListItem {
  job_id: string
  content_type?: string
  content_id?: string
  started_at?: string
  completed_at?: string
  step_count: number
  created_at?: string
  status?: string
  subjob_count?: number
  subjob_status?: {
    total: number
    completed: number
    pending: number
    processing: number
    waiting_for_approval: number
    failed: number
  }
  chain_status?: 'all_completed' | 'in_progress' | 'blocked' | 'failed'
}

// Internal Docs Configuration
export interface ScannedDocument {
  title: string
  url: string
  scanned_at: string
  relevance_score?: number
}

export interface ScannedDocumentMetadata {
  content_text?: string
  content_summary?: string
  word_count?: number
  headings: string[]
  sections: any[]
  content_type?: string
  extracted_keywords: string[]
  topics: string[]
  categories: string[]
  internal_links_found: Array<{ anchor_text: string; target_url: string }>
  anchor_text_patterns: string[]
  outbound_link_count: number
  meta_description?: string
  meta_keywords?: string[]
  canonical_url?: string
  author?: string
  last_modified?: string
  language?: string
  reading_time_minutes?: number
  readability_score?: number
  completeness_score?: number
}

export interface ScannedDocumentDB {
  id?: number
  title: string
  url: string
  scanned_at: string
  last_scanned_at?: string
  metadata: ScannedDocumentMetadata
  is_active: boolean
  scan_count: number
  relevance_score?: number
  related_documents: string[]
}

export interface DocumentFilters {
  keywords?: string
  category?: string
  content_type?: string
  date_from?: string
  date_to?: string
  word_count_min?: number
  word_count_max?: number
  has_internal_links?: boolean
}

export interface BulkOperationRequest {
  urls: string[]
}

export interface BulkCategoryUpdateRequest {
  urls: string[]
  categories: string[]
}

export interface InternalDocsConfig {
  scanned_documents: ScannedDocument[]
  commonly_referenced_pages: string[]
  commonly_referenced_categories: string[]
  anchor_phrasing_patterns: string[]
  interlinking_rules: Record<string, any>
  version: string
  created_at: string
  updated_at: string
  is_active: boolean
}

// Design Kit Configuration
// Step Execution Types
export interface StepInfo {
  step_name: string
  step_number: number
  description?: string
}

export interface StepListResponse {
  steps: StepInfo[]
}

export interface StepRequirementsResponse {
  step_name: string
  step_number: number
  required_context_keys: string[]
  descriptions: Record<string, string>
}

export interface StepExecutionRequest {
  content: Record<string, any>
  context: Record<string, any>
}

export interface StepExecutionResponse {
  step_name: string
  job_id: string
  status: string
  message: string
}

export interface DesignKitConfig {
  // Visual Design
  visual_components?: Array<Record<string, string>>
  color_scheme?: Record<string, string>
  typography?: Record<string, string>
  layout_suggestions?: string[]
  hero_image_concept?: string
  accessibility_notes?: string[]
  
  // Voice & Tone
  voice_adjectives: string[]
  point_of_view: string
  sentence_length_tempo: string
  lexical_preferences: string[]
  
  // Structure
  section_order: string[]
  heading_depth: string
  list_usage_preference: string
  paragraph_length_range: { min: number; max: number }
  include_tldr: boolean
  include_summary: boolean
  
  // SEO Patterns
  title_format: string
  meta_description_style: string
  slug_casing: string
  tag_conventions: string[]
  internal_link_anchor_style: string
  external_citation_style: string
  
  // CTA Patterns
  cta_language: string[]
  cta_positions: string[]
  cta_verbs: string[]
  typical_link_targets: string[]
  
  // Compliance & Brand
  must_use_names_terms: string[]
  prohibited_phrases: string[]
  disclaimer_boilerplate?: string
  date_format: string
  numbers_formatting_rules: Record<string, string>
  
  // Interlinking Rules
  commonly_referenced_pages: string[]
  commonly_referenced_categories: string[]
  anchor_phrasing_patterns: string[]
  
  // Attribution
  author_name_style: string
  bio_length_range: { min: number; max: number }
  sign_off_patterns: string[]
  
  // Quant/Targets
  word_count_range: { min: number; max: number }
  heading_density: string
  keyword_density_band: string
  
  // Reusable Snippets
  opening_lines: string[]
  transition_sentences: string[]
  proof_statements: string[]
  conclusion_frames: string[]
  common_faqs: Array<{ question: string; answer: string }>
  
  // Content Type Variations
  content_type_configs?: Record<string, Record<string, any>>
  
  // Metadata
  version: string
  created_at: string
  updated_at: string
  is_active: boolean
}
