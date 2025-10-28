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

    const subscriptionsRef = useRef<Set<string>>(new Set());
    const isSubscribingRef = useRef(false);

    // Fetch drivers list on mount
    useEffect(() => {
        let isMounted = true;

        fetch("/api/drivers")
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    setDrivers(data);
                }
            })
            .catch((err) => {
                console.error("Failed to load drivers:", err);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLocationUpdate = useCallback((email: string, update: LocationUpdate) => {
        setLocations((prev) => {
            // Only update if the location actually changed
            const existing = prev[email];
            if (existing &&
                existing.latitude === update.latitude &&
                existing.longitude === update.longitude &&
                existing.timestamp === update.timestamp) {
                return prev; // No change, return same object to prevent re-render
            }
            return { ...prev, [email]: update };
        });
    }, []);

    // Subscribe to drivers
    useEffect(() => {

        if (isSubscribingRef.current || drivers.length === 0) {
            return;
        }

        isSubscribingRef.current = true;

        drivers.forEach((driver) => {
            if (!subscriptionsRef.current.has(driver.email)) {
                console.log(`Subscribing to driver: ${driver.email}`);

                locationService.subscribeToDriver(
                    driver.email,
                    (update: LocationUpdate) => handleLocationUpdate(driver.email, update)
                );

                subscriptionsRef.current.add(driver.email);
            }
        });

        isSubscribingRef.current = false;

        // cleanup: unsubscribe when component unmounts or drivers list changes
        return () => {
            console.log("Unsubscribing from all drivers");
            subscriptionsRef.current.forEach((email) => {
                locationService.unsubscribeFromDriver(email);
            });
            subscriptionsRef.current.clear();
        };
    }, [drivers, handleLocationUpdate]);

    const toggleDriver = (email: string) => {
        setSelectedDrivers((prev) =>
            prev.includes(email) ? prev.filter((d) => d !== email) : [...prev, email]
        );
    };

    return (
        <div className="flex h-[600px]">
            {/* Sidebar with checkboxes */}
            <div className="w-64 p-4 border-r overflow-y-auto">
                <h2 className="font-semibold mb-2">Drivers</h2>
                {drivers.map((d) => (
                    <label key={d.email} className="flex items-center space-x-2 mb-1">
                        <input
                            type="checkbox"
                            checked={selectedDrivers.includes(d.email)}
                            onChange={() => toggleDriver(d.email)}
                        />
                        <span>{d.name || d.email}</span>
                    </label>
                ))}
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
                        const position = loc
                            ? { lat: loc.latitude, lng: loc.longitude }
                            : defaultCenter; // fallback if no location yet
                        // const loc = locations[email];
                        // if (!loc) return null; // Don't show marker if no location yet
                        //
                        // const position = { lat: loc.latitude, lng: loc.longitude };
                        // const driver = drivers.find((d) => d.email === email);
                        return (
                            <Marker key={email} position={position}>
                                <Popup>
                                    <strong>{drivers.find((d) => d.email === email)?.name || email}</strong>
                                    <br />
                                    {loc
                                        ? `Last update: ${new Date(loc.timestamp).toLocaleTimeString()}`
                                        : "No location yet"}
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