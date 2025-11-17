/**
 * Manages voice interaction with conversational AI and text-to-speech.
 * Handles speech recognition, AI conversation, and audio responses.
 */
export default class VoiceAssistant {
    /**
     * Creates a VoiceAssistant instance.
     * @param {object} options - Configuration options
     * @param {string} [options.claudeApiKey] - Anthropic Claude API key for conversational AI
     * @param {string} [options.openaiApiKey] - OpenAI API key (deprecated, use claudeApiKey)
     * @param {string} [options.elevenlabsApiKey] - ElevenLabs API key for TTS
     * @param {string} [options.elevenlabsVoiceId] - ElevenLabs voice ID (default: '21m00Tcm4TlvDq8ikWAM')
     * @param {string} [options.model] - Claude model to use (default: 'claude-3-haiku-20240307')
     */
    constructor(options = {}) {
        // Support both Claude and OpenAI (Claude takes priority)
        this.claudeApiKey = options.claudeApiKey || process.env.PUBLIC_CLAUDE_API_KEY || process.env.PUBLIC_ANTHROPIC_API_KEY || '';
        this.openaiApiKey = options.openaiApiKey || process.env.PUBLIC_OPENAI_API_KEY || '';
        this.elevenlabsApiKey = options.elevenlabsApiKey || process.env.PUBLIC_ELEVENLABS_API_KEY || '';
        this.elevenlabsVoiceId = options.elevenlabsVoiceId || '21m00Tcm4TlvDq8ikWAM'; // Default voice
        this.model = options.model || 'claude-3-haiku-20240307'; // Claude model
        this.useClaude = !!this.claudeApiKey; // Use Claude if key is available
        
        // Speech recognition
        this.recognition = null;
        this.isListening = false;
        this.isProcessing = false;
        this.shouldAutoRestart = false; // Flag to control auto-restart behavior
        
        // Conversation history (format depends on API)
        this.conversationHistory = [];
        this.systemPrompt = 'You are a helpful AI assistant integrated into FlowState, an immersive audio-visual experience. Keep responses concise and engaging.';
        
        // Initialize conversation history based on API
        if (this.useClaude) {
            // Claude uses messages array format
            this.conversationHistory = [];
        } else {
            // OpenAI format (for backward compatibility)
            this.conversationHistory = [
                {
                    role: 'system',
                    content: this.systemPrompt
                }
            ];
        }
        
        // Callbacks
        this.onTranscript = null;
        this.onResponse = null;
        this.onError = null;
        this.onListeningStateChange = null;
        
        // Audio context for playing responses
        this.audioContext = null;
        
        this._initializeSpeechRecognition();
        this._initializeAudioContext();
        
        console.log('[VoiceAssistant] Initialized');
    }
    
    /**
     * Initializes the Web Speech API recognition.
     * @private
     */
    _initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('[VoiceAssistant] Speech recognition not supported in this browser');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // Keep listening continuously
        this.recognition.interimResults = false; // Only final results
        this.recognition.lang = 'en-US';
        // Increase timeout to give users more time to speak
        if (this.recognition.serviceURI) {
            // Some browsers support serviceURI for custom timeout
        }
        
