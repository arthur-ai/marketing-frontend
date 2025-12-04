// Platform configuration for social media pipeline
// Matches backend platform_config.yml

export interface PlatformConfig {
  name: string
  characterLimit: number
  characterLimitWarning: number
  features: string[]
  bestPractices: string[]
}

export interface PlatformConfigs {
  [key: string]: PlatformConfig
}

export const PLATFORM_CONFIG: PlatformConfigs = {
  linkedin: {
    name: 'LinkedIn',
    characterLimit: 3000,
    characterLimitWarning: 2800,
    features: ['hashtags', 'mentions', 'links', 'media'],
    bestPractices: [
      'Professional tone',
      'B2B focus',
      'Thought leadership',
      'Engagement-driven content',
      'Use 3-5 hashtags',
      'Ask questions to drive engagement',
    ],
  },
  hackernews: {
    name: 'HackerNews',
    characterLimit: 2000,
    characterLimitWarning: 1800,
    features: ['links', 'code_blocks'],
    bestPractices: [
      'Technical depth',
      'Developer-focused',
      'Discussion-oriented',
      'Avoid marketing language',
      'Focus on substance',
      'Encourage debate',
    ],
  },
  email: {
    name: 'Email',
    characterLimit: 5000,
    characterLimitWarning: 4500,
    features: ['subject_line', 'html_formatting', 'links', 'images'],
    bestPractices: [
      'Clear subject line (50-60 characters)',
      'Scannable content',
      'Clear call-to-action',
      'Mobile-friendly',
    ],
  },
}

export const EMAIL_TYPE_CONFIG: {
  [key: string]: { characterLimit: number; focus: string }
} = {
  newsletter: {
    characterLimit: 5000,
    focus: 'informative, educational',
  },
  promotional: {
    characterLimit: 3000,
    focus: 'conversion-oriented, CTA-focused',
  },
}

export function getPlatformConfig(
  platform: string,
  emailType?: string
): PlatformConfig | null {
  if (platform === 'email' && emailType) {
    const emailConfig = EMAIL_TYPE_CONFIG[emailType]
    if (emailConfig) {
      return {
        ...PLATFORM_CONFIG.email,
        characterLimit: emailConfig.characterLimit,
        characterLimitWarning: emailConfig.characterLimit * 0.9,
      }
    }
  }
  return PLATFORM_CONFIG[platform] || null
}

