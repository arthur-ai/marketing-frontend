/**
 * Pipeline Configuration Versioning
 * 
 * Manages version history and rollback for pipeline configuration.
 * Stores versions in localStorage with timestamps.
 */

import type { PipelineConfig } from '@/types/api'

export interface PipelineConfigVersion {
  version: string
  timestamp: string
  config: PipelineConfig
  description?: string
  is_active: boolean
}

const VERSION_STORAGE_KEY = 'pipeline_config_versions'
const MAX_VERSIONS = 20 // Keep last 20 versions

/**
 * Generate a version identifier from timestamp
 */
function generateVersionId(): string {
  return `v${Date.now()}`
}

/**
 * Get all stored versions
 */
export function getPipelineConfigVersions(): PipelineConfigVersion[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY)
    if (!stored) return []
    
    const versions: PipelineConfigVersion[] = JSON.parse(stored)
    return versions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  } catch (e) {
    console.error('Failed to load pipeline config versions:', e)
    return []
  }
}

/**
 * Save a new version of the pipeline config
 */
export function savePipelineConfigVersion(
  config: PipelineConfig,
  description?: string
): PipelineConfigVersion {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available')
  }

  const versions = getPipelineConfigVersions()
  
  // Deactivate all previous versions
  versions.forEach(v => { v.is_active = false })
  
  // Create new version
  const newVersion: PipelineConfigVersion = {
    version: generateVersionId(),
    timestamp: new Date().toISOString(),
    config,
    description,
    is_active: true,
  }
  
  // Add new version
  versions.unshift(newVersion)
  
  // Keep only last MAX_VERSIONS
  const trimmedVersions = versions.slice(0, MAX_VERSIONS)
  
  // Save to localStorage
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(trimmedVersions))
  
  return newVersion
}

/**
 * Get a specific version by version ID
 */
export function getPipelineConfigVersion(version: string): PipelineConfigVersion | null {
  const versions = getPipelineConfigVersions()
  return versions.find(v => v.version === version) || null
}

/**
 * Get the active version
 */
export function getActivePipelineConfigVersion(): PipelineConfigVersion | null {
  const versions = getPipelineConfigVersions()
  return versions.find(v => v.is_active) || versions[0] || null
}

/**
 * Activate a specific version (rollback)
 */
export function activatePipelineConfigVersion(version: string): PipelineConfigVersion | null {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available')
  }

  const versions = getPipelineConfigVersions()
  const targetVersion = versions.find(v => v.version === version)
  
  if (!targetVersion) {
    return null
  }
  
  // Deactivate all versions
  versions.forEach(v => { v.is_active = false })
  
  // Activate target version
  targetVersion.is_active = true
  
  // Save updated versions
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions))
  
  return targetVersion
}

/**
 * Delete a version
 */
export function deletePipelineConfigVersion(version: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available')
  }

  const versions = getPipelineConfigVersions()
  const filtered = versions.filter(v => v.version !== version)
  
  if (filtered.length === versions.length) {
    return false // Version not found
  }
  
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * Clear all versions (except active)
 */
export function clearPipelineConfigVersions(): void {
  if (typeof window === 'undefined') {
    throw new Error('localStorage is not available')
  }

  const activeVersion = getActivePipelineConfigVersion()
  if (activeVersion) {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify([activeVersion]))
  } else {
    localStorage.removeItem(VERSION_STORAGE_KEY)
  }
}

