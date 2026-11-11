/**
 * Stream & Parser Telemetry Metrics
 * Calculates real-time token throughput, mutation velocity, and pipeline health.
 */

export class StreamMetrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalTokens = 0;
    this.totalChunks = 0;
    this.totalBytes = 0;
    this.mutationCounts = {
      nodeAdd: 0,
      attrSet: 0,
      textAppend: 0,
      nodeRemove: 0
    };
    this.startTime = Date.now();
    this.lastChunkTime = Date.now();
    this.tokenTimestamps = []; // sliding window for tokens/sec
    this.activeTarget = 'body';
    this.activeTag = 'root';
    this.maxDepth = 0;
    this.currentDepth = 0;
    this.reactorPower = 5; // 5% baseline
  }

  recordChunk(chunk) {
    const now = Date.now();
    this.totalChunks += 1;
    this.totalBytes += chunk.length;
    // Approximate tokens (~4 characters per token average)
    const tokens = Math.max(1, Math.round(chunk.length / 4));
    this.totalTokens += tokens;
    this.lastChunkTime = now;

    for (let i = 0; i < tokens; i++) {
      this.tokenTimestamps.push(now);
    }

    // Keep timestamps from last 2000ms
    const windowStart = now - 2000;
    while (this.tokenTimestamps.length > 0 && this.tokenTimestamps[0] < windowStart) {
      this.tokenTimestamps.shift();
    }

    // Boost reactor power slightly on each chunk up to 98%
    this.reactorPower = Math.min(98, this.reactorPower + 1.2);
  }

  recordMutation(event) {
    if (!event) return;
    switch (event.type) {
      case 'node:add':
        this.mutationCounts.nodeAdd += 1;
        this.activeTag = event.tag || 'node';
        this.activeTarget = event.id || event.tag;
        this.reactorPower = Math.min(99, this.reactorPower + 2.5);
        break;
      case 'attr:set':
        this.mutationCounts.attrSet += 1;
        this.activeTarget = event.target || this.activeTarget;
        this.reactorPower = Math.min(99, this.reactorPower + 1.0);
        break;
      case 'text:append':
        this.mutationCounts.textAppend += 1;
        this.activeTarget = event.target || this.activeTarget;
        break;
      case 'node:remove':
        this.mutationCounts.nodeRemove += 1;
        break;
    }
  }

  getTokensPerSecond() {
    const now = Date.now();
    const windowStart = now - 1000;
    const recent = this.tokenTimestamps.filter(t => t >= windowStart);
    return recent.length;
  }

  getSnapshot() {
    return {
      tokensPerSec: this.getTokensPerSecond(),
      totalTokens: this.totalTokens,
      totalChunks: this.totalChunks,
      totalBytes: this.totalBytes,
      mutationCounts: { ...this.mutationCounts },
      totalMutations: this.mutationCounts.nodeAdd + this.mutationCounts.attrSet + this.mutationCounts.textAppend + this.mutationCounts.nodeRemove,
      activeTarget: this.activeTarget,
      activeTag: this.activeTag,
      reactorPower: Math.round(this.reactorPower),
      elapsedSec: ((Date.now() - this.startTime) / 1000).toFixed(1)
    };
  }

  complete() {
    this.reactorPower = 100;
  }
}
