'use client'

import { type Message } from 'ai'

import { Button } from '@/app/components/ui/button'
import { IconCheck, IconCopy } from '@/app/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/copyToClipboard'
import { cn } from '@/lib/utils'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end transition-opacity opacity-0 group-hover:opacity-100',
        className
      )}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-transparent"
        onClick={onCopy}
      >
        {isCopied ? <IconCheck /> : <IconCopy />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
}
