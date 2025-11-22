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

  // Fetch all listings on mount
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

  // Apply filters locally
  useEffect(() => {
    let filtered = [...listings];

    if (filters.city.trim()) {
      filtered = filtered.filter(node => 
        node.location.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      filtered = filtered.filter(node => 
        (node.pricing?.pricePerReading || 0) >= min
      );
    }

    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      filtered = filtered.filter(node => 
        (node.pricing?.pricePerReading || 0) <= max
      );
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Data Marketplace</h1>
              <p className="text-gray-600 mt-1">Purchase environmental data from verified nodes</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Available Nodes</div>
            <div className="text-3xl font-bold text-purple-600">{listings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Filtered Results</div>
            <div className="text-3xl font-bold text-gray-800">{filteredListings.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Avg Price (USD)</div>
            <div className="text-3xl font-bold text-green-600">
              ${listings.length > 0 
                ? (listings.reduce((sum, n) => sum + (n.pricing?.pricePerReading || 0), 0) / listings.length).toFixed(2)
                : '0.00'
              }
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="Enter city name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (USD)</label>
              <input
                type="number"
                step="0.01"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="10.00"
              />
            </div>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading marketplace listings...</div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-600">
              {listings.length === 0 
                ? 'No data available for sale yet. Register a node to get started!'
                : 'No listings match your filters.'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((node) => (
              <div key={node._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
                  <h3 className="text-xl font-bold">{node.nodeId}</h3>
                  <p className="text-sm opacity-90">{node.location.city}, {node.location.state}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium">{node.ownerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sensors:</span>
                      <span className="font-medium">{node.sensors.length}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Available:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.sensors.map((sensor, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {sensor}
                          </span>
                        ))}
                      </div>
                    </div>
                    {node.stats && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Readings:</span>
                          <span className="font-medium">{node.stats.totalReadings}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Last 24h:</span>
                          <span className="font-medium">{node.stats.last24hReadings}</span>
                        </div>
                        {node.stats.avgAQI && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Latest AQI:</span>
                            <span className={`font-medium ${
                              node.stats.avgAQI <= 50 ? 'text-green-600' :
                              node.stats.avgAQI <= 100 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {node.stats.avgAQI}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Pricing</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Per Reading:</span>
                        <span className="font-medium">${node.pricing?.pricePerReading.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Sub:</span>
                        <span className="font-medium">${node.pricing?.subscriptionMonthly.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bulk (1k):</span>
                        <span className="font-medium">${node.pricing?.bulkDataPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedNode(node);
                      setShowPurchaseModal(true);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Purchase Data</h2>
                <p className="text-gray-600">{selectedNode.nodeId}</p>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {purchaseSuccess ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                Purchase completed successfully! Redirecting...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Buyer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Buyer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hedera Wallet Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerInfo.wallet}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, wallet: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="0.0.12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={buyerInfo.email}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="buyer@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Type */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Purchase Type</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPurchaseType('single')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        purchaseType === 'single'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold">Single Reading</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${selectedNode.pricing?.pricePerReading.toFixed(2)}
                      </div>
                    </button>
                    <button
                      onClick={() => setPurchaseType('subscription')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        purchaseType === 'subscription'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold">Subscription</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${selectedNode.pricing?.subscriptionMonthly.toFixed(2)}/mo
                      </div>
                    </button>
                    <button
                      onClick={() => setPurchaseType('bulk')}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        purchaseType === 'bulk'
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold">Bulk Data</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${selectedNode.pricing?.bulkDataPrice.toFixed(2)}/1k
                      </div>
                    </button>
                  </div>
                </div>

                {/* Additional Options */}
                {purchaseType === 'subscription' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                )}

                {purchaseType === 'bulk' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Readings
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={readingsCount}
                      onChange={(e) => setReadingsCount(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Price (USD):</span>
                    <span className="text-2xl font-bold text-gray-800">
                      ${calculatePrice().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">AERO Tokens:</span>
                    <span className="font-medium text-purple-600">
                      {(calculatePrice() * 10).toFixed(0)} AERO
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || !buyerInfo.wallet || !buyerInfo.email}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    {purchasing ? 'Processing...' : 'Complete Purchase'}
                  </button>
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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