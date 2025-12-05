'use client'

import { Box, Typography, Stack } from '@mui/material'

interface FormattedTextDisplayProps {
  content: string
}

/**
 * Component to parse and display structured text content with proper formatting.
 * Handles:
 * - Headings (lines starting with **)
 * - Numbered lists (1., 2., 3., etc.)
 * - Bullet points (-, •, *)
 * - Sub-bullets (indented bullets)
 * - Proper spacing and hierarchy
 */
export function FormattedTextDisplay({ content }: FormattedTextDisplayProps) {
  if (!content) {
    return null
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentSection: { title: string; items: Array<{ text: string; subItems?: string[] }> } | null = null
  let currentListItems: Array<{ text: string; subItems?: string[] }> = []
  let currentSubItems: string[] = []
  let inNumberedList = false

  const flushSection = () => {
    if (currentSection) {
      elements.push(
        <Box key={`section-${elements.length}`} sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: 'primary.main' }}>
            {currentSection.title}
          </Typography>
          {currentSection.items.length > 0 ? (
            <Stack spacing={1} sx={{ pl: 1 }}>
              {currentSection.items.map((item, idx) => (
                <Box key={idx}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mb: item.subItems && item.subItems.length > 0 ? 0.5 : 0,
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {item.text}
                  </Typography>
                  {item.subItems && item.subItems.length > 0 && (
                    <Stack spacing={0.5} sx={{ pl: 3, mt: 0.5 }}>
                      {item.subItems.map((subItem, subIdx) => (
                        <Typography key={subIdx} variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                          • {subItem}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          ) : null}
        </Box>
      )
      currentSection = null
    }
  }

  const flushList = () => {
    if (currentListItems.length > 0) {
      if (inNumberedList) {
        elements.push(
          <Stack key={`list-${elements.length}`} spacing={1} sx={{ pl: 2, mb: 1.5 }}>
            {currentListItems.map((item, idx) => (
              <Box key={idx}>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {idx + 1}. {item.text}
                </Typography>
                {item.subItems && item.subItems.length > 0 && (
                  <Stack spacing={0.5} sx={{ pl: 3, mt: 0.5 }}>
                    {item.subItems.map((subItem, subIdx) => (
                      <Typography key={subIdx} variant="body2" sx={{ fontSize: '0.875rem' }}>
                        • {subItem}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )
      } else {
        elements.push(
          <Stack key={`list-${elements.length}`} spacing={0.5} sx={{ pl: 2, mb: 1.5 }}>
            {currentListItems.map((item, idx) => (
              <Box key={idx}>
                <Typography variant="body2">
                  • {item.text}
                </Typography>
                {item.subItems && item.subItems.length > 0 && (
                  <Stack spacing={0.5} sx={{ pl: 3, mt: 0.5 }}>
                    {item.subItems.map((subItem, subIdx) => (
                      <Typography key={subIdx} variant="body2" sx={{ fontSize: '0.875rem' }}>
                        • {subItem}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )
      }
      currentListItems = []
      currentSubItems = []
      inNumberedList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const originalLine = line
    const nextLine = i < lines.length - 1 ? lines[i + 1] : ''

    if (!trimmed) {
      flushList()
      continue
    }

    // Check for heading (starts with ** and ends with **)
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList()
      flushSection()
      const headingText = trimmed.replace(/\*\*/g, '').replace(/:$/, '').trim()
      currentSection = { title: headingText, items: [] }
      continue
    }

    // Check for category heading (ends with colon, like "Tone:", "Point of View:")
    // But not if it's part of a numbered list or bullet
    if (trimmed.endsWith(':') && !trimmed.match(/^\d+\./) && !trimmed.match(/^[-•*]/)) {
      flushList()
      flushSection()
      const headingText = trimmed.replace(/:$/, '').trim()
      // Check if there's content after the colon on the same line
      const colonIndex = trimmed.indexOf(':')
      if (colonIndex < trimmed.length - 1) {
        const contentAfterColon = trimmed.substring(colonIndex + 1).trim()
        if (contentAfterColon) {
          currentSection = { title: headingText, items: [{ text: contentAfterColon }] }
        } else {
          currentSection = { title: headingText, items: [] }
        }
      } else {
        currentSection = { title: headingText, items: [] }
      }
      continue
    }

    // Check for numbered list item (starts with number followed by period)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (numberedMatch) {
      if (!inNumberedList) {
        flushList()
        inNumberedList = true
      }
      if (currentSubItems.length > 0 && currentListItems.length > 0) {
        currentListItems[currentListItems.length - 1].subItems = [...currentSubItems]
        currentSubItems = []
      }
      currentListItems.push({ text: numberedMatch[2] })
      continue
    }

    // Check for bullet point (starts with -, •, or *)
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/)
    if (bulletMatch) {
      // Check if this is a sub-bullet (original line has leading whitespace)
      const isSubBullet = originalLine.match(/^[\s\t]+[-•*]/)
      if (isSubBullet) {
        if (currentListItems.length > 0) {
          if (!currentListItems[currentListItems.length - 1].subItems) {
            currentListItems[currentListItems.length - 1].subItems = []
          }
          currentListItems[currentListItems.length - 1].subItems!.push(bulletMatch[1])
        } else if (currentSection) {
          if (currentSection.items.length > 0) {
            const lastItem = currentSection.items[currentSection.items.length - 1]
            if (!lastItem.subItems) {
              lastItem.subItems = []
            }
            lastItem.subItems!.push(bulletMatch[1])
          }
        }
      } else {
        if (inNumberedList) {
          flushList()
        }
        if (currentSubItems.length > 0 && currentListItems.length > 0) {
          currentListItems[currentListItems.length - 1].subItems = [...currentSubItems]
          currentSubItems = []
        }
        currentListItems.push({ text: bulletMatch[1] })
      }
      continue
    }

    // Regular text line
    if (currentSection) {
      currentSection.items.push({ text: trimmed })
    } else if (inNumberedList || currentListItems.length > 0) {
      // Continue current list item
      if (currentListItems.length > 0) {
        currentListItems[currentListItems.length - 1].text += ' ' + trimmed
      }
    } else {
      flushList()
      elements.push(
        <Typography
          key={`text-${elements.length}`}
          variant="body2"
          sx={{ mb: 1, lineHeight: 1.6 }}
        >
          {trimmed}
        </Typography>
      )
    }
  }

  flushList()
  flushSection()

  // If no elements were created, just render the content as-is
  if (elements.length === 0) {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {content}
      </Typography>
    )
  }

  return (
    <Box>
      {elements.map((element, index) => (
        <Box key={index}>{element}</Box>
      ))}
    </Box>
  )
}
