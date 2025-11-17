/**
 * Manages the on-screen display of detected mood and currently playing song.
 */
export default class MoodDisplay {
    constructor() {
        this.displayElement = null;
        this.moodElement = null;
        this.songElement = null;
        this.videoContainer = null;
        this.isVisible = false;
        this.isMinimized = false;
        this.minimizeButton = null;
        this.contentContainer = null;
        
        this._createDisplay();
        
        console.log('[MoodDisplay] Initialized');
    }
    
    /**
     * Creates the mood display UI elements.
     * @private
     */
    _createDisplay() {
        // Create main container
        this.displayElement = document.createElement('div');
        this.displayElement.id = 'mood-display';
        this.displayElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-family: 'Arial', sans-serif;
            width: 360px;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out;
        `;
        
        // Create header with minimize button
        this.header = document.createElement('div');
        this.header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            cursor: pointer;
        `;
        
        // Create minimize button
        this.minimizeButton = document.createElement('button');
        this.minimizeButton.innerHTML = '−'; // Minus symbol
        this.minimizeButton.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            transition: background 0.2s ease;
        `;
        
        this.minimizeButton.addEventListener('mouseenter', () => {
            this.minimizeButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        this.minimizeButton.addEventListener('mouseleave', () => {
            this.minimizeButton.style.background = 'rgba(255, 255, 255, 0.1)';
        });
        
        this.minimizeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });
        
        // Create mood section
        const moodSection = document.createElement('div');
        moodSection.style.cssText = `
            flex: 1;
        `;
        
        const moodLabel = document.createElement('div');
        moodLabel.textContent = 'Current Mood';
        moodLabel.style.cssText = `
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #aaa;
            margin-bottom: 5px;
        `;
        
        this.moodElement = document.createElement('div');
        this.moodElement.textContent = '—';
        this.moodElement.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            color: #fff;
        `;
        
        moodSection.appendChild(moodLabel);
        moodSection.appendChild(this.moodElement);
        
        this.header.appendChild(moodSection);
        this.header.appendChild(this.minimizeButton);
        
        // Create content container (for minimize functionality)
        this.contentContainer = document.createElement('div');
        this.contentContainer.style.cssText = `
            overflow: hidden;
            transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
            max-height: 1000px;
            opacity: 1;
        `;
        
        // Create video container section
        this.videoContainer = document.createElement('div');
        this.videoContainer.id = 'mood-video-container';
        this.videoContainer.style.cssText = `
            width: 100%;
            height: 0;
            margin-top: 15px;
            border-radius: 8px;
            overflow: hidden;
            background: #000;
            transition: height 0.3s ease-in-out;
        `;
        
        // Assemble display
        this.contentContainer.appendChild(this.videoContainer);
        this.displayElement.appendChild(this.header);
        this.displayElement.appendChild(this.contentContainer);
        
        // Add to DOM
        document.body.appendChild(this.displayElement);
    }
    
    /**
     * Updates the displayed mood with emoji and color.
     * @param {string} mood - The mood category (happy, sad, energetic, calm, angry)
     */
    updateMood(mood) {
        if (!mood) return;
        
        const moodConfig = {
            'happy': { emoji: '😊', color: '#FFD700', text: 'Happy' },
            'sad': { emoji: '😢', color: '#6495ED', text: 'Sad' },
            'energetic': { emoji: '⚡', color: '#FF6347', text: 'Energetic' },
            'calm': { emoji: '😌', color: '#98FB98', text: 'Calm' },
            'angry': { emoji: '😠', color: '#DC143C', text: 'Angry' }
        };
        
        const config = moodConfig[mood] || { emoji: '🎭', color: '#fff', text: mood };
        
        this.moodElement.textContent = `${config.emoji} ${config.text}`;
        this.moodElement.style.color = config.color;
        
        console.log(`[MoodDisplay] Updated mood: ${config.text}`);
        
        // Show display if hidden
        this.show();
    }
    
    /**
     * Updates the displayed song information.
     * @param {string} songUrl - URL or path to the song
     */
    updateSong(songUrl) {
        if (!songUrl) return;
        
        console.log(`[MoodDisplay] Song changed: ${songUrl}`);
        
        // Show display if hidden
        this.show();
    }
    
    /**
     * Shows the mood display.
     */
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.displayElement.style.opacity = '1';
        console.log('[MoodDisplay] Showing display');
    }
    
    /**
     * Hides the mood display.
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.displayElement.style.opacity = '0';
        console.log('[MoodDisplay] Hiding display');
    }
    
    /**
     * Toggles the mood display visibility.
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Gets the video container element for embedding YouTube player.
     * @returns {HTMLElement}
     */
    getVideoContainer() {
        return this.videoContainer;
    }
    
    /**
     * Shows the video container.
     */
    showVideo() {
        if (this.videoContainer) {
            this.videoContainer.style.height = '202px'; // 16:9 aspect ratio for 360px width
        }
    }
    
    /**
     * Hides the video container.
     */
    hideVideo() {
        if (this.videoContainer) {
            this.videoContainer.style.height = '0';
        }
    }
    
    /**
     * Minimizes the mood display to show only the header.
     */
    minimize() {
        if (this.isMinimized) return;
        
        this.isMinimized = true;
        this.minimizeButton.innerHTML = '+'; // Change to plus symbol
        this.contentContainer.style.maxHeight = '0';
        this.contentContainer.style.opacity = '0';
        this.displayElement.style.width = '280px'; // Smaller width when minimized
        this.displayElement.style.padding = '15px 20px'; // Less padding
        this.header.style.marginBottom = '0'; // Remove margin when minimized
        
        console.log('[MoodDisplay] Minimized');
    }
    
    /**
     * Maximizes the mood display to show full content.
     */
    maximize() {
        if (!this.isMinimized) return;
        
        this.isMinimized = false;
        this.minimizeButton.innerHTML = '−'; // Change back to minus symbol
        this.contentContainer.style.maxHeight = '1000px';
        this.contentContainer.style.opacity = '1';
        this.displayElement.style.width = '360px'; // Full width
        this.displayElement.style.padding = '20px'; // Full padding
        this.header.style.marginBottom = '15px'; // Restore margin when maximized
        
        console.log('[MoodDisplay] Maximized');
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
     * Cleans up the display element.
     */
    dispose() {
        if (this.displayElement && this.displayElement.parentNode) {
            this.displayElement.parentNode.removeChild(this.displayElement);
        }
        console.log('[MoodDisplay] Disposed');
    }
}

