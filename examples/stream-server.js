/**
 * Streaming Preview & SSE Server
 * Serves the interactive cinematic demo and provides an SSE endpoint
 * streaming tokens incrementally for testing across agent environments.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3456;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const sampleHTMLPath = path.join(rootDir, 'examples', 'sample-stream.html');
const sampleHTML = fs.existsSync(sampleHTMLPath)
  ? fs.readFileSync(sampleHTMLPath, 'utf8')
  : '<div class="hero"><h1>Default Stream</h1></div>';

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // SSE Stream Endpoint: /api/stream
  if (url.pathname === '/api/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const speedParam = parseFloat(url.searchParams.get('speed') || '1');
    const delay = Math.max(5, Math.round(30 / speedParam));
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= sampleHTML.length) {
        res.write(`event: complete\ndata: ${JSON.stringify({ status: 'done', total: sampleHTML.length })}\n\n`);
        clearInterval(interval);
        res.end();
        return;
      }

      const chunkSize = Math.floor(Math.random() * 12) + 4;
      const chunk = sampleHTML.slice(idx, idx + chunkSize);
      idx += chunkSize;

      res.write(`event: token\ndata: ${JSON.stringify({ chunk, index: idx })}\n\n`);
    }, delay);

    req.on('close', () => {
      clearInterval(interval);
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(rootDir, url.pathname === '/' ? 'examples/interactive-demo.html' : url.pathname);

  // Normalize and prevent directory traversal
  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not Found: ${url.pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`\n======================================================`);
      console.log(`⚡ CINEMATIC HTML BUILDER - STREAMING SERVER ONLINE`);
      console.log(`======================================================`);
      console.log(`> Interactive Preview:  http://localhost:${port}`);
      console.log(`> SSE Token Stream:     http://localhost:${port}/api/stream`);
      console.log(`======================================================\n`);
      resolve(server);
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(PORT);
}
