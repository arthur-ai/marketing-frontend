'use client'

import { useState, useEffect } from 'react'
import { Box } from '@mui/material'
import { QualityMetricsDisplay } from './shared/QualityMetricsDisplay'
import { MetaTitleSection } from '../sections/seo-optimization/MetaTitleSection'
import { MetaDescriptionSection } from '../sections/seo-optimization/MetaDescriptionSection'
import { SlugSection } from '../sections/seo-optimization/SlugSection'
import { OptimizedContentSection } from '../sections/seo-optimization/OptimizedContentSection'
import { AltTextsSection } from '../sections/seo-optimization/AltTextsSection'
import { OpenGraphTagsSection } from '../sections/seo-optimization/OpenGraphTagsSection'
import { SchemaMarkupSection } from '../sections/seo-optimization/SchemaMarkupSection'
import { CanonicalUrlSection } from '../sections/seo-optimization/CanonicalUrlSection'

interface SEOOptimizationEditorProps {
  initialData: any
  onDataChange: (data: any, hasChanges: boolean) => void
  isEditing: boolean
  onToggleEdit: () => void
}

export function SEOOptimizationEditor({
  initialData,
  onDataChange,
  isEditing,
  onToggleEdit,
}: SEOOptimizationEditorProps) {
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

        <MetaTitleSection
          title={data.meta_title || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <MetaDescriptionSection
          description={data.meta_description || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <SlugSection
          slug={data.slug || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <OptimizedContentSection
          content={data.optimized_content || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <AltTextsSection
          altTexts={data.alt_texts || {}}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <OpenGraphTagsSection
          ogTags={data.og_tags || {}}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <SchemaMarkupSection
          schemaMarkup={data.schema_markup || ''}
          isEditing={false}
          onEdit={onToggleEdit}
        />

        <CanonicalUrlSection
          url={data.canonical_url || ''}
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

      <MetaTitleSection
        title={data.meta_title || ''}
        isEditing={true}
        onChange={(value) => updateField('meta_title', value)}
      />

      <MetaDescriptionSection
        description={data.meta_description || ''}
        isEditing={true}
        onChange={(value) => updateField('meta_description', value)}
      />

      <SlugSection
        slug={data.slug || ''}
        isEditing={true}
        onChange={(value) => updateField('slug', value)}
      />

      <OptimizedContentSection
        content={data.optimized_content || ''}
        isEditing={true}
        onChange={(value) => updateField('optimized_content', value)}
      />

      <AltTextsSection
        altTexts={data.alt_texts || {}}
        isEditing={true}
        onChange={(altTexts) => updateField('alt_texts', altTexts)}
      />

      <OpenGraphTagsSection
        ogTags={data.og_tags || {}}
        isEditing={true}
        onChange={(ogTags) => updateField('og_tags', ogTags)}
      />

      <SchemaMarkupSection
        schemaMarkup={data.schema_markup || ''}
        isEditing={true}
        onChange={(value) => updateField('schema_markup', value)}
      />

      <CanonicalUrlSection
        url={data.canonical_url || ''}
        isEditing={true}
        onChange={(value) => updateField('canonical_url', value)}
      />
    </Box>
  )
}

