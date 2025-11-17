import * as THREE from 'three';
import GibbsSampler from './GibbsSampler';

/**
 * Thermodynamic Model Visualizer
 * Visualizes energy-based models, probabilistic bits (pbits), and Gibbs sampling.
 * Implements concepts from Extropic's TSU (Thermodynamic Sampling Unit).
 * A pbit is a programmable analog hardware implementation of a Bernoulli distribution.
 */
export default class ThermodynamicVisualizer {
    constructor(scene, mesh, options = {}) {
        this.scene = scene;
        this.mesh = mesh; // The icosahedron mesh to enhance
        
        // Pbit configuration
        this.pbitCount = options.pbitCount || 20; // Number of pbits to visualize
        this.pbits = [];
        this.pbitProbabilities = [];
        this.pbitStates = [];
        
        // Energy-based model parameters
        this.temperature = options.temperature || 1.0;
        this.energyScale = options.energyScale || 1.0;
        
        // Gibbs sampling engine
        this.gibbsSampler = new GibbsSampler({
            nodeCount: 16, // 4x4 grid for visualization
            temperature: this.temperature
        });
        this.gibbsStepCounter = 0;
        this.gibbsUpdateInterval = 2; // Update every N frames
        
        // Visual elements
        this.pbitSpheres = [];
        this.energyField = null;
        this.gradientArrows = [];
        this.graphVisualization = null; // Graph structure visualization
        this.graphNodes = [];
        this.graphEdges = [];
        
        // Create pbit visualizations
        this._createPbits();
        this._createEnergyField();
        this._createGraphVisualization();
        
        console.log('[ThermodynamicVisualizer] Initialized with', this.pbitCount, 'pbits and Gibbs sampling');
    }
    
    /**
     * Creates visual representations of probabilistic bits (pbits).
     * Each pbit can be in state 0 or 1 with a programmable probability.
     * @private
     */
    _createPbits() {
        if (!this.mesh) return;
        
        const geometry = this.mesh.geometry;
        const positions = geometry.attributes.position;
        
        // Sample vertices from icosahedron for pbit positions
        const vertexCount = positions.count;
        const pbitIndices = [];
        
        // Select random vertices for pbits
        for (let i = 0; i < this.pbitCount; i++) {
            const vertexIndex = Math.floor(Math.random() * vertexCount);
            pbitIndices.push(vertexIndex);
            
            // Get vertex position
            const i3 = vertexIndex * 3;
            const x = positions.array[i3];
            const y = positions.array[i3 + 1];
            const z = positions.array[i3 + 2];
            
            // Normalize position to get direction from center
            const length = Math.sqrt(x * x + y * y + z * z);
            const normalizedX = x / length;
            const normalizedY = y / length;
            const normalizedZ = z / length;
            
            // Position pbit slightly outside the icosahedron
            const radius = length * 1.2;
            
            // Create sphere geometry for pbit
            const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                transparent: true,
                opacity: 0.8
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(
                normalizedX * radius,
                normalizedY * radius,
                normalizedZ * radius
            );
            
            // Store reference to original vertex
            sphere.userData.vertexIndex = vertexIndex;
            sphere.userData.basePosition = new THREE.Vector3(normalizedX, normalizedY, normalizedZ);
            
            this.scene.add(sphere);
            this.pbitSpheres.push(sphere);
            
            // Initialize pbit state and probability
            this.pbitProbabilities.push(Math.random()); // Random initial probability
            this.pbitStates.push(Math.random() > 0.5 ? 1 : 0); // Random initial state
        }
        
        this.pbits = pbitIndices;
    }
    
    /**
     * Creates an energy field visualization around the icosahedron.
     * @private
     */
    _createEnergyField() {
        // Create a particle system to represent energy gradients
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Random position around icosahedron
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 3 + Math.random() * 2;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Color based on energy (blue = low energy, red = high energy)
            colors[i3] = Math.random() * 0.5; // R
            colors[i3 + 1] = Math.random() * 0.3; // G
            colors[i3 + 2] = 0.8 + Math.random() * 0.2; // B
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.energyField = new THREE.Points(geometry, material);
        this.scene.add(this.energyField);
    }
    
