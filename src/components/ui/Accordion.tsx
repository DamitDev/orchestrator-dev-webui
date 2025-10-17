import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

interface AccordionProps {
  children: React.ReactNode
  className?: string
  allowMultiple?: boolean
}

const AccordionItem: React.FC<AccordionItemProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

const Accordion: React.FC<AccordionProps> = ({ 
  children, 
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
    </div>
  )
}

export { Accordion, AccordionItem }
