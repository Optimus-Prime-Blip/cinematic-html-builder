/**
 * PostMessage Tunnel for Sandboxed Iframe
 * Handles secure communication between host environment and isolated preview iframe:
 * - Dispatches DOM mutations
 * - Relays console logs and error telemetry
 * - Synchronizes theme and CSS variables
 */

export const TUNNEL_MESSAGES = {
  INIT: 'CINEMATIC_INIT',
  IFRAME_READY: 'CINEMATIC_IFRAME_READY',
  DOM_MUTATION: 'CINEMATIC_DOM_MUTATION',
  DOM_BATCH: 'CINEMATIC_DOM_BATCH',
  SET_THEME: 'CINEMATIC_SET_THEME',
  RESET: 'CINEMATIC_RESET',
  CONSOLE_LOG: 'CINEMATIC_CONSOLE_LOG',
  ANIMATION_ACK: 'CINEMATIC_ANIMATION_ACK',
  PING: 'CINEMATIC_PING',
  PONG: 'CINEMATIC_PONG'
};

export class HostTunnel {
  /**
   * @param {HTMLIFrameElement} iframeElement
   * @param {Object} [callbacks]
   */
  constructor(iframeElement, callbacks = {}) {
    this.iframe = iframeElement;
    this.callbacks = {
      onReady: callbacks.onReady || (() => {}),
      onConsoleLog: callbacks.onConsoleLog || (() => {}),
      onAnimationAck: callbacks.onAnimationAck || (() => {}),
      ...callbacks
    };
    this.isReady = false;
    this.pendingQueue = [];
    this._messageListener = this._handleMessage.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this._messageListener);
    }
  }

  _handleMessage(event) {
    // Only accept messages from our iframe
    if (event.source !== this.iframe?.contentWindow) return;

    const data = event.data;
    if (!data || typeof data !== 'object') return;

    switch (data.type) {
      case TUNNEL_MESSAGES.IFRAME_READY:
        this.isReady = true;
        this._flushPendingQueue();
        this.callbacks.onReady(data.payload);
        break;
      case TUNNEL_MESSAGES.CONSOLE_LOG:
        this.callbacks.onConsoleLog(data.payload);
        break;
      case TUNNEL_MESSAGES.ANIMATION_ACK:
        this.callbacks.onAnimationAck(data.payload);
        break;
    }
  }

  /**
   * Post a message to the iframe
   */
  send(type, payload = {}) {
    const msg = { type, payload, timestamp: Date.now() };
    if (!this.isReady) {
      this.pendingQueue.push(msg);
      return;
    }
    this._post(msg);
  }

  _post(msg) {
    if (this.iframe && this.iframe.contentWindow) {
      // In sandboxed iframe with sandbox="allow-scripts", origin is 'null' or opaque
      this.iframe.contentWindow.postMessage(msg, '*');
    }
  }

  _flushPendingQueue() {
    while (this.pendingQueue.length > 0) {
      const msg = this.pendingQueue.shift();
      this._post(msg);
    }
  }

  sendMutation(event) {
    this.send(TUNNEL_MESSAGES.DOM_MUTATION, event);
  }

  sendBatch(events) {
    this.send(TUNNEL_MESSAGES.DOM_BATCH, events);
  }

  setTheme(presetName, cssVars = {}) {
    this.send(TUNNEL_MESSAGES.SET_THEME, { preset: presetName, cssVars });
  }

  reset() {
    this.send(TUNNEL_MESSAGES.RESET, {});
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this._messageListener);
    }
  }
}
