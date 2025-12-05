'use client'

import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material'
import { ExpandMore } from '@mui/icons-material'
import { ReactNode, useState } from 'react'

interface AccordionSectionProps {
  title: string | ReactNode
  defaultExpanded?: boolean
  children: ReactNode
  onChange?: (expanded: boolean) => void
  icon?: ReactNode
}

export function AccordionSection({
  title,
  defaultExpanded = false,
  children,
  onChange,
  icon,
}: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const handleChange = (_: unknown, isExpanded: boolean) => {
    setExpanded(isExpanded)
    onChange?.(isExpanded)
  }

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        {typeof title === 'string' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            {icon}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        ) : (
          title
        )}
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}
