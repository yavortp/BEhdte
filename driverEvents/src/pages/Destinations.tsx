import React, { useEffect, useState } from 'react';
import {
    fetchDestinations,
    createDestination,
    updateDestination,
    deleteDestination,
    Destination,
} from '../services/destinationService';
import {Save, X,  Plus} from 'lucide-react';

const Destinations: React.FC = () => {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<{ startLocation: string; endLocation: string; durationMinutes: number }>({
        startLocation: '',
        endLocation: '',
        durationMinutes: 0,
    });
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        loadDestinations();
    }, []);

    const loadDestinations = async () => {
        try {
            const data = await fetchDestinations();
            setDestinations(data);
        } catch (error) {
            console.error('Error loading destinations:', error);
        }
    };

    const handleAddNew = () => {
        setShowAddForm(true);
        setEditingId(null);
        setForm({ startLocation: '', endLocation: '', durationMinutes: 0 });
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setForm({ startLocation: '', endLocation: '', durationMinutes: 0 });
    };

    const startEdit = (destination: Destination) => {
        setEditingId(destination.id);
        setShowAddForm(false);
        setForm({
            startLocation: destination.startLocation,
            endLocation: destination.endLocation,
            durationMinutes: destination.durationMinutes,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ startLocation: '', endLocation: '', durationMinutes: 0 });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId !== null) {
                await updateDestination(editingId, form);
            } else {
                await createDestination(form);
            }
            cancelEdit();
            handleCancelAdd();
            loadDestinations();
        } catch (error) {
            console.error('Error saving destination:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Delete this destination?')) {
            try {
                await deleteDestination(id);
                loadDestinations();
            } catch (error) {
                console.error('Error deleting destination:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Destinations Management</h2>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Destination
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Add New Destination</h3>
                        <button onClick={handleCancelAdd} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label htmlFor="startLocation" className="block text-sm font-medium text-gray-700">
                                    Start Location<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="startLocation"
                                    value={form.startLocation}
                                    onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                                    required
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="endLocation" className="block text-sm font-medium text-gray-700">
                                    End Location<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="endLocation"
                                    value={form.endLocation}
                                    onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
                                    required
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700">
                                    Duration (minutes)<span className="text-red-500 ml-0.5">*</span>
                                </label>
                                <input
                                    type="number"
                                    id="durationMinutes"
                                    value={form.durationMinutes}
                                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                                    required
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
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
                                Add Destination
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Start Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                End Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duration (min)
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {destinations.map((dest) => (
                            <tr key={dest.id} className="hover:bg-gray-50">
                                {editingId === dest.id ? (
                                    <td colSpan={4} className="px-6 py-4">
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                <input
                                                    type="text"
                                                    value={form.startLocation}
                                                    onChange={(e) => setForm({ ...form, startLocation: e.target.value })}
                                                    required
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Start Location"
                                                />
                                                <input
                                                    type="text"
                                                    value={form.endLocation}
                                                    onChange={(e) => setForm({ ...form, endLocation: e.target.value })}
                                                    required
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="End Location"
                                                />
                                                <input
                                                    type="number"
                                                    value={form.durationMinutes}
                                                    onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                                                    required
                                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                    placeholder="Duration (minutes)"
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dest.startLocation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dest.endLocation}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dest.durationMinutes}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => startEdit(dest)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dest.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Destinations;