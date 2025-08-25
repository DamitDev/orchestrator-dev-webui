import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  onClick?: () => void
}

const Card: React.FC<CardProps> = ({ children, className, title, subtitle, onClick }) => {
  const hasHeader = title || subtitle
  const isFlexCard = className?.includes('flex')
  
  return (
    <div 
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200', 
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {hasHeader && (
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className={cn(
        isFlexCard && hasHeader ? "flex-1 min-h-0" : "px-6 py-4",
        !isFlexCard && "px-6 py-4"
      )}>
        {children}
      </div>
    </div>
  )
}

export default Card
