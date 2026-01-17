'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../utils/api';

const busIcon = new L.Icon({
    iconUrl: '/map_otobus.svg',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [1, -34]
});

function MapUpdater({ center, routeId }: { center: [number, number], routeId: string }) {
    const map = useMap();
    const lastRouteIdRef = useRef(routeId);

    useEffect(() => {
        if (lastRouteIdRef.current !== routeId) {
            // Route changed: Force Zoom 12
            map.setView(center, 12);
            lastRouteIdRef.current = routeId;
        } else {
            // Location update: Maintain Zoom
            map.setView(center, map.getZoom());
        }
    }, [center, map, routeId]);
    return null;
}

export default function TrackingMap({ routeId }: { routeId: string }) {
    const [location, setLocation] = useState<any>(null);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const markerRef = useRef<L.Marker>(null);

    const fetchLocation = async () => {
        if (!routeId) return;
        try {
            const { data } = await api.get(`/tracking/location/${routeId}`);
            if (data) {
                setLocation(data);
                setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
            }
        } catch (error) {
            console.error('Konum alınamadı:', error);
        }
    };

    useEffect(() => {
        if (routeId) {
            setLocation(null); // Reset location on route change
            fetchLocation();
            const interval = setInterval(fetchLocation, 15000); 
            return () => clearInterval(interval);
        }
    }, [routeId]);

    useEffect(() => {
        if (markerRef.current && location) {
            markerRef.current.openPopup();
        }
    }, [location]);

    const center: [number, number] = location ? [location.lat, location.lng] : [39.0, 35.0];
    const zoom = 12; // Default prop for container

    return (
        <div className="relative h-full w-full">
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    maxZoom={20}
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    attribution='&copy; Google Maps'
                />
                
                {location && (
                    <Marker position={[location.lat, location.lng]} icon={busIcon} ref={markerRef}>
                        <Popup>
                            <div style={{ textAlign: 'left', fontFamily: 'Arial' }}>
                                <b>Plaka:</b> {location.plate || '61 AU 600'}<br/>
                                <b>Hız:</b> {location.speed}
                            </div>
                        </Popup>
                    </Marker>
                )}
                
                <MapUpdater center={center} routeId={routeId} />
            </MapContainer>

            {location && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm font-medium text-blue-900 border border-blue-100">
                    ✓ Son güncelleme: {lastUpdate}
                </div>
            )}
        </div>
    );
}