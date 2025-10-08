import { Brain, User, Bot, Wrench, AlertTriangle, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Helper function to render reasoning section if present
 */
export const renderReasoningSection = (reasoning: string) => {
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

/**
 * Helper function to determine if content should be rendered as raw text
 */
export const shouldRenderAsRawText = (role: string): boolean => {
  // Only tool outputs should be rendered as raw text to preserve formatting
  // Assistant messages should ALWAYS use markdown formatting
  return role === 'tool'
}

/**
 * Helper function to render content based on type
 */
export const renderMessageContent = (role: string, content: string) => {
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

/**
 * Get icon for message role
 */
export const getMessageIcon = (role: string) => {
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

/**
 * Get display name for roles
 */
export const getRoleDisplayName = (role: string): string => {
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

/**
 * Get background color for message role
 */
export const getMessageBgColor = (role: string) => {
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

/**
 * Map backend state names to display-friendly names
 */
export const getStateDisplayName = (state: string, _workflow_id?: string): string => {
  // Map state names based on workflow
  const stateMap: Record<string, string> = {
    'in_progress': 'Agent Turn',
    'agent_turn': 'Agent Turn',
    'user_turn': 'User Turn',
    'validation': 'Validation',
    'validating': 'Validating',
    'queued': 'Queued',
    'queued_for_function_execution': 'Function Execution',
    'function_execution': 'Function Execution',
    'help_required': 'Help Required',
    'action_required': 'Action Required',
    'completed': 'Completed',
    'failed': 'Failed',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
    'cancelling': 'Cancelling',
  }
  
  return stateMap[state] || state.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
