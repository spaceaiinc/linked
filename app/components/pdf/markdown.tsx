import { FC, memo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import Link from 'next/link'
import remarkGfm from 'remark-gfm'

interface MemoizedReactMarkdownProps {
  children: string
  className?: string
  remarkPlugins?: any[]
  components?: Components
}

const MemoizedReactMarkdown: FC<MemoizedReactMarkdownProps> = memo(
  function MemoizedReactMarkdown({ children, ...props }) {
    const defaultComponents = {
      ol: ({ children, ...props }: any) => (
        <ol className="list-decimal list-outside ml-4" {...props}>
          {children}
        </ol>
      ),
      ul: ({ children, ...props }: any) => (
        <ul className="list-disc list-outside ml-4 space-y-0.5" {...props}>
          {children}
        </ul>
      ),
      li: ({ children, ...props }: any) => (
        <li className="py-0" {...props}>
          {children}
        </li>
      ),
      strong: ({ children, ...props }: any) => (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      ),
      a: ({ children, ...props }: any) => (
        <Link
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </Link>
      ),
      h1: ({ children, ...props }: any) => (
        <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
          {children}
        </h3>
      ),
    }

    return (
      <ReactMarkdown
        {...props}
        components={{ ...defaultComponents, ...props.components }}
        remarkPlugins={[remarkGfm]}
      >
        {children}
      </ReactMarkdown>
    )
  }
)

export { MemoizedReactMarkdown }
