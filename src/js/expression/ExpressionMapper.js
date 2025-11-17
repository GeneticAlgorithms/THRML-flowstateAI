/**
 * Maps facial expression scores from Hume API to visualization parameters.
 * Converts emotions (Joy, Sadness, Anger, etc.) to RGB colors, bloom effects, and particle properties.
 */
export default class ExpressionMapper {
    /**
     * Creates an ExpressionMapper instance.
     * @param {object} options - Configuration options
     * @param {number} [options.smoothingFactor=0.1] - Smoothing factor for parameter transitions (0-1)
     */
    constructor(options = {}) {
        this.smoothingFactor = options.smoothingFactor || 0.1;
        
        // Store previous values for smoothing
        this.previousColors = { red: 1.0, green: 1.0, blue: 1.0 };
        this.previousBloom = { threshold: 0.3, strength: 0.25, radius: 0.8 };
        
        // Emotion to color mapping weights
        this.emotionColorWeights = {
            'Joy': { red: 1.0, green: 0.8, blue: 0.2 },
            'Sadness': { red: 0.2, green: 0.3, blue: 0.9 },
            'Anger': { red: 1.0, green: 0.2, blue: 0.1 },
            'Surprise (positive)': { red: 1.0, green: 1.0, blue: 0.3 },
            'Surprise (negative)': { red: 0.8, green: 0.3, blue: 0.8 },
            'Fear': { red: 0.5, green: 0.1, blue: 0.8 },
            'Disgust': { red: 0.3, green: 0.7, blue: 0.2 },
            'Contempt': { red: 0.6, green: 0.6, blue: 0.6 },
            'Calmness': { red: 0.4, green: 0.6, blue: 0.8 },
            'Contentment': { red: 0.7, green: 0.8, blue: 0.5 },
            'Admiration': { red: 0.9, green: 0.7, blue: 0.8 },
            'Amusement': { red: 1.0, green: 0.9, blue: 0.3 },
            'Triumph': { red: 1.0, green: 0.6, blue: 0.2 }
        };
    }

    /**
     * Maps facial expression emotions to RGB color values.
     * @param {Array} emotions - Array of emotion objects with {name: string, score: number}
     * @returns {object} Object with u_red, u_green, u_blue values (0-1)
     */
    mapToColors(emotions) {
        if (!emotions || emotions.length === 0) {
            return {
                u_red: this.previousColors.red,
                u_green: this.previousColors.green,
                u_blue: this.previousColors.blue
            };
        }

        let totalWeight = 0;
        let weightedRed = 0;
        let weightedGreen = 0;
        let weightedBlue = 0;

        // Calculate weighted average of colors based on emotion scores
        for (const emotion of emotions) {
            const name = emotion.name;
            const score = emotion.score || 0;
            
            if (this.emotionColorWeights[name]) {
                const weights = this.emotionColorWeights[name];
                const weight = score;
                
                weightedRed += weights.red * weight;
                weightedGreen += weights.green * weight;
                weightedBlue += weights.blue * weight;
                totalWeight += weight;
            }
        }

        // Normalize to 0-1 range
        let red, green, blue;
        if (totalWeight > 0) {
            red = Math.max(0, Math.min(1, weightedRed / totalWeight));
            green = Math.max(0, Math.min(1, weightedGreen / totalWeight));
            blue = Math.max(0, Math.min(1, weightedBlue / totalWeight));
        } else {
            // Fallback to neutral colors
            red = 0.7;
            green = 0.7;
            blue = 0.7;
        }

        // Apply smoothing
        red = this._smoothValue(this.previousColors.red, red);
        green = this._smoothValue(this.previousColors.green, green);
        blue = this._smoothValue(this.previousColors.blue, blue);

        // Update previous values
        this.previousColors = { red, green, blue };

        return {
            u_red: red,
            u_green: green,
            u_blue: blue
        };
    }

