
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

// Service functions - API calls
export const fetchBookings = async (): Promise<Booking[]> => {
    const response = await fetch('http://localhost:8080/api/bookings');
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return await response.json();
};

export const getBookingById = async (id: string): Promise<Booking> => {
    const response = await fetch(`http://localhost:8080/api/bookings/${id}`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return await response.json();
};

export const updateBooking = async (id: string, bookingData: Partial<Booking>): Promise<Booking> => {
    const response = await fetch(`http://localhost:8080/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to update booking');
    return await response.json();
};

export const deleteBooking = async (id: string): Promise<void> => {
    const response = await fetch(`http://localhost:8080/api/bookings/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete booking');
};

export const assignDriverToBooking = async (bookingId: string, driverId: string): Promise<Booking> => {
    const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/assign-driver/${driverId}`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to assign driver');
    return await response.json();
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

export const processBulkBookings = async (file: File): Promise<{ message: string; bookingsCreated: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8080/api/bookings/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) throw new Error('Failed to process file');
    return await response.json();
};

export const syncWithApi = async (bookingId: string): Promise<Booking> => {
    const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}/sync`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sync booking');
    return await response.json();
};

