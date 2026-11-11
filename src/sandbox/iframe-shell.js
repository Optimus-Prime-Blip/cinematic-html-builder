/**
 * Sandboxed Iframe Shell
 * Creates an isolated execution context (`sandbox="allow-scripts"`)
 * with the Cinematic Animation Engine pre-loaded inside.
 */

import { HostTunnel, TUNNEL_MESSAGES } from './tunnel.js';

/**
 * Builds the self-contained HTML document for the sandboxed iframe
 * @param {Object} options
 * @param {string} [options.preset='cinematic']
 * @param {string} [options.customCSS='']
 * @returns {string} Complete HTML string
 */
export function buildIframeHTML(options = {}) {
  const preset = options.preset || 'cinematic';
  const customCSS = options.customCSS || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cinematic Sandbox</title>
  <style>
    /* Reset & Base */
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #0a0e17;
      color: #e2e8f0;
      overflow-x: hidden;
    }
    img { max-width: 100%; height: auto; display: block; }

    /* Cinematic Styles Injected */
    :root {
      --cinematic-primary: #00f0ff;
      --cinematic-secondary: #ffd700;
      --cinematic-glow: rgba(0, 240, 255, 0.75);
      --cinematic-pulse-shadow: 0 0 25px rgba(0, 240, 255, 0.6), 0 0 50px rgba(255, 215, 0, 0.35);
      --cinematic-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
      --cinematic-duration: 0.45s;
    }

    .cinematic-initial {
      opacity: 0 !important;
      transform: scale(0.8) !important;
      will-change: transform, opacity, box-shadow;
      transform-origin: center center;
    }

    .cinematic-entering {
      opacity: 1 !important;
      transform: scale(1) !important;
      transition: opacity var(--cinematic-duration) ease,
                  transform var(--cinematic-duration) var(--cinematic-easing) !important;
      animation: cinematicGlowPulse 0.7s var(--cinematic-easing) forwards;
    }

    @keyframes cinematicGlowPulse {
      0% {
        box-shadow: 0 0 0 rgba(0, 240, 255, 0);
        outline: 2px solid transparent;
      }
      30% {
        box-shadow: var(--cinematic-pulse-shadow);
        outline: 2px solid var(--cinematic-primary);
      }
      65% {
        box-shadow: 0 0 15px var(--cinematic-glow);
        outline: 1px solid var(--cinematic-primary);
      }
      100% {
        box-shadow: none;
        outline: 1px solid transparent;
      }
    }

    .cinematic-hologram-initial {
      opacity: 0 !important;
      filter: blur(14px) brightness(2.2) drop-shadow(0 0 25px var(--cinematic-primary)) !important;
      transform: scale(0.85) !important;
    }

    .cinematic-hologram-entering {
      opacity: 1 !important;
      filter: blur(0px) brightness(1) drop-shadow(0 0 0 transparent) !important;
      transform: scale(1) !important;
      transition: opacity 0.6s ease,
                  filter 0.65s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.6s var(--cinematic-easing) !important;
    }

    .cinematic-powerup {
      animation: cinematicPowerupFlash 0.65s ease-out forwards;
    }

    @keyframes cinematicPowerupFlash {
      0% {
        outline: 3px solid var(--cinematic-secondary);
        box-shadow: 0 0 30px var(--cinematic-secondary), inset 0 0 15px rgba(255, 215, 0, 0.3);
      }
      40% {
        outline: 2px solid var(--cinematic-primary);
        box-shadow: var(--cinematic-pulse-shadow);
      }
      100% {
        outline: 1px solid transparent;
        box-shadow: none;
      }
    }

    .cinematic-crossfade {
      transition: opacity 0.3s ease-in-out, filter 0.3s ease-in-out;
    }
    .cinematic-crossfade-out { opacity: 0.2 !important; filter: blur(4px); }
    .cinematic-crossfade-in { opacity: 1 !important; filter: blur(0); }

    .cinematic-typewriter-caret {
      display: inline-block;
      width: 2px;
      height: 1.1em;
      vertical-align: -0.15em;
      background-color: var(--cinematic-primary);
      box-shadow: 0 0 10px var(--cinematic-primary);
      margin-left: 2px;
      animation: cinematicCaretBlink 0.6s steps(2, start) infinite;
    }

    @keyframes cinematicCaretBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }

    .cinematic-dissolving {
      opacity: 0 !important;
      transform: scale(0.85) translateY(-8px) !important;
      filter: blur(8px) hue-rotate(90deg) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 1, 1) !important;
      pointer-events: none !important;
    }

    /* Theme Presets */
    body.theme-cyberpunk {
      --cinematic-primary: #ff007f;
      --cinematic-secondary: #00ffff;
      --cinematic-glow: rgba(255, 0, 127, 0.8);
      --cinematic-pulse-shadow: 0 0 25px rgba(255, 0, 127, 0.7), 0 0 45px rgba(0, 255, 255, 0.5);
    }
    body.theme-matrix {
      --cinematic-primary: #00ff66;
      --cinematic-secondary: #00aa33;
      --cinematic-glow: rgba(0, 255, 102, 0.85);
      --cinematic-pulse-shadow: 0 0 20px rgba(0, 255, 102, 0.9);
      background: #020d05;
    }
    body.theme-blueprint {
      --cinematic-primary: #38bdf8;
      --cinematic-secondary: #ffffff;
      --cinematic-glow: rgba(56, 189, 248, 0.65);
      --cinematic-pulse-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
      background: #081e3d;
    }
    body.theme-minimal {
      --cinematic-primary: #6366f1;
      --cinematic-secondary: #a855f7;
      --cinematic-glow: rgba(99, 102, 241, 0.4);
      --cinematic-pulse-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
      background: #0f172a;
    }

    ${customCSS}
  </style>
