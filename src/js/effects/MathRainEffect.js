import * as THREE from 'three';

/**
 * Mathematical Equation Rain Effect
 * Displays TSU-related mathematical equations flowing upward from the bottom.
 * Uses sprites with text rendering for actual equation display.
 */
export default class MathRainEffect {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Configuration options
        this.columnCount = options.columnCount || 30; // Fewer columns for readability
        this.speed = options.speed || 0.4;
        
        // Mathematical equations from Extropic TSU research
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
        
        this.sprites = [];
        this.spriteObjects = [];
        this.spriteVelocities = [];
        
        this._createSpriteSystem();
    }
    
    /**
     * Creates sprite system with text rendering.
     * @private
     */
    _createSpriteSystem() {
        const aspect = window.innerWidth / window.innerHeight;
        const cameraDistance = 20;
        const visibleWidth = Math.tan(THREE.MathUtils.degToRad(45) / 2) * cameraDistance * 2 * aspect;
        const visibleHeight = Math.tan(THREE.MathUtils.degToRad(45) / 2) * cameraDistance * 2;
        
        for (let i = 0; i < this.columnCount; i++) {
            const equation = this._getRandomEquation();
            const sprite = this._createTextSprite(equation);
            
            const x = (i / this.columnCount - 0.5) * visibleWidth;
            const y = (Math.random() - 0.5) * visibleHeight * 2;
            const z = -cameraDistance;
            
            sprite.position.set(x, y, z);
            sprite.userData.velocity = 0.3 + Math.random() * 0.5;
            sprite.userData.startY = y;
            sprite.userData.text = equation; // Store text for color updates
            
            this.scene.add(sprite);
            this.spriteObjects.push(sprite);
            this.spriteVelocities.push(sprite.userData.velocity);
        }
    }
    
    /**
     * Creates a text sprite for an equation.
     * @param {string} text - Equation text
     * @returns {THREE.Sprite}
     * @private
     */
    _createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size based on text length
        canvas.width = Math.max(256, text.length * 20);
        canvas.height = 64;
        
        // Clear canvas
        context.fillStyle = 'rgba(0, 0, 0, 0)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw text
        context.fillStyle = '#00ff00';
        context.font = 'bold 24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // Create sprite material
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1.5, 0.4, 1);
        
        return sprite;
    }
    
    /**
     * Gets a random mathematical equation.
     * @returns {string}
     * @private
     */
    _getRandomEquation() {
        return this.mathEquations[Math.floor(Math.random() * this.mathEquations.length)];
    }
    
    /**
     * Updates the math rain animation.
     * @param {number} deltaTime - Time since last frame
     * @param {number} elapsedTime - Total elapsed time
     * @param {object} audioData - Audio frequency data (optional)
     */
    update(deltaTime, elapsedTime, audioData = {}) {
        if (!this.spriteObjects.length) return;
        
        const aspect = window.innerWidth / window.innerHeight;
        const cameraDistance = 20;
        const visibleHeight = Math.tan(THREE.MathUtils.degToRad(45) / 2) * cameraDistance * 2;
        
        // React to audio if available
        const audioMultiplier = audioData.frequency ? 1 + audioData.frequency * 0.5 : 1;
        
        for (let i = 0; i < this.spriteObjects.length; i++) {
            const sprite = this.spriteObjects[i];
            
            // Move sprite upward
            sprite.position.y += sprite.userData.velocity * this.speed * deltaTime * audioMultiplier;
            
            // Reset sprite when it goes off screen
            if (sprite.position.y > visibleHeight / 2 + 5) {
                sprite.position.y = -visibleHeight / 2 - 5;
                
                // Update text with new random equation
                const newText = this._getRandomEquation();
                const newSprite = this._createTextSprite(newText);
                newSprite.position.set(sprite.position.x, sprite.position.y, sprite.position.z);
                newSprite.userData.velocity = sprite.userData.velocity;
                newSprite.userData.text = newText;
                
                // Replace old sprite
                this.scene.remove(sprite);
                if (sprite.material.map) {
                    sprite.material.map.dispose();
                }
                sprite.material.dispose();
                
                this.scene.add(newSprite);
                this.spriteObjects[i] = newSprite;
            }
            
            // Fade effect based on position
            const normalizedY = (sprite.position.y + visibleHeight / 2) / visibleHeight;
            sprite.material.opacity = Math.max(0.2, Math.min(0.9, normalizedY * 0.9));
            
            // Subtle pulsing
            const pulse = Math.sin(elapsedTime * 2 + i) * 0.1 + 1.0;
            sprite.scale.setScalar(1.5 * pulse);
        }
    }
    
    /**
     * Sets the color of the math rain.
     * @param {object} color - RGB color object {red, green, blue}
     */
    setColor(color) {
        // Update sprite materials
        for (const sprite of this.spriteObjects) {
            if (sprite.material.map) {
                // Recreate texture with new color
                const canvas = sprite.material.map.image;
                const context = canvas.getContext('2d');
                
                context.fillStyle = `rgb(${Math.floor(color.red * 255)}, ${Math.floor(color.green * 255)}, ${Math.floor(color.blue * 255)})`;
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Redraw text
                context.fillStyle = `rgb(${Math.floor(color.green * 255)}, ${Math.floor(color.green * 255)}, ${Math.floor(color.blue * 255)})`;
                context.font = 'bold 24px monospace';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                
                // Get text from sprite userData or use default
                const text = sprite.userData.text || this._getRandomEquation();
                context.fillText(text, canvas.width / 2, canvas.height / 2);
                sprite.userData.text = text;
                
                sprite.material.map.needsUpdate = true;
            }
        }
    }
    
    /**
     * Cleans up resources.
     */
    dispose() {
        for (const sprite of this.spriteObjects) {
            this.scene.remove(sprite);
            if (sprite.material.map) {
                sprite.material.map.dispose();
            }
            sprite.material.dispose();
        }
        this.spriteObjects = [];
    }
}

