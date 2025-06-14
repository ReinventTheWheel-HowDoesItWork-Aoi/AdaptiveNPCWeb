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
 * EmergenceEngine - Generates unexpected but logical behaviors
 * 
 * Creates emergent behaviors from the interaction of simple rules,
 * memories, emotions, and personality traits.
 * 
 * @class EmergenceEngine
 */
export class EmergenceEngine {
    constructor(config = {}) {
        this.config = {
            emergenceThreshold: 0.7,        // Threshold for emergent behavior
            complexityLevel: 0.8,           // How complex behaviors can be
            creativityFactor: 0.6,          // How creative/unusual behaviors can be
            ruleInteractionDepth: 3,        // How many rules can interact
            emergenceCheckInterval: 1000,   // How often to check (ms)
            ...config
        };

        // Behavior rules and patterns
        this.behaviorRules = this._defineBehaviorRules();
        this.emergentPatterns = new Map();
        
        // Emergence history
        this.emergenceHistory = [];
        this.activeEmergences = new Map();
        
        // Pattern recognition
        this.patternBuffer = [];
        this.patternBufferSize = 50;
    }

    /**
     * Check for emergent behaviors
     * 
     * @param {Object} state - NPC's current state
     * @param {Object} memoryBank - NPC's memories
     * @param {Object} personality - NPC's personality
     * @returns {Array} Array of emergent behaviors
     */
    async checkEmergence(state, memoryBank, personality) {
        const emergentBehaviors = [];
        
        // Collect current context
        const context = this._buildContext(state, memoryBank, personality);
        
        // Check rule interactions
        const ruleActivations = this._evaluateRules(context);
        
        // Detect emergent patterns
        const patterns = this._detectPatterns(ruleActivations, context);
        
        // Generate emergent behaviors
        for (const pattern of patterns) {
            if (pattern.strength > this.config.emergenceThreshold) {
                const behavior = await this._generateEmergentBehavior(pattern, context);
                if (behavior) {
                    emergentBehaviors.push(behavior);
                }
            }
        }
        
        // Check for meta-emergences (emergences from emergences)
        const metaEmergences = this._checkMetaEmergence(emergentBehaviors, context);
        emergentBehaviors.push(...metaEmergences);
        
        // Update history
        this._updateEmergenceHistory(emergentBehaviors);
        
        return emergentBehaviors;
    }

