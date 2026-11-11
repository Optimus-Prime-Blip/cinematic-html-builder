# ⚡ Cinematic HTML Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-13%20passed-brightgreen.svg)]()
[![Standard: SKILL.md](https://img.shields.io/badge/standard-SKILL.md-orange.svg)]()
[![Compatibility](https://img.shields.io/badge/agents-Claude%20Code%20%7C%20Copilot%20%7C%20Cursor%20%7C%20Antigravity-purple.svg)]()

> Watches an AI's **streaming HTML output** and renders a **live, animated construction preview** of the page as it is being generated — instead of only showing the raw code or the model's "thinking."

---

## 🎬 The Visual Metaphor: "Hero Powering Up"

Traditional AI interfaces force users to stare at static code blocks, unstyled Markdown, or abstract "thinking" indicators until the full document finishes generation.

**Cinematic HTML Builder** transforms HTML generation into a blockbuster cinematic scene:
* **Modules Locking Into Place**: When the parser discovers a container (`<section>`, `<div>`, `<header>`), it enters with `opacity: 0; transform: scale(0.8)`, then snaps forward with a high-energy cyan/gold glow pulse on the next animation frame.
* **Holograms Solidifying**: When an `<img>` tag streams in, it begins as a glowing, chromatic holographic blur (`blur(14px) brightness(2.2)`) and progressively focuses into physical sharpness as its dimensions and attributes lock in.
* **Neural Typewriter Stream**: Text nodes stream in character-by-character with an illuminated glowing cursor (`cinematic-typewriter-caret`) and subtle trailing light aura.
* **Circuit Overdrive Surges**: When CSS classes change (e.g. `powered-up`, `active`), a localized electromagnetic pulse (`cinematic-powerup`) races along the element's border.
* **Quantum Dissolution**: Elements removed during stream revisions dissolve backwards through an energetic chromatic glitch.

---

## 🏛️ Architecture

```
AI token stream (HTML / Markdown)
        │
        ▼
┌───────────────────────┐
│ Streaming Token Sieve │  → Extracts ```html blocks incrementally from raw SSE / token feed
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Streaming HTML Parser │  → Incremental AST diffing mid-stream (pipeable-dom / diff-dom-streaming)
└──────────┬────────────┘
           │  Structured events: "node:add", "attr:set", "text:append", "node:remove"
           ▼
┌───────────────────────┐
│ Token Monitor HUD     │  → Real-time Canvas Waveform, Reactor Core, Reticle Lock-On
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Animation Engine      │  → Maps DOM mutations to kinetic keyframes & CSS spring physics
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ Sandboxed Iframe      │  → Safe, isolated preview (sandbox="allow-scripts", strict origin)
└───────────────────────┘
```

---

## 📊 Live Token Monitor HUD

The Token Monitor provides real-time visual telemetry of the AI's neural stream:

* **Quantum Waveform Oscilloscope**: An HTML5 Canvas frequency spectrometer rendering dual-frequency harmonic oscillations and particle bursts that respond dynamically to token throughput.
* **Reactor Power Core**: A live energy gauge (0% to 100%) tracking the cumulative structural integrity of the page as nodes lock into alignment.
* **Target Lock-On Reticle**: A rotating radar tracking the exact DOM node and tag currently receiving incoming tokens (e.g., `<section class="hero-showcase">`).
* **Velocity Metrics**: Monospace digital counters reporting live tokens/second, total token count, AST depth, and parser latency.
* **Mutation Waterfall Log**: Color-coded ticker displaying every DOM mutation as it happens:
  - `[+NODE]` (Cyan) — Element created and mounted.
  - `[~ATTR]` (Gold) — Attribute or class updated.
  - `[+TEXT]` (Emerald) — Typewriter text stream.
  - `[-NODE]` (Rose) — Node dissolved.

---

## 🛠️ CLI & Skill Invocation

### Usable Agent Command
```bash
/cinematic-html-builder --stream-mode=token --animation=cinematic
```

### CLI Flags

```text
OPTIONS:
  --stream-mode=MODE    Stream mode: 'token' (default), 'chunk', or 'sse'
  --animation=PRESET    Animation preset: 'cinematic', 'cyberpunk', 'matrix', 'blueprint', 'minimal'
  --speed=FACTOR        Stream speed factor (e.g. 0.5, 1, 2, max)
  --demo                Launch interactive web preview and SSE server
  --port=PORT           Server port (default: 3456)
  --file=PATH           Stream a local HTML file token-by-token
  -h, --help            Show help manual
```

### Examples

```bash
# Launch interactive browser demo with split HUD & sandboxed preview
cinematic-html-builder --demo --port=3456

# Stream a local HTML file with Cyberpunk theme
cinematic-html-builder --file=examples/sample-stream.html --animation=cyberpunk

# Pipe raw HTML or token stream via stdin
cat my-hero-page.html | cinematic-html-builder
```

---

## 🎨 Animation Presets

1. **`cinematic`** *(Default)*: Cyan/gold high-energy hero power-up, elastic spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`), and magnetic module lock-in.
2. **`cyberpunk`**: Neon magenta/cyan, high-contrast overdrive, digital scanline pulses.
3. **`matrix`**: Phosphor green terminal stream, code rain shimmer, high-speed typewriter cadence.
4. **`blueprint`**: Architectural technical grid lines, blueprint cyan wireframes, drafting coordinate locks.
5. **`minimal`**: Subtle modern spring ease with refined purple/indigo glow.

---

## 🧩 Event Schema (Streaming Parser Output)

```javascript
// Node Added
{
  type: "node:add",
  tag: "section",
  parent: "body",
  attributes: { class: "hero" },
  id: "cinematic_section_1_x8b2"
}

// Attribute Updated
{
  type: "attr:set",
  target: "cinematic_section_1_x8b2",
  key: "class",
  value: "hero hero--supercharged",
  oldValue: "hero"
}

// Text Appended
{
  type: "text:append",
  target: "cinematic_h1_2_k9f1",
  text: "Autonomous Kinetic Interface",
  fullText: "Autonomous Kinetic Interface"
}

// Node Removed
{
  type: "node:remove",
  target: "cinematic_div_3_m2a1",
  parent: "body"
}
```

---

## 🔒 Sandboxed Security Architecture

To guarantee that AI-generated code never executes in or pollutes the host page:
1. All rendered markup is isolated inside an `<iframe>` configured strictly with:
   ```html
   <iframe sandbox="allow-scripts" ...></iframe>
   ```
2. `allow-same-origin` is **intentionally omitted**, ensuring that untrusted code inside the iframe cannot access the host page's `window.parent`, localStorage, session cookies, or document DOM.
3. The host communicates exclusively across a secure `postMessage` tunnel (`src/sandbox/tunnel.js`).
4. Console logs (`log`, `warn`, `error`) within the preview are intercepted and marshaled safely to the host telemetry stream.

---

## 📦 Cross-Agent Installation

### Claude Code
Clone or copy into your project:
```bash
git clone https://github.com/your-org/cinematic-html-builder.git .claude/skills/cinematic-html-builder
```
Invoke in any prompt:
> *"Build a landing page for our app using /cinematic-html-builder"*

### GitHub Copilot
Place `SKILL.md` in `.github/skills/cinematic-html-builder/SKILL.md`:
```bash
mkdir -p .github/skills/cinematic-html-builder
cp cinematic-html-builder/SKILL.md .github/skills/cinematic-html-builder/
```

### Cursor
Place `SKILL.md` in `.cursor/skills/cinematic-html-builder.md`:
```bash
mkdir -p .cursor/skills
cp cinematic-html-builder/SKILL.md .cursor/skills/cinematic-html-builder.md
```

### Google Antigravity / Gemini CLI
Copy to your global or workspace skills directory:
```bash
# Global installation
cp -r cinematic-html-builder ~/.gemini/config/skills/cinematic-html-builder

# Workspace installation
mkdir -p .agents/skills/cinematic-html-builder
cp cinematic-html-builder/SKILL.md .agents/skills/cinematic-html-builder/
```

---

## 🔬 Proof-of-Concept vs Production

In `examples/react-poc.jsx`, we ship both:
1. **The Baseline Naive Hook** (from the specification prompt), demonstrating how element cloning and `requestAnimationFrame` establish the initial scale-in animation primitive.
2. **The Production Hook (`useCinematicStreamingHTML`)**, which consumes the token-by-token stream from `pipeable-dom` and `diff-dom-streaming`, parses incomplete mid-stream chunks safely, updates attributes/classes dynamically, and routes animations into the sandboxed iframe.

---

## 🧪 Testing

Run the full automated test suite (13 unit tests covering streaming parser resilience, malformed tags, animation engine keyframes, and sandboxed security):

```bash
npm test
```

---

## 📜 Dependencies & Attribution

- **`pipeable-dom`**: Ingestion stream via `TransformStream` / `DOMStream`.
- **`diff-dom-streaming`**: Minimal DOM patching algorithm principles.
- **`gravity-artifacts`**: Sandboxed iframe shell, code-block extraction, and `postMessage` tunnel pattern.
- **`render-visual-skill`**: Cross-agent `SKILL.md` packaging standard.

---

## 📄 License

MIT © Arnav Yadav
