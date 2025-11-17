import * as THREE from 'three';
import SceneManager from './core/SceneManager';
import AudioManager from './audio/AudioManager';
import GuiManager from './gui/GuiManager';
import PostProcessor from './effects/PostProcessor';
import ExpressionManager from './expression/ExpressionManager';
import ExpressionMapper from './expression/ExpressionMapper';
import MoodPlaylistManager from './audio/MoodPlaylistManager';
import MoodDisplay from './ui/MoodDisplay';
import YouTubeAudioManager from './audio/YouTubeAudioManager';
import VoiceAssistant from './voice/VoiceAssistant';
import ConversationDisplay from './ui/ConversationDisplay';
import PbitDisplay from './ui/PbitDisplay';
import PbitSonifier from './audio/PbitSonifier';
import Navbar from './ui/Navbar';
import WhitepaperView from './ui/WhitepaperView';
import Stats from 'stats.js';
// Logo removed - no longer needed
// import LogoDisplay from './ui/LogoDisplay';
// import logoUrl from '../static/logo.png';

/**
 * Main application entry point.
 * Initializes all modules (Scene, Audio, GUI, PostProcessing)
 * and runs the main animation loop.
 */

console.log('main.js loaded');
console.log('Starting audio visualizer initialization...');

// Get loading screen element
const loadingScreen = document.getElementById('loading-screen');
const loadingText = document.querySelector('.loading-text');

function updateLoadingText(text) {
    if (loadingText) {
        loadingText.textContent = text;
    }
}

function hideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

// --- Global Variables & Parameters ---

/** @type {number} Normalized mouse X position (-1 to 1, approx) */
let mouseX = 0;
/** @type {number} Normalized mouse Y position (-1 to 1, approx) */
let mouseY = 0;

// Central object to hold parameters controllable by the GUI.
// This makes it easy to pass initial values and link GUI updates.
const effectParams = {
	red: 1.0,       // Initial red color component for the shader
	green: 1.0,     // Initial green color component
	blue: 1.0,      // Initial blue color component
	threshold: 0.3, // Adjusted bloom effect threshold
	strength: 0.25,  // Adjusted bloom effect strength
	radius: 0.8,    // Initial bloom effect radius
	visualEffect: 'icosahedron' // Change default to icosahedron
};

// --- Module Instances ---
// Declare module variables in the outer scope
/** @type {SceneManager | null} */
let sceneManager = null;
/** @type {AudioManager | null} */
let audioManager = null;
/** @type {GuiManager | null} */
let guiManager = null;
/** @type {PostProcessor | null} */
let postProcessor = null;
/** @type {ExpressionManager | null} */
let expressionManager = null;
/** @type {ExpressionMapper | null} */
let expressionMapper = null;
/** @type {MoodPlaylistManager | null} */
let moodPlaylistManager = null;
/** @type {MoodDisplay | null} */
let moodDisplay = null;
/** @type {YouTubeAudioManager | null} */
let youtubeAudioManager = null;
/** @type {VoiceAssistant | null} */
let voiceAssistant = null;
/** @type {ConversationDisplay | null} */
let conversationDisplay = null;
/** @type {PbitDisplay | null} */
let pbitDisplay = null;
/** @type {PbitSonifier | null} */
let pbitSonifier = null;
/** @type {Navbar | null} */
let navbar = null;
/** @type {WhitepaperView | null} */
let whitepaperView = null;
/** @type {Stats | null} */
let stats = null;
// Logo removed - no longer needed
// /** @type {LogoDisplay | null} */
// let logoDisplay = null;
/** @type {THREE.Clock} Used for getting delta time and elapsed time */
const clock = new THREE.Clock();
/** @type {HTMLInputElement | null} Hidden file input for audio */
let hiddenFileInput = null;

// Hume API key - can be set via environment variable (process.env.PUBLIC_HUME_API_KEY for Parcel v2)
// or via window.HUME_API_KEY for browser console testing
// If not set, facial expression detection will be disabled
const HUME_API_KEY = process.env.PUBLIC_HUME_API_KEY || process.env.HUME_API_KEY || window.HUME_API_KEY || '';

