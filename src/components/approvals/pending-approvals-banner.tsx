'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { usePendingApprovals } from '@/hooks/useApi'
import { showWarningToast } from '@/lib/toast-utils'

export function PendingApprovalsBanner() {
  const pathname = usePathname()
  // Only enable polling on results, pipeline, and approvals pages
  const shouldPoll = pathname === '/results' || pathname === '/pipeline' || pathname === '/approvals'
  const { data, isLoading } = usePendingApprovals(undefined, shouldPoll)
  const lastShownCountRef = useRef<number>(0)
  const toastShownRef = useRef<boolean>(false)

  useEffect(() => {
    // Don't show toast if loading, no data, or no pending approvals
    if (isLoading || !data?.data || data.data.pending === 0) {
      lastShownCountRef.current = 0
      toastShownRef.current = false
      return
    }

    const pending = data.data.pending
    const lastShown = lastShownCountRef.current

    // Only show toast if:
    // 1. We haven't shown a toast yet (initial load), OR
    // 2. The count has increased (new approvals added)
    if (!toastShownRef.current || pending > lastShown) {
      const message = pending === 1 
        ? 'Approval Required' 
        : 'Approvals Required'
      const description = `${pending} ${pending === 1 ? 'item needs' : 'items need'} your review`
      
      showWarningToast(message, description)
      
      lastShownCountRef.current = pending
      toastShownRef.current = true
    } else if (pending < lastShown) {
      // Count decreased, update our ref
      lastShownCountRef.current = pending
    }
  }, [data, isLoading])

  // This component doesn't render anything, it just handles toast notifications
  return null
}

