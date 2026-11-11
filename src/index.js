/**
 * Cinematic HTML Builder - Core Library Entry Point
 * Watches AI streaming HTML tokens and renders a live, animated construction
 * preview in a sandboxed iframe with hero power-up visuals.
 */

export { StreamingHTMLParser } from './parser/stream-parser.js';
export {
  EVENT_TYPES,
  createNodeAddEvent,
  createAttrSetEvent,
  createTextAppendEvent,
  createNodeRemoveEvent
} from './parser/event-schema.js';
export { createPipeableTransformStream, BrowserDOMStreamAdapter } from './parser/pipeable-adapter.js';

export { AnimationEngine } from './animation/animation-engine.js';
export { PRESETS, getPreset } from './animation/presets.js';

export { SandboxedIframeShell, buildIframeHTML } from './sandbox/iframe-shell.js';
export { HostTunnel, TUNNEL_MESSAGES } from './sandbox/tunnel.js';
export { StreamingTokenExtractor } from './sandbox/token-extractor.js';

export { TokenMonitorHUD } from './monitor/token-monitor-hud.js';
export { StreamMetrics } from './monitor/metrics.js';

/**
 * High-level Controller: binds Parser, Token Extractor, Sandboxed Iframe,
 * and Token Monitor HUD into one turnkey construction pipeline.
 */
export class CinematicHTMLBuilder {
  /**
   * @param {Object} options
   * @param {HTMLElement} [options.previewContainer] - DOM element to host sandboxed preview
   * @param {HTMLElement} [options.hudContainer] - DOM element to host Token Monitor HUD
   * @param {string} [options.preset='cinematic'] - Animation preset ('cinematic' | 'cyberpunk' | 'matrix' | 'blueprint' | 'minimal')
   * @param {string} [options.streamMode='token'] - 'token' | 'chunk' | 'sse'
   */
  constructor(options = {}) {
    this.preset = options.preset || 'cinematic';
    this.streamMode = options.streamMode || 'token';

    this.extractor = new StreamingTokenExtractor();
    this.parser = null;
    this.shell = null;
    this.hud = null;

    this.previewContainer = options.previewContainer;
    this.hudContainer = options.hudContainer;

    this._init();
  }

  _init() {
    // 1. Initialize Sandboxed Iframe Shell if preview container provided
    if (this.previewContainer) {
      this.shell = new (this.constructor.SandboxedIframeShell || (awaitImportIframeShell()))({
        container: this.previewContainer,
        preset: this.preset
      });
    }

    // 2. Initialize HUD if container provided
    if (this.hudContainer) {
      this.hud = new (this.constructor.TokenMonitorHUD || (awaitImportHUD()))({
        container: this.hudContainer,
        preset: this.preset,
        onControlAction: (action, val) => this._handleControlAction(action, val)
      });
    }

    // 3. Initialize Streaming Parser
    this.parser = new (this.constructor.StreamingHTMLParser || (awaitImportParser()))({
      onEvent: (event) => {
        if (this.hud) this.hud.recordMutation(event);
        if (this.shell && this.shell.getTunnel()) {
          this.shell.getTunnel().sendMutation(event);
        }
      }
    });
  }

  _handleControlAction(action, val) {
    if (action === 'preset') {
      this.preset = val;
      if (this.shell && this.shell.getTunnel()) {
        this.shell.getTunnel().setTheme(val);
      }
    } else if (action === 'replay') {
      this.reset();
    }
  }

  /**
   * Feed incoming stream chunk (token, SSE chunk, or raw HTML)
   * @param {string} rawChunk
   */
  feed(rawChunk) {
    const htmlToken = this.extractor.feed(rawChunk);
    if (htmlToken) {
      if (this.hud) this.hud.recordChunk(htmlToken);
      this.parser.feed(htmlToken);
    }
  }

  /**
   * Signal stream completion
   */
  finish() {
    const trailing = this.extractor.flush();
    if (trailing) {
      if (this.hud) this.hud.recordChunk(trailing);
      this.parser.feed(trailing);
    }
    this.parser.end();
    if (this.hud) this.hud.complete();
  }

  /**
   * Reset preview and parser state for replay
   */
  reset() {
    this.extractor.reset();
    if (this.parser) this.parser.reset();
    if (this.hud) this.hud.reset();
    if (this.shell && this.shell.getTunnel()) {
      this.shell.getTunnel().reset();
    }
  }

  destroy() {
    if (this.hud) this.hud.destroy();
    if (this.shell) this.shell.destroy();
  }
}

// Helpers for dynamic resolution if needed
function awaitImportIframeShell() {
  const { SandboxedIframeShell } = require('./sandbox/iframe-shell.js');
  return SandboxedIframeShell;
}
function awaitImportHUD() {
  const { TokenMonitorHUD } = require('./monitor/token-monitor-hud.js');
  return TokenMonitorHUD;
}
function awaitImportParser() {
  const { StreamingHTMLParser } = require('./parser/stream-parser.js');
  return StreamingHTMLParser;
}
