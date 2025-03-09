'use client'

import { useEffect, useRef, useState, ReactElement, FormEvent } from 'react'
import { Message } from 'ai'
import { ChatMessages } from '@/app/components/pdf/chat-messages'
import { useToast } from '@/app/components/ui/use-toast'
import { Toaster } from '@/app/components/ui/toaster'
import { ChatInputField } from '@/app/components/pdf/chat-input-field'

export function ChatWindow(props: {
  endpoint: string
  emptyStateComponent: ReactElement
  placeholder?: string
  chatId: string
  initialMessages: Message[]
  documentId?: string
}) {
  const {
    endpoint,
    emptyStateComponent,
    placeholder,
    chatId,
    initialMessages,
    documentId,
  } = props

  const messageContainerRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({})
  const { toast } = useToast()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInput(e.target.value)
  }

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          chatId,
          documentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: data.id,
        role: 'assistant',
        content: data.content,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Handle sources if they exist
      const sourcesHeader = response.headers.get('x-sources')
      if (sourcesHeader) {
        const sources = JSON.parse(
          Buffer.from(sourcesHeader, 'base64').toString('utf8')
        )
        const messageIndex = response.headers.get('x-message-index')
        if (messageIndex) {
          setSourcesForMessages((prev) => ({
            ...prev,
            [messageIndex]: sources,
          }))
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to send message',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-col w-full h-full no-scrollbar">
      <section className="flex flex-col w-full h-full no-scrollbar">
        {messages.length === 0 ? emptyStateComponent : ''}
        <div
          className="flex flex-col-reverse w-full mb-4 overflow-auto h-full no-scrollbar"
          ref={messageContainerRef}
        >
          {messages.length > 0
            ? [...messages]
                .reverse()
                .map((m, i) => (
                  <ChatMessages
                    key={m.id}
                    message={m}
                    sources={
                      sourcesForMessages[(messages.length - 1 - i).toString()]
                    }
                  />
                ))
            : ''}
        </div>
        <div className="flex flex-col justify-center items-center">
          <ChatInputField
            input={input}
            placeholder={placeholder}
            handleInputChange={handleInputChange}
            handleSubmit={sendMessage}
            isLoading={isLoading}
          />
        </div>
      </section>
      <Toaster />
    </main>
  )
}
