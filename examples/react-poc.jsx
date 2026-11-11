/**
 * Proof of Concept: React Integration
 * Baseline hook from prompt extended with full pipeable-dom & diff-dom-streaming event handling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { StreamingHTMLParser } from '../src/parser/stream-parser.js';
import { AnimationEngine } from '../src/animation/animation-engine.js';
import { SandboxedIframeShell } from '../src/sandbox/iframe-shell.js';

/**
 * Baseline Naive React Hook (from the specification prompt)
 * Demonstrates the animation primitive (scale-in from 0.8 to 1 on requestAnimationFrame)
 */
export function NaiveStreamingPreview({ htmlChunks }) {
  const containerRef = useRef(null);
  const mountedNodes = useRef(new Set());

  useEffect(() => {
    const parser = new DOMParser();
    const lastChunk = htmlChunks[htmlChunks.length - 1] || '';
    const doc = parser.parseFromString(lastChunk, 'text/html');

    doc.body.childNodes.forEach((node) => {
      if (node.nodeType === 1 && !mountedNodes.current.has(node.outerHTML)) {
        mountedNodes.current.add(node.outerHTML);
        const el = node.cloneNode(true);
        el.style.opacity = '0';
        el.style.transform = 'scale(0.8)';
        containerRef.current.appendChild(el);

        requestAnimationFrame(() => {
          el.style.transition =
            'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          el.style.opacity = '1';
          el.style.transform = 'scale(1)';
        });
      }
    });
  }, [htmlChunks]);

  return <div ref={containerRef} className="cinematic-preview-container" />;
}

/**
 * Production-Grade Cinematic Hook
 * Consumes incremental token stream, handles attribute mutations, text streaming,
 * and node removals inside a sandboxed iframe with complete hero power-up visuals.
 */
export function useCinematicStreamingHTML({
  preset = 'cinematic',
  onMetric = () => {}
}) {
  const containerRef = useRef(null);
  const shellRef = useRef(null);
  const parserRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Sandboxed Iframe Shell (sandbox="allow-scripts")
    const shell = new SandboxedIframeShell({
      container: containerRef.current,
      preset
    });
    shellRef.current = shell;

    // 2. Initialize Streaming Parser emitting structured DOM events
    const parser = new StreamingHTMLParser({
      onEvent: (event) => {
        if (shell.getTunnel()) {
          shell.getTunnel().sendMutation(event);
        }
        onMetric(event);
      }
    });
    parserRef.current = parser;

    return () => {
      shell.destroy();
    };
  }, [preset]);

  const feedChunk = (tokenChunk) => {
    if (parserRef.current) {
      parserRef.current.feed(tokenChunk);
    }
  };

  const finishStream = () => {
    if (parserRef.current) {
      parserRef.current.end();
    }
  };

  const resetStream = () => {
    if (parserRef.current) parserRef.current.reset();
    if (shellRef.current && shellRef.current.getTunnel()) {
      shellRef.current.getTunnel().reset();
    }
  };

  return {
    containerRef,
    feedChunk,
    finishStream,
    resetStream
  };
}

/**
 * Complete React Component Example
 */
export function CinematicStreamingView({
  tokenStream,
  preset = 'cinematic'
}) {
  const { containerRef, feedChunk, finishStream } = useCinematicStreamingHTML({ preset });

  useEffect(() => {
    if (!tokenStream) return;
    feedChunk(tokenStream);
  }, [tokenStream]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '600px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid rgba(0, 240, 255, 0.3)'
      }}
    />
  );
}
