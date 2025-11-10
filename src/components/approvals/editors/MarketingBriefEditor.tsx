'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { QualityMetricsDisplay } from './shared/QualityMetricsDisplay'
import { TargetAudienceSection } from '../sections/marketing-brief/TargetAudienceSection'
import { KeyMessagesSection } from '../sections/marketing-brief/KeyMessagesSection'
import { ContentStrategySection } from '../sections/marketing-brief/ContentStrategySection'
import { KPIsSection } from '../sections/marketing-brief/KPIsSection'
import { DistributionChannelsSection } from '../sections/marketing-brief/DistributionChannelsSection'
import { ToneAndVoiceSection } from '../sections/marketing-brief/ToneAndVoiceSection'
import { CompetitiveAngleSection } from '../sections/marketing-brief/CompetitiveAngleSection'

interface MarketingBriefEditorProps {
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function MarketingBriefEditor({
  initialData,
  onDataChange,
  isEditing,
  onToggleEdit,
}: MarketingBriefEditorProps) {
  const [data, setData] = useState(initialData || {})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setData(initialData || {})
    setHasChanges(false)
  }, [initialData])

  const updateField = (field: string, value: any) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    
    // Check if there are changes
    const changed = JSON.stringify(newData) !== JSON.stringify(initialData)
    setHasChanges(changed)
    onDataChange(newData, changed)
  }

  if (!isEditing) {
    // View mode - formatted display
    return (
      <Box>
        <QualityMetricsDisplay data={data} />
        
        <TargetAudienceSection
          items={data.target_audience || []}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <KeyMessagesSection
          items={data.key_messages || []}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <ContentStrategySection
          content={data.content_strategy || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <KPIsSection
          items={data.kpis || []}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <DistributionChannelsSection
          items={data.distribution_channels || []}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <ToneAndVoiceSection
          value={data.tone_and_voice || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <CompetitiveAngleSection
          content={data.competitive_angle || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />
      </Box>
    )
  }

  // Edit mode
  return (
    <Box>
      <QualityMetricsDisplay data={data} />

      <TargetAudienceSection
        items={data.target_audience || []}
        isEditing={true}
        onChange={(items) => updateField('target_audience', items)}
      />

      <KeyMessagesSection
        items={data.key_messages || []}
        isEditing={true}
        onChange={(items) => updateField('key_messages', items)}
      />

      <ContentStrategySection
        content={data.content_strategy || ''}
        isEditing={true}
        onChange={(value) => updateField('content_strategy', value)}
      />

      <KPIsSection
        items={data.kpis || []}
        isEditing={true}
        onChange={(items) => updateField('kpis', items)}
      />

      <DistributionChannelsSection
        items={data.distribution_channels || []}
        isEditing={true}
        onChange={(items) => updateField('distribution_channels', items)}
      />

      <ToneAndVoiceSection
        value={data.tone_and_voice || ''}
        isEditing={true}
        onChange={(value) => updateField('tone_and_voice', value)}
      />

      <CompetitiveAngleSection
        content={data.competitive_angle || ''}
        isEditing={true}
        onChange={(value) => updateField('competitive_angle', value)}
      />
    </Box>
  )
}

