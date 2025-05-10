// Types
export interface Vehicle {
    id: string;
    number: string;
    model: string;
    type: string;
    capacity: number;
    status: 'available' | 'in-use' | 'maintenance';
    lastMaintenance: string;
    createdAt: string;
    updatedAt: string;
}

// Mock data - would be replaced with actual API calls
const mockVehicles: Vehicle[] = [
    {
        id: '1',
        number: 'VH-001',
        model: 'Toyota Camry',
        type: 'sedan',
        capacity: 4,
        status: 'available',
        lastMaintenance: new Date(Date.now() - 86400000 * 30).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        number: 'VH-002',
        model: 'Honda Accord',
        type: 'sedan',
        capacity: 4,
        status: 'in-use',
        lastMaintenance: new Date(Date.now() - 86400000 * 15).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 300).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        number: 'VH-003',
        model: 'Ford Explorer',
        type: 'suv',
        capacity: 7,
        status: 'available',
        lastMaintenance: new Date(Date.now() - 86400000 * 7).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 240).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '4',
        number: 'VH-004',
        model: 'Mercedes Sprinter',
        type: 'van',
        capacity: 12,
        status: 'maintenance',
        lastMaintenance: new Date().toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 180).toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

// Service functions - in a real app, these would make actual API calls
export const getVehicles = async (): Promise<Vehicle[]> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockVehicles);
        }, 300);
    });
};

export const getVehicleById = async (id: string): Promise<Vehicle> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const vehicle = mockVehicles.find((v) => v.id === id);
            if (vehicle) {
                resolve(vehicle);
            } else {
                reject(new Error('Vehicle not found'));
            }
        }, 200);
    });
};

export const getAvailableVehicles = async (): Promise<Vehicle[]> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const availableVehicles = mockVehicles.filter((v) => v.status === 'available');
            resolve(availableVehicles);
        }, 300);
    });
};

export const updateVehicleStatus = async (id: string, status: 'available' | 'in-use' | 'maintenance'): Promise<Vehicle> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockVehicles.findIndex((v) => v.id === id);
            if (index !== -1) {
                mockVehicles[index] = {
                    ...mockVehicles[index],
                    status,
                    updatedAt: new Date().toISOString(),
                    ...(status === 'maintenance' ? { lastMaintenance: new Date().toISOString() } : {})
                };
                resolve(mockVehicles[index]);
            } else {
                reject(new Error('Vehicle not found'));
            }
        }, 300);
    });
};