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

import { EventMemory } from './event-memory.js';
import { GoalSystem } from './goal-system.js';

/**
 * StoryWeaver - Generates emergent narratives from NPC interactions
 * 
 * Creates personal storylines, tracks narrative arcs, and generates
 * meaningful events based on NPC relationships and experiences.
 * 
 * @class StoryWeaver
 */
export class StoryWeaver {
    constructor(config = {}) {
        this.config = {
            minEventImportance: 0.3,        // Threshold for story-worthy events
            arcDuration: 7 * 24 * 60 * 60 * 1000, // Week-long arcs
            maxActiveThreads: 10,           // Max concurrent story threads
            dramaticTension: 0.7,           // How much conflict to generate
            ...config
        };

        // Story components
        this.eventMemory = new EventMemory();
        this.goalSystem = new GoalSystem();
        
        // Active narrative threads
        this.activeThreads = new Map();
        
        // Story templates and archetypes
        this.archetypes = this._defineArchetypes();
        this.eventTemplates = this._defineEventTemplates();
        
        // Narrative history
        this.completedStories = [];
        this.narrativeGraph = new Map(); // Connections between stories
    }

    /**
     * Process an interaction and generate narrative events
     * 
     * @param {Object} source - Source NPC
     * @param {Object} target - Target NPC
     * @param {Object} interaction - Interaction details
     * @param {Object} relationshipUpdate - Relationship changes
     * @returns {Array} Generated narrative events
     */
    async processInteraction(source, target, interaction, relationshipUpdate) {
        const events = [];
        
        // Record the interaction as an event
        const interactionEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'interaction',
            timestamp: Date.now(),
            participants: [source.id, target.id],
            interaction,
            relationshipChanges: relationshipUpdate.changes,
            importance: this._calculateEventImportance(interaction, relationshipUpdate)
        };
        
        this.eventMemory.record(interactionEvent);
        
        // Check if this creates a story-worthy moment
        if (interactionEvent.importance > this.config.minEventImportance) {
            events.push(interactionEvent);
            
            // Check for narrative triggers
            const triggers = this._checkNarrativeTriggers(
                source,
                target,
                interactionEvent,
                relationshipUpdate
            );
            
            for (const trigger of triggers) {
                const narrativeEvent = await this._generateNarrativeEvent(trigger);
                if (narrativeEvent) {
                    events.push(narrativeEvent);
                }
            }
        }
        
        // Update active threads
        await this._updateActiveThreads(source, target, events);
        
        // Check for emergent story arcs
        const newArcs = this._detectEmergentArcs(source, target);
        for (const arc of newArcs) {
            this._startNarrativeThread(arc);
        }
        
