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
 * NPCManager - Manages the lifecycle of adaptive NPCs
 * 
 * Handles creation, updates, serialization, and resource management
 * for all NPCs in the game world.
 * 
 * @class NPCManager
 */
export class NPCManager {
    constructor(config = {}) {
        this.config = {
            maxNPCs: 1000,
            updateBatchSize: 50,
            useWebWorkers: true,
            performanceMode: 'balanced',
            ...config
        };

        // NPC registry
        this.npcs = new Map();
        this.npcsByName = new Map();
        this.npcsByRole = new Map();
        
        // Update scheduling
        this.updateQueue = [];
        this.lastUpdateTime = performance.now();
        
        // Performance tracking
        this.performance = {
            updatesPerSecond: 0,
            averageUpdateTime: 0,
            memoryUsage: 0
        };
        
        // Worker pool for parallel processing
        this.workers = [];
        if (this.config.useWebWorkers) {
            this._initializeWorkers();
        }
    }

    /**
     * Create a new NPC
     * 
     * @param {Object} config - NPC configuration
     * @returns {Promise<AdaptiveNPC>} The created NPC
     */
    async createNPC(config) {
        // Check capacity
        if (this.npcs.size >= this.config.maxNPCs) {
            throw new Error(`Maximum NPC limit (${this.config.maxNPCs}) reached`);
        }

        // Create NPC instance
        const npc = new AdaptiveNPC({
            ...config,
            manager: this
        });

        // Initialize NPC systems
        await npc.initialize();

        // Register NPC
        this.npcs.set(npc.id, npc);
        
        // Index by name
        if (npc.name) {
            this.npcsByName.set(npc.name.toLowerCase(), npc);
        }
        
        // Index by role
        if (npc.role) {
            if (!this.npcsByRole.has(npc.role)) {
                this.npcsByRole.set(npc.role, new Set());
            }
            this.npcsByRole.get(npc.role).add(npc);
        }

        // Add to update queue
        this.updateQueue.push(npc.id);

        return npc;
    }

    /**
     * Get NPC by ID
     * 
     * @param {string} npcId - NPC unique identifier
     * @returns {AdaptiveNPC|null} The NPC or null
     */
    getNPC(npcId) {
        return this.npcs.get(npcId) || null;
    }

    /**
     * Get NPC by name
     * 
     * @param {string} name - NPC name
     * @returns {AdaptiveNPC|null} The NPC or null
     */
    getNPCByName(name) {
        return this.npcsByName.get(name.toLowerCase()) || null;
    }

    /**
     * Get all NPCs with a specific role
     * 
     * @param {string} role - Role to search for
     * @returns {AdaptiveNPC[]} Array of NPCs with that role
     */
    getNPCsByRole(role) {
        const roleSet = this.npcsByRole.get(role);
        return roleSet ? Array.from(roleSet) : [];
    }

    /**
     * Get all NPCs
     * 
     * @returns {AdaptiveNPC[]} Array of all NPCs
     */
    getAllNPCs() {
        return Array.from(this.npcs.values());
    }

    /**
     * Update all NPCs
     * 
     * @param {number} deltaTime - Time since last update
     */
    async updateAll(deltaTime) {
        const startTime = performance.now();
        
        // Process updates in batches for performance
        const batches = this._createUpdateBatches();
        
        if (this.config.useWebWorkers && this.workers.length > 0) {
            // Parallel processing with workers
            await this._updateWithWorkers(batches, deltaTime);
        } else {
            // Sequential processing
            await this._updateSequential(batches, deltaTime);
        }
        
        // Update performance metrics
        const updateTime = performance.now() - startTime;
        this._updatePerformanceMetrics(updateTime);
    }

    /**
     * Remove an NPC
     * 
     * @param {string} npcId - NPC to remove
     */
    async removeNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        // Cleanup NPC resources
        await npc.cleanup();

        // Remove from indices
        this.npcs.delete(npcId);
        
        if (npc.name) {
            this.npcsByName.delete(npc.name.toLowerCase());
        }
        
        if (npc.role) {
            const roleSet = this.npcsByRole.get(npc.role);
            if (roleSet) {
                roleSet.delete(npc);
                if (roleSet.size === 0) {
                    this.npcsByRole.delete(npc.role);
                }
            }
        }

