/**
 * Manages camera capture and WebSocket connection to Hume's Expression Measurement API
 * for real-time facial expression detection.
 */
export default class ExpressionManager {
    /**
     * Creates an ExpressionManager instance.
     * @param {string} apiKey - Hume API key for authentication
     * @param {object} options - Configuration options
     * @param {number} [options.captureInterval=300] - Milliseconds between frame captures
     * @param {number} [options.reconnectDelay=2000] - Milliseconds before reconnecting on disconnect
     */
    constructor(apiKey, options = {}) {
        if (!apiKey) {
            throw new Error('ExpressionManager requires a Hume API key.');
        }
        
        console.log('[ExpressionManager] Initializing with API key:', apiKey.substring(0, 10) + '...');
        
        this.apiKey = apiKey;
        this.captureInterval = options.captureInterval || 300; // ms
        this.reconnectDelay = options.reconnectDelay || 2000; // ms
        
        /** @type {MediaStream | null} */
        this.videoStream = null;
        /** @type {HTMLVideoElement | null} */
        this.videoElement = null;
        /** @type {HTMLCanvasElement | null} */
        this.canvas = null;
        /** @type {CanvasRenderingContext2D | null} */
        this.ctx = null;
        /** @type {WebSocket | null} */
        this.socket = null;
        /** @type {number | null} */
        this.captureTimer = null;
        /** @type {boolean} */
        this.isConnected = false;
        /** @type {boolean} */
        this.isCapturing = false;
        /** @type {boolean} */
        this.isMinimized = false;
        /** @type {object | null} Latest facial expression data */
        this.latestExpressions = null;
        /** @type {Function | null} Callback for expression updates */
        this.onExpressionsUpdate = null;
        /** @type {Function | null} Callback for connection status changes */
        this.onConnectionStatusChange = null;
        
        // WebSocket endpoint
        this.wsUrl = 'wss://api.hume.ai/v0/stream/models';
    }

    /**
     * Initializes camera access and starts expression detection.
     * @returns {Promise<void>}
     */
    async start() {
        console.log('[ExpressionManager] Starting...');
        try {
            await this._setupCamera();
            await this._connectWebSocket();
            this._startCapture();
            console.log('[ExpressionManager] Started successfully.');
        } catch (error) {
            console.error('[ExpressionManager] Failed to start:', error);
            if (this.onConnectionStatusChange) {
                this.onConnectionStatusChange({ connected: false, error: error.message });
            }
            throw error;
        }
    }

    /**
     * Stops camera capture and closes WebSocket connection.
     */
    stop() {
        console.log('[ExpressionManager] Stopping...');
        this._stopCapture();
        this._disconnectWebSocket();
        this._cleanupCamera();
        console.log('[ExpressionManager] Stopped.');
    }

