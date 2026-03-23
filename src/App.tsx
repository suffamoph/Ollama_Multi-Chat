import { useState, useEffect, useCallback, useRef } from 'react'
import type { OllamaModel, ModelColumn, ChatMessage } from './types'
import { fetchModels, streamChat } from './api'
import { ChatColumn } from './components/ChatColumn'
import { InputBar } from './components/InputBar'
import { VramBar } from './components/VramBar'

let columnIdCounter = 0
function createColumn(model = ''): ModelColumn {
  return {
    id: String(++columnIdCounter),
    model,
    messages: [],
    streaming: false,
    streamContent: '',
    streamThinking: '',
    thinkingEnabled: true,
  }
}

export default function App() {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [columns, setColumns] = useState<ModelColumn[]>([createColumn(), createColumn()])
  const [sending, setSending] = useState(false)
  const abortControllers = useRef<Map<string, AbortController>>(new Map())

  useEffect(() => {
    fetchModels()
      .then(setModels)
      .catch((err) => console.error('Failed to fetch models:', err))
  }, [])

  // Auto-assign first two models
  useEffect(() => {
    if (models.length > 0) {
      setColumns((prev) =>
        prev.map((col, i) => {
          if (!col.model && models[i]) {
            return { ...col, model: models[i].name }
          }
          return col
        })
      )
    }
  }, [models])

  const addColumn = () => {
    setColumns((prev) => [...prev, createColumn()])
  }

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return
    const ctrl = abortControllers.current.get(id)
    if (ctrl) ctrl.abort()
    setColumns((prev) => prev.filter((c) => c.id !== id))
  }

  const changeModel = (id: string, model: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, model } : c))
    )
  }

  const toggleThinking = (id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, thinkingEnabled: !c.thinkingEnabled } : c))
    )
  }

  const clearAll = () => {
    abortControllers.current.forEach((ctrl) => ctrl.abort())
    abortControllers.current.clear()
    setColumns((prev) =>
      prev.map((c) => ({ ...c, messages: [], streaming: false, streamContent: '', streamThinking: '' }))
    )
    setSending(false)
  }

  const sendMessage = useCallback(
    async (content: string, images: string[]) => {
      const activeColumns = columns.filter((c) => c.model)
      if (activeColumns.length === 0) return

      setSending(true)

      const userMessage: ChatMessage = {
        role: 'user',
        content,
        ...(images.length ? { images } : {}),
      }

      // Add user message to all columns and set streaming
      setColumns((prev) =>
        prev.map((c) =>
          c.model
            ? { ...c, messages: [...c.messages, userMessage], streaming: true, streamContent: '', streamThinking: '' }
            : c
        )
      )

      // Fire parallel requests
      const promises = activeColumns.map(async (col) => {
        const ctrl = new AbortController()
        abortControllers.current.set(col.id, ctrl)

        const allMessages = [...col.messages, userMessage]
        let accumulated = ''
        let accumulatedThinking = ''

        try {
          const result = await streamChat(
            col.model,
            allMessages,
            {
              onToken: (token) => {
                accumulated += token
                setColumns((prev) =>
                  prev.map((c) =>
                    c.id === col.id ? { ...c, streamContent: accumulated } : c
                  )
                )
              },
              onThinking: (token) => {
                accumulatedThinking += token
                setColumns((prev) =>
                  prev.map((c) =>
                    c.id === col.id ? { ...c, streamThinking: accumulatedThinking } : c
                  )
                )
              },
            },
            ctrl.signal,
            col.thinkingEnabled
          )

          // Done streaming — commit the assistant message
          setColumns((prev) =>
            prev.map((c) =>
              c.id === col.id
                ? {
                    ...c,
                    messages: [...c.messages, {
                      role: 'assistant' as const,
                      content: result.content,
                      ...(result.thinking ? { thinking: result.thinking } : {}),
                      stats: result.stats,
                    }],
                    streaming: false,
                    streamContent: '',
                    streamThinking: '',
                  }
                : c
            )
          )
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') return
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          setColumns((prev) =>
            prev.map((c) =>
              c.id === col.id
                ? {
                    ...c,
                    messages: [
                      ...c.messages,
                      { role: 'assistant' as const, content: `**Error:** ${errorMsg}` },
                    ],
                    streaming: false,
                    streamContent: '',
                    streamThinking: '',
                  }
                : c
            )
          )
        } finally {
          abortControllers.current.delete(col.id)
        }
      })

      await Promise.allSettled(promises)
      setSending(false)
    },
    [columns]
  )

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* VRAM bar */}
      <VramBar />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-light tracking-tight">
          Ollama Multi-Chat
        </h1>
        <div className="flex gap-2">
          <button
            onClick={addColumn}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            + Add Model
          </button>
          <button
            onClick={clearAll}
            className="bg-gray-700 hover:bg-red-600 text-gray-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Model columns */}
      <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
        {columns.map((col) => (
          <ChatColumn
            key={col.id}
            column={col}
            models={models}
            onModelChange={(m) => changeModel(col.id, m)}
            onRemove={() => removeColumn(col.id)}
            onToggleThinking={() => toggleThinking(col.id)}
          />
        ))}
      </div>

      {/* Input */}
      <InputBar onSend={sendMessage} disabled={sending} />
    </div>
  )
}
