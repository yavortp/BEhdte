
export interface Driver {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'available' | 'busy' | 'unavailable';
    preferredContactMethod: 'VOICE' | 'SMS' | 'WHATSAPP';
    vehicleId?: string;
    vehicles?: {
        id: string;
        registrationNumber: string;
        model: string;
    };
}

export type DriverUpdatePayload = Partial<{
    name: string;
    email: string;
    phone: string;
    status: 'available' | 'busy' | 'unavailable';
    preferredContactMethod: 'VOICE' | 'SMS' | 'WHATSAPP';
    vehicles?: { id: string } | null;
}>;

// Service functions -  API calls

export const createDriver = async (data: Driver): Promise<Driver> => {
    const response = await fetch('http://localhost:8080/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create driver');
    return await response.json();
};

export const getDrivers = async (): Promise<Driver[]> => {
    const response = await fetch("http://localhost:8080/api/drivers");
    if (!response.ok) throw new Error("Failed to fetch drivers");
    const data = await response.json();

    return data as Driver[];
};

// export const getDriverById = async (id: string): Promise<Driver> => {
//
// };
//
// export const getAvailableDrivers = async (): Promise<Driver[]> => {
//
// };

export const updateDriver = async (id: string, payload: DriverUpdatePayload): Promise<Driver> => {
    const response = await fetch(`http://localhost:8080/api/drivers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to update driver');
    return await response.json();
};

export const deleteDriver = async (id: string): Promise<void> => {
    const response = await fetch(`http://localhost:8080/api/drivers/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete driver');
};
