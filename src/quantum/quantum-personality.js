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

import QuantumSimulator from './quantum-simulator.js';

/**
 * QuantumPersonality - Quantum-inspired personality generation system
 * 
 * Uses quantum superposition and entanglement concepts to create
 * personalities that are probabilistic, unique, and can collapse
 * into specific states based on observations (interactions).
 * 
 * @class QuantumPersonality
 */
export class QuantumPersonality {
    constructor(config = {}) {
        this.config = {
            dimensionality: 16,          // Number of personality dimensions
            coherenceTime: 1000,         // How long superpositions last (ms)
            entanglementStrength: 0.3,   // How strongly personalities influence each other
            observationImpact: 0.1,      // How much observations affect collapse
            quantumNoise: 0.05,          // Quantum uncertainty level
            ...config
        };

        // Initialize quantum simulator
        this.simulator = new QuantumSimulator({
            qubits: this.config.dimensionality
        });

        // Personality dimension definitions
        this.dimensions = {
            // Core traits (Big Five inspired)
            openness: { min: 'traditional', max: 'innovative' },
            conscientiousness: { min: 'spontaneous', max: 'organized' },
            extraversion: { min: 'introverted', max: 'extroverted' },
            agreeableness: { min: 'competitive', max: 'cooperative' },
            neuroticism: { min: 'calm', max: 'reactive' },
            
            // Additional dimensions
            curiosity: { min: 'incurious', max: 'curious' },
            courage: { min: 'cautious', max: 'brave' },
            loyalty: { min: 'independent', max: 'loyal' },
            humor: { min: 'serious', max: 'playful' },
            empathy: { min: 'detached', max: 'empathetic' },
            
            // Behavioral dimensions
            riskTaking: { min: 'risk-averse', max: 'risk-seeking' },
            patience: { min: 'impatient', max: 'patient' },
            creativity: { min: 'conventional', max: 'creative' },
            ambition: { min: 'content', max: 'ambitious' },
            trust: { min: 'suspicious', max: 'trusting' },
            optimism: { min: 'pessimistic', max: 'optimistic' }
        };

        // Quantum state registry for entangled personalities
        this.entanglementRegistry = new Map();
        
        // Observation history affects future collapses
        this.observationHistory = new Map();
    }

    /**
     * Generate a new quantum personality
     * 
     * @param {Object} baseTraits - Optional base personality traits
     * @returns {QuantumPersonalityInstance} A quantum personality instance
     */
    generatePersonality(baseTraits = {}) {
        const instance = new QuantumPersonalityInstance({
            dimensions: this.dimensions,
            simulator: this.simulator,
            config: this.config,
            baseTraits
        });

        // Initialize quantum state
        instance.initialize();

        return instance;
    }

    /**
     * Entangle two personalities (they influence each other)
     * 
     * @param {string} id1 - First personality ID
     * @param {string} id2 - Second personality ID
     * @param {number} strength - Entanglement strength (0-1)
     */
    entangle(id1, id2, strength = this.config.entanglementStrength) {
        if (!this.entanglementRegistry.has(id1)) {
            this.entanglementRegistry.set(id1, new Set());
        }
        if (!this.entanglementRegistry.has(id2)) {
            this.entanglementRegistry.set(id2, new Set());
        }

        this.entanglementRegistry.get(id1).add({ id: id2, strength });
        this.entanglementRegistry.get(id2).add({ id: id1, strength });
    }

    /**
     * Record an observation of a personality
     * 
     * @param {string} personalityId - The personality being observed
     * @param {string} dimension - The dimension being observed
     * @param {number} observedValue - The observed value (0-1)
     */
    recordObservation(personalityId, dimension, observedValue) {
        if (!this.observationHistory.has(personalityId)) {
            this.observationHistory.set(personalityId, new Map());
        }

        const history = this.observationHistory.get(personalityId);
        if (!history.has(dimension)) {
            history.set(dimension, []);
        }

        history.get(dimension).push({
            value: observedValue,
            timestamp: performance.now(),
            confidence: 1.0
        });
    }

    /**
     * Get entangled personalities
     * 
     * @param {string} personalityId - The personality ID
     * @returns {Array} Array of entangled personality IDs
     */
    getEntangled(personalityId) {
        return Array.from(this.entanglementRegistry.get(personalityId) || []);
    }
}

/**
 * Individual quantum personality instance
 * 
 * @class QuantumPersonalityInstance
 */
