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

import { MemoryBank } from './memory-bank.js';
import { AttentionMechanism } from './attention-mechanism.js';
import { EmergenceEngine } from './emergence-engine.js';

/**
 * ConsciousnessCore - The central nervous system of adaptive NPCs
 * 
 * Implements a transformer-inspired architecture with attention mechanisms,
 * long-term memory consolidation, and emergent behavior generation.
 * 
 * @class ConsciousnessCore
 */
export class ConsciousnessCore {
    constructor(config = {}) {
        this.config = {
            attentionHeads: 8,
            workingMemorySize: 128,
            longTermMemorySize: 10000,
            consolidationThreshold: 0.7,
            emergenceComplexity: 0.8,
            ...config
        };

        // Core components
        this.memoryBank = new MemoryBank(this.config);
        this.attention = new AttentionMechanism(this.config);
        this.emergence = new EmergenceEngine(this.config);

        // Consciousness state
        this.state = {
            awareness: 1.0,
            focus: null,
            currentThoughts: [],
            activeGoals: [],
            emotionalContext: null,
            lastUpdate: performance.now()
        };

        // Neural network layers (simplified transformer)
        this._initializeNeuralArchitecture();
    }

    /**
     * Create a new consciousness instance for an NPC
     * 
     * @param {Object} identity - NPC identity information
     * @returns {Promise<Consciousness>} Individual consciousness instance
     */
    async createConsciousness(identity) {
        const consciousness = new Consciousness({
            id: identity.id,
            name: identity.name,
            personality: identity.personality,
            memoryBank: this.memoryBank.createInstance(identity.id),
            attention: this.attention.createInstance(),
            emergence: this.emergence,
            parent: this
        });

        await consciousness.initialize();
        return consciousness;
    }

    /**
     * Initialize the neural architecture
     * @private
     */
    _initializeNeuralArchitecture() {
        // Simplified transformer layers
        this.layers = {
            // Input embedding layer
            embedding: this._createEmbeddingLayer(),
            
            // Multi-head self-attention
            attention: this._createAttentionLayer(),
            
            // Feed-forward network
            feedForward: this._createFeedForwardLayer(),
            
            // Output projection
            output: this._createOutputLayer()
        };

        // Initialize weights with Xavier initialization
        this._initializeWeights();
    }

    /**
     * Create embedding layer for thought vectorization
     * @private
     */
    _createEmbeddingLayer() {
        const vocabSize = 10000;
        const embeddingDim = 512;
        
        return {
            weights: new Float32Array(vocabSize * embeddingDim),
            
            embed(input) {
                // Convert thoughts/memories to vectors
                const embedded = new Float32Array(embeddingDim);
                
                // Simple hash-based embedding
                for (let i = 0; i < input.length; i++) {
                    const hash = ConsciousnessCore._hashCode(input[i]);
                    const idx = Math.abs(hash) % vocabSize;
                    
                    for (let j = 0; j < embeddingDim; j++) {
                        embedded[j] += this.weights[idx * embeddingDim + j];
                    }
                }
                
                return ConsciousnessCore._normalize(embedded);
            }
        };
    }

    /**
     * Create multi-head attention layer
     * @private
     */
    _createAttentionLayer() {
        const heads = this.config.attentionHeads;
        const dim = 512;
        const headDim = dim / heads;
        
        return {
            heads: Array(heads).fill(null).map(() => ({
                query: new Float32Array(dim * headDim),
                key: new Float32Array(dim * headDim),
                value: new Float32Array(dim * headDim)
            })),
            
            attend(input, context) {
                const outputs = [];
                
                for (let h = 0; h < heads; h++) {
                    const head = this.heads[h];
                    
                    // Compute query, key, value projections
                    const q = ConsciousnessCore._matmul(input, head.query, dim, headDim);
                    const k = ConsciousnessCore._matmul(context, head.key, dim, headDim);
                    const v = ConsciousnessCore._matmul(context, head.value, dim, headDim);
                    
                    // Scaled dot-product attention
                    const scores = ConsciousnessCore._dotProduct(q, k) / Math.sqrt(headDim);
                    const weights = ConsciousnessCore._softmax(scores);
                    const attended = ConsciousnessCore._weightedSum(v, weights);
                    
                    outputs.push(attended);
                }
                
                // Concatenate heads
                return ConsciousnessCore._concat(outputs);
            }
        };
    }

