'use client';

import { useState } from 'react';
import { registerNode } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterNode() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerWallet: '',
    location: {
      lat: '',
      lon: '',
      address: '',
      city: '',
      state: '',
      country: ''
    },
    sensors: [] as string[],
    dataForSale: false,
    pricing: {
      pricePerReading: '',
      subscriptionMonthly: '',
      bulkDataPrice: ''
    }
  });

  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [nodeResponse, setNodeResponse] = useState<any>(null);

  const availableSensors = ['PM2.5', 'PM10', 'CO2', 'NO2', 'O3', 'Temperature', 'Humidity'];

  const handleSensorToggle = (sensor: string) => {
    setSelectedSensors(prev =>
      prev.includes(sensor)
        ? prev.filter(s => s !== sensor)
        : [...prev, sensor]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (selectedSensors.length === 0) {
        setError('Please select at least one sensor');
        setLoading(false);
        return;
      }

      const submitData = {
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerWallet: formData.ownerWallet,
        location: {
          lat: parseFloat(formData.location.lat),
          lon: parseFloat(formData.location.lon),
          address: formData.location.address,
          city: formData.location.city,
          state: formData.location.state,
          country: formData.location.country
        },
        sensors: selectedSensors,
        dataForSale: formData.dataForSale,
        ...(formData.dataForSale && {
          pricing: {
            pricePerReading: parseFloat(formData.pricing.pricePerReading) || 0,
            subscriptionMonthly: parseFloat(formData.pricing.subscriptionMonthly) || 0,
            bulkDataPrice: parseFloat(formData.pricing.bulkDataPrice) || 0
          }
        })
      };

      const response = await registerNode(submitData);
      setNodeResponse(response);
      setSuccess(true);

      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register node');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2 rounded-lg border border-yellow-500/40 bg-black/40 text-yellow-50 placeholder:text-zinc-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-zinc-950/80 border border-yellow-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7)] p-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">Register New Node</h1>
          <p className="text-zinc-300 mb-8">
            Join the AeroLink DePIN network and start earning rewards.
          </p>

          {success && nodeResponse && (
            <div className="bg-emerald-900/40 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded mb-6">
              <div className="font-semibold mb-2">✅ Node registered successfully on Hedera!</div>
              <div className="text-sm space-y-1">
                <div>
                  <strong>Node ID:</strong> {nodeResponse.node.nodeId}
                </div>
                <div>
                  <strong>Transaction:</strong> {nodeResponse.node.hedera.transactionId}
                </div>
                <div>
                  <a
                    href={nodeResponse.node.hedera.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-200 underline hover:text-emerald-100"
                  >
                    View on Hedera Explorer →
                  </a>
                </div>
              </div>
              <div className="mt-2 text-sm text-zinc-200">Redirecting to dashboard...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-500/60 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 text-yellow-50">
            {/* Owner Information */}
            <div>
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Owner Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className={inputClass}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    className={inputClass}
                    placeholder="owner@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Hedera Wallet Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ownerWallet}
                    onChange={(e) => setFormData({ ...formData, ownerWallet: e.target.value })}
                    className={inputClass}
                    placeholder="0.0.12345"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    This address will receive rewards and payments.
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Node Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.location.lat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, lat: e.target.value }
                      })
                    }
                    className={inputClass}
                    placeholder="11.0168"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.location.lon}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, lon: e.target.value }
                      })
                    }
                    className={inputClass}
                    placeholder="76.9558"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, address: e.target.value }
                      })
                    }
                    className={inputClass}
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })
                    }
                    className={inputClass}
                    placeholder="Coimbatore"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value }
                      })
                    }
                    className={inputClass}
                    placeholder="Tamil Nadu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-200 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, country: e.target.value }
                      })
                    }
                    className={inputClass}
                    placeholder="India"
                  />
                </div>
              </div>
            </div>

            {/* Sensors */}
            <div>
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Sensors</h2>
              <label className="block text-sm font-medium text-zinc-200 mb-3">
                Select sensors available on your node * (at least one)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableSensors.map((sensor) => (
                  <label
                    key={sensor}
                    className="flex items-center space-x-2 cursor-pointer p-3 border border-yellow-500/40 rounded-lg bg-black/40 hover:bg-yellow-500/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSensors.includes(sensor)}
                      onChange={() => handleSensorToggle(sensor)}
                      className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-400 bg-black border-yellow-500/60"
                    />
                    <span className="text-sm text-yellow-50 font-medium">{sensor}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Marketplace */}
            <div>
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">
                Data Marketplace (Optional)
              </h2>
              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer p-4 border border-yellow-500/40 rounded-lg bg-black/40 hover:bg-yellow-500/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.dataForSale}
                    onChange={(e) => setFormData({ ...formData, dataForSale: e.target.checked })}
                    className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-400 bg-black border-yellow-500/60"
                  />
                  <div>
                    <span className="text-sm font-medium text-yellow-50 block">
                      Make my data available for sale
                    </span>
                    <span className="text-xs text-zinc-400">
                      Earn additional revenue by selling your environmental data.
                    </span>
                  </div>
                </label>
              </div>

              {formData.dataForSale && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-black/60 rounded-lg border border-yellow-500/40">
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                      Price per Reading (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricing.pricePerReading}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, pricePerReading: e.target.value }
                        })
                      }
                      className={inputClass}
                      placeholder="0.10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                      Monthly Subscription (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricing.subscriptionMonthly}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, subscriptionMonthly: e.target.value }
                        })
                      }
                      className={inputClass}
                      placeholder="50.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-200 mb-2">
                      Bulk (per 1000 readings)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricing.bulkDataPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, bulkDataPrice: e.target.value }
                        })
                      }
                      className={inputClass}
                      placeholder="80.00"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || selectedSensors.length === 0}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-700 text-black font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? 'Registering on Hedera...' : 'Register Node'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-zinc-600 rounded-lg text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
