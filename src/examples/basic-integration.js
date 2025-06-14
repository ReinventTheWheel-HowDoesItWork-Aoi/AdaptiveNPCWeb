/*
 * Copyright 2025 AdaptiveNPCWeb Contributors
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
 * Basic Integration Example - AdaptiveNPCWeb
 * 
 * This example shows how to integrate AdaptiveNPCWeb into your game
 * with just a few lines of code.
 */

import AdaptiveNPCAPI from '../src/core/api.js';

// Initialize AdaptiveNPCWeb
const npcSystem = new AdaptiveNPCAPI();

async function initializeGame() {
    console.log('🎮 Initializing AdaptiveNPCWeb...');
    
    // Step 1: Initialize the system
    await npcSystem.init({
        worldName: 'MyAwesomeRPG',
        enableNetworking: true,    // Enable NPC experience sharing
        performanceMode: 'balanced' // Options: 'low', 'balanced', 'high'
    });

    // Step 2: Create some NPCs
    console.log('👥 Creating NPCs...');
    
    // Create a friendly blacksmith
    const elena = await npcSystem.createNPC({
        name: 'Elena',
        role: 'Blacksmith',
        traits: {
            friendly: 0.8,
            hardworking: 0.9,
            creative: 0.7
        },
        position: { x: 100, y: 200 }
    });

    // Create a curious merchant
    const marcus = await npcSystem.createNPC({
        name: 'Marcus',
        role: 'Merchant',
        traits: {
            social: 0.9,
            curious: 0.8,
            organized: 0.6
        },
        position: { x: 300, y: 200 }
    });

    // Create a wise healer
    const sofia = await npcSystem.createNPC({
        name: 'Sofia',
        role: 'Healer',
        traits: {
            empathetic: 0.9,
            wise: 0.8,
            calm: 0.7
        },
        position: { x: 200, y: 400 }
    });

    console.log('✅ NPCs created successfully!');

    // Step 3: Set up event handlers
    setupEventHandlers();

    // Step 4: Start the game loop
    startGameLoop();

    // Step 5: Enable debug mode (optional)
    const debugContainer = document.getElementById('debug-panel');
    if (debugContainer) {
        npcSystem.enableDebug(debugContainer);
    }

    return { elena, marcus, sofia };
}

function setupEventHandlers() {
    // Listen for mood changes
    npcSystem.on('npc.mood.changed', (data) => {
        console.log(`😊 ${data.npc.name} mood changed to ${data.mood}`);
        updateMoodDisplay(data.npc, data.mood);
    });

    // Listen for relationship changes
    npcSystem.on('npc.relationship.changed', (data) => {
        console.log(`🤝 Relationship between ${data.source} and ${data.target} changed`);
    });

    // Listen for narrative events
    npcSystem.on('narrative.event', (data) => {
        console.log(`📖 Story event: ${data.title}`);
        displayStoryEvent(data);
    });
}

let lastUpdate = performance.now();

function startGameLoop() {
    function gameLoop() {
        const now = performance.now();
        const deltaTime = now - lastUpdate;
        lastUpdate = now;

        // Update all NPCs
        npcSystem.update(deltaTime);

        // Continue loop
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

// Example: Player interaction
async function playerInteractsWithNPC(npcName, action) {
    const player = { id: 'player', name: 'Hero' };
    
    try {
        // Simple interaction
        const result = await npcSystem.interact(player, npcName, action);
        
        console.log(`💬 ${npcName}: "${result.npcResponse}"`);
        console.log(result.getSummary());
        
        // Update UI with response
        displayNPCResponse(npcName, result.npcResponse);
        
        // Check if relationship improved
        if (result.wasPositive()) {
            console.log('✨ Positive interaction!');
        }
        
        return result;
    } catch (error) {
        console.error('Interaction failed:', error);
    }
}

// Example: Quest giving
async function giveQuestToPlayer(npcName, questData) {
    const result = await npcSystem.interact(
        { id: 'player' },
        npcName,
        'quest',
        { questData }
    );
    
    return result;
}

// Example: Trading
async function tradeWithNPC(npcName, offeredItems, requestedItems) {
    const result = await npcSystem.interact(
        { id: 'player' },
        npcName,
        'trade',
        {
            offered: offeredItems,
            requested: requestedItems
        }
    );
    
    return result;
}

// Example: Check NPC state
function checkNPCState(npcName) {
    const npc = npcSystem.getNPC(npcName);
    if (!npc) return null;
    
    const mood = npc.getMood();
    const goals = npc.getGoals();
    const memories = npc.getRecentMemories(3);
    
    console.log(`📊 ${npcName} Status:`);
    console.log(`   Mood: ${mood.emoji} ${mood.state}`);
    console.log(`   Happiness: ${Math.round(mood.happiness * 100)}%`);
    console.log(`   Current goals:`, goals);
    console.log(`   Recent memories:`, memories);
    
    return { mood, goals, memories };
}

// Example: Save/Load game
async function saveGame() {
    console.log('💾 Saving game...');
    const success = await npcSystem.save();
    
    if (success) {
        console.log('✅ Game saved successfully!');
        displayNotification('Game saved');
    } else {
        console.error('❌ Failed to save game');
    }
    
    return success;
}

async function loadGame() {
    console.log('📂 Loading game...');
    const success = await npcSystem.load();
    
    if (success) {
        console.log('✅ Game loaded successfully!');
        displayNotification('Game loaded');
        
        // Refresh UI with loaded NPCs
        refreshNPCDisplay();
    } else {
        console.error('❌ Failed to load game');
    }
    
    return success;
}

// UI Helper functions (implement based on your game's UI)
function updateMoodDisplay(npc, mood) {
    // Update your game's UI to show NPC mood
}

function displayStoryEvent(event) {
    // Show narrative events in your game's UI
}

function displayNPCResponse(npcName, response) {
    // Show NPC dialogue in your game's UI
}

function displayNotification(message) {
    // Show notifications in your game's UI
}

function refreshNPCDisplay() {
    // Refresh all NPC displays after loading
}

// Example usage in your game
async function main() {
    try {
        // Initialize the game
        const { elena, marcus, sofia } = await initializeGame();
        
        // Example interactions
        setTimeout(async () => {
            // Player greets Elena
            await playerInteractsWithNPC('Elena', 'greet');
            
            // Player helps Marcus
            await playerInteractsWithNPC('Marcus', 'help');
            
            // Check Elena's state
            checkNPCState('Elena');
            
            // NPCs interact with each other
            const marcusNPC = npcSystem.getNPC('Marcus');
            const elenaNPC = npcSystem.getNPC('Elena');
            if (marcusNPC && elenaNPC) {
                await npcSystem.interact(marcusNPC, elenaNPC, 'talk');
            }
        }, 1000);
        
        // Set up auto-save every 5 minutes
        setInterval(() => {
            saveGame();
        }, 5 * 60 * 1000);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        saveGame();
                        break;
                    case 'l':
                        e.preventDefault();
                        loadGame();
                        break;
                }
            }
        });
        
        console.log('🎮 Game ready! NPCs are living their lives...');
        
    } catch (error) {
        console.error('Failed to start game:', error);
    }
}

// Start the game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// Export functions for use in your game
export {
    npcSystem,
    playerInteractsWithNPC,
    giveQuestToPlayer,
    tradeWithNPC,
    checkNPCState,
    saveGame,
    loadGame
};
