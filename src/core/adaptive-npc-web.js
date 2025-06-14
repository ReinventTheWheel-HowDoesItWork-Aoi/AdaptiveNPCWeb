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

import { ConsciousnessCore } from '../consciousness/consciousness-core.js';
import { QuantumPersonality } from '../quantum/quantum-personality.js';
import { EmotionEngine } from '../emotional/emotion-engine.js';
import { RelationshipNetwork } from '../emotional/relationship-network.js';
import { StoryWeaver } from '../narrative/story-weaver.js';
import { WebRTCMesh } from '../networking/webrtc-mesh.js';
import { NPCManager } from './npc-manager.js';
import { Persistence } from './persistence.js';

/**
 * AdaptiveNPCWeb - Revolutionary adaptive NPC consciousness system
 * 
 * Main entry point for creating truly living NPCs with persistent memories,
 * emotional growth, relationship networks, and emergent storylines.
 * 
 * @class AdaptiveNPCWeb
 */
export class AdaptiveNPCWeb {
    /**
     * Initialize the AdaptiveNPCWeb system
     * 
     * @param {Object} config - Configuration options
     * @param {string} config.worldName - Unique identifier for the game world
     * @param {boolean} [config.enableNetworking=true] - Enable WebRTC mesh networking
     * @param {number} [config.maxNPCs=1000] - Maximum number of concurrent NPCs
     * @param {boolean} [config.enableQuantum=true] - Enable quantum personality features
     * @param {Object} [config.performanceMode='balanced'] - Performance optimization mode
     */
    constructor(config = {}) {
        this.config = {
            worldName: config.worldName || 'DefaultWorld',
            enableNetworking: config.enableNetworking !== false,
            maxNPCs: config.maxNPCs || 1000,
            enableQuantum: config.enableQuantum !== false,
            performanceMode: config.performanceMode || 'balanced',
            ...config
        };

        // Initialize core systems
        this.npcManager = new NPCManager(this.config);
        this.persistence = new Persistence(this.config.worldName);
        this.consciousnessCore = new ConsciousnessCore(this.config);
        this.emotionEngine = new EmotionEngine();
        this.relationshipNetwork = new RelationshipNetwork();
        this.storyWeaver = new StoryWeaver();
        
        // Initialize quantum personality system
        if (this.config.enableQuantum) {
            this.quantumPersonality = new QuantumPersonality();
        }

        // Initialize networking if enabled
        if (this.config.enableNetworking) {
            this.mesh = new WebRTCMesh(this.config.worldName);
            this._setupNetworkHandlers();
        }

        // Performance optimization
        this._initializeWorkers();
        this._setupPerformanceMonitoring();

        // Auto-load saved state
        this._initialized = this._initialize();
    }

    /**
     * Initialize the system and load saved state
     * @private
     */
    async _initialize() {
        try {
            // Load saved world state
            const savedState = await this.persistence.loadWorldState();
            if (savedState) {
                await this._restoreWorldState(savedState);
                console.log('AdaptiveNPCWeb: Restored world state for', this.config.worldName);
            }

            // Start background processes
            this._startBackgroundProcesses();
            
            return true;
        } catch (error) {
            console.error('AdaptiveNPCWeb: Initialization error:', error);
            return false;
        }
    }

    /**
     * Create a new adaptive NPC
     * 
     * @param {Object} config - NPC configuration
     * @param {string} config.name - NPC's name
     * @param {string} [config.role] - NPC's role in the world
     * @param {Object} [config.basePersonality] - Initial personality traits
     * @param {Object} [config.appearance] - Visual appearance data
     * @param {Object} [config.initialLocation] - Starting location
     * @returns {Promise<AdaptiveNPC>} The created NPC instance
     */
    async createNPC(config) {
        await this._initialized;

        // Generate quantum personality if enabled
        let personality = config.basePersonality || {};
        if (this.config.enableQuantum) {
            personality = this.quantumPersonality.generatePersonality(personality);
        }

        // Create consciousness instance
        const consciousness = await this.consciousnessCore.createConsciousness({
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: config.name,
            personality
        });

        // Initialize emotional state
        const emotionalState = this.emotionEngine.createEmotionalState(personality);

        // Create NPC instance
        const npc = await this.npcManager.createNPC({
            ...config,
            consciousness,
            emotionalState,
            personality
        });

        // Register with relationship network
        this.relationshipNetwork.registerEntity(npc.id, npc);

        // Share creation event if networking enabled
        if (this.mesh && this.mesh.connected) {
            this.mesh.broadcast('npc_created', {
                id: npc.id,
                name: npc.name,
                role: npc.role,
                personality: npc.personality
            });
        }

        // Auto-save
        await this.saveState();

        return npc;
    }

