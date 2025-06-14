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
 * QuantumSimulator - Simulates quantum mechanics for personality traits
 * 
 * Provides quantum-inspired randomness and superposition states
 * for creating unique, probabilistic NPC personalities.
 * 
 * @class QuantumSimulator
 */
export class QuantumSimulator {
    constructor(config = {}) {
        this.config = {
            qubits: 16,                     // Number of quantum bits
            decoherenceRate: 0.01,          // How fast quantum states decay
            entanglementThreshold: 0.5,     // Threshold for entanglement
            measurementNoise: 0.05,         // Measurement uncertainty
            ...config
        };

        // Quantum state representation
        this.quantumStates = new Map();
        this.entanglements = new Map();
        
        // Random number generator with better entropy
        this.rng = new QuantumRNG();
        
        // Basis states
        this.basisStates = this._generateBasisStates();
    }

    /**
     * Create a quantum superposition
     * 
     * @param {Array} states - Array of possible states
     * @param {Array} amplitudes - Complex amplitudes (optional)
     * @returns {QuantumSuperposition} Superposition state
     */
    createSuperposition(states, amplitudes) {
        if (!amplitudes) {
            // Create equal superposition
            const n = states.length;
            amplitudes = states.map(() => ({
                real: 1 / Math.sqrt(n),
                imaginary: 0
            }));
        }

        // Normalize amplitudes
        this._normalizeAmplitudes(amplitudes);

        const superposition = new QuantumSuperposition({
            states,
            amplitudes,
            simulator: this
        });

        // Register in quantum state registry
        this.quantumStates.set(superposition.id, superposition);

        return superposition;
    }

    /**
     * Entangle two quantum states
     * 
     * @param {string} stateId1 - First state ID
     * @param {string} stateId2 - Second state ID
     * @param {number} strength - Entanglement strength (0-1)
     */
    entangle(stateId1, stateId2, strength = 0.5) {
        const state1 = this.quantumStates.get(stateId1);
        const state2 = this.quantumStates.get(stateId2);

        if (!state1 || !state2) {
            throw new Error('States not found for entanglement');
        }

        // Create entanglement
        const entanglement = {
            states: [stateId1, stateId2],
            strength: Math.min(1, Math.max(0, strength)),
            created: Date.now()
        };

        // Store bidirectional entanglement
        if (!this.entanglements.has(stateId1)) {
            this.entanglements.set(stateId1, []);
        }
        if (!this.entanglements.has(stateId2)) {
            this.entanglements.set(stateId2, []);
        }

        this.entanglements.get(stateId1).push(entanglement);
        this.entanglements.get(stateId2).push(entanglement);

        // Update states to reflect entanglement
        state1.entangled = true;
        state2.entangled = true;
    }

    /**
     * Measure a quantum state (causes collapse)
     * 
     * @param {string} stateId - State to measure
     * @returns {*} Collapsed value
     */
    measure(stateId) {
        const state = this.quantumStates.get(stateId);
        if (!state) {
            throw new Error('State not found');
        }

        // Perform measurement
        const result = state.collapse();

        // Propagate collapse to entangled states
        this._propagateCollapse(stateId, result);

        return result;
    }

    /**
     * Apply quantum gate operation
     * 
     * @param {string} gate - Gate type (X, Y, Z, H, etc.)
     * @param {string} stateId - State to apply gate to
     */
    applyGate(gate, stateId) {
        const state = this.quantumStates.get(stateId);
        if (!state) return;

        switch (gate) {
            case 'H': // Hadamard gate - creates superposition
                this._applyHadamard(state);
                break;
            case 'X': // Pauli-X gate - bit flip
                this._applyPauliX(state);
                break;
            case 'Y': // Pauli-Y gate
                this._applyPauliY(state);
                break;
            case 'Z': // Pauli-Z gate - phase flip
                this._applyPauliZ(state);
                break;
            case 'T': // T gate - π/4 phase
                this._applyTGate(state);
                break;
        }
    }

    /**
     * Simulate decoherence over time
     * 
     * @param {number} deltaTime - Time elapsed
     */
    simulateDecoherence(deltaTime) {
        for (const [stateId, state] of this.quantumStates) {
            state.applyDecoherence(deltaTime * this.config.decoherenceRate);

            // Remove fully decohered states
            if (state.coherence < 0.01) {
                this.quantumStates.delete(stateId);
                this.entanglements.delete(stateId);
            }
        }
    }

    /**
     * Generate basis states
     * @private
     */
    _generateBasisStates() {
        const states = [];
        const n = Math.pow(2, this.config.qubits);

        for (let i = 0; i < n; i++) {
            states.push(this._intToBinaryString(i, this.config.qubits));
        }

        return states;
    }

