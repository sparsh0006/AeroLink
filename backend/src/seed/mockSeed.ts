import crypto from 'crypto';
import { connectDB, disconnectDB } from '../services/mongo';
import { createTopicIfMissing, publishToTopic } from '../services/hedera';
import Reading from '../models/Reading';

const mockReadings = [
  {
    nodeId: 'node-001',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 11.0168, lon: 76.9558 },
    sensors: { pm25: 26.4, pm10: 45.2, co2: 412, temp: 28.5, rh: 65 },
    aqi: { value: 72, category: 'Moderate' },
    source: 'mock',
    battery: 87,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-002',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 11.2588, lon: 75.7804 },
    sensors: { pm25: 18.3, pm10: 32.1, no2: 24, temp: 27.2, rh: 72 },
    aqi: { value: 58, category: 'Good' },
    source: 'mock',
    battery: 92,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-003',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 10.9601, lon: 76.9552 },
    sensors: { pm25: 42.7, pm10: 68.4, o3: 38, temp: 29.8, rh: 58 },
    aqi: { value: 95, category: 'Moderate' },
    source: 'mock',
    battery: 78,
    firmware: 'v1.2.2'
  },
  {
    nodeId: 'node-004',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 11.3410, lon: 77.7172 },
    sensors: { pm25: 15.2, pm10: 28.6, co2: 405, temp: 26.4, rh: 68 },
    aqi: { value: 52, category: 'Good' },
    source: 'mock',
    battery: 95,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-005',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 10.7867, lon: 76.6548 },
    sensors: { pm25: 35.8, pm10: 58.2, no2: 32, temp: 30.1, rh: 54 },
    aqi: { value: 88, category: 'Moderate' },
    source: 'mock',
    battery: 82,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-006',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 11.1085, lon: 77.3479 },
    sensors: { pm25: 22.1, pm10: 38.9, co2: 418, temp: 27.9, rh: 61 },
    aqi: { value: 68, category: 'Moderate' },
    source: 'mock',
    battery: 89,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-007',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 10.5276, lon: 76.2144 },
    sensors: { pm25: 12.4, pm10: 24.8, o3: 28, temp: 25.6, rh: 75 },
    aqi: { value: 45, category: 'Good' },
    source: 'mock',
    battery: 91,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-008',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 11.6234, lon: 76.6411 },
    sensors: { pm25: 48.9, pm10: 75.3, no2: 45, temp: 31.2, rh: 49 },
    aqi: { value: 102, category: 'Unhealthy for Sensitive Groups' },
    source: 'mock',
    battery: 71,
    firmware: 'v1.2.2'
  },
  {
    nodeId: 'node-009',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 10.9234, lon: 76.4589 },
    sensors: { pm25: 19.7, pm10: 34.2, co2: 408, temp: 26.8, rh: 69 },
    aqi: { value: 61, category: 'Moderate' },
    source: 'mock',
    battery: 88,
    firmware: 'v1.2.3'
  },
  {
    nodeId: 'node-010',
    timestamp: new Date('2025-11-20T09:00:00Z'),
    location: { lat: 11.4102, lon: 77.7383 },
    sensors: { pm25: 28.3, pm10: 48.1, o3: 35, temp: 28.7, rh: 63 },
    aqi: { value: 76, category: 'Moderate' },
    source: 'mock',
    battery: 85,
    firmware: 'v1.2.3'
  }
];

const computeHash = (data: any): string => {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();

    // Clear existing readings
    await Reading.deleteMany({});
    console.log('🗑️  Cleared existing readings');

    // Ensure topic exists
    const topicId = await createTopicIfMissing();

    // Insert each reading and publish to Hedera
    for (const mockData of mockReadings) {
      // Insert into MongoDB
      const reading = new Reading(mockData);
      await reading.save();

      // Compute hash
      const docForHash: any = reading.toObject();
      delete docForHash._id;
      delete docForHash.__v;
      delete docForHash.createdAt;
      delete docForHash.updatedAt;
      delete docForHash.hedera;

      const hash = computeHash(docForHash);

      // Create compact message
      const compactMessage = {
        nodeId: reading.nodeId,
        ts: reading.timestamp.toISOString(),
        lat: reading.location.lat,
        lon: reading.location.lon,
        pm25: reading.sensors.pm25,
        aqi: reading.aqi.value,
        hash
      };

      // Publish to Hedera
      const { transactionId, consensusTimestamp } = await publishToTopic(
        topicId,
        compactMessage
      );

      // Update with Hedera metadata
      reading.hedera = {
        topicId,
        messageId: transactionId,
        consensusTimestamp,
        publishedMessage: compactMessage
      };

      await reading.save();

      console.log(`✅ Seeded ${reading.nodeId} with HCS proof`);
    }

    console.log('🎉 Seeding completed successfully!');
    console.log(`📊 Total readings: ${mockReadings.length}`);
    console.log(`🔗 Topic ID: ${topicId}`);
    console.log(`🌐 View on Hedera Explorer: https://hashscan.io/testnet/topic/${topicId}`);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedDatabase();