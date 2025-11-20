'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Reading } from '@/lib/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  readings: Reading[];
}

export default function MapView({ readings }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  // Calculate center of all readings
  const center: [number, number] = readings.length > 0
    ? [
        readings.reduce((sum, r) => sum + r.location.lat, 0) / readings.length,
        readings.reduce((sum, r) => sum + r.location.lon, 0) / readings.length,
      ]
    : [11.0, 76.9];

  const getMarkerColor = (aqi: number): string => {
    if (aqi <= 50) return 'green';
    if (aqi <= 100) return 'yellow';
    if (aqi <= 150) return 'orange';
    return 'red';
  };

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: '500px', width: '100%' }}
      className="rounded-lg shadow-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {readings.map((reading) => (
        <Marker
          key={reading._id}
          position={[reading.location.lat, reading.location.lon]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">{reading.nodeId}</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>AQI:</strong>{' '}
                  <span
                    className={`font-medium ${
                      reading.aqi.value <= 50
                        ? 'text-green-600'
                        : reading.aqi.value <= 100
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {reading.aqi.value} ({reading.aqi.category})
                  </span>
                </p>
                <p>
                  <strong>PM2.5:</strong> {reading.sensors.pm25} μg/m³
                </p>
                <p>
                  <strong>Temperature:</strong> {reading.sensors.temp}°C
                </p>
                {reading.hedera && (
                  <p className="mt-2 pt-2 border-t border-gray-200">
                    <strong>Hedera:</strong>{' '}
                    <a
                      href={`https://hashscan.io/testnet/topic/${reading.hedera.topicId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      View Proof
                    </a>
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}