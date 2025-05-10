// @ts-ignore
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ChevronRight, Truck, User, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fetchBookings, Booking } from '../services/bookingService';
import BookingList from '../components/BookingList';
import StatusCard from '../components/StatusCard';

const Dashboard: React.FC = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadBookings = async () => {
            try {
                setIsLoading(true);
                const data = await fetchBookings();
                setBookings(data);
            } catch (err) {
                setError('Failed to load bookings. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadBookings();
    }, []);

    // Calculate dashboard statistics
    const totalBookings = bookings.length;
    const pendingAssignments = bookings.filter(b => !b.driverId || !b.vehicleId).length;
    const upcomingBookings = bookings.filter(b => new Date(b.startTime) > new Date()).length;
    const syncedBookings = bookings.filter(b => b.syncedWithApi).length;

    const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.startTime);
        const today = new Date();
        return (
            bookingDate.getDate() === today.getDate() &&
            bookingDate.getMonth() === today.getMonth() &&
            bookingDate.getFullYear() === today.getFullYear()
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    Upload Bookings
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <StatusCard
                            title="Total Bookings"
                            value={totalBookings}
                            icon={<Clock className="h-6 w-6 text-blue-500" />}
                            bgColor="bg-blue-50"
                            textColor="text-blue-700"
                        />
                        <StatusCard
                            title="Pending Assignments"
                            value={pendingAssignments}
                            icon={<AlertCircle className="h-6 w-6 text-amber-500" />}
                            bgColor="bg-amber-50"
                            textColor="text-amber-700"
                        />
                        <StatusCard
                            title="Upcoming Bookings"
                            value={upcomingBookings}
                            icon={<MapPin className="h-6 w-6 text-purple-500" />}
                            bgColor="bg-purple-50"
                            textColor="text-purple-700"
                        />
                        <StatusCard
                            title="Synced with API"
                            value={syncedBookings}
                            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
                            bgColor="bg-green-50"
                            textColor="text-green-700"
                        />
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Bookings</h3>
                        </div>
                        {todayBookings.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <p className="text-gray-500">No bookings scheduled for today.</p>
                                <Link to="/upload" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                                    Upload Bookings
                                </Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {todayBookings.map((booking) => (
                                    <li key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <Link to={`/bookings/${booking.id}`} className="block">
                                            <div className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Clock className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                Booking #{booking.bookingNumber}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {format(new Date(booking.startTime), 'h:mm a')} • {booking.destination}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex flex-col items-end">
                                                            {booking.driverId ? (
                                                                <div className="flex items-center text-sm text-gray-700">
                                                                    <User className="h-4 w-4 mr-1" />
                                                                    <span>{booking.driverName}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                  No Driver
                                </span>
                                                            )}
                                                            {booking.vehicleId ? (
                                                                <div className="flex items-center text-sm text-gray-700">
                                                                    <Truck className="h-4 w-4 mr-1" />
                                                                    <span>{booking.vehicleNumber}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                                  No Vehicle
                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Bookings</h3>
                            <Link to="/bookings" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                View all
                            </Link>
                        </div>
                        <BookingList bookings={bookings.slice(0, 5)} />
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;