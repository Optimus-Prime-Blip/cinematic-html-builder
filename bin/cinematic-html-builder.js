#!/usr/bin/env node

/**
 * Cinematic HTML Builder CLI
 * Usage:
 *   /cinematic-html-builder --stream-mode=token --animation=cinematic
 *   cinematic-html-builder --demo
 *   cinematic-html-builder --file=my-page.html --animation=cyberpunk
 *   cat my-page.html | cinematic-html-builder
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StreamingHTMLParser } from '../src/parser/stream-parser.js';
import { StreamingTokenExtractor } from '../src/sandbox/token-extractor.js';
import { StreamMetrics } from '../src/monitor/metrics.js';
import { startServer } from '../examples/stream-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI flags
const args = process.argv.slice(2);
const options = {
  streamMode: 'token',
  animation: 'cinematic',
  port: 3456,
  speed: 1,
  demo: false,
  file: null,
  help: false
};

for (const arg of args) {
  if (arg === '--help' || arg === '-h') {
    options.help = true;
  } else if (arg === '--demo') {
    options.demo = true;
  } else if (arg.startsWith('--stream-mode=')) {
    options.streamMode = arg.split('=')[1];
  } else if (arg.startsWith('--animation=')) {
    options.animation = arg.split('=')[1];
  } else if (arg.startsWith('--speed=')) {
    options.speed = parseFloat(arg.split('=')[1]) || 1;
  } else if (arg.startsWith('--port=')) {
    options.port = parseInt(arg.split('=')[1], 10) || 3456;
  } else if (arg.startsWith('--file=')) {
    options.file = arg.split('=')[1];
  }
}

if (options.help) {
  printHelp();
  process.exit(0);
}

function printHelp() {
  console.log(`
⚡ CINEMATIC HTML BUILDER CLI
Watches AI streaming HTML tokens and renders a live, animated construction preview.

USAGE:
  /cinematic-html-builder [OPTIONS]
  cinematic-html-builder [OPTIONS]

OPTIONS:
  --stream-mode=MODE    Stream mode: 'token' (default), 'chunk', or 'sse'
  --animation=PRESET    Animation preset: 'cinematic', 'cyberpunk', 'matrix', 'blueprint', 'minimal'
  --speed=FACTOR        Stream speed factor (e.g. 0.5, 1, 2, max)
  --demo                Launch interactive web preview and SSE server
  --port=PORT           Server port (default: 3456)
  --file=PATH           Stream a local HTML file
  -h, --help            Show this help manual

EXAMPLES:
  /cinematic-html-builder --stream-mode=token --animation=cinematic
  cinematic-html-builder --demo --port=3456
  cinematic-html-builder --file=examples/sample-stream.html --animation=cyberpunk
  cat page.html | cinematic-html-builder
`);
}

async function run() {
  console.log(`\n⚡ Cinematic HTML Builder [Mode: ${options.streamMode.toUpperCase()} | Preset: ${options.animation.toUpperCase()}]`);

  // If --demo or no piped stdin and no file, launch the server & preview
  const isPiped = !process.stdin.isTTY;

  if (options.demo || (!isPiped && !options.file)) {
    console.log(`> Launching Live Sandboxed Construction Environment on port ${options.port}...`);
    await startServer(options.port);
    console.log(`> Press Ctrl+C to terminate.\n`);
    return;
  }

  // CLI Headless / Stream Mode
  const metrics = new StreamMetrics();
  const extractor = new StreamingTokenExtractor();
  const parser = new StreamingHTMLParser({
    onEvent: (evt) => {
      metrics.recordMutation(evt);
      printMutationEvent(evt);
    }
  });

  if (options.file) {
    const filePath = path.resolve(process.cwd(), options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    await streamString(content, extractor, parser, metrics, options.speed);
  } else if (isPiped) {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      const extracted = extractor.feed(chunk);
      if (extracted) {
        metrics.recordChunk(extracted);
        parser.feed(extracted);
      }
    });
    process.stdin.on('end', () => {
      const trailing = extractor.flush();
      if (trailing) {
        metrics.recordChunk(trailing);
        parser.feed(trailing);
      }
      parser.end();
      metrics.complete();
      printSummary(metrics);
    });
  }
}

async function streamString(str, extractor, parser, metrics, speed) {
  let idx = 0;
  const delay = Math.max(2, Math.round(25 / speed));

  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (idx >= str.length) {
        clearInterval(timer);
        const trailing = extractor.flush();
        if (trailing) {
          metrics.recordChunk(trailing);
          parser.feed(trailing);
        }
        parser.end();
        metrics.complete();
        printSummary(metrics);
        resolve();
        return;
      }

      const chunkSize = Math.floor(Math.random() * 12) + 4;
      const chunk = str.slice(idx, idx + chunkSize);
      idx += chunkSize;

      const extracted = extractor.feed(chunk);
      if (extracted) {
        metrics.recordChunk(extracted);
        parser.feed(extracted);
      }
    }, delay);
  });
}

function printMutationEvent(evt) {
  let tag = '';
  switch (evt.type) {
    case 'node:add':
      tag = `\x1b[36m[+NODE]\x1b[0m <${evt.tag}> id:${evt.id} -> \x1b[33mscale-in + glow pulse\x1b[0m`;
      break;
    case 'attr:set':
      tag = `\x1b[33m[~ATTR]\x1b[0m ${evt.target}: ${evt.key}="${evt.value}" -> \x1b[35mpowerup flash\x1b[0m`;
      break;
    case 'text:append':
      tag = `\x1b[32m[+TEXT]\x1b[0m ${evt.target}: "${evt.text.slice(0, 24)}" -> \x1b[36mtypewriter\x1b[0m`;
      break;
    case 'node:remove':
      tag = `\x1b[31m[-NODE]\x1b[0m ${evt.target} -> \x1b[31mdissolve\x1b[0m`;
      break;
    case 'batch:complete':
      tag = `\x1b[32m[PHASE LOCKED]\x1b[0m All elements synchronized into alignment.`;
      break;
  }
  if (tag) console.log(tag);
}

function printSummary(metrics) {
  const s = metrics.getSnapshot();
  console.log(`\n======================================================`);
  console.log(`⚡ STREAM CONSTRUCTION TELEMETRY SUMMARY`);
  console.log(`======================================================`);
  console.log(`> Total Tokens:     ${s.totalTokens}`);
  console.log(`> Total Mutations:  ${s.totalMutations} operations`);
  console.log(`  - Node Additions: ${s.mutationCounts.nodeAdd}`);
  console.log(`  - Attr Changes:   ${s.mutationCounts.attrSet}`);
  console.log(`  - Text Appends:   ${s.mutationCounts.textAppend}`);
  console.log(`  - Node Removals:  ${s.mutationCounts.nodeRemove}`);
  console.log(`> Reactor Power:    ${s.reactorPower}% (MAX LEVEL)`);
  console.log(`> Elapsed Duration: ${s.elapsedSec}s`);
  console.log(`======================================================\n`);
}

run();
