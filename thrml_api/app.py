"""
THRML API Server
Provides REST API endpoints for thermodynamic sampling using Extropic's thrml library.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import jax
import jax.numpy as jnp
from thrml import SpinNode, Block, SamplingSchedule, sample_states
from thrml.models import IsingEBM, IsingSamplingProgram, hinton_init
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'message': 'THRML API is running'})

@app.route('/sample/ising', methods=['POST'])
def sample_ising():
    """
    Sample from an Ising model using thrml.
    
    Expected JSON body:
    {
        "n_nodes": 5,
        "weights": [0.5, 0.5, 0.5, 0.5],  # Edge weights
        "biases": [0.0, 0.0, 0.0, 0.0, 0.0],  # Node biases
        "beta": 1.0,  # Temperature parameter
        "n_warmup": 100,
        "n_samples": 1000,
        "steps_per_sample": 2,
        "random_key": 0  # Optional: random seed
    }
    """
    try:
        data = request.get_json()
        
        # Extract parameters
        n_nodes = data.get('n_nodes', 5)
        weights = jnp.array(data.get('weights', [0.5] * (n_nodes - 1)))
        biases = jnp.array(data.get('biases', [0.0] * n_nodes))
        beta = jnp.array(data.get('beta', 1.0))
        n_warmup = data.get('n_warmup', 100)
        n_samples = data.get('n_samples', 1000)
        steps_per_sample = data.get('steps_per_sample', 2)
        random_key = data.get('random_key', 0)
        
        # Create nodes and edges
        nodes = [SpinNode() for _ in range(n_nodes)]
        edges = [(nodes[i], nodes[i+1]) for i in range(n_nodes - 1)]
        
        # Create Ising EBM model
        model = IsingEBM(nodes, edges, biases, weights, beta)
        
        # Create free blocks (two-color block Gibbs)
        free_blocks = [Block(nodes[::2]), Block(nodes[1::2])]
        
        # Create sampling program
        program = IsingSamplingProgram(model, free_blocks, clamped_blocks=[])
        
        # Initialize random key
        key = jax.random.key(random_key)
        k_init, k_samp = jax.random.split(key, 2)
        
        # Initialize state
        init_state = hinton_init(k_init, model, free_blocks, ())
        
        # Create sampling schedule
        schedule = SamplingSchedule(
            n_warmup=n_warmup,
            n_samples=n_samples,
            steps_per_sample=steps_per_sample
        )
        
        # Sample states
        samples = sample_states(k_samp, program, schedule, init_state, [], [Block(nodes)])
        
        # Convert JAX arrays to lists for JSON serialization
        samples_list = [s.tolist() if hasattr(s, 'tolist') else s for s in samples]
        
        # Get final state
        final_state = samples[-1] if len(samples) > 0 else None
        final_state_list = final_state.tolist() if final_state is not None and hasattr(final_state, 'tolist') else None
        
        return jsonify({
            'success': True,
            'samples': samples_list,
            'final_state': final_state_list,
            'n_samples': len(samples),
            'model_info': {
                'n_nodes': n_nodes,
                'beta': float(beta),
                'n_edges': len(edges)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 400

@app.route('/sample/ising/stream', methods=['POST'])
def sample_ising_stream():
    """
    Stream samples from an Ising model (for real-time visualization).
    Returns one sample at a time.
    """
    try:
        data = request.get_json()
        
        n_nodes = data.get('n_nodes', 5)
        weights = jnp.array(data.get('weights', [0.5] * (n_nodes - 1)))
        biases = jnp.array(data.get('biases', [0.0] * n_nodes))
        beta = jnp.array(data.get('beta', 1.0))
        steps_per_sample = data.get('steps_per_sample', 2)
        random_key = data.get('random_key', 0)
        
        # Create model
        nodes = [SpinNode() for _ in range(n_nodes)]
        edges = [(nodes[i], nodes[i+1]) for i in range(n_nodes - 1)]
        model = IsingEBM(nodes, edges, biases, weights, beta)
        
        # Create blocks
        free_blocks = [Block(nodes[::2]), Block(nodes[1::2])]
        program = IsingSamplingProgram(model, free_blocks, clamped_blocks=[])
        
        # Initialize
        key = jax.random.key(random_key)
        k_init, k_samp = jax.random.split(key, 2)
        init_state = hinton_init(k_init, model, free_blocks, ())
        
        # Perform one Gibbs step
        # Note: This is a simplified version - full streaming would require state management
        schedule = SamplingSchedule(n_warmup=0, n_samples=1, steps_per_sample=steps_per_sample)
        samples = sample_states(k_samp, program, schedule, init_state, [], [Block(nodes)])
        
        return jsonify({
            'success': True,
            'sample': samples[0].tolist() if len(samples) > 0 else None,
            'state': samples[-1].tolist() if len(samples) > 0 else None
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }), 400

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get information about available models and parameters."""
    return jsonify({
        'models': ['ising'],
        'parameters': {
            'ising': {
                'n_nodes': 'int - Number of nodes in the chain',
                'weights': 'array - Edge weights (length: n_nodes - 1)',
                'biases': 'array - Node biases (length: n_nodes)',
                'beta': 'float - Temperature parameter (1/T)',
                'n_warmup': 'int - Number of warmup steps',
                'n_samples': 'int - Number of samples to generate',
                'steps_per_sample': 'int - Gibbs steps per sample'
            }
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

