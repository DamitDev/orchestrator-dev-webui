import React, { useMemo } from 'react'
import { useTools } from '../hooks/useApi'
import { Accordion, AccordionItem } from './ui/Accordion'
import { Server, Wrench } from 'lucide-react'
import type { Task, ToolInfo } from '../types/api'

interface AllowedToolsAccordionProps {
  task: Task
  className?: string
}

const AllowedToolsAccordion: React.FC<AllowedToolsAccordionProps> = ({ 
  task, 
  className = '' 
}) => {
  const { data: toolsData, isLoading, error } = useTools()

  const tools = toolsData?.tools || []

  // Get tools that are allowed for this task
  const allowedTools = useMemo(() => {
    if (task.available_tools === null) {
      return tools // null means all tools are available
    }
    if (task.available_tools && task.available_tools.length === 0) {
      return [] // empty array means no tools are available
    }
    if (task.available_tools) {
      return tools.filter(tool => task.available_tools!.includes(tool.name))
    }
    return tools // fallback to all tools if undefined
  }, [tools, task.available_tools])

  // Get currently available tool names for offline detection
  const availableToolNames = useMemo(() => {
    return new Set(tools.map(tool => tool.name))
  }, [tools])

  // Find offline tools (tools that were available when task was created but are not available now)
  const offlineTools = useMemo(() => {
    if (!task.available_tools || task.available_tools.length === 0) {
      return []
    }
    return task.available_tools.filter(toolName => !availableToolNames.has(toolName))
  }, [task.available_tools, availableToolNames])

  // Group allowed tools by server
  const toolsByServer = useMemo(() => {
    const grouped: { [server: string]: ToolInfo[] } = {}
    allowedTools.forEach(tool => {
      if (!grouped[tool.server]) {
        grouped[tool.server] = []
      }
      grouped[tool.server].push(tool)
    })
    return grouped
  }, [allowedTools])

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-red-600 text-sm">
          Failed to load tools: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  // If no tools are available or no restrictions are set
  if (tools.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center text-gray-500 py-4">
          <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No tools available</p>
        </div>
      </div>
    )
  }

  // If all tools are allowed (null means all tools available)
  if (task.available_tools === null) {
    return (
      <div className={`${className}`}>
        <Accordion>
          <AccordionItem title="Allowed Tools (All tools available)" defaultOpen={false}>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                This task has access to all available tools ({tools.length} total)
              </div>
              {Object.entries(toolsByServer).map(([server, serverTools]) => (
                <div key={server} className="border border-gray-200 rounded-md">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {server === 'builtin' ? 'Built-in Tools' : server}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({serverTools.length} tools)
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {serverTools.map((tool) => (
                      <div key={tool.name} className="px-3 py-2">
                        <div className="flex items-start gap-2">
                          <Wrench className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {tool.name}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Offline Tools Section */}
              {offlineTools.length > 0 && (
                <div className="border border-red-200 rounded-md bg-red-50">
                  <div className="bg-red-100 px-3 py-2 border-b border-red-200">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        Offline Tools
                      </span>
                      <span className="text-xs text-red-600">
                        ({offlineTools.length} tool{offlineTools.length !== 1 ? 's' : ''} offline)
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-red-100">
                    {offlineTools.map((toolName) => (
                      <div key={toolName} className="px-3 py-2">
                        <div className="flex items-start gap-2">
                          <Wrench className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-red-900">
                                {toolName}
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">
                                OFFLINE
                              </span>
                            </div>
                            <p className="text-xs text-red-600 leading-relaxed mt-1">
                              This tool was available when the task was created but is currently offline
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }

  // If no tools are available (empty array)
  if (task.available_tools && task.available_tools.length === 0) {
    return (
      <div className={`${className}`}>
        <Accordion>
          <AccordionItem title="Allowed Tools (No tools available)" defaultOpen={false}>
            <div className="space-y-3">
              <div className="text-center text-gray-500 py-4">
                <Wrench className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No tools available for this task</p>
              </div>
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }

  // If specific tools are restricted
  return (
    <div className={`${className}`}>
      <Accordion>
        <AccordionItem 
          title={`Allowed Tools (${allowedTools.length} of ${tools.length} available)`} 
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              This task is restricted to {allowedTools.length} specific tool{allowedTools.length !== 1 ? 's' : ''}
            </div>
            {Object.keys(toolsByServer).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <Wrench className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No allowed tools found</p>
              </div>
            ) : (
              Object.entries(toolsByServer).map(([server, serverTools]) => (
                <div key={server} className="border border-gray-200 rounded-md">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {server === 'builtin' ? 'Built-in Tools' : server}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({serverTools.length} tools)
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {serverTools.map((tool) => (
                      <div key={tool.name} className="px-3 py-2">
                        <div className="flex items-start gap-2">
                          <Wrench className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {tool.name}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {/* Offline Tools Section */}
            {offlineTools.length > 0 && (
              <div className="border border-red-200 rounded-md bg-red-50">
                <div className="bg-red-100 px-3 py-2 border-b border-red-200">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      Offline Tools
                    </span>
                    <span className="text-xs text-red-600">
                      ({offlineTools.length} tool{offlineTools.length !== 1 ? 's' : ''} offline)
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-red-100">
                  {offlineTools.map((toolName) => (
                    <div key={toolName} className="px-3 py-2">
                      <div className="flex items-start gap-2">
                        <Wrench className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-red-900">
                              {toolName}
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">
                              OFFLINE
                            </span>
                          </div>
                          <p className="text-xs text-red-600 leading-relaxed mt-1">
                            This tool was available when the task was created but is currently offline
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default AllowedToolsAccordion
