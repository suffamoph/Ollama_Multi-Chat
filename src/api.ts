import type { OllamaModel, ChatMessage, MessageStats, ModelCapability } from './types'

async function fetchModelCapabilities(name: string): Promise<ModelCapability[]> {
  try {
    const res = await fetch('/api/show', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.capabilities ?? []) as ModelCapability[]
  } catch {
    return []
  }
}

export async function fetchModels(): Promise<OllamaModel[]> {
  const res = await fetch('/api/tags')
  const data = await res.json()
  const models: OllamaModel[] = data.models ?? []

  // Fetch capabilities for all models in parallel
  const caps = await Promise.all(models.map((m) => fetchModelCapabilities(m.name)))
  return models.map((m, i) => ({ ...m, capabilities: caps[i] }))
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onThinking: (token: string) => void
}

export interface StreamResult {
  content: string
  thinking: string
  stats?: MessageStats
}

export async function streamChat(
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  think?: boolean
): Promise<StreamResult> {
  const body = {
    model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.images?.length ? { images: m.images } : {}),
    })),
    stream: true,
    think: think ?? true,
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    let detail = ''
    try { detail = JSON.parse(errBody).error } catch { detail = errBody }
    throw new Error(detail || `Ollama error: ${res.status} ${res.statusText}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let content = ''
  let thinking = ''
  let stats: MessageStats | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      try {
        const json = JSON.parse(line)
        if (json.error) {
          throw new Error(json.error)
        }
        if (json.message?.thinking) {
          thinking += json.message.thinking
          callbacks.onThinking(json.message.thinking)
        }
        if (json.message?.content) {
          content += json.message.content
          callbacks.onToken(json.message.content)
        }
        if (json.done) {
          stats = {
            totalDuration: json.total_duration ?? 0,
            promptEvalCount: json.prompt_eval_count ?? 0,
            evalCount: json.eval_count ?? 0,
            evalDuration: json.eval_duration ?? 0,
            hasThinking: thinking.length > 0,
          }
        }
      } catch (e) {
        if (e instanceof Error && e.message) throw e
      }
    }
  }

  return { content, thinking, stats }
}

export interface VramInfo {
  used: number  // bytes
  models: { name: string; vram: number }[]
}

export async function fetchVramUsage(): Promise<VramInfo> {
  const res = await fetch('/api/ps')
  const data = await res.json()
  const models = (data.models ?? []).map((m: { name: string; size_vram: number }) => ({
    name: m.name,
    vram: m.size_vram ?? 0,
  }))
  const used = models.reduce((sum: number, m: { vram: number }) => sum + m.vram, 0)
  return { used, models }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