        // Remove from update queue
        const queueIndex = this.updateQueue.indexOf(npcId);
        if (queueIndex !== -1) {
            this.updateQueue.splice(queueIndex, 1);
        }
    }

    /**
     * Serialize all NPCs
     * 
     * @returns {Promise<Object>} Serialized NPC data
     */
    async serializeAll() {
        const serialized = {
            npcs: [],
            metadata: {
                count: this.npcs.size,
                timestamp: Date.now(),
                version: '1.0.0'
            }
        };

        for (const [id, npc] of this.npcs) {
            const npcData = await npc.serialize();
            serialized.npcs.push(npcData);
        }

        return serialized;
    }

    /**
     * Deserialize and restore NPCs
     * 
     * @param {Object} data - Serialized NPC data
     */
    async deserializeAll(data) {
        // Clear current NPCs
        for (const npc of this.npcs.values()) {
            await npc.cleanup();
        }
        this.npcs.clear();
        this.npcsByName.clear();
        this.npcsByRole.clear();
        this.updateQueue = [];

        // Restore NPCs
        if (data.npcs) {
            for (const npcData of data.npcs) {
                const npc = new AdaptiveNPC({
                    manager: this
                });
                await npc.deserialize(npcData);
                
                // Re-register
                this.npcs.set(npc.id, npc);
                if (npc.name) {
                    this.npcsByName.set(npc.name.toLowerCase(), npc);
                }
                if (npc.role) {
                    if (!this.npcsByRole.has(npc.role)) {
                        this.npcsByRole.set(npc.role, new Set());
                    }
                    this.npcsByRole.get(npc.role).add(npc);
                }
                this.updateQueue.push(npc.id);
            }
        }
    }

    /**
     * Get manager statistics
     */
    getStatistics() {
        return {
            totalNPCs: this.npcs.size,
            npcsByRole: Object.fromEntries(
                Array.from(this.npcsByRole.entries()).map(([role, set]) => [role, set.size])
            ),
            performance: { ...this.performance },
            memoryUsage: this._estimateMemoryUsage()
        };
    }

    /**
     * Initialize Web Workers
     * @private
     */
    _initializeWorkers() {
        const workerCount = navigator.hardwareConcurrency || 4;
        
        for (let i = 0; i < workerCount; i++) {
            const workerCode = `
                self.onmessage = async function(e) {
                    const { batch, deltaTime } = e.data;
                    const results = [];
                    
                    for (const npcData of batch) {
                        // Simulate NPC update processing
                        const updated = {
                            id: npcData.id,
                            consciousness: processConsciousness(npcData.consciousness, deltaTime),
                            emotional: processEmotions(npcData.emotional, deltaTime)
                        };
                        results.push(updated);
                    }
                    
                    self.postMessage({ results });
                };
                
                function processConsciousness(consciousness, deltaTime) {
                    // Simplified consciousness processing
                    return {
                        ...consciousness,
                        awareness: Math.max(0, consciousness.awareness - 0.0001 * deltaTime)
                    };
                }
                
                function processEmotions(emotional, deltaTime) {
                    // Simplified emotion decay
                    const decayed = {};
                    for (const [emotion, value] of Object.entries(emotional)) {
                        decayed[emotion] = value * (1 - 0.0001 * deltaTime);
                    }
                    return decayed;
                }
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            
            worker.busy = false;
            this.workers.push(worker);
        }
    }

    /**
     * Create update batches for parallel processing
     * @private
     */
    _createUpdateBatches() {
        const batches = [];
        const batchSize = Math.ceil(this.updateQueue.length / this.workers.length) || this.config.updateBatchSize;
        
        for (let i = 0; i < this.updateQueue.length; i += batchSize) {
            const batch = this.updateQueue.slice(i, i + batchSize)
                .map(id => this.npcs.get(id))
                .filter(npc => npc && npc.active);
            
            if (batch.length > 0) {
                batches.push(batch);
            }
        }
        
        return batches;
    }

    /**
     * Update NPCs using Web Workers
     * @private
     */
    async _updateWithWorkers(batches, deltaTime) {
        const promises = [];
        
        for (let i = 0; i < batches.length; i++) {
            const worker = this.workers[i % this.workers.length];
            const batch = batches[i];
            
            const promise = new Promise((resolve) => {
                worker.onmessage = (e) => {
                    const { results } = e.data;
                    
                    // Apply results back to NPCs
                    for (const result of results) {
                        const npc = this.npcs.get(result.id);
                        if (npc) {
                            npc.applyUpdate(result);
                        }
                    }
                    
                    worker.busy = false;
                    resolve();
                };
                
                worker.busy = true;
                worker.postMessage({
                    batch: batch.map(npc => npc.getUpdateData()),
                    deltaTime
                });
            });
            
            promises.push(promise);
        }
        
        await Promise.all(promises);
    }

    /**
     * Update NPCs sequentially
     * @private
     */
    async _updateSequential(batches, deltaTime) {
        for (const batch of batches) {
            for (const npc of batch) {
                await npc.update(deltaTime);
            }
        }
    }

    /**
     * Update performance metrics
     * @private
     */
    _updatePerformanceMetrics(updateTime) {
        const now = performance.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        
        this.performance.updatesPerSecond = 1000 / timeSinceLastUpdate;
        this.performance.averageUpdateTime = updateTime;
        this.performance.memoryUsage = this._estimateMemoryUsage();
        
        this.lastUpdateTime = now;
    }

    /**
     * Estimate memory usage
     * @private
     */
    _estimateMemoryUsage() {
        // Rough estimation: 1MB base + 100KB per NPC
        return (1 + this.npcs.size * 0.1) * 1024 * 1024; // bytes
    }

    /**
     * Get count of NPCs
     */
    get count() {
        return this.npcs.size;
    }
}

/**
 * Individual Adaptive NPC
 * 
 * @class AdaptiveNPC
 */
export class AdaptiveNPC {
    constructor(config) {
        this.id = config.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = config.name;
        this.role = config.role;
        this.manager = config.manager;
        
        // Core systems
        this.consciousness = config.consciousness;
        this.emotionalState = config.emotionalState;
        this.personality = config.personality;
        
        // State
        this.active = true;
        this.position = config.initialLocation || { x: 0, y: 0, z: 0 };
        this.appearance = config.appearance || {};
        
        // Behaviors
        this.currentBehavior = null;
        this.behaviorQueue = [];
        
        // Performance
        this.lastUpdate = performance.now();
        this.updateCount = 0;
    }

    /**
     * Initialize the NPC
     */
    async initialize() {
        // Initialize subsystems if needed
        if (this.consciousness && this.consciousness.initialize) {
            await this.consciousness.initialize();
        }
        
        // Set initial behavior
        this.currentBehavior = 'idle';
    }

    /**
     * Update the NPC
     * 
     * @param {number} deltaTime - Time since last update
     */
    async update(deltaTime) {
        if (!this.active) return;
        
        const now = performance.now();
        
        // Update consciousness
        if (this.consciousness) {
            await this.consciousness.update(now);
        }
        
        // Update emotional state
        if (this.emotionalState) {
            this.emotionalState.update(deltaTime);
        }
        
        // Process behavior
        await this._processBehavior(deltaTime);
        
        // Update statistics
        this.lastUpdate = now;
        this.updateCount++;
    }

    /**
     * Process current behavior
     * @private
     */
    async _processBehavior(deltaTime) {
        // Simple behavior processing
        switch (this.currentBehavior) {
            case 'idle':
                // Random chance to start wandering
                if (Math.random() < 0.001 * deltaTime) {
                    this.currentBehavior = 'wandering';
                }
                break;
                
            case 'wandering':
                // Move randomly
                this.position.x += (Math.random() - 0.5) * 0.1 * deltaTime;
                this.position.y += (Math.random() - 0.5) * 0.1 * deltaTime;
                
                // Chance to stop
                if (Math.random() < 0.0005 * deltaTime) {
                    this.currentBehavior = 'idle';
                }
                break;
                
            case 'interacting':
                // Handled by interaction system
                break;
        }
        
        // Process behavior queue
        if (this.behaviorQueue.length > 0 && !this.currentBehavior) {
            this.currentBehavior = this.behaviorQueue.shift();
        }
    }

    /**
     * Interact with another entity
     * 
     * @param {Object} entity - Entity to interact with
     * @param {Object} interaction - Interaction details
     */
    async interact(entity, interaction) {
        this.currentBehavior = 'interacting';
        
        // Process through consciousness
        if (this.consciousness) {
            const memory = {
                type: 'interaction',
                target: entity.id || 'unknown',
                interaction,
                timestamp: Date.now()
            };
            
            await this.consciousness.recordMemory(memory);
        }
        
        // Return to previous behavior
        setTimeout(() => {
            this.currentBehavior = 'idle';
        }, 3000);
    }

    /**
     * Speak based on context
     * 
     * @param {string} prompt - Conversation prompt
     * @returns {string} NPC's response
     */
    async speak(prompt) {
        if (this.consciousness && this.consciousness.think) {
            const thought = await this.consciousness.think(prompt);
            
            // Convert thought to speech
            return this._thoughtToSpeech(thought, prompt);
        }
        
        return "Hello there!";
    }

    /**
     * Get current mood
     * 
     * @returns {Object} Current mood state
     */
    getCurrentMood() {
        if (this.emotionalState) {
            return {
                mood: this.emotionalState.currentMood,
                emotions: { ...this.emotionalState.emotions }
            };
        }
        
        return { mood: 'neutral', emotions: {} };
    }

    /**
     * Remember an event
     * 
     * @param {Object} event - Event to remember
     */
    async rememberEvent(event) {
        if (this.consciousness) {
            await this.consciousness.recordMemory(event);
        }
    }

    /**
     * Get relationship with another entity
     * 
     * @param {Object} entity - Other entity
     * @returns {Object|null} Relationship data
     */
    getRelationship(entity) {
        // This would be implemented through the relationship network
        return null;
    }

    /**
     * Get data for parallel update
     */
    getUpdateData() {
        return {
            id: this.id,
            consciousness: this.consciousness ? {
                awareness: this.consciousness.state.awareness,
                workingMemory: this.consciousness.state.workingMemory
            } : null,
            emotional: this.emotionalState ? this.emotionalState.emotions : {},
            position: { ...this.position },
            behavior: this.currentBehavior
        };
    }

    /**
     * Apply update results from worker
     */
    applyUpdate(result) {
        if (result.consciousness && this.consciousness) {
            this.consciousness.state.awareness = result.consciousness.awareness;
        }
        
        if (result.emotional && this.emotionalState) {
            this.emotionalState.emotions = result.emotional;
        }
    }

    /**
     * Convert thought to speech
     * @private
     */
    _thoughtToSpeech(thought, prompt) {
        // Simple conversion - would be more sophisticated in production
        const responses = {
            greeting: [
                "Hello! How can I help you?",
                "Good to see you!",
                "Greetings, friend!"
            ],
            question: [
                "That's an interesting question...",
                "Let me think about that.",
                "I'd say..."
            ],
            default: [
                "I see.",
                "Interesting.",
                "Tell me more."
            ]
        };
        
        // Detect prompt type
        let type = 'default';
        if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
            type = 'greeting';
        } else if (prompt.includes('?')) {
            type = 'question';
        }
        
        const options = responses[type];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Cleanup NPC resources
     */
    async cleanup() {
        this.active = false;
        
        // Cleanup subsystems
        if (this.consciousness && this.consciousness.cleanup) {
            await this.consciousness.cleanup();
        }
    }

    /**
     * Serialize NPC state
     */
    async serialize() {
        const serialized = {
            id: this.id,
            name: this.name,
            role: this.role,
            position: { ...this.position },
            appearance: { ...this.appearance },
            active: this.active,
            currentBehavior: this.currentBehavior,
            updateCount: this.updateCount
        };
        
        // Serialize subsystems
        if (this.consciousness && this.consciousness.serialize) {
            serialized.consciousness = this.consciousness.serialize();
        }
        
        if (this.emotionalState && this.emotionalState.serialize) {
            serialized.emotionalState = this.emotionalState.serialize();
        }
        
        if (this.personality) {
            serialized.personality = this.personality;
        }
        
        return serialized;
    }

    /**
     * Deserialize NPC state
     */
    async deserialize(data) {
        this.id = data.id;
        this.name = data.name;
        this.role = data.role;
        this.position = data.position || { x: 0, y: 0, z: 0 };
        this.appearance = data.appearance || {};
        this.active = data.active !== false;
        this.currentBehavior = data.currentBehavior || 'idle';
        this.updateCount = data.updateCount || 0;
        
        // Deserialize subsystems
        if (data.consciousness && this.consciousness && this.consciousness.deserialize) {
            await this.consciousness.deserialize(data.consciousness);
        }
        
        if (data.emotionalState && this.emotionalState && this.emotionalState.deserialize) {
            this.emotionalState.deserialize(data.emotionalState);
        }
        
        if (data.personality) {
            this.personality = data.personality;
        }
    }
}
