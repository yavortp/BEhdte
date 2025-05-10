// @ts-ignore
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Truck, User, Clock, MapPin, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Booking } from '../services/bookingService';

interface BookingListProps {
    bookings: Booking[];
    showActions?: boolean;
}

const BookingList: React.FC<BookingListProps> = ({ bookings, showActions = false }) => {
    if (bookings.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No bookings found.</p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => (
                <li key={booking.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <Link to={`/bookings/${booking.id}`} className="block">
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                        booking.syncedWithApi ? 'bg-green-100' : 'bg-blue-100'
                                    }`}>
                                        {booking.syncedWithApi ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <div className="flex items-center">
                                            <p className="text-sm font-medium text-gray-900">
                                                Booking #{booking.bookingNumber}
                                            </p>
                                            {booking.syncedWithApi && (
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Synced
                        </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                          {format(new Date(booking.startTime), 'MMM d, yyyy h:mm a')}
                      </span>
                                            <span>•</span>
                                            <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                                                {booking.destination}
                      </span>
                                        </div>
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
    );
};

export default BookingList;