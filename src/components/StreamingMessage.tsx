import React from 'react'
import { Brain, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { StreamingMessage as StreamingMessageType } from '../hooks/useStreamingMessages'
import {
  renderReasoningSection,
  getMessageIcon,
  getRoleDisplayName,
  getMessageBgColor,
} from '../lib/taskUtils'

interface StreamingMessageProps {
  message: StreamingMessageType
  showTimestamp?: boolean
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  message, 
  showTimestamp = true 
}) => {
  return (
    <div
      className={`border rounded-lg p-4 ${getMessageBgColor(message.role)} ${
        message.isStreaming ? 'ring-2 ring-blue-200 ring-opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {getMessageIcon(message.role)}
        <span className="font-medium text-sm">
          {getRoleDisplayName(message.role)}
        </span>
        {message.isStreaming && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Streaming...</span>
          </div>
        )}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
            Tool Call
          </span>
        )}
        {showTimestamp && message.created_at && (
          <span className="text-xs text-gray-500 ml-auto font-mono">
            {new Date(message.created_at).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {/* Reasoning section - appears before content */}
      {message.reasoning && renderReasoningSection(message.reasoning)}
      
      {/* Message content with streaming indicator */}
      <div className="relative">
        {message.content ? (
          <div className="prose prose-sm max-w-none prose-p:my-2 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:border break-words overflow-hidden">
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
              {message.content}
            </ReactMarkdown>
          </div>
        ) : null}
        
        {/* Streaming cursor */}
        {message.isStreaming && (
          <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
        )}
      </div>
      
      {/* Tool calls */}
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
                  {(() => {
                    try {
                      // Try to parse as JSON and format it
                      const parsed = JSON.parse(toolCall.function.arguments)
                      return JSON.stringify(parsed, null, 2)
                    } catch (error) {
                      // If parsing fails (incomplete JSON during streaming), show raw arguments
                      return toolCall.function.arguments
                    }
                  })()}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StreamingMessage