    /**
     * Get an NPC by ID
     * 
     * @param {string} npcId - The NPC's unique identifier
     * @returns {AdaptiveNPC|null} The NPC instance or null if not found
     */
    getNPC(npcId) {
        return this.npcManager.getNPC(npcId);
    }

    /**
     * Get all NPCs in the world
     * 
     * @returns {AdaptiveNPC[]} Array of all NPCs
     */
    getAllNPCs() {
        return this.npcManager.getAllNPCs();
    }

    /**
     * Process an interaction between entities
     * 
     * @param {string} sourceId - ID of the initiating entity
     * @param {string} targetId - ID of the target entity
     * @param {Object} interaction - Interaction details
     * @returns {Promise<Object>} Interaction result
     */
    async processInteraction(sourceId, targetId, interaction) {
        const source = this.npcManager.getNPC(sourceId);
        const target = this.npcManager.getNPC(targetId);

        if (!source || !target) {
            throw new Error('Invalid source or target ID');
        }

        // Process emotional impact
        const emotionalResult = await this.emotionEngine.processInteraction(
            source.emotionalState,
            target.emotionalState,
            interaction
        );

        // Update relationships
        const relationshipUpdate = this.relationshipNetwork.updateRelationship(
            sourceId,
            targetId,
            interaction,
            emotionalResult
        );

        // Update memories
        await source.consciousness.recordMemory({
            type: 'interaction',
            target: targetId,
            interaction,
            emotionalImpact: emotionalResult.source,
            timestamp: Date.now()
        });

        await target.consciousness.recordMemory({
            type: 'interaction',
            source: sourceId,
            interaction,
            emotionalImpact: emotionalResult.target,
            timestamp: Date.now()
        });

        // Generate narrative events
        const narrativeEvents = await this.storyWeaver.processInteraction(
            source,
            target,
            interaction,
            relationshipUpdate
        );

        // Share interaction if networking enabled
        if (this.mesh && this.mesh.connected) {
            this.mesh.broadcast('interaction', {
                sourceId,
                targetId,
                interaction,
                timestamp: Date.now()
            });
        }

        return {
            emotional: emotionalResult,
            relationship: relationshipUpdate,
            narrative: narrativeEvents
        };
    }

    /**
     * Save the current world state
     * 
     * @returns {Promise<boolean>} Success status
     */
    async saveState() {
        try {
            const worldState = {
                version: '1.0.0',
                timestamp: Date.now(),
                config: this.config,
                npcs: await this.npcManager.serializeAll(),
                relationships: this.relationshipNetwork.serialize(),
                narratives: this.storyWeaver.serialize(),
                statistics: this._getStatistics()
            };

            await this.persistence.saveWorldState(worldState);
            return true;
        } catch (error) {
            console.error('AdaptiveNPCWeb: Save error:', error);
            return false;
        }
    }

    /**
     * Load a saved world state
     * 
     * @returns {Promise<boolean>} Success status
     */
    async loadState() {
        try {
            const worldState = await this.persistence.loadWorldState();
            if (!worldState) return false;

            await this._restoreWorldState(worldState);
            return true;
        } catch (error) {
            console.error('AdaptiveNPCWeb: Load error:', error);
            return false;
        }
    }

    /**
     * Enable debug mode with visualization tools
     * 
     * @param {HTMLElement} container - Container element for debug UI
     */
    enableDebugMode(container) {
        // Create debug interface
        const debugUI = document.createElement('div');
        debugUI.className = 'adaptive-npc-debug';
        debugUI.innerHTML = `
            <h3>AdaptiveNPCWeb Debug</h3>
            <div class="debug-stats">
                <div>NPCs: <span id="debug-npc-count">0</span></div>
                <div>Memories: <span id="debug-memory-count">0</span></div>
                <div>Relationships: <span id="debug-relationship-count">0</span></div>
                <div>FPS: <span id="debug-fps">60</span></div>
            </div>
            <div class="debug-controls">
                <button onclick="window.adaptiveNPCWeb.showRelationshipGraph()">Relationship Graph</button>
                <button onclick="window.adaptiveNPCWeb.showEmotionalHeatmap()">Emotional Heatmap</button>
                <button onclick="window.adaptiveNPCWeb.exportState()">Export State</button>
            </div>
        `;
        
        container.appendChild(debugUI);
        window.adaptiveNPCWeb = this;
        
        // Start debug monitoring
        this._startDebugMonitoring();
    }

