/**
 * Manages the futuristic conversation display box showing user input and AI responses.
 */
export default class ConversationDisplay {
    constructor() {
        this.displayElement = null;
        this.conversationContainer = null;
        this.isVisible = false;
        this.messageCount = 0;
        this.maxMessages = 10; // Keep last 10 messages
        
        this._createDisplay();
        
        console.log('[ConversationDisplay] Initialized');
    }
    
    /**
     * Creates the futuristic conversation display UI.
     * @private
     */
    _createDisplay() {
        // Create main container
        this.displayElement = document.createElement('div');
        this.displayElement.id = 'conversation-display';
        this.displayElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 600px;
            background: linear-gradient(135deg, rgba(10, 10, 30, 0.95) 0%, rgba(20, 20, 50, 0.95) 100%);
            color: #00ffff;
            padding: 0;
            border-radius: 16px;
            font-family: 'Courier New', monospace;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(0, 255, 255, 0.3);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.5),
                0 0 20px rgba(0, 255, 255, 0.2),
                inset 0 0 20px rgba(0, 255, 255, 0.05);
            z-index: 998;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid rgba(0, 255, 255, 0.2);
            background: linear-gradient(90deg, rgba(0, 255, 255, 0.1) 0%, transparent 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        
        const title = document.createElement('div');
        title.textContent = '💬 CONVERSATION';
        title.style.cssText = `
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        `;
        
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'conversation-status';
        statusIndicator.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 0, 0, 0.5);
            box-shadow: 0 0 8px rgba(255, 0, 0, 0.5);
            animation: pulse 2s infinite;
        `;
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes glow {
                0%, 100% { text-shadow: 0 0 5px rgba(0, 255, 255, 0.5); }
                50% { text-shadow: 0 0 15px rgba(0, 255, 255, 0.8), 0 0 25px rgba(0, 255, 255, 0.4); }
            }
        `;
        document.head.appendChild(style);
        
        header.appendChild(title);
        header.appendChild(statusIndicator);
        
