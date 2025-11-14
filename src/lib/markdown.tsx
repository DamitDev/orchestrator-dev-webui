import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

function isToolRole(role: string): boolean { return role === 'tool' }
function isSystemRole(role: string): boolean { return role === 'system' }
function isDeveloperRole(role: string): boolean { return role === 'developer' }

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

  if (isSystemRole(role) || isDeveloperRole(role)) {
    // For system and developer prompts, use markdown but limit height to ~10 lines
    return (
      <div className="text-sm text-nord3 dark:text-nord4 max-h-[15rem] overflow-y-auto border border-nord4 dark:border-nord3 rounded-lg p-3 bg-nord5/30 dark:bg-nord2/30">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            code: ({ node, inline, className, children, ...props }: any) => {
              const isInline = inline !== false && !className
              return isInline 
                ? <code className="text-xs bg-nord10/10 dark:bg-nord8/20 px-1 py-0.5 rounded border border-nord10/20 dark:border-nord8/40 text-nord10 dark:text-nord8" style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-0.05em' }} {...props}>{children}</code>
                : <code className="block text-xs bg-nord4 dark:bg-nord1 px-2 py-1 rounded border border-nord4/50 dark:border-nord2/30">{children}</code>
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="text-sm text-gray-900 dark:text-gray-100 break-words overflow-hidden">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Paragraphs with proper spacing
          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
          
          // Headings
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0 text-nord0 dark:text-nord6">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-2 mt-3 first:mt-0 text-nord0 dark:text-nord6">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-nord0 dark:text-nord6">{children}</h3>,
          h4: ({ children }) => <h4 className="text-base font-semibold mb-2 mt-2 first:mt-0 text-nord0 dark:text-nord6">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-nord0 dark:text-nord6">{children}</h5>,
          h6: ({ children }) => <h6 className="text-xs font-semibold mb-1 mt-2 first:mt-0 text-nord0 dark:text-nord6">{children}</h6>,
          
          // Lists
          ul: ({ children }) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          
          // Code blocks and inline code
          code: ({ node, inline, className, children, ...props }: any) => {
            // Check if this is inline code (has parent that's not <pre>)
            const isInline = inline !== false && !className
            
            if (isInline) {
              return (
                <code 
                  className="bg-nord10/10 dark:bg-nord8/20 px-1 py-0.5 rounded text-xs font-mono text-nord10 dark:text-nord8 border border-nord10/20 dark:border-nord8/40"
                  style={{ display: 'inline', verticalAlign: 'middle', position: 'relative', top: '-0.05em' }}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <pre className="bg-nord5 dark:bg-nord2 p-3 rounded-lg overflow-x-auto mb-3 border border-nord4 dark:border-nord3">
                <code className="text-xs font-mono text-nord0 dark:text-nord6">{children}</code>
              </pre>
            )
          },
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-nord8 dark:border-nord8 pl-4 my-3 italic text-nord3 dark:text-nord4">
              {children}
            </blockquote>
          ),
          
          // Horizontal rule
          hr: () => <hr className="border-t border-nord4 dark:border-nord3 my-4" />,
          
          // Links
          a: ({ children, href }) => (
            <a href={href} className="text-nord8 dark:text-nord8 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          
          // Strong and emphasis
          strong: ({ children }) => <strong className="font-bold text-nord0 dark:text-nord6">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          
          // Line breaks
          br: () => <br />,
          
          // Tables
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


