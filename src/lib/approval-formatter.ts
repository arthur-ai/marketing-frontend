/**
 * Utility functions for formatting approval outputs consistently across all pipeline steps.
 * 
 * This module provides a unified way to display approval step outputs in a readable,
 * consistent format regardless of the step type.
 */

/**
 * Format a value as markdown based on its type
 */
function formatValue(value: any, level: number = 0): string {
  if (value === null || value === undefined) {
    return 'N/A'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number') {
    return value.toString()
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (Array.isArray(value)) {
    return formatArrayAsList(value, level)
  }

  if (typeof value === 'object') {
    return formatObjectAsMarkdown(value, level)
  }

  return String(value)
}

/**
 * Format an array as a markdown list
 */
function formatArrayAsList(arr: any[], level: number = 0): string {
  if (arr.length === 0) {
    return 'None'
  }

  const indent = '  '.repeat(level)
  return arr.map((item, index) => {
    const formatted = formatValue(item, level + 1)
    // If item is an object or array, indent it
    if (typeof item === 'object' && item !== null) {
      return `${indent}${index + 1}. ${formatted}`
    }
    return `${indent}- ${formatted}`
  }).join('\n')
}

/**
 * Format an object as nested markdown with headers and lists
 */
function formatObjectAsMarkdown(obj: any, level: number = 0): string {
  const indent = '  '.repeat(level)
  const headerPrefix = '#'.repeat(Math.min(level + 2, 6)) // H2-H6
  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = formatKey(key)
    
    if (value === null || value === undefined) {
      continue // Skip null/undefined values
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${indent}**${formattedKey}:** None`)
      } else {
        lines.push(`${indent}**${formattedKey}:**`)
        lines.push(formatArrayAsList(value, level))
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested object - create a subsection
      lines.push(`${indent}**${formattedKey}:**`)
      lines.push(formatObjectAsMarkdown(value, level + 1))
    } else {
      // Simple value
      const formattedValue = formatValue(value, level)
      lines.push(`${indent}**${formattedKey}:** ${formattedValue}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format a key name for display (convert snake_case to Title Case)
 */
function formatKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format confidence score and quality metrics consistently
 */
function formatQualityMetrics(output: any): string {
  const metrics: string[] = []

  if (typeof output.confidence_score === 'number') {
    metrics.push(`**Confidence Score:** ${(output.confidence_score * 100).toFixed(1)}%`)
  }

  // Add other common quality metrics
  const qualityFields = [
    'relevance_score',
    'seo_score',
    'readability_score',
    'engagement_score',
    'strategy_alignment_score',
    'keyword_optimization_score',
    'accessibility_score',
    'formatting_quality_score',
    'design_quality_score',
    'brand_consistency_score'
  ]

  for (const field of qualityFields) {
    if (typeof output[field] === 'number') {
      const formattedKey = formatKey(field)
      metrics.push(`**${formattedKey}:** ${output[field].toFixed(1)}`)
    }
  }

  return metrics.length > 0 ? metrics.join('\n\n') : ''
}

/**
 * Format approval output for a specific step with enhanced formatting
 * 
 * @param output - The output data from the approval (can be object or string)
 * @param stepName - The pipeline step name (e.g., 'seo_keywords', 'marketing_brief')
 * @returns Formatted markdown string
 */
export function formatApprovalOutput(output: any, stepName: string): string {
  if (!output) {
    return 'No output available'
  }

  // If output is already a string, assume it's markdown and return as-is
  if (typeof output === 'string') {
    return output
  }

  // Step-specific formatting improvements
  let formatted = ''
  
  // Start with quality metrics if available
  const qualityMetrics = formatQualityMetrics(output)
  if (qualityMetrics) {
    formatted += qualityMetrics + '\n\n---\n\n'
  }

  // Format the main output with step-specific enhancements
  formatted += formatObjectAsMarkdown(output, 0)

  return formatted
}

/**
 * Check if output contains structured data that should be formatted
 */
export function shouldFormatOutput(output: any): boolean {
  if (typeof output === 'string') {
    return false // Already formatted
  }
  
  if (output && typeof output === 'object') {
    return Object.keys(output).length > 0
  }
  
  return false
}

