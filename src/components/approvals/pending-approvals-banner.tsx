'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePendingApprovals } from '@/hooks/useApi'

export function PendingApprovalsBanner() {
  const router = useRouter()
  const { data, isLoading } = usePendingApprovals()
  const [isExpanded, setIsExpanded] = useState(false)

  if (isLoading || !data?.data || data.data.pending === 0) {
    return null
  }

  const pending = data.data.pending
  const approvals = data.data.approvals

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <Card className="border border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Pending Approvals Required
                    </h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {pending} {pending === 1 ? 'item needs' : 'items need'} your review
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-white px-2.5 py-0.5 text-sm font-medium">
                    {pending}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-600 hover:bg-amber-100 hover:text-gray-900"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Expanded List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2"
                  >
                    {approvals.map((approval) => (
                      <motion.div
                        key={approval.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {(approval.pipeline_step || 'Unknown Step').replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {approval.step_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(approval.created_at)}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/approvals/${approval.id}`)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5"
                          >
                            Review
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

