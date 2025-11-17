import * as THREE from 'three';

/**
 * Manages a particle system visual effect based on audio input.
 * Simulates particles dancing on a surface, like sand on a speaker.
 */
export default class ParticleEffect {
    /**
     * @param {THREE.Scene} scene - The main Three.js scene to add particles to.
     * @param {object} options - Configuration options for the particle effect.
     * @param {number} [options.particleCount=10000] - The number of particles to create.
     * @param {number} [options.radius=5] - The radius of the circular area for particles.
     * @param {number} [options.particleSize=0.1] - The size of each particle.
     * @param {number} [options.maxKickForce=10] - Maximum upward force applied based on audio frequency.
     * @param {number} [options.gravity=-9.8] - Gravity force applied to particles.
     * @param {THREE.Color} [options.initialColor=0xffffff] - The initial color for the particles.
     */
    constructor(scene, options = {}) {
        this.scene = scene;
        // Apply defaults if options are not provided
        this.particleCount = options.particleCount || 10000000;
        this.radius = options.radius || 5; 
        this.particleSize = options.particleSize || 0.01;
        this.maxKickForce = options.maxKickForce || 10; // Controls jump height sensitivity
        this.gravity = options.gravity || -19.8;        // Controls how fast particles fall
        this.expansionSpeed = options.expansionSpeed || 2.0; // Base speed of outward movement
        // Store the initial color, default to white if not provided
        this.initialColor = options.initialColor || new THREE.Color(0xffffff); 

        this.particles = null; 
        this.geometry = null; 
        this.material = null; 

        // Array to store particle velocities (only Y-velocity needed for simple vertical jump)
        this.velocities = new Float32Array(this.particleCount); 

        this._createParticles();
    }

    /**
     * Creates the particle system geometry, material, and THREE.Points object.
     * Particles are distributed randomly within a circle on the XZ plane.
     * @private
     */
    _createParticles() {
        console.log('Creating particle effect with', this.particleCount, 'particles...');

        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3); // x, y, z

        // --- Define a small radius for initial spawn at the center ---
        const initialSpawnRadius = 1.0; // Set initial spawn radius to 1 unit

        // Initialize positions clustered at the center on the XZ plane (y=0)
        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Distribute points within the very small initial radius
            const r = initialSpawnRadius * Math.sqrt(Math.random()); 
            
            positions[i * 3] = Math.cos(angle) * r;       // x (close to 0)
            positions[i * 3 + 1] = 0;                      // y (on the plane)
            positions[i * 3 + 2] = Math.sin(angle) * r;       // z (close to 0)

