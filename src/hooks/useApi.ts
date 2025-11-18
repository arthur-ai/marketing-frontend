import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { 
  AnalyzeRequest, 
  PipelineRequest, 
  ContentSourceListResponse,
  ContentSourceResponse,
  ContentFetchResponse,
  BlogProcessorRequest,
  ReleaseNotesProcessorRequest,
  TranscriptProcessorRequest,
  JobStatus
} from '@/types/api'

// Content Sources
export function useContentSources() {
  return useQuery({
    queryKey: ['content-sources'],
    queryFn: () => api.getContentSources(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSourceStatus(sourceName: string) {
  return useQuery({
    queryKey: ['content-sources', sourceName, 'status'],
    queryFn: () => api.getSourceStatus(sourceName),
    enabled: !!sourceName,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useSourceContent(sourceName: string, limit = 10) {
  return useQuery({
    queryKey: ['content-sources', sourceName, 'content', limit],
    queryFn: () => api.fetchSourceContent(sourceName, limit),
    enabled: !!sourceName,
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// Pipeline Operations
export function useRunPipeline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: PipelineRequest) => api.runPipeline(request),
    onSuccess: () => {
      // Invalidate content queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
    },
  })
}

export function useAnalyzeContent() {
  return useMutation({
    mutationFn: (request: AnalyzeRequest) => api.analyzeContent(request),
  })
}

// Deterministic Processor Operations (Direct - Faster & More Predictable)
export function useProcessBlog() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: BlogProcessorRequest) => api.processBlog(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
    },
  })
}

export function useProcessReleaseNotes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ReleaseNotesProcessorRequest) => api.processReleaseNotes(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
    },
  })
}

export function useProcessTranscript() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: TranscriptProcessorRequest) => api.processTranscript(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-sources'] })
    },
  })
}

// Health Checks
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000, // 10 seconds
  })
}

export function useReady() {
  return useQuery({
    queryKey: ['ready'],
    queryFn: () => api.ready(),
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000, // 10 seconds,
  })
}

// Approval Hooks
export function usePendingApprovals(jobId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['approvals', 'pending', jobId],
    queryFn: () => api.getPendingApprovals(jobId),
    enabled: enabled,
    refetchInterval: enabled ? 5000 : false, // Poll every 5 seconds only when enabled
    staleTime: 2000,
  })
}

export function useApproval(approvalId: string) {
  return useQuery({
    queryKey: ['approvals', approvalId],
    queryFn: () => api.getApproval(approvalId),
    enabled: !!approvalId,
  })
}

export function useDecideApproval() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ approvalId, decision }: { 
      approvalId: string
      decision: import('@/types/api').ApprovalDecisionRequest 
    }) => api.decideApproval(approvalId, decision),
    onSuccess: () => {
      // Invalidate and refetch approval queries
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

export function useJobApprovals(jobId: string, status?: string) {
  return useQuery({
    queryKey: ['approvals', 'job', jobId, status],
    queryFn: () => api.getJobApprovals(jobId, status),
    enabled: !!jobId,
    refetchInterval: 5000,
  })
}

export function useApprovalStats() {
  return useQuery({
    queryKey: ['approvals', 'stats'],
    queryFn: () => api.getApprovalStats(),
    refetchInterval: 30000,
  })
}

export function useApprovalSettings() {
  return useQuery({
    queryKey: ['approvals', 'settings'],
    queryFn: () => api.getApprovalSettings(),
  })
}

export function useUpdateApprovalSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: import('@/types/api').ApprovalSettings) => 
      api.updateApprovalSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals', 'settings'] })
    },
  })
}

export function useRetryStep() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (approvalId: string) => api.retryStep(approvalId),
    onSuccess: () => {
      // Invalidate approvals to refresh the list
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
      // Invalidate jobs to show the new retry job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useResumeJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (jobId: string) => api.resumeJob(jobId),
    onSuccess: () => {
      // Invalidate jobs to refresh the list and show the new resume job
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      // Invalidate approvals to refresh approval status
      queryClient.invalidateQueries({ queryKey: ['approvals'] })
    },
  })
}

// Job Management Hooks
export function useJobStatus(jobId: string, enabled = true) {
  return useQuery({
    queryKey: ['jobs', jobId, 'status'],
    queryFn: () => api.getJobStatus(jobId),
    enabled: !!jobId && enabled,
    refetchInterval: (data) => {
      // Stop polling once job is complete, failed, or cancelled
      const status = data?.data?.status as JobStatus
      if (!status || ['completed', 'failed', 'cancelled'].includes(status)) {
        return false
      }
      // Poll every 2 seconds while processing
      return 2000
    },
    staleTime: 0, // Always refetch
  })
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => api.getJob(jobId),
    enabled: !!jobId,
  })
}

