'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Target, 
  FileText, 
  Search, 
  Eye, 
  Palette,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface QualityMetricsProps {
  stepResults?: Record<string, any>
  qualityMetrics?: Record<string, number>
}

export function QualityMetricsDisplay({ stepResults, qualityMetrics }: QualityMetricsProps) {
  // Extract confidence scores from each step result
  const extractMetrics = () => {
    if (!stepResults) return []
    
    const metrics: Array<{
      step: string
      label: string
      confidence?: number
      relevance?: number
      readability?: number
      seo_score?: number
      quality?: number
      icon: React.ReactNode
      color: string
    }> = []

    // SEO Keywords
    if (stepResults.seo_keywords) {
      metrics.push({
        step: 'seo_keywords',
        label: 'SEO Keywords',
        confidence: stepResults.seo_keywords.confidence_score,
        relevance: stepResults.seo_keywords.relevance_score,
        icon: <Search className="h-4 w-4" />,
        color: 'green'
      })
    }

    // Marketing Brief
    if (stepResults.marketing_brief) {
      metrics.push({
        step: 'marketing_brief',
        label: 'Marketing Brief',
        confidence: stepResults.marketing_brief.confidence_score,
        quality: stepResults.marketing_brief.strategy_alignment_score,
        icon: <Target className="h-4 w-4" />,
        color: 'purple'
      })
    }

    // Article Generation
    if (stepResults.article_generation) {
      metrics.push({
        step: 'article_generation',
        label: 'Article Content',
        confidence: stepResults.article_generation.confidence_score,
        readability: stepResults.article_generation.readability_score,
        icon: <FileText className="h-4 w-4" />,
        color: 'blue'
      })
    }

    // SEO Optimization
    if (stepResults.seo_optimization) {
      metrics.push({
        step: 'seo_optimization',
        label: 'SEO Optimization',
        confidence: stepResults.seo_optimization.confidence_score,
        seo_score: stepResults.seo_optimization.seo_score,
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'yellow'
      })
    }

    // Content Formatting
    if (stepResults.content_formatting) {
      metrics.push({
        step: 'content_formatting',
        label: 'Content Formatting',
        confidence: stepResults.content_formatting.confidence_score,
        quality: stepResults.content_formatting.accessibility_score,
        icon: <Eye className="h-4 w-4" />,
        color: 'indigo'
      })
    }

    // Design Kit
    if (stepResults.design_kit) {
      metrics.push({
        step: 'design_kit',
        label: 'Design Kit',
        confidence: stepResults.design_kit.confidence_score,
        quality: stepResults.design_kit.design_quality_score,
        icon: <Palette className="h-4 w-4" />,
        color: 'pink'
      })
    }

    return metrics
  }

  const metrics = extractMetrics()

  if (metrics.length === 0) {
    return null
  }

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500'
    if (score >= 0.8 || score >= 80) return 'text-green-600'
    if (score >= 0.6 || score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score?: number) => {
    if (!score) return <AlertCircle className="h-4 w-4 text-gray-500" />
    if (score >= 0.8 || score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 0.6 || score >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const formatScore = (score?: number) => {
    if (!score) return 'N/A'
    // If score is between 0-1, convert to percentage
    if (score <= 1) return `${(score * 100).toFixed(0)}%`
    // Otherwise assume it's already a percentage
    return `${score.toFixed(0)}/100`
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Quality Metrics
            </CardTitle>
            <CardDescription>
              AI confidence and quality scores for each pipeline step
            </CardDescription>
          </div>
          <Badge className="bg-blue-600 text-white px-3 py-1">
            {metrics.length} Steps
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.step} className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* Step Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                    {metric.icon}
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900">
                    {metric.label}
                  </h4>
                </div>

                {/* Confidence Score */}
                {metric.confidence !== undefined && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Confidence</span>
                      <div className="flex items-center gap-1">
                        {getScoreIcon(metric.confidence)}
                        <span className={`text-xs font-bold ${getScoreColor(metric.confidence)}`}>
                          {formatScore(metric.confidence)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (metric.confidence >= 0.8 || metric.confidence >= 80) ? 'bg-green-600' :
                          (metric.confidence >= 0.6 || metric.confidence >= 60) ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ 
                          width: `${metric.confidence <= 1 ? metric.confidence * 100 : metric.confidence}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Additional Metrics */}
                <div className="space-y-1">
                  {metric.relevance !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Relevance</span>
                      <span className={`font-semibold ${getScoreColor(metric.relevance)}`}>
                        {formatScore(metric.relevance)}
                      </span>
                    </div>
                  )}
                  {metric.readability !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Readability</span>
                      <span className={`font-semibold ${getScoreColor(metric.readability)}`}>
                        {formatScore(metric.readability)}
                      </span>
                    </div>
                  )}
                  {metric.seo_score !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">SEO Score</span>
                      <span className={`font-semibold ${getScoreColor(metric.seo_score)}`}>
                        {formatScore(metric.seo_score)}
                      </span>
                    </div>
                  )}
                  {metric.quality !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Quality</span>
                      <span className={`font-semibold ${getScoreColor(metric.quality)}`}>
                        {formatScore(metric.quality)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall Quality Summary */}
        {qualityMetrics && Object.keys(qualityMetrics).length > 0 && (
          <Card className="mt-4 border-blue-300 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">
                Overall Quality Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(qualityMetrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-blue-700 mb-1">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className={`text-lg font-bold ${getScoreColor(value)}`}>
                      {formatScore(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