            // Initialize Y velocity to 0
            this.velocities[i] = 0; 
        }
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Add velocities as a custom attribute if we move to ShaderMaterial later
        // this.geometry.setAttribute('velocity', new THREE.BufferAttribute(this.velocities, 1)); 

        this.material = new THREE.PointsMaterial({
            color: this.initialColor, // Use initial color from options
            size: this.particleSize,
            transparent: true,
            opacity: 0.8,
            // sizeAttenuation: true // Make particles smaller further away (optional)
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);

        console.log('Particle effect created and added to scene.');
    }

    /**
     * Updates the particle positions based on simulated physics (gravity)
     * and audio frequency (upward kicks and radial expansion).
     * Called in the main animation loop.
     * @param {number} deltaTime Time since the last frame.
     * @param {number} elapsedTime Total time elapsed since start.
     * @param {number} audioFrequency Current average audio frequency (typically 0-255).
     */
    update(deltaTime, elapsedTime, audioFrequency) {
        if (!this.geometry || !this.geometry.attributes.position) {
            return; // Exit if geometry is not ready
        }

        const positions = this.geometry.attributes.position.array;

        // Normalize frequency influence (0 to 1) - Adjust divisor based on testing
        const freqInfluence = Math.min(Math.max(audioFrequency / 180.0, 0), 1.0);
        const currentKickStrength = this.maxKickForce * freqInfluence;
        const kickThreshold = 0; // Only kick if frequency is somewhat significant

        // --- New parameters for radial expansion ---
        const resetRadius = this.radius * 1.5; // Radius at which particles reset to center
        const centerSpawnRadius = 0.05; // Restore respawn radius to 0.1
        const dampeningFactor = 0.98; // Slows down outward speed over time (optional, might need adjustment)
        // Pre-calculate squared spawn radius for efficiency
        const centerSpawnRadiusSq = centerSpawnRadius * centerSpawnRadius; 

        for (let i = 0; i < this.particleCount; i++) {
            const idx = i * 3;    // Base index for this particle's position (x, y, z)
            const xIdx = idx;
            const yIdx = idx + 1;
            const zIdx = idx + 2;
            const velIdx = i;     // Index for the y-velocity

            // --- Calculate distance early for use in both Y and XZ logic ---
            const x = positions[xIdx];
            const z = positions[zIdx];
            const distSq = x * x + z * z; // Use squared distance

            // --- Y-axis movement (Gravity and Kick) ---
            this.velocities[velIdx] += this.gravity * deltaTime;
            positions[yIdx] += this.velocities[velIdx] * deltaTime;

            if (positions[yIdx] <= 0) {
                positions[yIdx] = 0;
                // Apply kick ONLY if frequency is high AND particle is outside the immediate spawn center
                if (freqInfluence > kickThreshold && distSq > centerSpawnRadiusSq) { 
                    // Apply kick - add some randomness
                    this.velocities[velIdx] = currentKickStrength * (0.5 + Math.random() * 0.5);
                } else {
                    // Otherwise, ensure velocity is zero (especially for newly spawned particles in the center)
                    this.velocities[velIdx] = 0; 
                }
            }

            // --- XZ-plane movement (Radial Expansion based on Frequency) ---
            const resetRadiusSq = resetRadius * resetRadius;
            
            // Reset particle if it goes too far or randomly sometimes (to ensure center fill)
            if (distSq > resetRadiusSq || Math.random() < 0.0005) { 
                // Reset to a random position near the center
                const angle = Math.random() * Math.PI * 2;
                const r = centerSpawnRadius * Math.sqrt(Math.random()); // Even distribution near center
                positions[xIdx] = Math.cos(angle) * r;
                positions[zIdx] = Math.sin(angle) * r;
                positions[yIdx] = 0; // Ensure it starts on the ground
                this.velocities[velIdx] = 0; // Reset vertical velocity
                // Optionally reset radial velocity if we store it separately later
            } else if (distSq > 0.001 && freqInfluence > kickThreshold) { // Avoid division by zero and only expand when kicking
                const dist = Math.sqrt(distSq);
                const nx = x / dist; // Normalized direction x
                const nz = z / dist; // Normalized direction z

                // Calculate speed based on frequency, maybe less speed further out?
                // Simple model: speed proportional to frequency influence
                const currentExpansionSpeed = this.expansionSpeed * freqInfluence; 

                // Update position radially
                positions[xIdx] += nx * currentExpansionSpeed * deltaTime;
                positions[zIdx] += nz * currentExpansionSpeed * deltaTime;

                // Optional: Apply dampening to radial movement (can be complex to add velocity state)
                // This simple implementation doesn't store radial velocity, so dampening is harder.
                // For now, the reset mechanism handles particles getting too far.
            }
        }

        // Important: Mark the position attribute as needing update for Three.js
        this.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * Updates the color of the particle material.
     * @param {THREE.Color} newColor - The new color to apply.
     */
    updateColor(newColor) {
        if (this.material) {
            this.material.color.copy(newColor);
        }
    }

    /**
     * Updates particle effect properties dynamically.
     * @param {object} properties - Object with maxKickForce, gravity, expansionSpeed values
     */
    updateProperties(properties) {
        if (properties.maxKickForce !== undefined) {
            this.maxKickForce = Math.max(5, Math.min(20, properties.maxKickForce));
        }
        if (properties.gravity !== undefined) {
            this.gravity = Math.max(-25, Math.min(-10, properties.gravity));
        }
        if (properties.expansionSpeed !== undefined) {
            this.expansionSpeed = Math.max(0.5, Math.min(5, properties.expansionSpeed));
        }
    }

    /**
     * Cleans up resources when the effect is no longer needed.
     */
    dispose() {
        if (this.particles) {
            this.scene.remove(this.particles);
        }
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        // Clear the velocities array
        this.velocities = new Float32Array(0); 
        console.log('Particle effect disposed.');
    }
} 