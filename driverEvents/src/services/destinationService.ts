export interface Destination {
    id: number;
    startLocation: string;
    endLocation: string;
    durationMinutes: number;
}

const BASE_URL = 'http://localhost:8080/api/destinations';

export const fetchDestinations = async (): Promise<Destination[]> => {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch destinations');
    return await response.json();
};

export const getDestinationById = async (id: number): Promise<Destination> => {
    const response = await fetch(`${BASE_URL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch destination');
    return await response.json();
};

export const createDestination = async (destinationData: {
    startLocation: string;
    endLocation: string;
    durationMinutes: number;
}): Promise<Destination> => {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationData),
    });
    if (!response.ok) throw new Error('Failed to create destination');
    return await response.json();
};

export const updateDestination = async (
    id: number,
    destinationData: {
        startLocation: string;
        endLocation: string;
        durationMinutes: number;
    }
): Promise<Destination> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationData),
    });
    if (!response.ok) throw new Error('Failed to update destination');
    return await response.json();
};

export const deleteDestination = async (id: number): Promise<void> => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete destination');
};