import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, User, Phone, Mail,
     Edit, Trash2, Save, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
    getDrivers,
    updateDriver,
    Driver,
    createDriver,
    deleteDriver,
    DriverUpdatePayload
} from '../services/driverService';
import {getVehicles, Vehicle} from "../services/vehicleService.ts";

interface DriverFormData {
    name: string;
    email: string;
    phone: string;
    status: 'available' | 'busy' | 'unavailable';
    vehicleId?: string;
    preferredContactMethod: 'VOICE' | 'SMS' | 'WHATSAPP';
}



const Drivers: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormData>();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const loadDrivers = async () => {

        try {
            setIsLoading(true);
            const data = await getDrivers();
            setDrivers(data);
        } catch (error) {
            toast.error('Failed to load drivers');
            console.error("Error loading drivers:", error);
        } finally {
            setIsLoading(false);
        }
    };
    const loadVehicles = async () => {

        try {
            const data = await getVehicles(); // assuming you have a getVehicles() service function
            setVehicles(data);
        } catch (error) {
            toast.error('Failed to load vehicles');
            console.error(error);
        }
    };

    useEffect(() => {
        loadDrivers();
        loadVehicles();
    }, []);

    useEffect(() => {
        filterDrivers();
    }, [drivers, searchTerm, statusFilter]);

    useEffect(() => {
        fetch('/api/vehicles')
            .then(res => res.json())
            .then(data => setVehicles(data))
            .catch(err => console.error('Failed to load vehicles', err));
    }, []);


    const filterDrivers = () => {
        let filtered = [...drivers];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(driver =>
                driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                driver.phone.includes(searchTerm)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(driver => driver.status === statusFilter);
        }

        setFilteredDrivers(filtered);
    };

    const handleStatusChange = async (driverId: string, newStatus: "available" | "busy" | "unavailable") => {
        try {
            await updateDriver(driverId, { status: newStatus } );
            toast.success('Driver status updated successfully');
            await loadDrivers();
        } catch (error) {
            toast.error('Failed to update driver status');
            console.error(`Failed to update status for driver ${driverId}:`, error);
        }
    };

    const handleEdit = (driver: Driver) => {
        setEditingId(driver.id);
        reset({
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            status: driver.status,
            vehicleId: driver.vehicles?.id?.toString() || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        reset();
    };

    const handleAddNew = () => {
        setShowAddForm(true);
        reset({
            name: '',
            email: '',
            phone: '',
            status: 'available',
            vehicleId: '',
        });
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        reset();
    };

    const onSubmit = async (data: DriverFormData) => {
        try {
            if (editingId) {
                    const updatePayload: DriverUpdatePayload = {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    status: data.status,
                        ...(data.vehicleId ? { vehicles: { id: data.vehicleId } } : {}),
                    preferredContactMethod: data.preferredContactMethod,
                };
                await updateDriver(editingId, updatePayload);
                toast.success('Driver updated successfully');
                setEditingId(null);
            } else {
                const createPayload = {
                    ...data,
                    ...(data.vehicleId ? { vehicles: { id: data.vehicleId } } : {}),
                };
                await createDriver(createPayload as Driver);
                toast.success('Driver added successfully');
                setShowAddForm(false);
            }
            reset();
            await loadDrivers();
        } catch (error) {
            toast.error(editingId ? 'Failed to update driver' : 'Failed to add driver');
            console.error(error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete driver ${name}? This action cannot be undone.`)) {
            try {
                await deleteDriver(id);
                toast.success('Driver deleted successfully');
                await loadDrivers();
            } catch (error) {
                toast.error('Failed to delete driver');
                console.error(error);
            }
        }
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
                <h2 className="text-2xl font-bold text-gray-800">Drivers Management</h2>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                </button>
            </div>

            {/* Add Driver Form */}
            {showAddForm && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add New Driver</h3>
                        <button
                            onClick={handleCancelAdd}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register('name', { required: 'Name is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Invalid email address'
                                        }
                                    })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                    <span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    {...register('phone', { required: 'Phone number is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">
                                    Preferred Contact Method<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <select
                                    id="preferredContactMethod"
                                    {...register('preferredContactMethod', { required: 'Contact method is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="VOICE">Voice</option>
                                    <option value="SMS">SMS</option>
                                    <option value="WHATSAPP">WhatsApp</option>
                                </select>
                                {errors.preferredContactMethod && (
                                    <p className="mt-1 text-sm text-red-600">{errors.preferredContactMethod.message}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">
                                    Assign Vehicle
                                </label>
                                <select
                                    {...register('vehicleId')}
                                    id="vehicleId"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                >
                                    <option value="">— Select a vehicle —</option>
                                    {vehicles.map(vehicle => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.registrationNumber} — {vehicle.brand} {vehicle.model}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    {...register('status')}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                >
                                    <option value="available">Available</option>
                                    <option value="busy">Busy</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCancelAdd}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Save className="h-4 w-4 mr-2 inline" />
                                Add Driver
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                                placeholder="Search drivers..."
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
                            <option value="available">Available</option>
                            <option value="busy">Busy</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
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
                <p className="text-sm text-gray-600">
                    Showing {filteredDrivers.length} of {drivers.length} drivers
                </p>
            </div>

            {/* Drivers Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Driver
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Assigned Vehicle
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDrivers.map((driver) => (
                            <tr key={driver.id} className="hover:bg-gray-50">
                                {editingId === driver.id ? (
                                    <td colSpan={6} className="px-6 py-4">
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...register('name', { required: 'Name is required' })}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        placeholder="Full Name"
                                                    />
                                                    {errors.name && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        {...register('email', { required: 'Email is required' })}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        placeholder="Email"
                                                    />
                                                    {errors.email && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone Number
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        {...register('phone', { required: 'Phone is required' })}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        placeholder="Phone"
                                                    />
                                                    {errors.phone && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Vehicle
                                                    </label>
                                                    <select
                                                        {...register('vehicleId')}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    >
                                                        <option value="">— Select Vehicle —</option>
                                                        {vehicles.map((vehicle) => (
                                                            <option key={vehicle.id} value={vehicle.id}>
                                                                {vehicle.registrationNumber} ({vehicle.model})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors.vehicleId && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.vehicleId.message}</p>
                                                    )}
                                                </div>

                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-3 py-1 border border-transparent rounded text-sm text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </form>
                                    </td>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <Mail className="h-4 w-4 mr-1 text-gray-400" />
                                                    <span>{driver.email}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                                    <span>{driver.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {driver.preferredContactMethod}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={driver.status}
                                                onChange={(e) => handleStatusChange(driver.id, e.target.value as any)}
                                                className="text-sm border-0 bg-transparent focus:ring-0 focus:border-0"
                                            >
                                                <option value="available">Available</option>
                                                <option value="busy">Busy</option>
                                                <option value="unavailable">Unavailable</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {driver.vehicles
                                                ? `${driver.vehicles.registrationNumber} (${driver.vehicles.model})`
                                                : '—'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(driver)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(driver.id, driver.name)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredDrivers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No drivers found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Get started by adding a new driver'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <div className="mt-6">
                                <button
                                    onClick={handleAddNew}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Driver
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Drivers;