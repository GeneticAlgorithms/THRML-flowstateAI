// Uniforms passed from JavaScript (controlled by GUI)
uniform float u_red;   // Red color component (0.0 to 1.0)
uniform float u_green; // Green color component (0.0 to 1.0)
uniform float u_blue;  // Blue color component (0.0 to 1.0)

// --- Main Fragment Shader Logic ---
void main() {
    // Set the final color of the fragment (pixel).
    // Constructs a vec3 color from the uniforms and sets alpha to 1.0 (fully opaque).
    gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1.0);
} 