// AI API keys - can be set via environment variables or window globals
const CLAUDE_API_KEY = process.env.PUBLIC_CLAUDE_API_KEY || process.env.PUBLIC_ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || window.CLAUDE_API_KEY || '';
const OPENAI_API_KEY = process.env.PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || window.OPENAI_API_KEY || '';
const ELEVENLABS_API_KEY = process.env.PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || window.ELEVENLABS_API_KEY || '';

// --- Initialization Function ---
/**
 * Initializes all application modules and starts the animation loop.
 */
function init() {
    // --- Create Hidden File Input ---
    hiddenFileInput = document.createElement('input');
    hiddenFileInput.type = 'file';
    hiddenFileInput.accept = 'audio/*';
    hiddenFileInput.style.display = 'none'; // Keep it hidden
    hiddenFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && audioManager) {
            audioManager.loadAndPlayFile(file);
        }
        // Reset the input value to allow uploading the same file again
        event.target.value = null; 
    });
    document.body.appendChild(hiddenFileInput); // Add it to the DOM

    // 1. Initialize Core Scene
    updateLoadingText('Initializing 3D scene...');
    sceneManager = new SceneManager();
    console.log('✅ SceneManager initialized'); 
    
    // 2. Initialize Audio (needs the camera from SceneManager for the listener)
    updateLoadingText('Setting up audio system...');
    audioManager = new AudioManager(sceneManager.getCamera());
    console.log('✅ AudioManager initialized');
    
    // 2a. Initialize Mood Display first (so we can get the video container)
    updateLoadingText('Creating UI elements...');
    moodDisplay = new MoodDisplay();
    console.log('✅ MoodDisplay initialized');
    
    // 2b. Initialize YouTube Audio Manager with the mood display's video container
    youtubeAudioManager = new YouTubeAudioManager(moodDisplay.getVideoContainer());
    
    // 2c. Initialize Mood Playlist Manager with both audio managers
    moodPlaylistManager = new MoodPlaylistManager(audioManager, youtubeAudioManager);
    
    // 2d. Initialize Logo Display (DISABLED)
    // logoDisplay = new LogoDisplay(logoUrl);
    
    // Setup callbacks for mood and song changes
    moodPlaylistManager.setOnMoodChange((mood) => {
        if (moodDisplay) {
            moodDisplay.updateMood(mood);
        }
    });
    
    moodPlaylistManager.setOnSongChange((song) => {
        if (moodDisplay) {
            moodDisplay.updateSong(song);
            moodDisplay.showVideo(); // Show video when song changes
        }
    }); 

    // Don't load default audio - wait for mood detection to start music
    console.log('Audio system ready. Music will start when mood is detected.');
    
    // 3. Initialize Post-Processing (needs renderer, scene, camera, and initial params)
    updateLoadingText('Initializing effects...');
    postProcessor = new PostProcessor(
        sceneManager.getRenderer(), 
        sceneManager.getScene(), 
        sceneManager.getCamera(),
        {
            threshold: effectParams.threshold,
            strength: effectParams.strength,
            radius: effectParams.radius
        } // Pass initial bloom params
    );

    // 4. Initialize GUI
    // Define callback functions that GuiManager will call when sliders change.
    const guiCallbacks = {
        /** Updates shader color uniforms via SceneManager */
        onColorChange: (colorParams) => {
            if (sceneManager) {
                 sceneManager.updateShaderUniforms(colorParams);
            }
        },
        /** Updates bloom effect parameters via PostProcessor */
        onBloomChange: (bloomParams) => {
            if (postProcessor) {
                 postProcessor.updateParams(bloomParams);
            }
        },
        /** Switches the active visual effect via SceneManager */
        onEffectChange: (effectName) => {
            console.log('Switching effect to:', effectName);
            if (sceneManager) {
                sceneManager.setActiveEffect(effectName); 
            }
        },
        /** Triggers the hidden file input click */
        onFileUploadRequest: () => {
            if (hiddenFileInput) {
                hiddenFileInput.click();
            }
        },
        /** Toggles microphone input on/off */
        onMicToggleRequest: (enable) => {
            if (enable) {
                console.log('[Main] User requested microphone ON');
                if (audioManager) {
                    audioManager.startMicrophoneInput()
                        .then(() => {
                            console.log('[Main] Microphone turned ON successfully');
                            if (guiManager) guiManager.setMicActive(true);
                        })
                        .catch(err => {
                            console.error('[Main] Failed to turn microphone ON:', err);
                            if (guiManager) guiManager.setMicActive(false);
                            alert('Failed to access microphone. Please check permissions.');
                        });
                }
            } else {
                console.log('[Main] User requested microphone OFF');
                // Stop microphone
                if (audioManager && audioManager._disconnectMicrophone) {
                    audioManager._disconnectMicrophone();
                    if (guiManager) guiManager.setMicActive(false);
                    console.log('[Main] Microphone turned OFF');
                }
            }
        },
        /** Toggles camera input on/off for facial expressions */
        onCameraToggleRequest: (enable) => {
            if (enable) {
                startExpressionDetection();
            } else {
                stopExpressionDetection();
            }
        },
        /** Toggles voice assistant on/off */
        onVoiceAssistantToggleRequest: (enable) => {
            if (enable) {
                startVoiceAssistant();
            } else {
                stopVoiceAssistant();
            }
        },
        /** Toggles pbit sonifier on/off */
        onPbitSonifierToggleRequest: (enable) => {
            if (pbitSonifier) {
                if (enable) {
                    if (!pbitSonifier.isInitialized) {
                        // Try to initialize if not already done
                        const initSonifier = async () => {
                            if (sceneManager && sceneManager.thermodynamicVisualizer) {
                                const pbitCount = sceneManager.thermodynamicVisualizer.pbitCount || 20;
                                try {
                                    await pbitSonifier.initialize(pbitCount);
                                    pbitSonifier.enable();
                                    if (guiManager) guiManager.setPbitSonifierActive(true);
                                    console.log('[Main] PbitSonifier enabled');
                                } catch (error) {
                                    console.error('[Main] Failed to initialize PbitSonifier:', error);
                                    alert('Failed to initialize audio synthesis. Please interact with the page first.');
                                    if (guiManager) guiManager.setPbitSonifierActive(false);
                                }
                            }
                        };
                        initSonifier();
                    } else {
                        pbitSonifier.enable();
                        if (guiManager) guiManager.setPbitSonifierActive(true);
                        console.log('[Main] PbitSonifier enabled');
                    }
                } else {
                    pbitSonifier.disable();
                    if (guiManager) guiManager.setPbitSonifierActive(false);
                    console.log('[Main] PbitSonifier disabled');
                }
            } else {
                console.warn('[Main] PbitSonifier not initialized');
                if (guiManager) guiManager.setPbitSonifierActive(false);
            }
        }
    };
    // Create the GUI, passing the initial parameters and the callbacks
    guiManager = new GuiManager(effectParams, guiCallbacks);

    // Explicitly set the initial effect based on params
    if (sceneManager) {
        sceneManager.setActiveEffect(effectParams.visualEffect);
    }

    // 5. Initialize Expression Mapper (if API key is available)
    if (HUME_API_KEY) {
        expressionMapper = new ExpressionMapper({ smoothingFactor: 0.15 });
        console.log('Expression detection ready.');
    } else {
        console.warn('Hume API key not provided. Facial expression detection disabled.');
    }
    
    // 5b. Initialize Conversation Display
    conversationDisplay = new ConversationDisplay();
    console.log('✅ ConversationDisplay initialized');
    
    // 5e. Initialize Pbit Display
    pbitDisplay = new PbitDisplay();
    console.log('✅ PbitDisplay initialized');
    
    // 5g. Initialize Navbar
    navbar = new Navbar();
    navbar.setOnPageChange((page) => {
        handlePageChange(page);
    });
    console.log('✅ Navbar initialized');
    
    // 5h. Initialize Whitepaper View
    whitepaperView = new WhitepaperView();
    console.log('✅ WhitepaperView initialized');
    
    // 5f. Initialize Pbit Sonifier (audio synthesis from pbit states)
    // Initialize after user interaction to satisfy browser audio context requirements
    const initSonifier = async () => {
        if (sceneManager && sceneManager.thermodynamicVisualizer) {
            const pbitCount = sceneManager.thermodynamicVisualizer.pbitCount || 20;
            pbitSonifier = new PbitSonifier({
                baseFrequency: 261.63, // C4
                scale: 'major_pentatonic',
                masterVolume: 0.03, // Lower volume to avoid overwhelming
                smoothingTime: 0.1
            });
            
            try {
                await pbitSonifier.initialize(pbitCount);
                // Enable by default (can be toggled via GUI)
                pbitSonifier.enable();
                console.log('✅ PbitSonifier initialized and enabled');
            } catch (error) {
                console.warn('⚠️ PbitSonifier initialization failed:', error);
                console.warn('   (Audio context requires user interaction - will retry on first click)');
            }
        }
    };
    
    // Try to initialize immediately, but also set up click handler for browser security
    initSonifier();
    
    // Initialize on first user interaction (browser security requirement)
    const initSonifierOnInteraction = async () => {
        if (!pbitSonifier || !pbitSonifier.isInitialized) {
            await initSonifier();
        }
        // Remove listener after first use
        document.removeEventListener('click', initSonifierOnInteraction);
        document.removeEventListener('touchstart', initSonifierOnInteraction);
    };
    document.addEventListener('click', initSonifierOnInteraction, { once: true });
    document.addEventListener('touchstart', initSonifierOnInteraction, { once: true });
    
    // 5d. Initialize Performance Stats Monitor
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    stats.dom.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10000;
        cursor: pointer;
    `;
    document.body.appendChild(stats.dom);
    console.log('✅ Stats.js initialized');
    
    // Hide loading screen - initialization complete
    updateLoadingText('Ready!');
    setTimeout(() => {
        hideLoadingScreen();
        console.log('✅ Application ready');
    }, 500); // Reduced delay for faster startup
    
    // 5c. Initialize Voice Assistant (if API keys are available)
    if (CLAUDE_API_KEY || OPENAI_API_KEY || ELEVENLABS_API_KEY) {
        voiceAssistant = new VoiceAssistant({
            claudeApiKey: CLAUDE_API_KEY, // Claude takes priority
            openaiApiKey: OPENAI_API_KEY, // Fallback to OpenAI if Claude not available
            elevenlabsApiKey: ELEVENLABS_API_KEY
        });
        
        // Set up callbacks
        voiceAssistant.setOnTranscript((transcript) => {
            console.log('[Main] User said:', transcript);
            if (conversationDisplay) {
                conversationDisplay.addUserMessage(transcript);
                conversationDisplay.updateStatus('processing');
            }
        });
        
        voiceAssistant.setOnResponse((response) => {
            console.log('[Main] AI responded:', response);
            if (conversationDisplay) {
                conversationDisplay.addAIResponse(response);
                conversationDisplay.updateStatus('idle');
            }
        });
        
        voiceAssistant.setOnError((error) => {
            console.error('[Main] Voice assistant error:', error);
            if (conversationDisplay) {
                conversationDisplay.updateStatus('idle');
            }
            alert(`Voice Assistant Error: ${error}`);
        });
        
        voiceAssistant.setOnListeningStateChange((isListening) => {
            console.log('[Main] Voice assistant listening:', isListening);
            if (conversationDisplay) {
                conversationDisplay.updateStatus(isListening ? 'listening' : 'idle');
            }
        });
        
        console.log('Voice assistant ready.');
    } else {
        console.warn('OpenAI or ElevenLabs API keys not provided. Voice assistant disabled.');
    }
    
    // 5a. Auto-start camera and microphone after page is ready
    // This allows the page to fully load and increases success rate
    console.log('Scheduling auto-start for camera and microphone...');
    
    setTimeout(() => {
        console.log('Auto-starting camera and microphone now...');
        
        // Start microphone (non-blocking)
        if (audioManager) {
            console.log('[Main] Attempting to start microphone...');
            audioManager.startMicrophoneInput()
                .then(() => {
                    console.log('✅ Microphone started successfully');
                    console.log('[AudioManager] Microphone state:', {
                        hasMicSource: !!audioManager.microphoneSource,
                        hasAnalyser: !!audioManager.nativeAnalyser,
                        analyserFFT: audioManager.nativeAnalyser?.fftSize
                    });
                    if (guiManager) {
                        guiManager.setMicActive(true);
                        console.log('[Main] GUI microphone button updated to ON');
                    }
                })
                .catch(err => {
                    console.error('❌ Could not auto-start microphone:', err);
                    console.error('[Main] Microphone error details:', err.name, err.message);
                    if (guiManager) {
                        guiManager.setMicActive(false);
                    }
                    // Don't show alert, just log - user can manually enable
                });
        }
        
        // Start camera/expressions (non-blocking, with timeout)
        if (HUME_API_KEY) {
            const expressionTimeout = setTimeout(() => {
                console.warn('[Main] Expression detection timeout - taking too long');
                if (guiManager) guiManager.setCameraActive(false);
            }, 10000); // 10 second timeout
            
            startExpressionDetection()
                .then(() => {
                    clearTimeout(expressionTimeout);
                })
                .catch(err => {
                    clearTimeout(expressionTimeout);
                    console.error('[Main] Expression detection failed:', err);
                });
        }
        
        // Auto-start voice assistant
        if (voiceAssistant) {
            console.log('[Main] Auto-starting voice assistant...');
            setTimeout(() => {
                startVoiceAssistant();
            }, 2000); // Start 2 seconds after page load
        }
    }, 1500); // 1.5 second delay after page is visible

    // 6. Setup Event Listeners
    setupEventListeners();
    
    // 7. Setup cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (expressionManager) {
            expressionManager.stop();
        }
    });
    
    // 8. Start the Animation Loop
    startAnimationLoop(); 
    console.log('Initialization complete. Visualizer is running.');
}

// --- Event Listeners Setup ---
/**
 * Sets up global event listeners (window resize, mouse move).
 */
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    // Add touch event listener for mobile compatibility
    document.addEventListener('touchmove', onTouchMove, { passive: false }); 
    // Note: File input is now triggered via GuiManager and handled in init()
}

/**
 * Handles window resize events.
 * Notifies relevant modules (SceneManager, PostProcessor) to update their sizes.
 */
function onWindowResize() {
    console.log('Window resized');
    if (sceneManager) {
        sceneManager.onResize(); // Updates camera aspect, renderer size
    }
    if (postProcessor) {
        postProcessor.onResize(); // Updates composer size
    }
}

/**
 * Handles mouse movement events.
 * Updates normalized mouse coordinates (mouseX, mouseY).
 * @param {MouseEvent} event
 */
function onMouseMove(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1 range approx)
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;
    mouseX = (event.clientX - windowHalfX) / windowHalfX; // Normalize X
    mouseY = (event.clientY - windowHalfY) / windowHalfY; // Normalize Y (inverted for typical 3D coordinate systems)
    // Adjust sensitivity/scaling if needed: e.g., mouseX /= 2;
}

/**
 * Handles touch movement events on mobile devices.
 * Updates normalized mouse coordinates (mouseX, mouseY) based on the first touch point.
 * Prevents default scroll behavior.
 * @param {TouchEvent} event
 */
function onTouchMove(event) {
    // Prevent the default touch action (like scrolling)
    event.preventDefault(); 

    if (event.touches.length > 0) {
        const touch = event.touches[0]; // Get the first touch point
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;
        mouseX = (touch.clientX - windowHalfX) / windowHalfX; // Normalize X
        mouseY = (touch.clientY - windowHalfY) / windowHalfY; // Normalize Y 
    }
}

// --- Animation Loop ---
/**
 * Starts the main animation loop using requestAnimationFrame.
 */
function startAnimationLoop() {
    /**
     * The main animation loop function.
     * Called recursively via requestAnimationFrame.
     */
    function animate() {
        requestAnimationFrame(animate); // Schedule the next frame
        
        // Begin performance monitoring
        if (stats) stats.begin();

        // Calculate time delta and elapsed time for animations
        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // --- Get Input Data ---
        // Fetch the latest average audio frequency from the AudioManager
        const audioFrequency = audioManager ? audioManager.getAverageFrequency() : 0;
        
        // --- Update Modules ---
        if (sceneManager) {
            // Update scene elements (e.g., camera position based on mouse)
            sceneManager.update(deltaTime, elapsedTime, { mouseX, mouseY });
            // Pass time and audio data to update shader uniforms
            sceneManager.updateShaderUniforms({ u_time: elapsedTime, u_frequency: audioFrequency });
            
            // Update pbit display if thermodynamic visualizer exists
            if (sceneManager.thermodynamicVisualizer && pbitDisplay) {
                const pbitStats = sceneManager.thermodynamicVisualizer.getPbitStats();
                const energy = sceneManager.thermodynamicVisualizer.getEnergy();
                const temperature = sceneManager.thermodynamicVisualizer.temperature;
                pbitDisplay.update(pbitStats, energy, temperature);
                
                // Update pbit sonifier (audio synthesis from pbit states)
                if (pbitSonifier && pbitSonifier.isInitialized && pbitSonifier.isEnabled) {
                    pbitSonifier.update(pbitStats.states, pbitStats.probabilities);
                }
            }
        }
        // AudioManager might have internal updates if needed (e.g., smoothing audio data)
        // if (audioManager) audioManager.update(deltaTime);
        // GuiManager typically doesn't need updates within the loop

        // --- Render --- 
        // Render the scene through the post-processing pipeline
        if (postProcessor) {
            postProcessor.render(); 
        } else if (sceneManager) {
            // Fallback: Render directly if post-processor failed to initialize
            sceneManager.getRenderer().render(sceneManager.getScene(), sceneManager.getCamera());
        }
        
        // End performance monitoring
        if (stats) stats.end();
    }
    animate(); // Start the loop
}

/**
 * Stops the expression detection system.
 */
function stopExpressionDetection() {
    if (expressionManager) {
        expressionManager.stop();
        expressionManager = null;
        if (guiManager) guiManager.setCameraActive(false);
        console.log('Expression detection stopped.');
    }
}

/**
 * Starts the expression detection system.
 * Called when the user clicks the "Use Camera" button or on auto-start.
 * @returns {Promise<void>}
 */
function startExpressionDetection() {
    return new Promise((resolve, reject) => {
        if (!HUME_API_KEY) {
            const msg = 'Hume API key not configured. Expression detection disabled.';
            console.warn(msg);
            reject(new Error(msg));
            return;
        }

        if (expressionManager) {
            console.log('Expression detection already running.');
            resolve();
            return;
        }

        try {
            console.log('[Main] Initializing ExpressionManager...');
            expressionManager = new ExpressionManager(HUME_API_KEY, {
                captureInterval: 300, // Capture frame every 300ms
                reconnectDelay: 2000
            });

        // Set up expression update callback
        expressionManager.setOnExpressionsUpdate((expressionData) => {
            console.log('Expression update received in main.js');
            if (expressionData && expressionData.emotions && guiManager && expressionMapper) {
                console.log('Mapping emotions to visualization parameters...');
                
                // Map expressions to visualization parameters
                const colors = expressionMapper.mapToColors(expressionData.emotions);
                const bloom = expressionMapper.mapToBloom(expressionData.emotions);
                const particleProps = expressionMapper.mapToParticleProperties(expressionData.emotions);

                console.log('Mapped colors:', colors);
                console.log('Mapped bloom:', bloom);
                console.log('Mapped particle props:', particleProps);

                // Update GUI sliders (silently to avoid callback loops)
                guiManager.updateColors(colors, true);
                guiManager.updateBloom(bloom, true);

                // Apply color changes to scene
                if (sceneManager) {
                    sceneManager.updateShaderUniforms(colors);
                }

                // Apply bloom changes to post processor
                if (postProcessor) {
                    postProcessor.updateParams(bloom);
                }

                // Update particle effect properties
                if (sceneManager && sceneManager.particleEffect) {
                    sceneManager.particleEffect.updateProperties(particleProps);
                }
                
                // Update mood-based playlist
                if (moodPlaylistManager) {
                    moodPlaylistManager.updateMoodPlaylist(expressionData.emotions);
                }
                
                console.log('Visualization parameters updated successfully');
            } else {
                console.warn('Missing data for expression update:', {
                    hasExpressionData: !!expressionData,
                    hasEmotions: expressionData?.emotions,
                    hasGuiManager: !!guiManager,
                    hasExpressionMapper: !!expressionMapper
                });
            }
        });

        // Set up connection status callback
        expressionManager.setOnConnectionStatusChange((status) => {
            if (status.connected) {
                console.log('Expression detection connected and active.');
            } else {
                console.warn('Expression detection disconnected:', status.error || 'Unknown error');
            }
        });

        // Start expression detection
        expressionManager.start()
            .then(() => {
                console.log('[Main] ✅ Expression detection started');
                if (guiManager) guiManager.setCameraActive(true);
                resolve();
            })
            .catch(err => {
                console.error('[Main] ❌ Failed to start expression detection:', err);
                // Clean up on failure
                expressionManager = null;
                if (guiManager) guiManager.setCameraActive(false);
                reject(err);
            });
        } catch (error) {
            console.error('[Main] ❌ Error initializing ExpressionManager:', error);
            expressionManager = null;
            reject(error);
        }
    });
}

/**
 * Starts the voice assistant.
 */
function startVoiceAssistant() {
    if (!voiceAssistant) {
        console.warn('[Main] Voice assistant not initialized. API keys may be missing.');
        if (guiManager) guiManager.setVoiceAssistantActive(false);
        alert('Voice assistant not available. Please configure OpenAI and/or ElevenLabs API keys.');
        return;
    }
    
    console.log('[Main] Starting voice assistant...');
    voiceAssistant.startListening();
    if (guiManager) guiManager.setVoiceAssistantActive(true);
}

/**
 * Stops the voice assistant.
 */
function stopVoiceAssistant() {
    if (voiceAssistant) {
        voiceAssistant.stopListening();
        if (guiManager) guiManager.setVoiceAssistantActive(false);
        console.log('[Main] Voice assistant stopped.');
    }
}

/**
 * Handles page navigation changes.
 * @param {string} page - Page identifier ('visualization' or 'whitepaper')
 */
function handlePageChange(page) {
    if (page === 'whitepaper') {
        // Show whitepaper, hide visualization
        if (whitepaperView) whitepaperView.show();
        if (sceneManager && sceneManager.getRenderer()) {
            sceneManager.getRenderer().domElement.style.display = 'none';
        }
        // Hide UI elements
        if (pbitDisplay && pbitDisplay.displayElement) {
            pbitDisplay.displayElement.style.display = 'none';
        }
        if (conversationDisplay && conversationDisplay.displayElement) {
            conversationDisplay.displayElement.style.display = 'none';
        }
        if (moodDisplay && moodDisplay.displayElement) {
            moodDisplay.displayElement.style.display = 'none';
        }
        if (guiManager && guiManager.gui) {
            guiManager.gui.domElement.style.display = 'none';
        }
        if (stats && stats.dom) {
            stats.dom.style.display = 'none';
        }
        document.body.classList.add('whitepaper-page');
    } else {
        // Show visualization, hide whitepaper
        if (whitepaperView) whitepaperView.hide();
        if (sceneManager && sceneManager.getRenderer()) {
            sceneManager.getRenderer().domElement.style.display = 'block';
        }
        // Show UI elements
        if (pbitDisplay && pbitDisplay.displayElement) {
            pbitDisplay.displayElement.style.display = 'block';
        }
        if (conversationDisplay && conversationDisplay.displayElement) {
            conversationDisplay.displayElement.style.display = 'block';
        }
        if (moodDisplay && moodDisplay.displayElement) {
            moodDisplay.displayElement.style.display = 'block';
        }
        if (guiManager && guiManager.gui) {
            guiManager.gui.domElement.style.display = 'block';
        }
        if (stats && stats.dom) {
            stats.dom.style.display = 'block';
        }
        document.body.classList.remove('whitepaper-page');
    }
}

// --- Start the application --- 
// Ensure DOM is ready or run after DOMContentLoaded if necessary, though modules handle DOM appending.
init(); 