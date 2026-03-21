/**
 * Fleet Map — Tactical / Military Theme
 * ========================================
 * CRT terminal aesthetic — submarine or battleship bridge display.
 * Green or amber phosphor monochrome, monospace font, mil-spec
 * symbols, grid-heavy, CRT scanline overlay, no decorative elements.
 *
 * Vessel style: topDown (birds-eye mil-spec hull outlines)
 */

import { createTheme } from './theme.js';

export var TACTICAL = createTheme('tactical', 'Tactical', {
  colors: {
    deep:      'rgba(0,4,0,1)',                 // Near-black
    ouro:      'rgba(0,255,65,1)',              // Phosphor green
    verde:     'rgba(0,200,50,1)',              // Bright green
    blade:     'rgba(0,180,45,0.7)',            // Mid green
    creme:     'rgba(0,255,65,0.9)',            // Text green
    land:      ['rgba(0,30,5,0.7)', 'rgba(0,40,8,0.5)', 'rgba(0,25,4,0.4)'],
    ocean:     ['rgba(0,15,3,0.3)', 'rgba(0,10,2,0.15)', 'rgba(0,4,0,0.05)'],
    fathom:    'rgba(0,100,25,0.15)',
    grid:      'rgba(0,255,65,0.06)',
    coastGlow: 'rgba(0,255,65,0.05)',
    coastLine: 'rgba(0,255,65,0.5)',
  },

  fonts: {
    display: '"Courier New", "Lucida Console", monospace',
    sans:    '"Courier New", "Lucida Console", monospace',
  },

  symbols: {
    vessel: {
      style: 'topDown',         // Military top-down hull outlines
      strokeWidth: 1.2,
      fillAlpha: 0.7,
      glowRadius: 20,
      trailStyle: 'line',
    },
    port: {
      shape: 'dock',
      pulseSpeed: 4.0,          // Faster radar-like pulse
      labelStyle: 'upper',
    },
    buoy: {
      bobAnimation: false,      // No bob — rigid tactical display
      reflectionEnabled: false,
    },
    weather: {
      iconStyle: 'outlined',    // Wire-frame style
    },
  },

  emphasis: {
    vessel:  0.9,               // Slightly smaller, tighter symbols
    port:    1.0,               // Functional sizing
    marker:  0.9,
    icon:    0.9,
    text:    0.9,
    compass: 0.7,               // Small utilitarian compass
  },

  atmosphere: {
    vignetteStrength: 0.3,      // Subtle CRT edge fade
    noiseTexture: false,
    colorFilter: 'crt-green',   // CRT phosphor effect + scanlines
  },

  decorations: {
    compassRose: 'tactical',    // Simple crosshair + degree ring
    cartouche: 'none',          // No decorative frame
    borderStyle: 'scanline',    // CRT scanline border effect
    seaMonsters: false,
  },
});
