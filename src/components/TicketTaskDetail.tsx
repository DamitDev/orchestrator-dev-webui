import React, { useEffect, useRef, useState } from 'react'
import { useTask, useTaskConversation, useTicketGuideTask } from '../hooks/useApi'
import Card from './ui/Card'
import StatusBadge from './ui/StatusBadge'
import LoadingSpinner from './ui/LoadingSpinner'
import Button from './ui/Button'
import AllowedToolsAccordion from './AllowedToolsAccordion'
import { isRunningStatus, formatMessageTimestamp } from '../lib/utils'
import { MessageSquare, AlertTriangle, Brain, MessageCircle, X, Ticket } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ConversationMessage } from '../types/api'
import {
  renderReasoningSection,
  renderMessageContent,
  getMessageIcon,
  getRoleDisplayName,
  getMessageBgColor,
  getStateDisplayName,
} from '../lib/taskUtils'

interface TicketTaskDetailProps {
  taskId: string
}

const TicketTaskDetail: React.FC<TicketTaskDetailProps> = ({ taskId }) => {
  const { data: task, isLoading: taskLoading } = useTask(taskId)
  const { data: conversation, isLoading: conversationLoading } = useTaskConversation(taskId)
  const guideTask = useTicketGuideTask()
  
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [guideMessage, setGuideMessage] = useState('')

  const isLoading = taskLoading || conversationLoading

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (conversation && scrollContainerRef.current && conversation.conversation.length > 0) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 50)
    }
  }, [conversation])

  // Initial scroll to bottom when task is first selected
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [taskId])

  // Calculate progress percentage - 100% if completed/failed, otherwise current/max
  const getProgressPercentage = () => {
    if (!task) return 0
    if (task.status === 'completed' || task.status === 'failed') {
      return 100
    }
    return Math.min((task.iteration / task.max_iterations) * 100, 100)
  }

  // Handle guide message submission
  const handleGuideSubmit = async () => {
    if (!guideMessage.trim()) return
    
    try {
      await guideTask.mutateAsync({ taskId, message: guideMessage.trim() })
      setGuideMessage('')
      setShowGuideModal(false)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  // Check if task can be guided (all states except cancelling, canceled, failed, completed)
  const canGuideTask = task && !['cancelling', 'canceled', 'cancelled', 'failed', 'completed'].includes(task.status)

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

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Task Header */}
      <Card className="flex-shrink-0">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={task.status} />
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                  TICKET
                </span>
                {task.ticket_id && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    {task.ticket_id}
                  </span>
                )}
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

              {task.status === 'help_required' && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-800 mb-2">Agent Needs Help</h3>
                      <p className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
                        {task.approval_reason || 'Agent is requesting help...'}
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
                  <span className="ml-2 font-medium">
                    {getStateDisplayName(task.status, task.workflow_id)}
                  </span>
                </div>
              </div>
              
              {task.result && (
                <div className="mt-4">
                  <span className="text-gray-600 text-sm">Result:</span>
                  <div className="mt-1 text-sm text-gray-900 bg-green-50 border border-green-200 p-3 rounded-md prose prose-sm max-w-none prose-p:my-2 prose-code:bg-green-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-green-100 prose-pre:border break-words overflow-hidden markdown-tables">
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
                      {task.result}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
            
            {/* Guide Task Button */}
            {canGuideTask && (
              <div className="flex-shrink-0 ml-4">
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => setShowGuideModal(true)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Guide Task
                </Button>
              </div>
            )}
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
          
          {/* Allowed Tools Accordion */}
          <AllowedToolsAccordion task={task} />
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
                      {message.created_at && (
                        <span className="text-xs text-gray-500 ml-auto font-mono">
                          {formatMessageTimestamp(message.created_at)}
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

      {/* Guide Task Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Guide Task</h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="guide-message" className="block text-sm font-medium text-gray-700 mb-2">
                  Guidance Message
                </label>
                <textarea
                  id="guide-message"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter your guidance message to help the task execution..."
                  value={guideMessage}
                  onChange={(e) => setGuideMessage(e.target.value)}
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How guidance works:</p>
                    <p>Your message will interrupt the current task execution and provide guidance to help steer the task in the right direction.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowGuideModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  onClick={handleGuideSubmit}
                  disabled={!guideMessage.trim() || guideTask.isPending}
                  className="flex items-center gap-2"
                >
                  {guideTask.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  {guideTask.isPending ? 'Sending...' : 'Send Guidance'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketTaskDetail
