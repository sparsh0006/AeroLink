'use client';

import { useState, useEffect } from 'react';
import { fetchMarketplaceListings, purchaseData, Node } from '@/lib/api';

export default function Marketplace() {
  const [listings, setListings] = useState<Node[]>([]);
  const [filteredListings, setFilteredListings] = useState<Node[]>([]);
  const [filters, setFilters] = useState({ city: '', minPrice: '', maxPrice: '' });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'single' | 'subscription' | 'bulk'>('single');
  const [buyerInfo, setBuyerInfo] = useState({ wallet: '', email: '' });
  const [duration, setDuration] = useState(30);
  const [readingsCount, setReadingsCount] = useState(1000);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchMarketplaceListings();
      setListings(data);
      setFilteredListings(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...listings];

    if (filters.city.trim()) {
      filtered = filtered.filter((node) =>
        node.location.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      filtered = filtered.filter((node) => (node.pricing?.pricePerReading || 0) >= min);
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      filtered = filtered.filter((node) => (node.pricing?.pricePerReading || 0) <= max);
    }

    setFilteredListings(filtered);
  }, [filters, listings]);

  const handlePurchase = async () => {
    if (!selectedNode || !buyerInfo.wallet || !buyerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setPurchasing(true);
    try {
      const purchaseData_ = {
        nodeId: selectedNode.nodeId,
        buyerWallet: buyerInfo.wallet,
        buyerEmail: buyerInfo.email,
        purchaseType,
        ...(purchaseType === 'subscription' && { duration }),
        ...(purchaseType === 'bulk' && { readingsCount })
      };

      await purchaseData(purchaseData_);
      setPurchaseSuccess(true);
      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseSuccess(false);
        setSelectedNode(null);
        setBuyerInfo({ wallet: '', email: '' });
      }, 2000);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const calculatePrice = () => {
    if (!selectedNode?.pricing) return 0;
    switch (purchaseType) {
      case 'single':
        return selectedNode.pricing.pricePerReading;
      case 'subscription':
        return (selectedNode.pricing.subscriptionMonthly * duration) / 30;
      case 'bulk':
        return (selectedNode.pricing.bulkDataPrice * readingsCount) / 1000;
      default:
        return 0;
    }
  };

  const inputClass =
    'w-full px-4 py-2 border border-yellow-500/40 bg-black/40 text-yellow-50 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      {/* Header */}
      <header className="border-b border-yellow-500/30 bg-black/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-yellow-400">Data Marketplace</h1>
              <p className="text-zinc-300 mt-1">
                Purchase environmental data from verified AeroLink nodes.
              </p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 text-yellow-50">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-950/70 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Available Nodes</div>
            <div className="text-3xl font-bold text-yellow-400">{listings.length}</div>
          </div>
          <div className="bg-zinc-950/70 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Filtered Results</div>
            <div className="text-3xl font-bold text-yellow-400">{filteredListings.length}</div>
          </div>
          <div className="bg-zinc-950/70 border border-yellow-500/30 rounded-xl shadow p-6">
            <div className="text-sm text-zinc-400 mb-1">Avg Price (USD)</div>
            <div className="text-3xl font-bold text-yellow-400">
              $
              {listings.length > 0
                ? (
                    listings.reduce(
                      (sum, n) => sum + (n.pricing?.pricePerReading || 0),
                      0
                    ) / listings.length
                  ).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className={inputClass}
                placeholder="Enter city name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Min Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-2">
                Max Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className={inputClass}
                placeholder="10.00"
              />
            </div>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-12 text-zinc-300">
            Loading marketplace listings...
          </div>
        ) : error ? (
          <div className="bg-red-900/40 border border-red-500/60 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 text-zinc-300">
            {listings.length === 0
              ? 'No data available for sale yet. Register a node to get started!'
              : 'No listings match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((node) => (
              <div
                key={node._id}
                className="bg-zinc-950/80 border border-yellow-500/30 rounded-xl overflow-hidden hover:border-yellow-400 hover:shadow-[0_0_30px_rgba(250,204,21,0.25)] transition-all"
              >
                <div className="bg-yellow-500 text-black p-4">
                  <h3 className="text-xl font-bold">{node.nodeId}</h3>
                  <p className="text-sm">
                    {node.location.city}, {node.location.state}
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Owner:</span>
                      <span className="font-medium text-yellow-100">
                        {node.ownerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Sensors:</span>
                      <span className="font-medium text-yellow-100">
                        {node.sensors.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400">Available:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.sensors.map((sensor, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-yellow-500/10 text-yellow-200 border border-yellow-500/40 rounded text-xs"
                          >
                            {sensor}
                          </span>
                        ))}
                      </div>
                    </div>
                    {node.stats && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Total Readings:</span>
                          <span className="font-medium text-yellow-100">
                            {node.stats.totalReadings}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Last 24h:</span>
                          <span className="font-medium text-yellow-100">
                            {node.stats.last24hReadings}
                          </span>
                        </div>
                        {node.stats.avgAQI && (
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Latest AQI:</span>
                            <span
                              className={`font-medium ${
                                node.stats.avgAQI <= 50
                                  ? 'text-emerald-400'
                                  : node.stats.avgAQI <= 100
                                  ? 'text-yellow-300'
                                  : 'text-red-400'
                              }`}
                            >
                              {node.stats.avgAQI}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="border-t border-zinc-700 pt-4 mb-4 text-sm">
                    <div className="font-semibold text-zinc-200 mb-2">Pricing</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Per Reading:</span>
                        <span className="font-medium text-yellow-300">
                          ${node.pricing?.pricePerReading.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Monthly Sub:</span>
                        <span className="font-medium text-yellow-300">
                          ${node.pricing?.subscriptionMonthly.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Bulk (1k):</span>
                        <span className="font-medium text-yellow-300">
                          ${node.pricing?.bulkDataPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedNode(node);
                      setShowPurchaseModal(true);
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Purchase Data
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedNode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-yellow-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-yellow-50">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-yellow-400">Purchase Data</h2>
                <p className="text-zinc-300">{selectedNode.nodeId}</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            {purchaseSuccess ? (
              <div className="bg-emerald-900/40 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded mb-6">
                Purchase completed successfully! Redirecting...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Buyer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3">
                    Buyer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-200 mb-2">
                        Hedera Wallet Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerInfo.wallet}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, wallet: e.target.value })
                        }
                        className={inputClass}
                        placeholder="0.0.12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-200 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={buyerInfo.email}
                        onChange={(e) =>
                          setBuyerInfo({ ...buyerInfo, email: e.target.value })
                        }
                        className={inputClass}
                        placeholder="buyer@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Type */}
                <div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3">
                    Purchase Type
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPurchaseType('single')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        purchaseType === 'single'
                          ? 'border-yellow-400 bg-yellow-500/10'
                          : 'border-zinc-700 hover:border-yellow-500/60'
                      }`}
                    >
                      <div className="font-semibold">Single Reading</div>
                      <div className="text-sm text-zinc-300 mt-1">
                        ${selectedNode.pricing?.pricePerReading.toFixed(2)}
                      </div>
                    </button>
                    <button
                      onClick={() => setPurchaseType('subscription')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        purchaseType === 'subscription'
                          ? 'border-yellow-400 bg-yellow-500/10'
                          : 'border-zinc-700 hover:border-yellow-500/60'
                      }`}
                    >
                      <div className="font-semibold">Subscription</div>
                      <div className="text-sm text-zinc-300 mt-1">
                        ${selectedNode.pricing?.subscriptionMonthly.toFixed(2)}/mo
                      </div>
                    </button>
                    <button
                      onClick={() => setPurchaseType('bulk')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        purchaseType === 'bulk'
                          ? 'border-yellow-400 bg-yellow-500/10'
                          : 'border-zinc-700 hover:border-yellow-500/60'
                      }`}
                    >
                      <div className="font-semibold">Bulk Data</div>
                      <div className="text-sm text-zinc-300 mt-1">
                        ${selectedNode.pricing?.bulkDataPrice.toFixed(2)}/1k
                      </div>
                    </button>
                  </div>
                </div>

                {/* Extra Options */}
                {purchaseType === 'subscription' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                )}

                {purchaseType === 'bulk' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                      Number of Readings
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={readingsCount}
                      onChange={(e) => setReadingsCount(parseInt(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-black/60 border border-yellow-500/40 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-zinc-200">Price (USD):</span>
                    <span className="text-2xl font-bold text-yellow-400">
                      ${calculatePrice().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">AERO Tokens:</span>
                    <span className="font-medium text-yellow-300">
                      {(calculatePrice() * 10).toFixed(0)} AERO
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !buyerInfo.wallet || !buyerInfo.email}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 text-black font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {purchasing ? 'Processing...' : 'Complete Purchase'}
                  </button>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="px-6 py-3 border border-zinc-700 rounded-lg text-zinc-200 hover:bg-zinc-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
