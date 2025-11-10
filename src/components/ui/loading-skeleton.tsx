'use client'

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={40} className="rounded-lg" />
      <Skeleton count={3} className="rounded-lg" />
      <Skeleton height={200} className="rounded-lg" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton height={24} width={200} />
        <Skeleton height={16} width={300} className="mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton count={4} height={20} />
      </CardContent>
    </Card>
  )
}

export function PipelineStepsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
          <Skeleton circle width={32} height={32} />
          <div className="flex-1">
            <Skeleton height={16} />
            <Skeleton height={12} className="mt-1" width="80%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ResultSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton height={24} width={200} />
          <Skeleton height={24} width={80} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton height={20} count={10} />
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number, cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={24} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} height={40} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton height={16} width={100} />
        <Skeleton circle width={16} height={16} />
      </CardHeader>
      <CardContent>
        <Skeleton height={32} width={60} />
        <Skeleton height={12} width={120} className="mt-2" />
      </CardContent>
    </Card>
  )
}

