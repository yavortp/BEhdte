import axios from 'axios';
import { toast } from 'react-toastify';

// This would be replaced with your actual API base URL
const API_BASE_URL = 'https://api.example.com/v1';

// Types
export interface Booking {
    id: string;
    bookingNumber: string;
    startTime: string;
    destination: string;
    driverId: string | null;
    driverName?: string;
    vehicleId: string | null;
    vehicleNumber?: string;
    vehicleModel?: string;
    syncedWithApi: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Mock data - would be replaced with actual API calls
const mockBookings: Booking[] = [
    {
        id: '1',
        bookingNumber: 'BK-001',
        startTime: new Date().toISOString(),
        destination: 'Airport',
        driverId: '1',
        driverName: 'John Doe',
        vehicleId: '1',
        vehicleNumber: 'VH-001',
        vehicleModel: 'Toyota Camry',
        syncedWithApi: true,
        notes: 'VIP customer',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        bookingNumber: 'BK-002',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        destination: 'Downtown',
        driverId: '2',
        driverName: 'Jane Smith',
        vehicleId: '2',
        vehicleNumber: 'VH-002',
        vehicleModel: 'Honda Accord',
        syncedWithApi: false,
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        bookingNumber: 'BK-003',
        startTime: new Date(Date.now() + 7200000).toISOString(),
        destination: 'Conference Center',
        driverId: null,
        vehicleId: null,
        syncedWithApi: false,
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Service functions - in a real app, these would make actual API calls
export const fetchBookings = async (): Promise<Booking[]> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockBookings);
        }, 500);
    });
};

export const getBookingById = async (id: string): Promise<Booking> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const booking = mockBookings.find((b) => b.id === id);
            if (booking) {
                resolve(booking);
            } else {
                reject(new Error('Booking not found'));
            }
        }, 300);
    });
};

export const updateBooking = async (id: string, bookingData: Partial<Booking>): Promise<Booking> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = mockBookings.findIndex((b) => b.id === id);
            if (index !== -1) {
                mockBookings[index] = {
                    ...mockBookings[index],
                    ...bookingData,
                    updatedAt: new Date().toISOString(),
                };
                resolve(mockBookings[index]);
            }
        }, 500);
    });
};

export const deleteBooking = async (id: string): Promise<void> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const index = mockBookings.findIndex((b) => b.id === id);
            if (index !== -1) {
                mockBookings.splice(index, 1);
            }
            resolve();
        }, 500);
    });
};

export const assignDriverToBooking = async (bookingId: string, driverId: string): Promise<Booking> => {
    // Simulate API call to get driver details (would come from driver service)
    const driverName = driverId === '1' ? 'John Doe' : driverId === '2' ? 'Jane Smith' : 'Driver ' + driverId;

    return updateBooking(bookingId, {
        driverId,
        driverName,
        syncedWithApi: false, // Mark as needing sync after update
    });
};

export const assignVehicleToBooking = async (bookingId: string, vehicleId: string): Promise<Booking> => {
    // Simulate API call to get vehicle details (would come from vehicle service)
    const vehicleNumber = vehicleId === '1' ? 'VH-001' : vehicleId === '2' ? 'VH-002' : 'VH-' + vehicleId;
    const vehicleModel = vehicleId === '1' ? 'Toyota Camry' : vehicleId === '2' ? 'Honda Accord' : 'Vehicle ' + vehicleId;

    return updateBooking(bookingId, {
        vehicleId,
        vehicleNumber,
        vehicleModel,
        syncedWithApi: false, // Mark as needing sync after update
    });
};

export const syncBookingWithApi = async (bookingId: string): Promise<Booking> => {
    // Get the booking
    const booking = await getBookingById(bookingId);

    // Check if the booking has all required fields
    if (!booking.driverId || !booking.vehicleId) {
        throw new Error('Booking must have a driver and vehicle assigned before syncing');
    }

    // In a real app, this would make a PUT request to the external API
    try {
        // Simulate API call
        // const response = await axios.put(`${API_BASE_URL}/bookings/${bookingId}`, booking);

        // Update local booking to mark as synced
        return updateBooking(bookingId, {
            syncedWithApi: true,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error syncing booking with API:', error);
        throw new Error('Failed to sync booking with external API');
    }
};

export const processBulkBookings = async (bookings: any[]): Promise<{ successCount: number; failedCount: number }> => {
    // Simulate API call to process multiple bookings
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, this would send the data to the backend
            // and handle validation, database insertion, etc.

            // For demo purposes, we'll just generate some mock results
            const successCount = Math.floor(bookings.length * 0.9); // 90% success rate
            const failedCount = bookings.length - successCount;

            // Add the bookings to our mock data
            for (let i = 0; i < successCount; i++) {
                const newBooking: Booking = {
                    id: (mockBookings.length + i + 1).toString(),
                    bookingNumber: `BK-${100 + mockBookings.length + i}`,
                    startTime: bookings[i].startTime || new Date(Date.now() + 3600000 * (i + 1)).toISOString(),
                    destination: bookings[i].destination || 'Unknown',
                    driverId: bookings[i].driverId || null,
                    driverName: bookings[i].driverId ? `Driver ${bookings[i].driverId}` : undefined,
                    vehicleId: bookings[i].vehicleId || null,
                    vehicleNumber: bookings[i].vehicleId ? `VH-${bookings[i].vehicleId}` : undefined,
                    syncedWithApi: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                mockBookings.push(newBooking);
            }

            resolve({ successCount, failedCount });
        }, 1500);
    });
};