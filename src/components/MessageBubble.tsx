import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessage, MessageStats } from '../types'

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
      onClick={onClose}
    >
      <img
        src={src}
        alt="preview"
        className="max-w-[90vw] max-h-[90vh] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function StatsBar({ stats }: { stats: MessageStats }) {
  const totalSec = stats.totalDuration / 1e9
  const tokensPerSec = stats.evalDuration > 0
    ? (stats.evalCount / (stats.evalDuration / 1e9)).toFixed(1)
    : '–'

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 pt-1.5 border-t border-gray-600/50 text-[11px] text-gray-400">
      <span title="Total duration">{totalSec.toFixed(2)}s</span>
      <span title="Generation speed">{tokensPerSec} t/s</span>
      <span title="Thinking">{stats.hasThinking ? 'Thinking' : 'No thinking'}</span>
      <span title="Prompt / completion tokens">{stats.promptEvalCount} / {stats.evalCount} tokens</span>
    </div>
  )
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false)
  return (
    <details className="mb-2" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-300 select-none">
        Thinking ({thinking.length} chars)
      </summary>
      <div className="mt-1 text-xs text-gray-400 italic max-h-40 overflow-y-auto whitespace-pre-wrap border-l-2 border-gray-600 pl-2">
        {thinking}
      </div>
    </details>
  )
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  return (
    <>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[90%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-100'
        }`}
      >
        {message.images?.length ? (
          <div className="flex gap-2 mb-2 flex-wrap">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={`data:image/png;base64,${img}`}
                alt="uploaded"
                className="max-h-32 rounded-lg cursor-zoom-in hover:opacity-80 transition-opacity"
                onClick={() => setLightboxSrc(`data:image/png;base64,${img}`)}
              />
            ))}
          </div>
        ) : null}
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.thinking && <ThinkingBlock thinking={message.thinking} />}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const code = String(children).replace(/\n$/, '')
                  if (match) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, borderRadius: '0.5rem', fontSize: '0.8rem' }}
                      >
                        {code}
                      </SyntaxHighlighter>
                    )
                  }
                  return (
                    <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.stats && <StatsBar stats={message.stats} />}
          </div>
        )}
      </div>
      </div>
    </>
  )
}
