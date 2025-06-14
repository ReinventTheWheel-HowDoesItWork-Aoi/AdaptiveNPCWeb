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
 * EmotionEngine - Complex emotional state processing for adaptive NPCs
 * 
 * Implements a multi-dimensional emotional model with dynamic states,
 * emotional contagion, and mood persistence.
 * 
 * @class EmotionEngine
 */
export class EmotionEngine {
    constructor(config = {}) {
        this.config = {
            decayRate: 0.001,              // How fast emotions decay
            contagionStrength: 0.3,        // How much emotions spread
            moodInertia: 0.8,              // How resistant moods are to change
            emotionalVolatility: 0.2,      // How quickly emotions can change
            ...config
        };

        // Core emotional dimensions (based on psychological research)
        this.dimensions = {
            // Valence (positive-negative)
            happiness: { min: 0, max: 1, default: 0.7 },
            sadness: { min: 0, max: 1, default: 0.2 },
            
            // Arousal (high-low energy)
            excitement: { min: 0, max: 1, default: 0.5 },
            calmness: { min: 0, max: 1, default: 0.7 },
            
            // Approach-Avoidance
            anger: { min: 0, max: 1, default: 0.1 },
            fear: { min: 0, max: 1, default: 0.1 },
            
            // Social emotions
            love: { min: 0, max: 1, default: 0.3 },
            trust: { min: 0, max: 1, default: 0.5 },
            
            // Complex emotions
            pride: { min: 0, max: 1, default: 0.5 },
            shame: { min: 0, max: 1, default: 0.1 },
            gratitude: { min: 0, max: 1, default: 0.4 },
            envy: { min: 0, max: 1, default: 0.1 }
        };

        // Emotional state transitions
        this.transitions = this._defineTransitions();
        
        // Mood profiles (combinations of emotions)
        this.moodProfiles = this._defineMoodProfiles();
    }

    /**
     * Create a new emotional state for an NPC
     * 
     * @param {Object} personality - NPC's personality traits
     * @returns {EmotionalState} New emotional state instance
     */
    createEmotionalState(personality) {
        const state = new EmotionalState({
            dimensions: this.dimensions,
            personality,
            engine: this
        });
        
        state.initialize();
        return state;
    }

    /**
     * Process an interaction between two emotional states
     * 
     * @param {EmotionalState} source - Initiator's emotional state
     * @param {EmotionalState} target - Target's emotional state
     * @param {Object} interaction - Interaction details
     * @returns {Object} Emotional changes for both parties
     */
    async processInteraction(source, target, interaction) {
        const result = {
            source: {},
            target: {}
        };

        // Calculate emotional impact based on interaction type
        const impact = this._calculateEmotionalImpact(interaction);
        
        // Apply impact to source
        result.source = this._applyEmotionalImpact(source, impact.source, interaction);
        
        // Apply impact to target with personality modulation
        result.target = this._applyEmotionalImpact(target, impact.target, interaction);
        
        // Process emotional contagion
        this._processContagion(source, target);
        
        // Update moods based on new emotional states
        source.updateMood();
        target.updateMood();
        
        return result;
    }

    /**
     * Process emotional decay over time
     * 
     * @param {EmotionalState} state - Emotional state to decay
     */
    processDecay(state) {
        const decayRate = this.config.decayRate;
        
        // Emotions decay toward baseline
        for (const [emotion, value] of Object.entries(state.emotions)) {
            const baseline = this.dimensions[emotion].default;
            const delta = (baseline - value) * decayRate;
            
            state.emotions[emotion] = Math.max(0, Math.min(1, value + delta));
        }
        
        // Update mood after decay
        state.updateMood();
    }