    /**
     * Creates graph visualization showing nodes and edges.
     * @private
     */
    _createGraphVisualization() {
        const states = this.gibbsSampler.getStates();
        const graph = this.gibbsSampler.getGraph();
        const gridSize = Math.sqrt(this.gibbsSampler.nodeCount);
        
        // Create node spheres
        const nodeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const nodeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        
        this.graphNodes = [];
        const spacing = 1.5;
        const offset = (gridSize - 1) * spacing / 2;
        
        for (let i = 0; i < states.length; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            const node = nodeGeometry.clone();
            const mesh = new THREE.Mesh(node, nodeMaterial.clone());
            mesh.position.set(
                (col - offset) * spacing,
                5, // Position above icosahedron
                (row - offset) * spacing
            );
            
            mesh.userData.nodeIndex = i;
            mesh.userData.state = states[i];
            
            this.scene.add(mesh);
            this.graphNodes.push(mesh);
        }
        
        // Create edge lines
        const edgeGeometry = new THREE.BufferGeometry();
        const edgePositions = new Float32Array(graph.length * 6); // 2 points per edge
        
        let idx = 0;
        for (const [i, j] of graph) {
            const iRow = Math.floor(i / gridSize);
            const iCol = i % gridSize;
            const jRow = Math.floor(j / gridSize);
            const jCol = j % gridSize;
            
            edgePositions[idx++] = (iCol - offset) * spacing;
            edgePositions[idx++] = 5;
            edgePositions[idx++] = (iRow - offset) * spacing;
            
            edgePositions[idx++] = (jCol - offset) * spacing;
            edgePositions[idx++] = 5;
            edgePositions[idx++] = (jRow - offset) * spacing;
        }
        
        edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
        
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        
        this.graphEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        this.scene.add(this.graphEdges);
        
        this.graphVisualization = {
            nodes: this.graphNodes,
            edges: this.graphEdges
        };
    }
    
    /**
     * Updates pbit states based on their probabilities (Bernoulli sampling).
     * @param {number} deltaTime - Time since last frame
     */
    updatePbits(deltaTime) {
        for (let i = 0; i < this.pbitCount; i++) {
            // Sample from Bernoulli distribution based on probability
            const probability = this.pbitProbabilities[i];
            const randomValue = Math.random();
            
            // Update state based on probability
            if (randomValue < probability) {
                this.pbitStates[i] = 1;
            } else {
                this.pbitStates[i] = 0;
            }
            
            // Update visual representation
            if (this.pbitSpheres[i]) {
                const sphere = this.pbitSpheres[i];
                const state = this.pbitStates[i];
                const prob = this.pbitProbabilities[i];
                
                // Color: green (0) to red (1), brightness based on probability
                const color = new THREE.Color();
                color.setHSL(0.3 - prob * 0.3, 1.0, 0.3 + prob * 0.4);
                sphere.material.color = color;
                
                // Size based on state and probability
                const baseSize = 0.1;
                const sizeMultiplier = state === 1 ? 1.5 : 0.7;
                sphere.scale.setScalar(baseSize * sizeMultiplier);
                
                // Opacity based on probability confidence
                sphere.material.opacity = 0.6 + prob * 0.4;
                
                // Subtle pulsing animation
                const pulse = Math.sin(Date.now() * 0.005 + i) * 0.1 + 1.0;
                sphere.scale.multiplyScalar(pulse);
            }
        }
    }
    
    /**
     * Updates the energy field visualization.
     * @param {number} deltaTime - Time since last frame
     * @param {number} audioFrequency - Audio frequency for reactivity
     */
    updateEnergyField(deltaTime, audioFrequency = 0) {
        if (!this.energyField) return;
        
        const positions = this.energyField.geometry.attributes.position.array;
        const colors = this.energyField.geometry.attributes.color.array;
        const time = Date.now() * 0.001;
        
        // Animate energy field particles
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Create flowing motion
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            
            // Calculate distance from center
            const distance = Math.sqrt(x * x + y * y + z * z);
            
            // Animate position slightly
            const angle = Math.atan2(y, x) + time * 0.1;
            const radius = distance + Math.sin(time * 2 + i) * 0.1;
            
            positions[i3] = radius * Math.cos(angle);
            positions[i3 + 1] = radius * Math.sin(angle);
            positions[i3 + 2] = z + Math.sin(time + i) * 0.05;
            
            // Update colors based on energy and audio
            const energy = Math.sin(time * 0.5 + i * 0.1) * 0.5 + 0.5;
            const audioInfluence = audioFrequency * 0.5;
            
            colors[i3] = Math.min(1, energy * 0.5 + audioInfluence); // R
            colors[i3 + 1] = Math.min(1, energy * 0.3); // G
            colors[i3 + 2] = Math.min(1, 0.8 - energy * 0.3); // B
        }
        
