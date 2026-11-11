/**
 * Event Schema for Cinematic HTML Builder
 * Represents structured DOM mutation events emitted by the streaming parser.
 */

export const EVENT_TYPES = {
  NODE_ADD: 'node:add',
  ATTR_SET: 'attr:set',
  TEXT_APPEND: 'text:append',
  NODE_REMOVE: 'node:remove',
  BATCH_COMPLETE: 'batch:complete'
};

/**
 * Creates a node:add event
 * @param {string} tag - Tag name (e.g. "section", "div", "img")
 * @param {string} parent - Target parent node reference or selector (e.g. "body", "node_1")
 * @param {Record<string, string>} attributes - Initial attributes dictionary
 * @param {string} id - Stable node reference ID
 * @param {number} [index] - Sibling insertion index
 */
export function createNodeAddEvent(tag, parent, attributes = {}, id = '', index = -1) {
  return {
    type: EVENT_TYPES.NODE_ADD,
    id: id || generateNodeId(tag),
    tag: tag.toLowerCase(),
    parent: parent || 'body',
    attributes: { ...attributes },
    index,
    timestamp: Date.now()
  };
}

/**
 * Creates an attr:set event
 * @param {string} target - Target node reference ID
 * @param {string} key - Attribute name (e.g. "class", "src", "style")
 * @param {string} value - New attribute value
 * @param {string} [oldValue] - Previous attribute value
 */
export function createAttrSetEvent(target, key, value, oldValue = null) {
  return {
    type: EVENT_TYPES.ATTR_SET,
    target,
    key,
    value,
    oldValue,
    timestamp: Date.now()
  };
}

/**
 * Creates a text:append event
 * @param {string} target - Target parent node reference ID
 * @param {string} text - Newly appended text delta
 * @param {string} [fullText] - Full accumulated text inside target node
 */
export function createTextAppendEvent(target, text, fullText = '') {
  return {
    type: EVENT_TYPES.TEXT_APPEND,
    target,
    text,
    fullText: fullText || text,
    timestamp: Date.now()
  };
}

/**
 * Creates a node:remove event
 * @param {string} target - Target node reference ID to remove
 * @param {string} [parent] - Parent node reference
 */
export function createNodeRemoveEvent(target, parent = '') {
  return {
    type: EVENT_TYPES.NODE_REMOVE,
    target,
    parent,
    timestamp: Date.now()
  };
}

let counter = 0;
export function generateNodeId(prefix = 'node') {
  counter += 1;
  return `cinematic_${prefix}_${counter}_${Math.random().toString(36).slice(2, 6)}`;
}

export function resetNodeIdCounter() {
  counter = 0;
}
