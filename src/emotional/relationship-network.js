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
 * RelationshipNetwork - Manages complex social connections between NPCs
 * 
 * Implements a graph-based social network with multi-dimensional relationships,
 * history tracking, and social influence propagation.
 * 
 * @class RelationshipNetwork
 */
export class RelationshipNetwork {
    constructor(config = {}) {
        this.config = {
            maxRelationships: 150,          // Dunbar's number
            decayRate: 0.001,               // How fast relationships decay
            propagationDepth: 3,            // How far social influence spreads
            trustThreshold: 0.3,            // Minimum trust for sharing info
            conflictThreshold: -0.5,        // When relationships become hostile
            ...config
        };

        // Graph structure: entityId -> Map of relationships
        this.network = new Map();
        
        // Entity registry
        this.entities = new Map();
        
        // Social groups and communities
        this.groups = new Map();
        
        // Relationship event history
        this.eventHistory = [];
        this.maxHistorySize = 1000;
    }

    /**
     * Register an entity in the network
     * 
     * @param {string} entityId - Unique entity identifier
     * @param {Object} entity - Entity reference
     */
    registerEntity(entityId, entity) {
        this.entities.set(entityId, entity);
        this.network.set(entityId, new Map());
    }

    /**
     * Update a relationship between two entities
     * 
     * @param {string} sourceId - Source entity ID
     * @param {string} targetId - Target entity ID
     * @param {Object} interaction - Interaction details
     * @param {Object} emotionalResult - Emotional impact from interaction
     * @returns {Object} Updated relationship state
     */
    updateRelationship(sourceId, targetId, interaction, emotionalResult) {
        // Get or create relationships
        const sourceRel = this._getOrCreateRelationship(sourceId, targetId);
        const targetRel = this._getOrCreateRelationship(targetId, sourceId);
        
        // Calculate relationship changes
        const changes = this._calculateRelationshipChanges(
            interaction,
            emotionalResult,
            sourceRel,
            targetRel
        );
        
        // Apply changes
        this._applyRelationshipChanges(sourceRel, changes.source);
        this._applyRelationshipChanges(targetRel, changes.target);
        
        // Record interaction history
        const event = {
            timestamp: Date.now(),
            source: sourceId,
            target: targetId,
            interaction,
            changes,
            resultingRelationships: {
                source: this._summarizeRelationship(sourceRel),
                target: this._summarizeRelationship(targetRel)
            }
        };
        
        sourceRel.history.push(event);
        targetRel.history.push(event);
        this.eventHistory.push(event);
        
        // Limit history sizes
        this._pruneHistory();
        
        // Check for group formation or dissolution
        this._updateSocialGroups(sourceId, targetId);
        
        // Propagate social influence
        this._propagateSocialInfluence(sourceId, targetId, interaction);
        
        return {
            source: sourceRel,
            target: targetRel,
            changes
        };
    }

    /**
     * Get relationship between two entities
     * 
     * @param {string} entityId1 - First entity ID
     * @param {string} entityId2 - Second entity ID
     * @returns {Relationship|null} Relationship or null if none exists
     */
    getRelationship(entityId1, entityId2) {
        const relationships = this.network.get(entityId1);
        return relationships ? relationships.get(entityId2) : null;
    }

    /**
     * Get all relationships for an entity
     * 
     * @param {string} entityId - Entity ID
     * @returns {Map} Map of all relationships
     */
    getRelationships(entityId) {
        return this.network.get(entityId) || new Map();
    }

    /**
     * Get social influence score for an entity
     * 
     * @param {string} entityId - Entity ID
     * @returns {number} Influence score (0-1)
     */
    getSocialInfluence(entityId) {
        const relationships = this.getRelationships(entityId);
        let influence = 0;
        
        for (const [otherId, rel] of relationships) {
            // Influence based on trust and respect others have
            const reverseRel = this.getRelationship(otherId, entityId);
            if (reverseRel) {
                influence += (reverseRel.trust + reverseRel.respect) / 2;
            }
        }
        
        return Math.min(1, influence / Math.max(1, relationships.size));
    }

