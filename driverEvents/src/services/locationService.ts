import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface LocationUpdate {
    driverEmail: string;
    latitude: number;
    longitude: number;
    timestamp: string;
}

class LocationService {
    private client: Client | null = null;
    private subscribers: Map<string, (update: LocationUpdate) => void> = new Map();

    connect() {
        this.client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            onConnect: () => {
                console.log('WebSocket Connected');
                // Resubscribe to all active subscriptions
                this.subscribers.forEach((callback, driverEmail) => {
                    this.subscribeToDriver(driverEmail, callback);
                });
            },
            onDisconnect: () => {
                console.log('WebSocket Disconnected');
            },
            onStompError: (frame) => {
                console.error('WebSocket Error:', frame);
            }
        });

        this.client.activate();
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
        }
    }

    subscribeToDriver(driverEmail: string, callback: (update: LocationUpdate) => void) {
        if (!this.client?.connected) {
            this.subscribers.set(driverEmail, callback);
            this.connect();
            return;
        }

        this.client.subscribe(`/topic/driver/${driverEmail}`, (message) => {
            const update = JSON.parse(message.body) as LocationUpdate;
            callback(update);
        });

        this.subscribers.set(driverEmail, callback);
    }

    unsubscribeFromDriver(driverEmail: string) {
        this.subscribers.delete(driverEmail);
        if (this.subscribers.size === 0 && this.client) {
            this.disconnect();
        }
    }
}

export const locationService = new LocationService();