/*
 * Copyright 2025 Lavelle Hatcher Jr
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * AttentionMechanism - Implements selective attention for NPCs
 * 
 * Based on transformer-style attention mechanisms, this system
 * determines what NPCs focus on and how they prioritize information.
 * 
 * @class AttentionMechanism
 */
export class AttentionMechanism {
    constructor(config = {}) {
        this.config = {
            attentionSpan: 7,               // Number of items to attend to
            focusDecayRate: 0.1,            // How quickly focus fades
            salienceThreshold: 0.3,         // Minimum salience to capture attention
            contextWindow: 20,              // Size of context window
            attentionHeads: 4,              // Multi-head attention
            ...config
        };

        // Attention state
        this.currentFocus = null;
        this.attentionQueue = [];
        this.salienceMap = new Map();
        
        // Context buffer
        this.contextBuffer = [];
        
        // Attention weights
        this.weights = this._initializeWeights();
    }

    /**
     * Create an attention instance for an NPC
     * 
     * @returns {AttentionInstance} Individual attention instance
     */
    createInstance() {
        return new AttentionInstance({
            config: this.config,
            parent: this
        });
    }

    /**
     * Initialize attention weights
     * @private
     */
    _initializeWeights() {
        return {
            // Feature importance weights
            novelty: 0.3,
            relevance: 0.25,
            urgency: 0.2,
            emotional: 0.15,
            social: 0.1
        };
    }

    /**
     * Calculate salience score for a stimulus
     * 
     * @param {Object} stimulus - Input stimulus
     * @param {Object} context - Current context
     * @returns {number} Salience score (0-1)
     */
    calculateSalience(stimulus, context) {
        let salience = 0;
        
        // Novelty - how different from recent stimuli
        salience += this.weights.novelty * this._calculateNovelty(stimulus, context);
        
        // Relevance - how relevant to current goals/state
        salience += this.weights.relevance * this._calculateRelevance(stimulus, context);
        
        // Urgency - time-sensitive or threatening
        salience += this.weights.urgency * this._calculateUrgency(stimulus);
        
        // Emotional intensity
        salience += this.weights.emotional * this._calculateEmotionalIntensity(stimulus);
        
        // Social importance
        salience += this.weights.social * this._calculateSocialImportance(stimulus, context);
        
        return Math.min(1, Math.max(0, salience));
    }

    /**
     * Multi-head attention mechanism
     * 
     * @param {Array} inputs - Array of input stimuli
     * @param {Object} query - Query context
     * @returns {Array} Attended outputs with attention weights
     */
    multiHeadAttention(inputs, query) {
        const heads = [];
        
        // Process through each attention head
        for (let h = 0; h < this.config.attentionHeads; h++) {
            const headAttention = this._singleHeadAttention(inputs, query, h);
            heads.push(headAttention);
        }
        
        // Combine heads
        return this._combineHeads(heads);
    }

    /**
     * Single attention head processing
     * @private
     */
    _singleHeadAttention(inputs, query, headIndex) {
        const scores = [];
        
        // Calculate attention scores for each input
        for (const input of inputs) {
            const score = this._attentionScore(query, input, headIndex);
            scores.push(score);
        }
        
        // Apply softmax to get attention weights
        const weights = this._softmax(scores);
        
        // Apply attention weights
        const attended = inputs.map((input, i) => ({
            ...input,
            attentionWeight: weights[i],
            headIndex
        }));
        
        return attended;
    }

    /**
     * Calculate attention score between query and key
     * @private
     */
    _attentionScore(query, key, headIndex) {
        // Simplified dot-product attention
        let score = 0;
        
        // Different heads focus on different aspects
        switch (headIndex) {
            case 0: // Relevance head
                score = this._calculateRelevance(key, query);
                break;
            case 1: // Novelty head
                score = this._calculateNovelty(key, query);
                break;
            case 2: // Emotional head
                score = this._calculateEmotionalIntensity(key);
                break;
            case 3: // Urgency head
                score = this._calculateUrgency(key);
                break;
            default:
                score = Math.random(); // Fallback
        }
        
        // Scale by inverse square root of dimension
        const scale = 1 / Math.sqrt(this.config.attentionHeads);
        return score * scale;
    }

    /**
     * Combine attention heads
     * @private
     */
    _combineHeads(heads) {
        const combined = [];
        const inputCount = heads[0].length;
        
        for (let i = 0; i < inputCount; i++) {
            let totalWeight = 0;
            const item = { ...heads[0][i] };
            
            // Average weights across heads
            for (const head of heads) {
                totalWeight += head[i].attentionWeight;
            }
            
            item.attentionWeight = totalWeight / heads.length;
            combined.push(item);
        }
        
        // Sort by combined attention weight
        combined.sort((a, b) => b.attentionWeight - a.attentionWeight);
        
        return combined;
    }