    /**
     * Sets up camera access and video element.
     * @private
     */
    async _setupCamera() {
        console.log('[ExpressionManager] Setting up camera...');
        try {
            // Request camera access
            this.videoStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user' // Front-facing camera
                } 
            });
            
            console.log('[ExpressionManager] Camera access granted');
            
            // Create video container with minimize button
            this.videoContainer = document.createElement('div');
            this.videoContainer.id = 'camera-video-container';
            this.videoContainer.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                z-index: 1000;
                transition: transform 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out;
            `;
            
            // Create minimize button
            this.minimizeButton = document.createElement('button');
            this.minimizeButton.innerHTML = '−';
            this.minimizeButton.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                z-index: 1001;
                transition: background 0.2s ease;
            `;
            
            this.minimizeButton.addEventListener('mouseenter', () => {
                this.minimizeButton.style.background = 'rgba(0, 0, 0, 0.9)';
            });
            
            this.minimizeButton.addEventListener('mouseleave', () => {
                this.minimizeButton.style.background = 'rgba(0, 0, 0, 0.7)';
            });
            
            this.minimizeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMinimize();
            });
            
            // Create video element
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.videoStream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.style.cssText = `
                width: 200px;
                height: 150px;
                background-color: black;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                display: block;
            `;
            
            this.videoContainer.appendChild(this.videoElement);
            this.videoContainer.appendChild(this.minimizeButton);
            document.body.appendChild(this.videoContainer);
            
            // Create canvas for frame capture
            this.canvas = document.createElement('canvas');
            this.canvas.width = 640;
            this.canvas.height = 480;
            this.ctx = this.canvas.getContext('2d');
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.videoElement.addEventListener('loadedmetadata', resolve, { once: true });
            });
            
            console.log('[ExpressionManager] Camera setup complete');
        } catch (error) {
            console.error('[ExpressionManager] Error accessing camera:', error);
            throw new Error(`Camera access denied: ${error.message}`);
        }
    }

    /**
     * Establishes WebSocket connection to Hume API.
     * @private
     */
    async _connectWebSocket() {
        console.log('[ExpressionManager] Connecting to Hume API WebSocket...');
        return new Promise((resolve, reject) => {
            try {
                // Use query parameter for API key (browser WebSocket limitation)
                const url = `${this.wsUrl}?apiKey=${encodeURIComponent(this.apiKey)}`;
                console.log('[ExpressionManager] WebSocket URL:', this.wsUrl);
                
                this.socket = new WebSocket(url);
                
                this.socket.onopen = () => {
                    console.log('[ExpressionManager] ✅ WebSocket connected to Hume API');
                    this.isConnected = true;
                    
                    // Send initial configuration message
                    const configMessage = {
                        models: {
                            face: {}
                        }
                    };
                    console.log('[ExpressionManager] Sending config:', configMessage);
                    this.socket.send(JSON.stringify(configMessage));
                    
                    if (this.onConnectionStatusChange) {
                        this.onConnectionStatusChange({ connected: true });
                    }
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('[ExpressionManager] 📨 Received from Hume:', data);
                        this._processExpressionData(data);
                    } catch (error) {
                        console.warn('[ExpressionManager] Error parsing message:', error, event.data);
                    }
                };
                
                this.socket.onerror = (error) => {
                    console.error('[ExpressionManager] ❌ WebSocket error:', error);
                    this.isConnected = false;
                    if (this.onConnectionStatusChange) {
                        this.onConnectionStatusChange({ connected: false, error: 'WebSocket error' });
                    }
                    reject(error);
                };
                
                this.socket.onclose = (event) => {
                    console.log('[ExpressionManager] WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    if (this.onConnectionStatusChange) {
                        this.onConnectionStatusChange({ connected: false, error: 'Connection closed' });
                    }
                    
                    // Auto-reconnect if not intentionally closed
                    if (event.code !== 1000) { // 1000 = normal closure
                        setTimeout(() => {
                            console.log('[ExpressionManager] Attempting to reconnect...');
                            this._connectWebSocket().catch(err => {
                                console.error('[ExpressionManager] Reconnection failed:', err);
                            });
                        }, this.reconnectDelay);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Processes facial expression data from API response.
     * @private
     */
    _processExpressionData(data) {
        console.log('[ExpressionManager] Processing expression data...');
        
        if (data.face && data.face.predictions && data.face.predictions.length > 0) {
            const prediction = data.face.predictions[0];
            console.log('[ExpressionManager] 😊 Face detected! Predictions:', prediction);
            
            if (prediction.emotions && prediction.emotions.length > 0) {
                // Store latest expressions
                this.latestExpressions = {
                    emotions: prediction.emotions,
                    timestamp: Date.now()
                };
                
                // Log top 5 emotions
                const topEmotions = prediction.emotions
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5);
                console.log('[ExpressionManager] Top emotions:', topEmotions.map(e => `${e.name}: ${e.score.toFixed(3)}`).join(', '));
                
                // Notify listeners
                if (this.onExpressionsUpdate) {
                    console.log('[ExpressionManager] 🔔 Calling onExpressionsUpdate callback');
                    this.onExpressionsUpdate(this.latestExpressions);
                } else {
                    console.warn('[ExpressionManager] ⚠️ No onExpressionsUpdate callback registered!');
                }
            } else {
                console.log('[ExpressionManager] No emotions in prediction');
            }
        } else {
            console.log('[ExpressionManager] No face detected in frame');
        }
    }

    /**
     * Starts capturing video frames and sending them to the API.
     * @private
     */
    _startCapture() {
        if (this.isCapturing) return;
        
        console.log('[ExpressionManager] Starting frame capture...');
        this.isCapturing = true;
        this._captureFrame(); // Capture immediately
        
        this.captureTimer = setInterval(() => {
            if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
                this._captureFrame();
            }
        }, this.captureInterval);
        
        console.log('[ExpressionManager] Frame capture started (interval:', this.captureInterval, 'ms)');
    }

    /**
     * Stops capturing frames.
     * @private
     */
    _stopCapture() {
        this.isCapturing = false;
        if (this.captureTimer) {
            clearInterval(this.captureTimer);
            this.captureTimer = null;
        }
        console.log('[ExpressionManager] Frame capture stopped');
    }

    /**
     * Captures a single frame from video and sends it to the API.
     * @private
     */
    _captureFrame() {
        if (!this.videoElement || !this.canvas || !this.ctx || !this.socket) {
            return;
        }
        
        try {
            // Draw video frame to canvas
            this.ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convert to base64
            const base64Image = this.canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            
            // Send to API
            if (this.socket.readyState === WebSocket.OPEN) {
                const message = {
                    data: base64Image,
                    models: {
                        face: {}
                    }
                };
                console.log('[ExpressionManager] 📸 Sending frame (base64 length:', base64Image.length, ')');
                this.socket.send(JSON.stringify(message));
            } else {
                console.warn('[ExpressionManager] WebSocket not open, readyState:', this.socket.readyState);
            }
        } catch (error) {
            console.warn('[ExpressionManager] Error capturing frame:', error);
        }
    }

    /**
     * Disconnects WebSocket connection.
     * @private
     */
    _disconnectWebSocket() {
        if (this.socket) {
            this.socket.close(1000, 'Intentional closure');
            this.socket = null;
        }
        this.isConnected = false;
    }

    /**
     * Minimizes the camera video display.
     */
    minimize() {
        if (this.isMinimized || !this.videoContainer) return;
        
        this.isMinimized = true;
        this.minimizeButton.innerHTML = '+';
        this.videoContainer.style.width = '60px';
        this.videoContainer.style.height = '60px';
        this.videoElement.style.width = '60px';
        this.videoElement.style.height = '60px';
        this.videoElement.style.opacity = '0.3';
        
        console.log('[ExpressionManager] Camera minimized');
    }
    
    /**
     * Maximizes the camera video display.
     */
    maximize() {
        if (!this.isMinimized || !this.videoContainer) return;
        
        this.isMinimized = false;
        this.minimizeButton.innerHTML = '−';
        this.videoContainer.style.width = 'auto';
        this.videoContainer.style.height = 'auto';
        this.videoElement.style.width = '200px';
        this.videoElement.style.height = '150px';
        this.videoElement.style.opacity = '1';
        
        console.log('[ExpressionManager] Camera maximized');
    }
    
    /**
     * Toggles between minimized and maximized states.
     */
    toggleMinimize() {
        if (this.isMinimized) {
            this.maximize();
        } else {
            this.minimize();
        }
    }
    
    /**
     * Cleans up camera resources.
     * @private
     */
    _cleanupCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
        
        if (this.videoContainer) {
            if (this.videoContainer.parentNode) {
                this.videoContainer.parentNode.removeChild(this.videoContainer);
            }
            this.videoContainer = null;
        }
        
        if (this.videoElement) {
            this.videoElement = null;
        }
        
        this.canvas = null;
        this.ctx = null;
    }

    /**
     * Gets the latest facial expression data.
     * @returns {object | null}
     */
    getLatestExpressions() {
        return this.latestExpressions;
    }

    /**
     * Sets callback for expression updates.
     * @param {Function} callback - Called with expression data when new data arrives
     */
    setOnExpressionsUpdate(callback) {
        console.log('[ExpressionManager] Registering onExpressionsUpdate callback');
        this.onExpressionsUpdate = callback;
    }

    /**
     * Sets callback for connection status changes.
     * @param {Function} callback - Called with status object {connected: boolean, error?: string}
     */
    setOnConnectionStatusChange(callback) {
        console.log('[ExpressionManager] Registering onConnectionStatusChange callback');
        this.onConnectionStatusChange = callback;
    }
}
