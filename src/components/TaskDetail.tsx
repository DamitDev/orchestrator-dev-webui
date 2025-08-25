import React, { useEffect, useRef } from 'react'
import { useTask, useTaskConversation } from '../hooks/useApi'
import Card from './ui/Card'
import StatusBadge from './ui/StatusBadge'
import LoadingSpinner from './ui/LoadingSpinner'
import { isRunningStatus } from '../lib/utils'
import { MessageSquare, User, Bot, Wrench, AlertTriangle, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ConversationMessage } from '../types/api'

interface TaskDetailProps {
  taskId: string
  refreshInterval: number
}

const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, refreshInterval }) => {
  const { data: task, isLoading: taskLoading } = useTask(taskId, refreshInterval)
  const { data: conversation, isLoading: conversationLoading } = useTaskConversation(taskId, refreshInterval)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const isLoading = taskLoading || conversationLoading

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversation && scrollContainerRef.current && conversation.conversation.length > 0) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 50)
    }
  }, [conversation]) // Only when conversation updates

  // Initial scroll to bottom when task is first selected
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Immediate scroll to bottom when task changes
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [taskId]) // Only when task changes

  // Calculate progress percentage - 100% if completed/failed, otherwise current/max
  const getProgressPercentage = () => {
    if (!task) return 0
    if (task.status === 'completed' || task.status === 'failed') {
      return 100
    }
    return Math.min((task.iteration / task.max_iterations) * 100, 100)
  }

  if (isLoading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (!task || !conversation) {
    return (
      <Card className="h-full">
        <div className="text-center text-gray-500 p-8">
          <p>Task not found</p>
        </div>
      </Card>
    )
  }

  // Helper function to render reasoning section if present
  const renderReasoningSection = (reasoning: string) => {
    return (
      <div className="mb-3">
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-2 p-2 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300 transition-colors">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Reasoning</span>
            <span className="text-xs text-blue-600 ml-auto group-open:hidden">(click to expand)</span>
            <span className="text-xs text-blue-600 ml-auto group-open:block hidden">(click to collapse)</span>
          </summary>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-900 whitespace-pre-wrap break-words font-mono leading-relaxed">
              {reasoning}
            </div>
          </div>
        </details>
      </div>
    )
  }

  // Helper function to determine if content should be rendered as raw text
  const shouldRenderAsRawText = (role: string): boolean => {
    // Only tool outputs should be rendered as raw text to preserve formatting
    // Assistant messages should ALWAYS use markdown formatting
    return role === 'tool'
  }

  // Helper function to render content based on type
  const renderMessageContent = (role: string, content: string) => {
    if (shouldRenderAsRawText(role)) {
      // For tool outputs and structured data, preserve exact formatting
      return (
        <pre className="text-sm text-gray-900 whitespace-pre-wrap break-words font-mono bg-gray-50 p-3 rounded border overflow-x-auto max-h-96 overflow-y-auto">
          {content}
        </pre>
      )
    } else {
      // For regular text messages, use markdown rendering
      return (
        <div className="text-sm text-gray-900 prose prose-sm max-w-none prose-p:my-2 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:border break-words overflow-hidden markdown-tables">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({children}) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-gray-300 text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({children}) => (
                <thead className="bg-gray-50">
                  {children}
                </thead>
              ),
              tbody: ({children}) => (
                <tbody className="bg-white">
                  {children}
                </tbody>
              ),
              tr: ({children}) => (
                <tr className="border-b border-gray-200">
                  {children}
                </tr>
              ),
              th: ({children}) => (
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900 bg-gray-50">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="border border-gray-300 px-4 py-2 text-gray-700">
                  {children}
                </td>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )
    }
  }

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4 text-blue-600" />
      case 'assistant':
        return <Bot className="h-4 w-4 text-green-600" />
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'developer':
        return <Wrench className="h-4 w-4 text-purple-600" />
      case 'tool':
        return <Wrench className="h-4 w-4 text-orange-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  // Helper function to get display name for roles
  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'user':
        return 'Orchestrator'
      case 'assistant':
        return 'Agent'
      case 'system':
        return 'System'
      case 'developer':
        return 'Developer'
      case 'tool':
        return 'Tool'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  const getMessageBgColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-50 border-blue-200'
      case 'assistant':
        return 'bg-green-50 border-green-200'
      case 'system':
        return 'bg-red-50 border-red-200'
      case 'developer':
        return 'bg-purple-50 border-purple-200'
      case 'tool':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Task Header */}
      <Card className="flex-shrink-0">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={task.status} />
                <span className="text-sm text-gray-500 font-mono">ID: {task.id}</span>
                {isRunningStatus(task.status) && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Running
                  </div>
                )}
              </div>
              
              <h2 className="text-lg font-semibold text-gray-900 mb-2 truncate max-w-full" title={task.goal_prompt}>
                {task.goal_prompt}
              </h2>
              
              {task.status === 'action_required' && task.approval_reason && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2">Supervisor Action Required</h3>
                      <p className="text-sm text-amber-700 leading-relaxed whitespace-pre-wrap">
                        {task.approval_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Progress:</span>
                  <span className="ml-2 font-medium">
                    {task.iteration}/{task.max_iterations} iterations
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium capitalize">
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              {task.result && (
                <div className="mt-4">
                  <span className="text-gray-600 text-sm">Result:</span>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-100 p-3 rounded-md">
                    {task.result}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                task.status === 'completed' ? 'bg-green-600' : 
                task.status === 'failed' ? 'bg-red-600' : 'bg-primary-600'
              }`}
              style={{ 
                width: `${getProgressPercentage()}%` 
              }}
            />
          </div>
        </div>
      </Card>

      {/* Conversation */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Conversation History</h3>
        </div>
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 conversation-scroll"
          style={{ minHeight: '400px' }}
        >
          <div className="space-y-4">
            {conversation.conversation.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No conversation yet</p>
              </div>
            ) : (
              <>
                {conversation.conversation.map((message: ConversationMessage, index: number) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getMessageBgColor(message.role)}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getMessageIcon(message.role)}
                      <span className="font-medium text-sm">
                        {getRoleDisplayName(message.role)}
                      </span>
                      {message.tool_calls && message.tool_calls.length > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Tool Call
                        </span>
                      )}
                    </div>
                    
                    {/* Reasoning section - appears before content */}
                    {message.reasoning && renderReasoningSection(message.reasoning)}
                    
                    {renderMessageContent(message.role, message.content)}
                    
                    {message.tool_calls && message.tool_calls.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-xs font-medium text-yellow-800 mb-2">
                          Tool Calls:
                        </div>
                        {message.tool_calls.map((toolCall: any, toolIndex: number) => (
                          <div key={toolIndex} className="text-xs text-yellow-700 mb-3 last:mb-0">
                            {/* Tool call reasoning if present */}
                            {toolCall.reasoning && (
                              <div className="mb-2">
                                <details className="group">
                                  <summary className="cursor-pointer flex items-center gap-2 p-2 bg-yellow-200 hover:bg-yellow-300 rounded border border-yellow-400 transition-colors">
                                    <Brain className="h-3 w-3 text-yellow-700" />
                                    <span className="text-xs font-medium text-yellow-800">Tool Call Reasoning</span>
                                    <span className="text-xs text-yellow-600 ml-auto group-open:hidden">(expand)</span>
                                    <span className="text-xs text-yellow-600 ml-auto group-open:block hidden">(collapse)</span>
                                  </summary>
                                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                                    <div className="text-xs text-yellow-900 whitespace-pre-wrap break-words font-mono leading-relaxed">
                                      {toolCall.reasoning}
                                    </div>
                                  </div>
                                </details>
                              </div>
                            )}
                            
                            <span className="font-medium">{toolCall.function?.name || 'Unknown'}</span>
                            {toolCall.function?.arguments && (
                              <pre className="mt-1 text-xs bg-yellow-100 p-2 rounded overflow-x-auto break-all whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {/* Invisible div to scroll to */}
                <div ref={conversationEndRef} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetail
