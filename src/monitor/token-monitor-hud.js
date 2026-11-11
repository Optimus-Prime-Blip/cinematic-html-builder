/**
 * Token Monitor HUD Component
 * Renders real-time sci-fi telemetry, quantum token waveform canvas,
 * reactor power core, and DOM mutation waterfall.
 */

import { StreamMetrics } from './metrics.js';

export class TokenMonitorHUD {
  /**
   * @param {Object} options
   * @param {HTMLElement} options.container - Container to mount HUD into
   * @param {string} [options.preset='cinematic']
   * @param {Function} [options.onControlAction] - Callback for stream control actions (play, pause, speed, preset)
   */
  constructor(options = {}) {
    this.container = options.container;
    this.preset = options.preset || 'cinematic';
    this.onControlAction = options.onControlAction || (() => {});
    this.metrics = new StreamMetrics();

    this.rootEl = null;
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.logEl = null;
    this.powerFillEl = null;
    this.powerValueEl = null;
    this.targetValueEl = null;
    this.tokenPerSecEl = null;
    this.totalTokensEl = null;
    this.mutationsCountEl = null;
    this.statusLedEl = null;

    // Canvas wave state
    this.wavePhase = 0;
    this.activityEnergy = 0.2; // surges when tokens arrive
    this.particles = [];

    this._mount();
    this._startWaveAnimation();
  }

