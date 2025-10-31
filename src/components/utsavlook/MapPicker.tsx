
'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

// Default center to a central point in India
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

interface MapPickerProps {
    onLocationSelect: (location: { address: string; url: string; lat: number; lng: number }) => void;
}

export function MapPicker({ onLocationSelect }: MapPickerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places'],
    });

    const [map, setMap] = React.useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = React.useState(defaultCenter);
    const [searchBox, setSearchBox] = React.useState<google.maps.places.SearchBox | null>(null);
    
    const onLoad = React.useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance);
    }, []);

    const onUnmount = React.useCallback(function callback() {
        setMap(null);
    }, []);

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setMarkerPosition({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            });
        }
    };
    
    const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            setMarkerPosition({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            });
        }
    };

    const onSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
        setSearchBox(ref);
    };

    const onPlacesChanged = () => {
        if (searchBox) {
            const places = searchBox.getPlaces();
            if (places && places.length > 0) {
                const place = places[0];
                const location = place.geometry?.location;
                if (location) {
                    const newPos = { lat: location.lat(), lng: location.lng() };
                    map?.panTo(newPos);
                    map?.setZoom(17);
                    setMarkerPosition(newPos);
                }
            }
        }
    };

    const handleConfirm = () => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: markerPosition }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const address = results[0].formatted_address;
                const url = `https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`;
                onLocationSelect({
                    address: address,
                    url: url,
                    lat: markerPosition.lat,
                    lng: markerPosition.lng,
                });
            } else {
                console.error('Geocoder failed due to: ' + status);
                // Fallback if geocoding fails
                onLocationSelect({
                    address: `Lat: ${markerPosition.lat}, Lng: ${markerPosition.lng}`,
                    url: `https://www.google.com/maps/search/?api=1&query=${markerPosition.lat},${markerPosition.lng}`,
                    lat: markerPosition.lat,
                    lng: markerPosition.lng,
                });
            }
        });
    };

    if (loadError) {
        return <div>Error loading maps. Please check the API key and configuration.</div>;
    }

    return isLoaded ? (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1, width: '80%' }}>
                <StandaloneSearchBox
                    onLoad={onSearchBoxLoad}
                    onPlacesChanged={onPlacesChanged}
                >
                    <input
                        type="text"
                        placeholder="Search for your venue"
                        style={{
                            boxSizing: `border-box`,
                            border: `1px solid transparent`,
                            width: `100%`,
                            height: `40px`,
                            padding: `0 12px`,
                            borderRadius: `3px`,
                            boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                            fontSize: `14px`,
                            outline: `none`,
                            textOverflow: `ellipses`,
                        }}
                    />
                </StandaloneSearchBox>
            </div>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={5}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                <Marker 
                    position={markerPosition} 
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                />
            </GoogleMap>
             <button
                onClick={handleConfirm}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                    padding: '10px 20px',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                }}
            >
                Confirm Location
            </button>
        </div>
    ) : <div>Loading Map...</div>;
}