    /**
     * Calculate emotional impact of an interaction
     * @private
     */
    _calculateEmotionalImpact(interaction) {
        const impacts = {
            // Positive interactions
            help: {
                source: { happiness: 0.2, pride: 0.15, trust: 0.1 },
                target: { gratitude: 0.3, happiness: 0.2, trust: 0.15 }
            },
            compliment: {
                source: { happiness: 0.1, love: 0.05 },
                target: { happiness: 0.25, pride: 0.2, trust: 0.1 }
            },
            gift: {
                source: { happiness: 0.15, love: 0.1 },
                target: { gratitude: 0.25, happiness: 0.2, love: 0.1 }
            },
            
            // Neutral interactions
            trade: {
                source: { excitement: 0.1, trust: 0.05 },
                target: { excitement: 0.1, trust: 0.05 }
            },
            question: {
                source: { excitement: 0.05 },
                target: { pride: 0.05, excitement: -0.05 }
            },
            
            // Negative interactions
            insult: {
                source: { anger: 0.1, happiness: -0.1 },
                target: { anger: 0.2, sadness: 0.15, shame: 0.1, trust: -0.2 }
            },
            threat: {
                source: { anger: 0.2, excitement: 0.1 },
                target: { fear: 0.3, anger: 0.15, trust: -0.3 }
            },
            betray: {
                source: { shame: 0.1, happiness: -0.2 },
                target: { anger: 0.3, sadness: 0.2, trust: -0.5 }
            }
        };

        // Get base impact or default
        const baseImpact = impacts[interaction.action] || {
            source: {},
            target: {}
        };

        // Modulate based on interaction context
        return this._modulateImpact(baseImpact, interaction);
    }

    /**
     * Modulate emotional impact based on context
     * @private
     */
    _modulateImpact(baseImpact, interaction) {
        const modulated = {
            source: { ...baseImpact.source },
            target: { ...baseImpact.target }
        };

        // Intensity modifier
        if (interaction.intensity) {
            for (const emotions of [modulated.source, modulated.target]) {
                for (const [emotion, value] of Object.entries(emotions)) {
                    emotions[emotion] = value * interaction.intensity;
                }
            }
        }

        // Emotional context modifier
        if (interaction.emotion) {
            const emotionModifiers = {
                friendly: { happiness: 0.1, trust: 0.05 },
                hostile: { anger: 0.1, trust: -0.1 },
                playful: { excitement: 0.1, happiness: 0.05 },
                serious: { calmness: 0.1, excitement: -0.05 }
            };

            const modifier = emotionModifiers[interaction.emotion];
            if (modifier) {
                for (const [emotion, value] of Object.entries(modifier)) {
                    if (modulated.target[emotion] !== undefined) {
                        modulated.target[emotion] += value;
                    } else {
                        modulated.target[emotion] = value;
                    }
                }
            }
        }

        return modulated;
    }

    /**
     * Apply emotional impact to a state
     * @private
     */
    _applyEmotionalImpact(state, impact, interaction) {
        const changes = {};
        
        for (const [emotion, delta] of Object.entries(impact)) {
            const current = state.emotions[emotion] || 0;
            
            // Apply personality modulation
            const modulated = this._modulateByPersonality(
                emotion,
                delta,
                state.personality
            );
            
            // Apply volatility
            const volatility = state.personality.neuroticism || 0.5;
            const finalDelta = modulated * (1 + volatility * this.config.emotionalVolatility);
            
            // Update emotion
            const newValue = Math.max(0, Math.min(1, current + finalDelta));
            state.emotions[emotion] = newValue;
            changes[emotion] = newValue - current;
        }
        
        // Record emotional event
        state.emotionalHistory.push({
            timestamp: Date.now(),
            interaction,
            changes,
            resultingMood: state.currentMood
        });
        
        return changes;
    }

    /**
     * Modulate emotional impact by personality
     * @private
     */
    _modulateByPersonality(emotion, delta, personality) {
        const modulations = {
            happiness: {
                optimism: 1.2,
                neuroticism: -0.3
            },
            sadness: {
                optimism: -0.3,
                neuroticism: 1.3
            },
            anger: {
                agreeableness: -0.4,
                patience: -0.3
            },
            fear: {
                courage: -0.5,
                neuroticism: 1.2
            },
            trust: {
                trust: 1.5,
                suspicious: -0.5
            }
        };

        let multiplier = 1.0;
        const emotionMods = modulations[emotion] || {};
        
        for (const [trait, modifier] of Object.entries(emotionMods)) {
            const traitValue = personality[trait] || 0.5;
            multiplier += (traitValue - 0.5) * modifier;
        }
        
        return delta * Math.max(0.1, multiplier);
    }

