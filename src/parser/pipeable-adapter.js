/**
 * Pipeable DOM & Streaming Diff Adapter
 * Connects pipeable-dom (TransformStream / DOMStream) and diff-dom-streaming
 * to emit our cinematic DOM mutation event stream.
 */

import { StreamingHTMLParser } from './stream-parser.js';
import { EVENT_TYPES, createNodeAddEvent, createAttrSetEvent, createTextAppendEvent, createNodeRemoveEvent } from './event-schema.js';

/**
 * Creates a standard W3C TransformStream that accepts HTML string chunks
 * and produces structured DOM mutation events.
 * Compatible with pipeable-dom.
 *
 * @param {Object} [options]
 * @returns {TransformStream<string, any>}
 */
export function createPipeableTransformStream(options = {}) {
  const parser = new StreamingHTMLParser(options);

  return new TransformStream({
    transform(chunk, controller) {
      const events = parser.feed(chunk);
      for (const evt of events) {
        controller.enqueue(evt);
      }
    },
    flush(controller) {
      const finalEvents = parser.end();
      for (const evt of finalEvents) {
        controller.enqueue(evt);
      }
    }
  });
}

/**
 * Browser DOM diff adapter using diff-dom-streaming principles.
 * When running in a browser with a live DOM Node, tracks real DOM mutations
 * via MutationObserver or diff-dom-streaming callbacks and converts them to our schema.
 */
export class BrowserDOMStreamAdapter {
  /**
   * @param {HTMLElement} rootElement - Container DOM element
   * @param {(event: any) => void} onEvent - Event listener
   */
  constructor(rootElement, onEvent) {
    this.root = rootElement;
    this.onEvent = onEvent;
    this.nodeMap = new WeakMap();
    this.idCounter = 0;
    this.observer = null;
    this._initObserver();
  }

  _getOrCreateId(node) {
    if (!this.nodeMap.has(node)) {
      this.idCounter += 1;
      const id = node.id || `dom_node_${this.idCounter}`;
      this.nodeMap.set(node, id);
      if (node.setAttribute && !node.getAttribute('data-cinematic-id')) {
        node.setAttribute('data-cinematic-id', id);
      }
    }
    return this.nodeMap.get(node);
  }

  _initObserver() {
    if (typeof MutationObserver === 'undefined') return;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Added nodes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const targetId = this._getOrCreateId(node);
              const parentId = node.parentNode ? this._getOrCreateId(node.parentNode) : 'body';
              const attrs = {};
              if (node.attributes) {
                for (let i = 0; i < node.attributes.length; i++) {
                  attrs[node.attributes[i].name] = node.attributes[i].value;
                }
              }
              this.onEvent(createNodeAddEvent(node.tagName, parentId, attrs, targetId));
            } else if (node.nodeType === 3) { // Text node
              if (node.nodeValue && node.parentNode) {
                const parentId = this._getOrCreateId(node.parentNode);
                this.onEvent(createTextAppendEvent(parentId, node.nodeValue));
              }
            }
          });

          // Removed nodes
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const targetId = this._getOrCreateId(node);
              const parentId = mutation.target ? this._getOrCreateId(mutation.target) : 'body';
              this.onEvent(createNodeRemoveEvent(targetId, parentId));
            }
          });
        } else if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target && target.nodeType === 1) {
            const targetId = this._getOrCreateId(target);
            const key = mutation.attributeName;
            const value = target.getAttribute(key);
            const oldValue = mutation.oldValue;
            this.onEvent(createAttrSetEvent(targetId, key, value, oldValue));
          }
        } else if (mutation.type === 'characterData') {
          const node = mutation.target;
          if (node && node.parentNode) {
            const parentId = this._getOrCreateId(node.parentNode);
            this.onEvent(createTextAppendEvent(parentId, node.nodeValue));
          }
        }
      }
    });

    this.observer.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true
    });
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
