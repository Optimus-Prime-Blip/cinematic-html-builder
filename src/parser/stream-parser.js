/**
 * Streaming HTML Parser
 * Converts incoming token chunks into structured DOM mutation events without waiting
 * for the full HTML string. Resilient to incomplete and malformed HTML mid-stream.
 */

import {
  EVENT_TYPES,
  createNodeAddEvent,
  createAttrSetEvent,
  createTextAppendEvent,
  createNodeRemoveEvent,
  generateNodeId
} from './event-schema.js';

export class StreamingHTMLParser {
  /**
   * @param {Object} [options]
   * @param {(event: any) => void} [options.onEvent] - Callback for each mutation event
   * @param {boolean} [options.batchEvents=false] - Whether to yield events in batches
   */
  constructor(options = {}) {
    this.onEvent = options.onEvent || (() => {});
    this.batchEvents = options.batchEvents || false;
    this.rawBuffer = '';
    this.previousTree = null;
    this.nodeIdMap = new Map(); // path -> stable id
    this.attributeCache = new Map(); // id -> { key: value }
    this.textCache = new Map(); // id -> string
    this.isFinished = false;
  }

  /**
   * Reset parser state
   */
  reset() {
    this.rawBuffer = '';
    this.previousTree = null;
    this.nodeIdMap.clear();
    this.attributeCache.clear();
    this.textCache.clear();
    this.isFinished = false;
  }

  /**
   * Feed a new chunk or token of HTML text into the parser.
   * Emits mutation events as changes are discovered.
   * @param {string} chunk - HTML token or chunk
   * @returns {Array<any>} Emitted events in this cycle
   */
  feed(chunk) {
    if (this.isFinished) return [];
    return this.update(this.rawBuffer + chunk);
  }

  /**
   * Update entire HTML buffer and compute diff against previous snapshot.
   * Useful for token streaming as well as live replacement updates.
   * @param {string} fullHTML
   * @returns {Array<any>}
   */
  update(fullHTML) {
    this.rawBuffer = fullHTML;
    const events = [];

    // Sanitize buffer for parsing mid-stream (auto-balances tags, holds incomplete trailing tags)
    const sanitizedHTML = this._sanitizeIncompleteHTML(this.rawBuffer);
    const currentTree = this._parseToVirtualTree(sanitizedHTML);

    this._diffTrees(this.previousTree, currentTree, 'body', events);
    this.previousTree = currentTree;

    for (const evt of events) {
      this.onEvent(evt);
    }

    return events;
  }

  /**
   * Signal the end of the stream
   */
  end() {
    this.isFinished = true;
    const finalTree = this._parseToVirtualTree(this.rawBuffer);
    const events = [];
    this._diffTrees(this.previousTree, finalTree, 'body', events);
    this.previousTree = finalTree;
    for (const evt of events) {
      this.onEvent(evt);
    }
    this.onEvent({ type: EVENT_TYPES.BATCH_COMPLETE, timestamp: Date.now() });
    return events;
  }

  /**
   * Mid-stream HTML repair: trims incomplete trailing tag syntax like `<div cl` or `<a href="`
   * and closes any unclosed open tags so standard parsers won't choke.
   * @private
   */
  _sanitizeIncompleteHTML(html) {
    let text = html.trim();
    if (!text) return '';

    // Check if the stream ends in the middle of a tag: `<tag attr="..."` without `>`
    const lastOpenAngle = text.lastIndexOf('<');
    const lastCloseAngle = text.lastIndexOf('>');

    if (lastOpenAngle > lastCloseAngle) {
      // Incomplete tag at the end. Slice it off for current parse frame,
      // it will be completed in subsequent chunks.
      text = text.substring(0, lastOpenAngle);
    }

    // Auto-close unclosed tags for virtual tree balance
    const openTags = [];
    const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*?)?(\/?)>/g;
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      const isClosing = match[0].startsWith('</');
      const tagName = match[1].toLowerCase();
      const isSelfClosing = match[2] === '/' || voidTags.has(tagName);

      if (isSelfClosing) continue;

