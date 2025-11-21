'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetchRecentReadings, fetchAllNodes, Reading, Node } from '@/lib/api';
import MapView from '@/componnents/MapView';
import NodeCard from '@/componnents/NodeCard';

export default function Home() {
  const { data: readings, error, isLoading } = useSWR<Reading[]>('readings', fetchRecentReadings, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const { data: nodes } = useSWR<Node[]>('nodes', fetchAllNodes, {
    refreshInterval: 30000,
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const uniqueNodes = readings
    ? Array.from(new Map(readings.map((r) => [r.nodeId, r])).values())
    : [];

  const filteredReadings = selectedNode
    ? readings?.filter((r) => r.nodeId === selectedNode) || []
    : readings || [];

  const latestReadingPerNode = uniqueNodes.reduce((acc, reading) => {
    if (!acc[reading.nodeId] || new Date(reading.timestamp) > new Date(acc[reading.nodeId].timestamp)) {
      acc[reading.nodeId] = reading;
    }
    return acc;
  }, {} as Record<string, Reading>);

  // Combine readings and nodes for map display
    const mapDataPoints = [
      ...Object.values(latestReadingPerNode),
      ...(nodes || []).filter(node => 
        !Object.keys(latestReadingPerNode).includes(node.nodeId)
      ).map(node => ({
        _id: node._id,
        nodeId: node.nodeId,
        timestamp: (node as any).registeredAt?.toString() || new Date().toISOString(),
        location: node.location,
        sensors: {
          pm25: 0,
          pm10: 0,
          temp: 0,
          rh: 0
        },
        aqi: { value: 0, category: 'No Data' },
        source: 'node' as const,
        hedera: undefined
      }))
    ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Data</h1>
          <p className="text-gray-600">Please make sure the backend server is running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                AeroLink DePIN
              </h1>
              <p className="text-gray-600 mt-1">
                Decentralized Weather & Pollution Monitoring Network
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/register"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Register Node
              </a>
              <a
                href="/marketplace"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Marketplace
              </a>
              <div className="text-right">
                <div className="text-sm text-gray-600">Powered by</div>
                <div className="text-lg font-semibold text-purple-600">Hedera</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Active Nodes</div>
            <div className="text-3xl font-bold text-gray-800">
              {(nodes?.filter(n => n.status === 'active').length || 0) + uniqueNodes.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Readings</div>
            <div className="text-3xl font-bold text-gray-800">
              {readings?.length || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Avg AQI</div>
            <div className="text-3xl font-bold text-gray-800">
              {readings
                ? Math.round(
                    readings.reduce((sum, r) => sum + r.aqi.value, 0) /
                      readings.length
                  )
                : 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Hedera Verified</div>
            <div className="text-3xl font-bold text-purple-600">
              {readings?.filter((r) => r.hedera).length || 0}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Live Network Map
          </h2>
          {isLoading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="text-gray-600">Loading map...</div>
            </div>
          ) : (
            <MapView readings={mapDataPoints} />
          )}
        </div>

        {/* Node Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Node
          </label>
          <select
            value={selectedNode || ''}
            onChange={(e) => setSelectedNode(e.target.value || null)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Nodes</option>
            {uniqueNodes.map((reading) => (
              <option key={reading.nodeId} value={reading.nodeId}>
                {reading.nodeId}
              </option>
            ))}
          </select>
        </div>

        {/* Node Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {selectedNode ? `Readings from ${selectedNode}` : 'Latest Readings'}
          </h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading readings...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.values(latestReadingPerNode).map((reading) => (
                <NodeCard key={reading._id} reading={reading} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600 text-sm">
          <p>
            AeroLink DePIN © 2025 | Built with Hedera Consensus Service (HCS) &
            Token Service (HTS)
          </p>
        </div>
      </footer>
    </div>
  );
}