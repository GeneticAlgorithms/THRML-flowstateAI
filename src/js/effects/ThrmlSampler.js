/**
 * THRML Sampler Integration
 * Wraps the Python thrml API for thermodynamic sampling.
 * Connects to the thrml_api Flask server for Ising model sampling.
 */
export default class ThrmlSampler {
    constructor(options = {}) {
        this.apiUrl = options.apiUrl || 'http://localhost:5000';
        this.nNodes = options.nNodes || 16;
        this.weights = options.weights || null; // Will be auto-generated if null
        this.biases = options.biases || null; // Will be auto-generated if null
        this.beta = options.beta || 1.0;
        this.nWarmup = options.nWarmup || 100;
        this.nSamples = options.nSamples || 1000;
        this.stepsPerSample = options.stepsPerSample || 2;
        
        // Current state
        this.currentState = null;
        this.samples = [];
        this.isSampling = false;
        
        // Initialize default weights and biases
        this._initializeDefaults();
    }
    
    /**
     * Initialize default weights and biases for the Ising chain.
     * @private
     */
    _initializeDefaults() {
        if (!this.weights) {
            // Default: checkerboard pattern (negative weights between neighbors)
            this.weights = new Array(this.nNodes - 1).fill(-0.5);
        }
        if (!this.biases) {
            this.biases = new Array(this.nNodes).fill(0.0);
        }
    }
    
    /**
     * Check if the API server is available.
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiUrl}/health`);
            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            console.warn('[ThrmlSampler] API server not available:', error);
            return false;
        }
    }
    
    /**
     * Sample from the Ising model using thrml.
     * @param {object} options - Sampling options
     * @returns {Promise<Array>} Array of sample states
     */
    async sample(options = {}) {
        const params = {
            n_nodes: options.nNodes || this.nNodes,
            weights: options.weights || this.weights,
            biases: options.biases || this.biases,
            beta: options.beta || this.beta,
            n_warmup: options.nWarmup || this.nWarmup,
            n_samples: options.nSamples || this.nSamples,
            steps_per_sample: options.stepsPerSample || this.stepsPerSample,
            random_key: options.randomKey || Math.floor(Math.random() * 10000)
        };
        
        try {
            this.isSampling = true;
            const response = await fetch(`${this.apiUrl}/sample/ising`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Sampling failed');
            }
            
            this.samples = data.samples;
            this.currentState = data.final_state;
            this.isSampling = false;
            
            return data.samples;
            
        } catch (error) {
            this.isSampling = false;
            console.error('[ThrmlSampler] Sampling error:', error);
            throw error;
        }
    }
    
    /**
     * Perform a single Gibbs step (for real-time updates).
     * @param {object} options - Sampling options
     * @returns {Promise<Array>} Single sample state
     */
    async gibbsStep(options = {}) {
        const params = {
            n_nodes: options.nNodes || this.nNodes,
            weights: options.weights || this.weights,
            biases: options.biases || this.biases,
            beta: options.beta || this.beta,
            steps_per_sample: options.stepsPerSample || this.stepsPerSample,
            random_key: options.randomKey || Math.floor(Math.random() * 10000)
        };
        
        try {
            const response = await fetch(`${this.apiUrl}/sample/ising/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Gibbs step failed');
            }
            
            if (data.state) {
                this.currentState = data.state;
            }
            
            return data.sample || data.state;
            
        } catch (error) {
            console.error('[ThrmlSampler] Gibbs step error:', error);
            throw error;
        }
    }
    
    /**
     * Set the temperature parameter (beta = 1/T).
     * @param {number} beta - Temperature parameter
     */
    setBeta(beta) {
        this.beta = beta;
    }
    
    /**
     * Set the weights for the Ising model.
     * @param {Array<number>} weights - Edge weights
     */
    setWeights(weights) {
        this.weights = weights;
    }
    
    /**
     * Set the biases for the Ising model.
     * @param {Array<number>} biases - Node biases
     */
    setBiases(biases) {
        this.biases = biases;
    }
    
    /**
     * Get the current state.
     * @returns {Array<number>|null}
     */
    getState() {
        return this.currentState;
    }
    
    /**
     * Get all samples.
     * @returns {Array<Array<number>>}
     */
    getSamples() {
        return this.samples;
    }
    
    /**
     * Get model information from the API.
     * @returns {Promise<object>}
     */
    async getModelInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/model/info`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[ThrmlSampler] Error getting model info:', error);
            return null;
        }
    }
}

