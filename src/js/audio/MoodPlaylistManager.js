/**
 * Manages mood-based song selection and playback.
 * Maps detected emotions to appropriate music tracks.
 */
export default class MoodPlaylistManager {
    constructor(audioManager, youtubeAudioManager = null) {
        this.audioManager = audioManager;
        this.youtubeAudioManager = youtubeAudioManager;
        
        // Current mood state
        this.currentMood = null;
        this.currentSong = null;
        this.lastMoodChange = 0;
        this.moodChangeDebounce = 2000; // Wait 2 seconds before changing songs
        
        // Callback for mood/song changes
        this.onMoodChange = null;
        this.onSongChange = null;
        
        // Mood to song mapping
        // YouTube URLs or video IDs only
        this.moodPlaylists = { 
                'happy': [
                    'https://www.youtube.com/watch?v=ZbZSe6N_BXs', // Happy - Pharrell Williams
                    'https://www.youtube.com/watch?v=OPf0YbXqDm0', // Uptown Funk - Mark Ronson ft. Bruno Mars
                    'https://www.youtube.com/watch?v=kJQP7kiw5Fk', // Despacito
                    'https://www.youtube.com/watch?v=RgKAFK5djSk', // Waka Waka - Shakira
                ],
                'sad': [
                    'https://www.youtube.com/watch?v=hLQl3WQQoQ0', // Someone You Loved - Lewis Capaldi
                    'https://www.youtube.com/watch?v=SlPhMPnQ58k', // Fix You - Coldplay
                ],
                'energetic': [
                    'https://www.youtube.com/watch?v=60ItHLz5WEA', // Faded - Alan Walker
                    'https://www.youtube.com/watch?v=IcrbM1l_BoI', // Wake Me Up - Avicii
                    'https://www.youtube.com/watch?v=kOkQ4T5WO9E', // Animals - Martin Garrix
                    'https://www.youtube.com/watch?v=e-IWRmpefzE', // Titanium - David Guetta
                ],
                'calm': [
                    'https://www.youtube.com/watch?v=1ZYbU82GVz4', // Weightless - Calm music
            'http://youtube.com/watch?v=RhTXyUERugQ&t=4s'
                ],
                'angry': [
                    'https://youtu.be/hnql4vU28Ns?t=96', // Shrek - Bad Reputation
                ]
        };
        
        // Emotion to mood category mapping
        this.emotionToMood = {
            'Joy': 'happy',
            'Amusement': 'happy',
            'Triumph': 'happy',
            'Contentment': 'happy',
            'Sadness': 'sad',
            'Disappointment': 'sad',
            'Tiredness': 'sad',
            'Anger': 'angry',
            'Contempt': 'angry',
            'Disgust': 'angry',
            'Fear': 'energetic',
            'Surprise (positive)': 'energetic',
            'Surprise (negative)': 'energetic',
            'Excitement': 'energetic',
            'Calmness': 'calm',
            'Concentration': 'calm',
            'Contemplation': 'calm'
        };
        
        console.log('[MoodPlaylistManager] Initialized');
    }
    
    /**
     * Analyzes emotions and determines the dominant mood.
     * @param {Array} emotions - Array of emotion objects with {name, score}
     * @returns {string|null} The dominant mood category
     */
    analyzeMood(emotions) {
        if (!emotions || emotions.length === 0) {
            return null;
        }
        
        // Get top 3 emotions by score
        const topEmotions = emotions
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        
        // Map emotions to moods and aggregate scores
        const moodScores = {};
        
        for (const emotion of topEmotions) {
            const mood = this.emotionToMood[emotion.name];
            if (mood) {
                moodScores[mood] = (moodScores[mood] || 0) + emotion.score;
            }
        }
        
        // Find mood with highest score
        let dominantMood = null;
        let maxScore = 0;
        
        for (const [mood, score] of Object.entries(moodScores)) {
            if (score > maxScore) {
                maxScore = score;
                dominantMood = mood;
            }
        }
        
        console.log('[MoodPlaylistManager] Mood scores:', moodScores, '→ Dominant:', dominantMood);
        return dominantMood;
    }
    
