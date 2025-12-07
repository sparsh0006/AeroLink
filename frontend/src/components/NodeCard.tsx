'use client';

import { Reading } from '@/lib/api';
import { useState } from 'react';

interface NodeCardProps {
  reading: Reading;
}

export default function NodeCard({ reading }: NodeCardProps) {
  const [showModal, setShowModal] = useState(false);

  const getAQIColor = (category: string) => {
    switch (category) {
      case 'Good':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/60';
      case 'Moderate':
        return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/60';
      case 'Unhealthy for Sensitive Groups':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/60';
      case 'Unhealthy':
        return 'bg-red-500/10 text-red-300 border-red-500/60';
      default:
        return 'bg-zinc-700/40 text-zinc-200 border-zinc-500/60';
    }
  };

  return (
    <>
      {/* Card */}
<div className="bg-zinc-950/80 border border-yellow-500/40 rounded-xl shadow-md p-4 
                hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(250,204,21,0.25)] 
                transition-all flex flex-col h-full">
  
  {/* Top Section */}
  <div>
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-lg font-semibold text-yellow-300">
        {reading.nodeId}
      </h3>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${getAQIColor(
          reading.aqi.category
        )}`}
      >
        AQI {reading.aqi.value} · {reading.aqi.category}
      </span>
    </div>

    {/* Sensor Data */}
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-zinc-400">PM2.5</span>
        <span className="font-medium text-yellow-50">
          {reading.sensors.pm25} μg/m³
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">PM10</span>
        <span className="font-medium text-yellow-50">
          {reading.sensors.pm10} μg/m³
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">Temperature</span>
        <span className="font-medium text-yellow-50">
          {reading.sensors.temp}°C
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-zinc-400">Humidity</span>
        <span className="font-medium text-yellow-50">
          {reading.sensors.rh}%
        </span>
      </div>
      {reading.battery && (
        <div className="flex justify-between">
          <span className="text-zinc-400">Battery</span>
          <span className="font-medium text-yellow-50">
            {reading.battery}%
          </span>
        </div>
      )}
    </div>
  </div>

  {/* ✅ Bottom Section (ALWAYS ALIGNED) */}
  <div className="mt-auto pt-3 border-t border-zinc-700">
    <div className="text-xs text-zinc-500 mb-2">
      {new Date(reading.timestamp).toLocaleString()}
    </div>

    {reading.hedera && (
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-yellow-500 hover:bg-yellow-400 
                   text-black text-sm font-medium py-2 px-4 
                   rounded-lg transition-colors"
      >
        🔗 View Hedera Proof
      </button>
    )}
  </div>
</div>


      {/* Modal */}
      {showModal && reading.hedera && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-yellow-500/40 rounded-2xl max-w-2xl w-full max-height-[90vh] max-h-[90vh] overflow-y-auto p-6 text-yellow-50">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-yellow-400">
                Hedera Proof
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Node ID
                </label>
                <div className="bg-black/60 p-3 rounded border border-zinc-700">
                  {reading.nodeId}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Topic ID
                </label>
                <div className="bg-black/60 p-3 rounded border border-zinc-700 font-mono text-xs">
                  {reading.hedera.topicId}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Consensus Timestamp
                </label>
                <div className="bg-black/60 p-3 rounded border border-zinc-700">
                  {reading.hedera.consensusTimestamp}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Published Message
                </label>
                <div className="bg-black/60 p-3 rounded border border-zinc-700">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(reading.hedera.publishedMessage, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href={`https://hashscan.io/testnet/topic/${reading.hedera.topicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-medium py-3 px-4 rounded-lg text-center transition-colors"
                >
                  View on Hedera Explorer
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
