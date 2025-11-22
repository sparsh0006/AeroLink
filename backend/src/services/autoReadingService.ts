import crypto from 'crypto';
import Reading from '../models/Reading';
import Node from '../models/Node';
import { publishToTopic } from './hedera';

// Generate realistic mock sensor data based on available sensors
const generateSensorData = (sensors: string[]) => {
  const sensorData: any = {};
  
  sensors.forEach(sensor => {
    switch(sensor) {
      case 'PM2.5':
        sensorData.pm25 = parseFloat((Math.random() * 60 + 10).toFixed(1)); // 10-70
        break;
      case 'PM10':
        sensorData.pm10 = parseFloat((Math.random() * 80 + 20).toFixed(1)); // 20-100
        break;
      case 'CO2':
        sensorData.co2 = Math.floor(Math.random() * 200 + 350); // 350-550 ppm
        break;
      case 'NO2':
        sensorData.no2 = Math.floor(Math.random() * 40 + 10); // 10-50
        break;
      case 'O3':
        sensorData.o3 = Math.floor(Math.random() * 30 + 20); // 20-50
        break;
      case 'Temperature':
        sensorData.temp = parseFloat((Math.random() * 15 + 20).toFixed(1)); // 20-35°C
        break;
      case 'Humidity':
        sensorData.rh = Math.floor(Math.random() * 40 + 40); // 40-80%
        break;
    }
  });

  // Ensure required fields have defaults
  if (!sensorData.pm25) sensorData.pm25 = parseFloat((Math.random() * 60 + 10).toFixed(1));
  if (!sensorData.pm10) sensorData.pm10 = parseFloat((Math.random() * 80 + 20).toFixed(1));
  if (!sensorData.temp) sensorData.temp = parseFloat((Math.random() * 15 + 20).toFixed(1));
  if (!sensorData.rh) sensorData.rh = Math.floor(Math.random() * 40 + 40);

  return sensorData;
};

// Calculate AQI based on PM2.5
const calculateAQI = (pm25: number): { value: number; category: string } => {
  let aqi = 0;
  let category = 'Good';

  if (pm25 <= 12) {
    aqi = Math.round((50 / 12) * pm25);
    category = 'Good';
  } else if (pm25 <= 35.4) {
    aqi = Math.round(50 + ((50 / 23.4) * (pm25 - 12)));
    category = 'Moderate';
  } else if (pm25 <= 55.4) {
    aqi = Math.round(100 + ((50 / 20) * (pm25 - 35.4)));
    category = 'Unhealthy for Sensitive Groups';
  } else if (pm25 <= 150.4) {
    aqi = Math.round(150 + ((100 / 95) * (pm25 - 55.4)));
    category = 'Unhealthy';
  } else {
    aqi = Math.round(200 + ((100 / 149.6) * (pm25 - 150.4)));
    category = 'Very Unhealthy';
  }

  return { value: aqi, category };
};

// Compute hash for data integrity
const computeHash = (data: any): string => {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

// Generate and publish a reading for a node
export const generateAndPublishReading = async (nodeId: string): Promise<any> => {
  try {
    const node = await Node.findOne({ nodeId });
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Generate sensor data based on node's sensors
    const sensorData = generateSensorData(node.sensors);
    const aqi = calculateAQI(sensorData.pm25);

    // Create reading
    const reading = new Reading({
      nodeId: node.nodeId,
      timestamp: new Date(),
      location: {
        lat: node.location.lat,
        lon: node.location.lon
      },
      sensors: sensorData,
      aqi,
      source: 'auto',
      battery: Math.floor(Math.random() * 30 + 70), // 70-100%
      firmware: 'v1.2.3'
    });

    await reading.save();

    // Compute hash
    const docForHash: any = reading.toObject();
    delete docForHash._id;
    delete docForHash.__v;
    delete docForHash.createdAt;
    delete docForHash.updatedAt;
    delete docForHash.hedera;

    const hash = computeHash(docForHash);

    // Create compact message for Hedera
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
    const topicId = process.env.HEDERA_TOPIC_ID;
    if (!topicId) {
      console.warn('⚠️  HEDERA_TOPIC_ID not set. Skipping HCS publish.');
      return reading;
    }

    const { transactionId, consensusTimestamp } = await publishToTopic(
      topicId,
      compactMessage
    );

    // Update reading with Hedera metadata
    reading.hedera = {
      topicId,
      messageId: transactionId,
      consensusTimestamp,
      publishedMessage: compactMessage
    };

    await reading.save();

    // Update node statistics
    node.totalReadings = (node.totalReadings || 0) + 1;
    node.lastSeen = new Date();
    await node.save();

    console.log(`📊 live-generated reading for ${nodeId} with Hedera proof`);

    return reading;
  } catch (error) {
    console.error(`Error generating reading for ${nodeId}:`, error);
    throw error;
  }
};

// Schedule automatic readings for a node (every 15 seconds)
export const scheduleAutoReadings = (nodeId: string): NodeJS.Timeout => {
  console.log(`⏰ Scheduled auto-readings for ${nodeId} (every 15s)`);
  
  // Generate first reading immediately
  setTimeout(() => {
    generateAndPublishReading(nodeId).catch(err => 
      console.error(`Failed to generate reading for ${nodeId}:`, err)
    );
  }, 1000);

  // Then every 15 seconds
  return setInterval(async () => {
    try {
      await generateAndPublishReading(nodeId);
    } catch (error) {
      console.error(`Failed to generate reading for ${nodeId}:`, error);
    }
  }, 15000); // 15 seconds
};

// Store active intervals
const activeIntervals = new Map<string, NodeJS.Timeout>();

// Start auto-readings for a node
export const startAutoReadings = (nodeId: string): void => {
  // Don't start if already running
  if (activeIntervals.has(nodeId)) {
    console.log(`⚠️  Auto-readings already active for ${nodeId}`);
    return;
  }

  const interval = scheduleAutoReadings(nodeId);
  activeIntervals.set(nodeId, interval);
};

// Stop auto-readings for a node
export const stopAutoReadings = (nodeId: string): void => {
  const interval = activeIntervals.get(nodeId);
  if (interval) {
    clearInterval(interval);
    activeIntervals.delete(nodeId);
    console.log(`⏹️  Stopped auto-readings for ${nodeId}`);
  }
};

// Initialize auto-readings for all active nodes on server start
export const initializeAutoReadings = async (): Promise<void> => {
  try {
    const activeNodes = await Node.find({ status: 'active' });
    console.log(`🔄 Initializing auto-readings for ${activeNodes.length} active nodes`);
    
    for (const node of activeNodes) {
      startAutoReadings(node.nodeId);
    }
  } catch (error) {
    console.error('Error initializing auto-readings:', error);
  }
};