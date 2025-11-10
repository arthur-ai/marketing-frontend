'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, FileJson, File } from 'lucide-react'
import { motion } from 'framer-motion'

interface DropzoneProps {
  onUpload: (file: File) => void
  accept?: Record<string, string[]>
  maxSize?: number
}

export function Dropzone({ 
  onUpload, 
  accept = {
    'text/markdown': ['.md'],
    'application/json': ['.json'],
    'text/plain': ['.txt']
  },
  maxSize = 10485760 // 10MB
}: DropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      onUpload(acceptedFiles[0])
    }
  }, [onUpload])
  
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false
  })
  
  const getIcon = () => {
    if (isDragActive) {
      return <Upload className="h-16 w-16 text-blue-500 animate-bounce" />
    }
    return <Upload className="h-16 w-16 text-gray-400" />
  }
  
  return (
    <motion.div
      {...getRootProps()}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative
        border-2 border-dashed rounded-xl p-12 
        text-center cursor-pointer
        transition-all duration-300
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : isDragReject
          ? 'border-red-500 bg-red-50'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
        }
      `}
    >
      <input {...getInputProps()} />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          {getIcon()}
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          {isDragActive ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-medium text-blue-600"
            >
              Drop the file here...
            </motion.p>
          ) : isDragReject ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-medium text-red-600"
            >
              File type not supported
            </motion.p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                Drag & drop a file here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse
              </p>
            </>
          )}
        </div>
        
        {/* Supported formats */}
        {!isDragActive && !isDragReject && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText className="h-4 w-4" />
              <span>.md</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileJson className="h-4 w-4" />
              <span>.json</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <File className="h-4 w-4" />
              <span>.txt</span>
            </div>
          </div>
        )}
        
        {/* File size limit */}
        <p className="mt-4 text-xs text-gray-400">
          Maximum file size: {(maxSize / 1024 / 1024).toFixed(0)}MB
        </p>
      </motion.div>
      
      {/* Decorative elements */}
      {isDragActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-blue-500 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-blue-500 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-blue-500 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-blue-500 rounded-br-lg" />
        </motion.div>
      )}
    </motion.div>
  )
}

// File preview component
interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}

