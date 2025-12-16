'use client'

import { useHealth, useReady } from '@/hooks/useApi'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

export function Header() {
  const { data: health, isLoading: healthLoading } = useHealth()
  const { data: ready, isLoading: readyLoading } = useReady()

  const getStatusIcon = () => {
    if (healthLoading || readyLoading) {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
    
    if (health?.data?.status === 'healthy' && ready?.data?.status === 'ready') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusText = () => {
    if (healthLoading || readyLoading) return 'Checking...'
    if (health?.data?.status === 'healthy' && ready?.data?.status === 'ready') return 'Online'
    return 'Offline'
  }

  const getStatusVariant = () => {
    if (healthLoading || readyLoading) return 'warning'
    if (health?.data?.status === 'healthy' && ready?.data?.status === 'ready') return 'success'
    return 'destructive'
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <Activity className="h-6 w-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Marketing Pipeline</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <Badge variant={getStatusVariant()}>
              {getStatusText()}
            </Badge>
          </div>
          
          {health?.data?.version && (
            <div className="text-sm text-gray-500">
              v{health.data.version}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
