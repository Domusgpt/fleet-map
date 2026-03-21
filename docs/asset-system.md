# Fleet Map — Asset Design System

Technical guide to the modular nautical asset system: symbols, themes, scale, rendering pipeline, and extensibility patterns.

---

## Overview

The asset system provides **53 canvas-drawn symbols** across 7 categories, **5 theme packs**, a **scale system** for responsive sizing, and a **registry** for runtime extensibility. Everything renders to HTML5 Canvas — no SVG files, no image assets, no external dependencies.

### Architecture

```
AssetRegistry           — discovers and stores symbols + themes
    ↓
AssetRenderer           — draws symbols to canvas with theme styling
    ↓ uses
Scale System            — computes pixel sizes from category + step + canvas width
    ↓ styled by
Theme Pack              — colors, fonts, emphasis, decorations, atmosphere
```

---

## Symbol Categories

### Vessels (8 symbols × 3 variants = 24 draw functions)

| ID | Type | Description |
|----|------|-------------|
| `trawler` | Trawler/Dragger | Outrigger arms, wide beam hull |
| `longliner` | Longliner | Sleek hull, trailing longline gear |
| `scalloper` | Scalloper | Broad beam, dredge booms |
| `gillnetter` | Gillnetter | Mid-size, net reel on stern |
| `lobster` | Lobster/Pot Boat | Small, nimble hull |
| `cargo` | Cargo Vessel | Large freighter, cargo holds |
| `sailboat` | Sailboat | Hull, mast, and sail |
| `generic` | Generic | Simple triangle (fallback) |

Each vessel has three draw variants:
- **`drawTopDown(ctx, size, color, t)`** — Birds-eye hull outline. Used by Tactical and Minimal themes.
- **`drawProfile(ctx, size, color, t)`** — Side-view silhouette with superstructure. Used by Classic Nautical and Treasure Map.
- **`drawIcon(ctx, size, color, t)`** — Simplified geometric pictogram. Used by Tropical theme.

### Navigation Aids (11 symbols)

| ID | Description |
|----|-------------|
| `buoy-red` | Red nun buoy (IALA-B, right returning) |
| `buoy-green` | Green can buoy (IALA-B, left returning) |
| `buoy-yellow` | Yellow special purpose buoy |
| `buoy-cardinal-n/s/e/w` | Cardinal marks (4 types) |
| `lighthouse` | Lighthouse with animated light sweep |
| `beacon` | Fixed triangular beacon |
| `daymark-triangle` | Green triangular daymark |
| `daymark-square` | Red square daymark |

### Channel Markers (5 symbols)

| ID | Description |
|----|-------------|
| `lateral-port` | Red port-side marker with number |
| `lateral-starboard` | Green starboard-side marker |
| `safe-water` | Red/white striped mid-channel mark |
| `isolated-danger` | Black with red band, danger mark |
| `special` | Yellow special purpose mark |

### Ports & Facilities (8 symbols)

| ID | Description |
|----|-------------|
| `dock` | T-shaped dock with pilings |
| `mooring` | Circular mooring buoy with ring |
| `fuel` | Fuel pump with "F" label |
| `ice-house` | Building with snowflake/ice symbol |
| `fish-market` | Building with fish icon |
| `boat-ramp` | Trapezoidal launch ramp |
| `harbor-master` | Building with flag pennant |
| `anchorage` | Classic anchor symbol |

### Weather (8 symbols)

| ID | NOAA Data Source |
|----|-----------------|
| `wind-barb` | Wind speed/direction |
| `wave-height` | Wave forecast (animated) |
| `temperature` | Sea surface temp (thermometer) |
| `storm-warning` | Marine warnings (red pennant) |
| `small-craft` | Small craft advisory (red flag) |
| `fog` | Visibility data (wavy lines, animated) |
| `rain` | Precipitation (cloud with drops) |
| `current-arrow` | Ocean current direction |

### Cartography (7 symbols)

| ID | Description |
|----|-------------|
| `depth-sounding` | Spot depth number on chart |
| `shipping-lane` | Dashed magenta traffic separation line |
| `boundary` | Dot-dash jurisdictional boundary |
| `hazard-area` | Hatched circle with danger cross |
| `fishing-ground` | Dashed circle with fish icon |
| `restricted-area` | Circle with diagonal slash |
| `anchorage-area` | Dashed circle with anchor |

### Status Overlays (6 symbols)

| ID | Description |
|----|-------------|
| `status-badge` | Rounded pill with status text |
| `catch-tag` | Pointed tag with catch species |
| `eta-display` | Clock icon + ETA readout box |
| `speed-indicator` | Arc gauge showing speed in knots |
| `captains-log` | Speech bubble (animated pulse) |
| `permission-lock` | Padlock with keyhole |

---

## Scale System

All sizes are defined at a **reference canvas width of 1200px** and scale linearly.

### Size Steps

