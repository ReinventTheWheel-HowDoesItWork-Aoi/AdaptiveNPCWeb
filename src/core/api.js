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

import { AdaptiveNPCWeb } from './adaptive-npc-web.js';

/**
 * AdaptiveNPCWeb API - Simplified interface for game integration
 * 
 * Provides a clean, intuitive API for game developers to integrate
 * adaptive NPCs without dealing with the complexity of the underlying systems.
 * 
 * @class AdaptiveNPCAPI
 */
export class AdaptiveNPCAPI {
    constructor() {
        this.system = null;
        this.initialized = false;
        this.eventHandlers = new Map();
        this.defaultConfig = {
            worldName: 'DefaultWorld',
            enableNetworking: true,
            maxNPCs: 1000,
            performanceMode: 'balanced'
        };
    }

    /**
     * Initialize the AdaptiveNPCWeb system
     * 
     * @param {Object} config - Configuration options
     * @returns {Promise<AdaptiveNPCAPI>} This API instance
     * 
     * @example
     * const npcAPI = new AdaptiveNPCAPI();
     * await npcAPI.init({ worldName: 'MyRPG' });
     */
    async init(config = {}) {
        if (this.initialized) {
            console.warn('AdaptiveNPCWeb already initialized');
            return this;
        }

        try {
            // Merge with default config
            const finalConfig = { ...this.defaultConfig, ...config };
            
            // Create system instance
            this.system = new AdaptiveNPCWeb(finalConfig);
            
            // Wait for initialization
            await this.system._initialized;
            
            this.initialized = true;
            
            // Setup default event handlers
            this._setupDefaultHandlers();
            
            console.log('AdaptiveNPCWeb initialized successfully');
            return this;
        } catch (error) {
            console.error('Failed to initialize AdaptiveNPCWeb:', error);
            throw error;
        }
    }

    /**
     * Create a new NPC with simplified parameters
     * 
     * @param {Object} params - NPC parameters
     * @param {string} params.name - NPC name (required)
     * @param {string} [params.role] - NPC role/occupation
     * @param {Object} [params.traits] - Personality traits (0-1 values)
     * @param {Object} [params.position] - Starting position
     * @returns {Promise<NPCHandle>} Simplified NPC handle
     * 
     * @example
     * const elena = await npcAPI.createNPC({
     *   name: 'Elena',
     *   role: 'Blacksmith',
     *   traits: { friendly: 0.8, hardworking: 0.9 }
     * });
     */
    async createNPC(params) {
        this._checkInitialized();
        
        if (!params.name) {
            throw new Error('NPC name is required');
        }

        // Map simplified traits to full personality model
        const personality = this._mapTraitsToPersonality(params.traits);
        
        // Create NPC through system
        const npc = await this.system.createNPC({
            name: params.name,
            role: params.role,
            basePersonality: personality,
            initialLocation: params.position
        });
        
        // Return simplified handle
        return new NPCHandle(npc, this);
    }

    /**
     * Get NPC by name
     * 
     * @param {string} name - NPC name
     * @returns {NPCHandle|null} NPC handle or null
     */
    getNPC(name) {
        this._checkInitialized();
        
        // Try by name first
        const npc = this.system.npcManager.getNPCByName(name);
        if (npc) {
            return new NPCHandle(npc, this);
        }
        
        // Try by ID if name looks like an ID
        if (name.startsWith('npc_')) {
            const npcById = this.system.getNPC(name);
            if (npcById) {
                return new NPCHandle(npcById, this);
            }
        }
        
        return null;
    }

    /**
     * Get all NPCs
     * 
     * @returns {NPCHandle[]} Array of NPC handles
     */
    getAllNPCs() {
        this._checkInitialized();
        
        const npcs = this.system.getAllNPCs();
        return npcs.map(npc => new NPCHandle(npc, this));
    }

    /**
     * Simple interaction between player and NPC
     * 
     * @param {Object} player - Player object or ID
     * @param {NPCHandle|string} npc - NPC handle or name
     * @param {string} action - Interaction type
     * @param {Object} [details] - Additional details
     * @returns {Promise<InteractionResult>} Interaction result
     * 
     * @example
     * const result = await npcAPI.interact(player, 'Elena', 'greet');
     * console.log(result.npcResponse); // "Hello! How can I help you?"
     */
    async interact(player, npc, action, details = {}) {
        this._checkInitialized();
        
        // Resolve NPC
        const npcHandle = typeof npc === 'string' ? this.getNPC(npc) : npc;
        if (!npcHandle) {
            throw new Error(`NPC not found: ${npc}`);
        }
        
        // Map simple actions to full interaction format
        const interaction = this._mapSimpleAction(action, details);
        
        // Process interaction
        const result = await this.system.processInteraction(
            player.id || 'player',
            npcHandle.id,
            interaction
        );
        
        // Generate NPC response
        const response = await npcHandle.speak(
            this._getInteractionPrompt(action, player)
        );
        
        return new InteractionResult({
            action,
            npcResponse: response,
            emotionalChange: result.emotional,
            relationshipChange: result.relationship,
            narrativeEvents: result.narrative
        });
    }

