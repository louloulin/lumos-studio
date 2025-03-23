import React from 'react'
import { cn } from '@/lib/utils'
import {
  Accordion as ShadcnAccordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'

// 保持原有的API接口兼容性
export interface AccordionProps {
  expanded?: boolean
  onChange?: (event: React.SyntheticEvent, expanded: boolean) => void
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export const Accordion = React.forwardRef<
  HTMLDivElement,
  AccordionProps
>(({ expanded, onChange, children, className, ...props }, ref) => {
  // 处理单个Accordion的情况
  const handleValueChange = (value: string) => {
    if (onChange) {
      onChange({} as React.SyntheticEvent, value === 'item-1')
    }
  }

  return (
    <ShadcnAccordion
      ref={ref}
      type="single"
      collapsible
      className={cn('border rounded-md', className)}
      value={expanded ? 'item-1' : ''}
      onValueChange={handleValueChange}
      {...props}
    >
      <AccordionItem value="item-1" className="border-0">
        {children}
      </AccordionItem>
    </ShadcnAccordion>
  )
})

Accordion.displayName = 'Accordion'

export interface AccordionSummaryProps extends React.HTMLAttributes<HTMLButtonElement> {
  expandIcon?: React.ReactNode
}

export const AccordionSummary = React.forwardRef<
  HTMLButtonElement,
  AccordionSummaryProps
>(({ children, className, expandIcon, ...props }, ref) => {
  return (
    <AccordionTrigger
      ref={ref}
      className={cn('px-4 py-2 hover:no-underline', className)}
      {...props}
    >
      <div className="flex-grow">{children}</div>
    </AccordionTrigger>
  )
})

AccordionSummary.displayName = 'AccordionSummary'

export interface AccordionDetailsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionDetails = React.forwardRef<
  HTMLDivElement,
  AccordionDetailsProps
>(({ children, className, ...props }, ref) => {
  return (
    <AccordionContent
      ref={ref}
      className={cn('px-4', className)}
      {...props}
    >
      {children}
    </AccordionContent>
  )
})

AccordionDetails.displayName = 'AccordionDetails'
