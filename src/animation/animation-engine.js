/**
 * Cinematic Animation Engine
 * Maps parsed DOM mutation events (node:add, attr:set, text:append, node:remove)
 * into rich hero power-up entrance and transition animations.
 */

import { EVENT_TYPES } from '../parser/event-schema.js';
import { getPreset } from './presets.js';

export class AnimationEngine {
  /**
   * @param {Object} options
   * @param {Document|HTMLElement} options.target - Document or root container where DOM is modified
   * @param {string} [options.preset='cinematic'] - Animation preset ('cinematic' | 'cyberpunk' | 'matrix' | 'blueprint' | 'minimal')
   * @param {boolean} [options.enableTypewriter=true] - Whether to use typewriter text reveal
   * @param {(metric: any) => void} [options.onAnimate] - Callback on animation triggered
   */
  constructor(options = {}) {
    this.target = options.target || (typeof document !== 'undefined' ? document : null);
    this.presetName = options.preset || 'cinematic';
    this.preset = getPreset(this.presetName);
    this.enableTypewriter = options.enableTypewriter !== false;
    this.onAnimate = options.onAnimate || (() => {});

    this.nodeMap = new Map(); // id -> DOM Node
    this.textQueues = new Map(); // id -> typewriter state
    this.activeCarets = new Map(); // id -> caret element
  }

  /**
   * Set animation preset dynamically
   * @param {string} name
   */
  setPreset(name) {
    this.presetName = name;
    this.preset = getPreset(name);
    const doc = this._getDocument();
    if (doc && doc.body) {
      doc.body.className = doc.body.className
        .replace(/\btheme-[a-z0-9\-]+\b/g, '')
        .trim();
      doc.body.classList.add(this.preset.themeClass);
    }
  }

  /**
   * Main entry point: process a single DOM mutation event
   * @param {Object} event
   */
  handleEvent(event) {
    if (!event || !event.type) return;

    switch (event.type) {
      case EVENT_TYPES.NODE_ADD:
        this._handleNodeAdd(event);
        break;
      case EVENT_TYPES.ATTR_SET:
        this._handleAttrSet(event);
        break;
      case EVENT_TYPES.TEXT_APPEND:
        this._handleTextAppend(event);
        break;
      case EVENT_TYPES.NODE_REMOVE:
        this._handleNodeRemove(event);
        break;
    }
  }

  /**
   * Process a batch of events
   * @param {Array<Object>} events
   */
  handleBatch(events) {
    if (!Array.isArray(events)) return;
    for (const evt of events) {
      this.handleEvent(evt);
    }
  }

  /**
   * Handle node:add
   * Spec:
   * - New container/block element: Scale-in from 0 with glow pulse (module locking into place).
   * - Implementation rule: Insert element immediately with opacity: 0; transform: scale(0.8),
   *   then on next animation frame add 'entering' class.
   * - <img> added: Fade-in + blur-to-sharp (hologram solidifying).
   * @private
   */
  _handleNodeAdd(event) {
    const doc = this._getDocument();
    if (!doc) return;

    const { tag, parent, attributes, id, index } = event;
    const parentNode = this._resolveParent(parent);
    if (!parentNode) return;

    // Create the new element
    const el = doc.createElement(tag);
    el.setAttribute('data-cinematic-id', id);

    // Apply attributes
    if (attributes) {
      for (const [k, v] of Object.entries(attributes)) {
        try {
          el.setAttribute(k, v);
        } catch (_) {}
      }
    }

    this.nodeMap.set(id, el);

    // Determine element category for animation
    const isImage = tag === 'img';
    const isBlockContainer = /^(section|div|article|header|footer|nav|main|aside|form|ul|ol|table|card)$/i.test(tag);

    // Apply initial state
    if (isImage) {
      el.classList.add('cinematic-hologram-initial');
    } else {
      el.classList.add('cinematic-initial');
    }

    // Insert into parent
    if (index !== undefined && index >= 0 && index < parentNode.children.length) {
      parentNode.insertBefore(el, parentNode.children[index]);
    } else {
      parentNode.appendChild(el);
    }

    this.onAnimate({
      type: 'materialize:start',
      tag,
      id,
      category: isImage ? 'hologram' : (isBlockContainer ? 'container' : 'element')
    });

    // Next animation frame: trigger materialization reveal
    const nextFrame = typeof requestAnimationFrame !== 'undefined'
      ? requestAnimationFrame
      : (cb) => setTimeout(cb, 16);

    nextFrame(() => {
      if (isImage) {
        el.classList.remove('cinematic-hologram-initial');
        el.classList.add('cinematic-hologram-entering');
      } else {
        el.classList.remove('cinematic-initial');
        el.classList.add('cinematic-entering');
      }

      this.onAnimate({
        type: 'materialize:entering',
        tag,
        id
      });
    });
  }

