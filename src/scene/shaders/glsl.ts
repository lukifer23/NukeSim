/**
 * GLSL snippets shared verbatim by several materials. Kept as strings so the
 * identical function body cannot drift between shaders.
 */
export const GLSL_HASH2 =
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }'
