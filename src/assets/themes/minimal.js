/**
 * Fleet Map — Minimal Theme
 * ============================
 * Clean, modern, flat design. Light background, thin lines,
 * system font stack, no gradients, subtle animations.
 * Dialed-down and cool.
 *
 * Vessel style: topDown (clean hull outlines)
 */

import { createTheme } from './theme.js';

export var MINIMAL = createTheme('minimal', 'Minimal', {
  colors: {
    deep:      'rgba(245,247,250,1)',           // Light gray-white background
    ouro:      'rgba(55,120,200,1)',            // Clean blue accent
    verde:     'rgba(40,180,120,1)',            // Teal green
    blade:     'rgba(120,140,160,1)',           // Muted steel
    creme:     'rgba(30,40,55,1)',              // Dark text on light bg
    land:      ['rgba(228,232,238,0.8)', 'rgba(235,238,243,0.6)', 'rgba(240,242,246,0.5)'],
    ocean:     ['rgba(220,230,245,0.2)', 'rgba(230,238,250,0.1)', 'rgba(245,247,250,0.05)'],
    fathom:    'rgba(180,195,215,0.15)',
    grid:      'rgba(120,140,160,0.05)',
    coastGlow: 'rgba(120,140,160,0.04)',
    coastLine: 'rgba(120,140,160,0.3)',
  },

  fonts: {
    display: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    sans:    '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  symbols: {
    vessel: {
      style: 'topDown',
      strokeWidth: 0.8,
      fillAlpha: 0.85,
      glowRadius: 0,            // No glow — clean and flat
      trailStyle: 'dotted',
    },
    port: {
      shape: 'dock',
      pulseSpeed: 0,            // No pulse — static dots
      labelStyle: 'upper',
    },
    buoy: {
      bobAnimation: false,
      reflectionEnabled: false,
    },
    weather: {
      iconStyle: 'outlined',
    },
  },

  emphasis: {
    vessel:  0.85,
    port:    1.2,
    marker:  0.9,
    icon:    0.9,
    text:    0.95,
    compass: 0.6,               // Small unobtrusive compass
  },

  atmosphere: {
    vignetteStrength: 0,        // No vignette
    noiseTexture: false,
    colorFilter: null,
  },

  decorations: {
    compassRose: 'minimal',     // Just a thin ring + N indicator
    cartouche: 'none',
    borderStyle: 'none',
    seaMonsters: false,
  },
});