        this.energyField.geometry.attributes.position.needsUpdate = true;
        this.energyField.geometry.attributes.color.needsUpdate = true;
    }
    
    /**
     * Updates pbit probabilities based on control voltage (simulated).
     * In real hardware, this would be controlled by voltage.
     * @param {number} index - Pbit index
     * @param {number} probability - New probability (0-1)
     */
    setPbitProbability(index, probability) {
        if (index >= 0 && index < this.pbitCount) {
            this.pbitProbabilities[index] = Math.max(0, Math.min(1, probability));
        }
    }
    
    /**
     * Sets all pbit probabilities based on audio frequency (energy-based control).
     * @param {number} frequency - Audio frequency (0-1 normalized)
     */
    setPbitsFromAudio(frequency) {
        // Map audio frequency to probability distribution
        for (let i = 0; i < this.pbitCount; i++) {
            // Create a wave pattern based on frequency
            const phase = (i / this.pbitCount) * Math.PI * 2;
            const probability = 0.3 + frequency * 0.4 + Math.sin(phase + Date.now() * 0.001) * 0.2;
            this.pbitProbabilities[i] = Math.max(0, Math.min(1, probability));
        }
    }
    
    /**
     * Updates the graph visualization based on Gibbs sampling states.
     */
    updateGraphVisualization() {
        if (!this.gibbsSampler || !this.graphNodes.length) return;
        
        const states = this.gibbsSampler.getStates();
        const weights = this.gibbsSampler.getWeights();
        
        // Update node colors and sizes based on state
        for (let i = 0; i < this.graphNodes.length; i++) {
            const node = this.graphNodes[i];
            const state = states[i];
            
            // Color: green for +1, red for -1
            const color = state === 1 ? 0x00ff00 : 0xff0088;
            node.material.color.setHex(color);
            
            // Size based on state
            const baseScale = state === 1 ? 1.2 : 0.8;
            node.scale.setScalar(baseScale);
            
            // Pulse animation
            const pulse = Math.sin(Date.now() * 0.005 + i) * 0.1 + 1.0;
            node.scale.multiplyScalar(pulse);
        }
        
        // Update edge opacity based on weight strength
        if (this.graphEdges) {
            const weightValues = Object.values(weights);
            if (weightValues.length > 0) {
                const avgWeight = Math.abs(weightValues.reduce((a, b) => a + b, 0) / weightValues.length);
                const opacity = Math.min(0.8, avgWeight * 0.5 + 0.2);
                this.graphEdges.material.opacity = opacity;
            }
        }
    }
    
    /**
     * Updates the thermodynamic visualizer.
     * @param {number} deltaTime - Time since last frame
     * @param {number} elapsedTime - Total elapsed time
     * @param {object} audioData - Audio data {frequency: number}
     */
    update(deltaTime, elapsedTime, audioData = {}) {
        this.updatePbits(deltaTime);
        this.updateEnergyField(deltaTime, audioData.frequency || 0);
        
        // Update pbits based on audio if available
        if (audioData.frequency !== undefined) {
            this.setPbitsFromAudio(audioData.frequency);
        }
        
        // Perform Gibbs sampling steps
        this.gibbsStepCounter++;
        if (this.gibbsStepCounter >= this.gibbsUpdateInterval) {
            this.gibbsSampler.gibbsStep();
            this.updateGraphVisualization();
            this.gibbsStepCounter = 0;
        }
        
        // Adjust Gibbs sampling speed based on audio
        if (audioData.frequency !== undefined) {
            this.gibbsUpdateInterval = Math.max(1, Math.floor(5 - audioData.frequency * 4));
        }
    }
    
    /**
     * Sets the temperature parameter (affects energy distribution).
     * @param {number} temperature - Temperature value
     */
    setTemperature(temperature) {
        this.temperature = Math.max(0.1, temperature);
        if (this.gibbsSampler) {
            this.gibbsSampler.setTemperature(temperature);
        }
    }
    
    /**
     * Sets graph pattern (checkerboard or split).
     * @param {string} pattern - 'checkerboard' or 'split'
     */
    setGraphPattern(pattern) {
        if (!this.gibbsSampler) return;
        
        if (pattern === 'checkerboard') {
            this.gibbsSampler.setCheckerboardPattern();
        } else if (pattern === 'split') {
            this.gibbsSampler.setSplitPattern();
        }
    }
    
    /**
     * Gets current energy value.
     */
    getEnergy() {
        if (this.gibbsSampler) {
            return this.gibbsSampler.computeEnergy();
        }
        return 0;
    }
    
    /**
     * Gets current pbit statistics.
     * @returns {object} Statistics about pbits
     */
    getPbitStats() {
        const activeCount = this.pbitStates.filter(s => s === 1).length;
        const avgProbability = this.pbitProbabilities.reduce((a, b) => a + b, 0) / this.pbitCount;
        
        return {
            total: this.pbitCount,
            active: activeCount,
            inactive: this.pbitCount - activeCount,
            averageProbability: avgProbability,
            states: [...this.pbitStates],
            probabilities: [...this.pbitProbabilities]
        };
    }
    
    /**
     * Cleans up resources.
     */
    dispose() {
        // Remove pbit spheres
        this.pbitSpheres.forEach(sphere => {
            this.scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        });
        this.pbitSpheres = [];
        
        // Remove energy field
        if (this.energyField) {
            this.scene.remove(this.energyField);
            this.energyField.geometry.dispose();
            this.energyField.material.dispose();
            this.energyField = null;
        }
    }
}