    /**
     * Updates the playlist based on detected emotions.
     * Only changes songs if mood has changed and debounce time has passed.
     * @param {Array} emotions - Array of emotion objects
     */
    updateMoodPlaylist(emotions) {
        const detectedMood = this.analyzeMood(emotions);
        
        if (!detectedMood) {
            return;
        }
        
        const now = Date.now();
        const timeSinceLastChange = now - this.lastMoodChange;
        
        // Only change song if mood actually changed (and enough time has passed)
        if (detectedMood !== this.currentMood) {
            if (timeSinceLastChange >= this.moodChangeDebounce) {
                console.log(`[MoodPlaylistManager] 🎵 Mood changed: ${this.currentMood} → ${detectedMood}`);
                this.currentMood = detectedMood;
                this.lastMoodChange = now;
                
                // Notify listeners of mood change
                if (this.onMoodChange) {
                    this.onMoodChange(detectedMood);
                }
                
                // Play a song for this NEW mood
                this.playMoodSong(detectedMood);
            }
        }
        // If mood hasn't changed, keep playing the current song - don't switch
    }
    
    /**
     * Checks if a URL is a YouTube link.
     * @param {string} url - URL or path to check
     * @returns {boolean}
     * @private
     */
    _isYouTubeUrl(url) {
        return url.includes('youtube.com') || 
               url.includes('youtu.be') || 
               /^[a-zA-Z0-9_-]{11}$/.test(url); // YouTube video ID format
    }
    
    /**
     * Plays a song appropriate for the given mood.
     * @param {string} mood - The mood category
     */
    playMoodSong(mood) {
        const playlist = this.moodPlaylists[mood];
        
        if (!playlist || playlist.length === 0) {
            console.warn(`[MoodPlaylistManager] No songs for mood: ${mood}`);
            return;
        }
        
        // Pick a random song from the mood's playlist
        const songUrl = playlist[Math.floor(Math.random() * playlist.length)];
        
        console.log(`[MoodPlaylistManager] 🎶 Playing ${mood} song: ${songUrl}`);
        
        // Store current song
        this.currentSong = songUrl;
        
        // Notify listeners of song change
        if (this.onSongChange) {
            this.onSongChange(songUrl);
        }
        
        // Only use YouTube player (no more MP3s)
        if (this.youtubeAudioManager) {
            this.youtubeAudioManager.play(songUrl)
                .then(() => {
                    console.log(`[MoodPlaylistManager] ✅ Now playing YouTube: ${songUrl}`);
                })
                .catch(err => console.error(`[MoodPlaylistManager] ❌ Failed to play YouTube: ${songUrl}`, err));
        } else {
            console.warn('[MoodPlaylistManager] YouTubeAudioManager not available');
        }
    }
    
    /**
     * Adds a song to a mood category.
     * @param {string} mood - The mood category
     * @param {string} songUrl - URL or path to the audio file
     */
    addSongToMood(mood, songUrl) {
        if (!this.moodPlaylists[mood]) {
            this.moodPlaylists[mood] = [];
        }
        
        this.moodPlaylists[mood].push(songUrl);
        console.log(`[MoodPlaylistManager] Added ${songUrl} to ${mood} playlist`);
    }
    
    /**
     * Sets the debounce time for mood changes.
     * @param {number} milliseconds - Time in ms to wait before changing songs
     */
    setMoodChangeDebounce(milliseconds) {
        this.moodChangeDebounce = milliseconds;
        console.log(`[MoodPlaylistManager] Mood change debounce set to ${milliseconds}ms`);
    }
    
    /**
     * Gets the current mood.
     * @returns {string|null}
     */
    getCurrentMood() {
        return this.currentMood;
    }
    
    /**
     * Gets the current song.
     * @returns {string|null}
     */
    getCurrentSong() {
        return this.currentSong;
    }
    
    /**
     * Sets callback for mood changes.
     * @param {Function} callback - Called with new mood when it changes
     */
    setOnMoodChange(callback) {
        this.onMoodChange = callback;
    }
    
    /**
     * Sets callback for song changes.
     * @param {Function} callback - Called with song URL when it changes
     */
    setOnSongChange(callback) {
        this.onSongChange = callback;
    }
}