      if (!isClosing) {
        openTags.push(tagName);
      } else {
        const lastIdx = openTags.lastIndexOf(tagName);
        if (lastIdx !== -1) {
          openTags.splice(lastIdx, 1);
        }
      }
    }

    // Append closing tags in reverse order
    for (let i = openTags.length - 1; i >= 0; i--) {
      text += `</${openTags[i]}>`;
    }

    return text;
  }

  /**
   * Lightweight AST parser for browser and Node.js environments.
   * Parses HTML string into a nested Virtual Node structure.
   * @private
   */
  _parseToVirtualTree(html) {
    if (!html || !html.trim()) {
      return { tag: 'body', attributes: {}, children: [], text: '', path: 'body' };
    }

    const root = { tag: 'body', attributes: {}, children: [], text: '', path: 'body' };
    const stack = [root];
    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);

    // Tokenize tags and text
    const tokenizer = /(<[^>]+>)|([^<]+)/g;
    let match;

    while ((match = tokenizer.exec(html)) !== null) {
      const [full, tagMatch, textMatch] = match;
      const currentParent = stack[stack.length - 1];
      if (!currentParent) break;

      if (textMatch) {
        const text = textMatch;
        if (text) {
          currentParent.text = (currentParent.text || '') + text;
        }
      } else if (tagMatch) {
        if (tagMatch.startsWith('<!--')) {
          // Comment node - ignore
          continue;
        }

        if (tagMatch.startsWith('</')) {
          // Closing tag
          const tagName = tagMatch.replace(/[</>\s]/g, '').toLowerCase();
          for (let i = stack.length - 1; i > 0; i--) {
            if (stack[i].tag === tagName) {
              stack.splice(i);
              break;
            }
          }
        } else {
          // Opening or self-closing tag
          const isSelfClosing = tagMatch.endsWith('/>');
          const tagContent = tagMatch.slice(1, isSelfClosing ? -2 : -1).trim();
          const firstSpace = tagContent.search(/\s/);
          const tagName = (firstSpace === -1 ? tagContent : tagContent.slice(0, firstSpace)).toLowerCase();
          const attrString = firstSpace === -1 ? '' : tagContent.slice(firstSpace).trim();

          const attributes = this._parseAttributes(attrString);
          const childIndex = currentParent.children.length;
          const nodePath = attributes.id ? attributes.id : `${currentParent.path}/${tagName}[${childIndex}]`;

          const node = {
            tag: tagName,
            attributes,
            children: [],
            text: '',
            path: nodePath
          };

          currentParent.children.push(node);

          if (!isSelfClosing && !voidTags.has(tagName)) {
            stack.push(node);
          }
        }
      }
    }

    return root;
  }

  /**
   * Parse HTML attributes string into key-value pairs
   * @private
   */
  _parseAttributes(attrStr) {
    const attributes = {};
    if (!attrStr) return attributes;

    const attrRegex = /([a-zA-Z0-9_\-:@.]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let match;
    while ((match = attrRegex.exec(attrStr)) !== null) {
      const key = match[1];
      const value = match[2] !== undefined ? match[2] :
                    match[3] !== undefined ? match[3] :
                    match[4] !== undefined ? match[4] : '';
      attributes[key] = value;
    }
    return attributes;
  }

  /**
   * Diffs two virtual trees and generates minimal mutation events
   * @private
   */
  _diffTrees(oldTree, newTree, parentRef, events) {
    if (!newTree) return;

    if (!oldTree) {
      // Entire new subtree added
      this._emitSubtreeAdd(newTree, parentRef, events);
      return;
    }

    // Obtain stable ID for newTree based on its path
    let nodeId = newTree.attributes?.id || this.nodeIdMap.get(newTree.path);
    if (!nodeId) {
      nodeId = generateNodeId(newTree.tag);
      this.nodeIdMap.set(newTree.path, nodeId);
    }

    // 1. Check attribute changes
    const oldAttrs = oldTree.attributes || {};
    const newAttrs = newTree.attributes || {};
    const cachedAttrs = this.attributeCache.get(nodeId) || {};

    for (const [key, val] of Object.entries(newAttrs)) {
      if (oldAttrs[key] !== val || cachedAttrs[key] !== val) {
        events.push(createAttrSetEvent(nodeId, key, val, oldAttrs[key] ?? null));
        cachedAttrs[key] = val;
      }
    }
    this.attributeCache.set(nodeId, cachedAttrs);

    // 2. Check text changes
    const oldText = oldTree.text || '';
    const newText = newTree.text || '';
    const cachedText = this.textCache.get(nodeId) || '';

    if (newText !== oldText && newText !== cachedText) {
      const delta = newText.startsWith(cachedText)
        ? newText.slice(cachedText.length)
        : newText;
      if (delta) {
        events.push(createTextAppendEvent(nodeId, delta, newText));
      }
      this.textCache.set(nodeId, newText);
    }

    // 3. Diff children
    const oldChildren = oldTree.children || [];
    const newChildren = newTree.children || [];

    // Check newly added or modified children
    for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i];
      const oldChild = oldChildren[i];

      if (!oldChild) {
        // Child is newly appended
        this._emitSubtreeAdd(newChild, nodeId, events, i);
      } else if (oldChild.tag !== newChild.tag) {
        // Child replaced: remove old, add new
        const oldId = oldChild.attributes?.id || this.nodeIdMap.get(oldChild.path) || generateNodeId(oldChild.tag);
        events.push(createNodeRemoveEvent(oldId, nodeId));
        this._emitSubtreeAdd(newChild, nodeId, events, i);
      } else {
        // Same tag: recurse diff
        this._diffTrees(oldChild, newChild, nodeId, events);
      }
    }

    // Check removed children
    for (let i = newChildren.length; i < oldChildren.length; i++) {
      const removedChild = oldChildren[i];
      const removedId = removedChild.attributes?.id || this.nodeIdMap.get(removedChild.path);
      if (removedId) {
        events.push(createNodeRemoveEvent(removedId, nodeId));
      }
    }
  }

  /**
   * Recursively emit node:add and child events for a whole newly introduced tree/branch
   * @private
   */
  _emitSubtreeAdd(node, parentRef, events, index = -1) {
    let id = node.attributes?.id || this.nodeIdMap.get(node.path);
    if (!id) {
      id = generateNodeId(node.tag);
      this.nodeIdMap.set(node.path, id);
    }

    this.attributeCache.set(id, { ...node.attributes });
    this.textCache.set(id, node.text || '');

    events.push(createNodeAddEvent(node.tag, parentRef, node.attributes, id, index));

    if (node.text && node.text.trim()) {
      events.push(createTextAppendEvent(id, node.text, node.text));
    }

    for (let i = 0; i < node.children.length; i++) {
      this._emitSubtreeAdd(node.children[i], id, events, i);
    }
  }
}
