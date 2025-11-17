# THRML API Server

Python Flask API server for thermodynamic sampling using Extropic's `thrml` library.

## Setup

1. Install dependencies:
```bash
cd thrml_api
pip install -r requirements.txt
```

2. Run the server:
```bash
python app.py
```

The server will start on `http://localhost:5000`.

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
    "n_nodes": 5,
    "weights": [0.5, 0.5, 0.5, 0.5],
    "biases": [0.0, 0.0, 0.0, 0.0, 0.0],
    "beta": 1.0,
    "n_warmup": 100,
    "n_samples": 1000,
    "steps_per_sample": 2,
    "random_key": 0
}
```

### Stream Single Sample
```
POST /sample/ising/stream
Content-Type: application/json

{
    "n_nodes": 5,
    "weights": [0.5, 0.5, 0.5, 0.5],
    "biases": [0.0, 0.0, 0.0, 0.0, 0.0],
    "beta": 1.0,
    "steps_per_sample": 2,
    "random_key": 0
}
```

### Model Info
```
GET /model/info
```

## Integration with FlowState

The `ThrmlSampler.js` class in the frontend connects to this API. To enable THRML integration:

1. Start this API server
2. Set `useThrml: true` in `ThermodynamicVisualizer` options
3. Optionally set `thrmlApiUrl` if running on a different host/port

## Example Usage

```python
import requests

response = requests.post('http://localhost:5000/sample/ising', json={
    'n_nodes': 16,
    'weights': [-0.5] * 15,  # Checkerboard pattern
    'biases': [0.0] * 16,
    'beta': 1.0,
    'n_warmup': 100,
    'n_samples': 1000,
    'steps_per_sample': 2
})

data = response.json()
samples = data['samples']
final_state = data['final_state']
```

