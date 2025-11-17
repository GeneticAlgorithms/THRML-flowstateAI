# THRML Integration Guide

This guide explains how to integrate Extropic's `thrml` Python library with FlowState AI for authentic thermodynamic sampling.

## Overview

FlowState now supports integration with the `thrml` library, which provides hardware-accurate simulations of Thermodynamic Sampling Units (TSUs). This allows you to use the same sampling algorithms that run on Extropic's hardware.

## Architecture

- **Python API Server** (`thrml_api/app.py`): Flask server that wraps `thrml` library
- **JavaScript Client** (`src/js/effects/ThrmlSampler.js`): Frontend client that connects to the API
- **Visualizer Integration** (`src/js/effects/ThermodynamicVisualizer.js`): Automatically uses THRML if available

## Setup

### 1. Install Python Dependencies

```bash
cd thrml_api
pip install -r requirements.txt
```

**Note**: You'll need to install `thrml` from Extropic. Check their documentation for installation instructions.

### 2. Start the API Server

```bash
cd thrml_api
python app.py
```

The server will start on `http://localhost:5000`.

### 3. Enable THRML in FlowState

In `src/js/core/SceneManager.js`, when creating the `ThermodynamicVisualizer`:

```javascript
this.thermodynamicVisualizer = new ThermodynamicVisualizer(this.scene, this.mesh, {
    pbitCount: 20,
    temperature: 1.0,
    energyScale: 1.0,
    useThrml: true,  // Enable THRML integration
    thrmlApiUrl: 'http://localhost:5000'  // API server URL
});
```

## API Endpoints

### Health Check
```
GET /health
```

### Sample Ising Model
```
POST /sample/ising
Content-Type: application/json

{
    "n_nodes": 16,
    "weights": [-0.5, -0.5, -0.5, ...],  // Edge weights
    "biases": [0.0, 0.0, 0.0, ...],      // Node biases
    "beta": 1.0,                         // Temperature parameter
    "n_warmup": 100,
    "n_samples": 1000,
    "steps_per_sample": 2,
    "random_key": 0
}
```

### Stream Single Sample (for real-time updates)
```
POST /sample/ising/stream
```

## Example Usage

### Python (Direct thrml usage)
```python
import jax
import jax.numpy as jnp
from thrml import SpinNode, Block, SamplingSchedule, sample_states
from thrml.models import IsingEBM, IsingSamplingProgram, hinton_init

nodes = [SpinNode() for _ in range(5)]
edges = [(nodes[i], nodes[i+1]) for i in range(4)]
biases = jnp.zeros((5,))
weights = jnp.ones((4,)) * 0.5
beta = jnp.array(1.0)

model = IsingEBM(nodes, edges, biases, weights, beta)
free_blocks = [Block(nodes[::2]), Block(nodes[1::2])]
program = IsingSamplingProgram(model, free_blocks, clamped_blocks=[])

key = jax.random.key(0)
k_init, k_samp = jax.random.split(key, 2)
init_state = hinton_init(k_init, model, free_blocks, ())
schedule = SamplingSchedule(n_warmup=100, n_samples=1000, steps_per_sample=2)

samples = sample_states(k_samp, program, schedule, init_state, [], [Block(nodes)])
```

### JavaScript (via API)
```javascript
import ThrmlSampler from './effects/ThrmlSampler';

const sampler = new ThrmlSampler({
    apiUrl: 'http://localhost:5000',
    nNodes: 16,
    beta: 1.0
});

// Check if API is available
const isAvailable = await sampler.checkHealth();

if (isAvailable) {
    // Sample from Ising model
    const samples = await sampler.sample({
        nNodes: 16,
        weights: new Array(15).fill(-0.5),
        biases: new Array(16).fill(0.0),
        beta: 1.0,
        nWarmup: 100,
        nSamples: 1000
    });
    
    // Or perform single Gibbs step for real-time updates
    const sample = await sampler.gibbsStep({
        beta: 1.0
    });
}
```

## Fallback Behavior

If the THRML API is not available, FlowState automatically falls back to the JavaScript `GibbsSampler` implementation. This ensures the visualization always works, even without the Python backend.

## Benefits of THRML Integration

1. **Hardware Accuracy**: Uses the same algorithms as Extropic's TSU hardware
2. **Advanced Features**: Access to full `thrml` capabilities
3. **Research**: Perfect for experimenting with thermodynamic models
4. **Performance**: JAX acceleration for faster sampling

## Troubleshooting

### API Server Not Starting
- Ensure `thrml` is installed: `pip install thrml`
- Check Python version (requires Python 3.8+)
- Verify JAX installation: `pip install jax jaxlib`

### CORS Errors
- The Flask server includes CORS headers, but ensure your browser allows localhost connections

### Connection Refused
- Verify the API server is running: `curl http://localhost:5000/health`
- Check firewall settings
- Ensure the port (5000) is not in use

## Next Steps

- Experiment with different Ising model configurations
- Try different sampling schedules
- Integrate with other `thrml` models beyond Ising
- Deploy the API server for production use

