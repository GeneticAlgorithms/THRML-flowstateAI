/**
 * Whitepaper View Component
 * Displays the FlowState AI whitepaper
 */
export default class WhitepaperView {
    constructor() {
        this.viewElement = null;
        this.isVisible = false;
        this.pdfLoaded = false; // Track if PDF has been loaded
        
        this._createView();
    }
    
    /**
     * Creates the whitepaper view DOM element.
     * @private
     */
    _createView() {
        this.viewElement = document.createElement('div');
        this.viewElement.id = 'whitepaper-view';
        this.viewElement.style.cssText = `
            position: fixed;
            top: 60px; /* Below navbar */
            left: 0;
            width: 100%;
            height: calc(100% - 60px);
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
            overflow-y: auto;
            overflow-x: hidden;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
        `;
        
        // Container for content
        const container = document.createElement('div');
        container.style.cssText = `
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
        `;
        
        // Title
        const title = document.createElement('h1');
        title.textContent = 'FlowState AI Whitepaper';
        title.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            color: #00ffff;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            margin-bottom: 20px;
            text-align: center;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
        `;
        
        // PDF Embed Container
        const pdfContainer = document.createElement('div');
        pdfContainer.style.cssText = `
            width: 100%;
            height: calc(100vh - 200px);
            min-height: 800px;
            margin: 30px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            border: 2px solid rgba(0, 255, 255, 0.3);
            background: rgba(0, 0, 0, 0.3);
        `;
        
        // PDF Embed - use relative path that works in both dev and production
        const pdfPath = '/Flowstate_WhitePaper.pdf'; // Will be served from root in production
        const pdfEmbed = document.createElement('embed');
        pdfEmbed.src = pdfPath;
        pdfEmbed.type = 'application/pdf';
        pdfEmbed.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;
        
        // Fallback iframe for better browser compatibility
        const pdfIframe = document.createElement('iframe');
        pdfIframe.src = pdfPath;
        pdfIframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            display: none;
        `;
        
        // Download button
        const downloadButton = document.createElement('a');
        downloadButton.href = pdfPath;
        downloadButton.download = 'FlowState_AI_Whitepaper.pdf';
        downloadButton.textContent = '📥 Download PDF';
        downloadButton.style.cssText = `
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 255, 200, 0.2) 100%);
            color: #00ffff;
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid rgba(0, 255, 255, 0.3);
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            margin: 20px auto;
            text-align: center;
            cursor: pointer;
        `;
        downloadButton.addEventListener('mouseenter', () => {
            downloadButton.style.background = 'linear-gradient(135deg, rgba(0, 255, 255, 0.3) 0%, rgba(0, 255, 200, 0.3) 100%)';
            downloadButton.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        });
        downloadButton.addEventListener('mouseleave', () => {
            downloadButton.style.background = 'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 255, 200, 0.2) 100%)';
            downloadButton.style.boxShadow = 'none';
        });
        
        // Info text
        const infoText = document.createElement('p');
        infoText.innerHTML = `
            <strong>Note:</strong> If the PDF doesn't load, you can 
            <a href="${pdfPath}" target="_blank" style="color: #00ffff; text-decoration: underline;">open it in a new tab</a> 
            or download it using the button above.
        `;
        infoText.style.cssText = `
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 20px;
            font-size: 14px;
        `;
        
        // Store references for lazy loading
        this.pdfContainer = pdfContainer;
        this.pdfEmbed = pdfEmbed;
        this.pdfIframe = pdfIframe;
        
        // Don't load PDF immediately - wait until show() is called
        // This prevents blocking during initialization
        
        container.appendChild(title);
        container.appendChild(downloadButton);
        container.appendChild(pdfContainer);
        container.appendChild(infoText);
        
        this.viewElement.appendChild(container);
        document.body.appendChild(this.viewElement);
        
        console.log('[WhitepaperView] Initialized');
    }
    
    /**
     * Shows the whitepaper view.
     */
    show() {
        this.isVisible = true;
        this.viewElement.style.opacity = '1';
        this.viewElement.style.visibility = 'visible';
        
        // Lazy load PDF only when view is shown
        if (!this.pdfLoaded && this.pdfContainer) {
            this.pdfContainer.appendChild(this.pdfEmbed);
            this.pdfContainer.appendChild(this.pdfIframe);
            
            // Check if embed worked, if not use iframe
            setTimeout(() => {
                try {
                    if (!this.pdfEmbed.offsetHeight) {
                        this.pdfEmbed.style.display = 'none';
                        this.pdfIframe.style.display = 'block';
                    }
                } catch (e) {
                    this.pdfEmbed.style.display = 'none';
                    this.pdfIframe.style.display = 'block';
                }
            }, 500);
            
            this.pdfLoaded = true;
        }
    }
    
    /**
     * Hides the whitepaper view.
     */
    hide() {
        this.isVisible = false;
        this.viewElement.style.opacity = '0';
        this.viewElement.style.visibility = 'hidden';
    }
    
    /**
     * Disposes of the view.
     */
    dispose() {
        if (this.viewElement && this.viewElement.parentNode) {
            this.viewElement.parentNode.removeChild(this.viewElement);
        }
    }
}

