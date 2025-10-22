import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {format, isValid, parse} from 'date-fns';
import {
    Plus, Search, Filter, Calendar, MapPin, User, Truck,
    CheckCircle, XCircle, AlertTriangle, Trash2, Eye
} from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchBookings, deleteBooking, Booking } from '../services/bookingService';

const Bookings: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);            // change bookings per page here!!!

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const res = await fetch(`/api/bookings?page=${page}&size=${pageSize}`);

                if (!res.ok) {
                    const errorText = await res.text(); // Read raw response
                    console.error(`Server error ${res.status}:`, errorText);
                    return;
                }

                const data = await res.json();
                setBookings(data);
            } catch (err) {
                console.error('Fetch failed:', err);
            }
        };

        loadBookings();
    }, [page]);

    useEffect(() => {
        loadBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, searchTerm, statusFilter, dateFilter]);

    const loadBookings = async () => {
        try {
            setIsLoading(true);
            const data = await fetchBookings();
            setBookings(data);
        } catch (error) {
            toast.error('Failed to load bookings');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBookingSelection = (id: string) => {
        setSelectedBookings(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedBookings.length === sortedBookings.length) {
            setSelectedBookings([]);
        } else {
            setSelectedBookings(sortedBookings.map(b => b.id));
        }
    };

    const normalizeBookingDate = (dateStr: unknown): Date | null => {
        if (!dateStr) return null;
        if (dateStr instanceof Date) {
            return dateStr;
        }
        if (typeof dateStr === 'string') {
            const parsed = parse(dateStr, 'dd.MM.yyyy', new Date());
            return isValid(parsed) ? parsed : null;
        }
        return null;
    };

    // 1. Group bookings by date, then sort by time within each date
    const groupedSortedBookings: Record<string, Booking[]> = {};

    filteredBookings.forEach((booking) => {
        const normalizedDate = normalizeBookingDate(booking.bookingDate);

        const dateKey = normalizedDate
            ? format(normalizedDate, 'dd.MM.yyyy') // consistent string for grouping
            : 'Unknown';

        if (!groupedSortedBookings[dateKey]) {
            groupedSortedBookings[dateKey] = [];
        }

        groupedSortedBookings[dateKey].push({
            ...booking,
            bookingDate: normalizedDate, // optional: keep normalized for later use
        });
    });

// 2. Sort each date's bookings by start time
    Object.keys(groupedSortedBookings).forEach((dateKey) => {
        groupedSortedBookings[dateKey].sort((a, b) => {
            const aTime = a.startTime || '00:00:00';
            const bTime = b.startTime || '00:00:00';
            return aTime.localeCompare(bTime);
        });
    });

// 3. Flatten into one sorted array, by date then time
    const sortedBookings = Object.keys(groupedSortedBookings)
        .sort((a, b) => {
            const aDate = groupedSortedBookings[a][0]?.bookingDate
                ? new Date(groupedSortedBookings[a][0].bookingDate).getTime()
                : 0;
            const bDate = groupedSortedBookings[b][0]?.bookingDate
                ? new Date(groupedSortedBookings[b][0].bookingDate).getTime()
                : 0;
            return aDate - bDate; // ascending
        })
        .flatMap((dateKey) => groupedSortedBookings[dateKey]);

    const filterBookings = () => {
        let filtered = [...bookings];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(booking =>
                booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                booking.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            switch (statusFilter) {
                case 'synced':
                    filtered = filtered.filter(booking => booking.syncedWithApi);
                    break;
                case 'unsynced':
                    filtered = filtered.filter(booking => !booking.syncedWithApi);
                    break;
                case 'assigned':
                    filtered = filtered.filter(booking => booking.driverId && booking.vehicleId);
                    break;
                case 'unassigned':
                    filtered = filtered.filter(booking => !booking.driverId || !booking.vehicleId);
                    break;
            }
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            switch (dateFilter) {
                case 'today':
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.startTime);
                        return bookingDate >= today && bookingDate < tomorrow;
                    });
                    break;
                case 'upcoming':
                    filtered = filtered.filter(booking => new Date(booking.startTime) > now);
                    break;
                case 'this-week':
                    filtered = filtered.filter(booking => {
                        const bookingDate = new Date(booking.startTime);
                        return bookingDate >= today && bookingDate < weekFromNow;
                    });
                    break;
                case 'past':
                    filtered = filtered.filter(booking => new Date(booking.startTime) < now);
                    break;
            }
        }

        setFilteredBookings(filtered);
    };

    const handleSyncSelected = async () => {
        if (selectedBookings.length === 0) {
            toast.warning('Please select at least one booking to sync');
            return;
        }

        try {
            const response = await fetch('/api/bookings/actions/bulk-sync', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedBookings.map(id => parseInt(id)))
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Sync failed');
            }

            const result = await response.json();
            console.log('Bulk sync result:', result);

            if (result.failedCount > 0) {
                toast.warning(
                    `Synced ${result.syncedCount} of ${result.totalCount} booking(s). ` +
                    `${result.failedCount} failed - check logs for details.`,
                    { autoClose: 5000 }
                );
            } else {
                toast.success(`Successfully synced all ${result.syncedCount} booking(s)`);
            }

            loadBookings(); // Refresh list
            setSelectedBookings([]); // Clear selection
        } catch (error) {
            toast.error(`Failed to sync bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Sync error: ', error);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedBookings.length === 0) {
            toast.warning('Please select at least one booking to delete');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedBookings.length} booking(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch('/api/bookings/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedBookings.map(id => parseInt(id)))
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || `Delete failed with status ${response.status}`);
            }

            toast.success('Bookings deleted successfully');
            loadBookings(); // Refresh list
            setSelectedBookings([]); // Clear selection
        } catch (error) {
            toast.error(`Failed to delete bookings: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Delete error:', error);
        }
    };

    const handleDelete = async (id: string, bookingNumber: string) => {
        if (window.confirm(`Are you sure you want to delete booking ${bookingNumber}? This action cannot be undone.`)) {
            try {
                await deleteBooking(id);
                toast.success('Booking deleted successfully');
                loadBookings();
            } catch (error) {
                toast.error('Failed to delete booking');
                console.error(error);
            }
        }
    };

    const getStatusBadge = (booking: Booking) => {
        if (booking.syncedWithApi) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Synced
        </span>
            );
        }
        if (booking.driverId && booking.vehicleId) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Ready to Sync
        </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <XCircle className="h-3 w-3 mr-1" />
        Incomplete
      </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Bookings Management</h2>
                <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Bookings
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                id="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search bookings..."
                                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="synced">Synced</option>
                            <option value="unsynced">Not Synced</option>
                            <option value="assigned">Fully Assigned</option>
                            <option value="unassigned">Incomplete Assignment</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                        </label>
                        <select
                            id="date-filter"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="this-week">This Week</option>
                            <option value="past">Past</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setDateFilter('all');
                            }}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Summary */}
            <div className="bg-white shadow rounded-lg p-4">
                {/*<p className="text-sm text-gray-600">*/}
                {/*    Showing {filteredBookings.length} of {bookings.length} bookings; */}
                {/*</p>*/}
                <p style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontStyle: 'italic',
                    color: '#666'
                }}>
                    <span>Showing: {filteredBookings.length} of {bookings.length} bookings</span>
                    <span>Sorted by date, then by time ⏳</span>
                </p>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center space-x-2 mb-4">
                <button
                    onClick={() => handleSyncSelected()}
                    disabled={selectedBookings.length === 0}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Sync Selected
                </button>
                <button
                    onClick={() => handleDeleteSelected()}
                    disabled={selectedBookings.length === 0}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Delete Selected
                </button>

                {/* Selection Count */}
                {selectedBookings.length > 0 && (
                    <div className="text-sm text-gray-600">
                        {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
                    </div>
                )}

            </div>



            {/* Bookings Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="w-12 px-2 py-3 text-center">
                                <input
                                    type="checkbox"
                                    onChange={toggleSelectAll}
                                    checked={selectedBookings.length === sortedBookings.length}
                                    className="form-checkbox h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Booking
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Schedule
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Assignment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {sortedBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                                <td className="w-8 px-2 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedBookings.includes(booking.id)}
                                        onChange={() => toggleBookingSelection(booking.id)}
                                        className="form-checkbox h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-xl font-semibold text-gray-900">
                                            {booking.bookingNumber}
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            <span className="mr-1">Destination:</span>
                                            {booking.destination.toUpperCase()}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        <div>
                                            <div>{booking.bookingDate && !isNaN(Date.parse(booking.bookingDate))
                                                ? format(new Date(booking.bookingDate), 'dd MMM yyyy')
                                                : '—'}</div>
                                            <div className="text-gray-500">
                                                {booking.startTime
                                                    ? booking.startTime.slice(0, 5) // display type - "20:00"
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                        {booking.driver ? (
                                            <div className="flex items-center text-sm text-gray-700">
                                                <User className="h-4 w-4 mr-1 text-gray-400" />
                                                <span>{booking.driver.name}</span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          No Driver
                        </span>
                                        )}
                                        {booking.vehicle ? (
                                            <div className="flex items-center text-sm text-gray-700">
                                                <Truck className="h-4 w-4 mr-1 text-gray-400" />
                                                <span>{booking.vehicle.registrationNumber}</span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          No Vehicle
                        </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(booking)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <Link
                                            to={`/bookings/${booking.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="View Details"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(booking.id, booking.bookingNumber)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Previous Page
                    </button>
                    <span>Page {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                        Next Page
                    </button>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Get started by uploading some bookings'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && dateFilter === 'all' && (
                            <div className="mt-6">
                                <Link
                                    to="/upload"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Upload Bookings
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Bookings;