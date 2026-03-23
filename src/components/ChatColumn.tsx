import { useEffect, useRef } from 'react'
import type { OllamaModel, ModelColumn } from '../types'
import { ModelSelector } from './ModelSelector'
import { MessageBubble } from './MessageBubble'

interface Props {
  column: ModelColumn
  models: OllamaModel[]
  onModelChange: (model: string) => void
  onRemove: () => void
  onToggleThinking: () => void
}

export function ChatColumn({ column, models, onModelChange, onRemove, onToggleThinking }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [column.messages, column.streamContent, column.streamThinking])

  const isThinking = column.streaming && column.streamThinking && !column.streamContent

  return (
    <div className="flex flex-col min-w-[340px] flex-1 bg-gray-900 border-r border-gray-700 last:border-r-0">
      <ModelSelector
        models={models}
        selected={column.model}
        onChange={onModelChange}
        onRemove={onRemove}
        thinkingEnabled={column.thinkingEnabled}
        onToggleThinking={onToggleThinking}
      />
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {column.messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isThinking && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-800 border border-gray-600 text-gray-400 rounded-xl px-4 py-2.5 text-xs leading-relaxed max-w-[90%] max-h-32 overflow-y-auto italic">
              <span className="text-gray-500 font-medium not-italic">Thinking... </span>
              {column.streamThinking.slice(-200)}
            </div>
          </div>
        )}
        {column.streaming && column.streamContent && (
          <MessageBubble
            message={{
              role: 'assistant',
              content: column.streamContent,
              ...(column.streamThinking ? { thinking: column.streamThinking } : {}),
            }}
          />
        )}
        {column.streaming && !column.streamContent && !column.streamThinking && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-700 text-gray-300 rounded-xl px-4 py-2.5 text-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce [animation-delay:0ms]">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
