'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2, XCircle, AlertCircle, Shield } from 'lucide-react'

export interface PipelineStep {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  duration?: number
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'modified'
  requiresApproval?: boolean
}

interface PipelineVisualizerProps {
  steps: PipelineStep[]
}

export function PipelineVisualizer({ steps }: PipelineVisualizerProps) {
  return (
    <div className="py-8">
      <div className="relative flex items-center justify-between">
        {/* Connecting line background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
        
        {/* Active progress line */}
        <motion.div 
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ 
            width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {steps.map((step, index) => (
          <div key={step.id} className="relative flex flex-col items-center flex-1 z-10">
            {/* Step indicator */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {step.status === 'completed' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg"
                >
                  <CheckCircle className="w-6 h-6 text-white" />
                </motion.div>
              )}
              
              {step.status === 'in-progress' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg animate-pulse">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              
              {step.status === 'failed' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg"
                >
                  <XCircle className="w-6 h-6 text-white" />
                </motion.div>
              )}
              
              {step.status === 'pending' && (
                <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                  <Circle className="w-6 h-6 text-gray-300" />
                </div>
              )}
            </motion.div>
            
            {/* Step label */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className="mt-3 text-center"
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`text-xs font-medium block ${
                  step.status === 'completed' ? 'text-green-700' :
                  step.status === 'in-progress' ? 'text-blue-700' :
                  step.status === 'failed' ? 'text-red-700' :
                  'text-gray-500'
                }`}>
                  {step.name}
                </span>
                
                {/* Approval indicator badge */}
                {step.requiresApproval && (
                  <div 
                    className="relative group"
                    title={`Approval: ${step.approvalStatus || 'none'}`}
                  >
                    {step.approvalStatus === 'pending' && (
                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                    )}
                    {step.approvalStatus === 'approved' && (
                      <Shield className="w-3 h-3 text-green-500" />
                    )}
                    {step.approvalStatus === 'rejected' && (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    {step.approvalStatus === 'modified' && (
                      <Shield className="w-3 h-3 text-blue-500" />
                    )}
                    {(!step.approvalStatus || step.approvalStatus === 'none') && (
                      <Shield className="w-3 h-3 text-gray-400" />
                    )}
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {step.approvalStatus === 'pending' && 'Pending approval'}
                      {step.approvalStatus === 'approved' && 'Approved'}
                      {step.approvalStatus === 'rejected' && 'Rejected'}
                      {step.approvalStatus === 'modified' && 'Modified & approved'}
                      {(!step.approvalStatus || step.approvalStatus === 'none') && 'Requires approval'}
                    </div>
                  </div>
                )}
              </div>
              
              {step.duration && step.status === 'completed' && (
                <span className="text-xs text-gray-400 block mt-1">
                  {step.duration}ms
                </span>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper hook for managing pipeline state
export function usePipelineSteps() {
  const defaultSteps: PipelineStep[] = useMemo(() => [
    { id: 'validate', name: 'Validate', status: 'pending' },
    { id: 'analyze', name: 'Analyze', status: 'pending' },
    { id: 'extract', name: 'Extract SEO', status: 'pending' },
    { id: 'generate', name: 'Generate', status: 'pending' },
    { id: 'optimize', name: 'Optimize', status: 'pending' },
    { id: 'format', name: 'Format', status: 'pending' },
  ], [])

  return { steps: defaultSteps }
}

