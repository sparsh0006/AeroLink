'use client';

import { useEffect, useState } from 'react';
import { Reading } from '@/lib/api';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  readings: Reading[];
}

export default function MapView({ readings }: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Marker: any;
    Popup: any;
    L: any;
  } | null>(null);

  // mark component as mounted (for safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // lazy-load leaflet + react-leaflet ONLY in the browser
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    (async () => {
      try {
        // dynamically import leaflet
        const L = (await import('leaflet')).default;

        // fix default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:
            'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // dynamically import react-leaflet components
        const RL = await import('react-leaflet');

        if (!cancelled) {
          setLeafletComponents({
            MapContainer: RL.MapContainer,
            TileLayer: RL.TileLayer,
            Marker: RL.Marker,
            Popup: RL.Popup,
            L,
          });
          setLeafletReady(true);
        }
      } catch (err) {
        console.error('Failed to load Leaflet/react-leaflet', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  // simple loading skeleton before leaflet is ready
  if (!mounted || !leafletReady || !LeafletComponents) {
    return (
      <div className="w-full h-[500px] bg-zinc-900 rounded-lg flex items-center justify-center border border-yellow-500/20">
        <p className="text-zinc-300">Loading map...</p>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = LeafletComponents;

  // Calculate center of all readings
  const center: [number, number] =
    readings.length > 0
      ? [
          readings.reduce((sum, r) => sum + r.location.lat, 0) /
            readings.length,
          readings.reduce((sum, r) => sum + r.location.lon, 0) /
            readings.length,
        ]
      : [11.0, 76.9];

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
                        ? 'text-green-500'
                        : reading.aqi.value <= 100
                        ? 'text-yellow-400'
                        : 'text-red-500'
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
                  <p className="mt-2 pt-2 border-t border-zinc-700">
                    <strong>Hedera:</strong>{' '}
                    <a
                      href={`https://hashscan.io/testnet/topic/${reading.hedera.topicId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:underline"
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