    /**
     * Calculate novelty score
     * @private
     */
    _calculateNovelty(stimulus, context) {
        if (!stimulus || !context) return 0.5;
        
        // Check against context buffer
        let novelty = 1.0;
        
        for (const past of this.contextBuffer) {
            const similarity = this._calculateSimilarity(stimulus, past);
            novelty = Math.min(novelty, 1 - similarity);
        }
        
        return novelty;
    }

    /**
     * Calculate relevance to goals and current state
     * @private
     */
    _calculateRelevance(stimulus, context) {
        if (!context.goals || context.goals.length === 0) return 0.3;
        
        let maxRelevance = 0;
        
        for (const goal of context.goals) {
            let relevance = 0;
            
            // Check if stimulus relates to goal
            if (stimulus.type === goal.type) relevance += 0.5;
            if (stimulus.target === goal.target) relevance += 0.3;
            if (stimulus.category === goal.category) relevance += 0.2;
            
            maxRelevance = Math.max(maxRelevance, relevance);
        }
        
        return maxRelevance;
    }

    /**
     * Calculate urgency of stimulus
     * @private
     */
    _calculateUrgency(stimulus) {
        const urgencyMarkers = {
            threat: 1.0,
            danger: 0.9,
            warning: 0.7,
            opportunity: 0.6,
            request: 0.5,
            information: 0.2
        };
        
        return urgencyMarkers[stimulus.urgency] || 0.3;
    }

    /**
     * Calculate emotional intensity
     * @private
     */
    _calculateEmotionalIntensity(stimulus) {
        if (!stimulus.emotional) return 0;
        
        let totalIntensity = 0;
        let count = 0;
        
        for (const emotion of Object.values(stimulus.emotional)) {
            if (typeof emotion === 'number') {
                totalIntensity += Math.abs(emotion);
                count++;
            }
        }
        
        return count > 0 ? totalIntensity / count : 0;
    }

    /**
     * Calculate social importance
     * @private
     */
    _calculateSocialImportance(stimulus, context) {
        if (!stimulus.source) return 0;
        
        // Check relationship importance
        if (context.relationships) {
            const relationship = context.relationships.get(stimulus.source);
            if (relationship) {
                return (relationship.trust + relationship.affection + relationship.respect) / 3;
            }
        }
        
        return 0.3; // Default social importance
    }

    /**
     * Calculate similarity between stimuli
     * @private
     */
    _calculateSimilarity(stim1, stim2) {
        let similarity = 0;
        let factors = 0;
        
        if (stim1.type === stim2.type) {
            similarity += 0.3;
            factors++;
        }
        
        if (stim1.source === stim2.source) {
            similarity += 0.2;
            factors++;
        }
        
        if (stim1.target === stim2.target) {
            similarity += 0.2;
            factors++;
        }
        
        if (stim1.category === stim2.category) {
            similarity += 0.3;
            factors++;
        }
        
        return factors > 0 ? similarity / factors : 0;
    }

    /**
     * Softmax function for attention weights
     * @private
     */
    _softmax(scores) {
        const maxScore = Math.max(...scores);
        const expScores = scores.map(s => Math.exp(s - maxScore));
        const sumExp = expScores.reduce((a, b) => a + b, 0);
        return expScores.map(e => e / sumExp);
    }
}

/**
 * Individual attention instance for an NPC
 * 
 * @class AttentionInstance
 */
export class AttentionInstance {
    constructor(config) {
        this.config = config.config;
        this.parent = config.parent;
        
        // Instance state
        this.currentFocus = null;
        this.attentionBuffer = [];
        this.focusHistory = [];
        this.distractionResistance = 0.5;
        
        // Personal attention weights (can be modified by personality)
        this.personalWeights = { ...this.parent.weights };
    }

    /**
     * Focus attention on stimuli
     * 
     * @param {Array} stimuli - Array of potential stimuli
     * @param {Object} currentState - NPC's current state
     * @param {Array} goals - Current goals
     * @returns {Object} Focused attention result
     */
    focus(stimuli, currentState, goals) {
        const context = {
            ...currentState,
            goals,
            previousFocus: this.currentFocus
        };
        
        // Filter stimuli by salience
        const salientStimuli = stimuli.filter(stimulus => {
            const salience = this.parent.calculateSalience(stimulus, context);
            return salience > this.config.salienceThreshold;
        });
        
        // Apply multi-head attention
        const attended = this.parent.multiHeadAttention(salientStimuli, context);
        
        // Select top items within attention span
        const focused = attended.slice(0, this.config.attentionSpan);
        
        // Update focus if something more salient appears
        if (focused.length > 0) {
            const topStimulus = focused[0];
            
            if (this._shouldSwitchFocus(topStimulus)) {
                this.currentFocus = topStimulus;
                this.focusHistory.push({
                    stimulus: topStimulus,
                    timestamp: Date.now(),
                    duration: 0
                });
            }
        }
        
        // Update attention buffer
        this._updateAttentionBuffer(focused);
        
        // Decay old focus
        this._decayFocus();
        
        return {
            focus: this.currentFocus,
            attended: focused,
            attentionLevel: this._calculateAttentionLevel()
        };
    }

