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
 * EventMemory - Tracks and manages significant events for narrative generation
 * 
 * Maintains a structured history of important events that can be used
 * to generate stories, detect patterns, and create narrative arcs.
 * 
 * @class EventMemory
 */
export class EventMemory {
    constructor(config = {}) {
        this.config = {
            maxEvents: 1000,
            significanceThreshold: 0.3,
            patternWindowSize: 20,
            clusteringThreshold: 0.6,
            ...config
        };

        // Event storage
        this.events = new Map();
        this.eventsByType = new Map();
        this.eventsByParticipant = new Map();
        this.eventTimeline = [];

        // Pattern detection
        this.patterns = new Map();
        this.eventClusters = [];

        // Statistics
        this.stats = {
            totalEvents: 0,
            significantEvents: 0,
            patternsDetected: 0
        };
    }

    /**
     * Record a new event
     * 
     * @param {Object} event - Event to record
     * @returns {string} Event ID
     */
    record(event) {
        // Ensure event has required fields
        if (!event.id) {
            event.id = this._generateEventId();
        }
        if (!event.timestamp) {
            event.timestamp = Date.now();
        }

        // Calculate significance if not provided
        if (event.importance === undefined) {
            event.importance = this._calculateImportance(event);
        }

        // Only record significant events
        if (event.importance < this.config.significanceThreshold) {
            return null;
        }

        // Store event
        this.events.set(event.id, event);

        // Index by type
        if (event.type) {
            if (!this.eventsByType.has(event.type)) {
                this.eventsByType.set(event.type, []);
            }
            this.eventsByType.get(event.type).push(event.id);
        }

        // Index by participants
        if (event.participants) {
            for (const participant of event.participants) {
                if (!this.eventsByParticipant.has(participant)) {
                    this.eventsByParticipant.set(participant, []);
                }
                this.eventsByParticipant.get(participant).push(event.id);
            }
        }

        // Add to timeline
        this._insertIntoTimeline(event);

        // Update patterns
        this._updatePatterns(event);

        // Cluster events
        this._clusterEvent(event);

        // Update statistics
        this.stats.totalEvents++;
        if (event.importance >= this.config.significanceThreshold) {
            this.stats.significantEvents++;
        }

        // Prune if necessary
        if (this.events.size > this.config.maxEvents) {
            this._pruneOldEvents();
        }

        return event.id;
    }

    /**
     * Query events by various criteria
     * 
     * @param {Object} query - Query parameters
     * @returns {Array} Matching events
     */
    query(query = {}) {
        let results = [];

        // Query by type
        if (query.type) {
            const eventIds = this.eventsByType.get(query.type) || [];
            results = eventIds.map(id => this.events.get(id));
        }
        // Query by participant
        else if (query.participant) {
            const eventIds = this.eventsByParticipant.get(query.participant) || [];
            results = eventIds.map(id => this.events.get(id));
        }
        // Query by time range
        else if (query.startTime || query.endTime) {
            results = this._queryByTimeRange(query.startTime, query.endTime);
        }
        // Get all events
        else {
            results = Array.from(this.events.values());
        }

        // Apply additional filters
        if (query.minImportance) {
            results = results.filter(e => e.importance >= query.minImportance);
        }

        if (query.hasParticipant) {
            results = results.filter(e => 
                e.participants && e.participants.includes(query.hasParticipant)
            );
        }

        if (query.excludeType) {
            results = results.filter(e => e.type !== query.excludeType);
        }

        // Sort results
        if (query.sortBy === 'importance') {
            results.sort((a, b) => b.importance - a.importance);
        } else if (query.sortBy === 'recent') {
            results.sort((a, b) => b.timestamp - a.timestamp);
        }

        // Limit results
        if (query.limit) {
            results = results.slice(0, query.limit);
        }

        return results;
    }

