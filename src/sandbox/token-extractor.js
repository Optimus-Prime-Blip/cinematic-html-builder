/**
 * Streaming Token & Code-Block Extractor
 * Extracts HTML code blocks incrementally from AI markdown streams, or passes
 * raw HTML directly. Handles incomplete markdown fences mid-stream.
 */

export class StreamingTokenExtractor {
  /**
   * @param {Object} [options]
   * @param {(htmlChunk: string) => void} [options.onToken] - Callback for extracted HTML chunk
   */
  constructor(options = {}) {
    this.onToken = options.onToken || (() => {});
    this.buffer = '';
    this.insideCodeBlock = false;
    this.isRawHTML = false;
    this.extractedLength = 0;
  }

  reset() {
    this.buffer = '';
    this.insideCodeBlock = false;
    this.isRawHTML = false;
    this.extractedLength = 0;
  }

  /**
   * Feed a new text chunk from the AI token stream
   * @param {string} chunk
   * @returns {string} The extracted HTML tokens from this chunk
   */
  feed(chunk) {
    if (!chunk) return '';
    this.buffer += chunk;

    // Detect if the incoming stream is raw HTML or markdown
    if (!this.insideCodeBlock && !this.isRawHTML) {
      const trimmed = this.buffer.trimStart();
      if (
        trimmed.startsWith('<!DOCTYPE') ||
        trimmed.startsWith('<html') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<section') ||
        trimmed.startsWith('<main') ||
        trimmed.startsWith('<body')
      ) {
        this.isRawHTML = true;
      }
    }

    if (this.isRawHTML) {
      // Raw HTML mode: emit chunk directly
      this.extractedLength += chunk.length;
      this.onToken(chunk);
      return chunk;
    }

    // Markdown extraction mode: look for ```html ... ```
    let extracted = '';

    if (!this.insideCodeBlock) {
      const fenceMatch = /(?:```(?:html|htm|xml|svg)?\s*\n)/i.exec(this.buffer);
      if (fenceMatch) {
        this.insideCodeBlock = true;
        const startIdx = fenceMatch.index + fenceMatch[0].length;
        const remaining = this.buffer.slice(startIdx);
        this.buffer = remaining;
      }
    }

    if (this.insideCodeBlock) {
      // Check if closing fence ``` exists
      const closeIdx = this.buffer.indexOf('```');
      if (closeIdx !== -1) {
        // Stream completed this code block
        extracted = this.buffer.slice(0, closeIdx);
        this.buffer = this.buffer.slice(closeIdx + 3);
        this.insideCodeBlock = false;
      } else {
        // Still inside code block: emit available buffer, keeping last 3 chars in case of trailing `
        if (this.buffer.length > 3) {
          const safeLen = this.buffer.length - 3;
          extracted = this.buffer.slice(0, safeLen);
          this.buffer = this.buffer.slice(safeLen);
        }
      }
    }

    if (extracted) {
      this.extractedLength += extracted.length;
      this.onToken(extracted);
    }

    return extracted;
  }

  /**
   * Flush remaining buffer on stream completion
   * @returns {string}
   */
  flush() {
    let finalChunk = '';
    if (this.insideCodeBlock && this.buffer) {
      const closeIdx = this.buffer.indexOf('```');
      finalChunk = closeIdx !== -1 ? this.buffer.slice(0, closeIdx) : this.buffer;
      this.buffer = '';
      if (finalChunk) {
        this.onToken(finalChunk);
      }
    } else if (this.isRawHTML) {
      // In raw HTML mode, chunks were already emitted during feed()
      this.buffer = '';
    }
    return finalChunk;
  }
}
