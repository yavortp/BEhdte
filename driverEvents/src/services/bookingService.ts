import { parse } from 'date-fns';

export interface Booking {
    id: string;
    bookingNumber: string;
    startTime: string;
    bookingDate: string | Date;
    destination: string;
    driverId?: number | null;
    driverName?: string;
    driver?: {
        id: number;
        name: string;
        email?: string;
    };
    syncedWithApi: boolean;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    vehicleId?: number | null;
    vehicleNumber?: string;
    vehicleModel?: string;
    vehicle?: {
        id: number;
        registrationNumber: string;
        model?: string;
        brand?: string;
        color?: string;
    }
}

// Service functions - API calls

const normalizeBookingDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;

    return parse(dateStr, 'dd.MM.yyyy', new Date());
};

export const fetchBookings = async (): Promise<Booking[]> => {
    const response = await fetch(`/api/bookings`);
    if (!response.ok) throw new Error('Failed to fetch bookings');

    const rawBookings = await response.json();

    return rawBookings.map((booking: Booking) => {
        return {
            ...booking,
            bookingDate: typeof booking.bookingDate === 'string'
                ? normalizeBookingDate(booking.bookingDate)
                : booking.bookingDate,
            startTime: booking.startTime.toString(),
        };
    });

};

export const getBookingById = async (id: string): Promise<Booking> => {
    const response = await fetch(`/api/bookings/${id}`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return await response.json();
};

export const updateBooking = async (id: string, bookingData: {
    id: string;
    bookingNumber: string;
    startTime: string | null;
    bookingDate: string;
    destination: string;
    driverId?: number | null;
    driverName: string | undefined;
    driver?: { id: number; name: string; email?: string };
    syncedWithApi: boolean;
    notes: string;
    createdAt?: string;
    updatedAt?: string;
    vehicleId?: number | null;
    vehicleNumber?: string;
    vehicleModel?: string;
    vehicle?: { id: number; registrationNumber: string; model?: string; brand?: string; color?: string }
}): Promise<Booking> => {
    const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to update booking');
    return await response.json();
};

export const deleteBooking = async (id: string): Promise<void> => {
    const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete booking');
};

export const assignDriverToBooking = async (bookingId: string, driverId: string): Promise<Booking> => {
    const response = await fetch(`/api/bookings/${bookingId}/assign-driver/${driverId}`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to assign driver');
    return await response.json();
};

export const processBulkBookings = async (file: File): Promise<{ message: string; bookingsCreated: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/bookings/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) throw new Error('Failed to process file');
    return await response.json();
};

export const syncWithApi = async (bookingId: string): Promise<Booking> => {
    const response = await fetch(`/api/bookings/${bookingId}/sync`, {
        method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to sync booking');
    return await response.json();
};