    /**
     * Save game state
     * 
     * @returns {Promise<boolean>} Success status
     */
    async save() {
        this._checkInitialized();
        return await this.system.saveState();
    }

    /**
     * Load game state
     * 
     * @returns {Promise<boolean>} Success status
     */
    async load() {
        this._checkInitialized();
        return await this.system.loadState();
    }

    /**
     * Register event handler
     * 
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * 
     * @example
     * npcAPI.on('npc.mood.changed', (data) => {
     *   console.log(`${data.npc.name} is now ${data.mood}`);
     * });
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Remove event handler
     * 
     * @param {string} event - Event name
     * @param {Function} handler - Handler to remove
     */
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Enable debug mode
     * 
     * @param {HTMLElement} container - Container for debug UI
     */
    enableDebug(container) {
        this._checkInitialized();
        this.system.enableDebugMode(container);
    }

    /**
     * Get system statistics
     * 
     * @returns {Object} System statistics
     */
    getStats() {
        this._checkInitialized();
        return {
            npcs: this.system.npcManager.getStatistics(),
            relationships: this.system.relationshipNetwork.getStatistics(),
            memory: this.system.getStatistics().memoryUsage,
            performance: this.system.performance
        };
    }

    /**
     * Update all NPCs (call this in your game loop)
     * 
     * @param {number} deltaTime - Time since last update (ms)
     */
    async update(deltaTime) {
        this._checkInitialized();
        await this.system.npcManager.updateAll(deltaTime);
    }

    /**
     * Cleanup and shutdown
     */
    destroy() {
        if (this.system) {
            this.system.destroy();
        }
        this.initialized = false;
        this.eventHandlers.clear();
    }

    // Private helper methods

    _checkInitialized() {
        if (!this.initialized) {
            throw new Error('AdaptiveNPCWeb not initialized. Call init() first.');
        }
    }

    _setupDefaultHandlers() {
        // Forward system events to API events
        this.system.on('relationship_change', (data) => {
            this._emit('npc.relationship.changed', data);
        });
        
        this.system.on('npc_created', (data) => {
            this._emit('npc.created', data);
        });
        
        // Add more event forwarding as needed
    }

    _emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            }
        }
    }

    _mapTraitsToPersonality(traits = {}) {
        // Map simple traits to Big Five personality model
        const personality = {
            openness: 0.5,
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            neuroticism: 0.3
        };

        // Map common traits
        if ('friendly' in traits) personality.agreeableness = traits.friendly;
        if ('creative' in traits) personality.openness = traits.creative;
        if ('organized' in traits) personality.conscientiousness = traits.organized;
        if ('social' in traits) personality.extraversion = traits.social;
        if ('anxious' in traits) personality.neuroticism = traits.anxious;
        
        // Direct mappings
        if ('hardworking' in traits) personality.conscientiousness = traits.hardworking;
        if ('curious' in traits) personality.openness = traits.curious;
        if ('brave' in traits) personality.neuroticism = 1 - traits.brave;
        
        // Add custom traits
        for (const [trait, value] of Object.entries(traits)) {
            if (!(trait in personality)) {
                personality[trait] = value;
            }
        }
        
        return personality;
    }

    _mapSimpleAction(action, details) {
        const actionMappings = {
            'greet': { action: 'greet', emotion: 'friendly' },
            'help': { action: 'help', emotion: 'helpful' },
            'talk': { action: 'conversation', emotion: 'neutral' },
            'trade': { action: 'trade', emotion: 'business' },
            'compliment': { action: 'compliment', emotion: 'friendly' },
            'insult': { action: 'insult', emotion: 'hostile' },
            'gift': { action: 'gift', emotion: 'generous' },
            'quest': { action: 'quest_offer', emotion: 'serious' }
        };
        
        const mapped = actionMappings[action] || { action, emotion: 'neutral' };
        
        return {
            ...mapped,
            ...details
        };
    }

    _getInteractionPrompt(action, player) {
        const prompts = {
            'greet': 'Someone greets you warmly',
            'help': 'Someone offers to help you',
            'talk': 'Someone wants to chat',
            'trade': 'Someone wants to trade',
            'compliment': 'Someone compliments you',
            'quest': 'Someone has a quest for you'
        };
        
        return prompts[action] || `Someone performs action: ${action}`;
    }
}

/**
 * Simplified NPC handle for easier interaction
 */
class NPCHandle {
    constructor(npc, api) {
        this._npc = npc;
        this._api = api;
    }

    get id() { return this._npc.id; }
    get name() { return this._npc.name; }
    get role() { return this._npc.role; }
    
