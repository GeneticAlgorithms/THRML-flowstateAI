/**
 * Manages YouTube video playback as audio source using YouTube IFrame Player API.
 * Videos play in a hidden or minimized player while providing audio.
 */
export default class YouTubeAudioManager {
    constructor(customContainer = null) {
        this.player = null;
        this.playerReady = false;
        this.isPlaying = false;
        this.currentVideoId = null;
        this.onReadyCallback = null;
        this.customContainer = customContainer;
        
        // Create player container (or use custom one)
        this._createPlayerContainer();
        
        // Load YouTube IFrame API
        this._loadYouTubeAPI();
        
        console.log('[YouTubeAudioManager] Initialized');
    }
    
    /**
     * Creates a container for the YouTube player.
     * @private
     */
    _createPlayerContainer() {
        // Use custom container if provided, otherwise create a standalone one
        if (this.customContainer) {
            this.playerContainer = this.customContainer;
            this.playerContainer.style.width = '100%';
            this.playerContainer.style.height = '100%';
        } else {
            this.playerContainer = document.createElement('div');
            this.playerContainer.id = 'youtube-player-container';
            this.playerContainer.style.cssText = `
                position: fixed;
                bottom: 250px;
                left: 20px;
                width: 320px;
                height: 180px;
                z-index: 998;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(255, 255, 255, 0.1);
                display: none;
            `;
            document.body.appendChild(this.playerContainer);
        }
        
        // Create player element
        this.playerElement = document.createElement('div');
        this.playerElement.id = 'youtube-player';
        this.playerContainer.appendChild(this.playerElement);
    }
    
    /**
     * Loads the YouTube IFrame Player API.
     * @private
     */
    _loadYouTubeAPI() {
        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            this._onYouTubeAPIReady();
            return;
        }
        
        // Load the IFrame Player API code asynchronously
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // API will call this global function when ready
        window.onYouTubeIframeAPIReady = () => {
            this._onYouTubeAPIReady();
        };
        
