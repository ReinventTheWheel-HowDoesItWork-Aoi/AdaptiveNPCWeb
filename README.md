# AdaptiveNPCWeb

> Revolutionary adaptive NPC consciousness system for web-based games

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-live-green.svg)](https://adaptivenpcweb.demo)
[![NPCs](https://img.shields.io/badge/NPCs-1000%2B-orange.svg)](https://adaptivenpcweb.demo)
[![Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](package.json)

AdaptiveNPCWeb brings truly living NPCs to web games with persistent memories, emotional growth, relationship networks, and emergent storylines - all running entirely in the browser with zero dependencies.

## 🚨 PROJECT STATUS: COMPLETE

This project is feature-complete and not actively maintained. It is provided as a reference implementation and learning resource.

## ✨ Features

- 🧠 **Persistent Consciousness** - NPCs remember every interaction across sessions
- ❤️ **Emotional Evolution** - Dynamic emotional states affect decisions and dialogue
- 🌐 **Distributed Intelligence** - NPCs share experiences via WebRTC mesh networking
- 📖 **Emergent Narratives** - Unscripted storylines develop from NPC interactions
- 🎮 **Easy Integration** - Three lines of code to add living NPCs to any game
- 🚀 **High Performance** - Support for 1000+ simultaneous NPCs using Web Workers
- 📱 **Mobile Ready** - Optimized for all devices with adaptive performance modes
- 🔒 **Zero Dependencies** - Pure web standards, no external libraries required
- 🌌 **Quantum Personality** - Each NPC is unique through quantum-inspired traits
- 🎯 **Goal-Driven Behavior** - NPCs autonomously pursue personal objectives

## 🚀 Quick Start

### 1. Clone the repository:
```bash
git clone https://github.com/yourusername/adaptive-npc-web.git
cd adaptive-npc-web
```

### 2. Open the demo:
```bash
# No build step required!
open index.html
```

### 3. Integrate into your game:
```javascript
import { AdaptiveNPCWeb } from './src/core/adaptive-npc-web.js';

// Initialize the system
const npcSystem = new AdaptiveNPCWeb({
  worldName: 'MyGameWorld',
  enableNetworking: true
});

// Create an adaptive NPC
const npc = await npcSystem.createNPC({
  name: "Elena",
  role: "Blacksmith",
  basePersonality: { 
    curious: 0.7, 
    kind: 0.8 
  }
});

// NPCs remember and evolve
npc.interact(player, {
  action: "helped",
  emotion: "grateful"
});
```

## 🌐 For Players: How It Works

When players access your game, AdaptiveNPCWeb works seamlessly:

### **Each Player Gets Their Own Living World**
- NPCs remember each player individually
- Relationships are unique to each player
- Stories develop differently for everyone
- All data saves in the player's browser (privacy-friendly!)

### **Example: Same NPC, Different Players**
```
Player A's Experience:
Elena: "My dear friend! Thanks again for helping with the forge. 
        I've been saving this special sword for you."

Player B's Experience:  
Elena: "You! Guards told me about the theft. I don't serve thieves.
        Get out of my shop!"

Player C's Experience:
Elena: "Oh... it's you. *blushes* I've been thinking about what 
        you said yesterday..."
```

### **Multi-Player Features (Optional)**
- **WebRTC Mesh**: NPCs can share stories between players
- **Collective Memory**: NPCs can "hear" about other players
- **Shared World**: Optional feature for MMO-style games

### **Privacy & Storage**
- ✅ All data stored locally in player's browser
- ✅ No personal data sent to servers
- ✅ Players own their NPC relationships
- ✅ Works offline after first load
- ✅ GDPR compliant (no data collection)

## 📚 Documentation

### Architecture Overview

AdaptiveNPCWeb uses a modular architecture inspired by cognitive science and quantum mechanics:

```
┌─────────────────────────────────────────────────────────────┐
│                      AdaptiveNPCWeb Core                      │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Quantum System  │ Consciousness   │  Emotional Engine       │
│ • Superposition │ • Neural Net    │  • State Machine        │
│ • Entanglement  │ • Memory Bank   │  • Mood Dynamics        │
│ • Observation   │ • Attention     │  • Empathy System       │
├─────────────────┼─────────────────┼─────────────────────────┤
│ Narrative       │ Networking      │  Persistence            │
│ • Story Weaver  │ • WebRTC Mesh   │  • IndexedDB            │
│ • Goal System   │ • Sync Protocol │  • State Serialization  │
│ • Event Memory  │ • Collective    │  • Auto-save            │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Core Concepts

#### 1. Quantum Personality
Each NPC's personality exists in quantum superposition until observed through interactions:

```javascript
const personality = npc.quantumPersonality;
// Traits exist as probability distributions
console.log(personality.observe('courage')); // Collapses to 0.73
console.log(personality.getUncertainty('courage')); // Returns 0.12
```

#### 2. Consciousness System
NPCs process information through a transformer-inspired neural architecture:

```javascript
// NPCs think autonomously
const thought = await npc.consciousness.think("Player helped me");
// Returns: { 
//   content: "I should remember this kindness", 
//   emotion: "grateful",
//   associations: ["trust", "friendship"]
// }
```

#### 3. Memory Architecture
Four types of memory create rich, persistent personalities:

- **Episodic**: Specific events ("Player helped me fix the forge")
- **Semantic**: General knowledge ("Fire is hot")
- **Procedural**: Learned behaviors ("How to negotiate")
- **Emotional**: Feeling associations ("This place makes me happy")

#### 4. Relationship Networks
NPCs form complex social bonds that affect behavior:

```javascript
const relationship = npc.getRelationship(player);
// Returns: {
//   trust: 0.8,
//   affection: 0.6,
//   respect: 0.9,
//   history: [...],
//   lastInteraction: timestamp
// }
```

### API Reference

#### AdaptiveNPCWeb Class

```javascript
const npcSystem = new AdaptiveNPCWeb(config);
```

**Config Options:**
- `worldName` (string): Unique identifier for your game world
- `enableNetworking` (boolean): Enable WebRTC mesh networking
- `maxNPCs` (number): Maximum concurrent NPCs (default: 1000)
- `enableQuantum` (boolean): Enable quantum personality features
- `performanceMode` (string): 'low', 'balanced', or 'high'

**Methods:**

##### createNPC(config)
```javascript
const npc = await npcSystem.createNPC({
  name: "Elena",
  role: "Blacksmith",
  basePersonality: {
    openness: 0.7,
    conscientiousness: 0.8,
    extraversion: 0.6,
    agreeableness: 0.8,
    neuroticism: 0.3
  },
  appearance: {
    // Your visual data
  },
  initialLocation: { x: 100, y: 200 }
});
```

##### processInteraction(sourceId, targetId, interaction)
```javascript
const result = await npcSystem.processInteraction(
  player.id,
  npc.id,
  {
    action: "give_gift",
    item: "rare_ore",
    emotion: "friendly"
  }
);
```

##### saveState() / loadState()
```javascript
// Auto-saves every 30 seconds, but you can trigger manually
await npcSystem.saveState();
await npcSystem.loadState();
```

#### NPC Instance Methods

##### interact(entity, details)
```javascript
npc.interact(player, {
  action: "conversation",
  topic: "weather",
  tone: "friendly"
});
```

##### speak(prompt)
```javascript
const response = npc.speak("How are you today?");
// Returns contextual response based on:
// - Current emotional state
// - Relationship with speaker
// - Recent memories
// - Personality traits
```

##### getCurrentMood()
```javascript
const mood = npc.getCurrentMood();
// Returns: {
//   happiness: 0.7,
//   energy: 0.6,
//   stress: 0.2,
//   dominant: "content"
// }
```

##### rememberEvent(event)
```javascript
npc.rememberEvent({
  type: "witnessed",
  description: "Saw a dragon fly overhead",
  importance: 0.9,
  emotionalImpact: "awe"
});
```

### Integration Examples

#### Basic RPG Village
```javascript
// Create a living village
const village = new AdaptiveNPCWeb({
  worldName: 'PeacefulVillage'
});

// Populate with NPCs
const blacksmith = await village.createNPC({
  name: "Elena",
  role: "Blacksmith",
  basePersonality: { hardworking: 0.9, friendly: 0.7 }
});

const merchant = await village.createNPC({
  name: "Marcus", 
  role: "Merchant",
  basePersonality: { shrewd: 0.8, talkative: 0.9 }
});

// They interact autonomously
setInterval(() => {
  village.processInteraction(
    blacksmith.id,
    merchant.id,
    { action: "trade", context: "daily_business" }
  );
}, 60000); // Every minute
```

#### Social Simulation
```javascript
// Create a social environment
const social = new AdaptiveNPCWeb({
  worldName: 'SocialSim',
  enableNetworking: true // NPCs share experiences
});

// Create diverse personalities
const personalities = [
  { name: "Alex", traits: { extraversion: 0.9, creativity: 0.8 } },
  { name: "Sam", traits: { introversion: 0.8, analytical: 0.9 } },
  { name: "Jordan", traits: { empathy: 0.9, humor: 0.7 } }
];

for (const p of personalities) {
  await social.createNPC({
    name: p.name,
    basePersonality: p.traits
  });
}

// Watch relationships evolve
social.on('relationship_change', (event) => {
  console.log(`${event.npc1} and ${event.npc2} relationship evolved`);
});
```

#### Emergent Storytelling
```javascript
// NPCs generate their own stories
const storyWorld = new AdaptiveNPCWeb({
  worldName: 'EmergentTales'
});

const bard = await storyWorld.createNPC({
  name: "Maya",
  role: "Bard",
  basePersonality: { 
    curiosity: 0.9,
    creativity: 0.95,
    storytelling: 1.0 
  }
});

// Bard collects and shares stories
bard.on('story_created', (story) => {
  console.log(`New tale: ${story.title}`);
  // Share with other NPCs
  storyWorld.broadcast('new_story', story);
});
```

### Performance Optimization

#### Memory Management
```javascript
// Configure memory limits per NPC
const optimized = new AdaptiveNPCWeb({
  maxMemoriesPerNPC: 1000,
  memoryConsolidationInterval: 300000, // 5 minutes
  workingMemorySize: 50
});
```

#### Web Workers
AdaptiveNPCWeb automatically uses Web Workers for parallel processing:
- Consciousness updates run on separate threads
- Memory consolidation happens in background
- Quantum calculations are distributed

#### Performance Modes
```javascript
// Mobile or low-end devices
new AdaptiveNPCWeb({ performanceMode: 'low' });

// Desktop gaming
new AdaptiveNPCWeb({ performanceMode: 'high' });
```

### Advanced Features

#### Quantum Entanglement
Link NPC personalities for deeper connections:
```javascript
// Siblings share personality traits
npcSystem.quantumEntangle(sibling1.id, sibling2.id, strength: 0.7);
```

#### Collective Consciousness
NPCs share experiences through WebRTC:
```javascript
// Enable mesh networking
const collective = new AdaptiveNPCWeb({
  enableNetworking: true,
  meshConfig: {
    shareMemories: true,
    shareEmotions: true,
    consensusThreshold: 0.6
  }
});
```

#### Custom AI Behaviors
Extend the consciousness system:
```javascript
class CustomConsciousness extends ConsciousnessCore {
  async processSpecialThought(input) {
    // Your custom neural processing
    return super.think(input);
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

**NPCs not remembering interactions**
- Check IndexedDB is enabled in browser
- Verify `saveState()` is being called
- Ensure sufficient storage quota

**Performance issues with many NPCs**
- Reduce `maxNPCs` configuration
- Enable `performanceMode: 'low'`
- Disable quantum features for mobile

**WebRTC connection failures**
- Check firewall settings
- Verify STUN/TURN server configuration
- Test with `enableNetworking: false` first

## 🤝 Contributing

While this project is complete and not actively maintained, we welcome:
- Bug reports via GitHub Issues
- Pull requests (may not be reviewed)
- Forks and derivative works
- Community discussions

## 📜 License

Apache 2.0 - See [LICENSE](LICENSE) for details.

## 🎯 Roadmap (Community Driven)

Potential areas for community development:
- [ ] GPT integration for dynamic dialogue
- [ ] VR/AR support for spatial interactions
- [ ] Emotional contagion algorithms
- [ ] Dream sequences for offline NPCs
- [ ] Genetic personality inheritance
- [ ] Cultural memory systems

## 📞 Support

This is a community project with no official support. For questions:
- GitHub Discussions
- Stack Overflow tag: `#adaptive-npc-web`

## 📄 License & Attribution

Copyright © 2025 Lavelle Hatcher Jr

Licensed under the Apache License, Version 2.0 - see the LICENSE file for details.

**Attribution Required**: Anyone using this software must include the copyright notice and attribution to Lavelle Hatcher Jr.
