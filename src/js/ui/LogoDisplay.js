/**
 * Manages the logo display in the bottom right corner.
 */
export default class LogoDisplay {
    constructor(logoPath = 'static/logo.png') {
        this.logoElement = null;
        this.logoPath = logoPath;
        
        this._createLogoDisplay();
        
        console.log('[LogoDisplay] Initialized');
    }
    
    /**
     * Creates the logo display element.
     * @private
     */
    _createLogoDisplay() {
        this.logoElement = document.createElement('img');
        this.logoElement.id = 'app-logo';
        this.logoElement.src = this.logoPath;
        this.logoElement.alt = 'Logo';
        this.logoElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 120px;
            height: auto;
            z-index: 1000;
            opacity: 0.9;
            transition: opacity 0.3s ease-in-out;
            pointer-events: none;
        `;
        
        // Add hover effect
        this.logoElement.addEventListener('mouseenter', () => {
            this.logoElement.style.opacity = '1';
        });
        
        this.logoElement.addEventListener('mouseleave', () => {
            this.logoElement.style.opacity = '0.9';
        });
        
        document.body.appendChild(this.logoElement);
    }
    
    /**
     * Shows the logo.
     */
    show() {
        if (this.logoElement) {
            this.logoElement.style.display = 'block';
        }
    }
    
    /**
     * Hides the logo.
     */
    hide() {
        if (this.logoElement) {
            this.logoElement.style.display = 'none';
        }
    }
    
    /**
     * Updates the logo image source.
     * @param {string} newLogoPath - Path to the new logo image
     */
    updateLogo(newLogoPath) {
        if (this.logoElement) {
            this.logoPath = newLogoPath;
            this.logoElement.src = newLogoPath;
        }
    }
    
    /**
     * Cleans up the logo element.
     */
    dispose() {
        if (this.logoElement && this.logoElement.parentNode) {
            this.logoElement.parentNode.removeChild(this.logoElement);
        }
        console.log('[LogoDisplay] Disposed');
    }
}

