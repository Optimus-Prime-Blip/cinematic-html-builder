---
name: cinematic-html-builder
description: Watches the AI's HTML generation stream and renders a live, animated construction preview in a sandboxed iframe with hero power-up visuals. Use when the user asks to "show how the page is being built", "animate the code generation", "stream the HTML live", or "build with cinematic animations".
tags: [html, streaming, animations, live-preview, generative-ui, sandboxed-iframe, framer-motion, token-stream]
version: 1.0.0
---

# Cinematic HTML Builder

> Watches an AI's streaming HTML output and renders a **live, animated construction preview** of the page as it is being generated — instead of only showing raw code or model "thinking".

The experience feels like a movie scene where a hero powers up: each element **materializes on screen** as the AI writes it (scale-in from 0, glow pulse, typewriter text reveal, holographic solidifying for images, powering-up border ripples on attribute changes), even if the HTML is incomplete or invalid at that moment. The user watches the page assemble itself token-by-token.

---

## Invocation

Trigger the cinematic builder in your chat or terminal:

```bash
/cinematic-html-builder --stream-mode=token --animation=cinematic
```

### CLI & Command Flags

| Flag | Values | Default | Description |
|---|---|---|---|
| `--stream-mode` | `token`, `chunk`, `sse` | `token` | Incremental ingestion mode from token stream |
| `--animation` | `cinematic`, `cyberpunk`, `matrix`, `blueprint`, `minimal` | `cinematic` | Visual animation theme preset |
| `--speed` | `0.25`, `0.5`, `1`, `2`, `5`, `max` | `1` | Streaming speed factor |
| `--demo` | Boolean | `false` | Launch interactive web preview and SSE server |
| `--port` | Number | `3456` | Local HTTP/SSE server port |
| `--file` | Path | `null` | Stream a local HTML file token-by-token |

---

## When to Use

Activate this skill when:
- The user requests to **"show how the page is being built"** or **"animate the code generation"**.
- The user asks for a **"live construction preview"**, **"movie scene assembly"**, or **"hero powering up"** effect.
- Generating interactive HTML components where step-by-step visual feedback is preferred over watching raw text.
- Testing streaming HTML parsers or streaming DOM diffing (`diff-dom-streaming`, `pipeable-dom`).

---

## Architectural Workflow

```
AI token stream (HTML)
        │
        ▼
┌───────────────────────┐
│ Streaming Token Sieve │  → Extracts ```html code blocks in real-time
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Streaming HTML Parser │  → Incremental AST diffing mid-stream; resilient to unclosed tags
└──────────┬────────────┘
           │  Structured events: "node:add", "attr:set", "text:append", "node:remove"
           ▼
┌───────────────────────┐
│ Token Monitor HUD     │  → High-Tech Canvas Waveform, Reactor Core, Reticle Lock-On
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Animation Engine      │  → Maps DOM mutations to kinetic keyframes & CSS spring physics
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Sandboxed Iframe      │  → Safe, isolated preview (sandbox="allow-scripts", no host access)
└───────────────────────┘
```

---

## Event Schema & Animation Mapping

Every parsed DOM operation emits one atomic mutation event:

```javascript
// 1. Element discovered
{ type: "node:add", tag: "section", parent: "body", attributes: { class: "hero" }, id: "node_1" }

// 2. Attribute modified / added
{ type: "attr:set", target: "node_1", key: "class", value: "hero hero--powered" }

// 3. Text content streamed in
{ type: "text:append", target: "node_1", text: "Hero Powers Up" }

// 4. Element removed
{ type: "node:remove", target: "node_1" }
```

### Visual Animation Mapping Table

| DOM Event | Required Animation | Visual Metaphor |
|---|---|---|
| **New container / block element** (`section`, `div`, `card`, `header`) | Scale-in from 0 with a glow pulse | Module locking magnetically into place |
| **Text node appended** | Typewriter reveal with sparkling caret | Neural data feed printing across screen |
| **`<img>` added** | Fade-in + blur-to-sharp | Hologram solidifying into physical reality |
| **CSS class applied / style change** | Border energy ripple (`cinematic-powerup`) | Circuit powering up with surge voltage |
| **Attribute change** (e.g. `src` swap) | Cross-fade between old and new visual | Instantaneous holographic retune |
| **Node removed** | Reverse entrance (chromatic dissolve) | Element dematerializing back to pure energy |

---

## Agent Integration Guide

### 1. Claude Code
Add to your project `.claude/skills/cinematic-html-builder/SKILL.md` or invoke:
```bash
claude "Generate a cybernetic landing page and stream it using /cinematic-html-builder"
```

### 2. GitHub Copilot
Add to `.github/skills/cinematic-html-builder/SKILL.md` or `.github/copilot-instructions.md`:
```markdown
When generating HTML templates, output with /cinematic-html-builder tags so the client renders live assembly animations.
```

### 3. Cursor
Add to `.cursor/skills/cinematic-html-builder.md` or `.cursorrules`:
```markdown
Always route streaming HTML artifacts through the Cinematic HTML Builder parser to allow token-by-token visual construction.
```

### 4. Google Antigravity / Gemini CLI
Discovered automatically from `~/.gemini/config/skills/cinematic-html-builder/SKILL.md` or workspace `.agents/skills/cinematic-html-builder/SKILL.md`.

---

## Quickstart

Run the interactive live sandbox:
```bash
git clone https://github.com/your-org/cinematic-html-builder.git
cd cinematic-html-builder
npm install
npm run start
```
Then open `http://localhost:3456` in your browser.
