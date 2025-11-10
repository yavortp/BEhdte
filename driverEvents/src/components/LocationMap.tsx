import React, { useEffect, useState, useRef, useCallback } from "react";
import { locationService, LocationUpdate } from "../services/locationService";
import {MapContainer, TileLayer, Marker, Popup, useMap} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DefaultIcon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Driver {
    id: string;
    name: string;
    email: string;
}

// Default drivers locations
const defaultCenter = { lat: 42.146637, lng: 24.716829 };

interface AutoCenterProps {
    selectedDrivers: string[];
    locations: Record<string, LocationUpdate>;
}

const AutoCenter: React.FC<AutoCenterProps> = ({ selectedDrivers, locations }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedDrivers.length === 0) {
            map.setView(defaultCenter, 8);
            return;
        }

        const bounds = L.latLngBounds(
            selectedDrivers.map((email) => {
                const loc = locations[email];
                return loc
                    ? [loc.latitude, loc.longitude]
                    : [defaultCenter.lat, defaultCenter.lng];
            })
        );

        map.fitBounds(bounds, { padding: [50, 50] });
    }, [selectedDrivers, locations, map]);

    return null;
};

const LocationMap: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [locations, setLocations] = useState<Record<string, LocationUpdate>>({});

    // Track if we've connected to WebSocket (only connect ONCE)
    const isInitializedRef = useRef(false);

    // Fetch drivers list on mount (ONCE)
    useEffect(() => {
        let isMounted = true;

        fetch("/api/drivers")
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    // console.log('✅ Drivers loaded:', data.length, 'drivers');
                    setDrivers(data);
                }
            })
            .catch((err) => {
                console.error('❌ Failed to load drivers:', err);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLocationUpdate = useCallback((email: string, update: LocationUpdate) => {
        // console.log(`📍 Location update received for ${email}:`, update);

        setLocations((prev) => {
            const existing = prev[email];
            if (existing &&
                existing.latitude === update.latitude &&
                existing.longitude === update.longitude &&
                existing.timestamp === update.timestamp) {
                console.log(`⏭️ Skipping duplicate for ${email}`);
                return prev;
            }
            // console.log(`✅ Setting location for ${email}`);
            return { ...prev, [email]: update };
        });
    }, []);

    // Connect to WebSocket ONCE and subscribe to all drivers
    useEffect(() => {
        if (drivers.length === 0 || isInitializedRef.current) {
            return;
        }

        isInitializedRef.current = true;

        // Connect ONCE
        locationService.connect();

        const registeredDrivers: string[] = [];
        drivers.forEach((driver) => {
            locationService.registerCallback(
                driver.email,
                (update: LocationUpdate) => handleLocationUpdate(driver.email, update)
            );
            registeredDrivers.push(driver.email);
        });

        // console.log(`✅ Registered callbacks for ${drivers.length} drivers`);
        // Cleanup on unmount
        return () => {
            registeredDrivers.forEach((email) => {
                locationService.unregisterCallback(email);
            });
            locationService.disconnect();
            isInitializedRef.current = false;
        };
    }, [drivers]);

    const toggleDriver = useCallback((email: string) => {
        setSelectedDrivers((prev) =>
            prev.includes(email)
                ? prev.filter((d) => d !== email)
                : [...prev, email]
        );
    }, []);

    return (
        <div className="flex h-[600px]">
            {/* Sidebar with checkboxes */}
            <div className="w-64 p-4 border-r overflow-y-auto bg-white">
                <h2 className="font-semibold mb-3 text-lg">Drivers</h2>
                <div className="text-xs text-gray-500 mb-2">
                    {locationService.isConnected() ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
                {drivers.map((d) => {
                    const hasLocation = !!locations[d.email];
                    return (
                        <label
                            key={d.email}
                            className="flex items-center space-x-2 mb-2 p-1 hover:bg-gray-50 rounded cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedDrivers.includes(d.email)}
                                onChange={() => toggleDriver(d.email)}
                                className="cursor-pointer"
                            />
                            <span className="flex-1">
                                {d.name || d.email}
                            </span>
                            {hasLocation && (
                                <span className="text-green-500 text-xs">📍</span>
                            )}
                        </label>
                    );
                })}
            </div>

            {/* Map */}
            <div className="flex-1">
                <MapContainer
                    center={defaultCenter}
                    zoom={8}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />

                    <AutoCenter selectedDrivers={selectedDrivers} locations={locations} />

                    {selectedDrivers.map((email) => {
                        const loc = locations[email];
                        if (!loc) {
                            console.log(`⚠️ No location data for ${email}`);
                            return null;
                        }

                        const position = { lat: loc.latitude, lng: loc.longitude };
                        const driver = drivers.find((d) => d.email === email);

                        return (
                            <Marker key={email} position={position}>
                                <Popup>
                                    <div className="text-sm">
                                        <strong className="block mb-1">
                                            {driver?.name || email}
                                        </strong>
                                        <div className="text-gray-600 text-xs">
                                            <div>Lat: {loc.latitude.toFixed(6)}</div>
                                            <div>Lng: {loc.longitude.toFixed(6)}</div>
                                            <div className="mt-1">
                                                Last update: {new Date(loc.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

export default LocationMap;