  _mount() {
    if (!this.container || typeof document === 'undefined') return;

    this.rootEl = document.createElement('div');
    this.rootEl.className = 'cinematic-hud';

    this.rootEl.innerHTML = `
      <!-- HUD Header -->
      <div class="hud-header">
        <div class="hud-title-wrap">
          <div class="hud-status-led" id="hud-led"></div>
          <h2 class="hud-title">Token Stream HUD</h2>
        </div>
        <span class="hud-version-badge">v1.0.0</span>
      </div>

      <!-- Quantum Token Waveform Canvas -->
      <div class="hud-visualizer-container">
        <div class="hud-visualizer-label">
          <span>Token Stream Telemetry</span>
          <span id="hud-elapsed">0.0s</span>
        </div>
        <canvas class="hud-visualizer-canvas" id="hud-canvas" width="340" height="80"></canvas>
      </div>

      <!-- Power Reactor Core -->
      <div class="hud-power-container">
        <div class="hud-power-header">
          <span class="hud-power-label">Core Power Surge</span>
          <span class="hud-power-value" id="hud-power-val">5%</span>
        </div>
        <div class="hud-power-track">
          <div class="hud-power-fill" id="hud-power-fill" style="width: 5%;"></div>
        </div>
      </div>

      <!-- Radar & Target Lock-On -->
      <div class="hud-target-card">
        <div class="hud-reticle-graphic">
          <div class="hud-reticle-center"></div>
        </div>
        <div class="hud-target-details">
          <div class="hud-target-label">Lock-On Target</div>
          <div class="hud-target-value" id="hud-target-val">Awaiting Stream...</div>
        </div>
      </div>

      <!-- Telemetry Metrics -->
      <div class="hud-metrics-grid">
        <div class="hud-metric-box">
          <div class="hud-metric-label">Velocity</div>
          <div class="hud-metric-number">
            <span id="hud-tokens-sec">0</span>
            <span class="hud-metric-unit">tok/s</span>
          </div>
        </div>
        <div class="hud-metric-box">
          <div class="hud-metric-label">Total Tokens</div>
          <div class="hud-metric-number">
            <span id="hud-total-tokens">0</span>
            <span class="hud-metric-unit">tok</span>
          </div>
        </div>
        <div class="hud-metric-box">
          <div class="hud-metric-label">DOM Mutations</div>
          <div class="hud-metric-number">
            <span id="hud-total-mutations">0</span>
            <span class="hud-metric-unit">ops</span>
          </div>
        </div>
        <div class="hud-metric-box">
          <div class="hud-metric-label">Parser Latency</div>
          <div class="hud-metric-number">
            <span id="hud-latency">0.4</span>
            <span class="hud-metric-unit">ms</span>
          </div>
        </div>
      </div>

      <!-- DOM Mutation Waterfall -->
      <div class="hud-waterfall-section">
        <div class="hud-waterfall-header">
          <span>DOM Mutation Waterfall</span>
          <span id="hud-mutation-summary">0 events</span>
        </div>
        <div class="hud-waterfall-log" id="hud-log"></div>
      </div>

      <!-- Interactive Controls -->
      <div class="hud-controls-toolbar">
        <div class="hud-controls-row">
          <button class="hud-btn primary" id="hud-btn-toggle">Pause</button>
          <button class="hud-btn" id="hud-btn-step">Step</button>
          <button class="hud-btn" id="hud-btn-replay">Replay</button>
        </div>
        <div class="hud-controls-row">
          <select class="hud-select" id="hud-preset-select">
            <option value="cinematic" selected>Cinematic (Hero Power-Up)</option>
            <option value="cyberpunk">Cyberpunk Overdrive</option>
            <option value="matrix">Matrix Overclock</option>
            <option value="blueprint">Architectural Blueprint</option>
            <option value="minimal">Minimal Clean</option>
          </select>
          <select class="hud-select" id="hud-speed-select" style="max-width: 90px;">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1.0x</option>
            <option value="2">2.0x</option>
            <option value="5">5.0x</option>
            <option value="max">MAX</option>
          </select>
        </div>
      </div>
    `;

    this.container.appendChild(this.rootEl);

    // Cache elements
    this.canvas = this.rootEl.querySelector('#hud-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.logEl = this.rootEl.querySelector('#hud-log');
    this.powerFillEl = this.rootEl.querySelector('#hud-power-fill');
    this.powerValueEl = this.rootEl.querySelector('#hud-power-val');
    this.targetValueEl = this.rootEl.querySelector('#hud-target-val');
    this.tokenPerSecEl = this.rootEl.querySelector('#hud-tokens-sec');
    this.totalTokensEl = this.rootEl.querySelector('#hud-total-tokens');
    this.mutationsCountEl = this.rootEl.querySelector('#hud-total-mutations');
    this.statusLedEl = this.rootEl.querySelector('#hud-led');

    this._bindControls();
  }

  _bindControls() {
    const btnToggle = this.rootEl.querySelector('#hud-btn-toggle');
    const btnStep = this.rootEl.querySelector('#hud-btn-step');
    const btnReplay = this.rootEl.querySelector('#hud-btn-replay');
    const selectPreset = this.rootEl.querySelector('#hud-preset-select');
    const selectSpeed = this.rootEl.querySelector('#hud-speed-select');

    let isPaused = false;
    btnToggle.addEventListener('click', () => {
      isPaused = !isPaused;
      btnToggle.textContent = isPaused ? 'Resume' : 'Pause';
      btnToggle.classList.toggle('primary', isPaused);
      if (this.statusLedEl) {
        this.statusLedEl.className = isPaused ? 'hud-status-led idle' : 'hud-status-led';
      }
      this.onControlAction(isPaused ? 'pause' : 'resume');
    });

    btnStep.addEventListener('click', () => {
      this.onControlAction('step');
    });

    btnReplay.addEventListener('click', () => {
      this.reset();
      this.onControlAction('replay');
    });

    selectPreset.addEventListener('change', (e) => {
      this.preset = e.target.value;
      this.onControlAction('preset', e.target.value);
    });

    selectSpeed.addEventListener('change', (e) => {
      this.onControlAction('speed', e.target.value);
    });
  }

  recordChunk(chunk) {
    this.metrics.recordChunk(chunk);
    this.activityEnergy = Math.min(2.5, this.activityEnergy + 0.35);
    this._spawnParticles(3);
    this._updateUI();
  }

  recordMutation(event) {
    this.metrics.recordMutation(event);
    this.activityEnergy = Math.min(3.0, this.activityEnergy + 0.5);
    this._spawnParticles(5);
    this._appendLog(event);
    this._updateUI();
  }

  complete() {
    this.metrics.complete();
    if (this.statusLedEl) {
      this.statusLedEl.className = 'hud-status-led done';
    }
    this._updateUI();
  }

  reset() {
    this.metrics.reset();
    if (this.logEl) this.logEl.innerHTML = '';
    if (this.statusLedEl) this.statusLedEl.className = 'hud-status-led';
    this.activityEnergy = 0.2;
    this._updateUI();
  }

  _appendLog(event) {
    if (!this.logEl) return;

    const row = document.createElement('div');
    row.className = 'hud-log-row';

    let badgeClass = 'node-add';
    let badgeText = '+NODE';
    let detail = '';

    switch (event.type) {
      case 'node:add':
        badgeClass = 'node-add';
        badgeText = `+${(event.tag || 'NODE').toUpperCase()}`;
        detail = `<${event.tag}> id:${event.id || 'gen'} [scale-in + glow]`;
        break;
      case 'attr:set':
        badgeClass = 'attr-set';
        badgeText = '~ATTR';
        detail = `${event.key}="${event.value}" [power-up flash]`;
        break;
      case 'text:append':
        badgeClass = 'text-append';
        badgeText = '+TEXT';
        detail = `"${(event.text || '').slice(0, 20)}..." (${event.text?.length || 0}c) [typewriter]`;
        break;
      case 'node:remove':
        badgeClass = 'node-remove';
        badgeText = '-NODE';
        detail = `id:${event.target} [dissolve]`;
        break;
    }

    const timeStr = new Date().toLocaleTimeString().split(' ')[0];

    row.innerHTML = `
      <span class="hud-badge ${badgeClass}">${badgeText}</span>
      <span class="hud-log-text">${escapeHTML(detail)}</span>
      <span class="hud-log-time">${timeStr}</span>
    `;

    this.logEl.appendChild(row);
    this.logEl.scrollTop = this.logEl.scrollHeight;

    // Prune excessive rows to maintain 60fps
    while (this.logEl.children.length > 50) {
      this.logEl.removeChild(this.logEl.firstChild);
    }
  }

  _updateUI() {
    const snap = this.metrics.getSnapshot();

    if (this.powerFillEl) this.powerFillEl.style.width = `${snap.reactorPower}%`;
    if (this.powerValueEl) this.powerValueEl.textContent = `${snap.reactorPower}%`;
    if (this.tokenPerSecEl) this.tokenPerSecEl.textContent = snap.tokensPerSec;
    if (this.totalTokensEl) this.totalTokensEl.textContent = snap.totalTokens;
    if (this.mutationsCountEl) this.mutationsCountEl.textContent = snap.totalMutations;
    if (this.targetValueEl) this.targetValueEl.textContent = `<${snap.activeTag}> #${snap.activeTarget}`;

    const summaryEl = this.rootEl?.querySelector('#hud-mutation-summary');
    if (summaryEl) summaryEl.textContent = `${snap.totalMutations} events`;

    const elapsedEl = this.rootEl?.querySelector('#hud-elapsed');
    if (elapsedEl) elapsedEl.textContent = `${snap.elapsedSec}s`;
  }

  _spawnParticles(count) {
    if (!this.canvas) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        life: 1.0,
        color: Math.random() > 0.4 ? '#00f0ff' : '#ffd700'
      });
    }
    if (this.particles.length > 60) {
      this.particles.splice(0, this.particles.length - 60);
    }
  }

  _startWaveAnimation() {
    const render = () => {
      if (this.ctx && this.canvas) {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = 'rgba(4, 8, 16, 0.35)';
        this.ctx.fillRect(0, 0, width, height);

        // Draw center reference grid line
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();

        // Draw primary frequency waveform
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00f0ff';

        const centerY = height / 2;
        const amplitude = Math.min(30, 8 + this.activityEnergy * 14);

        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const y = centerY + Math.sin(normX * 12 + this.wavePhase) * amplitude
                            * Math.sin(normX * Math.PI); // taper ends
          if (x === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // Secondary harmonic wave
        this.ctx.beginPath();
        this.ctx.lineWidth = 1.2;
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.shadowColor = '#ffd700';
        for (let x = 0; x < width; x += 2) {
          const normX = x / width;
          const y = centerY + Math.cos(normX * 18 - this.wavePhase * 1.5) * (amplitude * 0.6)
                            * Math.sin(normX * Math.PI);
          if (x === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();

        // Render particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.03;

          if (p.life <= 0) {
            this.particles.splice(i, 1);
            continue;
          }

          this.ctx.fillStyle = p.color;
          this.ctx.shadowColor = p.color;
          this.ctx.shadowBlur = 6;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, 1.5 * p.life, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;

        // Progress wave phase
        this.wavePhase += 0.08 + this.activityEnergy * 0.04;
        // Decay activity energy slowly towards idle
        this.activityEnergy = Math.max(0.15, this.activityEnergy * 0.96);
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.rootEl && this.rootEl.parentNode) {
      this.rootEl.parentNode.removeChild(this.rootEl);
    }
  }
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
