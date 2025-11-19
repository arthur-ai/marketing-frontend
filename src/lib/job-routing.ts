/**
 * Helper function to get the appropriate job route based on pipeline step
 * @param pipelineStep - The pipeline step name (e.g., 'seo_keywords', 'marketing_brief')
 * @param jobId - The job ID
 * @returns The route path for the job view
 */
export function getJobRoute(pipelineStep: string | undefined, jobId: string): string {
  if (!pipelineStep) {
    return `/jobs/${jobId}`
  }

  // Map pipeline steps to their dedicated routes
  const stepRouteMap: Record<string, string> = {
    seo_keywords: 'keywords',
    marketing_brief: 'marketing-brief',
    article_generation: 'article-generation',
    seo_optimization: 'seo-optimization',
    suggested_links: 'suggested-links',
    content_formatting: 'content-formatting',
  }

  const routeSegment = stepRouteMap[pipelineStep]
  
  if (routeSegment) {
    return `/jobs/${routeSegment}/${jobId}`
  }

  // Default to generic job page
  return `/jobs/${jobId}`
}

