import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StreamingHTMLParser } from '../src/parser/stream-parser.js';
import { EVENT_TYPES } from '../src/parser/event-schema.js';

describe('StreamingHTMLParser', () => {
  it('parses tokens incrementally without waiting for complete HTML', () => {
    const events = [];
    const parser = new StreamingHTMLParser({
      onEvent: (evt) => events.push(evt)
    });

    // Chunk 1: incomplete opening tag
    parser.feed('<section class="hero"');
    // Buffer held because tag is incomplete; no throw
    assert.equal(Array.isArray(events), true);

    // Chunk 2: tag completes with content
    parser.feed('><h1>Power');
    assert.ok(events.some(e => e.type === EVENT_TYPES.NODE_ADD && e.tag === 'section'));
    assert.ok(events.some(e => e.type === EVENT_TYPES.NODE_ADD && e.tag === 'h1'));

    // Chunk 3: text continues
    parser.feed('ing Up</h1>');
    assert.ok(events.some(e => e.type === EVENT_TYPES.TEXT_APPEND));

    // Chunk 4: closing section
    parser.feed('</section>');
    parser.end();

    assert.ok(events.some(e => e.type === EVENT_TYPES.BATCH_COMPLETE));
  });

  it('handles malformed or cut-off HTML mid-stream safely without throwing', () => {
    const parser = new StreamingHTMLParser();
    assert.doesNotThrow(() => {
      parser.feed('<div cl');
      parser.feed('ass="card"><p unclosed');
      parser.feed('><img src="hero.png"');
      parser.feed(' alt="Hero');
      parser.feed('"></div>');
      parser.end();
    });
  });

  it('emits attr:set when an attribute mutates on a node', () => {
    const events = [];
    const parser = new StreamingHTMLParser({
      onEvent: (evt) => events.push(evt)
    });

    parser.update('<div id="box" class="initial-state"><p>Ready</p></div>');
    parser.update('<div id="box" class="initial-state powered-up"><p>Ready</p></div>');
    parser.end();

    const attrEvts = events.filter(e => e.type === EVENT_TYPES.ATTR_SET);
    assert.ok(attrEvts.length > 0);
    assert.equal(attrEvts[0].key, 'class');
    assert.equal(attrEvts[0].value, 'initial-state powered-up');
  });

  it('emits node:remove when an element is removed from DOM', () => {
    const events = [];
    const parser = new StreamingHTMLParser({
      onEvent: (evt) => events.push(evt)
    });

    parser.update('<main><aside>Sidebar</aside><article>Main</article></main>');
    parser.update('<main><article>Main Only</article></main>');
    parser.end();

    const removeEvts = events.filter(e => e.type === EVENT_TYPES.NODE_REMOVE);
    assert.ok(removeEvts.length > 0);
  });
});
