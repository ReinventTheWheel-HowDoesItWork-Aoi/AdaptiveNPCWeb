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
 * WebRTCMesh - Peer-to-peer mesh network for NPC communication
 * 
 * Enables NPCs to share experiences, knowledge, and consciousness
 * states across different game instances.
 * 
 * @class WebRTCMesh
 */
export class WebRTCMesh {
    constructor(worldName, config = {}) {
        this.worldName = worldName;
        this.config = {
            maxPeers: 10,
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            reconnectDelay: 5000,
            heartbeatInterval: 30000,
            messageTimeout: 10000,
            ...config
        };

        // Peer connections
        this.peers = new Map();
        this.peerId = this._generatePeerId();
        
        // Signaling
        this.signalingServer = null;
        this.signalingState = 'disconnected';
        
        // Message handling
        this.messageHandlers = new Map();
        this.pendingMessages = new Map();
        
        // Network state
        this.connected = false;
        this.networkStats = {
            messagesReceived: 0,
            messagesSent: 0,
            bytesReceived: 0,
            bytesSent: 0,
            peersConnected: 0
        };
        
        // Event emitter functionality
        this.listeners = new Map();
        
        // Initialize default handlers
        this._setupDefaultHandlers();
    }

    /**
     * Connect to the mesh network
     * 
     * @param {string} signalingUrl - Optional signaling server URL
     */
    async connect(signalingUrl) {
        if (this.connected) {
            console.warn('Already connected to mesh network');
            return;
        }

        try {
            // In production, would connect to actual signaling server
            // For demo, we'll simulate peer discovery
            await this._simulateSignaling();
            
            this.connected = true;
            this.emit('connected', { peerId: this.peerId });
            
            // Start heartbeat
            this._startHeartbeat();
            
            console.log(`Connected to mesh network as ${this.peerId}`);
        } catch (error) {
            console.error('Failed to connect to mesh:', error);
            this.emit('error', error);
            
            // Retry connection
            setTimeout(() => this.connect(signalingUrl), this.config.reconnectDelay);
        }
    }

    /**
     * Disconnect from the mesh network
     */
    disconnect() {
        if (!this.connected) return;
        
        // Close all peer connections
        for (const [peerId, peer] of this.peers) {
            this._closePeer(peerId);
        }
        
        // Stop heartbeat
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        this.connected = false;
        this.emit('disconnected');
        
        console.log('Disconnected from mesh network');
    }

    /**
     * Broadcast a message to all peers
     * 
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    broadcast(type, data) {
        const message = {
            id: this._generateMessageId(),
            type,
            data,
            from: this.peerId,
            timestamp: Date.now()
        };
        
        let sent = 0;
        for (const [peerId, peer] of this.peers) {
            if (peer.connectionState === 'connected' && peer.dataChannel?.readyState === 'open') {
                try {
                    this._sendToPeer(peer, message);
                    sent++;
                } catch (error) {
                    console.error(`Failed to send to peer ${peerId}:`, error);
                }
            }
        }
        
        this.networkStats.messagesSent++;
        
        return sent;
    }

    /**
     * Send a message to a specific peer
     * 
     * @param {string} peerId - Target peer ID
     * @param {string} type - Message type
     * @param {Object} data - Message data
     * @returns {Promise} Resolves when message is acknowledged
     */
    async send(peerId, type, data) {
        const peer = this.peers.get(peerId);
        if (!peer || peer.connectionState !== 'connected') {
            throw new Error(`Peer ${peerId} not connected`);
        }
        
        const message = {
            id: this._generateMessageId(),
            type,
            data,
            from: this.peerId,
            to: peerId,
            timestamp: Date.now(),
            requiresAck: true
        };
        
        return new Promise((resolve, reject) => {
            // Store pending message
            this.pendingMessages.set(message.id, {
                resolve,
                reject,
                timeout: setTimeout(() => {
                    this.pendingMessages.delete(message.id);
                    reject(new Error('Message timeout'));
                }, this.config.messageTimeout)
            });
            
            try {
                this._sendToPeer(peer, message);
                this.networkStats.messagesSent++;
            } catch (error) {
                this.pendingMessages.delete(message.id);
                reject(error);
            }
        });
    }

