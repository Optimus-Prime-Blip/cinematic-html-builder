import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildIframeHTML } from '../src/sandbox/iframe-shell.js';
import { StreamingTokenExtractor } from '../src/sandbox/token-extractor.js';
import { StreamMetrics } from '../src/monitor/metrics.js';

describe('Sandbox & Token Extractor', () => {
  it('builds an isolated iframe HTML document with security styles and message listeners', () => {
    const html = buildIframeHTML({ preset: 'cyberpunk' });
    assert.ok(html.includes('theme-cyberpunk'));
    assert.ok(html.includes('cinematic-initial'));
    assert.ok(html.includes('cinematic-entering'));
    assert.ok(html.includes('cinematicGlowPulse'));
    assert.ok(html.includes('CINEMATIC_DOM_MUTATION'));
    assert.ok(html.includes('window.parent.postMessage'));
  });

  it('StreamingTokenExtractor extracts HTML incrementally from markdown code fences', () => {
    const tokens = [];
    const extractor = new StreamingTokenExtractor({
      onToken: (tok) => tokens.push(tok)
    });

    extractor.feed('Here is the page you requested:\n\n```html\n');
    assert.equal(extractor.insideCodeBlock, true);

    extractor.feed('<section class="hero">\n');
    extractor.feed('  <h1>Hero Powers Up</h1>\n');
    extractor.feed('</section>\n');
    extractor.feed('```\nDone generating!');
    extractor.flush();

    const fullExtracted = tokens.join('');
    assert.ok(fullExtracted.includes('<section class="hero">'));
    assert.ok(fullExtracted.includes('<h1>Hero Powers Up</h1>'));
    assert.ok(!fullExtracted.includes('Here is the page'));
    assert.ok(!fullExtracted.includes('Done generating!'));
  });

  it('StreamingTokenExtractor passes raw HTML directly if no markdown fences present', () => {
    const tokens = [];
    const extractor = new StreamingTokenExtractor({
      onToken: (t) => tokens.push(t)
    });

    extractor.feed('<div class="raw-card"><p>Direct HTML</p></div>');
    extractor.flush();

    const full = tokens.join('');
    assert.equal(full, '<div class="raw-card"><p>Direct HTML</p></div>');
  });

  it('StreamMetrics tracks velocity, mutations, and power surge', () => {
    const metrics = new StreamMetrics();
    metrics.recordChunk('<div class="container">');
    metrics.recordMutation({ type: 'node:add', tag: 'div', id: 'div_1' });
    metrics.recordMutation({ type: 'attr:set', target: 'div_1', key: 'class', value: 'hero' });

    const snap = metrics.getSnapshot();
    assert.equal(snap.mutationCounts.nodeAdd, 1);
    assert.equal(snap.mutationCounts.attrSet, 1);
    assert.ok(snap.reactorPower > 5);
    assert.ok(snap.totalBytes > 0);
  });
});
