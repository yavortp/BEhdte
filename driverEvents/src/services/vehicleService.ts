import { getApiUrl } from '../config';
export interface Vehicle {
    id: string;
    registrationNumber: string;
    brand: string;
    model: string;
    color: string;
    description: string;
    capacity: number;
    status: 'available' | 'in-use' ;
    createdAt: string;
    updatedAt: string;
}


// Service functions - API calls

export const createVehicle = async (vehicle: {
    registrationNumber: string;
    brand: string;
    model: string;
    color: string;
    description: string;
    capacity: number;
    status: 'available' | 'in-use' ;
}): Promise<Vehicle> => {
    const response = await fetch(getApiUrl(`/api/vehicles`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicle),
    });
    if (!response.ok) throw new Error("Failed to create vehicle");
    return await response.json();
};

export const getVehicles = async (): Promise<Vehicle[]> => {
    const response = await fetch(getApiUrl(`/api/vehicles`));
    if (!response.ok) throw new Error("Failed to fetch vehicles");
    const data = await response.json();

    // Map registrationNumber → number
    return data.map((vehicle: any) => ({
        ...vehicle,
        registrationNumber: vehicle.registrationNumber
    }));
};

export const getVehicleById = async (id: string): Promise<Vehicle> => {
    const response = await fetch(getApiUrl(`/api/vehicles/${id}`));
    if (!response.ok) throw new Error("Vehicle not found");
    return await response.json();

};

export const getAvailableVehicles = async (): Promise<Vehicle[]> => {
    const response = await fetch(getApiUrl(`/api/vehicles/available`));
    if (!response.ok) {
        throw new Error("Failed to fetch available vehicles");
    }
    return await response.json();

};

export const updateVehicle = async (id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> => {
    const response = await fetch(getApiUrl(`/api/vehicles/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
    });
    if (!response.ok) throw new Error('Failed to update vehicle');
    return await response.json();
};


export const updateVehicleStatus = async (id: string, status: "available" | "in-use"): Promise<Vehicle> => {
    const response = await fetch(getApiUrl(`/api/vehicles/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update vehicle");
    return await response.json();

};

export const deleteVehicle = async (id: string): Promise<void> => {
    const response = await fetch(getApiUrl(`/api/vehicles/${id}`), {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete vehicle");
};
