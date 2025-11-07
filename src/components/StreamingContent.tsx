import { useRef, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface StreamingContentProps {
  content: string
}

export function StreamingContent({ content }: StreamingContentProps) {
  const previousContentRef = useRef('')
  const [stableContent, setStableContent] = useState('')
  const [newContent, setNewContent] = useState('')
  
  useEffect(() => {
    const previous = previousContentRef.current
    
    // If content grew, split into stable (old) and new parts
    if (content.length > previous.length && content.startsWith(previous)) {
      setStableContent(previous)
      setNewContent(content.slice(previous.length))
    } else {
      // Content changed completely (shouldn't happen during streaming, but handle it)
      setStableContent(content)
      setNewContent('')
    }
    
    previousContentRef.current = content
  }, [content])
  
  return (
    <div className="text-sm text-gray-900 dark:text-gray-100 break-words overflow-hidden">
      {/* Stable content - no animation */}
      {stableContent && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={getMarkdownComponents(false)}
        >
          {stableContent}
        </ReactMarkdown>
      )}
      
      {/* New content - with animation */}
      {newContent && (
        <span className="inline-block token-stream">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={getMarkdownComponents(true)}
          >
            {newContent}
          </ReactMarkdown>
        </span>
      )}
    </div>
  )
}

function getMarkdownComponents(animate: boolean) {
  const animationClass = animate ? 'token-stream' : ''
  
  return {
    p: ({ children }: any) => <p className={`mb-3 last:mb-0 leading-relaxed ${animationClass}`}>{children}</p>,
    h1: ({ children }: any) => <h1 className={`text-2xl font-bold mb-3 mt-4 first:mt-0 text-nord0 dark:text-nord6 ${animationClass}`}>{children}</h1>,
    h2: ({ children }: any) => <h2 className={`text-xl font-bold mb-2 mt-3 first:mt-0 text-nord0 dark:text-nord6 ${animationClass}`}>{children}</h2>,
    h3: ({ children }: any) => <h3 className={`text-lg font-semibold mb-2 mt-3 first:mt-0 text-nord0 dark:text-nord6 ${animationClass}`}>{children}</h3>,
    h4: ({ children }: any) => <h4 className={`text-base font-semibold mb-2 mt-2 first:mt-0 text-nord0 dark:text-nord6 ${animationClass}`}>{children}</h4>,
    h5: ({ children }: any) => <h5 className={`text-sm font-semibold mb-1 mt-2 first:mt-0 text-nord0 dark:text-nord6 ${animationClass}`}>{children}</h5>,
    h6: ({ children }: any) => <h6 className={`text-xs font-semibold mb-1 mt-2 first:mt-0 text-nord0 dark:text-nord6 ${animationClass}`}>{children}</h6>,
    ul: ({ children }: any) => <ul className={`list-disc list-outside ml-5 mb-3 space-y-1 ${animationClass}`}>{children}</ul>,
    ol: ({ children }: any) => <ol className={`list-decimal list-outside ml-5 mb-3 space-y-1 ${animationClass}`}>{children}</ol>,
    li: ({ children }: any) => <li className={`leading-relaxed ${animationClass}`}>{children}</li>,
    code: ({ inline, children }: any) => {
      if (inline) {
        return <code className={`bg-nord5/50 dark:bg-nord2 px-1.5 py-0.5 rounded text-xs font-mono text-nord10 dark:text-nord8 ${animationClass}`}>{children}</code>
      }
      return (
        <pre className={`bg-nord5 dark:bg-nord2 p-3 rounded-lg overflow-x-auto mb-3 border border-nord4 dark:border-nord3 ${animationClass}`}>
          <code className="text-xs font-mono text-nord0 dark:text-nord6">{children}</code>
        </pre>
      )
    },
    blockquote: ({ children }: any) => (
      <blockquote className={`border-l-4 border-nord8 dark:border-nord8 pl-4 my-3 italic text-nord3 dark:text-nord4 ${animationClass}`}>
        {children}
      </blockquote>
    ),
    hr: () => <hr className={`border-t border-nord4 dark:border-nord3 my-4 ${animationClass}`} />,
    a: ({ children, href }: any) => (
      <a href={href} className={`text-nord8 dark:text-nord8 hover:underline ${animationClass}`} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    strong: ({ children }: any) => <strong className={`font-bold text-nord0 dark:text-nord6 ${animationClass}`}>{children}</strong>,
    em: ({ children }: any) => <em className={`italic ${animationClass}`}>{children}</em>,
    br: () => <br />,
    table: ({ children }: any) => (
      <div className={`overflow-x-auto my-3 ${animationClass}`}>
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700 text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="bg-white dark:bg-gray-900">{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>,
    th: ({ children }: any) => (
      <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">{children}</th>
    ),
    td: ({ children }: any) => <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
  }
}