    /**
     * Find communities using graph clustering
     * 
     * @returns {Array} Array of community groups
     */
    findCommunities() {
        const communities = [];
        const visited = new Set();
        
        // Simple connected components algorithm
        for (const [entityId] of this.entities) {
            if (visited.has(entityId)) continue;
            
            const community = this._exploreComponent(entityId, visited);
            if (community.size > 1) {
                communities.push(community);
            }
        }
        
        return communities;
    }

    /**
     * Get social path between two entities
     * 
     * @param {string} startId - Starting entity
     * @param {string} endId - Target entity
     * @returns {Array|null} Path of entity IDs or null if no connection
     */
    findSocialPath(startId, endId) {
        if (startId === endId) return [startId];
        
        // BFS to find shortest path
        const queue = [[startId]];
        const visited = new Set([startId]);
        
        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];
            
            const relationships = this.getRelationships(current);
            for (const [neighborId, rel] of relationships) {
                if (visited.has(neighborId)) continue;
                
                // Only follow positive relationships
                if (rel.trust > this.config.trustThreshold) {
                    const newPath = [...path, neighborId];
                    
                    if (neighborId === endId) {
                        return newPath;
                    }
                    
                    visited.add(neighborId);
                    queue.push(newPath);
                }
            }
        }
        
        return null;
    }

    /**
     * Process relationship decay over time
     */
    processDecay() {
        const decayRate = this.config.decayRate;
        
        for (const [entityId, relationships] of this.network) {
            for (const [otherId, rel] of relationships) {
                // Recent interactions prevent decay
                const lastInteraction = rel.history[rel.history.length - 1];
                const timeSinceInteraction = lastInteraction ? 
                    Date.now() - lastInteraction.timestamp : Infinity;
                
                if (timeSinceInteraction > 60000) { // 1 minute
                    // Decay towards neutral
                    rel.trust = this._decay(rel.trust, 0.5, decayRate);
                    rel.affection = this._decay(rel.affection, 0.3, decayRate);
                    rel.respect = this._decay(rel.respect, 0.5, decayRate);
                    rel.familiarity = this._decay(rel.familiarity, 0, decayRate * 0.5);
                }
            }
        }
    }

    /**
     * Get relationship statistics
     * 
     * @returns {Object} Network statistics
     */
    getStatistics() {
        let totalRelationships = 0;
        let positiveRelationships = 0;
        let negativeRelationships = 0;
        let strongRelationships = 0;
        
        for (const [entityId, relationships] of this.network) {
            for (const [otherId, rel] of relationships) {
                totalRelationships++;
                
                const strength = (rel.trust + rel.affection + rel.respect) / 3;
                if (strength > 0.6) {
                    positiveRelationships++;
                    if (strength > 0.8) {
                        strongRelationships++;
                    }
                } else if (strength < 0.4) {
                    negativeRelationships++;
                }
            }
        }
        
        return {
            totalRelationships: totalRelationships / 2, // Bidirectional
            positiveRelationships: positiveRelationships / 2,
            negativeRelationships: negativeRelationships / 2,
            strongRelationships: strongRelationships / 2,
            communities: this.groups.size,
            averageDegree: totalRelationships / this.entities.size
        };
    }

    /**
     * Get or create a relationship
     * @private
     */
    _getOrCreateRelationship(sourceId, targetId) {
        let relationships = this.network.get(sourceId);
        if (!relationships) {
            relationships = new Map();
            this.network.set(sourceId, relationships);
        }
        
        let relationship = relationships.get(targetId);
        if (!relationship) {
            relationship = new Relationship(sourceId, targetId);
            relationships.set(targetId, relationship);
        }
        
        return relationship;
    }

    /**
     * Calculate relationship changes from interaction
     * @private
     */
    _calculateRelationshipChanges(interaction, emotionalResult, sourceRel, targetRel) {
        const changes = {
            source: {},
            target: {}
        };
        
        // Base changes from interaction type
        const interactionEffects = {
            help: {
                source: { respect: 0.05, affection: 0.1 },
                target: { trust: 0.15, affection: 0.1, respect: 0.1 }
            },
            betray: {
                source: { trust: -0.1, respect: -0.2 },
                target: { trust: -0.5, affection: -0.3, respect: -0.4 }
            },
            compliment: {
                source: { affection: 0.05 },
                target: { affection: 0.1, trust: 0.05 }
            },
            conflict: {
                source: { affection: -0.1, respect: -0.05 },
                target: { affection: -0.1, respect: -0.05 }
            },
            cooperate: {
                source: { trust: 0.1, respect: 0.1 },
                target: { trust: 0.1, respect: 0.1 }
            }
        };
        
        // Get base effects
        const effects = interactionEffects[interaction.action] || {
            source: {},
            target: {}
        };
        
        // Modulate by emotional results
        changes.source = this._modulateByEmotions(effects.source, emotionalResult.source);
        changes.target = this._modulateByEmotions(effects.target, emotionalResult.target);
        
        // Add familiarity increase
        changes.source.familiarity = 0.02;
        changes.target.familiarity = 0.02;
        
        // Relationship history affects future changes
        if (sourceRel.history.length > 10) {
            const modifier = this._calculateHistoryModifier(sourceRel.history);
            for (const [key, value] of Object.entries(changes.source)) {
                changes.source[key] = value * modifier;
            }
        }
        
        return changes;
    }

    /**
     * Modulate relationship changes by emotional impact
     * @private
     */
    _modulateByEmotions(changes, emotions) {
        const modulated = { ...changes };
        
        // Positive emotions enhance positive changes
        if (emotions.happiness > 0) {
            for (const [key, value] of Object.entries(modulated)) {
                if (value > 0) {
                    modulated[key] = value * (1 + emotions.happiness * 0.5);
                }
            }
        }
        
        // Negative emotions enhance negative changes
        if (emotions.anger > 0 || emotions.sadness > 0) {
            const negativity = Math.max(emotions.anger || 0, emotions.sadness || 0);
            for (const [key, value] of Object.entries(modulated)) {
                if (value < 0) {
                    modulated[key] = value * (1 + negativity * 0.5);
                }
            }
        }
        
        // Trust affects trust changes
        if (emotions.trust !== undefined) {
            modulated.trust = (modulated.trust || 0) + emotions.trust * 0.2;
        }
        
        return modulated;
    }

    /**
     * Apply relationship changes
     * @private
     */
    _applyRelationshipChanges(relationship, changes) {
        for (const [dimension, delta] of Object.entries(changes)) {
            const current = relationship[dimension] || 0;
            relationship[dimension] = Math.max(-1, Math.min(1, current + delta));
        }
        
        // Update relationship type based on new values
        relationship.updateType();
    }

    /**
     * Calculate history modifier for relationship changes
     * @private
     */
    _calculateHistoryModifier(history) {
        // Recent positive interactions make positive changes more likely
        let recentPositive = 0;
        let recentNegative = 0;
        
        const recent = history.slice(-5);
        for (const event of recent) {
            const changes = event.changes?.source || {};
            for (const value of Object.values(changes)) {
                if (value > 0) recentPositive++;
                if (value < 0) recentNegative++;
            }
        }
        
        if (recentPositive > recentNegative) {
            return 1.2; // Momentum bonus
        } else if (recentNegative > recentPositive) {
            return 0.8; // Resistance to change
        }
        
        return 1.0;
    }

    /**
     * Update social groups based on relationships
     * @private
     */
    _updateSocialGroups(entityId1, entityId2) {
        const rel = this.getRelationship(entityId1, entityId2);
        if (!rel) return;
        
        const strength = (rel.trust + rel.affection + rel.respect) / 3;
        
        // Strong positive relationships can form groups
        if (strength > 0.7) {
            // Find or create group
            let group1 = this._findEntityGroup(entityId1);
            let group2 = this._findEntityGroup(entityId2);
            
            if (!group1 && !group2) {
                // Create new group
                const groupId = `group_${Date.now()}`;
                const group = new SocialGroup(groupId);
                group.addMember(entityId1);
                group.addMember(entityId2);
                this.groups.set(groupId, group);
            } else if (group1 && !group2) {
                // Add entity2 to group1
                group1.addMember(entityId2);
            } else if (!group1 && group2) {
                // Add entity1 to group2
                group2.addMember(entityId1);
            } else if (group1 && group2 && group1 !== group2) {
                // Merge groups if cohesion is high enough
                if (this._calculateGroupCohesion(group1, group2) > 0.6) {
                    this._mergeGroups(group1, group2);
                }
            }
        }
        
        // Negative relationships can split groups
        if (strength < -0.5) {
            const group = this._findEntityGroup(entityId1);
            if (group && group.members.has(entityId2)) {
                // Check if group should split
                if (this._calculateGroupCohesion(group) < 0.4) {
                    this._splitGroup(group, entityId1, entityId2);
                }
            }
        }
    }

    /**
     * Propagate social influence through network
     * @private
     */
    _propagateSocialInfluence(sourceId, targetId, interaction) {
        if (!interaction.socialInfluence) return;
        
        const visited = new Set([sourceId]);
        const queue = [{
            entityId: targetId,
            influence: interaction.socialInfluence,
            depth: 1
        }];
        
        while (queue.length > 0) {
            const { entityId, influence, depth } = queue.shift();
            
            if (depth > this.config.propagationDepth) continue;
            if (visited.has(entityId)) continue;
            
            visited.add(entityId);
            
            // Apply influence
            const entity = this.entities.get(entityId);
            if (entity && entity.receiveSocialInfluence) {
                entity.receiveSocialInfluence(sourceId, influence);
            }
            
            // Propagate to trusted connections
            const relationships = this.getRelationships(entityId);
            for (const [otherId, rel] of relationships) {
                if (rel.trust > this.config.trustThreshold) {
                    queue.push({
                        entityId: otherId,
                        influence: influence * rel.trust * 0.5, // Decay
                        depth: depth + 1
                    });
                }
            }
        }
    }

    /**
     * Explore connected component for community detection
     * @private
     */
    _exploreComponent(startId, visited) {
        const component = new Set();
        const queue = [startId];
        
        while (queue.length > 0) {
            const entityId = queue.shift();
            if (visited.has(entityId)) continue;
            
            visited.add(entityId);
            component.add(entityId);
            
            const relationships = this.getRelationships(entityId);
            for (const [otherId, rel] of relationships) {
                const strength = (rel.trust + rel.affection + rel.respect) / 3;
                if (strength > 0.5 && !visited.has(otherId)) {
                    queue.push(otherId);
                }
            }
        }
        
        return component;
    }

    /**
     * Find group containing entity
     * @private
     */
    _findEntityGroup(entityId) {
        for (const [groupId, group] of this.groups) {
            if (group.members.has(entityId)) {
                return group;
            }
        }
        return null;
    }

    /**
     * Calculate group cohesion
     * @private
     */
    _calculateGroupCohesion(group1, group2) {
        let totalStrength = 0;
        let connectionCount = 0;
        
        const members1 = group2 ? group1.members : group1.members;
        const members2 = group2 ? group2.members : group1.members;
        
        for (const member1 of members1) {
            for (const member2 of members2) {
                if (member1 === member2) continue;
                
                const rel = this.getRelationship(member1, member2);
                if (rel) {
                    const strength = (rel.trust + rel.affection + rel.respect) / 3;
                    totalStrength += strength;
                    connectionCount++;
                }
            }
        }
        
        return connectionCount > 0 ? totalStrength / connectionCount : 0;
    }

    /**
     * Merge two social groups
     * @private
     */
    _mergeGroups(group1, group2) {
        // Add all members from group2 to group1
        for (const member of group2.members) {
            group1.addMember(member);
        }
        
        // Remove group2
        this.groups.delete(group2.id);
    }

    /**
     * Split a social group
     * @private
     */
    _splitGroup(group, entityId1, entityId2) {
        // Simple split: remove one of the conflicting members
        const cohesion1 = this._calculateMemberCohesion(group, entityId1);
        const cohesion2 = this._calculateMemberCohesion(group, entityId2);
        
        if (cohesion1 < cohesion2) {
            group.removeMember(entityId1);
        } else {
            group.removeMember(entityId2);
        }
        
        // If group is too small, dissolve it
        if (group.members.size < 2) {
            this.groups.delete(group.id);
        }
    }

    /**
     * Calculate member's cohesion with group
     * @private
     */
    _calculateMemberCohesion(group, memberId) {
        let totalStrength = 0;
        let count = 0;
        
        for (const otherId of group.members) {
            if (otherId === memberId) continue;
            
            const rel = this.getRelationship(memberId, otherId);
            if (rel) {
                totalStrength += (rel.trust + rel.affection + rel.respect) / 3;
                count++;
            }
        }
        
        return count > 0 ? totalStrength / count : 0;
    }

    /**
     * Decay value towards target
     * @private
     */
    _decay(current, target, rate) {
        const delta = (target - current) * rate;
        return current + delta;
    }

    /**
     * Summarize relationship for storage
     * @private
     */
    _summarizeRelationship(rel) {
        return {
            trust: rel.trust,
            affection: rel.affection,
            respect: rel.respect,
            familiarity: rel.familiarity,
            type: rel.type
        };
    }

    /**
     * Prune history to manage memory
     * @private
     */
    _pruneHistory() {
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
        }
        
        // Also prune individual relationship histories
        for (const [entityId, relationships] of this.network) {
            for (const [otherId, rel] of relationships) {
                if (rel.history.length > 50) {
                    rel.history = rel.history.slice(-50);
                }
            }
        }
    }

    /**
     * Get total relationship count
     */
    getRelationshipCount() {
        let count = 0;
        for (const [entityId, relationships] of this.network) {
            count += relationships.size;
        }
        return count / 2; // Bidirectional relationships
    }

    /**
     * Serialize network state
     */
    serialize() {
        const serialized = {
            entities: Array.from(this.entities.keys()),
            relationships: {},
            groups: {},
            eventHistory: this.eventHistory.slice(-100)
        };
        
        // Serialize relationships
        for (const [entityId, relationships] of this.network) {
            serialized.relationships[entityId] = {};
            for (const [otherId, rel] of relationships) {
                serialized.relationships[entityId][otherId] = rel.serialize();
            }
        }
        
        // Serialize groups
        for (const [groupId, group] of this.groups) {
            serialized.groups[groupId] = group.serialize();
        }
        
        return serialized;
    }

    /**
     * Deserialize network state
     */
    deserialize(data) {
        // Clear current state
        this.network.clear();
        this.groups.clear();
        
        // Restore entities
        for (const entityId of data.entities) {
            this.network.set(entityId, new Map());
        }
        
        // Restore relationships
        for (const [entityId, relationships] of Object.entries(data.relationships)) {
            const entityRels = this.network.get(entityId) || new Map();
            
            for (const [otherId, relData] of Object.entries(relationships)) {
                const rel = new Relationship(entityId, otherId);
                rel.deserialize(relData);
                entityRels.set(otherId, rel);
            }
            
            this.network.set(entityId, entityRels);
        }
        
        // Restore groups
        for (const [groupId, groupData] of Object.entries(data.groups || {})) {
            const group = new SocialGroup(groupId);
            group.deserialize(groupData);
            this.groups.set(groupId, group);
        }
        
        // Restore event history
        this.eventHistory = data.eventHistory || [];
    }
}

