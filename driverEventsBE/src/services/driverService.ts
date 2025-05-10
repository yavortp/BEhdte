// Types
export interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    licenseNumber: string;
    status: 'available' | 'busy' | 'unavailable';
    createdAt: string;
    updatedAt: string;
}

// Mock data - would be replaced with actual API calls
const mockDrivers: Driver[] = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        licenseNumber: 'DL-123456',
        status: 'available',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        licenseNumber: 'DL-654321',
        status: 'busy',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '3',
        name: 'Michael Johnson',
        email: 'michael.johnson@example.com',
        phone: '+1122334455',
        licenseNumber: 'DL-112233',
        status: 'available',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '4',
        name: 'Sarah Williams',
        email: 'sarah.williams@example.com',
        phone: '+1555667788',
        licenseNumber: 'DL-556677',
        status: 'unavailable',
        createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

// Service functions - in a real app, these would make actual API calls
export const getDrivers = async (): Promise<Driver[]> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockDrivers);
        }, 300);
    });
};

export const getDriverById = async (id: string): Promise<Driver> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const driver = mockDrivers.find((d) => d.id === id);
            if (driver) {
                resolve(driver);
            } else {
                reject(new Error('Driver not found'));
            }
        }, 200);
    });
};

export const getAvailableDrivers = async (): Promise<Driver[]> => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const availableDrivers = mockDrivers.filter((d) => d.status === 'available');
            resolve(availableDrivers);
        }, 300);
    });
};

export const updateDriverStatus = async (id: string, status: 'available' | 'busy' | 'unavailable'): Promise<Driver> => {
    // Simulate API call
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = mockDrivers.findIndex((d) => d.id === id);
            if (index !== -1) {
                mockDrivers[index] = {
                    ...mockDrivers[index],
                    status,
                    updatedAt: new Date().toISOString(),
                };
                resolve(mockDrivers[index]);
            } else {
                reject(new Error('Driver not found'));
            }
        }, 300);
    });
};