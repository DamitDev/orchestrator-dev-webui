import React from 'react'
import { AlertTriangle, Wrench, X } from 'lucide-react'
import type { Task, ToolInfo } from '../types/api'

interface ToolOfflineWarningProps {
  task: Task
  allTools: ToolInfo[]
  className?: string
}

const ToolOfflineWarning: React.FC<ToolOfflineWarningProps> = ({ 
  task, 
  allTools, 
  className = '' 
}) => {
  // If no tools are restricted for this task, don't show warning
  if (!task.available_tools || task.available_tools.length === 0) {
    return null
  }

  // Get currently available tool names
  const availableToolNames = allTools.map(tool => tool.name)
  
  // Find which tools are offline (in task's available_tools but not in current allTools)
  const offlineTools = task.available_tools.filter(
    toolName => !availableToolNames.includes(toolName)
  )

  // If no tools are offline, don't show warning
  if (offlineTools.length === 0) {
    return null
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-amber-800">
              Tool Offline Warning
            </h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {offlineTools.length} tool{offlineTools.length !== 1 ? 's' : ''} offline
            </span>
          </div>
          <p className="text-sm text-amber-700 mb-2">
            Some tools that were available when this task was created are now offline. 
            The task will continue with the remaining available tools.
          </p>
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-800">Offline tools:</p>
            <div className="flex flex-wrap gap-1">
              {offlineTools.map((toolName) => (
                <span
                  key={toolName}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-amber-100 text-amber-800 border border-amber-200"
                >
                  <Wrench className="h-3 w-3" />
                  {toolName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolOfflineWarning
