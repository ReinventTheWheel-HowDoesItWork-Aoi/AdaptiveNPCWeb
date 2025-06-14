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
 * MemoryBank - Sophisticated memory storage and retrieval system
 * 
 * Implements episodic, semantic, procedural, and emotional memory
 * with consolidation, forgetting curves, and associative retrieval.
 * 
 * @class MemoryBank
 */
export class MemoryBank {
    constructor(config = {}) {
        this.config = {
            maxMemories: 10000,                    // Maximum memories per instance
            consolidationThreshold: 0.7,           // Importance threshold for long-term storage
            forgettingRate: 0.001,                 // How fast memories fade
            associationStrength: 0.3,              // How strongly memories link
            compressionEnabled: true,              // Enable memory compression
            emotionalBoost: 1.5,                   // Emotional memories are stronger
            ...config
        };

        // Memory type storage
        this.memories = {
            episodic: new Map(),      // Specific events
            semantic: new Map(),      // General knowledge
            procedural: new Map(),    // How to do things
            emotional: new Map()      // Emotional associations
        };

        // Memory indices for fast retrieval
        this.indices = {
            temporal: new Map(),      // Time-based index
            contextual: new Map(),    // Context-based index
            associative: new Map(),   // Association networks
            importance: []            // Priority queue by importance
        };

        // Memory consolidation queue
        this.consolidationQueue = [];
        
        // Statistics
        this.stats = {
            totalMemories: 0,
            consolidatedMemories: 0,
            forgottenMemories: 0,
            compressionRatio: 1.0
        };
    }

    /**
     * Create a new memory bank instance for an NPC
     * 
     * @param {string} ownerId - The NPC's ID
     * @returns {MemoryBankInstance} Individual memory bank
     */
    createInstance(ownerId) {
        return new MemoryBankInstance({
            ownerId,
            config: this.config,
            parent: this
        });
    }

    /**
     * Process memory consolidation across all instances
     */
    async processConsolidation() {
        // Process consolidation queue
        while (this.consolidationQueue.length > 0) {
            const memory = this.consolidationQueue.shift();
            await this._consolidateMemory(memory);
        }
    }

    /**
     * Consolidate a memory from short-term to long-term
     * @private
     */
    async _consolidateMemory(memory) {
        // Compress similar memories
        if (this.config.compressionEnabled) {
            const compressed = await this._compressMemory(memory);
            if (compressed) {
                memory = compressed;
            }
        }

        // Strengthen important memories
        if (memory.importance > this.config.consolidationThreshold) {
            memory.strength = Math.min(1.0, memory.strength * 1.2);
            memory.consolidated = true;
        }

        this.stats.consolidatedMemories++;
    }

    /**
     * Compress similar memories to save space
     * @private
     */
    async _compressMemory(memory) {
        // Find similar memories
        const similar = this._findSimilarMemories(memory);
        
        if (similar.length > 3) {
            // Create compressed representation
            const compressed = {
                type: 'compressed',
                originalType: memory.type,
                content: this._extractPattern(similar),
                count: similar.length,
                importance: Math.max(...similar.map(m => m.importance)),
                timestamp: memory.timestamp,
                consolidated: true
            };

            // Remove individual memories
            for (const mem of similar) {
                this._removeMemory(mem);
            }

            this.stats.compressionRatio = 
                this.stats.totalMemories / (this.stats.totalMemories - similar.length + 1);

            return compressed;
        }

        return null;
    }

    /**
     * Find memories similar to the given one
     * @private
     */
    _findSimilarMemories(memory) {
        const similar = [];
        const memorySet = this.memories[memory.category] || this.memories.episodic;

        for (const [id, mem] of memorySet) {
            if (mem.id === memory.id) continue;
            
            const similarity = this._calculateSimilarity(memory, mem);
            if (similarity > 0.8) {
                similar.push(mem);
            }
        }

        return similar;
    }

    /**
     * Calculate similarity between two memories
     * @private
     */
    _calculateSimilarity(mem1, mem2) {
        let similarity = 0;
        let factors = 0;

        // Type similarity
        if (mem1.type === mem2.type) {
            similarity += 0.3;
            factors++;
        }

        // Context similarity
        if (mem1.context && mem2.context) {
            const contextSim = this._compareContexts(mem1.context, mem2.context);
            similarity += contextSim * 0.3;
            factors++;
        }

        // Temporal proximity
        const timeDiff = Math.abs(mem1.timestamp - mem2.timestamp);
        const temporalSim = Math.exp(-timeDiff / (24 * 60 * 60 * 1000)); // Day scale
        similarity += temporalSim * 0.2;
        factors++;

        // Emotional similarity
        if (mem1.emotionalContext && mem2.emotionalContext) {
            const emotionalSim = this._compareEmotions(
                mem1.emotionalContext,
                mem2.emotionalContext
            );
            similarity += emotionalSim * 0.2;
            factors++;
        }

        return factors > 0 ? similarity / factors : 0;
    }

    /**
     * Extract pattern from similar memories
     * @private
     */
    _extractPattern(memories) {
        // Simple pattern extraction - could be made more sophisticated
        const commonElements = new Map();
        
        for (const memory of memories) {
            if (memory.content) {
                const elements = this._extractElements(memory.content);
                for (const element of elements) {
                    commonElements.set(element, (commonElements.get(element) || 0) + 1);
                }
            }
        }

        // Find most common elements
        const pattern = Array.from(commonElements.entries())
            .filter(([element, count]) => count > memories.length * 0.7)
            .map(([element]) => element);

        return {
            pattern,
            examples: memories.slice(0, 3).map(m => m.content)
        };
    }

    /**
     * Compare contexts for similarity
     * @private
     */
    _compareContexts(ctx1, ctx2) {
        let matches = 0;
        let total = 0;

        for (const key in ctx1) {
            if (key in ctx2) {
                if (ctx1[key] === ctx2[key]) matches++;
                total++;
            }
        }

        return total > 0 ? matches / total : 0;
    }

    /**
     * Compare emotional contexts
     * @private
     */
    _compareEmotions(emo1, emo2) {
        if (!emo1 || !emo2) return 0;

        let similarity = 0;
        let count = 0;

        for (const emotion in emo1) {
            if (emotion in emo2) {
                const diff = Math.abs(emo1[emotion] - emo2[emotion]);
                similarity += 1 - diff;
                count++;
            }
        }

        return count > 0 ? similarity / count : 0;
    }

    /**
     * Extract elements from content for pattern matching
     * @private
     */
    _extractElements(content) {
        if (typeof content === 'string') {
            return content.split(/\s+/).filter(w => w.length > 3);
        } else if (typeof content === 'object') {
            return Object.keys(content);
        }
        return [];
    }

    /**
     * Remove a memory
     * @private
     */
    _removeMemory(memory) {
        const memorySet = this.memories[memory.category] || this.memories.episodic;
        memorySet.delete(memory.id);
        this.stats.forgottenMemories++;
    }
}

/**
 * Individual memory bank instance for an NPC
 * 
 * @class MemoryBankInstance
 */
export class MemoryBankInstance {
    constructor(config) {
        this.ownerId = config.ownerId;
        this.config = config.config;
        this.parent = config.parent;

        // Instance-specific memories
        this.memories = {
            episodic: new Map(),
            semantic: new Map(),
            procedural: new Map(),
            emotional: new Map()
        };

        // Working memory (recent, active memories)
        this.workingMemory = [];
        this.maxWorkingMemory = 20;

        // Memory associations graph
        this.associations = new Map();

        // Memory strength tracking
        this.memoryStrengths = new Map();

        // Personal statistics
        this.stats = {
            totalMemories: 0,
            strongestMemory: null,
            oldestMemory: null
        };
    }

    /**
     * Initialize the memory bank
     */
    async initialize() {
        // Load any persisted memories
        await this.loadFromStorage();
    }