    /**
     * Create feed-forward layer
     * @private
     */
    _createFeedForwardLayer() {
        const inputDim = 512;
        const hiddenDim = 2048;
        
        return {
            w1: new Float32Array(inputDim * hiddenDim),
            b1: new Float32Array(hiddenDim),
            w2: new Float32Array(hiddenDim * inputDim),
            b2: new Float32Array(inputDim),
            
            forward(input) {
                // First linear layer + ReLU
                let hidden = ConsciousnessCore._matmul(input, this.w1, inputDim, hiddenDim);
                hidden = ConsciousnessCore._addBias(hidden, this.b1);
                hidden = ConsciousnessCore._relu(hidden);
                
                // Second linear layer
                let output = ConsciousnessCore._matmul(hidden, this.w2, hiddenDim, inputDim);
                output = ConsciousnessCore._addBias(output, this.b2);
                
                return output;
            }
        };
    }

    /**
     * Create output projection layer
     * @private
     */
    _createOutputLayer() {
        return {
            project(input) {
                // Project to thought/action space
                return {
                    thought: input.slice(0, 256),
                    action: input.slice(256, 384),
                    emotion: input.slice(384, 512)
                };
            }
        };
    }

    /**
     * Initialize neural network weights
     * @private
     */
    _initializeWeights() {
        // Xavier initialization for all layers
        Object.values(this.layers).forEach(layer => {
            if (layer.weights) {
                ConsciousnessCore._xavierInit(layer.weights);
            }
            if (layer.heads) {
                layer.heads.forEach(head => {
                    ConsciousnessCore._xavierInit(head.query);
                    ConsciousnessCore._xavierInit(head.key);
                    ConsciousnessCore._xavierInit(head.value);
                });
            }
            if (layer.w1) {
                ConsciousnessCore._xavierInit(layer.w1);
                ConsciousnessCore._xavierInit(layer.w2);
            }
        });
    }

    // Utility functions for neural operations
    static _hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    static _normalize(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        return vector.map(val => val / (magnitude + 1e-8));
    }

    static _matmul(input, weights, inputDim, outputDim) {
        const output = new Float32Array(outputDim);
        for (let i = 0; i < outputDim; i++) {
            for (let j = 0; j < inputDim; j++) {
                output[i] += input[j] * weights[j * outputDim + i];
            }
        }
        return output;
    }

    static _dotProduct(a, b) {
        return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }

    static _softmax(scores) {
        const maxScore = Math.max(...scores);
        const expScores = scores.map(s => Math.exp(s - maxScore));
        const sumExp = expScores.reduce((a, b) => a + b, 0);
        return expScores.map(e => e / sumExp);
    }

    static _weightedSum(values, weights) {
        const result = new Float32Array(values[0].length);
        for (let i = 0; i < weights.length; i++) {
            for (let j = 0; j < result.length; j++) {
                result[j] += values[i][j] * weights[i];
            }
        }
        return result;
    }

    static _concat(arrays) {
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Float32Array(totalLength);
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    static _addBias(vector, bias) {
        return vector.map((val, i) => val + bias[i]);
    }

    static _relu(vector) {
        return vector.map(val => Math.max(0, val));
    }

    static _xavierInit(weights) {
        const scale = Math.sqrt(2.0 / weights.length);
        for (let i = 0; i < weights.length; i++) {
            weights[i] = (Math.random() - 0.5) * 2 * scale;
        }
    }
}

/**
 * Individual consciousness instance for each NPC
 * 
 * @class Consciousness
 */
export class Consciousness {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.personality = config.personality;
        this.memoryBank = config.memoryBank;
        this.attention = config.attention;
        this.emergence = config.emergence;
        this.parent = config.parent;

