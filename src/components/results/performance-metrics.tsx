'use client'

import { Box, Typography, LinearProgress } from '@mui/material'
import { AccessTime, Bolt, AttachMoney, TrendingUp, BarChart } from '@mui/icons-material'
import type { JobResultsSummary } from '@/types/api'

interface PerformanceMetricsProps {
  jobResults: JobResultsSummary
}

// Approximate token pricing (adjust based on your model)
const TOKEN_COST_PER_1K = {
  'gpt-5.1': 0.00015, // $0.15 per 1M input, $0.60 per 1M output (average)
  'gpt-5.2': 0.00015, // $0.15 per 1M input, $0.60 per 1M output (average)
  'gpt-4': 0.03, // $30 per 1M input, $60 per 1M output (average)
  'default': 0.001 // Default estimate
}

function calculateCost(tokensUsed: number, model: string = 'default'): number {
  const costPer1K = TOKEN_COST_PER_1K[model as keyof typeof TOKEN_COST_PER_1K] || TOKEN_COST_PER_1K.default
  return (tokensUsed / 1000) * costPer1K
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(0)
  return `${minutes}m ${secs}s`
}

export function PerformanceMetrics({ jobResults }: PerformanceMetricsProps) {
  const metrics = jobResults.performance_metrics
  const stepInfo = metrics?.step_info || []
  
  if (!metrics || (!metrics.execution_time_seconds && !metrics.total_tokens_used)) {
    return null
  }
  
  // Validate and parse metrics with error handling
  const executionTime = typeof metrics.execution_time_seconds === 'number' 
    ? metrics.execution_time_seconds 
    : parseFloat(String(metrics.execution_time_seconds || 0)) || 0;
  
  const totalTokens = typeof metrics.total_tokens_used === 'number'
    ? metrics.total_tokens_used
    : parseInt(String(metrics.total_tokens_used || 0), 10) || 0;
  
  // Validate that we have meaningful data
  if (executionTime <= 0 && totalTokens <= 0) {
    return null;
  }
  
  const estimatedCost = calculateCost(totalTokens)
  
  // Calculate step durations for visualization with validation
  const stepDurations = stepInfo
    .filter(s => s && s.execution_time && typeof s.execution_time === 'number' && s.execution_time > 0)
    .map(s => {
      const duration = s.execution_time!;
      const percentage = executionTime > 0 ? (duration / executionTime) * 100 : 0;
      return {
        name: (s.step_name || 'unknown').replace(/_/g, ' '),
        duration: duration,
        tokens: (typeof s.tokens_used === 'number' ? s.tokens_used : parseInt(String(s.tokens_used || 0), 10)) || 0,
        percentage: Math.min(100, Math.max(0, percentage)) // Clamp between 0 and 100
      };
    })
    .sort((a, b) => b.duration - a.duration)
  
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <BarChart color="primary" />
        <Typography variant="h6">Performance Metrics</Typography>
      </Box>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        {/* Total Execution Time */}
        <Box sx={{ bgcolor: 'primary.50', borderRadius: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTime color="primary" />
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Total Execution Time
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {formatDuration(executionTime)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {(executionTime * 1000).toLocaleString()}ms
          </Typography>
        </Box>
        
        {/* Total Tokens Used */}
        <Box sx={{ bgcolor: 'secondary.50', borderRadius: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Bolt sx={{ color: '#9c27b0' }} />
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Total Tokens
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#9c27b0' }}>
            {totalTokens.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {stepInfo.length} steps executed
          </Typography>
        </Box>
        
        {/* Estimated Cost */}
        <Box sx={{ bgcolor: 'success.50', borderRadius: 2, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AttachMoney sx={{ color: '#2e7d32' }} />
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Estimated Cost
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight="bold" sx={{ color: '#2e7d32' }}>
            ${estimatedCost.toFixed(4)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Approximate
          </Typography>
        </Box>
      </Box>
      
      {/* Step-by-step performance */}
      {stepDurations.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TrendingUp color="action" />
            <Typography variant="subtitle2" fontWeight="medium">
              Step Performance
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stepDurations.map((step, idx) => (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                    {step.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDuration(step.duration)}
                    </Typography>
                    {step.tokens > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {step.tokens.toLocaleString()} tokens
                      </Typography>
                    )}
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={step.percentage} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

