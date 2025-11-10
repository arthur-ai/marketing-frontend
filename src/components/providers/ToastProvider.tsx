'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      expand={true}
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '0.75rem',
        },
        classNames: {
          toast: 'shadow-lg',
          title: 'font-semibold',
          description: 'text-sm',
          actionButton: 'bg-blue-500 text-white',
          cancelButton: 'bg-gray-200',
          closeButton: 'bg-white border-gray-200',
        },
      }}
    />
  )
}

