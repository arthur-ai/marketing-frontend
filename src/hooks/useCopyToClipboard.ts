import { useState } from 'react'
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils'

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = async (text: string, label: string = 'Content') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showSuccessToast('Copied!', `${label} copied to clipboard`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showErrorToast('Copy Failed', 'Failed to copy to clipboard')
      setCopied(false)
    }
  }

  return { copy, copied }
}