    /**
     * Register a message handler
     * 
     * @param {string} type - Message type
     * @param {Function} handler - Handler function
     */
    on(type, handler) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(handler);
    }

    /**
     * Emit an event
     * 
     * @param {string} type - Event type
     * @param {*} data - Event data
     */
    emit(type, data) {
        const handlers = this.listeners.get(type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${type}:`, error);
                }
            }
        }
    }

    /**
     * Get network statistics
     */
    getStats() {
        return {
            ...this.networkStats,
            peersConnected: this.peers.size,
            peers: Array.from(this.peers.keys())
        };
    }

    /**
     * Setup default message handlers
     * @private
     */
    _setupDefaultHandlers() {
        // Heartbeat handler
        this.messageHandlers.set('heartbeat', (message, peer) => {
            peer.lastHeartbeat = Date.now();
            this._sendToPeer(peer, {
                type: 'heartbeat_ack',
                id: message.id,
                from: this.peerId
            });
        });
        
        // Acknowledgment handler
        this.messageHandlers.set('ack', (message) => {
            const pending = this.pendingMessages.get(message.ackId);
            if (pending) {
                clearTimeout(pending.timeout);
                pending.resolve(message);
                this.pendingMessages.delete(message.ackId);
            }
        });
        
        // NPC sync handlers
        this.messageHandlers.set('npc_created', (message) => {
            this.emit('npc_created', message.data);
        });
        
        this.messageHandlers.set('interaction', (message) => {
            this.emit('interaction', message.data);
        });
        
        this.messageHandlers.set('consciousness_sync', (message) => {
            this.emit('consciousness_sync', message.data);
        });
    }

    /**
     * Simulate signaling for demo (in production, use actual signaling server)
     * @private
     */
    async _simulateSignaling() {
        // Simulate finding peers
        const simulatedPeers = this._discoverLocalPeers();
        
        for (const peerInfo of simulatedPeers) {
            await this._connectToPeer(peerInfo);
        }
    }

    /**
     * Discover local peers (simulated for demo)
     * @private
     */
    _discoverLocalPeers() {
        // In production, this would query a signaling server
        // For demo, we'll simulate some peers
        const peers = [];
        
        // Check if there are other instances in localStorage
        const instances = this._getLocalInstances();
        for (const instance of instances) {
            if (instance.id !== this.peerId) {
                peers.push({
                    id: instance.id,
                    worldName: instance.worldName,
                    offer: null // Would contain WebRTC offer
                });
            }
        }
        
        return peers;
    }

    /**
     * Connect to a peer
     * @private
     */
    async _connectToPeer(peerInfo) {
        if (this.peers.has(peerInfo.id)) {
            return; // Already connected
        }
        
        try {
            const peer = new RTCPeerConnection({
                iceServers: this.config.iceServers
            });
            
            // Store peer connection
            this.peers.set(peerInfo.id, peer);
            peer.peerId = peerInfo.id;
            
            // Setup data channel
            const dataChannel = peer.createDataChannel('npc-sync', {
                ordered: true,
                reliable: true
            });
            
            peer.dataChannel = dataChannel;
            
            // Handle data channel events
            dataChannel.onopen = () => {
                console.log(`Data channel opened with ${peerInfo.id}`);
                peer.connectionState = 'connected';
                this.networkStats.peersConnected++;
                this.emit('peer_connected', { peerId: peerInfo.id });
            };
            
            dataChannel.onmessage = (event) => {
                this._handleMessage(event.data, peer);
            };
            
            dataChannel.onclose = () => {
                console.log(`Data channel closed with ${peerInfo.id}`);
                this._closePeer(peerInfo.id);
            };
            
            // Setup ICE candidates
            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    // In production, send candidate to peer via signaling
                }
            };
            
            // Create and set offers/answers
            if (peerInfo.offer) {
                // Answer existing offer
                await peer.setRemoteDescription(peerInfo.offer);
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                // In production, send answer via signaling
            } else {
                // Create new offer
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                // In production, send offer via signaling
            }
            
        } catch (error) {
            console.error(`Failed to connect to peer ${peerInfo.id}:`, error);
            this._closePeer(peerInfo.id);
        }
    }

    /**
     * Handle incoming message
     * @private
     */
    _handleMessage(data, peer) {
        try {
            const message = JSON.parse(data);
            
            this.networkStats.messagesReceived++;
            this.networkStats.bytesReceived += data.length;
            
            // Send acknowledgment if required
            if (message.requiresAck) {
                this._sendToPeer(peer, {
                    type: 'ack',
                    ackId: message.id,
                    from: this.peerId
                });
            }
            
            // Handle message
            const handler = this.messageHandlers.get(message.type);
            if (handler) {
                handler(message, peer);
            } else {
                // Emit as general event
                this.emit(message.type, message);
            }
            
        } catch (error) {
            console.error('Failed to handle message:', error);
        }
    }

    /**
     * Send message to peer
     * @private
     */
    _sendToPeer(peer, message) {
        if (peer.dataChannel && peer.dataChannel.readyState === 'open') {
            const data = JSON.stringify(message);
            peer.dataChannel.send(data);
            this.networkStats.bytesSent += data.length;
        } else {
            throw new Error('Data channel not open');
        }
    }

    /**
     * Close peer connection
     * @private
     */
    _closePeer(peerId) {
        const peer = this.peers.get(peerId);
        if (peer) {
            if (peer.dataChannel) {
                peer.dataChannel.close();
            }
            peer.close();
            this.peers.delete(peerId);
            this.networkStats.peersConnected--;
            this.emit('peer_disconnected', { peerId });
        }
    }

    /**
     * Start heartbeat timer
     * @private
     */
    _startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            const now = Date.now();
            
            for (const [peerId, peer] of this.peers) {
                if (peer.connectionState === 'connected') {
                    // Send heartbeat
                    try {
                        this._sendToPeer(peer, {
                            type: 'heartbeat',
                            from: this.peerId,
                            timestamp: now
                        });
                    } catch (error) {
                        console.error(`Heartbeat failed for ${peerId}`);
                    }
                    
                    // Check for timeout
                    if (peer.lastHeartbeat && now - peer.lastHeartbeat > this.config.heartbeatInterval * 2) {
                        console.warn(`Peer ${peerId} timed out`);
                        this._closePeer(peerId);
                    }
                }
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Get local instances for peer discovery
     * @private
     */
    _getLocalInstances() {
        try {
            const instances = localStorage.getItem('adaptiveNPCWeb_instances');
            if (instances) {
                const parsed = JSON.parse(instances);
                // Clean up old instances
                const recent = parsed.filter(i => 
                    Date.now() - i.timestamp < 60000 // 1 minute
                );
                return recent;
            }
        } catch (error) {
            console.error('Failed to get local instances:', error);
        }
        return [];
    }

    /**
     * Register this instance locally
     * @private
     */
    _registerInstance() {
        try {
            const instances = this._getLocalInstances();
            instances.push({
                id: this.peerId,
                worldName: this.worldName,
                timestamp: Date.now()
            });
            localStorage.setItem('adaptiveNPCWeb_instances', JSON.stringify(instances));
        } catch (error) {
            console.error('Failed to register instance:', error);
        }
    }

    /**
     * Generate unique peer ID
     * @private
     */
    _generatePeerId() {
        return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique message ID
     * @private
     */
    _generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Share NPC consciousness state
     * 
     * @param {string} npcId - NPC ID
     * @param {Object} consciousnessState - State to share
     */
    shareConsciousness(npcId, consciousnessState) {
        this.broadcast('consciousness_sync', {
            npcId,
            state: consciousnessState,
            worldName: this.worldName,
            timestamp: Date.now()
        });
    }

    /**
     * Share interaction event
     * 
     * @param {Object} interaction - Interaction to share
     */
    shareInteraction(interaction) {
        this.broadcast('interaction', {
            ...interaction,
            worldName: this.worldName,
            sharedBy: this.peerId,
            timestamp: Date.now()
        });
    }

    /**
     * Request consciousness state from peers
     * 
     * @param {string} npcId - NPC ID to request
     */
    async requestConsciousness(npcId) {
        const responses = [];
        
        for (const [peerId, peer] of this.peers) {
            if (peer.connectionState === 'connected') {
                try {
                    const response = await this.send(peerId, 'consciousness_request', {
                        npcId,
                        worldName: this.worldName
                    });
                    responses.push(response);
                } catch (error) {
                    console.error(`Failed to request from ${peerId}:`, error);
                }
            }
        }
        
        return responses;
    }
}
