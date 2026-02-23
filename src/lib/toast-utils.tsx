'use client'

// Lazy import to prevent SSR issues
let toast: any = null
let CheckCircle: any = null
let AlertCircle: any = null
let Info: any = null
let AlertTriangle: any = null
let createElement: any = null

// Initialize imports only on client side
const ensureClientImports = () => {
  if (typeof window === 'undefined') return false
  if (!toast) {
    toast = require('sonner').toast
    const lucide = require('lucide-react')
    CheckCircle = lucide.CheckCircle
    AlertCircle = lucide.AlertCircle
    Info = lucide.Info
    AlertTriangle = lucide.AlertTriangle
    createElement = require('react').createElement
  }
  return true
}

// Lazy icon creation - only create React elements when function is called, not during module load
const createIcon = (Icon: any) => {
  if (!ensureClientImports() || !Icon) return undefined
  return createElement(Icon, { className: 'h-5 w-5' })
}

// Success toast
export const showSuccessToast = (message: string, description?: string) => {
  if (!ensureClientImports()) return
  return toast.success(message, {
    description,
    icon: createIcon(CheckCircle),
    duration: 4000,
  })
}

// Error toast
export const showErrorToast = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  if (!ensureClientImports()) return
  return toast.error(message, {
    description,
    icon: createIcon(AlertCircle),
    duration: 6000,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
  })
}

// Info toast
export const showInfoToast = (message: string, description?: string) => {
  if (!ensureClientImports()) return
  return toast.info(message, {
    description,
    icon: createIcon(Info),
    duration: 4000,
  })
}

// Warning toast
export const showWarningToast = (message: string, description?: string) => {
  if (!ensureClientImports()) return
  return toast.warning(message, {
    description,
    icon: createIcon(AlertTriangle),
    duration: 5000,
  })
}

// Loading toast (returns an ID that can be used to update/dismiss)
export const showLoadingToast = (message: string, description?: string) => {
  if (!ensureClientImports()) return
  return toast.loading(message, {
    description,
    duration: Infinity, // Stays until dismissed
  })
}

// Update/dismiss a toast
export const dismissToast = (toastId: string | number) => {
  if (!ensureClientImports()) return
  toast.dismiss(toastId)
}

// Processing toast with auto-update
export const showProcessingToast = (message: string) => {
  if (!ensureClientImports()) {
    return {
      success: () => {},
      error: () => {},
    }
  }
  const toastId = showLoadingToast(message, 'This may take a few moments...')
  
  return {
    success: (successMessage: string, description?: string) => {
      if (!ensureClientImports()) return
      toast.success(successMessage, {
        id: toastId,
        description,
        icon: createIcon(CheckCircle),
      })
    },
    error: (errorMessage: string, description?: string, retry?: () => void) => {
      if (!ensureClientImports()) return
      toast.error(errorMessage, {
        id: toastId,
        description,
        icon: createIcon(AlertCircle),
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
  if (!ensureClientImports()) return Promise.resolve(null as T)
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

