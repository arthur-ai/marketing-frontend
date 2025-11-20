'use client'

import { useState } from 'react'
import { MarketingBriefEditor } from './editors/MarketingBriefEditor'
import { ArticleGenerationEditor } from './editors/ArticleGenerationEditor'
import { SEOOptimizationEditor } from './editors/SEOOptimizationEditor'
import { TranscriptPreprocessingEditor } from './editors/TranscriptPreprocessingEditor'
import { GenericEditor } from './editors/GenericEditor'

interface StepEditorProps {
  stepName: string
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
}

export function StepEditor({
  stepName,
  initialData,
  onDataChange,
}: StepEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const handleDataChange = (data: any, changed: boolean) => {
    setEditedData(data)
    setHasChanges(changed)
    onDataChange(data, changed)
  }

  const handleToggleEdit = () => {
    setIsEditing(!isEditing)
    if (!isEditing && editedData) {
      // When switching to edit mode, use edited data if available
      handleDataChange(editedData || initialData, hasChanges)
    }
  }

  // Normalize step name (handle "Step 2: marketing_brief" format)
  const normalizedStep = stepName.includes(':') 
    ? stepName.split(':').pop()?.trim() || stepName
    : stepName

  // Route to appropriate editor based on step name
  switch (normalizedStep) {
    case 'marketing_brief':
      return (
        <MarketingBriefEditor
          initialData={initialData}
          onDataChange={handleDataChange}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
        />
      )

    case 'article_generation':
      return (
        <ArticleGenerationEditor
          initialData={initialData}
          onDataChange={handleDataChange}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
        />
      )

    case 'seo_optimization':
      return (
        <SEOOptimizationEditor
          initialData={initialData}
          onDataChange={handleDataChange}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
        />
      )

    case 'seo_keywords':
      // SEO keywords has its own specialized UI in the approval page
      // Return null here, it's handled separately
      return null

    case 'transcript_preprocessing_approval':
      return (
        <TranscriptPreprocessingEditor
          initialData={initialData}
          onDataChange={handleDataChange}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
        />
      )

    default:
      // Generic editor for other steps
      return (
        <GenericEditor
          initialData={initialData}
          onDataChange={handleDataChange}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
          stepName={normalizedStep}
        />
      )
  }
}

