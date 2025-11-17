/**
 * Displays a futuristic box showing Pbit (Probabilistic Bit) information.
 * A pbit is a programmable analog hardware implementation of a Bernoulli distribution.
 */
export default class PbitDisplay {
    constructor() {
        this.displayElement = null;
        this.statsElement = null;
        this.isVisible = false;
        
        this._createDisplay();
        
        console.log('[PbitDisplay] Initialized');
    }
    
    /**
     * Creates the futuristic pbit display UI.
     * @private
     */
    _createDisplay() {
        // Create main container
        this.displayElement = document.createElement('div');
        this.displayElement.id = 'pbit-display';
        this.displayElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 320px;
            min-height: 200px;
            background: linear-gradient(135deg, rgba(10, 10, 30, 0.95) 0%, rgba(20, 20, 50, 0.95) 100%);
            color: #00ffff;
            padding: 20px;
            border-radius: 16px;
            font-family: 'Courier New', monospace;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 255, 255, 0.3);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.5),
                0 0 20px rgba(0, 255, 255, 0.2),
                inset 0 0 20px rgba(0, 255, 255, 0.05);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            overflow: hidden;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0, 255, 255, 0.2);
        `;
        
        const title = document.createElement('div');
        title.textContent = '⚛️ PBIT SYSTEM';
        title.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            margin-bottom: 5px;
        `;
        
        const subtitle = document.createElement('div');
        subtitle.textContent = 'TSU Gibbs Sampling Monitor';
        subtitle.style.cssText = `
            font-size: 11px;
            color: rgba(0, 255, 255, 0.6);
            letter-spacing: 1px;
        `;
        
        header.appendChild(title);
        header.appendChild(subtitle);
        
        // Create stats container
        this.statsElement = document.createElement('div');
        this.statsElement.id = 'pbit-stats';
        this.statsElement.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        
        // Initial stats display
        this._updateStats({
            total: 0,
            active: 0,
            inactive: 0,
            averageProbability: 0,
            states: [],
            probabilities: []
        });
        
        // Assemble display
        this.displayElement.appendChild(header);
        this.displayElement.appendChild(this.statsElement);
        
        // Add to DOM
        document.body.appendChild(this.displayElement);
    }
    
    /**
     * Updates the pbit statistics display.
     * @param {object} stats - Pbit statistics object
     * @param {number} [energy] - Current energy value
     * @param {number} [temperature] - Temperature parameter
     */
    _updateStats(stats, energy = null, temperature = null) {
        this.statsElement.innerHTML = '';
        
        // Total pbits
        const totalRow = this._createStatRow('Total Pbits', stats.total.toString(), '#00ff00');
        this.statsElement.appendChild(totalRow);
        
        // Active/Inactive
        const activeRow = this._createStatRow('Active (+1)', stats.active.toString(), '#00ff88');
        this.statsElement.appendChild(activeRow);
        
        const inactiveRow = this._createStatRow('Inactive (-1)', stats.inactive.toString(), '#ff0088');
        this.statsElement.appendChild(inactiveRow);
        
        // Average probability
        const probRow = this._createStatRow('Avg Probability', (stats.averageProbability * 100).toFixed(1) + '%', '#00ffff');
        this.statsElement.appendChild(probRow);
        
        // Energy value if provided
        if (energy !== null) {
            const energyRow = this._createStatRow('Energy', energy.toFixed(2), '#ffaa00');
            this.statsElement.appendChild(energyRow);
        }
        
        // Temperature if provided
        if (temperature !== null) {
            const tempRow = this._createStatRow('Temperature (1/β)', temperature.toFixed(2), '#ff00ff');
            this.statsElement.appendChild(tempRow);
        }
        
        // Probability bar
        const barContainer = document.createElement('div');
        barContainer.style.cssText = `
            margin-top: 10px;
            height: 8px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 4px;
            overflow: hidden;
            border: 1px solid rgba(0, 255, 255, 0.2);
        `;
        
        const barFill = document.createElement('div');
        barFill.style.cssText = `
            height: 100%;
            width: ${stats.averageProbability * 100}%;
            background: linear-gradient(90deg, #00ff00 0%, #00ffff 100%);
            transition: width 0.3s ease;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        barContainer.appendChild(barFill);
        this.statsElement.appendChild(barContainer);
        
        // State visualization (mini grid)
        if (stats.states.length > 0) {
            const gridContainer = document.createElement('div');
            gridContainer.style.cssText = `
                margin-top: 10px;
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                gap: 2px;
                padding: 5px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            `;
            
            const gridTitle = document.createElement('div');
            gridTitle.textContent = 'State Grid:';
            gridTitle.style.cssText = `
                grid-column: 1 / -1;
                font-size: 10px;
                color: rgba(0, 255, 255, 0.6);
                margin-bottom: 5px;
            `;
            gridContainer.appendChild(gridTitle);
            
            // Show first 20 states as colored squares
            const displayCount = Math.min(20, stats.states.length);
            for (let i = 0; i < displayCount; i++) {
                const cell = document.createElement('div');
                cell.style.cssText = `
                    aspect-ratio: 1;
                    background: ${stats.states[i] === 1 ? '#00ff00' : '#ff0088'};
                    border-radius: 2px;
                    opacity: ${stats.probabilities[i] || 0.5};
                    box-shadow: 0 0 4px ${stats.states[i] === 1 ? '#00ff00' : '#ff0088'};
                `;
                gridContainer.appendChild(cell);
            }
            
            this.statsElement.appendChild(gridContainer);
        }
    }
    
    /**
     * Creates a stat row element.
     * @param {string} label - Label text
     * @param {string} value - Value text
     * @param {string} color - Text color
     * @returns {HTMLElement}
     * @private
     */
    _createStatRow(label, value, color) {
        const row = document.createElement('div');
        row.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        `;
        
        const labelEl = document.createElement('span');
        labelEl.textContent = label + ':';
        labelEl.style.cssText = `
            color: rgba(0, 255, 255, 0.7);
        `;
        
        const valueEl = document.createElement('span');
        valueEl.textContent = value;
        valueEl.style.cssText = `
            color: ${color};
            font-weight: bold;
            text-shadow: 0 0 5px ${color};
        `;
        
        row.appendChild(labelEl);
        row.appendChild(valueEl);
        
        return row;
    }
    
    /**
     * Updates the display with new pbit statistics.
     * @param {object} stats - Pbit statistics object
     * @param {number} [energy] - Current energy value
     * @param {number} [temperature] - Temperature parameter
     */
    update(stats, energy = null, temperature = null) {
        this._updateStats(stats, energy, temperature);
        this.show();
    }
    
    /**
     * Shows the pbit display.
     */
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.displayElement.style.opacity = '1';
    }
    
    /**
     * Hides the pbit display.
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.displayElement.style.opacity = '0';
    }
    
    /**
     * Toggles the pbit display visibility.
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Cleans up the display element.
     */
    dispose() {
        if (this.displayElement && this.displayElement.parentNode) {
            this.displayElement.parentNode.removeChild(this.displayElement);
        }
    }
}