    /**
     * Convert integer to binary string
     * @private
     */
    _intToBinaryString(num, bits) {
        return num.toString(2).padStart(bits, '0');
    }

    /**
     * Normalize amplitudes
     * @private
     */
    _normalizeAmplitudes(amplitudes) {
        let magnitude = 0;

        // Calculate total magnitude
        for (const amp of amplitudes) {
            magnitude += amp.real * amp.real + amp.imaginary * amp.imaginary;
        }

        magnitude = Math.sqrt(magnitude);

        // Normalize
        if (magnitude > 0) {
            for (const amp of amplitudes) {
                amp.real /= magnitude;
                amp.imaginary /= magnitude;
            }
        }
    }

    /**
     * Propagate collapse through entangled states
     * @private
     */
    _propagateCollapse(stateId, result) {
        const entanglements = this.entanglements.get(stateId) || [];

        for (const entanglement of entanglements) {
            for (const otherStateId of entanglement.states) {
                if (otherStateId === stateId) continue;

                const otherState = this.quantumStates.get(otherStateId);
                if (otherState && !otherState.collapsed) {
                    // Influence collapse based on entanglement strength
                    otherState.influenceCollapse(result, entanglement.strength);
                }
            }
        }
    }

    /**
     * Apply Hadamard gate
     * @private
     */
    _applyHadamard(state) {
        // H = (1/√2) * [[1, 1], [1, -1]]
        const factor = 1 / Math.sqrt(2);

        for (let i = 0; i < state.amplitudes.length; i += 2) {
            const a0 = state.amplitudes[i];
            const a1 = state.amplitudes[i + 1];

            state.amplitudes[i] = {
                real: factor * (a0.real + a1.real),
                imaginary: factor * (a0.imaginary + a1.imaginary)
            };

            state.amplitudes[i + 1] = {
                real: factor * (a0.real - a1.real),
                imaginary: factor * (a0.imaginary - a1.imaginary)
            };
        }
    }

    /**
     * Apply Pauli-X gate
     * @private
     */
    _applyPauliX(state) {
        // X = [[0, 1], [1, 0]] - bit flip
        for (let i = 0; i < state.amplitudes.length; i += 2) {
            const temp = state.amplitudes[i];
            state.amplitudes[i] = state.amplitudes[i + 1];
            state.amplitudes[i + 1] = temp;
        }
    }

    /**
     * Apply Pauli-Y gate
     * @private
     */
    _applyPauliY(state) {
        // Y = [[0, -i], [i, 0]]
        for (let i = 0; i < state.amplitudes.length; i += 2) {
            const a0 = state.amplitudes[i];
            const a1 = state.amplitudes[i + 1];

            state.amplitudes[i] = {
                real: -a1.imaginary,
                imaginary: a1.real
            };

            state.amplitudes[i + 1] = {
                real: a0.imaginary,
                imaginary: -a0.real
            };
        }
    }

    /**
     * Apply Pauli-Z gate
     * @private
     */
    _applyPauliZ(state) {
        // Z = [[1, 0], [0, -1]] - phase flip
        for (let i = 1; i < state.amplitudes.length; i += 2) {
            state.amplitudes[i].real *= -1;
            state.amplitudes[i].imaginary *= -1;
        }
    }

    /**
     * Apply T gate
     * @private
     */
    _applyTGate(state) {
        // T = [[1, 0], [0, e^(iπ/4)]]
        const phase = Math.PI / 4;
        
        for (let i = 1; i < state.amplitudes.length; i += 2) {
            const amp = state.amplitudes[i];
            const newReal = amp.real * Math.cos(phase) - amp.imaginary * Math.sin(phase);
            const newImaginary = amp.real * Math.sin(phase) + amp.imaginary * Math.cos(phase);
            
            state.amplitudes[i] = {
                real: newReal,
                imaginary: newImaginary
            };
        }
    }

    /**
     * Get quantum statistics
     */
    getStats() {
        return {
            activeStates: this.quantumStates.size,
            entanglements: this.entanglements.size,
            averageCoherence: this._calculateAverageCoherence()
        };
    }

    /**
     * Calculate average coherence
     * @private
     */
    _calculateAverageCoherence() {
        if (this.quantumStates.size === 0) return 0;

        let totalCoherence = 0;
        for (const state of this.quantumStates.values()) {
            totalCoherence += state.coherence;
        }

        return totalCoherence / this.quantumStates.size;
    }
}

/**
 * Quantum superposition state
 * 
 * @class QuantumSuperposition
 */
