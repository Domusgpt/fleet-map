/**
 * Fleet Map — Tropical Fun Theme
 * =================================
 * Bright ocean blue background, coral/teal/sunset accents,
 * rounded playful icons, palm tree decorations, wave-pattern
 * borders, fun beach-vibe typography.
 *
 * Vessel style: icon (simplified colorful pictograms)
 */

import { createTheme } from './theme.js';

export var TROPICAL = createTheme('tropical', 'Tropical', {
  colors: {
    deep:      'rgba(0,45,90,1)',               // Deep tropical ocean
    ouro:      'rgba(255,140,50,1)',            // Sunset orange
    verde:     'rgba(0,200,150,1)',             // Tropical teal
    blade:     'rgba(100,200,255,1)',           // Sky blue
    creme:     'rgba(255,250,240,1)',           // Warm white
    land:      ['rgba(50,180,100,0.7)', 'rgba(60,200,120,0.6)', 'rgba(40,160,90,0.5)'],
    ocean:     ['rgba(0,80,160,0.25)', 'rgba(0,60,130,0.15)', 'rgba(0,45,90,0.05)'],
    fathom:    'rgba(0,150,200,0.12)',
    grid:      'rgba(255,140,50,0.04)',
    coastGlow: 'rgba(255,200,80,0.1)',
    coastLine: 'rgba(255,200,80,0.4)',
  },

  fonts: {
    display: '"Fredoka One", "Comic Sans MS", cursive, sans-serif',
    sans:    '"Nunito", "Verdana", sans-serif',
  },

  symbols: {
    vessel: {
      style: 'icon',            // Simplified playful pictograms
      strokeWidth: 0,
      fillAlpha: 0.95,
      glowRadius: 25,
      trailStyle: 'dotted',     // Fun dotted trail
    },
    port: {
      shape: 'dock',
      pulseSpeed: 1.5,          // Gentle pulse
      labelStyle: 'upper',
    },
    buoy: {
      bobAnimation: true,       // Bouncy buoys
      reflectionEnabled: false,
    },
    weather: {
      iconStyle: 'filled',      // Bright filled icons
    },
  },

  emphasis: {
    vessel:  1.15,              // Slightly larger, playful
    port:    1.8,               // Big friendly port markers
    marker:  1.2,
    icon:    1.2,
    text:    1.05,
    compass: 1.0,
  },

  atmosphere: {
    vignetteStrength: 0.2,      // Light vignette
    noiseTexture: false,
    colorFilter: null,
  },

  decorations: {
    compassRose: 'classic',     // Standard but colorful
    cartouche: 'ribbon',        // Fun ribbon banner
    borderStyle: 'none',        // Clean edges
    seaMonsters: false,
  },
});