    /**
     * Maps facial expression intensity to bloom effect parameters.
     * @param {Array} emotions - Array of emotion objects with {name: string, score: number}
     * @returns {object} Object with threshold, strength, radius values (0-1)
     */
    mapToBloom(emotions) {
        if (!emotions || emotions.length === 0) {
            return {
                threshold: this.previousBloom.threshold,
                strength: this.previousBloom.strength,
                radius: this.previousBloom.radius
            };
        }

        // Calculate overall intensity (average of top emotions)
        const sortedEmotions = [...emotions].sort((a, b) => (b.score || 0) - (a.score || 0));
        const topEmotions = sortedEmotions.slice(0, 3);
        const avgIntensity = topEmotions.reduce((sum, e) => sum + (e.score || 0), 0) / Math.max(topEmotions.length, 1);

        // Map intensity to bloom parameters
        // Higher intensity = lower threshold (more things glow), higher strength, larger radius
        const threshold = Math.max(0.1, Math.min(0.5, 0.4 - (avgIntensity * 0.3)));
        const strength = Math.max(0.1, Math.min(0.8, 0.2 + (avgIntensity * 0.6)));
        const radius = Math.max(0.3, Math.min(1.0, 0.6 + (avgIntensity * 0.4)));

        // Apply smoothing
        const smoothedThreshold = this._smoothValue(this.previousBloom.threshold, threshold);
        const smoothedStrength = this._smoothValue(this.previousBloom.strength, strength);
        const smoothedRadius = this._smoothValue(this.previousBloom.radius, radius);

        // Update previous values
        this.previousBloom = {
            threshold: smoothedThreshold,
            strength: smoothedStrength,
            radius: smoothedRadius
        };

        return {
            threshold: smoothedThreshold,
            strength: smoothedStrength,
            radius: smoothedRadius
        };
    }

    /**
     * Maps facial expressions to particle effect properties.
     * @param {Array} emotions - Array of emotion objects with {name: string, score: number}
     * @returns {object} Object with particle effect properties
     */
    mapToParticleProperties(emotions) {
        if (!emotions || emotions.length === 0) {
            return {
                maxKickForce: 10,
                gravity: -19.8,
                expansionSpeed: 2.0
            };
        }

        // Find dominant emotion
        const dominantEmotion = emotions.reduce((max, e) => 
            (e.score || 0) > (max.score || 0) ? e : max, emotions[0]);

        const emotionName = dominantEmotion.name;
        const intensity = dominantEmotion.score || 0;

        // Map emotions to particle behavior
        let maxKickForce = 10;
        let gravity = -19.8;
        let expansionSpeed = 2.0;

        if (emotionName === 'Joy' || emotionName === 'Amusement' || emotionName === 'Triumph') {
            // Energetic, bouncy particles
            maxKickForce = 10 + (intensity * 5);
            gravity = -19.8 - (intensity * 5);
            expansionSpeed = 2.0 + (intensity * 2);
        } else if (emotionName === 'Sadness' || emotionName === 'Calmness') {
            // Slower, calmer particles
            maxKickForce = 5 + (intensity * 3);
            gravity = -15.0;
            expansionSpeed = 1.0 + (intensity * 1);
        } else if (emotionName === 'Anger' || emotionName === 'Fear') {
            // Intense, chaotic particles
            maxKickForce = 12 + (intensity * 8);
            gravity = -22.0;
            expansionSpeed = 3.0 + (intensity * 2);
        } else if (emotionName === 'Surprise (positive)' || emotionName === 'Surprise (negative)') {
            // Explosive particles
            maxKickForce = 15 + (intensity * 5);
            gravity = -20.0;
            expansionSpeed = 4.0 + (intensity * 1);
        } else {
            // Default moderate behavior
            maxKickForce = 8 + (intensity * 4);
            gravity = -19.8;
            expansionSpeed = 2.0 + (intensity * 1);
        }

        return {
            maxKickForce: Math.max(5, Math.min(20, maxKickForce)),
            gravity: Math.max(-25, Math.min(-10, gravity)),
            expansionSpeed: Math.max(0.5, Math.min(5, expansionSpeed))
        };
    }

    /**
     * Smooths a value transition to avoid jitter.
     * @param {number} previous - Previous value
     * @param {number} current - Current target value
     * @returns {number} Smoothed value
     * @private
     */
    _smoothValue(previous, current) {
        return previous + (current - previous) * this.smoothingFactor;
    }

    /**
     * Resets smoothing state (useful when starting fresh).
     */
    reset() {
        this.previousColors = { red: 1.0, green: 1.0, blue: 1.0 };
        this.previousBloom = { threshold: 0.3, strength: 0.25, radius: 0.8 };
    }
}

