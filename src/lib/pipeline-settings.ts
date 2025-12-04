import type { PipelineConfig, PipelineSettings } from '@/types/api'

const PIPELINE_CONFIG_KEY = 'pipeline_config'
const OPTIONAL_STEPS_KEY = 'optional_steps'
const RETRY_STRATEGY_KEY = 'retry_strategy_config'

// Re-export for backward compatibility
export type { PipelineSettings }

const DEFAULT_CONFIG: PipelineConfig = {
  default_model: 'gpt-5.1',
  default_temperature: 0.7,
  default_max_retries: 2,
  step_configs: {},
}

const DEFAULT_OPTIONAL_STEPS = ['suggested_links', 'design_kit']

export function loadPipelineSettings(): PipelineSettings {
  if (typeof window === 'undefined') {
    return {
      pipeline_config: DEFAULT_CONFIG,
      optional_steps: DEFAULT_OPTIONAL_STEPS,
    }
  }

  try {
    const savedConfig = localStorage.getItem(PIPELINE_CONFIG_KEY)
    const savedOptionalSteps = localStorage.getItem(OPTIONAL_STEPS_KEY)
    const savedRetryStrategy = localStorage.getItem(RETRY_STRATEGY_KEY)

    return {
      pipeline_config: savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG,
      optional_steps: savedOptionalSteps ? JSON.parse(savedOptionalSteps) : DEFAULT_OPTIONAL_STEPS,
      retry_strategy: savedRetryStrategy ? JSON.parse(savedRetryStrategy) : undefined,
    }
  } catch (error) {
    console.error('Failed to load pipeline settings:', error)
    return {
      pipeline_config: DEFAULT_CONFIG,
      optional_steps: DEFAULT_OPTIONAL_STEPS,
    }
  }
}

export function savePipelineSettings(settings: PipelineSettings): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(PIPELINE_CONFIG_KEY, JSON.stringify(settings.pipeline_config))
    localStorage.setItem(OPTIONAL_STEPS_KEY, JSON.stringify(settings.optional_steps))
    if (settings.retry_strategy) {
      localStorage.setItem(RETRY_STRATEGY_KEY, JSON.stringify(settings.retry_strategy))
    }
  } catch (error) {
    console.error('Failed to save pipeline settings:', error)
    throw error
  }
}

export function loadPipelineConfig(): PipelineConfig {
  return loadPipelineSettings().pipeline_config
}

export function loadOptionalSteps(): string[] {
  return loadPipelineSettings().optional_steps
}