        // Consciousness state
        this.state = {
            awareness: 1.0,
            currentFocus: null,
            activeThoughts: [],
            workingMemory: [],
            goals: [],
            beliefs: new Map(),
            lastProcessTime: performance.now()
        };

        // Thought stream
        this.thoughtStream = [];
        this.maxThoughts = 100;
    }

    /**
     * Initialize consciousness
     */
    async initialize() {
        // Load any persisted memories
        await this.memoryBank.initialize();
        
        // Set initial beliefs based on personality
        this._initializeBeliefs();
        
        // Generate initial goals
        this._generateInitialGoals();
        
        return this;
    }

    /**
     * Main consciousness update cycle
     * 
     * @param {number} currentTime - Current timestamp
     */
    async update(currentTime) {
        const deltaTime = currentTime - this.state.lastProcessTime;
        this.state.lastProcessTime = currentTime;

        // Update awareness based on activity
        this._updateAwareness(deltaTime);

        // Process sensory input through attention
        const attendedInput = await this._processAttention();

        // Generate thoughts through neural processing
        const thoughts = await this._generateThoughts(attendedInput);

        // Update working memory
        this._updateWorkingMemory(thoughts);

        // Check for emergent behaviors
        const emergentActions = await this.emergence.checkEmergence(
            this.state,
            this.memoryBank,
            this.personality
        );

        // Consolidate important memories
        await this._consolidateMemories();

        // Update goals based on current state
        this._updateGoals();

        return {
            thoughts,
            emergentActions,
            awareness: this.state.awareness
        };
    }

    /**
     * Record a new memory
     * 
     * @param {Object} memory - Memory to record
     */
    async recordMemory(memory) {
        // Add consciousness context
        memory.awareness = this.state.awareness;
        memory.emotionalContext = this.state.emotionalContext;
        memory.activeGoals = [...this.state.goals];
        
        // Calculate importance based on current focus and goals
        memory.importance = this._calculateImportance(memory);
        
        // Store in memory bank
        await this.memoryBank.store(memory);
        
        // Add to working memory if important
        if (memory.importance > 0.5) {
            this.state.workingMemory.push(memory);
            if (this.state.workingMemory.length > this.parent.config.workingMemorySize) {
                this.state.workingMemory.shift();
            }
        }
    }

    /**
     * Retrieve memories based on context
     * 
     * @param {Object} context - Context for memory retrieval
     * @returns {Array} Relevant memories
     */
    async retrieveMemories(context) {
        // Use attention mechanism to find relevant memories
        const query = this._contextToQuery(context);
        const memories = await this.memoryBank.query(query);
        
        // Apply attention to rank memories
        const attended = this.attention.attend(memories, this.state);
        
        return attended;
    }

    /**
     * Generate a thought or response
     * 
     * @param {string} stimulus - Input stimulus
     * @returns {Object} Generated thought/response
     */
    async think(stimulus) {
        // Encode stimulus
        const encoded = this.parent.layers.embedding.embed([stimulus]);
        
        // Retrieve relevant memories
        const memories = await this.retrieveMemories({ stimulus });
        const memoryContext = this._encodeMemories(memories);
        
        // Apply attention with memory context
        const attended = this.parent.layers.attention.attend(encoded, memoryContext);
        
        // Process through feed-forward network
        const processed = this.parent.layers.feedForward.forward(attended);
        
        // Project to thought space
        const output = this.parent.layers.output.project(processed);
        
        // Generate thought from output
        const thought = this._decodeThought(output.thought);
        
        // Record thought
        this.thoughtStream.push({
            timestamp: performance.now(),
            stimulus,
            thought,
            emotion: output.emotion,
            confidence: this._calculateConfidence(output)
        });
        
        // Trim thought stream
        if (this.thoughtStream.length > this.maxThoughts) {
            this.thoughtStream.shift();
        }
        
        return thought;
    }