    /**
     * Process emotional contagion between states
     * @private
     */
    _processContagion(source, target) {
        const contagionStrength = this.config.contagionStrength;
        
        // Contagious emotions
        const contagiousEmotions = [
            'happiness', 'excitement', 'fear', 'anger', 'sadness'
        ];
        
        for (const emotion of contagiousEmotions) {
            const sourcePower = source.emotions[emotion] * source.getEmotionalExpressiveness();
            const targetReceptivity = target.getEmotionalReceptivity();
            
            const contagion = sourcePower * targetReceptivity * contagionStrength;
            
            if (contagion > 0.01) {
                target.emotions[emotion] = Math.min(1, 
                    target.emotions[emotion] + contagion
                );
            }
        }
    }

    /**
     * Define emotional state transitions
     * @private
     */
    _defineTransitions() {
        return {
            // Happiness can lead to excitement
            happiness: {
                excitement: 0.3,
                calmness: 0.2
            },
            // Sadness can lead to calmness or anger
            sadness: {
                calmness: 0.3,
                anger: 0.1
            },
            // Fear can transition to anger
            fear: {
                anger: 0.2,
                sadness: 0.1
            },
            // Anger can become sadness
            anger: {
                sadness: 0.2,
                fear: 0.1
            }
        };
    }

    /**
     * Define mood profiles
     * @private
     */
    _defineMoodProfiles() {
        return {
            joyful: {
                emotions: { happiness: 0.8, excitement: 0.6, trust: 0.6 },
                emoji: '😊',
                description: 'Feeling happy and energetic'
            },
            content: {
                emotions: { happiness: 0.6, calmness: 0.7, trust: 0.5 },
                emoji: '😌',
                description: 'Peaceful and satisfied'
            },
            excited: {
                emotions: { excitement: 0.8, happiness: 0.5 },
                emoji: '🤗',
                description: 'Energetic and enthusiastic'
            },
            anxious: {
                emotions: { fear: 0.6, excitement: 0.7, calmness: 0.2 },
                emoji: '😰',
                description: 'Worried and on edge'
            },
            angry: {
                emotions: { anger: 0.7, excitement: 0.6, happiness: 0.2 },
                emoji: '😠',
                description: 'Frustrated and upset'
            },
            sad: {
                emotions: { sadness: 0.7, calmness: 0.3, happiness: 0.2 },
                emoji: '😢',
                description: 'Feeling down and melancholy'
            },
            loving: {
                emotions: { love: 0.8, happiness: 0.7, trust: 0.8 },
                emoji: '🥰',
                description: 'Affectionate and warm'
            },
            proud: {
                emotions: { pride: 0.8, happiness: 0.6, excitement: 0.5 },
                emoji: '😤',
                description: 'Accomplished and confident'
            },
            grateful: {
                emotions: { gratitude: 0.8, happiness: 0.7, trust: 0.6 },
                emoji: '🙏',
                description: 'Thankful and appreciative'
            },
            neutral: {
                emotions: { calmness: 0.5, happiness: 0.5 },
                emoji: '😐',
                description: 'Balanced emotional state'
            }
        };
    }
}

/**
 * Individual emotional state for an NPC
 * 
 * @class EmotionalState
 */
export class EmotionalState {
    constructor(config) {
        this.dimensions = config.dimensions;
        this.personality = config.personality;
        this.engine = config.engine;
        
        // Current emotional values
        this.emotions = {};
        
        // Mood state
        this.currentMood = 'neutral';
        this.moodHistory = [];
        
        // Emotional memory
        this.emotionalHistory = [];
        this.maxHistorySize = 100;
        
        // Emotional tendencies
        this.baselines = {};
        this.volatility = 0.5;
    }

    /**
     * Initialize emotional state
     */
    initialize() {
        // Set initial emotions based on personality
        for (const [emotion, config] of Object.entries(this.dimensions)) {
            this.emotions[emotion] = this._calculateBaseline(emotion);
            this.baselines[emotion] = this.emotions[emotion];
        }
        
        // Set initial mood
        this.updateMood();
        
        // Calculate emotional volatility from personality
        this.volatility = this.personality.neuroticism || 0.5;
    }

