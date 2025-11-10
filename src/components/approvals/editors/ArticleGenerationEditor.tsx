'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { QualityMetricsDisplay } from './shared/QualityMetricsDisplay'
import { ArticleTitleSection } from '../sections/article/ArticleTitleSection'
import { ArticleContentSection } from '../sections/article/ArticleContentSection'
import { OutlineSection } from '../sections/article/OutlineSection'
import { KeyTakeawaysSection } from '../sections/article/KeyTakeawaysSection'
import { CallToActionSection } from '../sections/article/CallToActionSection'

interface ArticleGenerationEditorProps {
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function ArticleGenerationEditor({
  initialData,
  onDataChange,
  isEditing,
  onToggleEdit,
}: ArticleGenerationEditorProps) {
  const [data, setData] = useState(initialData || {})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setData(initialData || {})
    setHasChanges(false)
  }, [initialData])

  const updateField = (field: string, value: any) => {
    const newData = { ...data, [field]: value }
    setData(newData)
    
    const changed = JSON.stringify(newData) !== JSON.stringify(initialData)
    setHasChanges(changed)
    onDataChange(newData, changed)
  }

  if (!isEditing) {
    // View mode
    return (
      <Box>
        <QualityMetricsDisplay data={data} />

        <ArticleTitleSection
          title={data.article_title || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <ArticleContentSection
          content={data.article_content || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <OutlineSection
          outline={data.outline}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <KeyTakeawaysSection
          items={data.key_takeaways || []}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <CallToActionSection
          content={data.call_to_action || ''}
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

      <ArticleTitleSection
        title={data.article_title || ''}
        isEditing={true}
        onChange={(value) => updateField('article_title', value)}
      />

      <ArticleContentSection
        content={data.article_content || ''}
        isEditing={true}
        onChange={(value) => updateField('article_content', value)}
      />

      <OutlineSection
        outline={data.outline}
        isEditing={true}
        onChange={(value) => updateField('outline', value)}
      />

      <KeyTakeawaysSection
        items={data.key_takeaways || []}
        isEditing={true}
        onChange={(items) => updateField('key_takeaways', items)}
      />

      <CallToActionSection
        content={data.call_to_action || ''}
        isEditing={true}
        onChange={(value) => updateField('call_to_action', value)}
      />
    </Box>
  )
}