export function useJobResult(jobId: string, enabled = false) {
  return useQuery({
    queryKey: ['jobs', jobId, 'result'],
    queryFn: () => api.getJobResult(jobId),
    enabled: !!jobId && enabled,
    retry: false, // Don't retry if job isn't ready
  })
}

export function useListJobs(jobType?: string, status?: string) {
  return useQuery({
    queryKey: ['jobs', 'list', jobType, status],
    queryFn: () => api.listJobs(jobType, status),
    refetchInterval: 10000, // Refresh list every 10 seconds
  })
}

export function useCancelJob() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (jobId: string) => api.cancelJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

// Analytics Hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 60000, // Refresh every 60 seconds
    staleTime: 60000,
  })
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['analytics', 'pipeline'],
    queryFn: () => api.getPipelineStats(),
    refetchInterval: 60000,
    staleTime: 60000,
  })
}

export function useContentStats() {
  return useQuery({
    queryKey: ['analytics', 'content'],
    queryFn: () => api.getContentStats(),
    refetchInterval: 60000,
    staleTime: 60000,
  })
}

export function useRecentActivity(days = 7) {
  return useQuery({
    queryKey: ['analytics', 'recent-activity', days],
    queryFn: () => api.getRecentActivity(days),
    refetchInterval: 60000,
    staleTime: 60000,
  })
}

export function useTrends(days = 7) {
  return useQuery({
    queryKey: ['analytics', 'trends', days],
    queryFn: () => api.getTrends(days),
    refetchInterval: 60000,
    staleTime: 60000,
  })
}

// Internal Docs Configuration Hooks
export function useInternalDocsConfig() {
  return useQuery({
    queryKey: ['internal-docs', 'config'],
    queryFn: async () => {
      const response = await api.getInternalDocsConfig()
      // Handle null response (no config exists)
      return response.data || null
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnWindowFocus: false, // Already set globally, but explicit here
    retry: false, // Don't retry on errors
    enabled: true, // Always enabled, but won't refetch unnecessarily
  })
}

export function useInternalDocsConfigByVersion(version: string) {
  return useQuery({
    queryKey: ['internal-docs', 'config', version],
    queryFn: () => api.getInternalDocsConfigByVersion(version),
    enabled: !!version,
  })
}

export function useInternalDocsVersions() {
  return useQuery({
    queryKey: ['internal-docs', 'versions'],
    queryFn: async () => {
      const response = await api.listInternalDocsVersions()
      // Return the data directly, not wrapped
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateOrUpdateInternalDocsConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ config, setActive }: { config: any; setActive?: boolean }) => 
      api.createOrUpdateInternalDocsConfig(config, setActive),
    onSuccess: (data) => {
      // Update the cache directly instead of invalidating to avoid refetch
      queryClient.setQueryData(['internal-docs', 'config'], data.data)
      // Only invalidate versions list if needed
      queryClient.invalidateQueries({ queryKey: ['internal-docs', 'versions'] })
    },
  })
}

export function useActivateInternalDocsVersion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (version: string) => api.activateInternalDocsVersion(version),
    onSuccess: async () => {
      // Refetch only the config, not all internal-docs queries
      await queryClient.refetchQueries({ queryKey: ['internal-docs', 'config'] })
      queryClient.invalidateQueries({ queryKey: ['internal-docs', 'versions'] })
    },
  })
}

// Design Kit Configuration Hooks
export function useDesignKitConfig() {
  return useQuery({
    queryKey: ['design-kit', 'config'],
    queryFn: () => api.getDesignKitConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDesignKitConfigByVersion(version: string) {
  return useQuery({
    queryKey: ['design-kit', 'config', version],
    queryFn: () => api.getDesignKitConfigByVersion(version),
    enabled: !!version,
  })
}

export function useDesignKitConfigByContentType(contentType: string) {
  return useQuery({
    queryKey: ['design-kit', 'config', contentType, 'type'],
    queryFn: () => api.getDesignKitConfigByContentType(contentType),
    enabled: !!contentType,
  })
}

export function useDesignKitVersions() {
  return useQuery({
    queryKey: ['design-kit', 'versions'],
    queryFn: () => api.listDesignKitVersions(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateOrUpdateDesignKitConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ config, setActive }: { config: any; setActive?: boolean }) => 
      api.createOrUpdateDesignKitConfig(config, setActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-kit'] })
    },
  })
}

export function useGenerateDesignKitConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (useInternalDocs = true) => api.generateDesignKitConfig(useInternalDocs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-kit'] })
    },
  })
}

export function useActivateDesignKitVersion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (version: string) => api.activateDesignKitVersion(version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-kit'] })
    },
  })
}