        this.recognition.onstart = () => {
            this.isListening = true;
            console.log('[VoiceAssistant] Started listening');
            if (this.onListeningStateChange) {
                this.onListeningStateChange(true);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            console.log('[VoiceAssistant] Stopped listening');
            if (this.onListeningStateChange) {
                this.onListeningStateChange(false);
            }
            
            // Auto-restart listening if it was active (handles "no-speech" and other recoverable errors)
            // Only restart if we're not processing and recognition was intentionally started
            if (this.shouldAutoRestart && !this.isProcessing) {
                setTimeout(() => {
                    if (!this.isListening && !this.isProcessing) {
                        console.log('[VoiceAssistant] Auto-restarting after end event');
                        try {
                            this.recognition.start();
                        } catch (error) {
                            // Ignore errors from restart attempts
                            console.log('[VoiceAssistant] Could not restart:', error.message);
                        }
                    }
                }, 100);
            }
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('[VoiceAssistant] Transcript:', transcript);
            
            if (this.onTranscript) {
                this.onTranscript(transcript);
            }
            
            // Process the transcript with AI
            this.processUserInput(transcript);
        };
        
        this.recognition.onerror = (event) => {
            const errorType = event.error;
            console.log('[VoiceAssistant] Recognition event:', errorType);
            
            // Handle different error types
            switch (errorType) {
                case 'no-speech':
                    // This is normal - user didn't speak within timeout
                    // Don't show error, just log it
                    console.log('[VoiceAssistant] No speech detected (this is normal)');
                    // Recognition will auto-restart via onend handler
                    break;
                    
                case 'audio-capture':
                    // Microphone not available or not working
                    console.error('[VoiceAssistant] Microphone not available');
                    if (this.onError) {
                        this.onError('Microphone not available. Please check your microphone permissions.');
                    }
                    this.shouldAutoRestart = false; // Stop auto-restarting
                    break;
                    
                case 'not-allowed':
                    // Permission denied
                    console.error('[VoiceAssistant] Microphone permission denied');
                    if (this.onError) {
                        this.onError('Microphone permission denied. Please allow microphone access.');
                    }
                    this.shouldAutoRestart = false; // Stop auto-restarting
                    break;
                    
                case 'network':
                    // Network error
                    console.error('[VoiceAssistant] Network error');
                    if (this.onError) {
                        this.onError('Network error. Please check your connection.');
                    }
                    break;
                    
                case 'aborted':
                    // User or system aborted
                    console.log('[VoiceAssistant] Recognition aborted');
                    // Don't show error for aborted - it's intentional
                    break;
                    
                default:
                    // Other errors - show to user
                    console.error('[VoiceAssistant] Recognition error:', errorType);
                    if (this.onError && errorType !== 'no-speech') {
                        this.onError(`Speech recognition error: ${errorType}`);
                    }
            }
        };
    }
    
