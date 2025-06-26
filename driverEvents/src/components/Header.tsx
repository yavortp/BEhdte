import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, Bell, Settings, Menu } from 'lucide-react';

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <header className="bg-white shadow-sm z-10">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button
                            type="button"
                            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800 hidden md:block">Booking Management System</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link to="/upload" className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                            <Upload size={16} className="mr-2" />
                            <span>Upload</span>
                        </Link>

                        <button className="p-1 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                            <Bell size={20} />
                        </button>

                        <button className="p-1 rounded-full text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                            <Settings size={20} />
                        </button>

                        <div className="ml-3 relative">
                            <div>
                                <button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span className="inline-flex h-8 w-8 rounded-full bg-blue-500 items-center justify-center">
                    <span className="text-sm font-medium text-white">JD</span>
                  </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;