export class QuantumPersonalityInstance {
    constructor(params) {
        this.dimensions = params.dimensions;
        this.simulator = params.simulator;
        this.config = params.config;
        this.baseTraits = params.baseTraits;
        
        // Quantum state for each dimension
        this.quantumState = new Map();
        
        // Collapsed values (classical state)
        this.collapsedState = new Map();
        
        // Coherence tracking
        this.coherence = new Map();
        
        // Unique ID
        this.id = `qp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Initialize the quantum personality
     */
    initialize() {
        // Initialize each dimension in superposition
        for (const [dimension, config] of Object.entries(this.dimensions)) {
            // Create superposition state
            const superposition = this._createSuperposition(
                dimension,
                this.baseTraits[dimension]
            );
            
            this.quantumState.set(dimension, superposition);
            
            // Track coherence
            this.coherence.set(dimension, {
                strength: 1.0,
                lastCollapse: 0,
                observations: 0
            });
        }

        // Apply quantum entanglement between related dimensions
        this._entangleDimensions();
    }

    /**
     * Observe a personality dimension, causing partial wave function collapse
     * 
     * @param {string} dimension - The dimension to observe
     * @param {Object} context - Context of the observation
     * @returns {number} The observed value (0-1)
     */
    observe(dimension, context = {}) {
        if (!this.quantumState.has(dimension)) {
            throw new Error(`Unknown dimension: ${dimension}`);
        }

        const quantumState = this.quantumState.get(dimension);
        const coherenceInfo = this.coherence.get(dimension);
        
        // Check if we need to refresh the superposition
        const timeSinceCollapse = performance.now() - coherenceInfo.lastCollapse;
        if (timeSinceCollapse > this.config.coherenceTime) {
            this._refreshSuperposition(dimension);
        }

        // Apply context-based modulation
        const contextModulation = this._calculateContextModulation(dimension, context);
        
        // Collapse the wave function
        const collapsedValue = this._collapseWaveFunction(
            quantumState,
            contextModulation,
            coherenceInfo.strength
        );

        // Update collapsed state
        this.collapsedState.set(dimension, collapsedValue);
        
        // Update coherence
        coherenceInfo.observations++;
        coherenceInfo.strength *= (1 - this.config.observationImpact);
        coherenceInfo.lastCollapse = performance.now();

        // Apply entanglement effects
        this._propagateEntanglement(dimension, collapsedValue);

        return collapsedValue;
    }

    /**
     * Get current personality state (mix of quantum and classical)
     * 
     * @returns {Object} Current personality traits
     */
    getPersonality() {
        const personality = {};
        
        for (const dimension of Object.keys(this.dimensions)) {
            // Use collapsed state if available and recent
            if (this.collapsedState.has(dimension)) {
                const coherenceInfo = this.coherence.get(dimension);
                const age = performance.now() - coherenceInfo.lastCollapse;
                
                if (age < this.config.coherenceTime) {
                    personality[dimension] = this.collapsedState.get(dimension);
                    continue;
                }
            }
            
            // Otherwise, get expectation value from quantum state
            personality[dimension] = this._getExpectationValue(dimension);
        }
        
        return personality;
    }

    /**
     * Get the quantum uncertainty for a dimension
     * 
     * @param {string} dimension - The dimension
     * @returns {number} Uncertainty value (0-1)
     */
    getUncertainty(dimension) {
        const quantumState = this.quantumState.get(dimension);
        if (!quantumState) return 0;
        
        // Calculate standard deviation of probability distribution
        const mean = this._getExpectationValue(dimension);
        let variance = 0;
        
        for (const [value, amplitude] of quantumState.entries()) {
            const probability = amplitude.magnitude ** 2;
            variance += probability * (value - mean) ** 2;
        }
        
        return Math.sqrt(variance);
    }

    /**
     * Create a superposition for a dimension
     * @private
     */
    _createSuperposition(dimension, baseValue) {
        const superposition = new Map();
        
        // If base value provided, create peaked distribution
        if (baseValue !== undefined) {
            const center = baseValue;
            const spread = 0.2;
            
            // Sample points in the dimension
            for (let i = 0; i <= 10; i++) {
                const value = i / 10;
                const distance = Math.abs(value - center);
                
                // Gaussian-like amplitude
                const amplitude = {
                    magnitude: Math.exp(-distance ** 2 / (2 * spread ** 2)),
                    phase: Math.random() * 2 * Math.PI
                };
                
                superposition.set(value, amplitude);
            }
        } else {
            // Uniform superposition with quantum noise
            for (let i = 0; i <= 10; i++) {
                const value = i / 10;
                const amplitude = {
                    magnitude: 1 / Math.sqrt(11) + (Math.random() - 0.5) * this.config.quantumNoise,
                    phase: Math.random() * 2 * Math.PI
                };
                
                superposition.set(value, amplitude);
            }
        }
        
        // Normalize
        this._normalizeSuperposition(superposition);
        
        return superposition;
    }

    /**
     * Entangle related personality dimensions
     * @private
     */
    _entangleDimensions() {
        // Define dimension relationships
        const entanglements = [
            ['openness', 'curiosity', 0.7],
            ['openness', 'creativity', 0.6],
            ['conscientiousness', 'patience', 0.5],
            ['extraversion', 'humor', 0.4],
            ['agreeableness', 'empathy', 0.6],
            ['courage', 'riskTaking', 0.8],
            ['optimism', 'humor', 0.3],
            ['trust', 'agreeableness', 0.5]
        ];
        
        for (const [dim1, dim2, strength] of entanglements) {
            this._createDimensionEntanglement(dim1, dim2, strength);
        }
    }

    /**
     * Create quantum entanglement between two dimensions
     * @private
     */
    _createDimensionEntanglement(dim1, dim2, strength) {
        const state1 = this.quantumState.get(dim1);
        const state2 = this.quantumState.get(dim2);
        
        if (!state1 || !state2) return;
        
        // Create correlated phases
        for (const [value1, amp1] of state1.entries()) {
            for (const [value2, amp2] of state2.entries()) {
                const correlation = 1 - Math.abs(value1 - value2);
                amp1.phase += strength * correlation * amp2.phase;
                amp2.phase += strength * correlation * amp1.phase;
            }
        }
    }

    /**
     * Refresh superposition after decoherence
     * @private
     */
    _refreshSuperposition(dimension) {
        const currentState = this.quantumState.get(dimension);
        const collapsedValue = this.collapsedState.get(dimension);
        
        // Create new superposition centered on last collapsed value
        const newSuperposition = this._createSuperposition(
            dimension,
            collapsedValue || 0.5
        );
        
        // Blend with current state based on coherence
        const coherenceInfo = this.coherence.get(dimension);
        const blendFactor = coherenceInfo.strength;
        
        for (const [value, newAmp] of newSuperposition.entries()) {
            const oldAmp = currentState.get(value) || { magnitude: 0, phase: 0 };
            newAmp.magnitude = oldAmp.magnitude * blendFactor + newAmp.magnitude * (1 - blendFactor);
            newAmp.phase = oldAmp.phase * blendFactor + newAmp.phase * (1 - blendFactor);
        }
        
        this._normalizeSuperposition(newSuperposition);
        this.quantumState.set(dimension, newSuperposition);
        
        // Reset coherence
        coherenceInfo.strength = 1.0;
    }

    /**
     * Calculate context-based modulation
     * @private
     */
    _calculateContextModulation(dimension, context) {
        let modulation = 0;
        
        // Mood affects certain dimensions
        if (context.mood) {
            const moodEffects = {
                happy: { optimism: 0.3, humor: 0.2, agreeableness: 0.1 },
                sad: { optimism: -0.3, humor: -0.2, empathy: 0.2 },
                angry: { agreeableness: -0.3, patience: -0.4, neuroticism: 0.3 },
                fearful: { courage: -0.4, riskTaking: -0.3, trust: -0.2 }
            };
            
            if (moodEffects[context.mood] && moodEffects[context.mood][dimension]) {
                modulation += moodEffects[context.mood][dimension];
            }
        }
        
        // Stress affects personality expression
        if (context.stress !== undefined) {
            const stressEffects = {
                patience: -0.3 * context.stress,
                neuroticism: 0.4 * context.stress,
                creativity: -0.2 * context.stress,
                trust: -0.2 * context.stress
            };
            
            if (stressEffects[dimension]) {
                modulation += stressEffects[dimension];
            }
        }
        
        // Social context
        if (context.social) {
            if (dimension === 'extraversion') {
                modulation += context.social * 0.2;
            }
        }
        
        return modulation;
    }

    /**
     * Collapse the wave function to observe a value
     * @private
     */
    _collapseWaveFunction(superposition, modulation, coherence) {
        // Calculate probability distribution
        const probabilities = [];
        let totalProb = 0;
        
        for (const [value, amplitude] of superposition.entries()) {
            // Apply modulation to shift probabilities
            const modifiedValue = Math.max(0, Math.min(1, value + modulation));
            const probability = amplitude.magnitude ** 2;
            
            probabilities.push({ value: modifiedValue, probability });
            totalProb += probability;
        }
        
        // Normalize probabilities
        probabilities.forEach(p => p.probability /= totalProb);
        
        // Collapse based on quantum measurement
        const random = Math.random();
        let cumulative = 0;
        
        for (const { value, probability } of probabilities) {
            cumulative += probability;
            if (random <= cumulative) {
                // Add quantum noise to the collapsed value
                const noise = (Math.random() - 0.5) * this.config.quantumNoise;
                return Math.max(0, Math.min(1, value + noise));
            }
        }
        
        return 0.5; // Fallback
    }

    /**
     * Propagate entanglement effects
     * @private
     */
    _propagateEntanglement(dimension, collapsedValue) {
        // Affect entangled dimensions based on collapse
        const entanglements = this._getEntangledDimensions(dimension);
        
        for (const { dimension: entangledDim, strength } of entanglements) {
            const entangledState = this.quantumState.get(entangledDim);
            if (!entangledState) continue;
            
            // Shift probability amplitudes based on collapsed value
            for (const [value, amplitude] of entangledState.entries()) {
                const correlation = 1 - Math.abs(value - collapsedValue);
                amplitude.magnitude *= 1 + (strength * correlation * 0.1);
            }
            
            // Renormalize
            this._normalizeSuperposition(entangledState);
        }
    }

    /**
     * Get expectation value for a dimension
     * @private
     */
    _getExpectationValue(dimension) {
        const superposition = this.quantumState.get(dimension);
        if (!superposition) return 0.5;
        
        let expectation = 0;
        let totalProb = 0;
        
        for (const [value, amplitude] of superposition.entries()) {
            const probability = amplitude.magnitude ** 2;
            expectation += value * probability;
            totalProb += probability;
        }
        
        return expectation / totalProb;
    }

    /**
     * Normalize a superposition
     * @private
     */
    _normalizeSuperposition(superposition) {
        let totalMagnitude = 0;
        
        for (const amplitude of superposition.values()) {
            totalMagnitude += amplitude.magnitude ** 2;
        }
        
        const normFactor = 1 / Math.sqrt(totalMagnitude);
        
        for (const amplitude of superposition.values()) {
            amplitude.magnitude *= normFactor;
        }
    }

    /**
     * Get dimensions entangled with a given dimension
     * @private
     */
    _getEntangledDimensions(dimension) {
        const entanglements = [];
        
        // Hardcoded entanglements (could be made dynamic)
        const relationships = {
            openness: [
                { dimension: 'curiosity', strength: 0.7 },
                { dimension: 'creativity', strength: 0.6 }
            ],
            conscientiousness: [
                { dimension: 'patience', strength: 0.5 }
            ],
            extraversion: [
                { dimension: 'humor', strength: 0.4 }
            ],
            agreeableness: [
                { dimension: 'empathy', strength: 0.6 },
                { dimension: 'trust', strength: 0.5 }
            ],
            courage: [
                { dimension: 'riskTaking', strength: 0.8 }
            ],
            optimism: [
                { dimension: 'humor', strength: 0.3 }
            ]
        };
        
        return relationships[dimension] || [];
    }

    /**
     * Get a quantum signature for this personality
     * 
     * @returns {string} Unique quantum signature
     */
    getQuantumSignature() {
        let signature = '';
        
        for (const [dimension, superposition] of this.quantumState.entries()) {
            let dimensionHash = 0;
            
            for (const [value, amplitude] of superposition.entries()) {
                dimensionHash += value * amplitude.magnitude * Math.cos(amplitude.phase);
            }
            
            signature += dimensionHash.toFixed(6);
        }
        
        return signature;
    }

    /**
     * Serialize the quantum personality
     */
    serialize() {
        const serialized = {
            id: this.id,
            dimensions: {},
            coherence: {},
            collapsedState: {}
        };
        
        // Serialize quantum states
        for (const [dimension, superposition] of this.quantumState.entries()) {
            serialized.dimensions[dimension] = Array.from(superposition.entries()).map(
                ([value, amplitude]) => ({
                    value,
                    magnitude: amplitude.magnitude,
                    phase: amplitude.phase
                })
            );
        }
        
        // Serialize coherence info
        for (const [dimension, info] of this.coherence.entries()) {
            serialized.coherence[dimension] = { ...info };
        }
        
        // Serialize collapsed states
        for (const [dimension, value] of this.collapsedState.entries()) {
            serialized.collapsedState[dimension] = value;
        }
        
        return serialized;
    }

    /**
     * Deserialize quantum personality
     */
    deserialize(data) {
        this.id = data.id;
        
        // Restore quantum states
        for (const [dimension, states] of Object.entries(data.dimensions)) {
            const superposition = new Map();
            
            for (const { value, magnitude, phase } of states) {
                superposition.set(value, { magnitude, phase });
            }
            
            this.quantumState.set(dimension, superposition);
        }
        
        // Restore coherence
        for (const [dimension, info] of Object.entries(data.coherence)) {
            this.coherence.set(dimension, { ...info });
        }
        
        // Restore collapsed states
        for (const [dimension, value] of Object.entries(data.collapsedState)) {
            this.collapsedState.set(dimension, value);
        }
    }
}