        console.log('[YouTubeAudioManager] Loading YouTube IFrame API...');
    }
    
    /**
     * Called when YouTube API is ready.
     * @private
     */
    _onYouTubeAPIReady() {
        console.log('[YouTubeAudioManager] YouTube API ready');
        
        this.player = new YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            playerVars: {
                autoplay: 1,  // Enable autoplay
                mute: 0,  // Start unmuted (we'll handle volume separately)
                controls: 1,
                rel: 0,
                modestbranding: 1,
                fs: 0,  // Disable fullscreen for embedded view
                playsinline: 1,  // Play inline on mobile
                enablejsapi: 1
            },
            events: {
                'onReady': (event) => this._onPlayerReady(event),
                'onStateChange': (event) => this._onPlayerStateChange(event),
                'onError': (event) => this._onPlayerError(event)
            }
        });
    }
    
    /**
     * Called when player is ready.
     * @private
     */
    _onPlayerReady(event) {
        console.log('[YouTubeAudioManager] Player ready');
        this.playerReady = true;
        
        if (this.onReadyCallback) {
            this.onReadyCallback();
            this.onReadyCallback = null;
        }
    }
    
    /**
     * Called when player state changes.
     * @private
     */
    _onPlayerStateChange(event) {
        const states = {
            '-1': 'unstarted',
            '0': 'ended',
            '1': 'playing',
            '2': 'paused',
            '3': 'buffering',
            '5': 'video cued'
        };
        
        const state = states[event.data];
        console.log('[YouTubeAudioManager] Player state:', state);
        
        this.isPlaying = (event.data === YT.PlayerState.PLAYING);
        
        // Auto-resume if paused or cued (browser might pause it)
        if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
            console.log('[YouTubeAudioManager] Video paused/cued, attempting to resume...');
            setTimeout(() => {
                if (this.player && this.currentVideoId) {
                    this.player.playVideo();
                }
            }, 300);
        }
        
        // Loop the video when it ends
        if (event.data === YT.PlayerState.ENDED) {
            console.log('[YouTubeAudioManager] Video ended, restarting...');
            this.player.playVideo();
        }
    }
    
    /**
     * Called when player encounters an error.
     * @private
     */
    _onPlayerError(event) {
        const errors = {
            2: 'Invalid video ID',
            5: 'HTML5 player error',
            100: 'Video not found or private',
            101: 'Video not allowed to be embedded',
            150: 'Video not allowed to be embedded'
        };
        
        const error = errors[event.data] || 'Unknown error';
        console.error('[YouTubeAudioManager] Player error:', error);
    }
    
    /**
     * Extracts video ID from various YouTube URL formats.
     * @param {string} url - YouTube URL
     * @returns {string|null} Video ID or null if invalid
     */
    extractVideoId(url) {
        // Handle different YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
            /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }
    
    /**
     * Plays a YouTube video by URL or ID.
     * @param {string} urlOrId - YouTube URL or video ID
     * @returns {Promise<void>}
     */
    async play(urlOrId) {
        const videoId = this.extractVideoId(urlOrId);
        
        if (!videoId) {
            console.error('[YouTubeAudioManager] Invalid YouTube URL or ID:', urlOrId);
            throw new Error('Invalid YouTube URL or ID');
        }
        
        console.log('[YouTubeAudioManager] Playing video:', videoId);
        this.currentVideoId = videoId;
        
        // Wait for player to be ready
        if (!this.playerReady) {
            console.log('[YouTubeAudioManager] Waiting for player to be ready...');
            await new Promise((resolve) => {
                this.onReadyCallback = resolve;
            });
        }
        
        // Show player container (if not custom)
        if (!this.customContainer) {
            this.playerContainer.style.display = 'block';
        }
        
        // Load and play video with retries
        this.player.loadVideoById({
            videoId: videoId,
            startSeconds: 0
        });
        this.player.setVolume(50); // 50% volume
        
        // Aggressive playback attempt with multiple retries
        const attemptPlay = (attempt = 0) => {
            if (attempt > 5) {
                console.warn('[YouTubeAudioManager] Failed to auto-play after 5 attempts');
                return;
            }
            
            setTimeout(() => {
                if (this.player && this.player.getPlayerState) {
                    const state = this.player.getPlayerState();
                    console.log(`[YouTubeAudioManager] Attempt ${attempt + 1}, state:`, state);
                    
                    if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) {
                        console.log('[YouTubeAudioManager] Forcing playback...');
                        this.player.playVideo();
                        attemptPlay(attempt + 1);
                    } else {
                        console.log('[YouTubeAudioManager] ✅ Video is playing!');
                    }
                }
            }, 500 * (attempt + 1));
        };
        
        attemptPlay();
        
        return new Promise((resolve) => {
            // Wait a bit for video to start
            setTimeout(resolve, 500);
        });
    }
    
    /**
     * Stops playback.
     */
    stop() {
        if (this.player && this.playerReady) {
            this.player.stopVideo();
            this.isPlaying = false;
            console.log('[YouTubeAudioManager] Stopped');
        }
    }
    
    /**
     * Pauses playback.
     */
    pause() {
        if (this.player && this.playerReady) {
            this.player.pauseVideo();
            this.isPlaying = false;
            console.log('[YouTubeAudioManager] Paused');
        }
    }
    
    /**
     * Resumes playback.
     */
    resume() {
        if (this.player && this.playerReady) {
            this.player.playVideo();
            console.log('[YouTubeAudioManager] Resumed');
        }
    }
    
    /**
     * Sets volume (0-100).
     * @param {number} volume - Volume level
     */
    setVolume(volume) {
        if (this.player && this.playerReady) {
            this.player.setVolume(Math.max(0, Math.min(100, volume)));
            console.log('[YouTubeAudioManager] Volume set to:', volume);
        }
    }
    
    /**
     * Shows the video player.
     */
    showPlayer() {
        this.playerContainer.style.display = 'block';
        console.log('[YouTubeAudioManager] Player shown');
    }
    
    /**
     * Hides the video player (audio continues).
     */
    hidePlayer() {
        this.playerContainer.style.display = 'none';
        console.log('[YouTubeAudioManager] Player hidden');
    }
    
    /**
     * Checks if currently playing.
     * @returns {boolean}
     */
    getIsPlaying() {
        return this.isPlaying;
    }
    
    /**
     * Gets the current video ID.
     * @returns {string|null}
     */
    getCurrentVideoId() {
        return this.currentVideoId;
    }
}