    /**
     * Update current mood based on emotional state
     */
    updateMood() {
        let bestMatch = 'neutral';
        let bestScore = -Infinity;
        
        // Find best matching mood profile
        for (const [mood, profile] of Object.entries(this.engine.moodProfiles)) {
            const score = this._calculateMoodScore(profile.emotions);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = mood;
            }
        }
        
        // Apply mood inertia
        if (this.currentMood !== bestMatch) {
            const inertia = this.engine.config.moodInertia;
            const switchThreshold = 0.3 * inertia;
            
            if (bestScore > switchThreshold) {
                const previousMood = this.currentMood;
                this.currentMood = bestMatch;
                
                // Record mood change
                this.moodHistory.push({
                    from: previousMood,
                    to: bestMatch,
                    timestamp: Date.now(),
                    trigger: this.emotionalHistory[this.emotionalHistory.length - 1]
                });
                
                // Limit history
                if (this.moodHistory.length > 50) {
                    this.moodHistory.shift();
                }
            }
        }
    }

    /**
     * Get emotional expressiveness (how much emotions show)
     */
    getEmotionalExpressiveness() {
        const extraversion = this.personality.extraversion || 0.5;
        const openness = this.personality.openness || 0.5;
        return (extraversion + openness) / 2;
    }

    /**
     * Get emotional receptivity (how easily influenced by others)
     */
    getEmotionalReceptivity() {
        const agreeableness = this.personality.agreeableness || 0.5;
        const neuroticism = this.personality.neuroticism || 0.5;
        const empathy = this.personality.empathy || 0.5;
        return (agreeableness + neuroticism + empathy) / 3;
    }

    /**
     * Get dominant emotion
     */
    getDominantEmotion() {
        let dominant = 'neutral';
        let maxValue = 0;
        
        for (const [emotion, value] of Object.entries(this.emotions)) {
            if (value > maxValue && value > 0.3) {
                maxValue = value;
                dominant = emotion;
            }
        }
        
        return { emotion: dominant, intensity: maxValue };
    }

    /**
     * Calculate baseline emotion from personality
     * @private
     */
    _calculateBaseline(emotion) {
        const baseline = this.dimensions[emotion].default;
        
        // Personality influences on baseline emotions
        const influences = {
            happiness: {
                optimism: 0.3,
                extraversion: 0.2,
                neuroticism: -0.2
            },
            sadness: {
                optimism: -0.2,
                neuroticism: 0.3
            },
            excitement: {
                extraversion: 0.3,
                openness: 0.2
            },
            calmness: {
                neuroticism: -0.3,
                conscientiousness: 0.2
            },
            trust: {
                agreeableness: 0.3,
                trust: 0.4
            },
            love: {
                agreeableness: 0.2,
                empathy: 0.3
            }
        };
        
        let adjustedBaseline = baseline;
        const emotionInfluences = influences[emotion] || {};
        
        for (const [trait, influence] of Object.entries(emotionInfluences)) {
            const traitValue = this.personality[trait] || 0.5;
            adjustedBaseline += (traitValue - 0.5) * influence;
        }
        
        return Math.max(0, Math.min(1, adjustedBaseline));
    }

    /**
     * Calculate mood match score
     * @private
     */
    _calculateMoodScore(moodEmotions) {
        let score = 0;
        let count = 0;
        
        for (const [emotion, targetValue] of Object.entries(moodEmotions)) {
            const currentValue = this.emotions[emotion] || 0;
            const diff = Math.abs(currentValue - targetValue);
            score += (1 - diff) * targetValue; // Weight by target intensity
            count++;
        }
        
        return count > 0 ? score / count : 0;
    }

    /**
     * Serialize emotional state
     */
    serialize() {
        return {
            emotions: { ...this.emotions },
            currentMood: this.currentMood,
            moodHistory: this.moodHistory.slice(-10),
            baselines: { ...this.baselines },
            volatility: this.volatility
        };
    }

    /**
     * Deserialize emotional state
     */
    deserialize(data) {
        this.emotions = { ...data.emotions };
        this.currentMood = data.currentMood;
        this.moodHistory = data.moodHistory || [];
        this.baselines = { ...data.baselines };
        this.volatility = data.volatility;
    }
}
