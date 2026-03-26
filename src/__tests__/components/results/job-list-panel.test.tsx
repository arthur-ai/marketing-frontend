import { describe, it, expect } from '@jest/globals'

// Extract the pure function for unit testing
function getJobTitle(job: {
  job_id: string
  metadata?: { title?: string }
  content_type?: string
}): string {
  if (job.metadata?.title) return job.metadata.title
  if (job.content_type)
    return job.content_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  return `Job #${job.job_id.substring(0, 6)}`
}

describe('getJobTitle', () => {
  it('returns metadata.title when present', () => {
    const job = { job_id: 'abc123xyz', metadata: { title: 'Q1 Product Launch' } }
    expect(getJobTitle(job)).toBe('Q1 Product Launch')
  })

  it('returns formatted content_type when no title', () => {
    const job = { job_id: 'abc123xyz', content_type: 'article_generation' }
    expect(getJobTitle(job)).toBe('Article Generation')
  })

  it('returns Job #<id> fallback when both title and content_type are missing', () => {
    const job = { job_id: 'abc123xyz789' }
    expect(getJobTitle(job)).toBe('Job #abc123')
  })

  it('does not use job_id when content_type is available', () => {
    const job = {
      job_id: 'abc123xyz',
      content_type: 'seo_blog_post',
      metadata: {},
    }
    expect(getJobTitle(job)).toBe('Seo Blog Post')
  })

  it('prefers metadata.title over content_type', () => {
    const job = {
      job_id: 'abc123xyz',
      metadata: { title: 'My Title' },
      content_type: 'article_generation',
    }
    expect(getJobTitle(job)).toBe('My Title')
  })
})