    /**
     * Attend to memories based on query
     * 
     * @param {Array} memories - Available memories
     * @param {Object} state - Current state
     * @returns {Array} Attended memories
     */
    attend(memories, state) {
        // Convert memories to attention-compatible format
        const stimuli = memories.map(memory => ({
            ...memory,
            type: memory.type || 'memory',
            source: memory.source || 'self',
            urgency: 'information'
        }));
        
        // Apply attention mechanism
        const result = this.focus(stimuli, state, state.goals || []);
        
        return result.attended;
    }

    /**
     * Check if should switch focus
     * @private
     */
    _shouldSwitchFocus(newStimulus) {
        if (!this.currentFocus) return true;
        
        // Calculate focus strength
        const currentStrength = this._calculateFocusStrength();
        const newSalience = newStimulus.attentionWeight;
        
        // Need significant difference to overcome focus inertia
        const switchThreshold = currentStrength * (1 + this.distractionResistance);
        
        return newSalience > switchThreshold;
    }

    /**
     * Calculate current focus strength
     * @private
     */
    _calculateFocusStrength() {
        if (!this.currentFocus) return 0;
        
        const lastFocus = this.focusHistory[this.focusHistory.length - 1];
        if (!lastFocus) return 0;
        
        const duration = Date.now() - lastFocus.timestamp;
        const decayFactor = Math.exp(-this.config.focusDecayRate * duration / 1000);
        
        return this.currentFocus.attentionWeight * decayFactor;
    }

    /**
     * Update attention buffer
     * @private
     */
    _updateAttentionBuffer(focused) {
        // Add new items to buffer
        this.attentionBuffer.push(...focused);
        
        // Maintain buffer size
        if (this.attentionBuffer.length > this.config.contextWindow) {
            this.attentionBuffer = this.attentionBuffer.slice(-this.config.contextWindow);
        }
    }

    /**
     * Decay focus over time
     * @private
     */
    _decayFocus() {
        if (!this.currentFocus) return;
        
        const strength = this._calculateFocusStrength();
        
        // Clear focus if too weak
        if (strength < this.config.salienceThreshold * 0.5) {
            this.currentFocus = null;
        }
    }

    /**
     * Calculate overall attention level
     * @private
     */
    _calculateAttentionLevel() {
        if (this.attentionBuffer.length === 0) return 0;
        
        const recentItems = this.attentionBuffer.slice(-this.config.attentionSpan);
        const avgWeight = recentItems.reduce((sum, item) => 
            sum + (item.attentionWeight || 0), 0) / recentItems.length;
        
        return avgWeight;
    }

    /**
     * Modify attention weights based on personality
     * 
     * @param {Object} personality - Personality traits
     */
    personalizeWeights(personality) {
        // Curious NPCs pay more attention to novelty
        if (personality.curiosity > 0.7) {
            this.personalWeights.novelty *= 1.3;
        }
        
        // Anxious NPCs focus on threats
        if (personality.neuroticism > 0.7) {
            this.personalWeights.urgency *= 1.4;
        }
        
        // Social NPCs attend to social stimuli
        if (personality.extraversion > 0.7) {
            this.personalWeights.social *= 1.3;
        }
        
        // Normalize weights
        const sum = Object.values(this.personalWeights).reduce((a, b) => a + b, 0);
        for (const key in this.personalWeights) {
            this.personalWeights[key] /= sum;
        }
        
        // Adjust distraction resistance
        this.distractionResistance = personality.conscientiousness || 0.5;
    }

    /**
     * Get attention statistics
     */
    getStats() {
        return {
            currentFocus: this.currentFocus?.type || 'none',
            attentionSpanUsed: this.attentionBuffer.length,
            focusDuration: this._getFocusDuration(),
            distractionResistance: this.distractionResistance,
            focusHistory: this.focusHistory.length
        };
    }

    /**
     * Get current focus duration
     * @private
     */
    _getFocusDuration() {
        if (!this.currentFocus || this.focusHistory.length === 0) return 0;
        
        const lastFocus = this.focusHistory[this.focusHistory.length - 1];
        return Date.now() - lastFocus.timestamp;
    }

    /**
     * Serialize attention state
     */
    serialize() {
        return {
            currentFocus: this.currentFocus,
            attentionBuffer: this.attentionBuffer.slice(-10), // Last 10 items
            focusHistory: this.focusHistory.slice(-5), // Last 5 focuses
            distractionResistance: this.distractionResistance,
            personalWeights: this.personalWeights
        };
    }

    /**
     * Deserialize attention state
     */
    deserialize(data) {
        this.currentFocus = data.currentFocus || null;
        this.attentionBuffer = data.attentionBuffer || [];
        this.focusHistory = data.focusHistory || [];
        this.distractionResistance = data.distractionResistance || 0.5;
        this.personalWeights = data.personalWeights || { ...this.parent.weights };
    }
}
