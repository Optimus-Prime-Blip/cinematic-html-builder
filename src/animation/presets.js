/**
 * Animation Theme Presets for Cinematic HTML Builder
 * Supports: cinematic (Hero Power-Up), cyberpunk, matrix, blueprint, minimal
 */

export const PRESETS = {
  cinematic: {
    name: 'Cinematic Hero Power-Up',
    themeClass: 'theme-cinematic',
    primaryColor: '#00f0ff',
    secondaryColor: '#ffd700',
    glowColor: 'rgba(0, 240, 255, 0.75)',
    pulseShadow: '0 0 25px rgba(0, 240, 255, 0.6), 0 0 50px rgba(255, 215, 0, 0.3)',
    enterEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    enterDuration: '0.45s',
    hologramDuration: '0.6s',
    typewriterSpeed: 18, // ms per char
    enableParticles: true,
    soundProfile: 'heroic-synth'
  },
  cyberpunk: {
    name: 'Cyberpunk Overdrive',
    themeClass: 'theme-cyberpunk',
    primaryColor: '#ff007f',
    secondaryColor: '#00ffff',
    glowColor: 'rgba(255, 0, 127, 0.8)',
    pulseShadow: '0 0 20px rgba(255, 0, 127, 0.7), 0 0 40px rgba(0, 255, 255, 0.5)',
    enterEasing: 'cubic-bezier(0.19, 1, 0.22, 1)',
    enterDuration: '0.35s',
    hologramDuration: '0.5s',
    typewriterSpeed: 14,
    enableParticles: true,
    soundProfile: 'cyber-glitch'
  },
  matrix: {
    name: 'Matrix Overclock',
    themeClass: 'theme-matrix',
    primaryColor: '#00ff66',
    secondaryColor: '#003311',
    glowColor: 'rgba(0, 255, 102, 0.8)',
    pulseShadow: '0 0 15px rgba(0, 255, 102, 0.8)',
    enterEasing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    enterDuration: '0.3s',
    hologramDuration: '0.45s',
    typewriterSpeed: 10,
    enableParticles: false,
    soundProfile: 'terminal-chime'
  },
  blueprint: {
    name: 'Architectural Blueprint',
    themeClass: 'theme-blueprint',
    primaryColor: '#38bdf8',
    secondaryColor: '#ffffff',
    glowColor: 'rgba(56, 189, 248, 0.6)',
    pulseShadow: '0 0 18px rgba(56, 189, 248, 0.5)',
    enterEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    enterDuration: '0.5s',
    hologramDuration: '0.7s',
    typewriterSpeed: 20,
    enableParticles: false,
    soundProfile: 'click-draft'
  },
  minimal: {
    name: 'Minimal Elegant',
    themeClass: 'theme-minimal',
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    pulseShadow: '0 4px 20px rgba(99, 102, 241, 0.2)',
    enterEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    enterDuration: '0.4s',
    hologramDuration: '0.4s',
    typewriterSpeed: 22,
    enableParticles: false,
    soundProfile: 'none'
  }
};

export function getPreset(presetName = 'cinematic') {
  return PRESETS[presetName] || PRESETS.cinematic;
}
