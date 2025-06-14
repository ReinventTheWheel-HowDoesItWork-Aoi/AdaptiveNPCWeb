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
 * Persistence - IndexedDB-based storage for AdaptiveNPCWeb
 * 
 * Handles saving and loading of NPC states, memories, relationships,
 * and world data with automatic versioning and migration.
 * 
 * @class Persistence
 */
export class Persistence {
    constructor(worldName) {
        this.worldName = worldName;
        this.dbName = `AdaptiveNPCWeb_${worldName}`;
        this.version = 1;
        this.db = null;
        
        // Store schemas
        this.stores = {
            worldState: 'worldState',
            npcs: 'npcs',
            memories: 'memories',
            relationships: 'relationships',
            narratives: 'narratives',
            metadata: 'metadata'
        };
        
        // Cache for frequently accessed data
        this.cache = new Map();
        this.cacheTimeout = 5000; // 5 seconds
        
        // Initialize database
        this.initialized = this._initialize();
    }

    /**
     * Initialize IndexedDB
     * @private
     */
    async _initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                
                // Setup error handler
                this.db.onerror = (event) => {
                    console.error('Database error:', event.target.error);
                };
                
                console.log(`IndexedDB initialized for world: ${this.worldName}`);
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                this._createStores(db);
                
                console.log('IndexedDB schema created/updated');
            };
        });
    }

    /**
     * Create object stores
     * @private
     */
    _createStores(db) {
        // World state store
        if (!db.objectStoreNames.contains(this.stores.worldState)) {
            const worldStore = db.createObjectStore(this.stores.worldState, {
                keyPath: 'id'
            });
            worldStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // NPCs store
        if (!db.objectStoreNames.contains(this.stores.npcs)) {
            const npcStore = db.createObjectStore(this.stores.npcs, {
                keyPath: 'id'
            });
            npcStore.createIndex('name', 'name', { unique: false });
            npcStore.createIndex('role', 'role', { unique: false });
        }
        
        // Memories store
        if (!db.objectStoreNames.contains(this.stores.memories)) {
            const memoryStore = db.createObjectStore(this.stores.memories, {
                keyPath: 'id'
            });
            memoryStore.createIndex('ownerId', 'ownerId', { unique: false });
            memoryStore.createIndex('timestamp', 'timestamp', { unique: false });
            memoryStore.createIndex('type', 'type', { unique: false });
            memoryStore.createIndex('importance', 'importance', { unique: false });
        }
        
        // Relationships store
        if (!db.objectStoreNames.contains(this.stores.relationships)) {
            const relStore = db.createObjectStore(this.stores.relationships, {
                keyPath: 'id'
            });
            relStore.createIndex('sourceId', 'sourceId', { unique: false });
            relStore.createIndex('targetId', 'targetId', { unique: false });
            relStore.createIndex('type', 'type', { unique: false });
        }
        
        // Narratives store
        if (!db.objectStoreNames.contains(this.stores.narratives)) {
            const narrativeStore = db.createObjectStore(this.stores.narratives, {
                keyPath: 'id'
            });
            narrativeStore.createIndex('timestamp', 'timestamp', { unique: false });
            narrativeStore.createIndex('participants', 'participants', { 
                unique: false, 
                multiEntry: true 
            });
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
            db.createObjectStore(this.stores.metadata, {
                keyPath: 'key'
            });
        }
    }

    /**
     * Save world state
     * 
     * @param {Object} worldState - Complete world state to save
     * @returns {Promise<boolean>} Success status
     */
    async saveWorldState(worldState) {
        await this.initialized;
        
        try {
            const transaction = this.db.transaction(
                [this.stores.worldState, this.stores.metadata],
                'readwrite'
            );
            
            // Save world state
            const worldStore = transaction.objectStore(this.stores.worldState);
            const stateData = {
                id: 'current',
                ...worldState,
                savedAt: Date.now()
            };
            
            await this._promisifyRequest(worldStore.put(stateData));
            
            // Update metadata
            const metaStore = transaction.objectStore(this.stores.metadata);
            await this._promisifyRequest(metaStore.put({
                key: 'lastSave',
                timestamp: Date.now(),
                version: worldState.version,
                npcCount: worldState.npcs?.length || 0
            }));
            
            // Save detailed data
            if (worldState.npcs) {
                await this.saveNPCs(worldState.npcs);
            }
            
            if (worldState.relationships) {
                await this.saveRelationships(worldState.relationships);
            }
            
            if (worldState.narratives) {
                await this.saveNarratives(worldState.narratives);
            }
            
            // Clear cache
            this.cache.clear();
            
            return true;
        } catch (error) {
            console.error('Failed to save world state:', error);
            return false;
        }
    }

    /**
     * Load world state
     * 
     * @returns {Promise<Object|null>} World state or null
     */
    async loadWorldState() {
        await this.initialized;
        
        // Check cache first
        const cached = this._getCached('worldState');
        if (cached) return cached;
        
        try {
            const transaction = this.db.transaction(
                [this.stores.worldState],
                'readonly'
            );
            const store = transaction.objectStore(this.stores.worldState);
            
            const result = await this._promisifyRequest(store.get('current'));
            
            if (result) {
                // Cache the result
                this._setCached('worldState', result);
                
                // Load detailed data
                result.npcs = await this.loadNPCs();
                result.relationships = await this.loadRelationships();
                result.narratives = await this.loadNarratives();
            }
            
            return result;
        } catch (error) {
            console.error('Failed to load world state:', error);
            return null;
        }
    }

    /**
     * Save NPCs
     * 
     * @param {Array} npcs - Array of serialized NPCs
     */
    async saveNPCs(npcs) {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.npcs], 'readwrite');
        const store = transaction.objectStore(this.stores.npcs);
        
        // Clear existing NPCs
        await this._promisifyRequest(store.clear());
        
        // Save each NPC
        for (const npc of npcs) {
            await this._promisifyRequest(store.add(npc));
            
            // Save NPC memories separately for efficiency
            if (npc.consciousness?.memories) {
                await this.saveMemories(npc.id, npc.consciousness.memories);
                
                // Remove memories from NPC data to avoid duplication
                delete npc.consciousness.memories;
            }
        }
    }

    /**
     * Load NPCs
     * 
     * @returns {Promise<Array>} Array of NPCs
     */
    async loadNPCs() {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.npcs], 'readonly');
        const store = transaction.objectStore(this.stores.npcs);
        
        const npcs = await this._promisifyRequest(store.getAll());
        
        // Load memories for each NPC
        for (const npc of npcs) {
            if (npc.consciousness) {
                npc.consciousness.memories = await this.loadMemories(npc.id);
            }
        }
        
        return npcs;
    }

    /**
     * Save memories for an NPC
     * 
     * @param {string} npcId - NPC ID
     * @param {Object} memories - Memories to save
     */
    async saveMemories(npcId, memories) {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.memories], 'readwrite');
        const store = transaction.objectStore(this.stores.memories);
        
        // Delete existing memories for this NPC
        const index = store.index('ownerId');
        const range = IDBKeyRange.only(npcId);
        const keysRequest = index.getAllKeys(range);
        const keys = await this._promisifyRequest(keysRequest);
        
        for (const key of keys) {
            await this._promisifyRequest(store.delete(key));
        }
        
        // Save new memories
        for (const category of Object.keys(memories)) {
            const categoryMemories = memories[category];
            
            if (categoryMemories instanceof Map) {
                for (const [id, memory] of categoryMemories) {
                    await this._promisifyRequest(store.add({
                        ...memory,
                        ownerId: npcId,
                        category
                    }));
                }
            } else if (Array.isArray(categoryMemories)) {
                for (const memory of categoryMemories) {
                    await this._promisifyRequest(store.add({
                        ...memory,
                        ownerId: npcId,
                        category
                    }));
                }
            }
        }
    }

    /**
     * Load memories for an NPC
     * 
     * @param {string} npcId - NPC ID
     * @returns {Promise<Object>} Memories organized by category
     */
    async loadMemories(npcId) {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.memories], 'readonly');
        const store = transaction.objectStore(this.stores.memories);
        const index = store.index('ownerId');
        
        const memories = await this._promisifyRequest(
            index.getAll(IDBKeyRange.only(npcId))
        );
        
        // Organize by category
        const organized = {
            episodic: [],
            semantic: [],
            procedural: [],
            emotional: []
        };
        
        for (const memory of memories) {
            const category = memory.category || 'episodic';
            if (organized[category]) {
                organized[category].push(memory);
            }
        }
        
        return organized;
    }

    /**
     * Save relationships
     * 
     * @param {Object} relationships - Serialized relationship data
     */
    async saveRelationships(relationships) {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.relationships], 'readwrite');
        const store = transaction.objectStore(this.stores.relationships);
        
        // Clear existing relationships
        await this._promisifyRequest(store.clear());
        
        // Save each relationship
        for (const [entityId, entityRels] of Object.entries(relationships)) {
            for (const [targetId, relData] of Object.entries(entityRels)) {
                await this._promisifyRequest(store.add({
                    id: `${entityId}_${targetId}`,
                    sourceId: entityId,
                    targetId: targetId,
                    ...relData
                }));
            }
        }
    }

    /**
     * Load relationships
     * 
     * @returns {Promise<Object>} Relationship data
     */
    async loadRelationships() {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.relationships], 'readonly');
        const store = transaction.objectStore(this.stores.relationships);
        
        const allRels = await this._promisifyRequest(store.getAll());
        
        // Organize by source entity
        const organized = {};
        
        for (const rel of allRels) {
            if (!organized[rel.sourceId]) {
                organized[rel.sourceId] = {};
            }
            
            organized[rel.sourceId][rel.targetId] = {
                trust: rel.trust,
                affection: rel.affection,
                respect: rel.respect,
                familiarity: rel.familiarity,
                type: rel.type,
                formed: rel.formed,
                lastInteraction: rel.lastInteraction
            };
        }
        
        return organized;
    }

    /**
     * Save narratives
     * 
     * @param {Object} narratives - Narrative data
     */
    async saveNarratives(narratives) {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.narratives], 'readwrite');
        const store = transaction.objectStore(this.stores.narratives);
        
        // Clear existing narratives
        await this._promisifyRequest(store.clear());
        
        // Save narratives
        if (narratives.stories) {
            for (const story of narratives.stories) {
                await this._promisifyRequest(store.add(story));
            }
        }
    }

    /**
     * Load narratives
     * 
     * @returns {Promise<Object>} Narrative data
     */
    async loadNarratives() {
        await this.initialized;
        
        const transaction = this.db.transaction([this.stores.narratives], 'readonly');
        const store = transaction.objectStore(this.stores.narratives);
        
        const stories = await this._promisifyRequest(store.getAll());
        
        return {
            stories,
            activeThreads: [] // Would be reconstructed from stories
        };
    }

    /**
     * Get storage statistics
     * 
     * @returns {Promise<Object>} Storage stats
     */
    async getStorageStats() {
        await this.initialized;
        
        const stats = {
            stores: {}
        };
        
        // Get count for each store
        for (const [name, storeName] of Object.entries(this.stores)) {
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const count = await this._promisifyRequest(store.count());
                
                stats.stores[name] = { count };
            } catch (error) {
                stats.stores[name] = { count: 0, error: error.message };
            }
        }
        
        // Estimate storage usage
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            stats.usage = estimate.usage;
            stats.quota = estimate.quota;
            stats.percentUsed = (estimate.usage / estimate.quota) * 100;
        }
        
        return stats;
    }

    /**
     * Clear all data
     * 
     * @returns {Promise<boolean>} Success status
     */
    async clearAll() {
        await this.initialized;
        
        try {
            const transaction = this.db.transaction(
                Object.values(this.stores),
                'readwrite'
            );
            
            for (const storeName of Object.values(this.stores)) {
                const store = transaction.objectStore(storeName);
                await this._promisifyRequest(store.clear());
            }
            
            this.cache.clear();
            
            console.log('All data cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Export all data
     * 
     * @returns {Promise<Object>} Complete data export
     */
    async exportData() {
        await this.initialized;
        
        const worldState = await this.loadWorldState();
        const stats = await this.getStorageStats();
        
        return {
            version: this.version,
            worldName: this.worldName,
            exportedAt: Date.now(),
            worldState,
            stats
        };
    }

    /**
     * Import data
     * 
     * @param {Object} data - Data to import
     * @returns {Promise<boolean>} Success status
     */
    async importData(data) {
        if (!data || !data.worldState) {
            throw new Error('Invalid import data');
        }
        
        // Clear existing data
        await this.clearAll();
        
        // Import world state
        return await this.saveWorldState(data.worldState);
    }

    /**
     * Create backup
     * 
     * @returns {Promise<string>} Backup ID
     */
    async createBackup() {
        const backup = await this.exportData();
        const backupId = `backup_${Date.now()}`;
        
        // Store backup in a separate store or localStorage
        localStorage.setItem(`AdaptiveNPCWeb_${backupId}`, JSON.stringify(backup));
        
        return backupId;
    }

    /**
     * Restore from backup
     * 
     * @param {string} backupId - Backup ID to restore
     * @returns {Promise<boolean>} Success status
     */
    async restoreBackup(backupId) {
        const backupData = localStorage.getItem(`AdaptiveNPCWeb_${backupId}`);
        
        if (!backupData) {
            throw new Error('Backup not found');
        }
        
        const backup = JSON.parse(backupData);
        return await this.importData(backup);
    }

    /**
     * Get cached data
     * @private
     */
    _getCached(key) {
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        return null;
    }

    /**
     * Set cached data
     * @private
     */
    _setCached(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Promisify IndexedDB request
     * @private
     */
    _promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        this.cache.clear();
    }
}