/**
 * Individual relationship between two entities
 * 
 * @class Relationship
 */
class Relationship {
    constructor(sourceId, targetId) {
        this.sourceId = sourceId;
        this.targetId = targetId;
        
        // Relationship dimensions
        this.trust = 0.5;        // How much they trust each other
        this.affection = 0.3;    // How much they like each other
        this.respect = 0.5;      // How much they respect each other
        this.familiarity = 0;    // How well they know each other
        
        // Relationship type (calculated)
        this.type = 'acquaintance';
        
        // Interaction history
        this.history = [];
        
        // Metadata
        this.formed = Date.now();
        this.lastInteraction = Date.now();
    }

    /**
     * Update relationship type based on dimensions
     */
    updateType() {
        const avgStrength = (this.trust + this.affection + this.respect) / 3;
        
        if (avgStrength > 0.8 && this.familiarity > 0.7) {
            this.type = 'close_friend';
        } else if (avgStrength > 0.6 && this.familiarity > 0.5) {
            this.type = 'friend';
        } else if (avgStrength > 0.4) {
            this.type = 'acquaintance';
        } else if (avgStrength < -0.6) {
            this.type = 'enemy';
        } else if (avgStrength < -0.3) {
            this.type = 'rival';
        } else {
            this.type = 'neutral';
        }
        
        // Special types
        if (this.affection > 0.8 && this.trust > 0.7) {
            this.type = 'romantic';
        } else if (this.respect > 0.8 && this.trust > 0.6) {
            this.type = 'mentor';
        } else if (this.trust < -0.7) {
            this.type = 'nemesis';
        }
    }

