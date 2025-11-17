import * as THREE from 'three';

/**
 * Creates a mathematical equation rain effect with TSU-related formulas flowing upward.
 * Displays energy-based model equations, Gibbs sampling formulas, and TSU concepts.
 * Inspired by Extropic's TSU (Thermodynamic Sampling Unit) research.
 */
export default class CodeRainEffect {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Configuration options
        this.columnCount = options.columnCount || 50;
        this.speed = options.speed || 0.5;
        // Mathematical equations and symbols for TSU visualization
        this.mathEquations = [
            'E(x) = -β(Σbᵢxᵢ + Σwᵢⱼxᵢxⱼ)',
            'P(x) ∝ e^(-E(x))',
            'γᵢ = 2(bᵢ + Σwᵢⱼxⱼ)',
            'σ(γ) = 1/(1+e^(-γ))',
            'β = 1/T',
            'Z = Σe^(-E(x))',
            'Gibbs Sampling',
            'Energy-Based Model',
            'TSU',
            'Pbit',
            'Bernoulli',
            'E(x₀,x₁)',
            'wᵢⱼ',
            'bᵢ',
            'xᵢ ∈ {-1,+1}',
            'DTM',
            'Denoising',
            'Thermodynamic',
            'Σᵢ',
            'Σⱼ',
            'e^(-E)',
            'P(x|neighbors)',
            'Block Gibbs',
            'Bipartite',
            'PGM',
            'EBM'
        ];
        
        // Mathematical symbols
        this.characters = '0123456789+-=()[]{}Σ∝βγσ∈';
        
        this.particles = null;
        this.particleSystem = null;
        this.particlePositions = [];
        this.particleVelocities = [];
        this.particleTexts = [];
        this.particleOpacities = [];
        
        this._createParticleSystem();
    }
    
    /**
     * Creates the particle system for code rain.
     * @private
     */
    _createParticleSystem() {
        const particleCount = this.columnCount;
        const geometry = new THREE.BufferGeometry();
        
        // Initialize arrays
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);
        
        // Create canvas for text rendering
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create sprite material with text
        const texture = this._createTextTexture(ctx, canvas);
        const material = new THREE.PointsMaterial({
            size: 0.5,
            map: texture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });
        
        // Initialize particle positions (spread across screen width, start at bottom)
        const aspect = window.innerWidth / window.innerHeight;
        const cameraDistance = 20;
        const visibleWidth = Math.tan(THREE.MathUtils.degToRad(45) / 2) * cameraDistance * 2 * aspect;
        const visibleHeight = Math.tan(THREE.MathUtils.degToRad(45) / 2) * cameraDistance * 2;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position particles across screen width, starting at various heights
            const x = (i / particleCount - 0.5) * visibleWidth;
            const y = (Math.random() - 0.5) * visibleHeight * 2; // Start at random heights
            const z = -cameraDistance;
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            
            // Green-cyan color for math equations (TSU theme)
            const colorIntensity = 0.4 + Math.random() * 0.6;
            colors[i3] = 0; // R
            colors[i3 + 1] = colorIntensity; // G (green for math)
            colors[i3 + 2] = colorIntensity * 0.9; // B (cyan tint)
            
            const text = this._getRandomCodeText();
            const isEquation = text.length > 3;
            
            // Larger size for equations, smaller for symbols
            sizes[i] = isEquation ? 0.5 + Math.random() * 0.3 : 0.3 + Math.random() * 0.2;
            opacities[i] = 0.6 + Math.random() * 0.4;
            
            // Store particle data
            this.particlePositions.push(new THREE.Vector3(x, y, z));
            this.particleVelocities.push(0.4 + Math.random() * 0.6);
            this.particleTexts.push(text);
            this.particleOpacities.push(opacities[i]);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.particleSystem.visible = false; // Hidden by default
        this.scene.add(this.particleSystem);
        
        this.particles = this.particleSystem;
    }
    
    /**
     * Gets a random mathematical equation or symbol.
     * @private
     */
    _getRandomCodeText() {
        // 80% chance of showing a full equation, 20% chance of a symbol
        if (Math.random() > 0.2) {
            return this.mathEquations[Math.floor(Math.random() * this.mathEquations.length)];
        }
        return this.characters[Math.floor(Math.random() * this.characters.length)];
    }
    
    /**
     * Updates the code rain animation.
     * @param {number} deltaTime - Time since last frame
     * @param {number} elapsedTime - Total elapsed time
     * @param {object} audioData - Audio frequency data (optional)
     */
    update(deltaTime, elapsedTime, audioData = {}) {
        if (!this.particleSystem || !this.particleSystem.visible) return;
        
        const positions = this.particleSystem.geometry.attributes.position.array;
        const opacities = this.particleSystem.geometry.attributes.opacity.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        
        const aspect = window.innerWidth / window.innerHeight;
        const cameraDistance = 20;
        const visibleHeight = Math.tan(THREE.MathUtils.degToRad(45) / 2) * cameraDistance * 2;
        
        // React to audio if available
        const audioMultiplier = audioData.frequency ? 1 + audioData.frequency * 0.5 : 1;
        
        for (let i = 0; i < this.particlePositions.length; i++) {
            const i3 = i * 3;
            
            // Move particle upward
            this.particlePositions[i].y += this.particleVelocities[i] * this.speed * deltaTime * audioMultiplier;
            
            // Reset particle when it goes off screen
            if (this.particlePositions[i].y > visibleHeight / 2 + 5) {
                this.particlePositions[i].y = -visibleHeight / 2 - 5;
                this.particleTexts[i] = this._getRandomCodeText();
                this.particleVelocities[i] = 0.3 + Math.random() * 0.7;
                this.particleOpacities[i] = Math.random();
            }
            
            // Update position
            positions[i3] = this.particlePositions[i].x;
            positions[i3 + 1] = this.particlePositions[i].y;
            positions[i3 + 2] = this.particlePositions[i].z;
            
            // Fade effect (brighter at top, dimmer at bottom)
            const normalizedY = (this.particlePositions[i].y + visibleHeight / 2) / visibleHeight;
            opacities[i] = Math.max(0.1, Math.min(1, normalizedY * this.particleOpacities[i]));
            
            // Size variation - equations are larger, symbols smaller
            const isEquation = this.particleTexts[i] && this.particleTexts[i].length > 3;
            const baseSize = isEquation ? 0.5 : 0.3;
            sizes[i] = baseSize + Math.sin(elapsedTime + i) * 0.15;
        }
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
    }
    
    /**
     * Sets the color of the code rain.
     * @param {object} color - RGB color object {red, green, blue}
     */
    setColor(color) {
        if (!this.particleSystem) return;
        
        const colors = this.particleSystem.geometry.attributes.color.array;
        
        for (let i = 0; i < this.particlePositions.length; i++) {
            const i3 = i * 3;
            const intensity = 0.3 + Math.random() * 0.7;
            
            colors[i3] = color.red * intensity;
            colors[i3 + 1] = color.green * intensity;
            colors[i3 + 2] = color.blue * intensity;
        }
        
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
    }
    
    /**
     * Cleans up resources.
     */
    dispose() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
            this.particleSystem.geometry.dispose();
            this.particleSystem.material.dispose();
            this.particleSystem = null;
        }
    }
}

