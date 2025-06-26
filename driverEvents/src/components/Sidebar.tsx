import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Truck, Users, FileSpreadsheet, Settings, HelpCircle } from 'lucide-react';

const Sidebar: React.FC = () => {
    return (
        <aside className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-600">TransportManager</h2>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Home size={20} className="mr-3 flex-shrink-0" />
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/upload"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <FileSpreadsheet size={20} className="mr-3 flex-shrink-0" />
                            File Upload
                        </NavLink>

                        <div className="pt-4 pb-2">
                            <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Resources
                            </div>
                        </div>

                        <NavLink
                            to="/bookings"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Calendar size={20} className="mr-3 flex-shrink-0" />
                            Bookings
                        </NavLink>

                        <NavLink
                            to="/drivers"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Users size={20} className="mr-3 flex-shrink-0" />
                            Drivers
                        </NavLink>

                        <NavLink
                            to="/vehicles"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Truck size={20} className="mr-3 flex-shrink-0" />
                            Vehicles
                        </NavLink>

                        <div className="pt-4 pb-2">
                            <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Configuration
                            </div>
                        </div>

                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <Settings size={20} className="mr-3 flex-shrink-0" />
                            Settings
                        </NavLink>

                        <NavLink
                            to="/help"
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <HelpCircle size={20} className="mr-3 flex-shrink-0" />
                            Help & Support
                        </NavLink>
                    </nav>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;