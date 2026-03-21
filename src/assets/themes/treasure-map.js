/**
 * Fleet Map — Treasure Map Theme
 * =================================
 * Old parchment feel, hand-drawn wobbly lines, aged serif fonts,
 * sea monster decorations, compass rose with fleur-de-lis,
 * "Here Be Dragons" style labels, stained atmosphere overlay.
 *
 * Vessel style: profile (side-view — old ship engravings)
 */

import { createTheme } from './theme.js';

export var TREASURE_MAP = createTheme('treasure-map', 'Treasure Map', {
  colors: {
    deep:      'rgba(180,155,110,1)',           // Parchment base
    ouro:      'rgba(140,90,30,1)',             // Dark ink brown
    verde:     'rgba(60,90,50,1)',              // Aged green ink
    blade:     'rgba(100,80,60,1)',             // Faded brown
    creme:     'rgba(50,35,20,1)',              // Dark ink for text
    land:      ['rgba(160,140,100,0.7)', 'rgba(170,150,110,0.6)', 'rgba(150,130,95,0.5)'],
    ocean:     ['rgba(165,145,105,0.15)', 'rgba(170,150,115,0.1)', 'rgba(180,155,110,0.05)'],
    fathom:    'rgba(100,80,55,0.15)',
    grid:      'rgba(120,95,60,0.06)',
    coastGlow: 'rgba(140,90,30,0.1)',
    coastLine: 'rgba(80,55,25,0.6)',
  },

  fonts: {
    display: '"Playfair Display", "Garamond", Georgia, serif',
    sans:    '"IM Fell English", "Palatino", serif',  // Even sans uses a serif for old map feel
  },

  symbols: {
    vessel: {
      style: 'profile',
      strokeWidth: 1.0,         // Thicker lines like ink drawings
      fillAlpha: 0.75,
      glowRadius: 0,            // No modern glow effects
      trailStyle: 'dotted',     // Dotted wake like old charts
    },
    port: {
      shape: 'anchorage',       // Anchor symbol for ports
      pulseSpeed: 0,            // No pulse animation (static like a drawn map)
      labelStyle: 'upper',
    },
    buoy: {
      bobAnimation: false,      // Static
      reflectionEnabled: false,
    },
    weather: {
      iconStyle: 'hand-drawn',
    },
  },

  emphasis: {
    vessel:  1.2,               // Slightly larger ships (like old map illustrations)
    port:    2.0,               // Large, prominent port markers
    marker:  1.3,
    icon:    1.2,
    text:    1.1,
    compass: 1.5,               // Big ornate compass rose
  },

  atmosphere: {
    vignetteStrength: 0.8,      // Heavy edge darkening
    noiseTexture: true,         // Paper grain texture
    colorFilter: 'sepia',       // Aged coloring
  },

  decorations: {
    compassRose: 'ornate',      // Fleur-de-lis style
    cartouche: 'scroll',        // Decorative scroll border
    borderStyle: 'rope',        // Rope-style border
    seaMonsters: true,          // "Here Be Dragons" decorations
  },
});
