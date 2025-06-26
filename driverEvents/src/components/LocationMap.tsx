import React, { useEffect, useRef, useState } from 'react';
import { locationService, LocationUpdate } from '../services/locationService';

interface LocationMapProps {
    driverEmail: string;
    width?: string;
    height?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({
                                                     driverEmail,
                                                     width = '100%',
                                                     height = '400px'
                                                 }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [location, setLocation] = useState<LocationUpdate | null>(null);

    useEffect(() => {
        const handleLocationUpdate = (update: LocationUpdate) => {
            setLocation(update);
            // Here you would update the map with the new location
            // Using your preferred mapping library (e.g., Google Maps, Mapbox)
        };

        locationService.subscribeToDriver(driverEmail, handleLocationUpdate);

        return () => {
            locationService.unsubscribeFromDriver(driverEmail);
        };
    }, [driverEmail]);

    return (
        <div className="rounded-lg overflow-hidden shadow-lg">
            <div
                ref={mapRef}
                style={{ width, height }}
                className="bg-gray-100 flex items-center justify-center"
            >
                {location ? (
                    <div className="text-center">
                        <p className="text-gray-600">
                            Last Update: {new Date(location.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-gray-600">
                            Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500">Waiting for location updates...</p>
                )}
            </div>
        </div>
    );
};

export default LocationMap;