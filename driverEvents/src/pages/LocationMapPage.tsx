import React from "react";
import LocationMap from "../components/LocationMap";

const LocationMapPage: React.FC = () => {
    return (
        <div className="p-4">
            <h1 className="text-xl font-semibold mb-4">Driver Location Map</h1>
            <LocationMap />
        </div>
    );
};

export default LocationMapPage;
