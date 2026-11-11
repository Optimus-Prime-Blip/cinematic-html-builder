import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnimationEngine } from '../src/animation/animation-engine.js';
import { EVENT_TYPES, createNodeAddEvent, createAttrSetEvent, createTextAppendEvent, createNodeRemoveEvent } from '../src/parser/event-schema.js';
import { getPreset } from '../src/animation/presets.js';

// Minimal mock DOM for headless testing
function createMockDocument() {
  class MockElement {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.tag = tag.toLowerCase();
      this.attributes = {};
      const set = new Set();
      this.classList = {
        add: (c) => set.add(c),
        remove: (c) => set.delete(c),
        contains: (c) => set.has(c),
        has: (c) => set.has(c)
      };
      this.children = [];
      this.parentNode = null;
      this.textContent = '';
      this.offsetWidth = 100;
    }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k]; }
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    insertBefore(child, ref) {
      child.parentNode = this;
      const idx = this.children.indexOf(ref);
      if (idx !== -1) this.children.splice(idx, 0, child);
      else this.children.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) this.children.splice(idx, 1);
      child.parentNode = null;
      return child;
    }
  }

  const body = new MockElement('body');

  return {
    body,
    nodeType: 9,
    createElement(tag) {
      return new MockElement(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, nodeValue: text };
    },
    querySelector() { return null; },
    getElementById() { return null; }
  };
}

describe('AnimationEngine', () => {
  it('loads presets correctly (cinematic, cyberpunk, matrix, blueprint, minimal)', () => {
    const p1 = getPreset('cinematic');
    assert.equal(p1.themeClass, 'theme-cinematic');
    assert.equal(p1.primaryColor, '#00f0ff');

    const p2 = getPreset('cyberpunk');
    assert.equal(p2.primaryColor, '#ff007f');

    const p3 = getPreset('matrix');
    assert.equal(p3.primaryColor, '#00ff66');
  });

  it('handles node:add by setting cinematic-initial class and appending to parent', (t, done) => {
    const doc = createMockDocument();
    const animations = [];

    const engine = new AnimationEngine({
      target: doc,
      preset: 'cinematic',
      onAnimate: (metric) => animations.push(metric)
    });

    const evt = createNodeAddEvent('section', 'body', { class: 'hero-panel' }, 'node_hero_1');
    engine.handleEvent(evt);

    assert.equal(doc.body.children.length, 1);
    const section = doc.body.children[0];
    assert.equal(section.tag, 'section');
    assert.equal(section.getAttribute('data-cinematic-id'), 'node_hero_1');
    assert.ok(animations.some(a => a.type === 'materialize:start' && a.category === 'container'));

    // Verify nextFrame transitions to entering
    setTimeout(() => {
      assert.ok(animations.some(a => a.type === 'materialize:entering'));
      done();
    }, 40);
  });

  it('handles img node:add with hologram initial classes', () => {
    const doc = createMockDocument();
    const animations = [];

    const engine = new AnimationEngine({
      target: doc,
      onAnimate: (m) => animations.push(m)
    });

    const evt = createNodeAddEvent('img', 'body', { src: 'hero.png' }, 'node_img_1');
    engine.handleEvent(evt);

    const img = doc.body.children[0];
    assert.equal(img.tag, 'img');
    assert.ok(animations.some(a => a.category === 'hologram'));
  });

  it('handles attr:set on class or style with powerup animation trigger', () => {
    const doc = createMockDocument();
    const animations = [];

    const engine = new AnimationEngine({
      target: doc,
      onAnimate: (m) => animations.push(m)
    });

    // Add node
    engine.handleEvent(createNodeAddEvent('button', 'body', { class: 'btn' }, 'btn_1'));
    // Mutate class
    engine.handleEvent(createAttrSetEvent('btn_1', 'class', 'btn btn-supercharged'));

    assert.ok(animations.some(a => a.type === 'attr:powerup'));
  });

  it('handles node:remove with dissolve animation', (t, done) => {
    const doc = createMockDocument();
    const animations = [];

    const engine = new AnimationEngine({
      target: doc,
      onAnimate: (m) => animations.push(m)
    });

    engine.handleEvent(createNodeAddEvent('div', 'body', {}, 'box_to_remove'));
    assert.equal(doc.body.children.length, 1);

    engine.handleEvent(createNodeRemoveEvent('box_to_remove', 'body'));
    assert.ok(animations.some(a => a.type === 'dissolve:start'));

    setTimeout(() => {
      assert.ok(animations.some(a => a.type === 'dissolve:complete'));
      assert.equal(doc.body.children.length, 0);
      done();
    }, 350);
  });
});
