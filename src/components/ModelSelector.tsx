import type { OllamaModel, ModelCapability } from '../types'

function capLabel(name: string, caps: ModelCapability[]): string {
  const emojis: string[] = []
  if (caps.includes('vision')) emojis.push('🖼️')
  if (caps.includes('thinking')) emojis.push('🧠')
  if (caps.includes('tools')) emojis.push('🛠️')
  return emojis.length > 0 ? `${name}  ${emojis.join('')}` : name
}

interface Props {
  models: OllamaModel[]
  selected: string
  onChange: (model: string) => void
  onRemove: () => void
  thinkingEnabled: boolean
  onToggleThinking: () => void
}

export function ModelSelector({ models, selected, onChange, onRemove, thinkingEnabled, onToggleThinking }: Props) {
  const selectedModel = models.find((m) => m.name === selected)
  const caps = selectedModel?.capabilities?.filter((c) => c !== 'completion') ?? []

  return (
    <div className="border-b border-gray-700 bg-gray-800/50">
      <div className="flex items-center gap-2 px-3 py-2">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-gray-700 text-gray-100 text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-500 cursor-pointer min-w-0"
        >
          <option value="">-- Select Model --</option>
          {[...models].sort((a, b) => (b.size ?? 0) - (a.size ?? 0)).map((m) => (
            <option key={m.name} value={m.name}>
              {capLabel(m.name, m.capabilities ?? [])}
            </option>
          ))}
        </select>
        <span className={`shrink-0 text-xs ${thinkingEnabled ? 'text-purple-300' : 'text-gray-500'}`}>Think</span>
        <button
          onClick={onToggleThinking}
          className={`shrink-0 w-11 h-6 rounded-full border-2 transition-all relative flex items-center ${
            thinkingEnabled
              ? 'bg-purple-600 border-purple-500'
              : 'bg-gray-700 border-gray-600'
          }`}
          title={thinkingEnabled ? 'Thinking enabled' : 'Thinking disabled'}
        >
          <div
            className={`absolute w-5 h-5 rounded-full bg-white transition-transform ${
              thinkingEnabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <button
          onClick={onRemove}
          className="shrink-0 text-gray-400 hover:text-red-400 text-lg px-1 transition-colors"
          title="Remove column"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
