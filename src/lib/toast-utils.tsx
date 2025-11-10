'use client'

import { toast } from 'sonner'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

// Success toast
export const showSuccessToast = (message: string, description?: string) => {
  return toast.success(message, {
    description,
    icon: <CheckCircle className="h-5 w-5" />,
    duration: 4000,
  })
}

// Error toast
export const showErrorToast = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  return toast.error(message, {
    description,
    icon: <AlertCircle className="h-5 w-5" />,
    duration: 6000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  })
}

// Info toast
export const showInfoToast = (message: string, description?: string) => {
  return toast.info(message, {
    description,
    icon: <Info className="h-5 w-5" />,
    duration: 4000,
  })
}

// Warning toast
export const showWarningToast = (message: string, description?: string) => {
  return toast.warning(message, {
    description,
    icon: <AlertTriangle className="h-5 w-5" />,
    duration: 5000,
  })
}

// Loading toast (returns an ID that can be used to update/dismiss)
export const showLoadingToast = (message: string, description?: string) => {
  return toast.loading(message, {
    description,
    duration: Infinity, // Stays until dismissed
  })
}

// Update/dismiss a toast
export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId)
}

// Processing toast with auto-update
export const showProcessingToast = (message: string) => {
  const toastId = showLoadingToast(message, 'This may take a few moments...')
  
  return {
    success: (successMessage: string, description?: string) => {
      toast.success(successMessage, {
        id: toastId,
        description,
        icon: <CheckCircle className="h-5 w-5" />,
      })
    },
    error: (errorMessage: string, description?: string, retry?: () => void) => {
      toast.error(errorMessage, {
        id: toastId,
        description,
        icon: <AlertCircle className="h-5 w-5" />,
        action: retry ? {
          label: 'Retry',
          onClick: retry,
        } : undefined,
      })
    },
  }
}

// Promise toast (automatically handles loading, success, and error)
export const showPromiseToast = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  }
) => {
  return toast.promise(promise, messages)
}

// Example usage:
/*
// Simple success
showSuccessToast('Content processed!', 'Your blog post is ready')

// Error with retry
showErrorToast(
  'Processing failed',
  error.message,
  { label: 'Retry', onClick: () => handleRetry() }
)

// Processing with manual updates
const processingToast = showProcessingToast('Processing content...')
try {
  const result = await processContent()
  processingToast.success('Content processed!', `Processed in ${result.time}ms`)
} catch (error) {
  processingToast.error('Processing failed', error.message, () => handleRetry())
}

// Promise toast (automatic)
showPromiseToast(
  processContent(),
  {
    loading: 'Processing content...',
    success: (data) => `Processed ${data.contentType} successfully!`,
    error: (error) => `Failed: ${error.message}`,
  }
)
*/