  /**
   * Handle attr:set
   * Spec:
   * - CSS class applied / color change: Border/color transition ("powering up")
   * - Attribute change (e.g. src swap): Cross-fade between old and new visual
   * @private
   */
  _handleAttrSet(event) {
    const { target, key, value } = event;
    const el = this._resolveNode(target);
    if (!el) return;

    if (key === 'src') {
      // Cross-fade for image or media src swap
      el.classList.add('cinematic-crossfade', 'cinematic-crossfade-out');
      setTimeout(() => {
        el.setAttribute('src', value);
        el.classList.remove('cinematic-crossfade-out');
        el.classList.add('cinematic-crossfade-in');
        setTimeout(() => {
          el.classList.remove('cinematic-crossfade', 'cinematic-crossfade-in');
        }, 300);
      }, 150);
      this.onAnimate({ type: 'attr:crossfade', target, key, value });
      return;
    }

    try {
      el.setAttribute(key, value);
    } catch (_) {}

    // If class or style was modified, trigger powering-up energy ripple
    if (key === 'class' || key === 'style') {
      el.classList.remove('cinematic-powerup');
      // Force reflow
      void el.offsetWidth;
      el.classList.add('cinematic-powerup');

      setTimeout(() => {
        el.classList.remove('cinematic-powerup');
      }, 700);

      this.onAnimate({ type: 'attr:powerup', target, key, value });
    }
  }

  /**
   * Handle text:append
   * Spec:
   * - Text node appended: Typewriter reveal, optional subtle particle trail
   * @private
   */
  _handleTextAppend(event) {
    const { target, text, fullText } = event;
    const el = this._resolveNode(target);
    if (!el) return;

    if (!this.enableTypewriter) {
      // Direct text set if typewriter is disabled
      el.textContent = fullText || text;
      return;
    }

    // Typewriter reveal with glowing caret
    this._runTypewriter(el, target, text, fullText);
    this.onAnimate({ type: 'text:typewriter', target, textLength: text.length });
  }

  /**
   * Typewriter text reveal simulation with sparkling caret
   * @private
   */
  _runTypewriter(el, targetId, textDelta, fullText) {
    const doc = this._getDocument();
    if (!doc) return;

    let caret = this.activeCarets.get(targetId);
    if (!caret || !caret.parentNode) {
      caret = doc.createElement('span');
      caret.className = 'cinematic-typewriter-caret';
      this.activeCarets.set(targetId, caret);
    }

    if (fullText) {
      // Replace existing text content and place caret at end
      el.textContent = fullText;
      el.appendChild(caret);
    } else if (textDelta) {
      // Append text delta
      const textNode = doc.createTextNode(textDelta);
      if (caret.parentNode === el) {
        el.insertBefore(textNode, caret);
      } else {
        el.appendChild(textNode);
        el.appendChild(caret);
      }
    }

    // Remove caret after a brief idle pause
    clearTimeout(caret._idleTimer);
    caret._idleTimer = setTimeout(() => {
      if (caret && caret.parentNode) {
        caret.parentNode.removeChild(caret);
      }
      this.activeCarets.delete(targetId);
    }, 1200);
  }

  /**
   * Handle node:remove
   * Spec:
   * - Node removed: Reverse of its entrance (quick dissolve)
   * @private
   */
  _handleNodeRemove(event) {
    const { target } = event;
    const el = this._resolveNode(target);
    if (!el || !el.parentNode) return;

    this.onAnimate({ type: 'dissolve:start', target });

    el.classList.add('cinematic-dissolving');
    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
      this.nodeMap.delete(target);
      this.onAnimate({ type: 'dissolve:complete', target });
    }, 320);
  }

  /**
   * Resolve target DOM Node by ID or selector
   * @private
   */
  _resolveNode(ref) {
    if (!ref) return null;
    if (this.nodeMap.has(ref)) return this.nodeMap.get(ref);

    const doc = this._getDocument();
    if (!doc) return null;

    if (ref === 'body') return doc.body;
    return doc.querySelector(`[data-cinematic-id="${ref}"]`) || doc.getElementById(ref);
  }

  /**
   * Resolve parent DOM node
   * @private
   */
  _resolveParent(parentRef) {
    if (!parentRef || parentRef === 'body' || parentRef === 'root') {
      const doc = this._getDocument();
      return doc ? doc.body : null;
    }
    return this._resolveNode(parentRef);
  }

  _getDocument() {
    if (!this.target) return typeof document !== 'undefined' ? document : null;
    if (this.target.nodeType === 9) return this.target; // Document
    return this.target.ownerDocument || this.target;
  }
}
