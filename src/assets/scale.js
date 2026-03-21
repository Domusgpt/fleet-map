/**
 * Fleet Map — Scale System
 * =========================
 * Standardized sizing for all map assets. Balances cartographic accuracy
 * with artistic emphasis — ports can be "larger than life" while the map
 * remains functional.
 *
 * Reference canvas width: 1200px. All base sizes are defined at this width
 * and scale linearly with actual canvas dimensions.
 */

var REFERENCE_WIDTH = 1200;

/**
 * Base pixel sizes per asset category at the reference canvas width.
 * Each category has named size steps (xs → xl) for consistent hierarchy.
 */
export var SCALE = {
  vessel:  { xs: 6,  sm: 10, md: 16, lg: 24, xl: 36 },
  port:    { xs: 3,  sm: 5,  md: 8,  lg: 14 },
  marker:  { xs: 6,  sm: 8,  md: 12, lg: 18 },
  icon:    { xs: 8,  sm: 10, md: 16, lg: 24 },
  text:    { xs: 7,  sm: 9,  md: 11, lg: 14, xl: 18 },
  compass: { sm: 25, md: 35, lg: 50 },
};

/**
 * Default artistic emphasis multipliers.
 * Values > 1.0 make assets larger than strict scale for visual impact.
 * Themes can override these.
 */
export var DEFAULT_EMPHASIS = {
  vessel:  1.0,
  port:    1.5,
  marker:  1.0,
  icon:    1.0,
  text:    1.0,
  compass: 1.0,
};

/**
 * Compute the scaled pixel size for a given asset category and size step.
 *
 * @param {string} category — 'vessel', 'port', 'marker', 'icon', 'text', 'compass'
 * @param {string} size     — 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {number} canvasWidth — current canvas logical width
 * @param {number} [emphasis]  — optional multiplier (default from DEFAULT_EMPHASIS)
 * @returns {number} pixel size
 */
export function scaleFor(category, size, canvasWidth, emphasis) {
  var cat = SCALE[category];
  if (!cat) return 10;

  var base = cat[size];
  if (base === undefined) base = cat.md || 10;

  var ratio = canvasWidth / REFERENCE_WIDTH;
  var emp = (emphasis !== undefined) ? emphasis : (DEFAULT_EMPHASIS[category] || 1.0);

  return Math.max(2, Math.round(base * ratio * emp));
}

/**
 * Get the emphasis multiplier for a category, using theme overrides if available.
 *
 * @param {string} category — asset category
 * @param {object} [theme]  — theme object with optional `emphasis` overrides
 * @returns {number} multiplier
 */
export function emphasisFor(category, theme) {
  if (theme && theme.emphasis && theme.emphasis[category] !== undefined) {
    return theme.emphasis[category];
  }
  return DEFAULT_EMPHASIS[category] || 1.0;
}

/**
 * Compute a font size string for canvas ctx.font assignment.
 *
 * @param {string} size        — 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {number} canvasWidth — current canvas logical width
 * @param {string} fontFamily  — CSS font family string
 * @param {object} [theme]     — optional theme for emphasis
 * @returns {string} e.g. "11px \"Josefin Sans\", sans-serif"
 */
export function fontSpec(size, canvasWidth, fontFamily, theme) {
  var px = scaleFor('text', size, canvasWidth, emphasisFor('text', theme));
  return px + 'px ' + fontFamily;
}

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(val, min, max) {
  return val < min ? min : (val > max ? max : val);
}