    /**
     * Get relationship strength
     */
    getStrength() {
        return (Math.abs(this.trust) + Math.abs(this.affection) + 
                Math.abs(this.respect) + this.familiarity) / 4;
    }

    /**
     * Get relationship quality (-1 to 1)
     */
    getQuality() {
        return (this.trust + this.affection + this.respect) / 3;
    }

    /**
     * Serialize relationship
     */
    serialize() {
        return {
            trust: this.trust,
            affection: this.affection,
            respect: this.respect,
            familiarity: this.familiarity,
            type: this.type,
            formed: this.formed,
            lastInteraction: this.lastInteraction,
            historyCount: this.history.length
        };
    }

    /**
     * Deserialize relationship
     */
    deserialize(data) {
        this.trust = data.trust;
        this.affection = data.affection;
        this.respect = data.respect;
        this.familiarity = data.familiarity;
        this.type = data.type;
        this.formed = data.formed;
        this.lastInteraction = data.lastInteraction;
        // History is not fully restored to save space
    }
}

/**
 * Social group of entities
 * 
 * @class SocialGroup
 */
class SocialGroup {
    constructor(id) {
        this.id = id;
        this.members = new Set();
        this.formed = Date.now();
        this.type = 'general'; // friend_group, work_group, family, etc.
        this.cohesion = 0.5;
    }

    /**
     * Add member to group
     */
    addMember(entityId) {
        this.members.add(entityId);
    }

    /**
     * Remove member from group
     */
    removeMember(entityId) {
        this.members.delete(entityId);
    }

    /**
     * Serialize group
     */
    serialize() {
        return {
            members: Array.from(this.members),
            formed: this.formed,
            type: this.type,
            cohesion: this.cohesion
        };
    }

    /**
     * Deserialize group
     */
    deserialize(data) {
        this.members = new Set(data.members);
        this.formed = data.formed;
        this.type = data.type;
        this.cohesion = data.cohesion;
    }
}
