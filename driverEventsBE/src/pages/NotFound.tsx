// @ts-ignore
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-9xl font-extrabold text-gray-300">404</h2>
                    <h2 className="mt-2 text-3xl font-bold text-gray-900">Page Not Found</h2>
                    <p className="mt-2 text-md text-gray-600">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>
                <div className="flex justify-center space-x-4">
                    <Link
                        to="/"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Home className="h-5 w-5 mr-2" />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;