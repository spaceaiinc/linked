import { Message as VercelChatMessage } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { MemoizedReactMarkdown } from '@/app/components/pdf/markdown'
import { IconOpenAI } from '@/app/components/ui/icons'
import { ChatMessageActions } from '@/app/components/pdf/chat-message-actions'

export interface ChatMessageProps {
  message: VercelChatMessage
  sources: any[]
}

export function ChatMessages({ message, sources }: ChatMessageProps) {
  const colorClassName =
    message.role === 'user'
      ? 'bg-gray-100 rounded-xl border border-1 mb-2 mr-2'
      : 'mb-2'
  const alignmentClassName =
    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'

  const extractSourcePageNumber = (source: {
    metadata: Record<string, any>
  }) => {
    return source.metadata['page']
  }

  return (
    <li className={`flex items-center ${alignmentClassName} group`}>
      <div className={`p-3 px-4 ${colorClassName} flex flex-col relative`}>
        <div className="flex items-center ml-2">
          {message.role !== 'user' && (
            <div className="rounded-full border border-gray-100 p-2 mr-2 w-8">
              <IconOpenAI className="w-4" />
            </div>
          )}
          <div className="flex text-base-content items-center">
            <MemoizedReactMarkdown
              className="prose"
              remarkPlugins={[remarkGfm, remarkMath]}
            >
              {message.content}
            </MemoizedReactMarkdown>
          </div>
        </div>
        {sources && sources.length > 0 && (
          <div className="flex flex-col items-center ml-2">
            <p className="font-bold mt-4 mr-auto px-2 py-1 rounded">
              <h2>More info:</h2>
            </p>
            <div className="mt-1 mr-2 px-2 py-1 rounded text-xs">
              {sources
                .filter((source, index, self) => {
                  const pageNumber = extractSourcePageNumber(source)
                  return (
                    self.findIndex(
                      (s) => extractSourcePageNumber(s) === pageNumber
                    ) === index
                  )
                })
                .map((source, i) => (
                  <button
                    key={'source:' + i}
                    className="border ml-1 bg-gray-200 px-3 py-1 hover:bg-gray-100 transition rounded-lg"
                  >
                    p. {extractSourcePageNumber(source)}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
      <ChatMessageActions message={message} />
    </li>
  )
}
