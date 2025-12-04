/**
 * Helper function to get the appropriate approval route based on pipeline step
 * @param pipelineStep - The pipeline step name (e.g., 'seo_keywords', 'marketing_brief')
 * @param approvalId - The approval ID
 * @returns The route path for the approval
 */
export function getApprovalRoute(pipelineStep: string | undefined, approvalId: string): string {
  if (!pipelineStep) {
    return `/approvals/${approvalId}`
  }

  // Map pipeline steps to their dedicated routes
  // Note: design_kit doesn't need approval, so it's not included here
  const stepRouteMap: Record<string, string> = {
    seo_keywords: 'seo-keywords',
    marketing_brief: 'marketing-brief',
    article_generation: 'article-generation',
    seo_optimization: 'seo-optimization',
    suggested_links: 'suggested-links',
    content_formatting: 'content-formatting',
    blog_post_preprocessing_approval: 'blog-post-preprocessing',
  }

  const routeSegment = stepRouteMap[pipelineStep]
  
  if (routeSegment) {
    return `/approvals/${routeSegment}/${approvalId}`
  }

  // Default to general approval page
  return `/approvals/${approvalId}`
}