    /**
     * Find patterns in events
     * 
     * @param {Array} participants - Filter by participants (optional)
     * @returns {Array} Detected patterns
     */
    findPatterns(participants) {
        const patterns = [];

        // Get relevant events
        let events;
        if (participants && participants.length > 0) {
            events = this._getEventsForParticipants(participants);
        } else {
            events = this.eventTimeline.slice(-this.config.patternWindowSize);
        }

        // Sequence patterns
        const sequences = this._findSequencePatterns(events);
        patterns.push(...sequences);

        // Cyclical patterns
        const cycles = this._findCyclicalPatterns(events);
        patterns.push(...cycles);

        // Causal patterns
        const causal = this._findCausalPatterns(events);
        patterns.push(...causal);

        // Emotional patterns
        const emotional = this._findEmotionalPatterns(events);
        patterns.push(...emotional);

        return patterns;
    }

    /**
     * Get event clusters
     * 
     * @returns {Array} Event clusters
     */
    getClusters() {
        return this.eventClusters.map(cluster => ({
            id: cluster.id,
            theme: cluster.theme,
            events: cluster.events.map(id => this.events.get(id)),
            significance: cluster.significance,
            timespan: cluster.timespan
        }));
    }

    /**
     * Get narrative threads
     * 
     * @param {Array} participants - Participants to focus on
     * @returns {Array} Narrative threads
     */
    getNarrativeThreads(participants) {
        const threads = [];

        // Get events for participants
        const events = this._getEventsForParticipants(participants);
        
        // Group by continuity
        const groups = this._groupByContinuity(events);

        for (const group of groups) {
            const thread = {
                id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                events: group,
                participants: this._extractParticipants(group),
                theme: this._identifyTheme(group),
                arc: this._identifyArc(group),
                tension: this._calculateTension(group)
            };

            threads.push(thread);
        }

        return threads;
    }

    /**
     * Calculate event importance
     * @private
     */
    _calculateImportance(event) {
        let importance = 0.3; // Base importance

        // Type-based importance
        const typeWeights = {
            interaction: 0.4,
            conflict: 0.7,
            achievement: 0.8,
            loss: 0.8,
            discovery: 0.6,
            transformation: 0.9
        };

        if (event.type && typeWeights[event.type]) {
            importance = typeWeights[event.type];
        }

        // Emotional intensity adds importance
        if (event.emotionalIntensity) {
            importance += event.emotionalIntensity * 0.2;
        }

        // Multiple participants increase importance
        if (event.participants && event.participants.length > 2) {
            importance += 0.1 * (event.participants.length - 2);
        }

        // Relationship changes are important
        if (event.relationshipChanges) {
            importance += 0.2;
        }

        return Math.min(1.0, importance);
    }

    /**
     * Insert event into timeline maintaining order
     * @private
     */
    _insertIntoTimeline(event) {
        // Binary search for insertion point
        let left = 0;
        let right = this.eventTimeline.length;

        while (left < right) {
            const mid = Math.floor((left + right) / 2);
            if (this.eventTimeline[mid].timestamp > event.timestamp) {
                right = mid;
            } else {
                left = mid + 1;
            }
        }

        this.eventTimeline.splice(left, 0, event);
    }

    /**
     * Update pattern detection with new event
     * @private
     */
    _updatePatterns(event) {
        // Get recent events
        const recentEvents = this.eventTimeline.slice(-this.config.patternWindowSize);
        
        // Check for emerging patterns
        const newPatterns = this._detectNewPatterns(event, recentEvents);
        
        for (const pattern of newPatterns) {
            this.patterns.set(pattern.id, pattern);
            this.stats.patternsDetected++;
        }
    }

    /**
     * Detect new patterns
     * @private
     */
    _detectNewPatterns(newEvent, recentEvents) {
        const patterns = [];

        // Check for repetition
        const repetitions = recentEvents.filter(e => 
            e.type === newEvent.type &&
            this._eventsAreSimilar(e, newEvent)
        );

        if (repetitions.length >= 2) {
            patterns.push({
                id: `pattern_${Date.now()}`,
                type: 'repetition',
                eventType: newEvent.type,
                frequency: repetitions.length + 1,
                instances: [...repetitions.map(e => e.id), newEvent.id]
            });
        }

        // Check for cause-effect
        const previous = recentEvents[recentEvents.length - 2];
        if (previous && this._checkCausality(previous, newEvent)) {
            patterns.push({
                id: `pattern_${Date.now()}`,
                type: 'causal',
                cause: previous.type,
                effect: newEvent.type,
                instances: [previous.id, newEvent.id]
            });
        }

        return patterns;
    }

