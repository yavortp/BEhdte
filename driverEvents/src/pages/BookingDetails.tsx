import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {format, parse} from 'date-fns';
import {
    Clock, MapPin, Truck, User, Calendar, CheckCircle, XCircle, AlertTriangle,
    Edit, Trash2, ArrowLeft, Save, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
    getBookingById,
    updateBooking,
    deleteBooking,
    // assignDriverToBooking,
    // assignVehicleToBooking,
    syncWithApi,
    Booking
} from '../services/bookingService';
import { getDrivers, Driver } from '../services/driverService';
import { getVehicles, Vehicle } from '../services/vehicleService';
import LocationMap from '../components/LocationMap';

const BookingDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const normalizeBookingTime = (timeStr: string | null | undefined): string | null => {
        if (!timeStr) return null;
        try {
            const [h, m] = timeStr.split(':');
            if (h && m) return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        } catch {
            return null;
        }
        return null;
    };

    const normalizeBookingDate = (dateStr: string | null | undefined): string | null => {
        if (!dateStr) return null;
        try {
            const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
            return format(parsed, 'dd.MM.yyyy'); // backend expects dd.MM.yyyy
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                if (!id) {
                    setError('Booking ID is missing');
                    return;
                }

                const bookingData = await getBookingById(id);
                setBooking(bookingData);

                // Load drivers and vehicles for assignment
                const driversData = await getDrivers();
                const vehiclesData = await getVehicles();
                setDrivers(driversData);
                setVehicles(vehiclesData);

                // Initialize form with current values
                reset({
                    destination: bookingData.destination,
                    startTime: normalizeBookingTime(bookingData.startTime),
                    bookingDate: normalizeBookingDate(bookingData.bookingDate),
                    driverId: bookingData.driverId || 'error',
                    vehicleId: bookingData.vehicleId || '',
                    notes: bookingData.notes || '',
                });
            } catch (err) {
                setError('Failed to load booking details. Please try again later.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, reset]);

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
        // Reset form to current booking values
        if (booking) {
            reset({
                destination: booking.destination,
                startTime: normalizeBookingTime(booking.startTime),
                bookingDate: normalizeBookingDate(booking.bookingDate),
                driverId: booking.driverId || '',
                vehicleId: booking.vehicleId || '',
                notes: booking.notes || '',
            });
        }
    };

    const onSubmit = async (data: any) => {
        if (!booking || !id) return;

        setIsSaving(true);
        try {

            let selectedDriver = null;
            let driverName = booking.driverName;

            if (data.driverId && data.driverId !== booking.driverId?.toString()) {
                selectedDriver = drivers.find((d) => d.id.toString() === data.driverId.toString());
                if (selectedDriver) {
                    driverName = selectedDriver.name;
                }
            }

            const formattedBookingDate = data.bookingDate
                ? format(parse(data.bookingDate, 'dd/MM/yyyy', new Date()), 'dd.MM.yyyy')
                : booking.bookingDate;

            const updatedBooking = await updateBooking(id, {
                ...booking,
                destination: data.destination.toUpperCase(),
                startTime: normalizeBookingTime(data.startTime),
                bookingDate: formattedBookingDate,
                driverName: driverName,
                notes: data.notes || '',
                syncedWithApi: false, // Mark as needing sync after update
            });

            setBooking(updatedBooking);
            setEditMode(false);
            toast.success('Booking updated successfully');
        } catch (err) {
            toast.error('Failed to update booking');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSync = async () => {
        if (!booking || !id) return;

        setIsSyncing(true);
        try {
            const updatedBooking = await syncWithApi(id);
            setBooking(updatedBooking);
            toast.success('Booking synchronized with API');
        } catch (err) {
            toast.error('Failed to synchronize booking with API');
            console.error(err);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (!booking || !id) return;

        if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
            setIsDeleting(true);
            try {
                await deleteBooking(id);
                toast.success('Booking deleted successfully');
                navigate('/');
            } catch (err) {
                toast.error('Failed to delete booking');
                console.error(err);
                setIsDeleting(false);
            }
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error || 'Booking not found'}</p>
                        <button
                            onClick={handleBack}
                            className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </button>
                    <h2 className="ml-4 text-2xl font-bold text-gray-800">
                        Booking #{booking.bookingNumber}
                    </h2>
                    {booking.syncedWithApi ? (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Synced
            </span>
                    ) : (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Not Synced
            </span>
                    )}
                </div>
                <div className="flex space-x-3">
                    {!editMode ? (
                        <>
                            <button
                                onClick={handleEdit}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                {isDeleting ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500 mr-1"></div>
                                        Deleting...
                                    </div>
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </>
                                )}
                            </button>
                            {!booking.syncedWithApi && (
                                <button
                                    onClick={handleSync}
                                    disabled={isSyncing}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {isSyncing ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                                            Syncing...
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Sync with API
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={isSaving}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {isSaving ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                                        Saving...
                                    </div>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-1" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {editMode ? (
                    <div className="px-4 py-5 sm:p-6">
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                                        Start Time (HH:mm)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="startTime"
                                            placeholder="HH:mm"
                                            {...register('startTime', {
                                                pattern: {
                                                    value: /^([01]\d|2[0-3]):([0-5]\d)$/,
                                                    message: 'Time must be in HH:mm format (24h)',
                                                },
                                            })}
                                            className="border border-gray-300 rounded-md shadow-sm w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"

                                        />
                                        {errors.startTime && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.startTime.message as string}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">
                                        Booking Date (dd/MM/yyyy)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="bookingDate"
                                            placeholder="dd/MM/yyyy"
                                            {...register('bookingDate', {
                                                pattern: {
                                                    value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
                                                    message: 'Date must be in DD/MM/YYYY format',
                                                },
                                            })}
                                            className="border border-gray-300 rounded-md shadow-sm w-full px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 focus:border-blue-500 sm:text-sm"
                                        />
                                        {errors.bookingDate && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.bookingDate.message as string}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                                        Destination
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            id="destination"
                                            {...register('destination', { required: 'Destination is required' })}
                                            className="border border-gray-300 rounded-md shadow-sm w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"

                                        />
                                        {errors.destination && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.destination.message as string}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="driverId" className="block text-sm font-medium text-gray-700">
                                        Driver
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="driverId"
                                            {...register('driverId')}
                                            className="border border-gray-300 rounded-md shadow-sm w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"

                                        >
                                            <option value="">-- Select Driver --</option>
                                            {drivers.map((driver) => (
                                                <option key={driver.id} value={driver.id}>
                                                    {driver.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                        Notes
                                    </label>
                                    <div className="mt-1">
                    <textarea
                        id="notes"
                        {...register('notes')}
                        rows={3}
                        className="border border-gray-300 rounded-md shadow-sm w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"

                        placeholder="Add any additional notes about this booking..."
                    />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Booking Details</h3>
                                <div className="mt-5 border-t border-gray-200">
                                    <dl className="divide-y divide-gray-200">
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                Booking Number
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {booking.bookingNumber}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                Start Time
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {booking.startTime
                                                    ? booking.startTime.slice(0, 5) // display type - "20:00"
                                                    : '—'}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                Destination
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                {booking.destination.toUpperCase()}
                                            </dd>
                                        </div>
                                        {booking.notes && (
                                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                                    {booking.notes}
                                                </dd>
                                            </div>
                                        )}
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500">API Status</dt>
                                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                                {booking.syncedWithApi ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Synced
                          </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Synced
                          </span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Assignment</h3>
                                <div className="mt-5 border-t border-gray-200">
                                    <dl className="divide-y divide-gray-200">
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                                Driver
                                            </dt>
                                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                                {booking.driverName ? (
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                                            {booking.driverName.charAt(0) || 'Driver Name?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{booking.driverName}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                              No Driver Assigned
                            </span>
                                                    </div>
                                                )}
                                            </dd>
                                        </div>
                                        <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center">
                                                <Truck className="h-4 w-4 mr-2 text-gray-400" />
                                                Vehicle
                                            </dt>
                                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                                                {booking.vehicleNumber ? (
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                                            <Truck className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{booking.vehicleNumber || 'missing'}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                              No Vehicle Assigned
                            </span>
                                                    </div>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {!editMode && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Booking Timeline</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <ul className="space-y-4">
                            <li className="relative pb-4">
                                <div className="absolute left-0 top-0 ml-px mr-0 w-0.5 h-full bg-gray-200"></div>
                                <div className="relative flex items-start group">
                  <span className="h-9 flex items-center">
                    <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full">
                      <Calendar className="h-5 w-5 text-white" />
                    </span>
                  </span>
                                    <div className="min-w-0 flex-1 ml-4">
                                        <div className="text-sm font-medium text-gray-900">Booking Created</div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {format(new Date(booking.createdAt || booking.startTime), 'PPP p')}
                                        </p>
                                    </div>
                                </div>
                            </li>

                            {booking.driverId && (
                                <li className="relative pb-4">
                                    <div className="absolute left-0 top-0 ml-px mr-0 w-0.5 h-full bg-gray-200"></div>
                                    <div className="relative flex items-start group">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-green-600 rounded-full">
                        <User className="h-5 w-5 text-white" />
                      </span>
                    </span>
                                        <div className="min-w-0 flex-1 ml-4">
                                            <div className="text-sm font-medium text-gray-900">Driver Assigned</div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {booking.driverName} was assigned to this booking
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )}

                            {booking.vehicleId && (
                                <li className="relative pb-4">
                                    <div className="absolute left-0 top-0 ml-px mr-0 w-0.5 h-full bg-gray-200"></div>
                                    <div className="relative flex items-start group">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-green-600 rounded-full">
                        <Truck className="h-5 w-5 text-white" />
                      </span>
                    </span>
                                        <div className="min-w-0 flex-1 ml-4">
                                            <div className="text-sm font-medium text-gray-900">Vehicle Assigned</div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Vehicle {booking.vehicleNumber} was assigned to this booking
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )}

                            {booking.syncedWithApi && (
                                <li className="relative">
                                    <div className="relative flex items-start group">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-purple-600 rounded-full">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </span>
                    </span>
                                        <div className="min-w-0 flex-1 ml-4">
                                            <div className="text-sm font-medium text-gray-900">Synchronized with API</div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                The booking was successfully sent to the external API
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )}

                            {!booking.syncedWithApi && (booking.driverId && booking.vehicleId) && (
                                <li className="relative">
                                    <div className="relative flex items-start group">
                    <span className="h-9 flex items-center">
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-gray-300 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-gray-600" />
                      </span>
                    </span>
                                        <div className="min-w-0 flex-1 ml-4">
                                            <div className="text-sm font-medium text-gray-900">Ready to Synchronize</div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                The booking is ready to be synchronized with the external API
                                            </p>
                                            <button
                                                onClick={handleSync}
                                                disabled={isSyncing}
                                                className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                {isSyncing ? (
                                                    <div className="flex items-center">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                                                        Syncing...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="h-4 w-4 mr-1" />
                                                        Sync Now
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {booking && booking.driverId && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Live Location Tracking
                        </h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <LocationMap driverEmail={booking.driverName} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingDetails;