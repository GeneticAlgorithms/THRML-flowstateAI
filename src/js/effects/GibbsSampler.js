/**
 * Gibbs Sampling Engine for Energy-Based Models
 * Implements block Gibbs sampling for probabilistic graphical models
 */
export default class GibbsSampler {
    constructor(options = {}) {
        this.nodeCount = options.nodeCount || 16;
        this.temperature = options.temperature || 1.0; // β = 1/temperature
        this.biases = new Array(this.nodeCount).fill(0);
        this.weights = {}; // Edge weights: "i,j" -> weight
        this.states = new Array(this.nodeCount).fill(-1); // -1 or +1
        this.graph = this._createGridGraph();
        
        // Initialize random states
        for (let i = 0; i < this.nodeCount; i++) {
            this.states[i] = Math.random() > 0.5 ? 1 : -1;
        }
        
        // Initialize random weights for grid
        this._initializeGridWeights();
    }
    
    /**
     * Creates a grid graph structure (bipartite).
     * @private
     */
    _createGridGraph() {
        const gridSize = Math.sqrt(this.nodeCount);
        const edges = [];
        
        for (let i = 0; i < this.nodeCount; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            // Connect to neighbors (von Neumann neighborhood)
            if (col < gridSize - 1) {
                edges.push([i, i + 1]); // Right neighbor
            }
            if (row < gridSize - 1) {
                edges.push([i, i + gridSize]); // Bottom neighbor
            }
        }
        
        return edges;
    }
    
    /**
     * Initializes weights for grid graph.
     * @private
     */
    _initializeGridWeights() {
        for (const [i, j] of this.graph) {
            const key1 = `${i},${j}`;
            const key2 = `${j},${i}`;
            const weight = (Math.random() - 0.5) * 2; // -1 to 1
            this.weights[key1] = weight;
            this.weights[key2] = weight; // Symmetric
        }
    }
    
    /**
     * Sets weights for checkerboard pattern.
     */
    setCheckerboardPattern() {
        const gridSize = Math.sqrt(this.nodeCount);
        for (const [i, j] of this.graph) {
            const key1 = `${i},${j}`;
            const key2 = `${j},${i}`;
            // Negative weights encourage opposite values
            this.weights[key1] = -1.0;
            this.weights[key2] = -1.0;
        }
    }
    
    /**
     * Sets weights for split graph pattern.
     */
    setSplitPattern() {
        const gridSize = Math.sqrt(this.nodeCount);
        const mid = Math.floor(gridSize / 2);
        
        for (const [i, j] of this.graph) {
            const key1 = `${i},${j}`;
            const key2 = `${j},${i}`;
            
            const iRow = Math.floor(i / gridSize);
            const jRow = Math.floor(j / gridSize);
            
            // Negative weights between columns, positive within columns
            if (Math.abs(iRow - jRow) === 0) {
                this.weights[key1] = 1.0;
                this.weights[key2] = 1.0;
            } else {
                this.weights[key1] = -1.0;
                this.weights[key2] = -1.0;
            }
        }
    }
    
    /**
     * Computes the energy of the current state.
     * E(x) = -β(Σb_i*x_i + Σw_ij*x_i*x_j)
     */
    computeEnergy() {
        const beta = 1.0 / this.temperature;
        let energy = 0;
        
        // Bias terms
        for (let i = 0; i < this.nodeCount; i++) {
            energy += this.biases[i] * this.states[i];
        }
        
        // Interaction terms
        for (const [i, j] of this.graph) {
            const key = `${i},${j}`;
            if (this.weights[key] !== undefined) {
                energy += this.weights[key] * this.states[i] * this.states[j];
            }
        }
        
        return -beta * energy;
    }
    
    /**
     * Computes the effective bias for a node given its neighbors.
     * γ_i = 2(b_i + Σw_ij*x_j)
     */
    computeEffectiveBias(nodeIndex) {
        let sum = this.biases[nodeIndex];
        
        // Sum over neighbors
        for (const [i, j] of this.graph) {
            if (i === nodeIndex) {
                const key = `${i},${j}`;
                if (this.weights[key] !== undefined) {
                    sum += this.weights[key] * this.states[j];
                }
            } else if (j === nodeIndex) {
                const key = `${i},${j}`;
                if (this.weights[key] !== undefined) {
                    sum += this.weights[key] * this.states[i];
                }
            }
        }
        
        return 2 * sum;
    }
    
    /**
     * Sigmoid function: σ(x) = 1 / (1 + e^(-x))
     */
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    /**
     * Samples from a pbit with given probability.
     */
    samplePbit(probability) {
        return Math.random() < probability ? 1 : -1;
    }
    
    /**
     * Performs one Gibbs sampling iteration (block update).
     * Updates nodes in two blocks (bipartite coloring).
     */
    gibbsStep() {
        const gridSize = Math.sqrt(this.nodeCount);
        const block1 = [];
        const block2 = [];
        
        // Partition nodes into two blocks (checkerboard pattern)
        for (let i = 0; i < this.nodeCount; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            if ((row + col) % 2 === 0) {
                block1.push(i);
            } else {
                block2.push(i);
            }
        }
        
        // Update block 1 in parallel
        for (const i of block1) {
            const gamma = this.computeEffectiveBias(i);
            const prob = this.sigmoid(gamma);
            this.states[i] = this.samplePbit(prob) === 1 ? 1 : -1;
        }
        
        // Update block 2 in parallel
        for (const i of block2) {
            const gamma = this.computeEffectiveBias(i);
            const prob = this.sigmoid(gamma);
            this.states[i] = this.samplePbit(prob) === 1 ? 1 : -1;
        }
    }
    
    /**
     * Sets the temperature parameter.
     */
    setTemperature(temperature) {
        this.temperature = Math.max(0.1, temperature);
    }
    
    /**
     * Sets bias for a node.
     */
    setBias(nodeIndex, bias) {
        if (nodeIndex >= 0 && nodeIndex < this.nodeCount) {
            this.biases[nodeIndex] = bias;
        }
    }
    
    /**
     * Sets weight for an edge.
     */
    setWeight(i, j, weight) {
        const key1 = `${i},${j}`;
        const key2 = `${j},${i}`;
        this.weights[key1] = weight;
        this.weights[key2] = weight;
    }
    
    /**
     * Gets current state.
     */
    getStates() {
        return [...this.states];
    }
    
    /**
     * Gets graph structure.
     */
    getGraph() {
        return this.graph;
    }
    
    /**
     * Gets weights.
     */
    getWeights() {
        return {...this.weights};
    }
}