    /**
     * Update awareness level
     * @private
     */
    _updateAwareness(deltaTime) {
        // Awareness naturally decays over time
        const decayRate = 0.0001;
        this.state.awareness -= decayRate * deltaTime;
        
        // But increases with activity
        if (this.state.activeThoughts.length > 0) {
            this.state.awareness += 0.001 * deltaTime;
        }
        
        // Clamp between 0 and 1
        this.state.awareness = Math.max(0, Math.min(1, this.state.awareness));
    }

    /**
     * Process attention mechanism
     * @private
     */
    async _processAttention() {
        // Get current sensory input (would come from game world)
        const sensoryInput = this._getCurrentSensoryInput();
        
        // Apply attention based on current focus and goals
        const attended = this.attention.focus(
            sensoryInput,
            this.state.currentFocus,
            this.state.goals
        );
        
        return attended;
    }

    /**
     * Generate thoughts through neural processing
     * @private
     */
    async _generateThoughts(input) {
        const thoughts = [];
        
        // Process input through consciousness layers
        const encoded = this.parent.layers.embedding.embed(input);
        const attended = this.parent.layers.attention.attend(
            encoded,
            this._getThoughtContext()
        );
        const processed = this.parent.layers.feedForward.forward(attended);
        const output = this.parent.layers.output.project(processed);
        
        // Decode thoughts
        const primaryThought = this._decodeThought(output.thought);
        thoughts.push(primaryThought);
        
        // Check for associated thoughts
        const associations = await this._findAssociations(primaryThought);
        thoughts.push(...associations);
        
        return thoughts;
    }

    /**
     * Update working memory with new thoughts
     * @private
     */
    _updateWorkingMemory(thoughts) {
        // Add new thoughts to working memory
        for (const thought of thoughts) {
            this.state.workingMemory.push({
                type: 'thought',
                content: thought,
                timestamp: performance.now(),
                importance: this._calculateThoughtImportance(thought)
            });
        }
        
        // Maintain size limit
        while (this.state.workingMemory.length > this.parent.config.workingMemorySize) {
            // Remove least important item
            let minImportance = Infinity;
            let minIndex = 0;
            
            for (let i = 0; i < this.state.workingMemory.length; i++) {
                if (this.state.workingMemory[i].importance < minImportance) {
                    minImportance = this.state.workingMemory[i].importance;
                    minIndex = i;
                }
            }
            
            this.state.workingMemory.splice(minIndex, 1);
        }
    }

    /**
     * Consolidate important working memories to long-term storage
     * @private
     */
    async _consolidateMemories() {
        const threshold = this.parent.config.consolidationThreshold;
        
        for (const item of this.state.workingMemory) {
            if (item.importance > threshold && !item.consolidated) {
                await this.memoryBank.consolidate(item);
                item.consolidated = true;
            }
        }
    }

    /**
     * Initialize beliefs based on personality
     * @private
     */
    _initializeBeliefs() {
        // Core beliefs derived from personality
        if (this.personality.kind > 0.7) {
            this.state.beliefs.set('people_are_good', 0.8);
        }
        if (this.personality.curious > 0.7) {
            this.state.beliefs.set('learning_is_important', 0.9);
        }
        if (this.personality.cautious > 0.7) {
            this.state.beliefs.set('safety_first', 0.85);
        }
    }

    /**
     * Generate initial goals based on personality and role
     * @private
     */
    _generateInitialGoals() {
        this.state.goals = [];
        
        // Universal goals
        this.state.goals.push({
            type: 'survival',
            description: 'Stay safe and healthy',
            priority: 1.0,
            progress: 0
        });
        
        // Personality-driven goals
        if (this.personality.curious > 0.6) {
            this.state.goals.push({
                type: 'knowledge',
                description: 'Learn new things',
                priority: this.personality.curious,
                progress: 0
            });
        }
        
        if (this.personality.social > 0.6) {
            this.state.goals.push({
                type: 'social',
                description: 'Make friends and maintain relationships',
                priority: this.personality.social,
                progress: 0
            });
        }
    }