    /**
     * Initializes the audio context for playing responses.
     * @private
     */
    _initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('[VoiceAssistant] Failed to initialize audio context:', error);
        }
    }
    
    /**
     * Starts listening for voice input.
     */
    startListening() {
        if (!this.recognition) {
            console.error('[VoiceAssistant] Speech recognition not available');
            if (this.onError) {
                this.onError('Speech recognition not supported in this browser');
            }
            return;
        }
        
        if (this.isListening) {
            console.log('[VoiceAssistant] Already listening');
            return;
        }
        
        if (this.isProcessing) {
            console.log('[VoiceAssistant] Still processing previous request');
            return;
        }
        
        // Enable auto-restart for continuous listening
        this.shouldAutoRestart = true;
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('[VoiceAssistant] Failed to start recognition:', error);
            // Don't show error for "already started" - it's recoverable
            if (error.message && !error.message.includes('already started')) {
                if (this.onError) {
                    this.onError(error.message);
                }
            }
        }
    }
    
    /**
     * Stops listening for voice input.
     */
    stopListening() {
        // Disable auto-restart
        this.shouldAutoRestart = false;
        
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    /**
     * Processes user input through conversational AI (Claude or OpenAI).
     * @param {string} userInput - The user's spoken input
     */
    async processUserInput(userInput) {
        const apiKey = this.useClaude ? this.claudeApiKey : this.openaiApiKey;
        
        if (!apiKey) {
            console.warn('[VoiceAssistant] API key not configured');
            if (this.onError) {
                this.onError('AI service not configured');
            }
            return;
        }
        
        if (this.isProcessing) {
            console.log('[VoiceAssistant] Already processing a request');
            return;
        }
        
        this.isProcessing = true;
        
        try {
            let aiResponse;
            
            if (this.useClaude) {
                // Use Claude API
                aiResponse = await this._callClaudeAPI(userInput);
            } else {
                // Use OpenAI API (backward compatibility)
                aiResponse = await this._callOpenAIAPI(userInput);
            }
            
            console.log('[VoiceAssistant] AI Response:', aiResponse);
            
            if (this.onResponse) {
                this.onResponse(aiResponse);
            }
            
            // Convert to speech using ElevenLabs
            await this.speak(aiResponse);
            
        } catch (error) {
            console.error('[VoiceAssistant] Error processing input:', error);
            if (this.onError) {
                this.onError(error.message);
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * Calls Claude API via Vercel serverless function proxy (to avoid CORS issues).
     * @param {string} userInput - User's input
     * @returns {Promise<string>} AI response
     * @private
     */
    async _callClaudeAPI(userInput) {
        // Add user message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userInput
        });
        
        // Use conversation history directly (system prompt is sent separately)
        const messages = this.conversationHistory;
        
        // Use Vercel serverless function proxy to avoid CORS issues
        // The API key is stored server-side, so we don't send it from the client
        const proxyUrl = '/api/claude';
        
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                max_tokens: 200,
                messages: messages,
                system: this.systemPrompt
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.content[0].text;
        
        // Add AI response to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        // Keep conversation history manageable (last 10 messages)
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
        
        return aiResponse;
    }
    
    /**
     * Calls OpenAI API (backward compatibility).
     * @param {string} userInput - User's input
     * @returns {Promise<string>} AI response
     * @private
     */
    async _callOpenAIAPI(userInput) {
        // Add user message to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: userInput
        });
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openaiApiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: this.conversationHistory,
                max_tokens: 150,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to conversation history
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        // Keep conversation history manageable (last 10 messages)
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = [
                this.conversationHistory[0], // Keep system message
                ...this.conversationHistory.slice(-9) // Keep last 9 messages
            ];
        }
        
        return aiResponse;
    }
    
    /**
     * Converts text to speech using ElevenLabs API.
     * @param {string} text - Text to convert to speech
     */
    async speak(text) {
        if (!this.elevenlabsApiKey) {
            console.warn('[VoiceAssistant] ElevenLabs API key not configured, using browser TTS');
            this._speakWithBrowserTTS(text);
            return;
        }
        
        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${this.elevenlabsVoiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.elevenlabsApiKey
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_monolingual_v1',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75
                        }
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }
            
            const audioData = await response.arrayBuffer();
            await this._playAudio(audioData);
            
        } catch (error) {
            console.error('[VoiceAssistant] Error with ElevenLabs TTS:', error);
            console.log('[VoiceAssistant] Falling back to browser TTS');
            this._speakWithBrowserTTS(text);
        }
    }
    
    /**
     * Plays audio from an ArrayBuffer.
     * @param {ArrayBuffer} audioData - Audio data to play
     * @private
     */
    async _playAudio(audioData) {
        if (!this.audioContext) {
            await this._initializeAudioContext();
        }
        
        try {
            const audioBuffer = await this.audioContext.decodeAudioData(audioData);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(0);
            
            // Wait for audio to finish playing
            await new Promise((resolve) => {
                source.onended = resolve;
            });
        } catch (error) {
            console.error('[VoiceAssistant] Error playing audio:', error);
        }
    }
    
    /**
     * Falls back to browser's built-in text-to-speech.
     * @param {string} text - Text to speak
     * @private
     */
    _speakWithBrowserTTS(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn('[VoiceAssistant] Browser TTS not available');
        }
    }
    
    /**
     * Sets callback for when transcript is received.
     * @param {Function} callback - Called with transcript text
     */
    setOnTranscript(callback) {
        this.onTranscript = callback;
    }
    
    /**
     * Sets callback for when AI response is received.
     * @param {Function} callback - Called with response text
     */
    setOnResponse(callback) {
        this.onResponse = callback;
    }
    
    /**
     * Sets callback for errors.
     * @param {Function} callback - Called with error message
     */
    setOnError(callback) {
        this.onError = callback;
    }
    
    /**
     * Sets callback for listening state changes.
     * @param {Function} callback - Called with boolean (true = listening, false = not listening)
     */
    setOnListeningStateChange(callback) {
        this.onListeningStateChange = callback;
    }
    
    /**
     * Clears conversation history.
     */
    clearHistory() {
        this.conversationHistory = [];
        console.log('[VoiceAssistant] Conversation history cleared');
    }
    
    /**
     * Gets the current listening state.
     * @returns {boolean}
     */
    getIsListening() {
        return this.isListening;
    }
    
    /**
     * Gets the current processing state.
     * @returns {boolean}
     */
    getIsProcessing() {
        return this.isProcessing;
    }
}

