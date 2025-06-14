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
 * GoalSystem - Autonomous goal generation and management for NPCs
 * 
 * Creates, prioritizes, and tracks goals based on personality,
 * experiences, and environmental factors.
 * 
 * @class GoalSystem
 */
export class GoalSystem {
    constructor(config = {}) {
        this.config = {
            maxActiveGoals: 5,
            goalGenerationInterval: 60000, // 1 minute
            priorityDecayRate: 0.01,
            completionThreshold: 0.9,
            abandonmentThreshold: 0.1,
            ...config
        };

        // Goal storage
        this.goals = new Map();
        this.goalsByOwner = new Map();
        this.completedGoals = [];
        this.abandonedGoals = [];

        // Goal templates
        this.goalTemplates = this._defineGoalTemplates();
        
        // Goal generation rules
        this.generationRules = this._defineGenerationRules();

        // Statistics
        this.stats = {
            totalGenerated: 0,
            totalCompleted: 0,
            totalAbandoned: 0,
            averageCompletionTime: 0
        };
    }

    /**
     * Get active goals for an NPC
     * 
     * @param {string} npcId - NPC identifier
     * @returns {Array} Active goals
     */
    getActiveGoals(npcId) {
        const npcGoals = this.goalsByOwner.get(npcId) || [];
        return npcGoals
            .map(goalId => this.goals.get(goalId))
            .filter(goal => goal && goal.status === 'active')
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Generate goals for an NPC based on their state
     * 
     * @param {Object} npc - NPC data
     * @param {Object} context - Current context
     * @returns {Array} Generated goals
     */
    generateGoals(npc, context) {
        const generatedGoals = [];
        
        // Check existing goals
        const activeGoals = this.getActiveGoals(npc.id);
        if (activeGoals.length >= this.config.maxActiveGoals) {
            return generatedGoals;
        }

        // Evaluate generation rules
        for (const rule of this.generationRules) {
            if (this._evaluateRule(rule, npc, context)) {
                const goal = this._createGoalFromRule(rule, npc, context);
                if (goal && !this._hasSimilarGoal(npc.id, goal)) {
                    generatedGoals.push(goal);
                }
            }
        }

        // Generate personality-driven goals
        const personalityGoals = this._generatePersonalityGoals(npc, context);
        generatedGoals.push(...personalityGoals);

        // Generate reactive goals based on recent events
        const reactiveGoals = this._generateReactiveGoals(npc, context);
        generatedGoals.push(...reactiveGoals);

        // Register generated goals
        for (const goal of generatedGoals) {
            this._registerGoal(goal);
        }

        return generatedGoals;
    }

    /**
     * Update goal progress
     * 
     * @param {string} goalId - Goal identifier
     * @param {number} progress - Progress amount (0-1)
     * @param {Object} context - Update context
     */
    updateProgress(goalId, progress, context = {}) {
        const goal = this.goals.get(goalId);
        if (!goal || goal.status !== 'active') return;

        // Update progress
        goal.progress = Math.max(0, Math.min(1, progress));
        goal.lastUpdate = Date.now();

        // Record progress event
        goal.progressHistory.push({
            timestamp: Date.now(),
            progress: goal.progress,
            context
        });

        // Check completion
        if (goal.progress >= this.config.completionThreshold) {
            this._completeGoal(goal);
        }
        
        // Check for stagnation
        else if (this._isStagnant(goal)) {
            this._reassessGoal(goal);
        }
    }

    /**
     * Process goal decay and maintenance
     */
    processGoals() {
        const now = Date.now();

        for (const [goalId, goal] of this.goals) {
            if (goal.status !== 'active') continue;

            // Decay priority over time
            const age = now - goal.created;
            const decayFactor = Math.exp(-this.config.priorityDecayRate * age / 60000);
            goal.currentPriority = goal.basePriority * decayFactor;

            // Check for abandonment
            if (goal.currentPriority < this.config.abandonmentThreshold) {
                this._abandonGoal(goal, 'priority_decay');
            }

            // Check for timeout
            if (goal.deadline && now > goal.deadline) {
                this._abandonGoal(goal, 'timeout');
            }

            // Update motivation based on progress
            this._updateMotivation(goal);
        }
    }

    /**
     * Define goal templates
     * @private
     */
    _defineGoalTemplates() {
        return {
            // Survival goals
            find_safety: {
                type: 'survival',
                description: 'Find a safe place',
                basePriority: 0.9,
                conditions: ['threat', 'vulnerability']
            },
            acquire_resources: {
                type: 'survival',
                description: 'Gather necessary resources',
                basePriority: 0.8,
                conditions: ['scarcity', 'need']
            },

            // Social goals
            make_friend: {
                type: 'social',
                description: 'Form a new friendship',
                basePriority: 0.6,
                conditions: ['loneliness', 'social_opportunity']
            },
            resolve_conflict: {
                type: 'social',
                description: 'Resolve conflict with {target}',
                basePriority: 0.7,
                conditions: ['active_conflict']
            },
            strengthen_bond: {
                type: 'social',
                description: 'Deepen relationship with {target}',
                basePriority: 0.5,
                conditions: ['positive_relationship']
            },

            // Achievement goals
            master_skill: {
                type: 'achievement',
                description: 'Master {skill}',
                basePriority: 0.6,
                conditions: ['ambition', 'skill_gap']
            },
            complete_project: {
                type: 'achievement',
                description: 'Complete {project}',
                basePriority: 0.7,
                conditions: ['unfinished_work']
            },
            gain_recognition: {
                type: 'achievement',
                description: 'Gain recognition for accomplishments',
                basePriority: 0.5,
                conditions: ['unrecognized_achievement']
            },

            // Knowledge goals
            learn_secret: {
                type: 'knowledge',
                description: 'Discover the truth about {mystery}',
                basePriority: 0.6,
                conditions: ['curiosity', 'mystery_present']
            },
            explore_area: {
                type: 'knowledge',
                description: 'Explore {location}',
                basePriority: 0.5,
                conditions: ['unexplored_area', 'curiosity']
            },

            // Emotional goals
            find_happiness: {
                type: 'emotional',
                description: 'Find sources of joy',
                basePriority: 0.7,
                conditions: ['low_happiness']
            },
            overcome_fear: {
                type: 'emotional',
                description: 'Overcome fear of {source}',
                basePriority: 0.8,
                conditions: ['active_fear']
            },

            // Creative goals
            create_art: {
                type: 'creative',
                description: 'Create a {art_type}',
                basePriority: 0.5,
                conditions: ['creative_urge', 'inspiration']
            },
            innovate: {
                type: 'creative',
                description: 'Develop new {innovation}',
                basePriority: 0.6,
                conditions: ['problem_awareness', 'creativity']
            }
        };
    }

    /**
     * Define goal generation rules
     * @private
     */
    _defineGenerationRules() {
        return [
            {
                id: 'survival_instinct',
                trigger: (npc, ctx) => ctx.threat > 0.5 || npc.needs?.safety < 0.3,
                templates: ['find_safety', 'acquire_resources'],
                weight: 0.9
            },
            {
                id: 'social_need',
                trigger: (npc, ctx) => npc.needs?.social < 0.4 || ctx.loneliness > 0.6,
                templates: ['make_friend', 'strengthen_bond'],
                weight: 0.7
            },
            {
                id: 'conflict_resolution',
                trigger: (npc, ctx) => ctx.activeConflicts > 0,
                templates: ['resolve_conflict'],
                weight: 0.8
            },
            {
                id: 'achievement_drive',
                trigger: (npc, ctx) => npc.personality?.ambition > 0.7,
                templates: ['master_skill', 'complete_project', 'gain_recognition'],
                weight: 0.6
            },
            {
                id: 'curiosity_driven',
                trigger: (npc, ctx) => npc.personality?.curiosity > 0.7 && ctx.mysteries > 0,
                templates: ['learn_secret', 'explore_area'],
                weight: 0.5
            },
            {
                id: 'emotional_regulation',
                trigger: (npc, ctx) => npc.emotionalState?.happiness < 0.3,
                templates: ['find_happiness', 'overcome_fear'],
                weight: 0.7
            },
            {
                id: 'creative_expression',
                trigger: (npc, ctx) => npc.personality?.creativity > 0.7 && ctx.inspiration > 0.5,
                templates: ['create_art', 'innovate'],
                weight: 0.5
            }
        ];
    }

    /**
     * Evaluate if a rule should trigger
     * @private
     */
    _evaluateRule(rule, npc, context) {
        try {
            return rule.trigger(npc, context);
        } catch (error) {
            console.warn(`Rule evaluation failed for ${rule.id}:`, error);
            return false;
        }
    }

    /**
     * Create goal from rule
     * @private
     */
    _createGoalFromRule(rule, npc, context) {
        // Select appropriate template
        const templateId = this._selectTemplate(rule.templates, npc, context);
        const template = this.goalTemplates[templateId];
        
        if (!template) return null;

        // Create goal instance
        const goal = {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ownerId: npc.id,
            type: template.type,
            description: this._fillTemplate(template.description, context),
            basePriority: template.basePriority * rule.weight,
            currentPriority: template.basePriority * rule.weight,
            progress: 0,
            status: 'active',
            created: Date.now(),
            lastUpdate: Date.now(),
            source: rule.id,
            template: templateId,
            progressHistory: [],
            subgoals: [],
            dependencies: [],
            rewards: this._calculateRewards(template, npc),
            deadline: this._calculateDeadline(template, context)
        };

        // Add context-specific details
        this._enrichGoal(goal, npc, context);

        return goal;
    }

    /**
     * Select appropriate template based on context
     * @private
     */
    _selectTemplate(templates, npc, context) {
        // Weight templates by relevance
        const weighted = templates.map(templateId => {
            const template = this.goalTemplates[templateId];
            const relevance = this._calculateTemplateRelevance(template, npc, context);
            return { templateId, relevance };
        });

        // Sort by relevance
        weighted.sort((a, b) => b.relevance - a.relevance);

        // Sometimes choose less optimal for variety
        if (Math.random() < 0.2 && weighted.length > 1) {
            return weighted[1].templateId;
        }

        return weighted[0].templateId;
    }

    /**
     * Calculate template relevance
     * @private
     */
    _calculateTemplateRelevance(template, npc, context) {
        let relevance = 1.0;

        // Check conditions
        for (const condition of template.conditions) {
            if (!this._checkCondition(condition, npc, context)) {
                relevance *= 0.5;
            }
        }

        // Personality alignment
        if (template.type === 'social' && npc.personality?.extraversion) {
            relevance *= (0.5 + npc.personality.extraversion * 0.5);
        }
        if (template.type === 'achievement' && npc.personality?.ambition) {
            relevance *= (0.5 + npc.personality.ambition * 0.5);
        }
        if (template.type === 'creative' && npc.personality?.creativity) {
            relevance *= (0.5 + npc.personality.creativity * 0.5);
        }

        return relevance;
    }

    /**
     * Check if condition is met
     * @private
     */
    _checkCondition(condition, npc, context) {
        const conditionChecks = {
            'threat': () => context.threat > 0.3,
            'vulnerability': () => npc.health < 0.5 || npc.defense < 0.3,
            'scarcity': () => context.resourceAvailability < 0.3,
            'need': () => Object.values(npc.needs || {}).some(n => n < 0.4),
            'loneliness': () => context.loneliness > 0.5,
            'social_opportunity': () => context.nearbyNPCs > 0,
            'active_conflict': () => context.activeConflicts > 0,
            'positive_relationship': () => context.positiveRelationships > 0,
            'ambition': () => npc.personality?.ambition > 0.6,
            'skill_gap': () => context.learnableSkills > 0,
            'unfinished_work': () => context.unfinishedProjects > 0,
            'unrecognized_achievement': () => context.unrecognizedAchievements > 0,
            'curiosity': () => npc.personality?.curiosity > 0.6,
            'mystery_present': () => context.mysteries > 0,
            'unexplored_area': () => context.unexploredAreas > 0,
            'low_happiness': () => npc.emotionalState?.happiness < 0.4,
            'active_fear': () => npc.emotionalState?.fear > 0.5,
            'creative_urge': () => npc.personality?.creativity > 0.7,
            'inspiration': () => context.inspiration > 0.5,
            'problem_awareness': () => context.knownProblems > 0
        };

        const check = conditionChecks[condition];
        return check ? check() : false;
    }

    /**
     * Fill template with context values
     * @private
     */
    _fillTemplate(template, context) {
        let filled = template;

        // Replace placeholders
        const replacements = {
            '{target}': context.relationshipTarget || 'someone',
            '{skill}': context.targetSkill || 'a new skill',
            '{project}': context.currentProject || 'current project',
            '{mystery}': context.currentMystery || 'the mystery',
            '{location}': context.targetLocation || 'new areas',
            '{source}': context.fearSource || 'fears',
            '{art_type}': context.artType || 'work of art',
            '{innovation}': context.innovationType || 'solution'
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
            filled = filled.replace(placeholder, value);
        }

        return filled;
    }

    /**
     * Calculate goal rewards
     * @private
     */
    _calculateRewards(template, npc) {
        const rewards = {
            satisfaction: 0.5,
            experience: 0.3
        };

        // Type-specific rewards
        switch (template.type) {
            case 'survival':
                rewards.safety = 0.8;
                rewards.confidence = 0.3;
                break;
            case 'social':
                rewards.socialFulfillment = 0.7;
                rewards.happiness = 0.5;
                break;
            case 'achievement':
                rewards.pride = 0.8;
                rewards.skill = 0.6;
                rewards.recognition = 0.4;
                break;
            case 'knowledge':
                rewards.understanding = 0.7;
                rewards.wisdom = 0.4;
                break;
            case 'emotional':
                rewards.emotionalBalance = 0.8;
                rewards.happiness = 0.6;
                break;
            case 'creative':
                rewards.creativity = 0.6;
                rewards.fulfillment = 0.8;
                break;
        }

        return rewards;
    }

    /**
     * Calculate goal deadline
     * @private
     */
    _calculateDeadline(template, context) {
        const baseDurations = {
            'survival': 1 * 60 * 60 * 1000,      // 1 hour
            'social': 24 * 60 * 60 * 1000,      // 1 day
            'achievement': 7 * 24 * 60 * 60 * 1000,  // 1 week
            'knowledge': 3 * 24 * 60 * 60 * 1000,    // 3 days
            'emotional': 12 * 60 * 60 * 1000,    // 12 hours
            'creative': 2 * 24 * 60 * 60 * 1000  // 2 days
        };

        const baseDuration = baseDurations[template.type] || 24 * 60 * 60 * 1000;
        
        // Adjust based on urgency
        const urgencyMultiplier = context.urgency || 1;
        const duration = baseDuration / urgencyMultiplier;

        return Date.now() + duration;
    }

    /**
     * Enrich goal with additional details
     * @private
     */
    _enrichGoal(goal, npc, context) {
        // Add subgoals for complex goals
        if (goal.type === 'achievement' || goal.type === 'knowledge') {
            goal.subgoals = this._generateSubgoals(goal, context);
        }

        // Add dependencies
        if (context.requiredResources) {
            goal.dependencies.push({
                type: 'resources',
                required: context.requiredResources
            });
        }

        if (context.requiredRelationships) {
            goal.dependencies.push({
                type: 'relationships',
                required: context.requiredRelationships
            });
        }

        // Add motivation factors
        goal.motivation = {
            intrinsic: this._calculateIntrinsicMotivation(goal, npc),
            extrinsic: this._calculateExtrinsicMotivation(goal, context)
        };

        // Add strategies
        goal.strategies = this._generateStrategies(goal, npc, context);
    }

    /**
     * Generate subgoals
     * @private
     */
    _generateSubgoals(parentGoal, context) {
        const subgoals = [];

        switch (parentGoal.template) {
            case 'master_skill':
                subgoals.push(
                    { description: 'Find a teacher or resource', progress: 0 },
                    { description: 'Practice regularly', progress: 0 },
                    { description: 'Apply skill in real situation', progress: 0 }
                );
                break;
            case 'complete_project':
                subgoals.push(
                    { description: 'Gather necessary resources', progress: 0 },
                    { description: 'Plan the approach', progress: 0 },
                    { description: 'Execute the plan', progress: 0 },
                    { description: 'Refine and finish', progress: 0 }
                );
                break;
            case 'learn_secret':
                subgoals.push(
                    { description: 'Identify information sources', progress: 0 },
                    { description: 'Gain trust or access', progress: 0 },
                    { description: 'Piece together clues', progress: 0 }
                );
                break;
        }

        return subgoals;
    }

    /**
     * Generate personality-driven goals
     * @private
     */
    _generatePersonalityGoals(npc, context) {
        const goals = [];

        // Highly curious NPCs seek knowledge
        if (npc.personality?.curiosity > 0.8 && Math.random() < 0.3) {
            const knowledgeGoal = this._createGoalFromTemplate('explore_area', npc, context);
            if (knowledgeGoal) goals.push(knowledgeGoal);
        }

        // Creative NPCs want to create
        if (npc.personality?.creativity > 0.8 && Math.random() < 0.3) {
            const creativeGoal = this._createGoalFromTemplate('create_art', npc, context);
            if (creativeGoal) goals.push(creativeGoal);
        }

        // Social NPCs seek connections
        if (npc.personality?.extraversion > 0.8 && Math.random() < 0.3) {
            const socialGoal = this._createGoalFromTemplate('make_friend', npc, context);
            if (socialGoal) goals.push(socialGoal);
        }

        return goals;
    }

    /**
     * Generate reactive goals based on events
     * @private
     */
    _generateReactiveGoals(npc, context) {
        const goals = [];

        // React to recent negative events
        if (context.recentNegativeEvent) {
            const reactiveGoal = {
                id: `goal_${Date.now()}_reactive`,
                ownerId: npc.id,
                type: 'reactive',
                description: `Respond to ${context.recentNegativeEvent.type}`,
                basePriority: 0.8,
                currentPriority: 0.8,
                progress: 0,
                status: 'active',
                created: Date.now(),
                lastUpdate: Date.now(),
                source: 'reactive',
                deadline: Date.now() + 6 * 60 * 60 * 1000 // 6 hours
            };
            goals.push(reactiveGoal);
        }

        // React to opportunities
        if (context.recentOpportunity) {
            const opportunityGoal = {
                id: `goal_${Date.now()}_opportunity`,
                ownerId: npc.id,
                type: 'opportunity',
                description: `Seize opportunity: ${context.recentOpportunity.type}`,
                basePriority: 0.7,
                currentPriority: 0.7,
                progress: 0,
                status: 'active',
                created: Date.now(),
                lastUpdate: Date.now(),
                source: 'opportunity',
                deadline: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
            };
            goals.push(opportunityGoal);
        }

        return goals;
    }

    /**
     * Check if NPC has similar goal
     * @private
     */
    _hasSimilarGoal(npcId, newGoal) {
        const activeGoals = this.getActiveGoals(npcId);
        
        for (const existingGoal of activeGoals) {
            if (existingGoal.type === newGoal.type &&
                existingGoal.template === newGoal.template) {
                return true;
            }
        }

        return false;
    }

    /**
     * Register a goal
     * @private
     */
    _registerGoal(goal) {
        this.goals.set(goal.id, goal);

        if (!this.goalsByOwner.has(goal.ownerId)) {
            this.goalsByOwner.set(goal.ownerId, []);
        }
        this.goalsByOwner.get(goal.ownerId).push(goal.id);

        this.stats.totalGenerated++;
    }

    /**
     * Complete a goal
     * @private
     */
    _completeGoal(goal) {
        goal.status = 'completed';
        goal.completedAt = Date.now();
        goal.completionTime = goal.completedAt - goal.created;

        // Move to completed list
        this.completedGoals.push(goal);

        // Update statistics
        this.stats.totalCompleted++;
        this.stats.averageCompletionTime = 
            (this.stats.averageCompletionTime * (this.stats.totalCompleted - 1) + 
             goal.completionTime) / this.stats.totalCompleted;

        // Trigger rewards
        this._triggerRewards(goal);
    }

    /**
     * Abandon a goal
     * @private
     */
    _abandonGoal(goal, reason) {
        goal.status = 'abandoned';
        goal.abandonedAt = Date.now();
        goal.abandonmentReason = reason;

        // Move to abandoned list
        this.abandonedGoals.push(goal);

        // Update statistics
        this.stats.totalAbandoned++;
    }

    /**
     * Check if goal is stagnant
     * @private
     */
    _isStagnant(goal) {
        if (goal.progressHistory.length < 3) return false;

        // Check if progress hasn't changed recently
        const recentProgress = goal.progressHistory.slice(-3);
        const progressValues = recentProgress.map(p => p.progress);
        
        const allSame = progressValues.every(p => p === progressValues[0]);
        const timeSinceLastProgress = Date.now() - recentProgress[0].timestamp;

        return allSame && timeSinceLastProgress > 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Reassess a stagnant goal
     * @private
     */
    _reassessGoal(goal) {
        // Reduce priority
        goal.currentPriority *= 0.8;

        // Consider breaking into smaller subgoals
        if (goal.subgoals.length === 0) {
            goal.subgoals = this._generateSubgoals(goal, {});
        }

        // Consider abandonment
        if (goal.currentPriority < this.config.abandonmentThreshold) {
            this._abandonGoal(goal, 'stagnation');
        }
    }

    /**
     * Update goal motivation
     * @private
     */
    _updateMotivation(goal) {
        // Increase motivation when making progress
        if (goal.progressHistory.length > 0) {
            const recentProgress = goal.progressHistory[goal.progressHistory.length - 1];
            if (recentProgress.progress > goal.progress) {
                goal.motivation.intrinsic *= 1.1;
            }
        }

        // Decrease motivation when stagnant
        const timeSinceUpdate = Date.now() - goal.lastUpdate;
        if (timeSinceUpdate > 12 * 60 * 60 * 1000) { // 12 hours
            goal.motivation.intrinsic *= 0.95;
        }
    }

    /**
     * Calculate intrinsic motivation
     * @private
     */
    _calculateIntrinsicMotivation(goal, npc) {
        let motivation = 0.5;

        // Personality alignment
        const personalityAlignment = {
            'social': npc.personality?.extraversion || 0.5,
            'achievement': npc.personality?.ambition || 0.5,
            'knowledge': npc.personality?.curiosity || 0.5,
            'creative': npc.personality?.creativity || 0.5
        };

        if (personalityAlignment[goal.type]) {
            motivation += personalityAlignment[goal.type] * 0.3;
        }

        return motivation;
    }

    /**
     * Calculate extrinsic motivation
     * @private
     */
    _calculateExtrinsicMotivation(goal, context) {
        let motivation = 0.3;

        // Social pressure
        if (context.socialExpectation) {
            motivation += 0.2;
        }

        // Rewards
        if (goal.rewards.recognition) {
            motivation += goal.rewards.recognition * 0.3;
        }

        return motivation;
    }

    /**
     * Generate strategies for achieving goal
     * @private
     */
    _generateStrategies(goal, npc, context) {
        const strategies = [];

        switch (goal.type) {
            case 'social':
                strategies.push(
                    { approach: 'direct', description: 'Direct interaction' },
                    { approach: 'gradual', description: 'Build trust slowly' }
                );
                break;
            case 'achievement':
                strategies.push(
                    { approach: 'focused', description: 'Dedicated effort' },
                    { approach: 'collaborative', description: 'Seek help from others' }
                );
                break;
            case 'knowledge':
                strategies.push(
                    { approach: 'investigative', description: 'Active investigation' },
                    { approach: 'observational', description: 'Patient observation' }
                );
                break;
        }

        return strategies;
    }

    /**
     * Create goal from template
     * @private
     */
    _createGoalFromTemplate(templateId, npc, context) {
        const template = this.goalTemplates[templateId];
        if (!template) return null;

        const goal = {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ownerId: npc.id,
            type: template.type,
            description: this._fillTemplate(template.description, context),
            basePriority: template.basePriority,
            currentPriority: template.basePriority,
            progress: 0,
            status: 'active',
            created: Date.now(),
            lastUpdate: Date.now(),
            source: 'personality',
            template: templateId,
            progressHistory: [],
            subgoals: [],
            dependencies: [],
            rewards: this._calculateRewards(template, npc),
            deadline: this._calculateDeadline(template, context)
        };

        this._enrichGoal(goal, npc, context);
        return goal;
    }

    /**
     * Trigger goal completion rewards
     * @private
     */
    _triggerRewards(goal) {
        // Rewards would be applied to NPC state
        // This is a placeholder for the actual reward system
        console.log(`Goal completed: ${goal.description}`, goal.rewards);
    }

    /**
     * Get goal statistics
     */
    getStats() {
        return {
            ...this.stats,
            activeGoals: this.goals.size,
            goalTypes: this._getGoalTypeDistribution()
        };
    }

    /**
     * Get goal type distribution
     * @private
     */
    _getGoalTypeDistribution() {
        const distribution = {};
        
        for (const goal of this.goals.values()) {
            distribution[goal.type] = (distribution[goal.type] || 0) + 1;
        }
        
        return distribution;
    }
}