</head>
<body class="theme-${preset}">
  <div id="cinematic-root"></div>

  <script>
    (function() {
      // Console interceptor -> postMessage
      ['log', 'info', 'warn', 'error'].forEach(function(level) {
        var orig = console[level];
        console[level] = function() {
          var args = Array.prototype.slice.call(arguments);
          try {
            window.parent.postMessage({
              type: 'CINEMATIC_CONSOLE_LOG',
              payload: { level: level, message: args.map(String).join(' ') }
            }, '*');
          } catch (_) {}
          if (orig) orig.apply(console, args);
        };
      });

      // Internal Node Registry
      var nodeMap = new Map();
      var activeCarets = new Map();

      function resolveNode(ref) {
        if (!ref || ref === 'body' || ref === 'root') {
          return document.getElementById('cinematic-root') || document.body;
        }
        if (nodeMap.has(ref)) return nodeMap.get(ref);
        return document.querySelector('[data-cinematic-id="' + ref + '"]') || document.getElementById(ref);
      }

      function handleNodeAdd(data) {
        var parentNode = resolveNode(data.parent);
        if (!parentNode) return;

        var el = document.createElement(data.tag);
        el.setAttribute('data-cinematic-id', data.id);

        if (data.attributes) {
          for (var k in data.attributes) {
            try { el.setAttribute(k, data.attributes[k]); } catch(_) {}
          }
        }

        nodeMap.set(data.id, el);

        var isImg = data.tag === 'img';
        if (isImg) {
          el.classList.add('cinematic-hologram-initial');
        } else {
          el.classList.add('cinematic-initial');
        }

        if (data.index !== undefined && data.index >= 0 && data.index < parentNode.children.length) {
          parentNode.insertBefore(el, parentNode.children[data.index]);
        } else {
          parentNode.appendChild(el);
        }

        requestAnimationFrame(function() {
          if (isImg) {
            el.classList.remove('cinematic-hologram-initial');
            el.classList.add('cinematic-hologram-entering');
          } else {
            el.classList.remove('cinematic-initial');
            el.classList.add('cinematic-entering');
          }
        });
      }

      function handleAttrSet(data) {
        var el = resolveNode(data.target);
        if (!el) return;

        if (data.key === 'src') {
          el.classList.add('cinematic-crossfade', 'cinematic-crossfade-out');
          setTimeout(function() {
            el.setAttribute('src', data.value);
            el.classList.remove('cinematic-crossfade-out');
            el.classList.add('cinematic-crossfade-in');
            setTimeout(function() {
              el.classList.remove('cinematic-crossfade', 'cinematic-crossfade-in');
            }, 300);
          }, 150);
          return;
        }

        try { el.setAttribute(data.key, data.value); } catch(_) {}

        if (data.key === 'class' || data.key === 'style') {
          el.classList.remove('cinematic-powerup');
          void el.offsetWidth;
          el.classList.add('cinematic-powerup');
          setTimeout(function() { el.classList.remove('cinematic-powerup'); }, 700);
        }
      }

      function handleTextAppend(data) {
        var el = resolveNode(data.target);
        if (!el) return;

        var caret = activeCarets.get(data.target);
        if (!caret || !caret.parentNode) {
          caret = document.createElement('span');
          caret.className = 'cinematic-typewriter-caret';
          activeCarets.set(data.target, caret);
        }

        if (data.fullText) {
          el.textContent = data.fullText;
          el.appendChild(caret);
        } else if (data.text) {
          var tn = document.createTextNode(data.text);
          if (caret.parentNode === el) {
            el.insertBefore(tn, caret);
          } else {
            el.appendChild(tn);
            el.appendChild(caret);
          }
        }

        clearTimeout(caret._idleTimer);
        caret._idleTimer = setTimeout(function() {
          if (caret && caret.parentNode) caret.parentNode.removeChild(caret);
          activeCarets.delete(data.target);
        }, 1200);
      }

      function handleNodeRemove(data) {
        var el = resolveNode(data.target);
        if (!el || !el.parentNode) return;

        el.classList.add('cinematic-dissolving');
        setTimeout(function() {
          if (el.parentNode) el.parentNode.removeChild(el);
          nodeMap.delete(data.target);
        }, 320);
      }

      function resetDOM() {
        var root = document.getElementById('cinematic-root');
        if (root) root.innerHTML = '';
        nodeMap.clear();
        activeCarets.clear();
      }

      // Handle PostMessages from Host
      window.addEventListener('message', function(ev) {
        var msg = ev.data;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case 'CINEMATIC_DOM_MUTATION':
            var evt = msg.payload;
            if (evt.type === 'node:add') handleNodeAdd(evt);
            else if (evt.type === 'attr:set') handleAttrSet(evt);
            else if (evt.type === 'text:append') handleTextAppend(evt);
            else if (evt.type === 'node:remove') handleNodeRemove(evt);
            break;
          case 'CINEMATIC_DOM_BATCH':
            var batch = msg.payload || [];
            for (var i = 0; i < batch.length; i++) {
              var b = batch[i];
              if (b.type === 'node:add') handleNodeAdd(b);
              else if (b.type === 'attr:set') handleAttrSet(b);
              else if (b.type === 'text:append') handleTextAppend(b);
              else if (b.type === 'node:remove') handleNodeRemove(b);
            }
            break;
          case 'CINEMATIC_SET_THEME':
            if (msg.payload && msg.payload.preset) {
              document.body.className = 'theme-' + msg.payload.preset;
            }
            break;
          case 'CINEMATIC_RESET':
            resetDOM();
            break;
        }

        // Send Ack
        try {
          window.parent.postMessage({
            type: 'CINEMATIC_ANIMATION_ACK',
            payload: { processed: msg.type }
          }, '*');
        } catch(_) {}
      });

      // Signal ready
      window.parent.postMessage({
        type: 'CINEMATIC_IFRAME_READY',
        payload: { ready: true, timestamp: Date.now() }
      }, '*');
    })();
  </script>
