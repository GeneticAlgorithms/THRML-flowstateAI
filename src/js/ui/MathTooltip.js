/**
 * Mathematical Tooltip System
 * Provides informative tooltips explaining how mathematical formulas relate to visualizations.
 */
export default class MathTooltip {
    constructor() {
        this.tooltipElement = null;
        this.activeElement = null;
        this._createTooltip();
    }
    
    /**
     * Creates the tooltip element.
     * @private
     */
    _createTooltip() {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = 'math-tooltip';
        this.tooltipElement.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, rgba(10, 20, 40, 0.98) 0%, rgba(20, 30, 50, 0.98) 100%);
            color: #00ffff;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.6;
            border: 2px solid rgba(0, 255, 255, 0.4);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.8),
                0 0 20px rgba(0, 255, 255, 0.3);
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            max-width: 400px;
            backdrop-filter: blur(10px);
        `;
        document.body.appendChild(this.tooltipElement);
    }
    
    /**
     * Shows a tooltip with mathematical explanation.
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string|object} content - Tooltip content (string or object with title, formula, explanation)
     */
    show(element, content) {
        if (!element || !content) return;
        
        this.activeElement = element;
        
        // Format content
        let html = '';
        if (typeof content === 'string') {
            html = content;
        } else {
            html = `
                <div style="font-weight: bold; color: #00ff88; margin-bottom: 8px; font-size: 13px;">
                    ${content.title || ''}
                </div>
                ${content.formula ? `
                    <div style="color: #ffff00; margin: 8px 0; font-family: 'Courier New', monospace; font-size: 13px; text-align: center; padding: 5px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                        ${content.formula}
                    </div>
                ` : ''}
                <div style="color: rgba(0, 255, 255, 0.9); margin-top: 8px;">
                    ${content.explanation || ''}
                </div>
                ${content.visualization ? `
                    <div style="color: rgba(0, 255, 255, 0.7); margin-top: 8px; font-size: 11px; font-style: italic;">
                        📊 ${content.visualization}
                    </div>
                ` : ''}
            `;
        }
        
        this.tooltipElement.innerHTML = html;
        this.tooltipElement.style.opacity = '1';
        
        // Position tooltip
        this._updatePosition(element);
        
        // Update position on scroll/resize
        this._positionUpdateHandler = () => this._updatePosition(element);
        window.addEventListener('scroll', this._positionUpdateHandler, true);
        window.addEventListener('resize', this._positionUpdateHandler);
    }
    
    /**
     * Updates tooltip position relative to element.
     * @private
     */
    _updatePosition(element) {
        if (!element || !this.tooltipElement) return;
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 10;
        
        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
            // Show below instead
            top = rect.bottom + 10;
        }
        
        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
    }
    
    /**
     * Hides the tooltip.
     */
    hide() {
        if (this.tooltipElement) {
            this.tooltipElement.style.opacity = '0';
        }
        this.activeElement = null;
        
        // Remove event listeners
        if (this._positionUpdateHandler) {
            window.removeEventListener('scroll', this._positionUpdateHandler, true);
            window.removeEventListener('resize', this._positionUpdateHandler);
            this._positionUpdateHandler = null;
        }
    }
    
    /**
     * Attaches tooltip to an element with mouse events.
     * @param {HTMLElement} element - Element to attach to
     * @param {string|object} content - Tooltip content
     */
    attach(element, content) {
        if (!element) return;
        
        element.addEventListener('mouseenter', () => {
            this.show(element, content);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hide();
        });
        
        element.style.cursor = 'help';
    }
    
    /**
     * Disposes of the tooltip system.
     */
    dispose() {
        this.hide();
        if (this.tooltipElement && this.tooltipElement.parentNode) {
            this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        }
        this.tooltipElement = null;
    }
}