    /**
     * Define behavior rules
     * @private
     */
    _defineBehaviorRules() {
        return [
            // Basic survival rules
            {
                id: 'self_preservation',
                condition: (ctx) => ctx.state.awareness < 0.3 || ctx.threat > 0.5,
                weight: 0.9,
                outcomes: ['flee', 'hide', 'defend']
            },
            {
                id: 'resource_seeking',
                condition: (ctx) => ctx.needs.energy < 0.3 || ctx.needs.social < 0.3,
                weight: 0.7,
                outcomes: ['search', 'ask_for_help', 'trade']
            },
            
            // Social rules
            {
                id: 'reciprocity',
                condition: (ctx) => ctx.recentKindness > 0.5,
                weight: 0.8,
                outcomes: ['return_favor', 'express_gratitude', 'strengthen_bond']
            },
            {
                id: 'social_mirroring',
                condition: (ctx) => ctx.socialContext && ctx.personality.agreeableness > 0.6,
                weight: 0.6,
                outcomes: ['mirror_emotion', 'align_behavior', 'show_empathy']
            },
            
            // Emotional rules
            {
                id: 'emotional_regulation',
                condition: (ctx) => Math.abs(ctx.emotionalExtreme) > 0.8,
                weight: 0.7,
                outcomes: ['seek_comfort', 'isolate', 'express_emotion']
            },
            {
                id: 'mood_congruent_behavior',
                condition: (ctx) => ctx.mood !== 'neutral',
                weight: 0.5,
                outcomes: ['act_on_mood', 'seek_mood_change', 'spread_mood']
            },
            
            // Cognitive rules
            {
                id: 'curiosity_driven',
                condition: (ctx) => ctx.personality.curiosity > 0.7 && ctx.novelty > 0.5,
                weight: 0.6,
                outcomes: ['investigate', 'ask_questions', 'experiment']
            },
            {
                id: 'pattern_completion',
                condition: (ctx) => ctx.incompletePattern,
                weight: 0.7,
                outcomes: ['complete_pattern', 'break_pattern', 'create_variation']
            },
            
            // Goal-oriented rules
            {
                id: 'goal_pursuit',
                condition: (ctx) => ctx.activeGoal && ctx.goalProgress < 0.8,
                weight: 0.8,
                outcomes: ['take_action', 'plan_steps', 'seek_resources']
            },
            {
                id: 'goal_conflict_resolution',
                condition: (ctx) => ctx.conflictingGoals > 1,
                weight: 0.6,
                outcomes: ['prioritize', 'compromise', 'abandon_goal']
            },
            
            // Memory-based rules
            {
                id: 'learned_behavior',
                condition: (ctx) => ctx.similarPastSituation && ctx.pastOutcome === 'positive',
                weight: 0.7,
                outcomes: ['repeat_success', 'adapt_strategy', 'teach_others']
            },
            {
                id: 'trauma_avoidance',
                condition: (ctx) => ctx.traumaticMemoryTriggered,
                weight: 0.9,
                outcomes: ['avoid', 'freeze', 'seek_safety']
            },
            
            // Creative rules
            {
                id: 'creative_expression',
                condition: (ctx) => ctx.personality.creativity > 0.7 && ctx.emotionalEnergy > 0.5,
                weight: 0.5,
                outcomes: ['create_something', 'innovate', 'combine_ideas']
            },
            {
                id: 'playful_behavior',
                condition: (ctx) => ctx.mood === 'joyful' && ctx.socialContext,
                weight: 0.4,
                outcomes: ['play', 'joke', 'surprise_others']
            }
        ];
    }

    /**
     * Build context from state
     * @private
     */
    _buildContext(state, memoryBank, personality) {
        const context = {
            state,
            personality,
            timestamp: Date.now()
        };
        
        // Analyze current needs
        context.needs = this._analyzeNeeds(state);
        
        // Check for threats
        context.threat = this._assessThreat(state);
        
        // Emotional extremes
        context.emotionalExtreme = this._findEmotionalExtreme(state);
        
        // Current mood
        context.mood = state.emotionalContext?.currentMood || 'neutral';
        
        // Social context
        context.socialContext = this._analyzeSocialContext(state);
        
        // Recent experiences
        context.recentKindness = this._checkRecentKindness(memoryBank);
        context.novelty = this._assessNovelty(state, memoryBank);
        
        // Goals
        context.activeGoal = state.goals?.[0];
        context.goalProgress = context.activeGoal?.progress || 0;
        context.conflictingGoals = this._countConflictingGoals(state.goals);
        
        // Memory patterns
        context.similarPastSituation = this._findSimilarSituation(state, memoryBank);
        context.pastOutcome = context.similarPastSituation?.outcome;
        context.traumaticMemoryTriggered = this._checkTraumaticTrigger(state, memoryBank);
        
        // Pattern detection
        context.incompletePattern = this._detectIncompletePattern();
        
        // Emotional energy
        context.emotionalEnergy = this._calculateEmotionalEnergy(state);
        
        return context;
    }