    /**
     * Get NPC's current mood
     * 
     * @returns {Object} Mood information
     */
    getMood() {
        const mood = this._npc.getCurrentMood();
        return {
            state: mood.mood,
            emoji: this._getMoodEmoji(mood.mood),
            happiness: mood.emotions?.happiness || 0,
            energy: mood.emotions?.energy || 0,
            stress: mood.emotions?.stress || 0
        };
    }

    /**
     * Get relationship with another entity
     * 
     * @param {Object|string} entity - Entity or ID
     * @returns {Object} Relationship data
     */
    getRelationship(entity) {
        const entityId = entity.id || entity;
        const rel = this._api.system.relationshipNetwork.getRelationship(
            this._npc.id,
            entityId
        );
        
        if (!rel) {
            return { exists: false, trust: 0, affection: 0, respect: 0 };
        }
        
        return {
            exists: true,
            trust: rel.trust,
            affection: rel.affection,
            respect: rel.respect,
            type: rel.type,
            summary: this._summarizeRelationship(rel)
        };
    }

    /**
     * Make NPC speak
     * 
     * @param {string} prompt - What to say to the NPC
     * @returns {Promise<string>} NPC's response
     */
    async speak(prompt) {
        return await this._npc.speak(prompt);
    }

    /**
     * Get NPC's current goals
     * 
     * @returns {Array} Active goals
     */
    getGoals() {
        const goals = this._api.system.goalSystem.getActiveGoals(this._npc.id);
        return goals.map(goal => ({
            description: goal.description,
            progress: Math.round(goal.progress * 100),
            priority: goal.currentPriority,
            type: goal.type
        }));
    }

    /**
     * Get recent memories
     * 
     * @param {number} count - Number of memories to retrieve
     * @returns {Array} Recent memories
     */
    getRecentMemories(count = 5) {
        const memories = this._npc.consciousness?.memoryBank?.query({
            limit: count,
            sortBy: 'recent'
        }) || [];
        
        return memories.map(memory => ({
            type: memory.type,
            content: memory.content,
            timeAgo: this._getTimeAgo(memory.timestamp),
            importance: memory.importance
        }));
    }

    /**
     * Set NPC position
     * 
     * @param {Object} position - New position
     */
    setPosition(position) {
        this._npc.position = { ...this._npc.position, ...position };
    }

    /**
     * Get NPC position
     * 
     * @returns {Object} Current position
     */
    getPosition() {
        return { ...this._npc.position };
    }

    // Helper methods

    _getMoodEmoji(mood) {
        const moodEmojis = {
            joyful: '😊',
            content: '😌',
            excited: '🤗',
            anxious: '😰',
            angry: '😠',
            sad: '😢',
            loving: '🥰',
            proud: '😤',
            grateful: '🙏',
            neutral: '😐'
        };
        
        return moodEmojis[mood] || '😐';
    }

    _summarizeRelationship(rel) {
        const quality = (rel.trust + rel.affection + rel.respect) / 3;
        
        if (quality > 0.8) return 'Close Friend';
        if (quality > 0.6) return 'Friend';
        if (quality > 0.4) return 'Acquaintance';
        if (quality > 0.2) return 'Neutral';
        if (quality > 0) return 'Tense';
        return 'Hostile';
    }

    _getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
}

/**
 * Interaction result wrapper
 */
class InteractionResult {
    constructor(data) {
        this.action = data.action;
        this.npcResponse = data.npcResponse;
        this.emotionalChange = data.emotionalChange;
        this.relationshipChange = data.relationshipChange;
        this.narrativeEvents = data.narrativeEvents;
    }

    /**
     * Check if interaction was positive
     */
    wasPositive() {
        if (!this.relationshipChange) return true;
        
        const changes = this.relationshipChange.changes?.source || {};
        const totalChange = Object.values(changes).reduce((sum, val) => sum + val, 0);
        
        return totalChange >= 0;
    }

    /**
     * Get summary of what happened
     */
    getSummary() {
        const summaries = [];
        
        if (this.npcResponse) {
            summaries.push(`NPC said: "${this.npcResponse}"`);
        }
        
        if (this.emotionalChange?.target) {
            const emotions = Object.entries(this.emotionalChange.target)
                .filter(([_, value]) => Math.abs(value) > 0.1)
                .map(([emotion, value]) => `${emotion} ${value > 0 ? '+' : ''}${(value * 100).toFixed(0)}%`);
            
            if (emotions.length > 0) {
                summaries.push(`Emotional impact: ${emotions.join(', ')}`);
            }
        }
        
        if (this.narrativeEvents && this.narrativeEvents.length > 0) {
            summaries.push(`Story event: ${this.narrativeEvents[0].title}`);
        }
        
        return summaries.join('\n');
    }
}

// Export the main API class
export default AdaptiveNPCAPI;

// Also export for named imports
export { AdaptiveNPCAPI, NPCHandle, InteractionResult };
