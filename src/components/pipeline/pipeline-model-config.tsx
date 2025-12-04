'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, ChevronDown, ChevronUp, Sparkles, DollarSign } from 'lucide-react'
import type { PipelineConfig, PipelineStepConfig } from '@/types/api'

interface PipelineModelConfigProps {
  config?: PipelineConfig
  onChange?: (config: PipelineConfig) => void
  onReset?: () => void
}

const AVAILABLE_MODELS = [
  { value: 'gpt-4.1', label: 'GPT-4.1', cost: 'Medium', speed: 'Medium' },
  { value: 'gpt-5', label: 'GPT-5', cost: 'High', speed: 'Medium' },
  { value: 'gpt-5-mini', label: 'GPT-5 mini', cost: 'Medium', speed: 'Fast' },
  { value: 'gpt-5-nano', label: 'GPT-5 nano', cost: 'Low', speed: 'Fast' },
  { value: 'gpt-5-pro', label: 'GPT-5 pro', cost: 'High', speed: 'Slow' },
  { value: 'gpt-5.1', label: 'GPT-5.1', cost: 'High', speed: 'Slow' },
]

const PIPELINE_STEPS = [
  { name: 'seo_keywords', label: 'SEO Keywords', complexity: 'Simple', recommended: 'gpt-5-nano' },
  { name: 'marketing_brief', label: 'Marketing Brief', complexity: 'Medium', recommended: 'gpt-5-mini' },
  { name: 'article_generation', label: 'Article Generation', complexity: 'Complex', recommended: 'gpt-5.1' },
  { name: 'seo_optimization', label: 'SEO Optimization', complexity: 'Medium', recommended: 'gpt-5-mini' },
  { name: 'suggested_links', label: 'Suggested Links', complexity: 'Simple', recommended: 'gpt-5-nano' },
  { name: 'content_formatting', label: 'Content Formatting', complexity: 'Simple', recommended: 'gpt-5-nano' },
  { name: 'design_kit', label: 'Design Kit', complexity: 'Simple', recommended: 'gpt-5-nano' },
]

export function PipelineModelConfig({ config, onChange, onReset }: PipelineModelConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localConfig, setLocalConfig] = useState<PipelineConfig>(
    config || {
      default_model: 'gpt-5.1',
      default_temperature: 0.7,
      default_max_retries: 2,
      step_configs: {},
    }
  )

  const updateDefaultModel = (model: string) => {
    const newConfig = { ...localConfig, default_model: model }
    setLocalConfig(newConfig)
    onChange?.(newConfig)
  }

  const updateDefaultTemperature = (temp: number) => {
    const newConfig = { ...localConfig, default_temperature: temp }
    setLocalConfig(newConfig)
    onChange?.(newConfig)
  }

  const updateStepConfig = (stepName: string, stepConfig: Partial<PipelineStepConfig>) => {
    const newConfig = {
      ...localConfig,
      step_configs: {
        ...localConfig.step_configs,
        [stepName]: {
          step_name: stepName,
          ...localConfig.step_configs?.[stepName],
          ...stepConfig,
        },
      },
    }
    setLocalConfig(newConfig)
    onChange?.(newConfig)
  }

  const removeStepConfig = (stepName: string) => {
    const newStepConfigs = { ...localConfig.step_configs }
    delete newStepConfigs[stepName]
    const newConfig = { ...localConfig, step_configs: newStepConfigs }
    setLocalConfig(newConfig)
    onChange?.(newConfig)
  }

  const applyRecommended = () => {
    const recommendedConfig: PipelineConfig = {
      default_model: 'gpt-4o',
      default_temperature: 0.7,
      default_max_retries: 2,
      step_configs: {},
    }

    PIPELINE_STEPS.forEach((step) => {
      recommendedConfig.step_configs![step.name] = {
        step_name: step.name,
        model: step.recommended as any,
      }
    })

    setLocalConfig(recommendedConfig)
    onChange?.(recommendedConfig)
  }

  const handleReset = () => {
    const defaultConfig: PipelineConfig = {
      default_model: 'gpt-5.1',
      default_temperature: 0.7,
      default_max_retries: 2,
      step_configs: {},
    }
    setLocalConfig(defaultConfig)
    onChange?.(defaultConfig)
    onReset?.()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Model Configuration</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Configure models for each pipeline step to optimize cost and quality
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Default Configuration */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm">Default Configuration</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Default Model</label>
                <select
                  value={localConfig.default_model || 'gpt-5.1'}
                  onChange={(e) => updateDefaultModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localConfig.default_temperature || 0.7}
                  onChange={(e) => updateDefaultTemperature(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Step-Specific Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Step-Specific Configuration</h4>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyRecommended}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Apply Recommended
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {PIPELINE_STEPS.map((step) => {
                const stepConfig = localConfig.step_configs?.[step.name]
                const model = stepConfig?.model || localConfig.default_model || 'gpt-5.1'
                const isCustomized = !!stepConfig?.model

                return (
                  <div
                    key={step.name}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{step.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {step.complexity}
                          </Badge>
                          {isCustomized && (
                            <Badge variant="secondary" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Recommended: {step.recommended}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={model}
                        onChange={(e) =>
                          e.target.value === localConfig.default_model
                            ? removeStepConfig(step.name)
                            : updateStepConfig(step.name, { model: e.target.value as any })
                        }
                        className="flex-1 px-2 py-1 text-xs border rounded"
                      >
                        <option value={localConfig.default_model || 'gpt-5.1'}>
                          Use Default ({localConfig.default_model || 'gpt-5.1'})
                        </option>
                        {AVAILABLE_MODELS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label} ({m.cost}, {m.speed})
                          </option>
                        ))}
                      </select>
                      {isCustomized && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStepConfig(step.name)}
                          className="text-xs h-7"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Cost Optimization</span>
            </div>
            <p className="text-xs text-blue-700">
              Using cheaper models (gpt-4o-mini) for simple steps and powerful models (gpt-5.1) for
              complex steps can reduce costs by 40-60% while maintaining quality.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