    /**
     * Update goals based on experiences
     * @private
     */
    _updateGoals() {
        // Check goal progress
        for (const goal of this.state.goals) {
            // Update progress based on recent actions
            goal.progress = this._calculateGoalProgress(goal);
            
            // Completed goals can spawn new goals
            if (goal.progress >= 1.0) {
                const newGoals = this._generateFollowUpGoals(goal);
                this.state.goals.push(...newGoals);
            }
        }
        
        // Remove completed goals
        this.state.goals = this.state.goals.filter(g => g.progress < 1.0);
        
        // Limit active goals
        this.state.goals.sort((a, b) => b.priority - a.priority);
        this.state.goals = this.state.goals.slice(0, 5);
    }

    /**
     * Calculate memory importance
     * @private
     */
    _calculateImportance(memory) {
        let importance = 0.5; // Base importance
        
        // Emotional intensity increases importance
        if (memory.emotionalImpact) {
            importance += Math.abs(memory.emotionalImpact) * 0.3;
        }
        
        // Relevance to goals
        for (const goal of this.state.goals) {
            if (this._isRelevantToGoal(memory, goal)) {
                importance += goal.priority * 0.2;
            }
        }
        
        // Novel experiences are more important
        const novelty = await this._calculateNovelty(memory);
        importance += novelty * 0.2;
        
        return Math.min(1.0, importance);
    }

    /**
     * Calculate thought importance
     * @private
     */
    _calculateThoughtImportance(thought) {
        // Simplified importance calculation for thoughts
        return 0.5 + Math.random() * 0.5;
    }

    /**
     * Calculate confidence in output
     * @private
     */
    _calculateConfidence(output) {
        // Calculate based on activation strengths
        const thoughtMagnitude = Math.sqrt(
            output.thought.reduce((sum, val) => sum + val * val, 0)
        );
        return Math.tanh(thoughtMagnitude);
    }

    /**
     * Helper methods (stubs for full implementation)
     * @private
     */
    _contextToQuery(context) {
        return context;
    }

    _encodeMemories(memories) {
        // Convert memories to vector representation
        return new Float32Array(512);
    }

    _decodeThought(thoughtVector) {
        // Convert vector back to thought
        return {
            content: "Generated thought based on neural processing",
            type: "reflection",
            associations: []
        };
    }

    _getCurrentSensoryInput() {
        // Would get actual sensory data from game world
        return ["current_environment", "nearby_entities", "recent_events"];
    }

    _getThoughtContext() {
        // Get context from recent thoughts and working memory
        return new Float32Array(512);
    }

    async _findAssociations(thought) {
        // Find related thoughts/memories
        return [];
    }

    _calculateGoalProgress(goal) {
        // Calculate progress towards goal
        return Math.random() * 0.1;
    }

    _generateFollowUpGoals(completedGoal) {
        // Generate new goals based on completed ones
        return [];
    }

    _isRelevantToGoal(memory, goal) {
        // Check if memory is relevant to goal
        return Math.random() > 0.7;
    }

    async _calculateNovelty(memory) {
        // Calculate how novel/unique this memory is
        return Math.random();
    }

    /**
     * Serialize consciousness state
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            personality: this.personality,
            state: this.state,
            thoughtStream: this.thoughtStream.slice(-10), // Last 10 thoughts
            memoryStats: this.memoryBank.getStats()
        };
    }

    /**
     * Deserialize consciousness state
     */
    async deserialize(data) {
        this.state = data.state;
        this.thoughtStream = data.thoughtStream || [];
        await this.memoryBank.restore(data.memoryStats);
    }
}
