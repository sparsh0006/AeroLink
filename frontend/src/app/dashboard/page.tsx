'use client';

import { useState } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import {
  fetchRecentReadings,
  fetchAllNodes,
  fetchDashboardStats,
  Reading,
  Node,
} from '@/lib/api';
import NodeCard from '@/components/NodeCard';

// 🔹 Dynamically import MapView – client-only, no SSR
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center">
      <div className="text-zinc-300">Loading map...</div>
    </div>
  ),
});

export default function DashboardPage() {
  const {
    data: readings,
    error,
    isLoading,
  } = useSWR<Reading[]>('readings', fetchRecentReadings, {
    refreshInterval: 5000,
  });

  const { data: nodes } = useSWR<Node[]>('nodes', fetchAllNodes, {
    refreshInterval: 10000,
  });

  const { data: stats } = useSWR('dashboard-stats', fetchDashboardStats, {
    refreshInterval: 5000,
  });

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const uniqueNodes = readings
    ? Array.from(new Map(readings.map((r) => [r.nodeId, r])).values())
    : [];

  const latestReadingPerNode = uniqueNodes.reduce((acc, reading) => {
    if (
      !acc[reading.nodeId] ||
      new Date(reading.timestamp) > new Date(acc[reading.nodeId].timestamp)
    ) {
      acc[reading.nodeId] = reading;
    }
    return acc;
  }, {} as Record<string, Reading>);

  const mapDataPoints: Reading[] = [
    ...Object.values(latestReadingPerNode),
    ...(nodes || [])
      .filter((node) => !Object.keys(latestReadingPerNode).includes(node.nodeId))
      .map((node) => {
        const nodeHedera: any = (node as any).hedera;
        return {
          _id: node._id,
          nodeId: node.nodeId,
          timestamp:
            (node as any).registeredAt?.toString() || new Date().toISOString(),
          location: node.location,
          sensors: {
            pm25: 0,
            pm10: 0,
            temp: 0,
            rh: 0,
          },
          aqi: { value: 0, category: 'No Data' },
          source: 'node' as const,
          hedera: nodeHedera
            ? {
                topicId: nodeHedera.topicId,
                messageId:
                  nodeHedera.messageId ?? nodeHedera.registrationTxId ?? '',
                consensusTimestamp:
                  nodeHedera.consensusTimestamp ?? new Date().toISOString(),
                publishedMessage: nodeHedera.publishedMessage ?? null,
              }
            : undefined,
        } as Reading;
      }),
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="bg-zinc-950/80 border border-red-500/60 rounded-xl px-8 py-6 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            Error Loading Data
          </h1>
          <p className="text-zinc-300">
            Please make sure the backend server is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-yellow-50">
      {/* Header */}
      <header className="border-b border-yellow-500/30 bg-black/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400">
                AeroLink DePIN
              </h1>
              <p className="text-zinc-300 mt-1">
                Decentralized Weather & Pollution Monitoring Network
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/register"
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
              >
                Register Node
              </a>
              <a
                href="/marketplace"
                className="px-4 py-2 bg-black border border-yellow-500/60 text-yellow-300 rounded-lg hover:bg-yellow-500/10 transition-colors font-medium"
              >
                Marketplace
              </a>
              <div className="text-right">
                <div className="text-xs text-zinc-400 uppercase tracking-wide">
                  Powered by
                </div>
                <div className="text-lg font-semibold text-yellow-400">
                  Hedera
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Active Nodes</div>
            <div className="text-3xl font-bold text-yellow-400">
              {stats?.activeNodes || 0}
            </div>
          </div>
          <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Total Readings</div>
            <div className="text-3xl font-bold text-yellow-400">
              {stats?.totalReadings || 0}
            </div>
          </div>
          <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Avg AQI</div>
            <div className="text-3xl font-bold text-yellow-400">
              {stats?.avgAQI || 0}
            </div>
          </div>
          <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Hedera Verified</div>
            <div className="text-3xl font-bold text-yellow-400">
              {stats?.hederaVerified || 0}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            Live Network Map
          </h2>
          {/* MapView is now client-only */}
          <MapView readings={mapDataPoints} />
        </div>

        {/* Node Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-200 mb-2">
            Filter by Node
          </label>
          <select
            value={selectedNode || ''}
            onChange={(e) => setSelectedNode(e.target.value || null)}
            className="w-full md:w-64 px-4 py-2 border border-yellow-500/40 bg-black/60 text-yellow-50 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            {selectedNode ? `Readings from ${selectedNode}` : 'Latest Readings'}
          </h2>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-zinc-300">Loading readings...</div>
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
      <footer className="border-t border-yellow-500/30 mt-12 bg-black/80">
        <div className="container mx-auto px-4 py-6 text-center text-zinc-400 text-sm">
          <p>
            AeroLink DePIN © 2025 · Built with Hedera Consensus Service (HCS) &
            Token Service (HTS)
          </p>
        </div>
      </footer>
    </div>
  );
}