    /**
     * Cluster similar events
     * @private
     */
    _clusterEvent(event) {
        // Find best matching cluster
        let bestCluster = null;
        let bestSimilarity = 0;

        for (const cluster of this.eventClusters) {
            const similarity = this._calculateClusterSimilarity(event, cluster);
            if (similarity > bestSimilarity && similarity > this.config.clusteringThreshold) {
                bestSimilarity = similarity;
                bestCluster = cluster;
            }
        }

        if (bestCluster) {
            // Add to existing cluster
            bestCluster.events.push(event.id);
            this._updateClusterProperties(bestCluster);
        } else {
            // Create new cluster
            const newCluster = {
                id: `cluster_${Date.now()}`,
                events: [event.id],
                theme: this._extractTheme(event),
                significance: event.importance,
                timespan: { start: event.timestamp, end: event.timestamp }
            };
            this.eventClusters.push(newCluster);
        }
    }

    /**
     * Calculate similarity between event and cluster
     * @private
     */
    _calculateClusterSimilarity(event, cluster) {
        const clusterEvents = cluster.events.map(id => this.events.get(id));
        
        let totalSimilarity = 0;
        for (const clusterEvent of clusterEvents) {
            totalSimilarity += this._eventSimilarity(event, clusterEvent);
        }

        return totalSimilarity / clusterEvents.length;
    }

    /**
     * Calculate similarity between two events
     * @private
     */
    _eventSimilarity(event1, event2) {
        let similarity = 0;

        // Type similarity
        if (event1.type === event2.type) {
            similarity += 0.3;
        }

        // Participant overlap
        if (event1.participants && event2.participants) {
            const overlap = event1.participants.filter(p => 
                event2.participants.includes(p)
            ).length;
            const total = new Set([...event1.participants, ...event2.participants]).size;
            similarity += 0.3 * (overlap / total);
        }

        // Temporal proximity
        const timeDiff = Math.abs(event1.timestamp - event2.timestamp);
        const dayInMs = 24 * 60 * 60 * 1000;
        if (timeDiff < dayInMs) {
            similarity += 0.2 * (1 - timeDiff / dayInMs);
        }

        // Emotional similarity
        if (event1.emotion && event2.emotion) {
            if (event1.emotion === event2.emotion) {
                similarity += 0.2;
            }
        }

        return similarity;
    }

    /**
     * Update cluster properties
     * @private
     */
    _updateClusterProperties(cluster) {
        const events = cluster.events.map(id => this.events.get(id));
        
        // Update timespan
        cluster.timespan.start = Math.min(...events.map(e => e.timestamp));
        cluster.timespan.end = Math.max(...events.map(e => e.timestamp));

        // Update significance
        cluster.significance = events.reduce((sum, e) => sum + e.importance, 0) / events.length;

        // Update theme
        cluster.theme = this._extractCommonTheme(events);
    }

    /**
     * Query events by time range
     * @private
     */
    _queryByTimeRange(startTime, endTime) {
        const start = startTime || 0;
        const end = endTime || Date.now();

        return this.eventTimeline.filter(e => 
            e.timestamp >= start && e.timestamp <= end
        );
    }