| Category | xs | sm | md | lg | xl |
|----------|----|----|----|----|-----|
| vessel | 6 | 10 | 16 | 24 | 36 |
| port | 3 | 5 | 8 | 14 | — |
| marker | 6 | 8 | 12 | 18 | — |
| icon | 8 | 10 | 16 | 24 | — |
| text | 7 | 9 | 11 | 14 | 18 |
| compass | — | 25 | 35 | 50 | — |

### Emphasis Multipliers (per theme)

| Category | Classic | Treasure | Tactical | Minimal | Tropical |
|----------|---------|----------|----------|---------|----------|
| vessel | 1.0 | 1.2 | 0.9 | 0.85 | 1.15 |
| port | 1.5 | 2.0 | 1.0 | 1.2 | 1.8 |
| marker | 1.0 | 1.3 | 0.9 | 0.9 | 1.2 |
| compass | 1.0 | 1.5 | 0.7 | 0.6 | 1.0 |

### Usage

```js
import { scaleFor, emphasisFor, fontSpec } from './src/assets/scale.js';

var px = scaleFor('vessel', 'md', canvasWidth);        // 16px at 1200w
var px = scaleFor('port', 'lg', canvasWidth, 2.0);     // With custom emphasis
var font = fontSpec('sm', canvasWidth, '"Josefin Sans"'); // "9px ..."
```

---

## Theme System

### Theme Interface

Every theme provides:

```js
{
  id: 'theme-id',
  name: 'Display Name',
  colors: { deep, ouro, verde, blade, creme, land, ocean, ... },
  fonts: { display, sans },
  symbols: {
    vessel: { style, strokeWidth, fillAlpha, glowRadius, trailStyle },
    port: { shape, pulseSpeed, labelStyle },
    buoy: { bobAnimation, reflectionEnabled },
    weather: { iconStyle },
  },
  emphasis: { vessel, port, marker, icon, text, compass },
  atmosphere: { vignetteStrength, noiseTexture, colorFilter },
  decorations: { compassRose, cartouche, borderStyle, seaMonsters },
}
```

### Built-in Themes

| Theme | Background | Accent | Vessels | Vibe |
|-------|-----------|--------|---------|------|
| **Classic Nautical** | Deep ocean #040A10 | Gold #C9A84C | Profile silhouettes | Elegant, warm |
| **Treasure Map** | Parchment #B49B6E | Ink brown #8C5A1E | Profile (engravings) | Aged, hand-drawn |
| **Tactical** | Near-black #000400 | Phosphor green #00FF41 | Top-down outlines | CRT terminal |
| **Minimal** | Light gray #F5F7FA | Clean blue #3778C8 | Top-down clean | Modern, flat |
| **Tropical** | Deep ocean #002D5A | Sunset orange #FF8C32 | Playful icons | Beach, fun |

### Creating Custom Themes

```js
import { createTheme } from './src/assets/themes/theme.js';

var myTheme = createTheme('my-theme', 'My Theme', {
  colors: {
    deep: 'rgba(20,10,40,1)',
    ouro: 'rgba(255,100,50,1)',
  },
  symbols: {
    vessel: { style: 'topDown' },
  },
  emphasis: {
    port: 2.0,
  },
  decorations: {
    compassRose: 'minimal',
    cartouche: 'none',
  },
});
```

Only override what you need — everything else inherits from the base theme.

---

## Rendering Pipeline

### How Symbols Get Drawn

1. **FleetMap** creates a `createDefaultRegistry()` with all built-in symbols + themes
2. **AssetRenderer** is constructed with the registry, active theme, and canvas width
3. When a layer needs to draw a symbol, it calls `renderer.draw(ctx, category, id, x, y, opts)`
4. The renderer looks up the symbol, selects the correct draw variant based on theme, applies scale + emphasis, and calls the draw function

### Adding Custom Symbols

```js
// Define the symbol
var researchVessel = {
  id: 'research-vessel',
  name: 'Research Vessel',

  drawTopDown: function(ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.3, s * 0.6);
    ctx.lineTo(-s * 0.3, s * 0.6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    // Add distinctive antenna
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0, -s * 1.3);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  },

  drawProfile: function(ctx, size, color) { /* side view */ },
  drawIcon: function(ctx, size, color) { /* simplified */ },
};

// Register it
var registry = map.getRegistry();
registry.registerSymbols('vessels', { 'research-vessel': researchVessel });
```

### Label System

12 standardized text styles for consistent typography:

| Style | Font | Size | Alpha | Transform |
|-------|------|------|-------|-----------|
| `water-body` | display | lg | 0.08 | S P A C E D |
| `land-mass` | display | lg | 0.35 | S P A C E D |
| `port-name` | sans | sm | 0.65 | UPPERCASE |
| `vessel-name` | sans | xs | 0.3 | none |
| `depth-sounding` | sans | xs | 0.2 | none |
| `warning` | sans-bold | md | 0.9 | UPPERCASE |

```js
import { drawLabel } from './src/assets/text/labels.js';
drawLabel(ctx, 'port-name', 'BARNEGAT LIGHT', x, y, { w, fonts, colors });
```
