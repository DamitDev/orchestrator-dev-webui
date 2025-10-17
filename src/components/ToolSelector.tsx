import React, { useState, useMemo } from 'react'
import { useTools } from '../hooks/useApi'
import { Search, Check, Server, Wrench } from 'lucide-react'
import type { ToolInfo } from '../types/api'

interface ToolSelectorProps {
  selectedTools: string[] | null
  onToolsChange: (tools: string[] | null) => void
  className?: string
}

const ToolSelector: React.FC<ToolSelectorProps> = ({ 
  selectedTools, 
  onToolsChange, 
  className = '' 
}) => {
  const { data: toolsData, isLoading, error } = useTools()
  const [searchTerm, setSearchTerm] = useState('')

  const tools = toolsData?.tools || []

  // Helper functions to determine selection state
  const isAllToolsSelected = selectedTools === null
  const isNoToolsSelected = selectedTools !== null && selectedTools.length === 0

  // Get the actual selected tools array for UI purposes
  const actualSelectedTools = selectedTools === null ? tools.map(tool => tool.name) : selectedTools

  // Filter tools based on search term
  const filteredTools = useMemo(() => {
    if (!searchTerm.trim()) return tools
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.server.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [tools, searchTerm])

  // Group tools by server
  const toolsByServer = useMemo(() => {
    const grouped: { [server: string]: ToolInfo[] } = {}
    filteredTools.forEach(tool => {
      if (!grouped[tool.server]) {
        grouped[tool.server] = []
      }
      grouped[tool.server].push(tool)
    })
    return grouped
  }, [filteredTools])

  const handleToolToggle = (toolName: string) => {
    if (isAllToolsSelected) {
      // If all tools are selected, deselect this one and select all others
      const otherTools = tools.filter(tool => tool.name !== toolName).map(tool => tool.name)
      onToolsChange(otherTools)
    } else if (actualSelectedTools.includes(toolName)) {
      // If this tool is selected, deselect it
      const newSelectedTools = actualSelectedTools.filter(t => t !== toolName)
      onToolsChange(newSelectedTools.length === 0 ? [] : newSelectedTools)
    } else {
      // If this tool is not selected, add it
      const newSelectedTools = [...actualSelectedTools, toolName]
      // If we now have all tools selected, send null
      if (newSelectedTools.length === tools.length) {
        onToolsChange(null)
      } else {
        onToolsChange(newSelectedTools)
      }
    }
  }

  const handleSelectAll = () => {
    onToolsChange(null) // null means all tools are available
  }

  const handleSelectNone = () => {
    onToolsChange([]) // empty array means no tools are available
  }

  const handleSelectServer = (server: string) => {
    const serverTools = toolsByServer[server] || []
    const serverToolNames = serverTools.map(tool => tool.name)
    const allServerToolsSelected = serverToolNames.every(name => actualSelectedTools.includes(name))
    
    if (allServerToolsSelected) {
      // Deselect all tools from this server
      const newSelectedTools = actualSelectedTools.filter(name => !serverToolNames.includes(name))
      onToolsChange(newSelectedTools.length === 0 ? [] : newSelectedTools)
    } else {
      // Select all tools from this server
      const newSelectedTools = [...actualSelectedTools]
      serverToolNames.forEach(name => {
        if (!newSelectedTools.includes(name)) {
          newSelectedTools.push(name)
        }
      })
      // If we now have all tools selected, send null
      if (newSelectedTools.length === tools.length) {
        onToolsChange(null)
      } else {
        onToolsChange(newSelectedTools)
      }
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-red-600 text-sm">
          Failed to load tools: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available Tools
          </label>
          <p className="text-xs text-gray-500">
            Select which tools this task can use. All tools are selected by default.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleSelectNone}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Select None
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tools..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Tools List */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        {Object.keys(toolsByServer).length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchTerm ? 'No tools match your search' : 'No tools available'}
          </div>
        ) : (
          Object.entries(toolsByServer).map(([server, serverTools]) => (
            <div key={server} className="border-b border-gray-100 last:border-b-0">
              {/* Server Header */}
              <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {server === 'builtin' ? 'Built-in Tools' : server}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({serverTools.length} tools)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectServer(server)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {serverTools.every(tool => actualSelectedTools.includes(tool.name)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Tools in this server */}
              <div className="divide-y divide-gray-100">
                {serverTools.map((tool) => (
                  <div
                    key={tool.name}
                    className={`px-3 py-2 hover:bg-gray-50 transition-colors ${
                      actualSelectedTools.includes(tool.name) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToolToggle(tool.name)}
                        className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          actualSelectedTools.includes(tool.name)
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {actualSelectedTools.includes(tool.name) && (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Wrench className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {tool.name}
                          </span>
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
      </div>

      {/* Selection Summary */}
      {!isNoToolsSelected && (
        <div className={`border rounded-md p-3 ${
          isAllToolsSelected 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              isAllToolsSelected ? 'text-green-800' : 'text-blue-800'
            }`}>
              {isAllToolsSelected ? (
                <>All <strong>{tools.length}</strong> tools available</>
              ) : (
                <><strong>{actualSelectedTools.length}</strong> tool{actualSelectedTools.length !== 1 ? 's' : ''} selected</>
              )}
            </span>
            <button
              type="button"
              onClick={handleSelectNone}
              className={`text-xs underline ${
                isAllToolsSelected 
                  ? 'text-green-600 hover:text-green-800' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isAllToolsSelected ? 'Disable all tools' : 'Clear selection'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolSelector
