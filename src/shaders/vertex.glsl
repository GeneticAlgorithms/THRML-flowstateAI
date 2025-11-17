// Uniforms passed from JavaScript
uniform float u_time;      // Elapsed time for animations
uniform float u_frequency; // Average audio frequency for displacement

// --- Perlin Noise Functions (Classic Perlin 3D - periodic variant) ---
// Based on Stefan Gustavson's and Ian McEwan's GLSL implementation
// Source: https://github.com/ashima/webgl-noise

// Modulo 289
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

// Permutation function
vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 10.0) * x);
}

// Taylor inverse square root approximation
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

// Fade function (quintic polynomial)
vec3 fade(vec3 t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Classic Perlin noise function (3D, periodic)
float pnoise(vec3 P, vec3 rep) {
  // Calculate integer and fractional parts of P, considering the period `rep`
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0

  // Calculate indices for the 8 cube corners
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  // Permute indices to get pseudorandom gradient indices
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  // Calculate gradient vectors (from hashed indices)
  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  // Pack gradients into vec3s
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  // Normalize gradients
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  // Calculate noise contributions from each of the 8 corners
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  // Interpolate contributions using the fade curve
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);

  // Scale the result to a potentially more useful range
  return 2.2 * n_xyz;
}

// --- Main Vertex Shader Logic ---
void main() {
    // Calculate Perlin noise based on vertex position offset by time.
    // The `vec3(10.0)` defines the period for the noise function, making it tile.
    float noise = 3.0 * pnoise(position + u_time, vec3(10.0));

    // Calculate displacement amount based on audio frequency and noise
    float displacement = 0.0;
    // Only apply displacement if frequency is positive to avoid issues
    if (u_frequency > 0.0) {
      // Normalize frequency: map the raw frequency value (0-255ish) to a smaller range (e.g., 0-1 or 0-2).
      // Clamping prevents extreme values if audio data is unusual.
      // The divisor (30.0) acts as a sensitivity control.
      float normalized_freq = clamp(u_frequency / 30.0, 0.0, 2.0); // Allow frequency to amplify up to 2x
      
      // Noise value is roughly in the range [-2.2*3, 2.2*3]. Normalize or scale as needed.
      // Here, we simply use the noise value directly after scaling.
      // Consider mapping `noise` to a specific range like [0, 1] or [-1, 1] if needed for predictability.
      // float normalized_noise = (noise / (2.2 * 3.0)) * 0.5 + 0.5; // Example: map to [0, 1]
      
      // Combine normalized frequency and noise. Adjust the final multiplier (3.0) for visual intensity.
      displacement = normalized_freq * noise * 0.5; // Make it less sensitive than before
    }
    
    // Calculate the new vertex position by moving it along its normal vector
    vec3 newPosition = position + normal * displacement;
    
    // Standard Three.js transformation: calculate final screen position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
} 