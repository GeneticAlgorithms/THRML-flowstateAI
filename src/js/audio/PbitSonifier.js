/**
 * PbitSonifier: Maps pbit states to musical frequencies using Web Audio API
 * 
 * Implements the sonification architecture described in the FlowState AI technical report:
 * - Each pbit is assigned a frequency from a musical scale
 * - Pbit state determines oscillator activation
 * - Amplitude modulated by pbit probability
 * - Creates harmonic patterns from thermodynamic sampling
 * 
 * Based on: FlowState AI Technical Report, Section "Stochastic Harmony: Mapping Pbits to Musical Notes"
 */
export default class PbitSonifier {
    /**
     * Creates a PbitSonifier instance.
     * @param {object} options - Configuration options
     * @param {number} [options.baseFrequency=261.63] - Base frequency in Hz (C4)
     * @param {string} [options.scale='major_pentatonic'] - Musical scale to use
     * @param {number} [options.masterVolume=0.05] - Master volume (0-1)
     * @param {number} [options.smoothingTime=0.1] - Audio smoothing time in seconds
     */
    constructor(options = {}) {
        this.baseFrequency = options.baseFrequency || 261.63; // C4
        this.scale = options.scale || 'major_pentatonic';
        this.masterVolume = options.masterVolume || 0.05;
        this.smoothingTime = options.smoothingTime || 0.1;
        
        // Musical scales (semitones from base frequency)
        this.scales = {
            'major_pentatonic': [0, 2, 4, 7, 9, 12, 14, 16], // C, D, E, G, A, C5, D5, E5
            'minor_pentatonic': [0, 3, 5, 7, 10, 12, 15, 17], // C, D#, F, G, A#, C5, D#5, F5
            'major': [0, 2, 4, 5, 7, 9, 11, 12], // C major scale
            'chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // Full chromatic scale
        };
        
        // Web Audio API components
        this.audioContext = null;
        this.oscillators = [];
        this.gainNodes = [];
        this.masterGain = null;
        this.isInitialized = false;
        this.isEnabled = false;
        
        // Store current pbit states and probabilities
        this.pbitStates = [];
        this.pbitProbabilities = [];
        this.pbitCount = 0;
        
        console.log('[PbitSonifier] Created with scale:', this.scale);
    }
    
    /**
     * Initializes the Web Audio API context and creates oscillators.
     * Must be called after user interaction (browser security requirement).
     */
    async initialize(pbitCount) {
        if (this.isInitialized) {
            console.warn('[PbitSonifier] Already initialized');
            return;
        }
        
        try {
            // Create AudioContext (must be triggered by user interaction)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain node for volume control
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Initialize arrays
            this.pbitCount = pbitCount;
            this.pbitStates = new Array(pbitCount).fill(0);
            this.pbitProbabilities = new Array(pbitCount).fill(0.5);
            
            // Get scale intervals
            const scaleIntervals = this.scales[this.scale] || this.scales['major_pentatonic'];
            
            // Create oscillator and gain node for each pbit
            for (let i = 0; i < pbitCount; i++) {
                // Assign frequency from scale (cycle through scale)
                const scaleIdx = i % scaleIntervals.length;
                const semitones = scaleIntervals[scaleIdx];
                const frequency = this.baseFrequency * Math.pow(2, semitones / 12);
                
                // Create oscillator
                const oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine'; // Pure tone for harmonic clarity
                oscillator.frequency.value = frequency;
                
                // Create gain node for amplitude control
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0; // Start silent
                
                // Connect: oscillator -> gain -> master gain -> destination
                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                // Start oscillator (it will be silent until gain > 0)
                oscillator.start();
                
                this.oscillators.push(oscillator);
                this.gainNodes.push(gainNode);
            }
            
            this.isInitialized = true;
            console.log(`[PbitSonifier] Initialized ${pbitCount} oscillators with ${this.scale} scale`);
            
        } catch (error) {
            console.error('[PbitSonifier] Initialization error:', error);
            throw error;
        }
    }
    
