import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

/**
 * Manages the post-processing pipeline using THREE.EffectComposer.
 * Applies effects like bloom to the rendered scene.
 */
export default class PostProcessor {
    /**
     * Creates a PostProcessor instance.
     * @param {THREE.WebGLRenderer} renderer - The main WebGL renderer.
     * @param {THREE.Scene} scene - The main scene to be rendered.
     * @param {THREE.Camera} camera - The main camera used for rendering.
     * @param {object} initialParams - Initial parameters for the effects (e.g., bloom settings).
     * @param {number} initialParams.threshold - Initial bloom threshold.
     * @param {number} initialParams.strength - Initial bloom strength.
     * @param {number} initialParams.radius - Initial bloom radius.
     */
    constructor(renderer, scene, camera, initialParams) {
        if (!renderer || !scene || !camera) {
            throw new Error('PostProcessor requires renderer, scene, and camera.');
        }

        /** @type {THREE.WebGLRenderer} Reference to the main renderer */
        this.renderer = renderer;
        /** @type {EffectComposer} The Three.js EffectComposer instance */
        this.composer = new EffectComposer(renderer);

        // 1. Render Pass: Renders the original scene
        const renderPass = new RenderPass(scene, camera);
        this.composer.addPass(renderPass);

        // 2. Bloom Pass: Applies the bloom effect
        /** @type {UnrealBloomPass} The bloom pass instance */
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight), // Resolution
            initialParams.strength, // Use initial strength
            initialParams.radius,   // Use initial radius
            initialParams.threshold // Use initial threshold
        );
        this.composer.addPass(this.bloomPass);

        // 3. Output Pass: Ensures correct color space and output to screen
        // This is often necessary when using post-processing, especially with bloom.
        const outputPass = new OutputPass();
        this.composer.addPass(outputPass);
    }

    /**
     * Updates the parameters of the bloom pass.
     * Called via callback from GuiManager.
     * @param {object} params - An object containing bloom parameters to update.
     * @param {number} [params.threshold] - New bloom threshold.
     * @param {number} [params.strength] - New bloom strength.
     * @param {number} [params.radius] - New bloom radius.
     */
    updateParams(params) {
        if (params.threshold !== undefined) {
            this.bloomPass.threshold = params.threshold;
        }
        if (params.strength !== undefined) {
            this.bloomPass.strength = params.strength;
        }
        if (params.radius !== undefined) {
            this.bloomPass.radius = params.radius;
        }
    }

    /**
     * Handles window resize events by updating the composer dimensions.
     */
    onResize() {
        this.composer.setSize(window.innerWidth, window.innerHeight);
        // Note: UnrealBloomPass resolution might also need updating in some Three.js versions,
        // but EffectComposer.setSize usually handles this.
        // this.bloomPass.resolution.set(window.innerWidth, window.innerHeight);
    }

    /**
     * Renders the scene with all applied post-processing effects.
     * Called in the main animation loop.
     */
    render() {
        this.composer.render();
    }
} 