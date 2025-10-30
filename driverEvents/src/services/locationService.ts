import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface LocationUpdate {
    email: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

class LocationService {
    private client: Client | null = null;
    private globalSubscription: StompSubscription | null = null;
    private callbacks: Map<string, (update: LocationUpdate) => void> = new Map();
    private isConnecting = false;

    connect() {
        // Don't reconnect if already connected
        if (this.client?.connected || this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        this.client = new Client({
            webSocketFactory: () => new SockJS('/ws', null, {
                // Disable JSONP transport to avoid warnings
                transports: ['websocket', 'xhr-streaming', 'xhr-polling']
            }),

            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log('✅ WebSocket Connected');

                this.isConnecting = false;

                // Subscribe to the SINGLE topic that receives ALL driver updates
                this.subscribeToAllDrivers();
            },

            onDisconnect: () => {
                console.log('WebSocket Disconnected');
                this.isConnecting = false;
                this.globalSubscription = null;
            },

            onStompError: (frame) => {
                console.error('❌ WebSocket Error:', frame.headers['message']);
                this.isConnecting = false;
            },

            debug: (str) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('STOMP:', str);
                }
            }
        });

        this.client.activate();
    }

    private subscribeToAllDrivers() {
        if (!this.client?.connected) {
            console.error('Cannot subscribe: client not connected');
            return;
        }

        if (this.globalSubscription) {
            console.log('Already subscribed to /topic/location');
            return;
        }

        try {
            // Subscribe to the single topic that receives ALL driver location updates
            const topic = '/topic/location';

            console.log(`🔔 Subscribing to topic: ${topic}`);

            this.globalSubscription = this.client.subscribe(topic, (message) => {
                console.log('📥 RAW MESSAGE RECEIVED:', message);
                console.log('📥 MESSAGE BODY:', message.body);
                try {
                    const update = JSON.parse(message.body) as LocationUpdate;
                    console.log('📍 PARSED Location update:', update);
                    console.log('   - Email:', update.email);
                    console.log('   - Lat/Lng:', update.latitude, update.longitude);
                    console.log('   - Timestamp:', update.timestamp);
                    console.log('📍 Location update received:', update);

                    // Call the callback for this specific driver
                    const callback = this.callbacks.get(update.email);
                    if (callback) {
                        console.log(`✅ Calling callback for driver: ${update.email}`);
                        callback(update);
                    } else {
                        console.log(`No callback registered for driver: ${update.email}`);
                    }
                } catch (error) {
                    console.error('Failed to parse location update:', error, message.body);
                }
            });

            console.log(`✅ Subscribed to ${topic} for ALL drivers`);

        } catch (error) {
            console.error('Failed to subscribe to location updates:', error);
        }
    }

    registerCallback(driverEmail: string, callback: (update: LocationUpdate) => void) {
        console.log(`📝 Registering callback for driver: ${driverEmail}`);
        this.callbacks.set(driverEmail, callback);

        // Connect if not already connected
        if (!this.client?.connected && !this.isConnecting) {
            this.connect();
        }
    }

    unregisterCallback(driverEmail: string) {
        console.log(`🗑️ Unregistering callback for driver: ${driverEmail}`);
        this.callbacks.delete(driverEmail);
    }

    disconnect() {
        if (this.client) {
            // Unsubscribe from the global topic
            if (this.globalSubscription) {
                this.globalSubscription.unsubscribe();
                this.globalSubscription = null;
            }

            this.callbacks.clear();
            this.client.deactivate();
            this.client = null;
            this.isConnecting = false;
            console.log('🔌 WebSocket fully disconnected');
        }
    }

    // Helper to check connection status
    isConnected(): boolean {
        return this.client?.connected || false;
    }

    getActiveCallbacks(): number {
        return this.callbacks.size;
    }
}

export const locationService = new LocationService();