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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Unhealthy for Sensitive Groups':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Unhealthy':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-800">{reading.nodeId}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getAQIColor(reading.aqi.category)}`}>
            AQI {reading.aqi.value}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">PM2.5:</span>
            <span className="font-medium">{reading.sensors.pm25} μg/m³</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PM10:</span>
            <span className="font-medium">{reading.sensors.pm10} μg/m³</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Temperature:</span>
            <span className="font-medium">{reading.sensors.temp}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Humidity:</span>
            <span className="font-medium">{reading.sensors.rh}%</span>
          </div>
          {reading.battery && (
            <div className="flex justify-between">
              <span className="text-gray-600">Battery:</span>
              <span className="font-medium">{reading.battery}%</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">
            {new Date(reading.timestamp).toLocaleString()}
          </div>
          {reading.hedera && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded transition-colors"
            >
              🔗 View Hedera Proof
            </button>
          )}
        </div>
      </div>

      {showModal && reading.hedera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Hedera Proof</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Node ID</label>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  {reading.nodeId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic ID</label>
                <div className="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-sm">
                  {reading.hedera.topicId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Consensus Timestamp</label>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  {reading.hedera.consensusTimestamp}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Published Message</label>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(reading.hedera.publishedMessage, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`https://hashscan.io/testnet/topic/${reading.hedera.topicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded text-center transition-colors"
                >
                  View on Hedera Explorer
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded transition-colors"
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