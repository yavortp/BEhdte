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
    private subscriptions: Map<string, StompSubscription> = new Map();
    private pendingCallbacks: Map<string, (update: LocationUpdate) => void> = new Map();

    connect() {
        // Don't reconnect if already connected
        if (this.client?.connected) {
            return;
        }

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

                // Resubscribe to all pending subscriptions
                this.pendingCallbacks.forEach((callback, driverEmail) => {
                    this.subscribeToDriver(driverEmail, callback);
                });
                this.pendingCallbacks.clear();
            },

            onDisconnect: () => {
                console.log('WebSocket Disconnected');
            },

            onStompError: (frame) => {
                console.error('❌ WebSocket Error:', frame.headers['message']);
            },

            debug: (str) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('STOMP:', str);
                }
            }
        });

        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            // Unsubscribe from all
            this.subscriptions.forEach((sub) => sub.unsubscribe());
            this.subscriptions.clear();

            this.client.deactivate();
            this.client = null;
            console.log('WebSocket disconnected');
        }
    }

    subscribeToDriver(driverEmail: string, callback: (update: LocationUpdate) => void) {
        if (this.subscriptions.has(driverEmail)) {
            console.log(`Already subscribed to: ${driverEmail}`);
            return;
        }

        // If not connected, store callback and connect
        if (!this.client?.connected) {
            this.pendingCallbacks.set(driverEmail, callback);
            this.connect();
            return;
        }

        try {
            const topic = `/topic/location/${driverEmail}`;

            const subscription = this.client.subscribe(topic, (message) => {
                try {
                    console.log('📥 MESSAGE RECEIVED:', message.body);
                    const update = JSON.parse(message.body) as LocationUpdate;
                    console.log(`Location update received for ${driverEmail}:`, update);
                    callback(update);
                } catch (error) {
                    console.error('Failed to parse location update:', error);
                }
            });

            this.subscriptions.set(driverEmail, subscription);
            console.log(`✅ Subscribed to driver: ${driverEmail} on topic: ${topic}`);

        } catch (error) {
            console.error(`Failed to subscribe to ${driverEmail}:`, error);
        }
    }

    unsubscribeFromDriver(driverEmail: string) {
        const subscription = this.subscriptions.get(driverEmail);

        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(driverEmail);
            console.log(`Unsubscribed from driver: ${driverEmail}`);
        }

        // Remove from pending callbacks if exists
        this.pendingCallbacks.delete(driverEmail);

        // Disconnect if no more subscriptions
        if (this.subscriptions.size === 0 && this.pendingCallbacks.size === 0 && this.client) {
            this.disconnect();
        }
    }

    // Helper to check connection status
    isConnected(): boolean {
        return this.client?.connected || false;
    }

    // Get active subscription count
    getActiveSubscriptions(): number {
        return this.subscriptions.size;
    }
}

export const locationService = new LocationService();