        // Create conversation container with scroll
        this.conversationContainer = document.createElement('div');
        this.conversationContainer.id = 'conversation-messages';
        this.conversationContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            max-height: 500px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        `;
        
        // Custom scrollbar styling
        this.conversationContainer.style.cssText += `
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 255, 255, 0.3) transparent;
        `;
        
        // Webkit scrollbar
        const scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = `
            #conversation-messages::-webkit-scrollbar {
                width: 6px;
            }
            #conversation-messages::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
            }
            #conversation-messages::-webkit-scrollbar-thumb {
                background: rgba(0, 255, 255, 0.3);
                border-radius: 3px;
            }
            #conversation-messages::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 255, 255, 0.5);
            }
        `;
        document.head.appendChild(scrollbarStyle);
        
        // Assemble display
        this.displayElement.appendChild(header);
        this.displayElement.appendChild(this.conversationContainer);
        
        // Add to DOM
        document.body.appendChild(this.displayElement);
    }
    
    /**
     * Adds a user message to the conversation.
     * @param {string} text - User's spoken input
     */
    addUserMessage(text) {
        if (!text || !text.trim()) return;
        
        const messageElement = this._createMessageElement(text, 'user');
        this.conversationContainer.appendChild(messageElement);
        this._scrollToBottom();
        this._limitMessages();
        this.show();
        
        console.log('[ConversationDisplay] Added user message:', text);
    }
    
    /**
     * Adds an AI response to the conversation.
     * @param {string} text - AI's response
     */
    addAIResponse(text) {
        if (!text || !text.trim()) return;
        
        const messageElement = this._createMessageElement(text, 'ai');
        this.conversationContainer.appendChild(messageElement);
        this._scrollToBottom();
        this._limitMessages();
        this.show();
        
        console.log('[ConversationDisplay] Added AI response:', text);
    }
    
    /**
     * Creates a message element with futuristic styling.
     * @param {string} text - Message text
     * @param {string} type - 'user' or 'ai'
     * @returns {HTMLElement}
     * @private
     */
    _createMessageElement(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        
        const isUser = type === 'user';
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        messageDiv.style.cssText = `
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 8px;
            animation: slideIn 0.3s ease-out;
            position: relative;
            ${isUser 
                ? `background: linear-gradient(135deg, rgba(0, 150, 255, 0.2) 0%, rgba(0, 100, 200, 0.15) 100%);
                   border-left: 3px solid rgba(0, 150, 255, 0.6);
                   align-self: flex-end;
                   max-width: 85%;
                   margin-left: auto;`
                : `background: linear-gradient(135deg, rgba(0, 255, 200, 0.15) 0%, rgba(0, 200, 150, 0.1) 100%);
                   border-left: 3px solid rgba(0, 255, 200, 0.6);
                   align-self: flex-start;
                   max-width: 85%;
                   margin-right: auto;`
            }
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        `;
        
        const label = document.createElement('div');
        label.textContent = isUser ? '👤 USER' : '🤖 AI';
        label.style.cssText = `
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 1px;
            color: ${isUser ? '#0096ff' : '#00ffc8'};
            margin-bottom: 6px;
            text-transform: uppercase;
            opacity: 0.8;
        `;
        
        const content = document.createElement('div');
        content.textContent = text;
        content.style.cssText = `
            font-size: 13px;
            line-height: 1.6;
            color: #e0e0e0;
            word-wrap: break-word;
        `;
        
        const time = document.createElement('div');
        time.textContent = timestamp;
        time.style.cssText = `
            font-size: 9px;
            color: rgba(0, 255, 255, 0.4);
            margin-top: 6px;
            text-align: right;
        `;
        
        messageDiv.appendChild(label);
        messageDiv.appendChild(content);
        messageDiv.appendChild(time);
        
        this.messageCount++;
        return messageDiv;
    }
    
    /**
     * Updates the status indicator.
     * @param {string} status - 'listening', 'processing', or 'idle'
     */
    updateStatus(status) {
        const statusIndicator = document.getElementById('conversation-status');
        if (!statusIndicator) return;
        
        const colors = {
            'listening': { bg: 'rgba(0, 255, 0, 0.8)', shadow: 'rgba(0, 255, 0, 0.8)' },
            'processing': { bg: 'rgba(255, 255, 0, 0.8)', shadow: 'rgba(255, 255, 0, 0.8)' },
            'idle': { bg: 'rgba(255, 0, 0, 0.5)', shadow: 'rgba(255, 0, 0, 0.5)' }
        };
        
        const color = colors[status] || colors.idle;
        statusIndicator.style.background = color.bg;
        statusIndicator.style.boxShadow = `0 0 8px ${color.shadow}`;
    }
    
    /**
     * Scrolls to the bottom of the conversation.
     * @private
     */
    _scrollToBottom() {
        setTimeout(() => {
            this.conversationContainer.scrollTop = this.conversationContainer.scrollHeight;
        }, 100);
    }
    
    /**
     * Limits the number of messages displayed.
     * @private
     */
    _limitMessages() {
        const messages = this.conversationContainer.querySelectorAll('.message');
        if (messages.length > this.maxMessages) {
            const toRemove = messages.length - this.maxMessages;
            for (let i = 0; i < toRemove; i++) {
                messages[i].remove();
            }
        }
    }
    
    /**
     * Clears all messages.
     */
    clear() {
        this.conversationContainer.innerHTML = '';
        this.messageCount = 0;
        console.log('[ConversationDisplay] Cleared conversation');
    }
    
    /**
     * Shows the conversation display.
     */
    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.displayElement.style.opacity = '1';
        console.log('[ConversationDisplay] Showing display');
    }
    
    /**
     * Hides the conversation display.
     */
    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.displayElement.style.opacity = '0';
        console.log('[ConversationDisplay] Hiding display');
    }
    
    /**
     * Toggles the conversation display visibility.
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
        console.log('[ConversationDisplay] Disposed');
    }
}

