export type ModelCapability = 'vision' | 'thinking' | 'tools' | 'completion'

export interface OllamaModel {
  name: string
  model: string
  size: number
  digest: string
  modified_at: string
  capabilities?: ModelCapability[]
}

export interface MessageStats {
  totalDuration: number      // nanoseconds
  promptEvalCount: number    // input tokens
  evalCount: number          // output tokens
  evalDuration: number       // nanoseconds for eval
  hasThinking: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  images?: string[] // base64 encoded
  stats?: MessageStats
}

export interface ModelColumn {
  id: string
  model: string
  messages: ChatMessage[]
  streaming: boolean
  streamContent: string
  streamThinking: string
  thinkingEnabled: boolean
}
