/**
 * Navbar Component
 * Provides navigation between main visualization and whitepaper
 */
export default class Navbar {
    constructor() {
        this.navbarElement = null;
        this.currentPage = 'visualization'; // 'visualization' or 'whitepaper'
        this.onPageChange = null; // Callback for page changes
        
        this._createNavbar();
    }
    
    /**
     * Creates the navbar DOM element.
     * @private
     */
    _createNavbar() {
        this.navbarElement = document.createElement('nav');
        this.navbarElement.id = 'main-navbar';
        this.navbarElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 60px;
            background: linear-gradient(135deg, rgba(10, 10, 30, 0.95) 0%, rgba(20, 20, 50, 0.95) 100%);
            backdrop-filter: blur(20px);
            border-bottom: 2px solid rgba(0, 255, 255, 0.3);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            font-family: 'Courier New', monospace;
        `;
        
        // Logo/Brand section
        const brand = document.createElement('div');
        brand.textContent = 'FlowState AI';
        brand.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            letter-spacing: 2px;
            cursor: pointer;
            transition: color 0.3s ease;
        `;
        brand.addEventListener('click', () => this.navigateTo('visualization'));
        brand.addEventListener('mouseenter', () => {
            brand.style.color = '#00ff88';
        });
        brand.addEventListener('mouseleave', () => {
            brand.style.color = '#00ffff';
        });
        
        // Navigation links
        const navLinks = document.createElement('div');
        navLinks.style.cssText = `
            display: flex;
            gap: 30px;
            align-items: center;
        `;
        
        // Visualization link
        this.vizLink = this._createNavLink('Visualization', 'visualization');
        this.vizLink.style.borderBottom = '2px solid #00ffff';
        
        // Whitepaper link
        this.whitepaperLink = this._createNavLink('Whitepaper', 'whitepaper');
        
        navLinks.appendChild(this.vizLink);
        navLinks.appendChild(this.whitepaperLink);
        
        this.navbarElement.appendChild(brand);
        this.navbarElement.appendChild(navLinks);
        
        document.body.appendChild(this.navbarElement);
        
        console.log('[Navbar] Initialized');
    }
    
    /**
     * Creates a navigation link element.
     * @param {string} text - Link text
     * @param {string} page - Page identifier
     * @returns {HTMLElement}
     * @private
     */
    _createNavLink(text, page) {
        const link = document.createElement('div');
        link.textContent = text;
        link.style.cssText = `
            color: rgba(0, 255, 255, 0.7);
            font-size: 16px;
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 4px;
            transition: all 0.3s ease;
            border-bottom: 2px solid transparent;
            position: relative;
        `;
        
        link.addEventListener('click', () => this.navigateTo(page));
        link.addEventListener('mouseenter', () => {
            if (this.currentPage !== page) {
                link.style.color = '#00ffff';
                link.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
            }
        });
        link.addEventListener('mouseleave', () => {
            if (this.currentPage !== page) {
                link.style.color = 'rgba(0, 255, 255, 0.7)';
                link.style.backgroundColor = 'transparent';
            }
        });
        
        return link;
    }
    
    /**
     * Navigates to a specific page.
     * @param {string} page - Page identifier ('visualization' or 'whitepaper')
     */
    navigateTo(page) {
        if (this.currentPage === page) return;
        
        this.currentPage = page;
        
        // Update active link styling
        if (page === 'visualization') {
            this.vizLink.style.color = '#00ffff';
            this.vizLink.style.borderBottom = '2px solid #00ffff';
            this.whitepaperLink.style.color = 'rgba(0, 255, 255, 0.7)';
            this.whitepaperLink.style.borderBottom = '2px solid transparent';
        } else {
            this.whitepaperLink.style.color = '#00ffff';
            this.whitepaperLink.style.borderBottom = '2px solid #00ffff';
            this.vizLink.style.color = 'rgba(0, 255, 255, 0.7)';
            this.vizLink.style.borderBottom = '2px solid transparent';
        }
        
        // Notify callback
        if (this.onPageChange) {
            this.onPageChange(page);
        }
        
        console.log(`[Navbar] Navigated to: ${page}`);
    }
    
    /**
     * Sets the callback for page changes.
     * @param {function(string): void} callback - Callback function
     */
    setOnPageChange(callback) {
        this.onPageChange = callback;
    }
    
    /**
     * Gets the current page.
     * @returns {string}
     */
    getCurrentPage() {
        return this.currentPage;
    }
    
    /**
     * Disposes of the navbar.
     */
    dispose() {
        if (this.navbarElement && this.navbarElement.parentNode) {
            this.navbarElement.parentNode.removeChild(this.navbarElement);
        }
    }
}

