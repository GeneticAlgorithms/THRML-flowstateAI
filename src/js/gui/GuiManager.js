import { GUI } from 'lil-gui';

/**
 * Manages the dat.gui interface for controlling visual parameters.
 * It takes initial parameters and callbacks to notify other modules of changes.
 */
export default class GuiManager {
    /**
     * Creates a GuiManager instance and sets up the GUI controls.
     * @param {object} params - An object containing the initial values for the GUI controls.
     * @param {object} callbacks - An object containing callback functions to execute when GUI values change.
     * @param {function(object): void} callbacks.onColorChange - Called when color parameters change.
     * @param {function(object): void} callbacks.onBloomChange - Called when bloom parameters change.
     * @param {function(string): void} callbacks.onEffectChange - Called when the visual effect selection changes.
     * @param {function(): void} callbacks.onFileUploadRequest - Called when the user clicks the upload button.
     * @param {function(): void} callbacks.onMicInputRequest - Called when the user clicks the microphone input button.
     * @param {function(): void} callbacks.onCameraInputRequest - Called when the user clicks the camera input button.
     */
    constructor(params, callbacks) {
        /** @type {GUI} The dat.gui instance */
        this.gui = new GUI();
        /** @type {object} Local copy or reference to the parameters controlled by the GUI */
        this.params = params; // Store initial parameters
        /** @type {object} Callbacks to invoke on parameter changes */
        this.callbacks = callbacks; // Store callbacks for updates
        
        /** @type {object} Store references to GUI controls for programmatic updates */
        this.controls = {
            colors: {},
            bloom: {}
        };
        
        /** @type {boolean} Track microphone state */
        this.micActive = false;
        /** @type {boolean} Track camera state */
        this.cameraActive = false;
        /** @type {boolean} Track voice assistant state */
        this.voiceAssistantActive = false;

        this._setupColorControls();
        this._setupBloomControls();
        this._setupEffectControls();
        this._setupUploadControl();
        this._setupMicInputControl();
        this._setupCameraInputControl();
        this._setupVoiceAssistantControl();
        
        // Collapse the GUI on startup
        this.gui.close();
    }

    /**
     * Sets up the dat.gui controls for color parameters.
     * @private
     */
    _setupColorControls() {
        const colorsFolder = this.gui.addFolder('Colors');
        // Link GUI control for 'red' to params.red
        this.controls.colors.red = colorsFolder.add(this.params, 'red', 0, 1).name('Red').onChange((value) => {
            // When the slider changes, call the registered callback
            if (this.callbacks.onColorChange && !this._silentUpdate) {
                this.callbacks.onColorChange({ u_red: Number(value) }); // Pass updated value
            }
        });
         // Link GUI control for 'green' to params.green
        this.controls.colors.green = colorsFolder.add(this.params, 'green', 0, 1).name('Green').onChange((value) => {
            if (this.callbacks.onColorChange && !this._silentUpdate) {
                this.callbacks.onColorChange({ u_green: Number(value) });
            }
        });
         // Link GUI control for 'blue' to params.blue
        this.controls.colors.blue = colorsFolder.add(this.params, 'blue', 0, 1).name('Blue').onChange((value) => {
            if (this.callbacks.onColorChange && !this._silentUpdate) {
                this.callbacks.onColorChange({ u_blue: Number(value) });
            }
        });
        // colorsFolder.open(); // Optional: Keep the folder open by default
    }

    /**
     * Sets up the dat.gui controls for bloom effect parameters.
     * @private
     */
    _setupBloomControls() {
        const bloomFolder = this.gui.addFolder('Bloom');
         // Link GUI control for 'threshold' to params.threshold
        this.controls.bloom.threshold = bloomFolder.add(this.params, 'threshold', 0, 1).name('Threshold').onChange((value) => {
            if (this.callbacks.onBloomChange && !this._silentUpdate) {
                this.callbacks.onBloomChange({ threshold: Number(value) });
            }
        });
         // Link GUI control for 'strength' to params.strength
        this.controls.bloom.strength = bloomFolder.add(this.params, 'strength', 0, 1).name('Strength').onChange((value) => {
            if (this.callbacks.onBloomChange && !this._silentUpdate) {
                this.callbacks.onBloomChange({ strength: Number(value) });
            }
        });
         // Link GUI control for 'radius' to params.radius
        this.controls.bloom.radius = bloomFolder.add(this.params, 'radius', 0, 1).name('Radius').onChange((value) => {
            if (this.callbacks.onBloomChange && !this._silentUpdate) {
                this.callbacks.onBloomChange({ radius: Number(value) });
            }
        });
        // bloomFolder.open(); // Optional: Keep the folder open by default
    }

