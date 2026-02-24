'use client'

// Use dynamic import to avoid SSR issues and module resolution problems
// Import directly from highlight.js CJS build to avoid Prism/refractor dependencies
import React from 'react'
import dynamic from 'next/dynamic'
import { vs2015 } from 'react-syntax-highlighter/dist/cjs/styles/hljs'

// In react-syntax-highlighter v16, use the highlight.js-specific CJS build
// This avoids importing Prism/refractor entirely
// Languages are loaded automatically when you pass the language prop
const SyntaxHighlighter = dynamic(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type definitions for subpath imports not available, but module exists at runtime
  () => import('react-syntax-highlighter/dist/cjs/highlight').then((mod) => ({
    // next/dynamic requires { default: Component } shape — wrap the loaded component
    default: (mod.default ?? mod) as React.ComponentType<any>,
  })),
  {
    ssr: false, // Disable SSR to avoid module resolution issues
  }
)

// Export configured SyntaxHighlighter component
export { SyntaxHighlighter, vs2015 }
