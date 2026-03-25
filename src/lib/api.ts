import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { authClient } from './auth-client'

// Get session using Better Auth
const getSession = async () => {
  if (typeof window === 'undefined') {
    console.log('[API] getSession called on server, returning null')
    return null
  }
  try {
    console.log('[API] Fetching session from authClient')
    const session = await authClient.getSession()
    console.log('[API] Session response:', {
      hasData: !!session.data,
      hasError: !!session.error,
      dataKeys: session.data ? Object.keys(session.data) : [],
      userId: session.data?.user?.id,
      userEmail: session.data?.user?.email,
    })
    
    if (!session.data) {
      console.log('[API] No session data, returning null')
      return null
    }
    
    // Try to get access token for Keycloak provider
    try {
      console.log('[API] Fetching access token for keycloak provider')
      const tokenResponse = await authClient.getAccessToken({
        providerId: 'keycloak',
      })
      
      // Better Auth getAccessToken can return different structures
      // Check all possible locations for the token
      let accessToken: string | undefined
      
      // Try different possible response structures
      if (typeof tokenResponse === 'string') {
        accessToken = tokenResponse
      } else if (tokenResponse?.accessToken) {
        accessToken = tokenResponse.accessToken
      } else if (tokenResponse?.data?.accessToken) {
        accessToken = tokenResponse.data.accessToken
      } else if ((tokenResponse as any)?.data && typeof (tokenResponse as any).data === 'string') {
        accessToken = (tokenResponse as any).data
      }
      
      console.log('[API] Access token response:', {
        responseType: typeof tokenResponse,
        responseKeys: tokenResponse && typeof tokenResponse === 'object' ? Object.keys(tokenResponse) : [],
        hasAccessToken: !!accessToken,
        accessTokenType: typeof accessToken,
        accessTokenLength: accessToken?.length,
        // Don't log full token, just preview
      })
      
      if (accessToken && typeof accessToken === 'string' && accessToken.length > 10) {
        // Verify it looks like a JWT token (starts with eyJ) or is a valid token
        const isJWT = accessToken.startsWith('eyJ')
        console.log('[API] Successfully retrieved access token:', {
          tokenPreview: accessToken.substring(0, 30) + '...',
          tokenLength: accessToken.length,
          isJWT,
          startsWith: accessToken.substring(0, 10),
        })
        
        // Add accessToken to session object for compatibility
        return {
          ...session.data,
          accessToken: accessToken,
        }
      } else {
        console.warn('[API] Access token response does not contain valid accessToken:', {
          accessTokenType: typeof accessToken,
          accessTokenLength: accessToken?.length,
          accessTokenPreview: accessToken ? accessToken.substring(0, 50) : 'null/undefined',
          responseStructure: tokenResponse && typeof tokenResponse === 'object' ? Object.keys(tokenResponse) : 'not an object',
          fullResponseType: typeof tokenResponse,
        })
        return session.data
      }
    } catch (tokenError) {
      // If token fetch fails, return session without token
      // This might happen if user hasn't completed OAuth flow or account isn't linked
      console.warn('[API] Failed to get access token, returning session without token:', {
        error: tokenError instanceof Error ? tokenError.message : String(tokenError),
        errorName: tokenError instanceof Error ? tokenError.name : undefined,
        stack: tokenError instanceof Error ? tokenError.stack : undefined,
      })
      return session.data
    }
  } catch (error) {
    console.error('[API] Error getting session:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return null
  }
}

const getSignOut = async () => {
  if (typeof window === 'undefined') return null
  return () => authClient.signOut()
}
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
  BrandKitConfig,
  StepListResponse,
  StepRequirementsResponse,
  StepExecutionRequest,
  StepExecutionResponse,
  PipelineFlowResponse
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

// Request interceptor to add access token and handle auth errors
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Only get session in browser context (client-side)
    // Better Auth session works client-side
    if (typeof window === 'undefined') {
      return config
    }
    
    // Check if we've handled an auth error - don't block, but let it fail naturally
    // The response interceptor will handle the redirect
    if (authErrorHandled) {
      const isHealthCheck = config.url?.includes('/health') || config.url?.includes('/ready')
      const isAuthCheck = config.url?.includes('/auth/session')
      if (!isHealthCheck && !isAuthCheck) {
        // Let the request proceed - it will fail with 401 and trigger redirect
      }
    }
    
    try {
      // Only get session in browser context
      const session = await getSession()
      const requestUrl = `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
      if (session && (session as any).accessToken) {
        const token = (session as any).accessToken
        const authHeader = `Bearer ${token}`
        config.headers.Authorization = authHeader
        
        // Debug: Log token details to verify it's being sent
        if (process.env.NODE_ENV === 'development') {
          const tokenPreview = typeof token === 'string' && token.length > 20 
            ? token.substring(0, 30) + '...' 
            : String(token)
          console.log(`[API] Adding Authorization header for ${requestUrl}:`, {
            tokenPreview,
            tokenLength: typeof token === 'string' ? token.length : 'not a string',
            tokenType: typeof token,
            isJWT: typeof token === 'string' && token.startsWith('eyJ'),
            headerValue: authHeader.substring(0, 50) + '...',
            headerSet: !!config.headers.Authorization,
            allHeaders: Object.keys(config.headers),
          })
        }
      } else {
        // Log warning if session exists but no access token (helps debug auth issues)
        if (session && !(session as any).accessToken) {
          console.warn(`[API] Session exists but accessToken is missing for ${requestUrl}. Request will proceed without token.`, {
            sessionKeys: Object.keys(session),
            sessionUser: session.user ? Object.keys(session.user) : 'no user',
          })
        } else if (!session) {
          console.warn(`[API] No session available for ${requestUrl}. Request will proceed without token.`)
        }
      }
    } catch (error) {
      console.error(`[API] Error getting session for ${config.method?.toUpperCase()} ${config.baseURL}${config.url}:`, error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Global flag to track if we've already shown an auth error and stopped requests
let authErrorHandled = false
// Track when user logged in to prevent immediate sign-out on 401s
let loginTimestamp: number | null = null
const LOGIN_GRACE_PERIOD = 10000 // 10 seconds grace period after login

// Function to reset auth error state (call after successful login)
export function resetAuthErrorState() {
  authErrorHandled = false
  loginTimestamp = Date.now()
  console.log('[API] Auth error state reset, grace period started')
}

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // If we get a successful response, reset the auth error flag
    // This allows the app to recover if auth was temporarily broken
    if (authErrorHandled && response.status >= 200 && response.status < 300) {
      authErrorHandled = false
    }
    return response
  },
  async (error) => {
    const requestUrl = error.config?.url || 'unknown'
    const isBetterAuthEndpoint = requestUrl.includes('/api/auth/') || requestUrl.includes('/auth/')
    
    // Handle 401 Unauthorized - token might be expired or invalid
    if (error.response?.status === 401) {
      console.warn('[API] Received 401 Unauthorized. Token may be expired or invalid.', {
        url: requestUrl,
        method: error.config?.method,
        hasAuthHeader: !!error.config?.headers?.Authorization,
        authErrorHandled,
        isBetterAuthEndpoint,
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      })
      
      // Don't sign out for Better Auth endpoints - they handle their own auth
      if (isBetterAuthEndpoint) {
        console.log('[API] 401 on Better Auth endpoint, not signing out')
        return Promise.reject(error)
      }
      
      // Only handle in browser context
      if (typeof window !== 'undefined') {
        // Check if we're in the grace period after login
        const timeSinceLogin = loginTimestamp ? Date.now() - loginTimestamp : Infinity
        const inGracePeriod = timeSinceLogin < LOGIN_GRACE_PERIOD
        
        if (inGracePeriod) {
          console.warn(`[API] 401 on ${requestUrl} but within ${LOGIN_GRACE_PERIOD}ms grace period after login (${Math.round(timeSinceLogin)}ms ago). Not signing out.`)
          // Don't sign out during grace period - token might still be initializing
          return Promise.reject(error)
        }
        
        // If we've already handled an auth error, don't retry or show multiple toasts
        if (authErrorHandled) {
          console.log('[API] Auth error already handled, rejecting request')
          // Reject immediately without retrying
          return Promise.reject(error)
        }
        
        // Mark that we're handling an auth error
        authErrorHandled = true
        console.log('[API] Marking auth error as handled, will sign out and redirect')
        
        try {
          // Clear the session immediately - the token is invalid, don't try to reuse it
          console.error(`[API] 401 Unauthorized on ${requestUrl} - clearing session and redirecting to login.`)
          
          // Sign out to clear the session completely (only on client side)
          const signOut = await getSignOut()
          if (signOut) {
            try {
              console.log('[API] Calling signOut due to 401 error')
              await signOut()
              console.log('[API] SignOut completed')
            } catch (signOutError) {
              console.error('[API] Error during signOut:', signOutError)
            }
          }
          
          // Redirect to login page (reset flag before redirect to allow new session)
          if (!window.location.pathname.includes('/login')) {
            console.log('[API] Redirecting to login page due to 401')
            authErrorHandled = false // Reset flag before redirect to allow new session
            window.location.href = '/login'
          } else {
            console.log('[API] Already on login page, not redirecting')
          }
          
        } catch (sessionError) {
          console.error('[API] Error handling 401:', sessionError)
          // Force redirect even if signOut fails
          if (!window.location.pathname.includes('/login')) {
            authErrorHandled = false // Reset flag before redirect
            window.location.href = '/login'
          }
        }
      }
    } else {
      // Log other errors
      console.error('[API] Error:', {
        status: error.response?.status,
        url: requestUrl,
        method: error.config?.method,
        message: error.message,
        data: error.response?.data,
      })
    }
    
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
  listJobs: (jobType?: string, status?: string, limit = 50, includeSubjobStatus?: boolean): Promise<AxiosResponse<JobListResponse>> => 
    apiClient.get('/v1/jobs', { params: { job_type: jobType, status, limit, include_subjob_status: includeSubjobStatus } }),
  
  listResultsJobs: (limit = 50, dateFrom?: string, dateTo?: string, filterUserId?: string): Promise<AxiosResponse<JobListResponse>> =>
    apiClient.get('/v1/results/jobs', { params: { limit, date_from: dateFrom, date_to: dateTo, filter_user_id: filterUserId } }),
  
  getJob: (jobId: string): Promise<AxiosResponse<JobResponse>> => 
    apiClient.get(`/v1/jobs/${jobId}`),
  
  getJobStatus: (jobId: string): Promise<AxiosResponse<JobStatusResponse>> => 
    apiClient.get(`/v1/jobs/${jobId}/status`),
  
  getJobResult: (jobId: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/jobs/${jobId}/result`),
  
  getJobChain: (jobId: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/jobs/${jobId}/chain`),
  
  getJobTimeline: (jobId: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/results/jobs/${jobId}/timeline`),

  getJobQuality: (jobId: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/jobs/${jobId}/quality`),

  getPipelineFlow: (jobId: string): Promise<AxiosResponse<PipelineFlowResponse>> =>
    apiClient.get(`/v1/results/jobs/${jobId}/pipeline-flow`),
  
  // Pipeline Step Execution
  getPipelineSteps: (): Promise<AxiosResponse<StepListResponse>> => 
    apiClient.get('/v1/pipeline/steps'),
  
  getStepRequirements: (stepName: string): Promise<AxiosResponse<StepRequirementsResponse>> => 
    apiClient.get(`/v1/pipeline/steps/${stepName}/requirements`),
  
  executePipelineStep: (stepName: string, request: StepExecutionRequest): Promise<AxiosResponse<StepExecutionResponse>> => 
    apiClient.post(`/v1/pipeline/steps/${stepName}/execute`, request),
  
  getStepResult: (jobId: string, stepName: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/results/jobs/${jobId}/steps/by-name/${stepName}`),
  
  getStepInputs: (jobId: string, stepName: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/results/jobs/${jobId}/steps/by-name/${stepName}`).then((response) => {
      // Extract input_snapshot from step result
      return {
        ...response,
        data: response.data?.input_snapshot || {},
      }
    }),
  
  getStepOutputs: (jobId: string, stepName: string): Promise<AxiosResponse<any>> => 
    apiClient.get(`/v1/results/jobs/${jobId}/steps/by-name/${stepName}`).then((response) => {
      // Extract result from step result
      return {
        ...response,
        data: response.data?.result || {},
      }
    }),
  
  cancelJob: (jobId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    apiClient.delete(`/v1/jobs/${jobId}`),

  forceDeleteJob: (jobId: string): Promise<AxiosResponse<{ success: boolean; message: string; job_id: string }>> =>
    apiClient.delete(`/v1/jobs/${jobId}/force`),

  deleteAllJobs: (): Promise<AxiosResponse<{ success: boolean; message: string; deleted_count: number }>> =>
    apiClient.delete('/v1/jobs/all'),
  
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
  getDashboardStats: (userId?: string): Promise<AxiosResponse<DashboardStats>> =>
    apiClient.get('/v1/analytics/dashboard', { params: { user_id: userId } }),

  getPipelineStats: (userId?: string): Promise<AxiosResponse<PipelineStats>> =>
    apiClient.get('/v1/analytics/pipeline', { params: { user_id: userId } }),

  getContentStats: (): Promise<AxiosResponse<ContentStats>> =>
    apiClient.get('/v1/analytics/content'),

  getRecentActivity: (days = 7, userId?: string): Promise<AxiosResponse<RecentActivity>> =>
    apiClient.get('/v1/analytics/recent-activity', { params: { days, user_id: userId } }),

  getTrends: (days = 7, userId?: string): Promise<AxiosResponse<TrendData>> =>
    apiClient.get('/v1/analytics/trends', { params: { days, user_id: userId } }),
  
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
  
  // Brand Kit Configuration
  getBrandKitConfig: (refresh?: boolean): Promise<AxiosResponse<any>> =>
    apiClient.get('/v1/brand-kit/config', { params: { refresh: refresh || false } }),

  getBrandKitConfigByVersion: (version: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/brand-kit/config/${version}`),

  getBrandKitConfigByContentType: (contentType: string): Promise<AxiosResponse<any>> =>
    apiClient.get(`/v1/brand-kit/config/${contentType}/type`),

  createOrUpdateBrandKitConfig: (config: any, setActive = true): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/brand-kit/config', { config, set_active: setActive }),

  generateBrandKitConfig: (useInternalDocs = true): Promise<AxiosResponse<any>> =>
    apiClient.post('/v1/brand-kit/generate', { use_internal_docs: useInternalDocs }),

  listBrandKitVersions: (): Promise<AxiosResponse<string[]>> =>
    apiClient.get('/v1/brand-kit/versions'),

  activateBrandKitVersion: (version: string): Promise<AxiosResponse<{ message: string }>> =>
    apiClient.post(`/v1/brand-kit/activate/${version}`),
  
  // Social Media
  updateSocialMediaPost: (request: { job_id: string; content: string; platform: string; email_type?: string; subject_line?: string }): Promise<AxiosResponse<{ success: boolean; message: string; updated_content?: string }>> => 
    apiClient.post('/v1/social-media/update', request),
  
  // Pipeline Settings
  getPipelineSettings: (): Promise<AxiosResponse<import('@/types/api').PipelineSettings>> =>
    apiClient.get('/v1/settings/pipeline'),

  savePipelineSettings: (settings: import('@/types/api').PipelineSettings): Promise<AxiosResponse<import('@/types/api').PipelineSettings>> =>
    apiClient.post('/v1/settings/pipeline', settings),

  // Competitor Research
  submitCompetitorResearch: (request: import('@/types/api').CompetitorResearchRequest): Promise<AxiosResponse<{ job_id: string; status: string; message: string }>> =>
    apiClient.post('/v1/competitor-research', request),

  listCompetitorResearchJobs: (limit = 20, offset = 0): Promise<AxiosResponse<import('@/types/api').CompetitorResearchListItem[]>> =>
    apiClient.get('/v1/competitor-research', { params: { limit, offset } }),

  getCompetitorResearchResult: (jobId: string): Promise<AxiosResponse<import('@/types/api').CompetitorResearchJobRecord>> =>
    apiClient.get(`/v1/competitor-research/${jobId}`),

  getCrawledUrlContent: (jobId: string): Promise<AxiosResponse<import('@/types/api').CrawledUrlContent[]>> =>
    apiClient.get(`/v1/competitor-research/${jobId}/crawled-content`),
}
