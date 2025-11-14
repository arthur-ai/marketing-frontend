import axios, { AxiosResponse } from 'axios'
import type { 
  HealthResponse, 
  ReadyResponse, 
  AnalyzeRequest, 
  PipelineRequest, 
  ContentAnalysisResponse, 
  PipelineResponse, 
  ContentSourceListResponse, 
  ContentSourceResponse, 
  ContentFetchResponse,
  SystemInfo,
  FileUploadResponse,
  FileUploadStatusResponse,
  BlogProcessorRequest,
  JobSubmissionResponse,
  ReleaseNotesProcessorRequest,
  TranscriptProcessorRequest,
  JobResponse,
  JobStatusResponse,
  JobListResponse,
  ApprovalRequest,
  ApprovalDecisionRequest,
  PendingApprovalsResponse,
  ApprovalStats,
  ApprovalSettings,
  DashboardStats,
  PipelineStats,
  ContentStats,
  RecentActivity,
  TrendData,
  InternalDocsConfig,
  DesignKitConfig,
  StepListResponse,
  StepRequirementsResponse,
  StepExecutionRequest,
  StepExecutionResponse
} from '@/types/api'

// Use relative URL for same-domain deployment, or absolute URL for development/cross-domain
// If NEXT_PUBLIC_BACKEND_API_BASE_URL is set, use it (for development or different domains)
// Otherwise, use relative path '/api' (for production same-domain deployment)
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || '/api'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout for long-running pipeline operations
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API endpoints that match your backend
export const api = {
  // Health & Status
  health: (): Promise<AxiosResponse<HealthResponse>> => 
    apiClient.get('/v1/health'),
  
  ready: (): Promise<AxiosResponse<ReadyResponse>> => 
    apiClient.get('/v1/ready'),
  
  // System Info
  getSystemInfo: (): Promise<AxiosResponse<SystemInfo>> => 
    apiClient.get('/v1/system/info'),
  
  // Content Analysis
  analyzeContent: (request: AnalyzeRequest): Promise<AxiosResponse<ContentAnalysisResponse>> => 
    apiClient.post('/v1/analyze', request),
  
  // Pipeline Execution (Auto-routing - detects content type)
  runPipeline: (request: PipelineRequest): Promise<AxiosResponse<PipelineResponse>> => 
    apiClient.post('/v1/pipeline', request),
  
  // Deterministic Processor Endpoints (Direct - Faster & More Predictable)
  // These now return job IDs immediately for async processing
  processBlog: (request: BlogProcessorRequest): Promise<AxiosResponse<JobSubmissionResponse>> => 
    apiClient.post('/v1/process/blog', request),
  
  processReleaseNotes: (request: ReleaseNotesProcessorRequest): Promise<AxiosResponse<JobSubmissionResponse>> => 
    apiClient.post('/v1/process/release-notes', request),
  
  processTranscript: (request: TranscriptProcessorRequest): Promise<AxiosResponse<JobSubmissionResponse>> => 
    apiClient.post('/v1/process/transcript', request),
  
  // Job Management
  listJobs: (jobType?: string, status?: string, limit = 50): Promise<AxiosResponse<JobListResponse>> => 
    apiClient.get('/v1/jobs', { params: { job_type: jobType, status, limit } }),
  
  getJob: (jobId: string): Promise<AxiosResponse<JobResponse>> => 
    apiClient.get(`/v1/jobs/${jobId}`),
  
  getJobStatus: (jobId: string): Promise<AxiosResponse<JobStatusResponse>> => 
    apiClient.get(`/v1/jobs/${jobId}/status`),
  
  getJobResult: (jobId: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/jobs/${jobId}/result`),
  
  // Pipeline Step Execution
  getPipelineSteps: (): Promise<AxiosResponse<StepListResponse>> => 
    apiClient.get('/v1/pipeline/steps'),
  
  getStepRequirements: (stepName: string): Promise<AxiosResponse<StepRequirementsResponse>> => 
    apiClient.get(`/v1/pipeline/steps/${stepName}/requirements`),
  
  executePipelineStep: (stepName: string, request: StepExecutionRequest): Promise<AxiosResponse<StepExecutionResponse>> => 
    apiClient.post(`/v1/pipeline/steps/${stepName}/execute`, request),
  
  getStepResult: (jobId: string, stepName: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/results/jobs/${jobId}/steps/by-name/${stepName}`),
  
  cancelJob: (jobId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => 
    apiClient.delete(`/v1/jobs/${jobId}`),
  
  resumeJob: (jobId: string): Promise<AxiosResponse<{ success: boolean; message: string; original_job_id: string; resume_job_id: string; resuming_from_step: number; resuming_from_step_name: string }>> => 
    apiClient.post(`/v1/jobs/${jobId}/resume`),
  
  // Content Sources
  getContentSources: (): Promise<AxiosResponse<ContentSourceListResponse>> => 
    apiClient.get('/v1/content-sources'),
  
  getSourceStatus: (sourceName: string): Promise<AxiosResponse<ContentSourceResponse>> => 
    apiClient.get(`/v1/content-sources/${sourceName}/status`),
  
  fetchSourceContent: (sourceName: string, limit = 10): Promise<AxiosResponse<ContentFetchResponse>> => 
    apiClient.post(`/v1/content-sources/${sourceName}/fetch?limit=${limit}&include_cached=true`),
  
  // File Upload
  uploadFile: (formData: FormData): Promise<AxiosResponse<FileUploadResponse>> => 
    apiClient.post('/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  uploadFromUrl: (url: string, contentType = 'blog_post'): Promise<AxiosResponse<FileUploadResponse>> => 
    apiClient.post('/v1/upload/from-url', { url, content_type: contentType }),
  
  getUploadStatus: (fileId: string): Promise<AxiosResponse<FileUploadStatusResponse>> => 
    apiClient.get(`/v1/upload/status/${fileId}`),
  
  // Approvals
  getPendingApprovals: (jobId?: string): Promise<AxiosResponse<PendingApprovalsResponse>> => 
    apiClient.get('/v1/approvals/pending', { params: { job_id: jobId } }),
  
  getApproval: (approvalId: string): Promise<AxiosResponse<ApprovalRequest>> => 
    apiClient.get(`/v1/approvals/${approvalId}`),
  
  decideApproval: (approvalId: string, decision: ApprovalDecisionRequest): Promise<AxiosResponse<ApprovalRequest>> => 
    apiClient.post(`/v1/approvals/${approvalId}/decide`, decision),
  
  getJobApprovals: (jobId: string, status?: string): Promise<AxiosResponse<PendingApprovalsResponse>> => 
    apiClient.get(`/v1/approvals/job/${jobId}`, { params: { status } }),
  
  getApprovalStats: (): Promise<AxiosResponse<ApprovalStats>> => 
    apiClient.get('/v1/approvals/stats'),
  
  getApprovalSettings: (): Promise<AxiosResponse<ApprovalSettings>> => 
    apiClient.get('/v1/approvals/settings'),
  
  updateApprovalSettings: (settings: ApprovalSettings): Promise<AxiosResponse<ApprovalSettings>> => 
    apiClient.post('/v1/approvals/settings', settings),
  
  retryStep: (approvalId: string): Promise<AxiosResponse<{ job_id: string; step_name: string; status: string; message: string; retry_attempt: number; approval_id: string }>> => 
    apiClient.post(`/v1/approvals/${approvalId}/retry`),
  
  // Analytics
  getDashboardStats: (): Promise<AxiosResponse<DashboardStats>> => 
    apiClient.get('/v1/analytics/dashboard'),
  
  getPipelineStats: (): Promise<AxiosResponse<PipelineStats>> => 
    apiClient.get('/v1/analytics/pipeline'),
  
  getContentStats: (): Promise<AxiosResponse<ContentStats>> => 
    apiClient.get('/v1/analytics/content'),
  
  getRecentActivity: (days = 7): Promise<AxiosResponse<RecentActivity>> => 
    apiClient.get('/v1/analytics/recent-activity', { params: { days } }),
  
  getTrends: (days = 7): Promise<AxiosResponse<TrendData>> => 
    apiClient.get('/v1/analytics/trends', { params: { days } }),
  
  // Internal Docs Configuration
  getInternalDocsConfig: (): Promise<AxiosResponse<any>> => 
    apiClient.get('/v1/internal-docs/config'),
  
  getInternalDocsConfigByVersion: (version: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/internal-docs/config/${version}`),
  
  createOrUpdateInternalDocsConfig: (config: any, setActive = true): Promise<AxiosResponse<any>> => 
    apiClient.post('/v1/internal-docs/config', { config, set_active: setActive }),
  
  listInternalDocsVersions: (): Promise<AxiosResponse<string[]>> => 
    apiClient.get('/v1/internal-docs/versions'),
  
  activateInternalDocsVersion: (version: string): Promise<AxiosResponse<{ message: string }>> => 
    apiClient.post(`/v1/internal-docs/activate/${version}`),
  
  // Internal Docs Scanning
  scanFromUrl: (baseUrl: string, maxDepth: number, followExternal: boolean, maxPages: number, mergeWithExisting: boolean): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/internal-docs/scan/url', {
      base_url: baseUrl,
      max_depth: maxDepth,
      follow_external: followExternal,
      max_pages: maxPages,
      merge_with_existing: mergeWithExisting,
    }),
  
  scanFromList: (urls: string[], mergeWithExisting: boolean): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/internal-docs/scan/list', {
      urls,
      merge_with_existing: mergeWithExisting,
    }),
  
  removeDocument: (docUrl: string): Promise<AxiosResponse<any>> =>
    apiClient.delete(`/v1/internal-docs/documents/${encodeURIComponent(docUrl)}`),
  
  // Scanned Documents from Database
  listScannedDocuments: (activeOnly = true): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/internal-docs/documents', { params: { active_only: activeOnly } }),
  
  getScannedDocument: (url: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/internal-docs/documents/${encodeURIComponent(url)}`),
  
  searchDocumentsByKeywords: (keywords: string, limit = 50): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/internal-docs/documents/search/keywords', { params: { keywords, limit } }),
  
  getDocumentsByCategory: (category: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/internal-docs/documents/category/${encodeURIComponent(category)}`),
  
  getAnchorTextPatterns: (): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/internal-docs/documents/patterns/anchor-text'),
  
  getCommonlyReferencedPages: (minLinks = 2): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/internal-docs/documents/pages/commonly-referenced', { params: { min_links: minLinks } }),
  
  getDatabaseStats: (): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/internal-docs/documents/stats'),
  
  rescanDocument: (url: string): Promise<AxiosResponse<any>> =>
    apiClient.post(`/v1/internal-docs/documents/${encodeURIComponent(url)}/rescan`),
  
  // Bulk Operations
  bulkRescanDocuments: (urls: string[]): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/internal-docs/documents/bulk/rescan', { urls }),
  
  bulkDeleteDocuments: (urls: string[]): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/internal-docs/documents/bulk/delete', { urls }),
  
  bulkUpdateCategories: (urls: string[], categories: string[]): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/internal-docs/documents/bulk/update-categories', { urls, categories }),
  
  // Full-text Search
  fullTextSearch: (query: string): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/internal-docs/documents/search/fulltext', { params: { q: query } }),
  
  // Related Documents
  getRelatedDocuments: (url: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/internal-docs/documents/${encodeURIComponent(url)}/related`),
  
  // Bulk Upload
  bulkUploadDocuments: (file: File, format: 'json' | 'csv'): Promise<AxiosResponse<any>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)
    return apiClient.post('/v1/internal-docs/documents/bulk/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  // Design Kit Configuration
  getDesignKitConfig: (refresh?: boolean): Promise<AxiosResponse<any>> => 
    apiClient.get('/v1/design-kit/config', { params: { refresh: refresh || false } }),
  
  getDesignKitConfigByVersion: (version: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/design-kit/config/${version}`),
  
  getDesignKitConfigByContentType: (contentType: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/design-kit/config/${contentType}/type`),
  
  createOrUpdateDesignKitConfig: (config: any, setActive = true): Promise<AxiosResponse<any>> => 
    apiClient.post('/v1/design-kit/config', { config, set_active: setActive }),
  
  generateDesignKitConfig: (useInternalDocs = true): Promise<AxiosResponse<any>> => 
    apiClient.post('/v1/design-kit/generate', { use_internal_docs: useInternalDocs }),
  
  listDesignKitVersions: (): Promise<AxiosResponse<string[]>> => 
    apiClient.get('/v1/design-kit/versions'),
  
  activateDesignKitVersion: (version: string): Promise<AxiosResponse<{ message: string }>> => 
    apiClient.post(`/v1/design-kit/activate/${version}`),
}
