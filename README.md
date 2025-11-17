## FlowState AI

# Demo Link : https://flowstate-eav4sf1mf-legendary-cynosures-projects.vercel.app/

# White Paper: https://github.com/GeneticAlgorithms/THRML-flowstateAI/blob/main/Flowstate_WhitePaper.pdf
(explains how everything works in detail)



## Features

* Real-time 3D visualization reacting to audio frequency.
* **New:** Particle effect simulating water ripples, particles generate from the center and spread outward based on audio frequency.
* **New:** Facial expression detection using Hume AI - control colors, bloom, and particle effects with your emotions!
* Uses Perlin noise in the vertex shader for mesh displacement.
* Applies a Bloom post-processing effect.
* Allows users to upload their own audio files or use microphone input.
* Interactive controls for color and bloom parameters via dat.gui.

## Tech Stack

* **Three.js** - 3D graphics rendering
* **Web Audio API** - Audio processing and analysis
* **Hume AI** - Facial expression detection and emotion recognition
* **WebSocket API** - Real-time communication with Hume's API
* **WebGL Shaders** - GLSL shaders for visual effects
* **dat.GUI** - Interactive control interface
* **Parcel** - Project bundling and building

## Project Structure

```
audiovisualizer/
├── dist/              # Build output directory
├── src/
│   ├── js/
│   │   ├── core/      # Core Three.js setup (SceneManager)
│   │   ├── audio/     # Audio loading and analysis (AudioManager)
│   │   ├── expression/# Facial expression detection (ExpressionManager, ExpressionMapper)
│   │   ├── effects/   # Post-processing effects (PostProcessor, ParticleEffect)
│   │   ├── gui/       # UI controls (GuiManager)
│   │   └── main.js    # Main application entry point & loop
│   ├── shaders/     # GLSL shader files (vertex.glsl, fragment.glsl)
│   └── index.html     # Main HTML file
├── static/            # Static assets (if any)
├── .env.example       # Example environment variables
├── .gitignore
├── .parcelrc          # Parcel bundler configuration
├── package.json       # Project dependencies and scripts
├── HUME_SETUP.md      # Hume AI setup guide
└── README.md          # This file
```

## Key Modules

* **`main.js`**: Initializes all modules, manages the main animation loop, and coordinates interactions between modules.
* **`core/SceneManager.js`**: Sets up the Three.js scene, camera, renderer, and the main visualizer mesh (Icosahedron). Manages shader uniforms.
* **`audio/AudioManager.js`**: Handles audio file uploads, decoding, playback using the Web Audio API, and real-time frequency analysis via `THREE.AudioAnalyser`.
* **`expression/ExpressionManager.js`**: Manages camera capture and WebSocket connection to Hume AI for real-time facial expression detection.
* **`expression/ExpressionMapper.js`**: Maps facial expression emotions to visualization parameters (colors, bloom effects, particle behavior).
* **`gui/GuiManager.js`**: Creates the `dat.gui` interface for controlling visual parameters (colors, bloom effect) and camera/mic controls.
* **`effects/PostProcessor.js`**: Manages the post-processing pipeline using `THREE.EffectComposer`, including the `UnrealBloomPass`.
* **`effects/ParticleEffect.js`**: Particle system that reacts to audio frequency and facial expressions.
* **`shaders/vertex.glsl`**: Vertex shader implementing Perlin noise for mesh displacement based on time and audio frequency.
* **`shaders/fragment.glsl`**: Simple fragment shader applying colors based on uniforms.

## Setup and Running

1. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set up Hume API key (Optional - for facial expressions):**

   ```bash
   # Edit .env and add your Hume API key
   # HUME_API_KEY=your_actual_api_key_here
   ```
3. **Run the development server:**

   ```bash
   npm start
   # or
   yarn start
   ```

   This will start the Parcel development server and open the visualizer in your default browser.

4. **Build for production:**

   ```bash
   npm run build
   # or
   yarn build
   ```

   This will create an optimized build in the `dist/` directory.

## Usage

### Audio Input
* Click **"Upload Audio"** to upload an audio file (e.g., MP3, WAV).
* Click **"Use Microphone"** to use live microphone input.
* Audio controls the shape deformation and particle movement intensity.

### Facial Expression Detection (Optional)
* Click **"Use Camera (Expressions)"** to start facial expression detection.
* Grant camera permissions when prompted.
* Your facial expressions will now control:
  - **Colors**: Different emotions create different color palettes
  - **Bloom effects**: Expression intensity affects glow strength
  - **Particle behavior**: Emotions change how particles move

### Manual Controls
* Use the controls in the top-right corner (dat.gui panel) to manually adjust:
  - Colors (red, green, blue sliders)
  - Bloom effect (threshold, strength, radius)
  - Visual effect type (icosahedron or particles)
* Move the mouse to slightly change the camera angle.

### Parameter Adjustment Guide

* **Color Settings**
  - Red: Adjust the red color component (0-1)
  - Green: Adjust the green color component (0-1)
  - Blue: Adjust the blue color component (0-1)
  - When using facial expressions, these update automatically based on emotions

* **Bloom Effect**
  - Threshold: Control the brightness threshold for bloom effect (0-1)
  - Strength: Control the overall intensity of the bloom effect (0-1)
  - Radius: Control the spread range of the bloom effect (0-1)
  - When using facial expressions, these adapt to expression intensity

* **Visual Effects**
  - Icosahedron: 3D mesh with Perlin noise displacement
  - Particles: Water ripple-like particle system

### Emotion to Visualization Mapping

When using facial expression detection:
- **Joy/Amusement** → Warm colors (yellow/red), energetic particles
- **Sadness** → Cool colors (blue), slow particle movement  
- **Anger** → Red/orange colors, chaotic particle behavior
- **Calm** → Soft blue colors, gentle particle flow
- **Surprise** → Bright colors, explosive particle effects

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments

* [WaelYasmina](https://www.youtube.com/@WaelYasmina) - Original tutorial creator
* [Three.js](https://threejs.org/) - 3D graphics library
* [dat.GUI](https://github.com/dataarts/dat.gui) - Lightweight UI controls library
