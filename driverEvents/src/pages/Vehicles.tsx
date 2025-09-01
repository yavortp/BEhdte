import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Filter, Truck, CheckCircle, AlertTriangle, Edit, Trash2, Save, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import {
    createVehicle,
    deleteVehicle,
    getVehicles,
    updateVehicle,
    updateVehicleStatus,
    Vehicle
} from '../services/vehicleService';

interface VehicleFormData {
    registrationNumber: string;
    model: string;
    brand: string;
    color: string;
    description: string;
    capacity: number;
    status: 'available' | 'in-use' ;
}

const Vehicles: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');


    const { register, handleSubmit, reset, formState: { errors} } = useForm<VehicleFormData>();

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        getVehicles()
            .then((data) => setVehicles(data))
            .catch((err) => console.error("Fetch error:", err));
    }, []);

    useEffect(() => {
        filterVehicles();
    }, [vehicles, searchTerm, statusFilter, typeFilter]);


    const loadVehicles = async () => {
        try {
            setIsLoading(true);
            const data = await getVehicles();
            setVehicles(data);
        } catch (error) {
            toast.error('Failed to load vehicles');
            console.error("Error loading vehicles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterVehicles = () => {
        let filtered = [...vehicles];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(vehicle => {
                if (!vehicle) return false;
                const desc = vehicle.description || '';
                return (
                    vehicle.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    desc.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(vehicle => vehicle?.status === statusFilter);
        }

        // Type filter
        if (typeFilter.trim() !== '' && typeFilter !== 'all') {
            const keywords = typeFilter.toLowerCase().split(' ');
            filtered = filtered.filter(vehicle => {
                const desc = vehicle.description ?? '';
                return keywords.every(kw => desc.toLowerCase().includes(kw));
            });
        }

        setFilteredVehicles(filtered);
    };

    const handleStatusChange = async (vehicleId: string, newStatus: 'available' | 'in-use') => {
        try {
            await updateVehicleStatus(vehicleId, newStatus);
            toast.success('Vehicle status updated successfully');
            await loadVehicles();
        } catch (error) {
            toast.error('Failed to update vehicle status');
            console.error(error);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingId(vehicle.id);
        reset({
            registrationNumber: vehicle.registrationNumber,
            model: vehicle.model,
            brand: vehicle.brand,
            color: vehicle.color,
            description: vehicle.description,
            capacity: vehicle.capacity,
            status: vehicle.status,
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        reset();
    };

    const handleAddNew = () => {
        setShowAddForm(true);
        reset({
            registrationNumber: '',
            model: '',
            brand: '',
            color: '',
            description: 'sedan',
            capacity: 4,
            status: 'available',
        });
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        reset();
    };

    const onSubmit = async (data: VehicleFormData) => {
        try {
            if (editingId) {
                await updateVehicle(editingId, data); // update existing vehicle
                toast.success('Vehicle updated');
            } else {
                await createVehicle(data); // create new vehicle
                toast.success('Vehicle saved');
            }

            setEditingId(null);
            setShowAddForm(false);
            reset();
            await loadVehicles();
        } catch (error) {
            toast.error('Failed to save vehicle');
            console.error(error);
        }
    };


    const handleDelete = async (id: string, registrationNumber: string) => {
        if (window.confirm(`Are you sure you want to delete vehicle ${registrationNumber}? This action cannot be undone.`)) {
            try {
                // In a real app, this would call a delete API
                // toast.success('Vehicle deleted successfully');
                await deleteVehicle(id);
                toast.success(`Vehicle ${registrationNumber} deleted`);
                await loadVehicles();
            } catch (error) {
                toast.error('Failed to delete vehicle');
                console.error(error);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </span>
                );
            case 'in-use':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            In Use
          </span>
                );
            default:
                return null;
        }
    };

    const getTypeIcon = (type: string | null) => {
        const normalizedType = type?.toLowerCase() ?? 'unknown';

        switch (normalizedType) {
            case 'truck':
                return <Truck className="h-5 w-5 text-gray-600" />;
            // case 'car':
            //     return <Car className="h-5 w-5 text-gray-600" />;
            // case 'bus':
            //     return <Bus className="h-5 w-5 text-gray-600" />;
            // case 'bike':
            //     return <Bike className="h-5 w-5 text-gray-600" />;
            default:
                return <Truck className="h-5 w-5 text-gray-400" />; // fallback icon
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
                <h2 className="text-2xl font-bold text-gray-800">Vehicles Management</h2>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                </button>
            </div>

            {/* Add Vehicle Form */}
            {showAddForm && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add New Vehicle</h3>
                        <button
                            onClick={handleCancelAdd}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
                                    Vehicle Reg Number
                                </label>
                                <input
                                    type="text"
                                    id="registrationNumber"
                                    {...register('registrationNumber', { required: 'Vehicle reg number is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.registrationNumber && (
                                    <p className="mt-1 text-sm text-red-600">{errors.registrationNumber.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    id="brand"
                                    {...register('brand', { required: 'Vehicle brand is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="e.g. Toyota"
                                />

                            </div>

                            <div>
                                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                                    Model
                                </label>
                                <input
                                    type="text"
                                    id="model"
                                    {...register('model', { required: 'Model is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.model && (
                                    <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                                    Color
                                </label>
                                <input
                                    type="text"
                                    id="color"
                                    {...register('color', { required: 'Vehicle color is required' })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="e.g. White"
                                />
                            </div>

                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                    Type
                                </label>
                                <input
                                    type="text"
                                    id="type"
                                    {...register('description', { required: 'Type is required' })}
                                    placeholder="Enter vehicle type"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                                    Capacity
                                </label>
                                <input
                                    type="number"
                                    id="capacity"
                                    min="1"
                                    {...register('capacity', {
                                        required: 'Capacity is required',
                                        min: { value: 1, message: 'Capacity must be at least 1' }
                                    })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                {errors.capacity && (
                                    <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                                )}
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
                                    <option value="in-use">In Use</option>
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
                                Add Vehicle
                            </button>
                        </div>
                    </form>
                </div>
            )}

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
                                placeholder="Search vehicles..."
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
                            <option value="in-use">In Use</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <input
                            type="text"
                            value={vehicleTypeFilter}
                            onChange={(e) => setVehicleTypeFilter(e.target.value)}
                            placeholder="Filter by type (e.g. SUV, Truck)"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setTypeFilter('all');
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
                    Showing {filteredVehicles.length} of {vehicles.length} vehicles
                </p>
            </div>

            {/* Vehicles Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vehicle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reg. Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            {/*<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">*/}
                            {/*    Added*/}
                            {/*</th>*/}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVehicles.map((vehicle) => (
                            <tr key={vehicle.id} className="hover:bg-gray-50">
                                {editingId === vehicle.id ? (
                                    <td colSpan={6} className="px-6 py-4">
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        {...register('registrationNumber', { required: 'Vehicle reg number is required' })}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        placeholder="Vehicle Number"
                                                    />
                                                    {errors.registrationNumber && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.registrationNumber.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        {...register('model', { required: 'Model is required' })}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        placeholder="Model"
                                                    />
                                                    {errors.model && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.model.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        id="type"
                                                        {...register('description', { required: 'Type is required' })}
                                                        placeholder="Enter vehicle type"
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        {...register('capacity', { required: 'Capacity is required' })}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                        placeholder="Capacity"
                                                    />
                                                    {errors.capacity && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                                                    )}
                                                </div>
                                                <div>Status: {getStatusBadge(vehicle.status)}</div>
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
                                                    {getTypeIcon(vehicle.description ?? '')}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm text-gray-500">{vehicle.brand + ' ' + vehicle.model}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-900">
                                                    Type: <span className="font-medium capitalize">{vehicle.description ?? 'Unknown'}</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {vehicle.capacity} passengers
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-900">
                                                    Licence: <span className="inline-block px-2 py-1 text-base font-semibold text-blue-700 bg-blue-100 rounded">{vehicle.registrationNumber}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={vehicle.status}
                                                onChange={(e) => handleStatusChange(vehicle.id, e.target.value as any)}
                                                className="text-sm border-0 bg-transparent focus:ring-0 focus:border-0"
                                            >
                                                <option value="available">Available</option>
                                                <option value="in-use">In Use</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEdit(vehicle)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(vehicle.id, vehicle.registrationNumber)}
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

                {filteredVehicles.length === 0 && (
                    <div className="text-center py-12">
                        <Truck className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicles found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Get started by adding a new vehicle'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                            <div className="mt-6">
                                <button
                                    onClick={handleAddNew}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Vehicle
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Vehicles;