    /**
     * Sets up the dat.gui control for selecting the visual effect.
     * @private
     */
    _setupEffectControls() {
        // Add control directly to the main GUI, not in a folder
        this.gui.add(this.params, 'visualEffect', ['icosahedron', 'particles', 'codeRain'])
            .name('Visual Effect')
            .onChange((value) => {
                 if (this.callbacks.onEffectChange) {
                     this.callbacks.onEffectChange(value); // Pass the selected effect name string
                 }
            });
    }

    /**
     * Sets up the dat.gui control for triggering the audio file upload.
     * @private
     */
    _setupUploadControl() {
        // Add a simple object with a function property to act as the button's action
        const uploadTrigger = {
            upload: () => {
                if (this.callbacks.onFileUploadRequest) {
                    this.callbacks.onFileUploadRequest();
                }
            }
        };
        // Add the button to the main GUI
        this.gui.add(uploadTrigger, 'upload').name('Upload Audio');
    }

    /**
     * Sets up the dat.gui control for toggling microphone input.
     * @private
     */
    _setupMicInputControl() {
        const micTrigger = {
            toggleMic: () => {
                if (this.callbacks.onMicToggleRequest) {
                    this.micActive = !this.micActive;
                    console.log(`Mic toggle clicked, new state: ${this.micActive ? 'ON' : 'OFF'}`);
                    this.callbacks.onMicToggleRequest(this.micActive);
                    // Update button text
                    this.updateMicButtonText();
                }
            }
        };
        // Add the button to the main GUI
        this.micButton = this.gui.add(micTrigger, 'toggleMic').name('🎤 Microphone: OFF');
    }

    /**
     * Sets up the dat.gui control for toggling camera input for facial expressions.
     * @private
     */
    _setupCameraInputControl() {
        const cameraTrigger = {
            toggleCamera: () => {
                if (this.callbacks.onCameraToggleRequest) {
                    this.cameraActive = !this.cameraActive;
                    console.log(`Camera toggle clicked, new state: ${this.cameraActive ? 'ON' : 'OFF'}`);
                    this.callbacks.onCameraToggleRequest(this.cameraActive);
                    // Update button text
                    this.updateCameraButtonText();
                }
            }
        };
        // Add the button to the main GUI
        this.cameraButton = this.gui.add(cameraTrigger, 'toggleCamera').name('📹 Camera: OFF');
    }
    
    /**
     * Sets up the dat.gui control for toggling voice assistant.
     * @private
     */
    _setupVoiceAssistantControl() {
        const voiceTrigger = {
            toggleVoice: () => {
                if (this.callbacks.onVoiceAssistantToggleRequest) {
                    this.voiceAssistantActive = !this.voiceAssistantActive;
                    console.log(`Voice assistant toggle clicked, new state: ${this.voiceAssistantActive ? 'ON' : 'OFF'}`);
                    this.callbacks.onVoiceAssistantToggleRequest(this.voiceAssistantActive);
                    // Update button text
                    this.updateVoiceAssistantButtonText();
                }
            }
        };
        // Add the button to the main GUI
        this.voiceAssistantButton = this.gui.add(voiceTrigger, 'toggleVoice').name('🎙️ Voice Assistant: OFF');
    }

    /**
     * Updates a slider value programmatically without triggering callbacks.
     * @param {string} category - Control category ('colors' or 'bloom')
     * @param {string} name - Control name (e.g., 'red', 'threshold')
     * @param {number} value - New value to set
     * @param {boolean} silent - If true, don't trigger callbacks (default: true)
     */
    updateSliderValue(category, name, value, silent = true) {
        if (!this.controls[category] || !this.controls[category][name]) {
            console.warn(`Control not found: ${category}.${name}`);
            return;
        }

        // Set silent flag to prevent callback execution
        this._silentUpdate = silent;
        
        // Update the parameter value (which will update the slider)
        this.params[name] = Number(value);
        
        // Force GUI to update
        this.controls[category][name].updateDisplay();
        
        // Clear silent flag
        this._silentUpdate = false;
    }

    /**
     * Updates color sliders programmatically.
     * @param {object} colors - Object with u_red, u_green, u_blue values
     * @param {boolean} silent - If true, don't trigger callbacks (default: true)
     */
    updateColors(colors, silent = true) {
        if (colors.u_red !== undefined) {
            this.updateSliderValue('colors', 'red', colors.u_red, silent);
        }
        if (colors.u_green !== undefined) {
            this.updateSliderValue('colors', 'green', colors.u_green, silent);
        }
        if (colors.u_blue !== undefined) {
            this.updateSliderValue('colors', 'blue', colors.u_blue, silent);
        }
        
        // If not silent, trigger callback once with all values
        if (!silent && this.callbacks.onColorChange) {
            this.callbacks.onColorChange({
                u_red: colors.u_red !== undefined ? colors.u_red : this.params.red,
                u_green: colors.u_green !== undefined ? colors.u_green : this.params.green,
                u_blue: colors.u_blue !== undefined ? colors.u_blue : this.params.blue
            });
        }
    }

    /**
     * Updates bloom sliders programmatically.
     * @param {object} bloom - Object with threshold, strength, radius values
     * @param {boolean} silent - If true, don't trigger callbacks (default: true)
     */
    updateBloom(bloom, silent = true) {
        if (bloom.threshold !== undefined) {
            this.updateSliderValue('bloom', 'threshold', bloom.threshold, silent);
        }
        if (bloom.strength !== undefined) {
            this.updateSliderValue('bloom', 'strength', bloom.strength, silent);
        }
        if (bloom.radius !== undefined) {
            this.updateSliderValue('bloom', 'radius', bloom.radius, silent);
        }
        
        // If not silent, trigger callback once with all values
        if (!silent && this.callbacks.onBloomChange) {
            this.callbacks.onBloomChange({
                threshold: bloom.threshold !== undefined ? bloom.threshold : this.params.threshold,
                strength: bloom.strength !== undefined ? bloom.strength : this.params.strength,
                radius: bloom.radius !== undefined ? bloom.radius : this.params.radius
            });
        }
    }

    /**
     * Updates the microphone button text based on state.
     */
    updateMicButtonText() {
        if (this.micButton) {
            this.micButton.name(this.micActive ? '🎤 Microphone: ON' : '🎤 Microphone: OFF');
        }
    }
    
    /**
     * Updates the camera button text based on state.
     */
    updateCameraButtonText() {
        if (this.cameraButton) {
            this.cameraButton.name(this.cameraActive ? '📹 Camera: ON' : '📹 Camera: OFF');
        }
    }
    
    /**
     * Sets the microphone active state.
     * @param {boolean} active
     */
    setMicActive(active) {
        this.micActive = active;
        this.updateMicButtonText();
    }
    
    /**
     * Sets the camera active state.
     * @param {boolean} active
     */
    setCameraActive(active) {
        this.cameraActive = active;
        this.updateCameraButtonText();
    }
    
    /**
     * Updates the voice assistant button text based on state.
     */
    updateVoiceAssistantButtonText() {
        if (this.voiceAssistantButton) {
            this.voiceAssistantButton.name(this.voiceAssistantActive ? '🎙️ Voice Assistant: ON' : '🎙️ Voice Assistant: OFF');
        }
    }
    
    /**
     * Sets the voice assistant active state.
     * @param {boolean} active
     */
    setVoiceAssistantActive(active) {
        this.voiceAssistantActive = active;
        this.updateVoiceAssistantButtonText();
    }
    
    // Optional: Method to hide/show GUI
    // toggleVisibility() { ... }
} 