import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function isToolRole(role: string): boolean { return role === 'tool' }
function isSystemRole(role: string): boolean { return role === 'system' }

function CollapsibleToolOutput({ content, initialExpanded }: { content: string; initialExpanded: boolean }) {
  const [expanded, setExpanded] = useState<boolean>(initialExpanded)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (expanded && scrollRef.current) {
      // Scroll to bottom so latest output is visible first
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [expanded, content])

  if (!expanded) {
    return (
      <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between bg-gray-50 dark:bg-gray-900 border rounded px-2 py-1 dark:border-gray-700">
        <span className="truncate">Tool output collapsed</span>
        <button onClick={() => setExpanded(true)} className="px-2 py-0.5 border rounded bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Expand</button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-end gap-2 text-xs text-gray-600 dark:text-gray-400">
        <button onClick={() => setExpanded(false)} className="px-2 py-0.5 border rounded bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">Collapse</button>
      </div>
      <div ref={scrollRef} className="max-h-40 overflow-auto border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
        <pre className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words font-mono p-3">
          {content}
        </pre>
      </div>
    </div>
  )
}

export function MessageContent({ role, content, isLatestTool }: { role: string; content: string; isLatestTool?: boolean }) {
  if (isToolRole(role)) {
    return <CollapsibleToolOutput content={content} initialExpanded={!!isLatestTool} />
  }

  if (isSystemRole(role)) {
    return (
      <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded border dark:border-gray-700 overflow-x-auto">
        {content}
      </pre>
    )
  }

  return (
    <div className="text-sm text-gray-900 dark:text-gray-100 break-words overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-white dark:bg-gray-900">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">{children}</th>
          ),
          td: ({ children }) => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}