</body>
</html>`;
}

/**
 * Sandboxed Iframe Manager
 */
export class SandboxedIframeShell {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container to append iframe into
   * @param {string} [options.preset='cinematic']
   * @param {Object} [options.callbacks]
   */
  constructor(options = {}) {
    this.container = options.container;
    this.preset = options.preset || 'cinematic';
    this.callbacks = options.callbacks || {};

    this.iframe = null;
    this.tunnel = null;
    this._mount();
  }

  _mount() {
    if (typeof document === 'undefined') return;

    this.iframe = document.createElement('iframe');
    // Security restriction: allow-scripts ONLY (no allow-same-origin, no allow-top-navigation)
    this.iframe.setAttribute('sandbox', 'allow-scripts');
    this.iframe.setAttribute('title', 'Cinematic HTML Construction Sandbox');
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    this.iframe.style.display = 'block';
    this.iframe.style.background = '#0a0e17';

    this.iframe.srcdoc = buildIframeHTML({ preset: this.preset });

    this.tunnel = new HostTunnel(this.iframe, this.callbacks);

    if (this.container) {
      this.container.appendChild(this.iframe);
    }
  }

  getTunnel() {
    return this.tunnel;
  }

  destroy() {
    if (this.tunnel) {
      this.tunnel.destroy();
    }
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}