class QuantumSuperposition {
    constructor(config) {
        this.states = config.states;
        this.amplitudes = config.amplitudes;
        this.simulator = config.simulator;
        
        this.id = `qs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.coherence = 1.0;
        this.collapsed = false;
        this.entangled = false;
        this.collapsedValue = null;
    }

    /**
     * Collapse the superposition to a definite state
     * 
     * @returns {*} The collapsed state
     */
    collapse() {
        if (this.collapsed) {
            return this.collapsedValue;
        }

        // Calculate probabilities from amplitudes
        const probabilities = this.amplitudes.map(amp => 
            amp.real * amp.real + amp.imaginary * amp.imaginary
        );

        // Choose state based on probabilities
        const random = this.simulator.rng.random();
        let cumulative = 0;

        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (random <= cumulative) {
                this.collapsed = true;
                this.collapsedValue = this.states[i];
                
                // Set amplitudes to collapsed state
                this.amplitudes = this.amplitudes.map((amp, j) => ({
                    real: i === j ? 1 : 0,
                    imaginary: 0
                }));
                
                return this.collapsedValue;
            }
        }

        // Fallback
        this.collapsed = true;
        this.collapsedValue = this.states[this.states.length - 1];
        return this.collapsedValue;
    }

    /**
     * Apply decoherence
     * 
     * @param {number} amount - Decoherence amount
     */
    applyDecoherence(amount) {
        this.coherence = Math.max(0, this.coherence - amount);

        // Add noise to amplitudes based on decoherence
        const noise = 1 - this.coherence;
        
        for (const amp of this.amplitudes) {
            amp.real += (this.simulator.rng.random() - 0.5) * noise * 0.1;
            amp.imaginary += (this.simulator.rng.random() - 0.5) * noise * 0.1;
        }

        // Renormalize
        this.simulator._normalizeAmplitudes(this.amplitudes);
    }

    /**
     * Influence collapse based on entanglement
     * 
     * @param {*} otherResult - Result from entangled state
     * @param {number} strength - Entanglement strength
     */
    influenceCollapse(otherResult, strength) {
        // Find index of similar state
        let influenceIndex = -1;
        for (let i = 0; i < this.states.length; i++) {
            if (this._statesCorrelated(this.states[i], otherResult)) {
                influenceIndex = i;
                break;
            }
        }

        if (influenceIndex >= 0) {
            // Boost amplitude of correlated state
            const boost = strength * 0.5;
            this.amplitudes[influenceIndex].real *= (1 + boost);
            
            // Renormalize
            this.simulator._normalizeAmplitudes(this.amplitudes);
        }
    }

    /**
     * Check if states are correlated
     * @private
     */
    _statesCorrelated(state1, state2) {
        // Simple correlation check - could be more sophisticated
        return state1 === state2 || 
               (typeof state1 === 'object' && typeof state2 === 'object' &&
                JSON.stringify(state1) === JSON.stringify(state2));
    }

    /**
     * Get probability distribution
     */
    getProbabilities() {
        return this.amplitudes.map((amp, i) => ({
            state: this.states[i],
            probability: amp.real * amp.real + amp.imaginary * amp.imaginary
        }));
    }
}

/**
 * Quantum random number generator
 * 
 * @class QuantumRNG
 */
class QuantumRNG {
    constructor() {
        this.seed = Date.now();
        this.counter = 0;
    }

    /**
     * Generate quantum-inspired random number
     * 
     * @returns {number} Random number between 0 and 1
     */
    random() {
        // Mix multiple sources of randomness
        const browserRandom = Math.random();
        const timeComponent = (Date.now() % 1000) / 1000;
        const counterComponent = (this.counter++ % 100) / 100;
        
        // Combine using quantum-inspired mixing
        const mixed = this._quantumMix(
            browserRandom,
            timeComponent,
            counterComponent
        );
        
        return mixed;
    }

    /**
     * Quantum-inspired mixing function
     * @private
     */
    _quantumMix(a, b, c) {
        // Simulate quantum interference
        const interference = Math.sin(a * Math.PI * 2) * 
                           Math.cos(b * Math.PI * 2) * 
                           Math.sin(c * Math.PI * 2);
        
        // Add and normalize
        const mixed = (a + b + c + interference) / 4;
        
        // Ensure within bounds
        return Math.abs(mixed) % 1;
    }

    /**
     * Generate Gaussian random number
     * 
     * @param {number} mean - Mean value
     * @param {number} stdDev - Standard deviation
     * @returns {number} Gaussian-distributed random number
     */
    gaussian(mean = 0, stdDev = 1) {
        // Box-Muller transform
        const u1 = this.random();
        const u2 = this.random();
        
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        return z0 * stdDev + mean;
    }
}

// Export as default
export default QuantumSimulator;