    /**
     * Store a new memory
     * 
     * @param {Object} memory - Memory to store
     * @returns {string} Memory ID
     */
    async store(memory) {
        // Generate unique ID
        memory.id = `${this.ownerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        memory.ownerId = this.ownerId;
        memory.timestamp = memory.timestamp || Date.now();
        memory.strength = memory.strength || 0.5;
        memory.accessCount = 0;

        // Determine memory category
        const category = this._categorizeMemory(memory);
        memory.category = category;

        // Apply emotional boost if applicable
        if (memory.emotionalContext && memory.importance) {
            const emotionalIntensity = this._calculateEmotionalIntensity(memory.emotionalContext);
            memory.importance *= (1 + emotionalIntensity * this.config.emotionalBoost);
        }

        // Store in appropriate memory type
        this.memories[category].set(memory.id, memory);

        // Update working memory
        this._updateWorkingMemory(memory);

        // Create associations
        await this._createAssociations(memory);

        // Update indices
        this._updateIndices(memory);

        // Update statistics
        this.stats.totalMemories++;
        if (!this.stats.oldestMemory || memory.timestamp < this.stats.oldestMemory.timestamp) {
            this.stats.oldestMemory = memory;
        }
        if (!this.stats.strongestMemory || memory.importance > this.stats.strongestMemory.importance) {
            this.stats.strongestMemory = memory;
        }

        // Queue for consolidation if important
        if (memory.importance > this.config.consolidationThreshold) {
            this.parent.consolidationQueue.push(memory);
        }

        return memory.id;
    }

    /**
     * Query memories based on criteria
     * 
     * @param {Object} query - Query parameters
     * @returns {Array} Matching memories
     */
    async query(query) {
        let results = [];

        // Query by type
        if (query.type) {
            results = this._queryByType(query.type, query);
        }
        // Query by context
        else if (query.context) {
            results = this._queryByContext(query.context);
        }
        // Query by association
        else if (query.associatedWith) {
            results = this._queryByAssociation(query.associatedWith);
        }
        // Query by time range
        else if (query.timeRange) {
            results = this._queryByTimeRange(query.timeRange);
        }
        // Free-form search
        else if (query.search) {
            results = this._searchMemories(query.search);
        }

        // Apply filters
        if (query.minImportance) {
            results = results.filter(m => m.importance >= query.minImportance);
        }

        if (query.category) {
            results = results.filter(m => m.category === query.category);
        }

        // Sort by relevance
        results = this._rankByRelevance(results, query);

        // Limit results
        if (query.limit) {
            results = results.slice(0, query.limit);
        }

        // Update access counts
        for (const memory of results) {
            memory.accessCount++;
            memory.lastAccessed = Date.now();
        }

        return results;
    }

    /**
     * Consolidate a memory for long-term storage
     * 
     * @param {Object} memory - Memory to consolidate
     */
    async consolidate(memory) {
        if (memory.consolidated) return;

        // Strengthen the memory
        memory.strength = Math.min(1.0, memory.strength * 1.5);
        memory.consolidated = true;
        memory.consolidatedAt = Date.now();

        // Strengthen associations
        const associations = this.associations.get(memory.id);
        if (associations) {
            for (const assoc of associations) {
                assoc.strength = Math.min(1.0, assoc.strength * 1.2);
            }
        }

        // Move to long-term storage if needed
        await this.saveToStorage([memory]);
    }

    /**
     * Process forgetting - decay memory strengths
     */
    processForgetting() {
        const now = Date.now();
        const forgettingRate = this.config.forgettingRate;

        for (const category of Object.keys(this.memories)) {
            const toRemove = [];

            for (const [id, memory] of this.memories[category]) {
                // Skip recently accessed memories
                if (memory.lastAccessed && now - memory.lastAccessed < 60000) {
                    continue;
                }

                // Apply forgetting curve
                const age = now - memory.timestamp;
                const decayFactor = Math.exp(-forgettingRate * age / (24 * 60 * 60 * 1000));
                
                // Modify by importance and consolidation
                let retentionBonus = memory.importance * 0.3;
                if (memory.consolidated) retentionBonus += 0.3;
                if (memory.accessCount > 5) retentionBonus += 0.2;

                memory.strength = memory.strength * decayFactor + retentionBonus;

                // Forget weak memories
                if (memory.strength < 0.1) {
                    toRemove.push(id);
                }
            }

            // Remove forgotten memories
            for (const id of toRemove) {
                this.memories[category].delete(id);
                this.associations.delete(id);
                this.parent.stats.forgottenMemories++;
            }
        }
    }

    /**
     * Categorize memory into appropriate type
     * @private
     */
    _categorizeMemory(memory) {
        if (memory.category) return memory.category;

        // Analyze memory content and type
        if (memory.type === 'interaction' || memory.type === 'event') {
            return 'episodic';
        } else if (memory.type === 'knowledge' || memory.type === 'fact') {
            return 'semantic';
        } else if (memory.type === 'skill' || memory.type === 'procedure') {
            return 'procedural';
        } else if (memory.emotionalContext && memory.emotionalImpact) {
            return 'emotional';
        }

        return 'episodic'; // Default
    }

    /**
     * Calculate emotional intensity
     * @private
     */
    _calculateEmotionalIntensity(emotions) {
        let totalIntensity = 0;
        let count = 0;

        for (const value of Object.values(emotions)) {
            if (typeof value === 'number') {
                totalIntensity += Math.abs(value);
                count++;
            }
        }

        return count > 0 ? totalIntensity / count : 0;
    }

    /**
     * Update working memory with new memory
     * @private
     */
    _updateWorkingMemory(memory) {
        // Add to front of working memory
        this.workingMemory.unshift(memory);

        // Remove duplicates
        const seen = new Set();
        this.workingMemory = this.workingMemory.filter(m => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
        });

        // Limit size
        if (this.workingMemory.length > this.maxWorkingMemory) {
            this.workingMemory = this.workingMemory.slice(0, this.maxWorkingMemory);
        }
    }

    /**
     * Create associations between memories
     * @private
     */
    async _createAssociations(memory) {
        const associations = [];

        // Associate with working memory
        for (const workingMem of this.workingMemory.slice(1)) { // Skip self
            const similarity = this.parent._calculateSimilarity(memory, workingMem);
            if (similarity > this.config.associationStrength) {
                associations.push({
                    targetId: workingMem.id,
                    strength: similarity,
                    type: 'temporal'
                });
            }
        }

        // Associate by context
        if (memory.context) {
            const contextual = this._findByContext(memory.context, 5);
            for (const contextMem of contextual) {
                if (contextMem.id !== memory.id) {
                    associations.push({
                        targetId: contextMem.id,
                        strength: 0.5,
                        type: 'contextual'
                    });
                }
            }
        }

        // Store associations
        this.associations.set(memory.id, associations);

        // Create reverse associations
        for (const assoc of associations) {
            const reverseAssocs = this.associations.get(assoc.targetId) || [];
            reverseAssocs.push({
                targetId: memory.id,
                strength: assoc.strength,
                type: assoc.type
            });
            this.associations.set(assoc.targetId, reverseAssocs);
        }
    }

    /**
     * Update memory indices
     * @private
     */
    _updateIndices(memory) {
        // Temporal index
        const timeKey = Math.floor(memory.timestamp / (60 * 60 * 1000)); // Hour buckets
        if (!this.parent.indices.temporal.has(timeKey)) {
            this.parent.indices.temporal.set(timeKey, []);
        }
        this.parent.indices.temporal.get(timeKey).push(memory.id);

        // Contextual index
        if (memory.context) {
            for (const [key, value] of Object.entries(memory.context)) {
                const contextKey = `${key}:${value}`;
                if (!this.parent.indices.contextual.has(contextKey)) {
                    this.parent.indices.contextual.set(contextKey, []);
                }
                this.parent.indices.contextual.get(contextKey).push(memory.id);
            }
        }

        // Importance index (sorted)
        this.parent.indices.importance.push({
            id: memory.id,
            importance: memory.importance
        });
        this.parent.indices.importance.sort((a, b) => b.importance - a.importance);
    }

    /**
     * Query memories by type
     * @private
     */
    _queryByType(type, params) {
        const results = [];
        
        for (const category of Object.keys(this.memories)) {
            for (const [id, memory] of this.memories[category]) {
                if (memory.type === type) {
                    results.push(memory);
                }
            }
        }

        return results;
    }

    /**
     * Query memories by context
     * @private
     */
    _queryByContext(context) {
        const results = new Map(); // Use map to avoid duplicates
        
        for (const [key, value] of Object.entries(context)) {
            const contextKey = `${key}:${value}`;
            const memoryIds = this.parent.indices.contextual.get(contextKey) || [];
            
            for (const id of memoryIds) {
                const memory = this._getMemoryById(id);
                if (memory) {
                    results.set(id, memory);
                }
            }
        }

        return Array.from(results.values());
    }

    /**
     * Query memories by association
     * @private
     */
    _queryByAssociation(memoryId) {
        const results = [];
        const associations = this.associations.get(memoryId) || [];
        
        for (const assoc of associations) {
            const memory = this._getMemoryById(assoc.targetId);
            if (memory) {
                results.push({
                    ...memory,
                    associationStrength: assoc.strength,
                    associationType: assoc.type
                });
            }
        }

        // Sort by association strength
        results.sort((a, b) => b.associationStrength - a.associationStrength);
        
        return results;
    }

    /**
     * Query memories by time range
     * @private
     */
    _queryByTimeRange(range) {
        const results = [];
        const { start, end } = range;
        
        for (const category of Object.keys(this.memories)) {
            for (const [id, memory] of this.memories[category]) {
                if (memory.timestamp >= start && memory.timestamp <= end) {
                    results.push(memory);
                }
            }
        }

        // Sort by timestamp
        results.sort((a, b) => b.timestamp - a.timestamp);
        
        return results;
    }

    /**
     * Search memories by content
     * @private
     */
    _searchMemories(searchTerm) {
        const results = [];
        const searchLower = searchTerm.toLowerCase();
        
        for (const category of Object.keys(this.memories)) {
            for (const [id, memory] of this.memories[category]) {
                let relevance = 0;
                
                // Search in content
                if (memory.content) {
                    const contentStr = JSON.stringify(memory.content).toLowerCase();
                    if (contentStr.includes(searchLower)) {
                        relevance += 0.5;
                    }
                }
                
                // Search in type
                if (memory.type && memory.type.includes(searchLower)) {
                    relevance += 0.3;
                }
                
                // Search in context
                if (memory.context) {
                    const contextStr = JSON.stringify(memory.context).toLowerCase();
                    if (contextStr.includes(searchLower)) {
                        relevance += 0.2;
                    }
                }
                
                if (relevance > 0) {
                    results.push({ ...memory, relevance });
                }
            }
        }

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results;
    }

    /**
     * Find memories by context
     * @private
     */
    _findByContext(context, limit) {
        const results = this._queryByContext(context);
        return results.slice(0, limit);
    }

    /**
     * Rank memories by relevance to query
     * @private
     */
    _rankByRelevance(memories, query) {
        return memories.map(memory => {
            let score = 0;
            
            // Recency bonus
            const age = Date.now() - memory.timestamp;
            score += Math.exp(-age / (7 * 24 * 60 * 60 * 1000)); // Week scale
            
            // Importance bonus
            score += memory.importance * 2;
            
            // Access frequency bonus
            score += Math.log(1 + memory.accessCount) * 0.5;
            
            // Consolidation bonus
            if (memory.consolidated) score += 0.5;
            
            return { ...memory, relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * Get memory by ID from any category
     * @private
     */
    _getMemoryById(id) {
        for (const category of Object.keys(this.memories)) {
            const memory = this.memories[category].get(id);
            if (memory) return memory;
        }
        return null;
    }

    /**
     * Save memories to persistent storage
     * @private
     */
    async saveToStorage(memories) {
        // Would integrate with IndexedDB here
        // For now, just mark as saved
        for (const memory of memories) {
            memory.persisted = true;
        }
    }

    /**
     * Load memories from persistent storage
     * @private
     */
    async loadFromStorage() {
        // Would load from IndexedDB here
        // For now, no-op
    }

    /**
     * Get memory statistics
     */
    getStats() {
        const stats = {
            ...this.stats,
            byCategory: {},
            workingMemorySize: this.workingMemory.length,
            totalAssociations: 0
        };

        // Count by category
        for (const [category, memories] of Object.entries(this.memories)) {
            stats.byCategory[category] = memories.size;
        }

        // Count associations
        for (const associations of this.associations.values()) {
            stats.totalAssociations += associations.length;
        }

        return stats;
    }

    /**
     * Serialize memory bank state
     */
    serialize() {
        const serialized = {
            ownerId: this.ownerId,
            memories: {},
            associations: {},
            stats: this.stats
        };

        // Serialize memories
        for (const [category, memories] of Object.entries(this.memories)) {
            serialized.memories[category] = Array.from(memories.values())
                .slice(-100); // Limit to recent 100 per category
        }

        // Serialize associations (limited)
        for (const [id, assocs] of this.associations) {
            if (this._getMemoryById(id)) {
                serialized.associations[id] = assocs.slice(0, 10);
            }
        }

        return serialized;
    }

    /**
     * Deserialize memory bank state
     */
    async deserialize(data) {
        // Clear current state
        for (const category of Object.keys(this.memories)) {
            this.memories[category].clear();
        }
        this.associations.clear();

        // Restore memories
        for (const [category, memories] of Object.entries(data.memories || {})) {
            for (const memory of memories) {
                this.memories[category].set(memory.id, memory);
            }
        }

        // Restore associations
        for (const [id, assocs] of Object.entries(data.associations || {})) {
            this.associations.set(id, assocs);
        }

        // Restore stats
        this.stats = { ...this.stats, ...data.stats };
    }
}