        return events;
    }

    /**
     * Generate a personal storyline for an NPC
     * 
     * @param {Object} npc - The NPC
     * @returns {Object} Personal narrative
     */
    generatePersonalNarrative(npc) {
        const narrative = {
            protagonist: npc.id,
            title: this._generateTitle(npc),
            theme: this._selectTheme(npc),
            acts: [],
            currentAct: 1,
            status: 'active'
        };
        
        // Generate story acts based on NPC's goals and relationships
        const goals = this.goalSystem.getActiveGoals(npc.id);
        const relationships = npc.relationships || new Map();
        
        // Act 1: Setup - Establish character and initial situation
        narrative.acts.push({
            number: 1,
            title: "The Beginning",
            scenes: this._generateSetupScenes(npc, goals, relationships),
            status: 'active'
        });
        
        // Act 2: Rising Action - Challenges and conflicts
        narrative.acts.push({
            number: 2,
            title: "The Journey",
            scenes: this._generateConflictScenes(npc, goals, relationships),
            status: 'planned'
        });
        
        // Act 3: Resolution - Achievement or transformation
        narrative.acts.push({
            number: 3,
            title: "The Resolution",
            scenes: this._generateResolutionScenes(npc, goals),
            status: 'planned'
        });
        
        return narrative;
    }

    /**
     * Check for narrative triggers
     * @private
     */
    _checkNarrativeTriggers(source, target, event, relationshipUpdate) {
        const triggers = [];
        
        // Relationship milestones
        if (relationshipUpdate.source.type !== relationshipUpdate.target.type) {
            triggers.push({
                type: 'relationship_change',
                from: relationshipUpdate.source.type,
                to: relationshipUpdate.target.type,
                participants: [source.id, target.id]
            });
        }
        
        // Emotional peaks
        const emotionalIntensity = this._calculateEmotionalIntensity(event);
        if (emotionalIntensity > 0.8) {
            triggers.push({
                type: 'emotional_peak',
                emotion: this._dominantEmotion(event),
                intensity: emotionalIntensity,
                participants: [source.id, target.id]
            });
        }
        
        // Goal-related events
        const goalImpact = this._assessGoalImpact(source, target, event);
        if (goalImpact.significant) {
            triggers.push({
                type: 'goal_event',
                goal: goalImpact.goal,
                impact: goalImpact.type,
                participants: [source.id, target.id]
            });
        }
        
        // Pattern completion
        const pattern = this._detectEventPattern([source.id, target.id]);
        if (pattern) {
            triggers.push({
                type: 'pattern_completion',
                pattern: pattern.type,
                participants: pattern.participants
            });
        }
        
        return triggers;
    }

    /**
     * Generate a narrative event from a trigger
     * @private
     */
    async _generateNarrativeEvent(trigger) {
        const templates = this.eventTemplates[trigger.type];
        if (!templates || templates.length === 0) return null;
        
        // Select appropriate template
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Generate event
        const event = {
            id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'narrative',
            subtype: trigger.type,
            timestamp: Date.now(),
            participants: trigger.participants,
            title: this._fillTemplate(template.title, trigger),
            description: this._fillTemplate(template.description, trigger),
            consequences: template.consequences,
            importance: template.importance || 0.5,
            dramatic: true
        };
        
        // Apply consequences
        await this._applyEventConsequences(event);
        
        return event;
    }

    /**
     * Update active narrative threads
     * @private
     */
    async _updateActiveThreads(source, target, events) {
        // Check each active thread
        for (const [threadId, thread] of this.activeThreads) {
            // Skip unrelated threads
            if (!thread.participants.includes(source.id) && 
                !thread.participants.includes(target.id)) {
                continue;
            }
            
            // Update thread with new events
            for (const event of events) {
                thread.events.push(event);
                
                // Check for arc progression
                const progression = this._checkArcProgression(thread, event);
                if (progression) {
                    thread.currentBeat = progression.nextBeat;
                    thread.tension = progression.tension;
                    
                    // Check for climax
                    if (progression.isClimax) {
                        thread.status = 'climax';
                    }
                    
                    // Check for resolution
                    if (progression.isResolution) {
                        await this._resolveThread(thread);
                    }
                }
            }
            
            // Update thread timestamp
            thread.lastUpdate = Date.now();
        }
        
        // Clean up old threads
        this._cleanupThreads();
    }

    /**
     * Detect emergent story arcs
     * @private
     */
    _detectEmergentArcs(source, target) {
        const arcs = [];
        
        // Love story detection
        const relationship = source.relationships?.get(target.id);
        if (relationship && relationship.affection > 0.7 && relationship.trust > 0.6) {
            const hasLoveStory = this._hasActiveArc('romance', [source.id, target.id]);
            if (!hasLoveStory) {
                arcs.push({
                    type: 'romance',
                    participants: [source.id, target.id],
                    initialState: { ...relationship }
                });
            }
        }
        
        // Rivalry detection
        if (relationship && relationship.respect < 0.3 && relationship.trust < 0.3) {
            const hasRivalry = this._hasActiveArc('rivalry', [source.id, target.id]);
            if (!hasRivalry) {
                arcs.push({
                    type: 'rivalry',
                    participants: [source.id, target.id],
                    initialState: { ...relationship }
                });
            }
        }
        
        // Mentorship detection
        if (relationship && relationship.respect > 0.8 && 
            this._hasKnowledgeGap(source, target)) {
            const hasMentorship = this._hasActiveArc('mentorship', [source.id, target.id]);
            if (!hasMentorship) {
                arcs.push({
                    type: 'mentorship',
                    participants: [source.id, target.id],
                    mentor: this._moreSkilledNPC(source, target).id
                });
            }
        }
        
        return arcs;
    }

    /**
     * Start a new narrative thread
     * @private
     */
    _startNarrativeThread(arc) {
        const thread = {
            id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: arc.type,
            participants: arc.participants,
            startTime: Date.now(),
            events: [],
            currentBeat: 1,
            tension: 0.3,
            status: 'active',
            arc: this.archetypes[arc.type] || this.archetypes.generic,
            metadata: arc
        };
        
        this.activeThreads.set(thread.id, thread);
        
        // Generate initial events
        const setupEvents = this._generateSetupEvents(thread);
        thread.events.push(...setupEvents);
    }

    /**
     * Define story archetypes
     * @private
     */
    _defineArchetypes() {
        return {
            romance: {
                beats: [
                    { name: 'meeting', tension: 0.2 },
                    { name: 'attraction', tension: 0.4 },
                    { name: 'conflict', tension: 0.7 },
                    { name: 'declaration', tension: 0.9 },
                    { name: 'resolution', tension: 0.3 }
                ],
                themes: ['love', 'connection', 'vulnerability']
            },
            rivalry: {
                beats: [
                    { name: 'initial_conflict', tension: 0.3 },
                    { name: 'escalation', tension: 0.6 },
                    { name: 'confrontation', tension: 0.9 },
                    { name: 'aftermath', tension: 0.4 }
                ],
                themes: ['competition', 'respect', 'growth']
            },
            mentorship: {
                beats: [
                    { name: 'recognition', tension: 0.2 },
                    { name: 'teaching', tension: 0.3 },
                    { name: 'challenge', tension: 0.6 },
                    { name: 'mastery', tension: 0.8 },
                    { name: 'succession', tension: 0.4 }
                ],
                themes: ['wisdom', 'growth', 'legacy']
            },
            redemption: {
                beats: [
                    { name: 'fall', tension: 0.7 },
                    { name: 'realization', tension: 0.5 },
                    { name: 'struggle', tension: 0.8 },
                    { name: 'atonement', tension: 0.9 },
                    { name: 'forgiveness', tension: 0.3 }
                ],
                themes: ['forgiveness', 'change', 'hope']
            },
            generic: {
                beats: [
                    { name: 'setup', tension: 0.2 },
                    { name: 'development', tension: 0.5 },
                    { name: 'climax', tension: 0.9 },
                    { name: 'resolution', tension: 0.3 }
                ],
                themes: ['change', 'growth', 'understanding']
            }
        };
    }

    /**
     * Define event templates
     * @private
     */
    _defineEventTemplates() {
        return {
            relationship_change: [
                {
                    title: "A New Understanding",
                    description: "The relationship between {participants} has fundamentally changed.",
                    consequences: ['relationship_update'],
                    importance: 0.7
                },
                {
                    title: "Bonds Tested",
                    description: "Recent events have altered how {participants} see each other.",
                    consequences: ['relationship_update', 'emotional_impact'],
                    importance: 0.6
                }
            ],
            emotional_peak: [
                {
                    title: "Overwhelming Emotions",
                    description: "Intense {emotion} overwhelms the moment between {participants}.",
                    consequences: ['emotional_impact', 'memory_formation'],
                    importance: 0.8
                },
                {
                    title: "Breaking Point",
                    description: "Emotions reach a crescendo as {emotion} takes over.",
                    consequences: ['emotional_impact', 'behavior_change'],
                    importance: 0.9
                }
            ],
            goal_event: [
                {
                    title: "Progress Made",
                    description: "A significant step toward {goal} has been achieved.",
                    consequences: ['goal_progress'],
                    importance: 0.6
                },
                {
                    title: "Setback",
                    description: "An obstacle blocks progress toward {goal}.",
                    consequences: ['goal_setback', 'emotional_impact'],
                    importance: 0.7
                }
            ],
            pattern_completion: [
                {
                    title: "Cycle Completes",
                    description: "A familiar pattern plays out once again between {participants}.",
                    consequences: ['realization', 'behavior_change'],
                    importance: 0.5
                },
                {
                    title: "Breaking the Pattern",
                    description: "Finally, the cycle is broken between {participants}.",
                    consequences: ['relationship_update', 'personal_growth'],
                    importance: 0.8
                }
            ]
        };
    }

    /**
     * Calculate event importance
     * @private
     */
    _calculateEventImportance(interaction, relationshipUpdate) {
        let importance = 0.3; // Base importance
        
        // Relationship change magnitude
        const relChangeMagnitude = this._calculateChangeMagnitude(relationshipUpdate.changes);
        importance += relChangeMagnitude * 0.3;
        
        // Interaction rarity
        const rarity = this._calculateInteractionRarity(interaction.action);
        importance += rarity * 0.2;
        
        // Emotional intensity
        if (interaction.emotion) {
            importance += 0.2;
        }
        
        return Math.min(1.0, importance);
    }

    /**
     * Calculate change magnitude
     * @private
     */
    _calculateChangeMagnitude(changes) {
        if (!changes.source) return 0;
        
        let totalChange = 0;
        let count = 0;
        
        for (const value of Object.values(changes.source)) {
            totalChange += Math.abs(value);
            count++;
        }
        
        return count > 0 ? totalChange / count : 0;
    }

    /**
     * Calculate interaction rarity
     * @private
     */
    _calculateInteractionRarity(action) {
        const rarityScores = {
            greet: 0.1,
            help: 0.3,
            gift: 0.5,
            conflict: 0.6,
            betray: 0.9,
            declare_love: 0.95
        };
        
        return rarityScores[action] || 0.3;
    }

    /**
     * Fill template with data
     * @private
     */
    _fillTemplate(template, data) {
        let filled = template;
        
        // Replace participants
        if (data.participants) {
            filled = filled.replace('{participants}', 
                data.participants.join(' and '));
        }
        
        // Replace other placeholders
        for (const [key, value] of Object.entries(data)) {
            filled = filled.replace(`{${key}}`, value);
        }
        
        return filled;
    }

    /**
     * Apply event consequences
     * @private
     */
    async _applyEventConsequences(event) {
        for (const consequence of event.consequences) {
            switch (consequence) {
                case 'relationship_update':
                    // Would trigger relationship system update
                    break;
                case 'emotional_impact':
                    // Would trigger emotional system update
                    break;
                case 'goal_progress':
                    // Would update goal system
                    break;
                case 'memory_formation':
                    // Would create strong memory
                    break;
            }
        }
    }

    /**
     * Check arc progression
     * @private
     */
    _checkArcProgression(thread, event) {
        const currentBeat = thread.arc.beats[thread.currentBeat - 1];
        const nextBeat = thread.arc.beats[thread.currentBeat];
        
        if (!nextBeat) {
            return {
                isResolution: true,
                tension: 0.2
            };
        }
        
        // Check if event advances the arc
        const advances = this._eventAdvancesArc(event, currentBeat, nextBeat);
        
        if (advances) {
            return {
                nextBeat: thread.currentBeat + 1,
                tension: nextBeat.tension,
                isClimax: nextBeat.tension >= 0.9,
                isResolution: thread.currentBeat >= thread.arc.beats.length - 1
            };
        }
        
        return null;
    }

    /**
     * Resolve a narrative thread
     * @private
     */
    async _resolveThread(thread) {
        thread.status = 'resolved';
        thread.endTime = Date.now();
        
        // Create story summary
        const story = {
            id: thread.id,
            type: thread.type,
            participants: thread.participants,
            duration: thread.endTime - thread.startTime,
            events: thread.events.map(e => e.id),
            peakTension: Math.max(...thread.events.map(e => e.importance || 0)),
            theme: thread.arc.themes[0],
            resolution: this._determineResolution(thread)
        };
        
        this.completedStories.push(story);
        this.activeThreads.delete(thread.id);
        
        // Update narrative graph
        this._updateNarrativeGraph(story);
    }

    /**
     * Helper methods
     * @private
     */
    _generateTitle(npc) {
        const titles = [
            `The Tale of ${npc.name}`,
            `${npc.name}'s Journey`,
            `Chronicles of ${npc.name}`,
            `The ${npc.role}'s Story`
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    _selectTheme(npc) {
        const themes = ['growth', 'discovery', 'redemption', 'love', 'ambition'];
        return themes[Math.floor(Math.random() * themes.length)];
    }

    _generateSetupScenes(npc, goals, relationships) {
        return [
            {
                type: 'introduction',
                description: `Introduce ${npc.name}, the ${npc.role}`
            },
            {
                type: 'goal_establishment',
                description: `${npc.name} desires to ${goals[0]?.description || 'find purpose'}`
            }
        ];
    }

    _generateConflictScenes(npc, goals, relationships) {
        return [
            {
                type: 'obstacle',
                description: `Challenges arise in pursuit of goals`
            },
            {
                type: 'relationship_test',
                description: `Relationships are tested`
            }
        ];
    }

    _generateResolutionScenes(npc, goals) {
        return [
            {
                type: 'climax',
                description: `The moment of truth arrives`
            },
            {
                type: 'resolution',
                description: `${npc.name} finds their path`
            }
        ];
    }

    _hasActiveArc(type, participants) {
        for (const thread of this.activeThreads.values()) {
            if (thread.type === type && 
                thread.participants.sort().join() === participants.sort().join()) {
                return true;
            }
        }
        return false;
    }

    _hasKnowledgeGap(npc1, npc2) {
        // Simplified check - would use actual skill/knowledge data
        return Math.random() > 0.5;
    }

    _moreSkilledNPC(npc1, npc2) {
        // Simplified - would compare actual skills
        return Math.random() > 0.5 ? npc1 : npc2;
    }

    _generateSetupEvents(thread) {
        return [{
            id: `setup_${thread.id}`,
            type: 'narrative_start',
            title: `The Beginning of ${thread.type}`,
            participants: thread.participants,
            timestamp: Date.now()
        }];
    }

    _eventAdvancesArc(event, currentBeat, nextBeat) {
        // Simplified progression check
        return event.importance > 0.5;
    }

    _determineResolution(thread) {
        const lastEvent = thread.events[thread.events.length - 1];
        return lastEvent?.title || 'Resolution achieved';
    }

    _updateNarrativeGraph(story) {
        // Connect related stories
        for (const participant of story.participants) {
            if (!this.narrativeGraph.has(participant)) {
                this.narrativeGraph.set(participant, []);
            }
            this.narrativeGraph.get(participant).push(story.id);
        }
    }

    _cleanupThreads() {
        const now = Date.now();
        const maxAge = this.config.arcDuration * 2;
        
        for (const [id, thread] of this.activeThreads) {
            if (now - thread.startTime > maxAge) {
                this._resolveThread(thread);
            }
        }
    }

    _calculateEmotionalIntensity(event) {
        return event.importance || 0.5;
    }

    _dominantEmotion(event) {
        return event.interaction?.emotion || 'neutral';
    }

    _assessGoalImpact(source, target, event) {
        return {
            significant: Math.random() > 0.7,
            goal: 'example_goal',
            type: 'progress'
        };
    }

    _detectEventPattern(participants) {
        if (Math.random() > 0.9) {
            return {
                type: 'repeating_cycle',
                participants
            };
        }
        return null;
    }

    /**
     * Serialize story weaver state
     */
    serialize() {
        return {
            activeThreads: Array.from(this.activeThreads.values()),
            completedStories: this.completedStories.slice(-100),
            narrativeGraph: Object.fromEntries(this.narrativeGraph)
        };
    }

    /**
     * Deserialize story weaver state
     */
    deserialize(data) {
        if (data.activeThreads) {
            this.activeThreads.clear();
            for (const thread of data.activeThreads) {
                this.activeThreads.set(thread.id, thread);
            }
        }
        
        if (data.completedStories) {
            this.completedStories = data.completedStories;
        }
        
        if (data.narrativeGraph) {
            this.narrativeGraph = new Map(Object.entries(data.narrativeGraph));
        }
    }
}