    /**
     * Updates audio synthesis based on current pbit states and probabilities.
     * Called from the main animation loop.
     * @param {Array<number>} states - Pbit states (0 or 1, or -1/+1)
     * @param {Array<number>} probabilities - Pbit activation probabilities (0-1)
     */
    update(states, probabilities) {
        if (!this.isInitialized || !this.isEnabled) {
            return;
        }
        
        if (!states || !probabilities || states.length !== this.pbitCount) {
            console.warn('[PbitSonifier] Invalid state/probability arrays');
            return;
        }
        
        const currentTime = this.audioContext.currentTime;
        
        // Update each oscillator based on pbit state and probability
        for (let i = 0; i < this.pbitCount; i++) {
            // Normalize state: convert -1/+1 to 0/1 if needed
            const state = states[i] === -1 ? 0 : (states[i] === 1 ? 1 : states[i]);
            const prob = Math.max(0, Math.min(1, probabilities[i] || 0));
            
            // Amplitude = state * probability * masterVolume
            // Only active pbits (state = 1) produce sound
            const targetAmplitude = state * prob * this.masterVolume;
            
            // Smooth gain changes to avoid clicks
            this.gainNodes[i].gain.linearRampToValueAtTime(
                targetAmplitude,
                currentTime + this.smoothingTime
            );
        }
        
        // Store current values
        this.pbitStates = [...states];
        this.pbitProbabilities = [...probabilities];
    }
    
    /**
     * Enables audio synthesis.
     */
    enable() {
        if (!this.isInitialized) {
            console.warn('[PbitSonifier] Must initialize before enabling');
            return;
        }
        
        this.isEnabled = true;
        console.log('[PbitSonifier] Enabled');
    }
    
    /**
     * Disables audio synthesis (silences all oscillators).
     */
    disable() {
        this.isEnabled = false;
        
        // Fade out all oscillators
        const currentTime = this.audioContext.currentTime;
        for (let i = 0; i < this.gainNodes.length; i++) {
            this.gainNodes[i].gain.linearRampToValueAtTime(0, currentTime + 0.1);
        }
        
        console.log('[PbitSonifier] Disabled');
    }
    
    /**
     * Sets the master volume.
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.masterGain) {
            const currentTime = this.audioContext.currentTime;
            this.masterVolume = Math.max(0, Math.min(1, volume));
            this.masterGain.gain.linearRampToValueAtTime(
                this.masterVolume,
                currentTime + 0.1
            );
        }
    }
    
    /**
     * Changes the musical scale.
     * @param {string} scaleName - Name of scale ('major_pentatonic', 'minor_pentatonic', etc.)
     */
    setScale(scaleName) {
        if (!this.scales[scaleName]) {
            console.warn(`[PbitSonifier] Unknown scale: ${scaleName}`);
            return;
        }
        
        this.scale = scaleName;
        const scaleIntervals = this.scales[scaleName];
        
        // Update oscillator frequencies
        for (let i = 0; i < this.oscillators.length; i++) {
            const scaleIdx = i % scaleIntervals.length;
            const semitones = scaleIntervals[scaleIdx];
            const frequency = this.baseFrequency * Math.pow(2, semitones / 12);
            
            this.oscillators[i].frequency.setValueAtTime(
                frequency,
                this.audioContext.currentTime
            );
        }
        
        console.log(`[PbitSonifier] Scale changed to: ${scaleName}`);
    }
    
    /**
     * Cleans up resources and stops all oscillators.
     */
    dispose() {
        this.disable();
        
        // Stop and disconnect all oscillators
        for (let i = 0; i < this.oscillators.length; i++) {
            try {
                this.oscillators[i].stop();
                this.oscillators[i].disconnect();
            } catch (error) {
                // Oscillator may already be stopped
            }
        }
        
        // Disconnect gain nodes
        for (let i = 0; i < this.gainNodes.length; i++) {
            try {
                this.gainNodes[i].disconnect();
            } catch (error) {
                // Already disconnected
            }
        }
        
        // Close audio context
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close().catch(console.error);
        }
        
        this.oscillators = [];
        this.gainNodes = [];
        this.masterGain = null;
        this.audioContext = null;
        this.isInitialized = false;
        
        console.log('[PbitSonifier] Disposed');
    }
}

