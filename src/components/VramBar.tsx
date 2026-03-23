import { useState, useEffect } from 'react'
import { fetchVramUsage } from '../api'
import type { VramInfo } from '../api'

interface GpuInfo {
  index: number
  name: string
  memUsedMB: number
  memTotalMB: number
  memFreeMB: number
  utilization: number
}

const MODEL_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#6366f1', // indigo
  '#ec4899', // pink
]
const OTHER_COLOR = '#6b7280' // gray

interface Segment {
  label: string
  valueMB: number
  color: string
}

export function VramBar() {
  const [vram, setVram] = useState<VramInfo | null>(null)
  const [gpus, setGpus] = useState<GpuInfo[]>([])

  useEffect(() => {
    const poll = () => {
      fetchVramUsage().then(setVram).catch(() => {})
      fetch('http://localhost:3456/gpu')
        .then((r) => r.json())
        .then((d) => setGpus(d.gpus ?? []))
        .catch(() => {})
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => clearInterval(id)
  }, [])

  const hasGpu = gpus.length > 0
  if (!hasGpu && !vram) return null

  const totalMB = hasGpu ? gpus.reduce((s, g) => s + g.memTotalMB, 0) : 96 * 1024
  const usedMB = hasGpu ? gpus.reduce((s, g) => s + g.memUsedMB, 0) : 0

  // Build segments
  const segments: Segment[] = []
  const ollamaModels = vram?.models ?? []

  ollamaModels.forEach((m, i) => {
    const mb = m.vram / 1024 / 1024
    segments.push({
      label: m.name.split(':')[0],
      valueMB: mb,
      color: MODEL_COLORS[i % MODEL_COLORS.length],
    })
  })

  const ollamaTotalMB = ollamaModels.reduce((s, m) => s + m.vram / 1024 / 1024, 0)
  const otherMB = Math.max(0, usedMB - ollamaTotalMB)
  if (otherMB > 50) {
    segments.push({ label: 'Other', valueMB: otherMB, color: OTHER_COLOR })
  }

  const usedGB = usedMB / 1024
  const totalGB = totalMB / 1024
  const pct = totalMB > 0 ? (usedMB / totalMB) * 100 : 0

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-800 border-b border-gray-700 text-xs text-gray-300">
      <span className="font-medium text-gray-400 whitespace-nowrap">VRAM</span>

      {/* Segmented progress bar */}
      <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden max-w-sm flex">
        {segments.map((seg, i) => {
          const w = totalMB > 0 ? (seg.valueMB / totalMB) * 100 : 0
          return (
            <div
              key={i}
              className="h-full transition-all duration-500"
              style={{ width: `${w}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${(seg.valueMB / 1024).toFixed(1)} GB`}
            />
          )
        })}
      </div>

      {/* Numbers */}
      <span className="whitespace-nowrap font-mono">
        {usedGB.toFixed(1)} / {totalGB.toFixed(1)} GB
      </span>
      <span className="text-gray-500">({pct.toFixed(0)}%)</span>

      {/* Legend */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1 whitespace-nowrap">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-400">
              {seg.label} {(seg.valueMB / 1024).toFixed(1)}G
            </span>
          </span>
        ))}
        <span className="flex items-center gap-1 whitespace-nowrap">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-700" />
          <span className="text-gray-500">Free {((totalMB - usedMB) / 1024).toFixed(1)}G</span>
        </span>
      </div>
    </div>
  )
}