    /**
     * Get events for specific participants
     * @private
     */
    _getEventsForParticipants(participants) {
        const eventIds = new Set();

        for (const participant of participants) {
            const participantEvents = this.eventsByParticipant.get(participant) || [];
            participantEvents.forEach(id => eventIds.add(id));
        }

        return Array.from(eventIds).map(id => this.events.get(id))
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Find sequence patterns
     * @private
     */
    _findSequencePatterns(events) {
        const patterns = [];
        const sequences = new Map();

        // Look for repeated sequences
        for (let i = 0; i < events.length - 2; i++) {
            const sequence = [
                events[i].type,
                events[i + 1].type,
                events[i + 2].type
            ].join('-');

            if (!sequences.has(sequence)) {
                sequences.set(sequence, []);
            }
            sequences.get(sequence).push(i);
        }

        // Identify repeated sequences
        for (const [sequence, indices] of sequences) {
            if (indices.length >= 2) {
                patterns.push({
                    type: 'sequence',
                    pattern: sequence,
                    occurrences: indices.length,
                    events: indices.map(i => [
                        events[i].id,
                        events[i + 1].id,
                        events[i + 2].id
                    ])
                });
            }
        }

        return patterns;
    }

    /**
     * Find cyclical patterns
     * @private
     */
    _findCyclicalPatterns(events) {
        const patterns = [];
        
        // Look for cycles of different lengths
        for (let cycleLength = 2; cycleLength <= 5; cycleLength++) {
            const cycles = this._detectCycles(events, cycleLength);
            patterns.push(...cycles);
        }

        return patterns;
    }

    /**
     * Detect cycles of specific length
     * @private
     */
    _detectCycles(events, length) {
        const cycles = [];
        
        for (let i = 0; i < events.length - length * 2; i++) {
            let isCycle = true;
            
            // Check if pattern repeats
            for (let j = 0; j < length; j++) {
                if (events[i + j].type !== events[i + j + length].type) {
                    isCycle = false;
                    break;
                }
            }

            if (isCycle) {
                cycles.push({
                    type: 'cycle',
                    length,
                    pattern: events.slice(i, i + length).map(e => e.type),
                    events: events.slice(i, i + length * 2).map(e => e.id)
                });
            }
        }

        return cycles;
    }

    /**
     * Find causal patterns
     * @private
     */
    _findCausalPatterns(events) {
        const patterns = [];
        const causalPairs = new Map();

        // Look for cause-effect pairs
        for (let i = 0; i < events.length - 1; i++) {
            const cause = events[i];
            const effect = events[i + 1];

            if (this._checkCausality(cause, effect)) {
                const pairKey = `${cause.type}->${effect.type}`;
                
                if (!causalPairs.has(pairKey)) {
                    causalPairs.set(pairKey, []);
                }
                causalPairs.get(pairKey).push([cause.id, effect.id]);
            }
        }

        // Create patterns from repeated causal pairs
        for (const [pairKey, instances] of causalPairs) {
            if (instances.length >= 2) {
                const [causeType, effectType] = pairKey.split('->');
                patterns.push({
                    type: 'causal',
                    cause: causeType,
                    effect: effectType,
                    strength: instances.length / events.length,
                    instances
                });
            }
        }

        return patterns;
    }

    /**
     * Find emotional patterns
     * @private
     */
    _findEmotionalPatterns(events) {
        const patterns = [];
        const emotionalEvents = events.filter(e => e.emotion || e.emotionalImpact);

        if (emotionalEvents.length < 3) return patterns;

        // Emotional escalation
        const escalations = this._findEmotionalEscalations(emotionalEvents);
        patterns.push(...escalations);

        // Emotional cycles
        const emotionalCycles = this._findEmotionalCycles(emotionalEvents);
        patterns.push(...emotionalCycles);

        return patterns;
    }

    /**
     * Find emotional escalation patterns
     * @private
     */
    _findEmotionalEscalations(events) {
        const escalations = [];

        for (let i = 0; i < events.length - 2; i++) {
            const intensities = [
                this._getEmotionalIntensity(events[i]),
                this._getEmotionalIntensity(events[i + 1]),
                this._getEmotionalIntensity(events[i + 2])
            ];

            // Check for escalation
            if (intensities[1] > intensities[0] && intensities[2] > intensities[1]) {
                escalations.push({
                    type: 'emotional_escalation',
                    events: [events[i].id, events[i + 1].id, events[i + 2].id],
                    startIntensity: intensities[0],
                    peakIntensity: intensities[2]
                });
            }
        }

        return escalations;
    }

    /**
     * Find emotional cycle patterns
     * @private
     */
    _findEmotionalCycles(events) {
        // Simplified - would track actual emotional states
        return [];
    }

    /**
     * Helper methods
     * @private
     */
    _generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    _eventsAreSimilar(event1, event2) {
        return this._eventSimilarity(event1, event2) > 0.7;
    }

    _checkCausality(cause, effect) {
        // Simplified causality check
        const causalRelations = {
            'help': ['gratitude', 'trust_increase'],
            'conflict': ['anger', 'relationship_damage'],
            'achievement': ['celebration', 'pride'],
            'loss': ['grief', 'seeking_comfort']
        };

        return causalRelations[cause.type]?.includes(effect.type) || false;
    }

    _extractTheme(event) {
        // Simplified theme extraction
        const themes = {
            conflict: 'struggle',
            help: 'cooperation',
            achievement: 'growth',
            loss: 'adversity',
            discovery: 'exploration'
        };

        return themes[event.type] || 'journey';
    }

    _extractCommonTheme(events) {
        const themes = events.map(e => this._extractTheme(e));
        
        // Find most common theme
        const themeCounts = {};
        for (const theme of themes) {
            themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        }

        return Object.entries(themeCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    _getEmotionalIntensity(event) {
        return event.emotionalIntensity || 
               event.emotionalImpact || 
               (event.importance * 0.5);
    }

    _groupByContinuity(events) {
        const groups = [];
        let currentGroup = [];

        for (let i = 0; i < events.length; i++) {
            currentGroup.push(events[i]);

            // Check for discontinuity
            if (i < events.length - 1) {
                const timeDiff = events[i + 1].timestamp - events[i].timestamp;
                const dayInMs = 24 * 60 * 60 * 1000;

                if (timeDiff > dayInMs * 7) { // Week gap
                    groups.push(currentGroup);
                    currentGroup = [];
                }
            }
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups;
    }

    _extractParticipants(events) {
        const participants = new Set();
        
        for (const event of events) {
            if (event.participants) {
                event.participants.forEach(p => participants.add(p));
            }
        }

        return Array.from(participants);
    }

    _identifyTheme(events) {
        return this._extractCommonTheme(events);
    }

    _identifyArc(events) {
        if (events.length < 3) return 'fragment';

        // Simple arc identification
        const startIntensity = events[0].importance;
        const peakIntensity = Math.max(...events.map(e => e.importance));
        const endIntensity = events[events.length - 1].importance;

        if (peakIntensity > startIntensity * 1.5 && endIntensity < peakIntensity * 0.7) {
            return 'rise_and_fall';
        } else if (endIntensity > startIntensity * 1.2) {
            return 'escalation';
        } else if (endIntensity < startIntensity * 0.8) {
            return 'decline';
        }

        return 'steady';
    }

    _calculateTension(events) {
        if (events.length === 0) return 0;

        const tensions = events.map(e => e.importance);
        return tensions.reduce((sum, t) => sum + t, 0) / tensions.length;
    }

    _pruneOldEvents() {
        // Remove least significant old events
        const sortedEvents = Array.from(this.events.values())
            .sort((a, b) => {
                // Prioritize by importance and recency
                const scoreA = a.importance + (1 / (Date.now() - a.timestamp + 1));
                const scoreB = b.importance + (1 / (Date.now() - b.timestamp + 1));
                return scoreA - scoreB;
            });

        const toRemove = sortedEvents.slice(0, this.events.size - this.config.maxEvents);

        for (const event of toRemove) {
            this._removeEvent(event.id);
        }
    }

    _removeEvent(eventId) {
        const event = this.events.get(eventId);
        if (!event) return;

        // Remove from main storage
        this.events.delete(eventId);

        // Remove from indices
        if (event.type) {
            const typeEvents = this.eventsByType.get(event.type);
            if (typeEvents) {
                const index = typeEvents.indexOf(eventId);
                if (index > -1) typeEvents.splice(index, 1);
            }
        }

        if (event.participants) {
            for (const participant of event.participants) {
                const participantEvents = this.eventsByParticipant.get(participant);
                if (participantEvents) {
                    const index = participantEvents.indexOf(eventId);
                    if (index > -1) participantEvents.splice(index, 1);
                }
            }
        }

        // Remove from timeline
        const timelineIndex = this.eventTimeline.findIndex(e => e.id === eventId);
        if (timelineIndex > -1) {
            this.eventTimeline.splice(timelineIndex, 1);
        }
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            eventTypes: Array.from(this.eventsByType.keys()),
            participants: Array.from(this.eventsByParticipant.keys()),
            clusters: this.eventClusters.length,
            patterns: this.patterns.size
        };
    }
}