    /**
     * Evaluate rules against context
     * @private
     */
    _evaluateRules(context) {
        const activations = [];
        
        for (const rule of this.behaviorRules) {
            try {
                if (rule.condition(context)) {
                    activations.push({
                        rule,
                        strength: rule.weight,
                        context: { ...context },
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                // Rule evaluation failed, skip
                console.warn(`Rule ${rule.id} evaluation failed:`, error);
            }
        }
        
        return activations;
    }

    /**
     * Detect emergent patterns from rule activations
     * @private
     */
    _detectPatterns(activations, context) {
        const patterns = [];
        
        // Single rule patterns
        for (const activation of activations) {
            patterns.push({
                type: 'single',
                rules: [activation.rule.id],
                strength: activation.strength,
                outcomes: activation.rule.outcomes,
                context
            });
        }
        
        // Rule interaction patterns (2-way)
        for (let i = 0; i < activations.length; i++) {
            for (let j = i + 1; j < activations.length; j++) {
                const interaction = this._analyzeRuleInteraction(
                    activations[i],
                    activations[j]
                );
                
                if (interaction) {
                    patterns.push({
                        type: 'interaction',
                        rules: [activations[i].rule.id, activations[j].rule.id],
                        strength: interaction.strength,
                        outcomes: interaction.outcomes,
                        context
                    });
                }
            }
        }
        
        // Complex patterns (3+ rules)
        if (this.config.ruleInteractionDepth >= 3) {
            const complexPatterns = this._detectComplexPatterns(activations, context);
            patterns.push(...complexPatterns);
        }
        
        // Novel patterns (not seen before)
        const novelPatterns = this._detectNovelPatterns(patterns);
        patterns.push(...novelPatterns);
        
        return patterns;
    }

    /**
     * Analyze interaction between two rules
     * @private
     */
    _analyzeRuleInteraction(activation1, activation2) {
        const rule1 = activation1.rule;
        const rule2 = activation2.rule;
        
        // Check for synergy
        const synergies = {
            'curiosity_driven+creative_expression': {
                strength: 0.9,
                outcomes: ['innovative_exploration', 'creative_discovery']
            },
            'emotional_regulation+social_mirroring': {
                strength: 0.8,
                outcomes: ['empathetic_support', 'emotional_contagion']
            },
            'goal_pursuit+resource_seeking': {
                strength: 0.85,
                outcomes: ['strategic_acquisition', 'collaborative_achievement']
            },
            'learned_behavior+pattern_completion': {
                strength: 0.75,
                outcomes: ['optimized_behavior', 'habit_formation']
            }
        };
        
        const key1 = `${rule1.id}+${rule2.id}`;
        const key2 = `${rule2.id}+${rule1.id}`;
        
        return synergies[key1] || synergies[key2] || null;
    }

    /**
     * Detect complex patterns involving multiple rules
     * @private
     */
    _detectComplexPatterns(activations, context) {
        const patterns = [];
        
        // Look for rule chains
        const chains = this._findRuleChains(activations);
        
        for (const chain of chains) {
            if (chain.length >= 3) {
                patterns.push({
                    type: 'complex',
                    rules: chain.map(a => a.rule.id),
                    strength: this._calculateChainStrength(chain),
                    outcomes: this._predictChainOutcomes(chain),
                    context
                });
            }
        }
        
        return patterns;
    }

    /**
     * Find chains of related rules
     * @private
     */
    _findRuleChains(activations) {
        const chains = [];
        const used = new Set();
        
        for (const start of activations) {
            if (used.has(start)) continue;
            
            const chain = [start];
            used.add(start);
            
            // Build chain
            let current = start;
            while (true) {
                const next = this._findNextInChain(current, activations, used);
                if (!next) break;
                
                chain.push(next);
                used.add(next);
                current = next;
            }
            
            if (chain.length > 1) {
                chains.push(chain);
            }
        }
        
        return chains;
    }

    /**
     * Find next rule in chain
     * @private
     */
    _findNextInChain(current, activations, used) {
        // Find rules whose outcomes match current rule's context
        for (const activation of activations) {
            if (used.has(activation)) continue;
            
            // Check if outcomes of current could trigger this rule
            const connected = this._rulesConnected(current.rule, activation.rule);
            if (connected) {
                return activation;
            }
        }
        
        return null;
    }

    /**
     * Check if two rules are connected
     * @private
     */
    _rulesConnected(rule1, rule2) {
        // Simplified connection check
        const connections = {
            'search': ['resource_seeking', 'curiosity_driven'],
            'express_emotion': ['emotional_regulation', 'social_mirroring'],
            'take_action': ['goal_pursuit', 'learned_behavior']
        };
        
        for (const outcome of rule1.outcomes) {
            if (connections[outcome]?.includes(rule2.id)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Calculate chain strength
     * @private
     */
    _calculateChainStrength(chain) {
        let strength = 1;
        for (const activation of chain) {
            strength *= activation.strength;
        }
        return Math.pow(strength, 1 / chain.length); // Geometric mean
    }

    /**
     * Predict outcomes from rule chain
     * @private
     */
    _predictChainOutcomes(chain) {
        const outcomes = new Set();
        
        // Collect all possible outcomes
        for (const activation of chain) {
            activation.rule.outcomes.forEach(o => outcomes.add(o));
        }
        
        // Add emergent outcomes based on chain
        if (chain.length >= 3) {
            outcomes.add('complex_behavior');
            
            if (chain.some(a => a.rule.id.includes('creative'))) {
                outcomes.add('novel_solution');
            }
            
            if (chain.some(a => a.rule.id.includes('social'))) {
                outcomes.add('social_innovation');
            }
        }
        
        return Array.from(outcomes);
    }

    /**
     * Detect novel patterns
     * @private
     */
    _detectNovelPatterns(patterns) {
        const novel = [];
        
        for (const pattern of patterns) {
            const patternKey = this._getPatternKey(pattern);
            
            if (!this.emergentPatterns.has(patternKey)) {
                // New pattern discovered!
                const novelPattern = {
                    ...pattern,
                    type: 'novel',
                    strength: pattern.strength * this.config.creativityFactor,
                    outcomes: [...pattern.outcomes, 'surprising_behavior']
                };
                
                novel.push(novelPattern);
                
                // Record for future reference
                this.emergentPatterns.set(patternKey, {
                    count: 1,
                    firstSeen: Date.now(),
                    pattern: novelPattern
                });
            } else {
                // Seen before, but still might be interesting
                const record = this.emergentPatterns.get(patternKey);
                record.count++;
                
                if (record.count % 10 === 0) {
                    // Milestone - pattern becoming habit
                    novel.push({
                        ...pattern,
                        type: 'habit_forming',
                        strength: pattern.strength * 0.8,
                        outcomes: [...pattern.outcomes, 'habit_formation']
                    });
                }
            }
        }
        
        return novel;
    }

    /**
     * Generate emergent behavior from pattern
     * @private
     */
    async _generateEmergentBehavior(pattern, context) {
        const behavior = {
            id: `emergence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'emergent',
            pattern: pattern.type,
            rules: pattern.rules,
            strength: pattern.strength,
            timestamp: Date.now()
        };
        
        // Select outcome based on pattern and context
        const outcome = this._selectOutcome(pattern.outcomes, context);
        behavior.action = outcome;
        
        // Add creativity if novel
        if (pattern.type === 'novel') {
            behavior.creative = true;
            behavior.novelty = Math.random() * this.config.creativityFactor;
        }
        
        // Add specific parameters based on outcome
        behavior.parameters = this._generateBehaviorParameters(outcome, context);
        
        // Predict consequences
        behavior.predictedConsequences = this._predictConsequences(behavior, context);
        
        // Check if behavior should be suppressed
        if (this._shouldSuppress(behavior, context)) {
            return null;
        }
        
        return behavior;
    }

    /**
     * Select outcome from possibilities
     * @private
     */
    _selectOutcome(outcomes, context) {
        // Weight outcomes by context
        const weighted = outcomes.map(outcome => ({
            outcome,
            weight: this._getOutcomeWeight(outcome, context)
        }));
        
        // Sort by weight
        weighted.sort((a, b) => b.weight - a.weight);
        
        // Sometimes choose less optimal for variety
        if (Math.random() < this.config.creativityFactor * 0.5) {
            const index = Math.floor(Math.random() * Math.min(3, weighted.length));
            return weighted[index].outcome;
        }
        
        return weighted[0].outcome;
    }

    /**
     * Get outcome weight based on context
     * @private
     */
    _getOutcomeWeight(outcome, context) {
        const weights = {
            // Survival outcomes
            'flee': context.threat * 2,
            'hide': context.threat * 1.5,
            'defend': context.threat * context.personality.courage,
            
            // Social outcomes
            'return_favor': context.recentKindness * context.personality.agreeableness,
            'express_gratitude': context.recentKindness * 1.2,
            'strengthen_bond': context.socialContext * 1.1,
            
            // Creative outcomes
            'create_something': context.personality.creativity * context.emotionalEnergy,
            'innovate': context.personality.creativity * context.novelty,
            'surprising_behavior': context.personality.openness * this.config.creativityFactor,
            
            // Default
            'default': 0.5
        };
        
        return weights[outcome] || weights.default;
    }

    /**
     * Generate behavior parameters
     * @private
     */
    _generateBehaviorParameters(outcome, context) {
        const params = {
            intensity: Math.random() * 0.5 + 0.5,
            duration: Math.random() * 5000 + 1000,
            target: null
        };
        
        // Outcome-specific parameters
        switch (outcome) {
            case 'flee':
                params.direction = Math.random() * Math.PI * 2;
                params.speed = 0.8 + context.threat * 0.2;
                break;
                
            case 'create_something':
                params.creationType = this._selectCreationType(context);
                params.inspiration = context.mood;
                break;
                
            case 'return_favor':
                params.target = context.lastHelper;
                params.favorType = this._selectFavorType(context);
                break;
                
            case 'surprising_behavior':
                params.surpriseType = this._generateSurprise(context);
                break;
        }
        
        return params;
    }

    /**
     * Check for meta-emergence
     * @private
     */
    _checkMetaEmergence(behaviors, context) {
        const metaBehaviors = [];
        
        // Check if behaviors themselves form patterns
        if (behaviors.length >= 2) {
            // Behavior combination
            for (let i = 0; i < behaviors.length; i++) {
                for (let j = i + 1; j < behaviors.length; j++) {
                    const combo = this._analyzeBehaviorCombination(
                        behaviors[i],
                        behaviors[j],
                        context
                    );
                    
                    if (combo) {
                        metaBehaviors.push(combo);
                    }
                }
            }
            
            // Behavior sequence
            if (behaviors.length >= 3) {
                const sequence = this._analyzeSequence(behaviors, context);
                if (sequence) {
                    metaBehaviors.push(sequence);
                }
            }
        }
        
        return metaBehaviors;
    }

    /**
     * Analyze combination of behaviors
     * @private
     */
    _analyzeBehaviorCombination(behavior1, behavior2, context) {
        // Check for interesting combinations
        const combinations = {
            'create_something+express_emotion': {
                action: 'artistic_expression',
                description: 'Express emotions through creation'
            },
            'play+surprising_behavior': {
                action: 'playful_prank',
                description: 'Surprise others playfully'
            },
            'investigate+ask_questions': {
                action: 'deep_inquiry',
                description: 'Pursue understanding deeply'
            }
        };
        
        const key = `${behavior1.action}+${behavior2.action}`;
        const combo = combinations[key];
        
        if (combo) {
            return {
                id: `meta_${Date.now()}`,
                type: 'meta_emergent',
                action: combo.action,
                description: combo.description,
                sourceBehaviors: [behavior1.id, behavior2.id],
                strength: (behavior1.strength + behavior2.strength) / 2
            };
        }
        
        return null;
    }

    /**
     * Helper methods for context analysis
     * @private
     */
    _analyzeNeeds(state) {
        return {
            energy: state.energy || 1,
            social: state.socialNeed || 0.5,
            safety: 1 - (state.threat || 0),
            growth: state.growthNeed || 0.5
        };
    }

    _assessThreat(state) {
        return state.threat || 0;
    }

    _findEmotionalExtreme(state) {
        if (!state.emotionalContext) return 0;
        
        let maxEmotion = 0;
        for (const value of Object.values(state.emotionalContext)) {
            if (typeof value === 'number') {
                maxEmotion = Math.max(maxEmotion, Math.abs(value));
            }
        }
        return maxEmotion;
    }

    _analyzeSocialContext(state) {
        return state.nearbyEntities?.length > 0 ? 1 : 0;
    }

    _checkRecentKindness(memoryBank) {
        // Simplified check
        return Math.random() > 0.5 ? 0.7 : 0;
    }

    _assessNovelty(state, memoryBank) {
        return Math.random(); // Simplified
    }

    _countConflictingGoals(goals) {
        if (!goals || goals.length < 2) return 0;
        return Math.floor(goals.length / 2);
    }

    _findSimilarSituation(state, memoryBank) {
        // Simplified - would search memory bank
        return Math.random() > 0.7 ? { outcome: 'positive' } : null;
    }

    _checkTraumaticTrigger(state, memoryBank) {
        return false; // Simplified
    }

    _detectIncompletePattern() {
        return Math.random() > 0.8;
    }

    _calculateEmotionalEnergy(state) {
        return state.emotionalEnergy || 0.5;
    }

    _getPatternKey(pattern) {
        return `${pattern.type}_${pattern.rules.sort().join('_')}`;
    }

    _predictConsequences(behavior, context) {
        return ['state_change', 'memory_formation'];
    }

    _shouldSuppress(behavior, context) {
        // Suppress dangerous or inappropriate behaviors
        if (behavior.action === 'flee' && !context.threat) return true;
        return false;
    }

    _selectCreationType(context) {
        const types = ['art', 'story', 'song', 'invention'];
        return types[Math.floor(Math.random() * types.length)];
    }

    _selectFavorType(context) {
        const types = ['gift', 'help', 'information', 'protection'];
        return types[Math.floor(Math.random() * types.length)];
    }

    _generateSurprise(context) {
        const surprises = ['dance', 'joke', 'magic_trick', 'unexpected_gift'];
        return surprises[Math.floor(Math.random() * surprises.length)];
    }

    _analyzeSequence(behaviors, context) {
        // Check if behaviors form a meaningful sequence
        if (behaviors.every(b => b.strength > 0.6)) {
            return {
                id: `sequence_${Date.now()}`,
                type: 'behavioral_sequence',
                action: 'complex_plan',
                steps: behaviors.map(b => b.action),
                strength: behaviors.reduce((sum, b) => sum + b.strength, 0) / behaviors.length
            };
        }
        return null;
    }

    /**
     * Update emergence history
     * @private
     */
    _updateEmergenceHistory(behaviors) {
        for (const behavior of behaviors) {
            this.emergenceHistory.push({
                behavior,
                timestamp: Date.now()
            });
            
            // Track active emergences
            this.activeEmergences.set(behavior.id, behavior);
        }
        
        // Limit history size
        if (this.emergenceHistory.length > 100) {
            this.emergenceHistory = this.emergenceHistory.slice(-100);
        }
        
        // Clean up old active emergences
        const now = Date.now();
        for (const [id, behavior] of this.activeEmergences) {
            if (now - behavior.timestamp > 60000) { // 1 minute
                this.activeEmergences.delete(id);
            }
        }
    }

    /**
     * Get emergence statistics
     */
    getStats() {
        const patternCounts = {};
        for (const [key, record] of this.emergentPatterns) {
            const type = key.split('_')[0];
            patternCounts[type] = (patternCounts[type] || 0) + record.count;
        }
        
        return {
            totalEmergences: this.emergenceHistory.length,
            activeEmergences: this.activeEmergences.size,
            uniquePatterns: this.emergentPatterns.size,
            patternCounts,
            recentEmergences: this.emergenceHistory.slice(-10).map(e => e.behavior.action)
        };
    }
}
