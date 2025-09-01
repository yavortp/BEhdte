import React, { useEffect, useState } from "react";
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

    return null; // This component only affects the map
};

const LocationMap: React.FC = () => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [locations, setLocations] = useState<Record<string, LocationUpdate>>({});

    // Fetch drivers list on mount
    useEffect(() => {
        fetch("/api/drivers") // your backend endpoint
            .then((res) => res.json())
            .then(setDrivers);
    }, []);

    // Subscribe to drivers
    useEffect(() => {

        drivers.forEach((driver) => {
            locationService.subscribeToDriver(driver.email, (update: LocationUpdate) => {
                setLocations((prev) => ({ ...prev, [driver.email]: update }));
            });
        });

        // cleanup: unsubscribe when component unmounts or drivers list changes
        return () => {
            drivers.forEach((driver) => {
                locationService.unsubscribeFromDriver(driver.email);
            });
        };
    }, [drivers]);

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