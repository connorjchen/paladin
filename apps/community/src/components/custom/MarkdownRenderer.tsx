import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // Process content to convert task lists to checkboxes
  const processedContent = content
    .replace(/- \[ \] (.*)/g, '<input type="checkbox" disabled /> $1')
    .replace(/- \[x\] (.*)/gi, '<input type="checkbox" checked disabled /> $1')

  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Custom link component to open external links in new tab
          a: ({ href, children, ...props }) => {
            // Only truncate if children is the same as href (no custom link text)
            const hasCustomText = children !== href
            const isLongUrl = href && href.length > 50 && !hasCustomText
            const displayText = isLongUrl
              ? `${href.substring(0, 47)}...`
              : children

            return (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={
                  href?.startsWith('http') ? 'noopener noreferrer' : undefined
                }
                className="cursor-pointer break-all text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                title={href}
                {...props}
              >
                {displayText}
              </a>
            )
          },
          // Custom code block component
          pre: ({ children, ...props }) => (
            <pre
              className="overflow-x-auto rounded-lg border bg-gray-100 p-3 font-mono text-sm dark:bg-gray-800"
              {...props}
            >
              {children}
            </pre>
          ),
          // Custom inline code component
          code: ({ children, ...props }) => (
            <code
              className="rounded border bg-gray-100 px-1.5 py-0.5 font-mono text-sm dark:bg-gray-800"
              {...props}
            >
              {children}
            </code>
          ),
          // Custom image component
          img: ({ src, alt, ...props }) => (
            <a
              className="block"
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              title={alt || 'Open image in new tab'}
            >
              <img
                src={src}
                alt={alt || 'Image'}
                className="my-4 block h-auto max-h-[400px] min-h-[150px] w-auto min-w-[150px] max-w-[400px] rounded-lg object-contain"
                {...props}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
                {...props}
              />
            </a>
          ),
          // Custom blockquote component
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="rounded-r-lg border-l-4 border-gray-300 bg-gray-50 py-2 pl-4 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Custom heading component for consistent styling
          h3: ({ children, ...props }) => (
            <h3
              className="mb-3 mt-6 text-lg font-semibold text-gray-900"
              {...props}
            >
              {children}
            </h3>
          ),
          // Custom paragraph component to ensure proper spacing
          p: ({ children, ...props }) => (
            <p className="mb-4 last:mb-0" {...props}>
              {children}
            </p>
          ),
          // Custom list items to handle checkboxes
          li: ({ children, ...props }) => {
            const content = String(children)
            if (content.includes('<input type="checkbox"')) {
              return (
                <li className="flex list-none items-start gap-2" {...props}>
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </li>
              )
            }
            return <li {...props}>{children}</li>
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
})
