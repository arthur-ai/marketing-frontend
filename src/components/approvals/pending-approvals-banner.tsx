'use client'

import { useEffect, useRef } from 'react'
import { useListJobs, usePendingApprovals } from '@/hooks/useApi'
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast-utils'
import { formatJobDisplayName } from '@/utils/contentFormatters'
import type { JobListItem } from '@/types/api'

export function GlobalNotificationWatcher() {
  // 10s poll — React Query deduplicates with the Jobs page when it's open
  const { data: jobsData } = useListJobs()
  // 5s poll — React Query deduplicates with the sidebar badge
  const { data: approvalsData } = usePendingApprovals(undefined, true)

  // Job status tracking: jobId → last known status
  const prevJobStatusRef = useRef<Map<string, string>>(new Map())
  const seededRef = useRef(false)

  // Approval count tracking
  const lastApprovalCountRef = useRef<number>(0)
  const approvalToastShownRef = useRef(false)

  // Job transition watcher
  useEffect(() => {
    if (!jobsData?.data?.jobs) return
    const jobs: JobListItem[] = jobsData.data.jobs

    if (!seededRef.current) {
      // First load: record current state silently — don't toast for existing jobs
      jobs.forEach(job => prevJobStatusRef.current.set(job.job_id, job.status))
      seededRef.current = true
      return
    }

    jobs.forEach(job => {
      const prev = prevJobStatusRef.current.get(job.job_id)
      const curr = job.status
      if (prev !== undefined && prev !== curr) {
        if (curr === 'completed') {
          showSuccessToast('Job completed', formatJobDisplayName(job))
        } else if (curr === 'failed') {
          showErrorToast('Job failed', formatJobDisplayName(job))
        }
      }
      prevJobStatusRef.current.set(job.job_id, curr)
    })
  }, [jobsData])

  // Approval count watcher
  useEffect(() => {
    if (!approvalsData?.data || approvalsData.data.pending === 0) {
      lastApprovalCountRef.current = 0
      approvalToastShownRef.current = false
      return
    }

    const pending = approvalsData.data.pending
    const last = lastApprovalCountRef.current

    if (!approvalToastShownRef.current || pending > last) {
      const message = pending === 1 ? 'Approval Required' : 'Approvals Required'
      const description = `${pending} ${pending === 1 ? 'item needs' : 'items need'} your review`
      showWarningToast(message, description)
      lastApprovalCountRef.current = pending
      approvalToastShownRef.current = true
    } else if (pending < last) {
      lastApprovalCountRef.current = pending
    }
  }, [approvalsData])

  return null
}
