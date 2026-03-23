# Ollama Multi-Chat

A local multi-model chat interface for [Ollama](https://ollama.com), allowing you to compare multiple LLM responses side by side in real time.

## Features

- **Multi-model columns** — Run multiple models simultaneously, each in its own column. Send one message, get parallel responses.
- **Streaming output** — Token-by-token streaming display for all models at once.
- **Thinking mode** — Toggle thinking (chain-of-thought) per model with an independent switch. Collapsible thinking blocks in responses.
- **VRAM monitoring** — Real-time GPU VRAM usage via `nvidia-smi`, with a segmented progress bar showing per-model breakdown.
- **Multimodal support** — Upload images via button, clipboard paste, or drag-and-drop. Works with vision-capable models.
- **Model capabilities** — Auto-detects vision, thinking, and tools support from Ollama, displayed as emoji badges.
- **Response stats** — Duration, tokens/sec, thinking status, and prompt/completion token counts per response.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ollama](https://ollama.com) installed with at least one model pulled
- NVIDIA GPU (for VRAM monitoring)

### Run

Double-click **`启动.bat`** or run manually:

```bash
# Install dependencies (first time only)
npm install

# Start Ollama (if not already running)
ollama serve

# Start GPU monitor backend
node server.cjs

# Start frontend
npm run dev
```

Then open http://localhost:5173

## Architecture

- **Frontend** — React 18 + TypeScript + Vite + Tailwind CSS
- **GPU Monitor** — Lightweight Express server (port 3456) calling `nvidia-smi`
- **Backend** — Ollama REST API (default port 11434), no custom backend needed

## Screenshot

![Ollama Multi-Chat](src/assets/hero.png)