    /**
     * Setup WebRTC network handlers
     * @private
     */
    _setupNetworkHandlers() {
        this.mesh.on('npc_created', async (data) => {
            // Handle remote NPC creation
            console.log('Remote NPC created:', data.name);
        });

        this.mesh.on('interaction', async (data) => {
            // Sync remote interactions
            await this._syncRemoteInteraction(data);
        });

        this.mesh.on('consciousness_sync', async (data) => {
            // Sync consciousness states
            await this._syncConsciousness(data);
        });
    }

    /**
     * Initialize Web Workers for performance
     * @private
     */
    _initializeWorkers() {
        if (typeof Worker !== 'undefined') {
            // Create worker pool for consciousness processing
            this.workerPool = [];
            const workerCount = navigator.hardwareConcurrency || 4;
            
            for (let i = 0; i < workerCount; i++) {
                // Create inline worker for consciousness processing
                const workerCode = `
                    self.onmessage = function(e) {
                        // Process consciousness updates in parallel
                        const result = processConsciousnessUpdate(e.data);
                        self.postMessage(result);
                    };
                    
                    function processConsciousnessUpdate(data) {
                        // Simulated processing
                        return { processed: true, id: data.id };
                    }
                `;
                
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                const worker = new Worker(URL.createObjectURL(blob));
                this.workerPool.push(worker);
            }
        }
    }

    /**
     * Setup performance monitoring
     * @private
     */
    _setupPerformanceMonitoring() {
        this.performance = {
            fps: 60,
            updateTime: 0,
            memoryUsage: 0
        };

        // Monitor frame rate
        let lastTime = performance.now();
        const measureFPS = () => {
            const now = performance.now();
            this.performance.fps = Math.round(1000 / (now - lastTime));
            lastTime = now;
            requestAnimationFrame(measureFPS);
        };
        measureFPS();
    }

    /**
     * Start background processes
     * @private
     */
    _startBackgroundProcesses() {
        // Consciousness update cycle (60Hz)
        this._consciousnessInterval = setInterval(() => {
            this._updateAllConsciousness();
        }, 16);

        // Emotion decay cycle (1Hz)
        this._emotionInterval = setInterval(() => {
            this._processEmotionalDecay();
        }, 1000);

        // Auto-save cycle (every 30 seconds)
        this._saveInterval = setInterval(() => {
            this.saveState();
        }, 30000);
    }

    /**
     * Update all NPC consciousness states
     * @private
     */
    async _updateAllConsciousness() {
        const npcs = this.npcManager.getAllNPCs();
        const updatePromises = npcs.map(npc => 
            npc.consciousness.update(performance.now())
        );
        await Promise.all(updatePromises);
    }

    /**
     * Process emotional decay for all NPCs
     * @private
     */
    _processEmotionalDecay() {
        const npcs = this.npcManager.getAllNPCs();
        npcs.forEach(npc => {
            this.emotionEngine.processDecay(npc.emotionalState);
        });
    }

    /**
     * Get system statistics
     * @private
     */
    _getStatistics() {
        return {
            npcCount: this.npcManager.count,
            totalMemories: this._getTotalMemoryCount(),
            relationshipCount: this.relationshipNetwork.getRelationshipCount(),
            performance: this.performance
        };
    }

    /**
     * Restore world state from saved data
     * @private
     */
    async _restoreWorldState(worldState) {
        // Restore NPCs
        if (worldState.npcs) {
            await this.npcManager.deserializeAll(worldState.npcs);
        }

        // Restore relationships
        if (worldState.relationships) {
            this.relationshipNetwork.deserialize(worldState.relationships);
        }

        // Restore narratives
        if (worldState.narratives) {
            this.storyWeaver.deserialize(worldState.narratives);
        }
    }

    /**
     * Cleanup and shutdown
     */
    destroy() {
        // Clear intervals
        clearInterval(this._consciousnessInterval);
        clearInterval(this._emotionInterval);
        clearInterval(this._saveInterval);

        // Cleanup workers
        if (this.workerPool) {
            this.workerPool.forEach(worker => worker.terminate());
        }

        // Disconnect networking
        if (this.mesh) {
            this.mesh.disconnect();
        }

        // Final save
        this.saveState();
    }
}
