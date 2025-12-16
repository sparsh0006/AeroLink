import { Request, Response } from 'express';
import crypto from 'crypto';
import Node from '../models/Node';
import Reading from '../models/Reading';
import { publishToTopic } from '../services/hedera';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// Global variable to keep the port open so we don't re-open it on every request
let globalPort: SerialPort | null = null;

// Generate unique node ID
const generateNodeId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `node-${timestamp}-${randomStr}`;
};

// Compute hash for data integrity
const computeHash = (data: any): string => {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

// -------------------------------------------------------------------------
// Helper: Process Data Received FROM ESP32
// -------------------------------------------------------------------------
const processESP32Data = async (nodeId: string, aqiVal: number, pm25Val: number) => {
  try {
    const node = await Node.findOne({ nodeId });
    if (!node) {
      console.error(`⚠️ Received data for unknown node: ${nodeId}`);
      return;
    }

    // Create Reading object with ESP32 values
    const reading = new Reading({
      nodeId: nodeId,
      timestamp: new Date(),
      location: {
        lat: node.location.lat,
        lon: node.location.lon
      },
      sensors: {
        pm25: pm25Val,
        pm10: pm25Val * 1.5, // Estimating PM10 based on PM2.5 for display purposes
        temp: 30.5, // Mock temp if ESP doesn't send it
        rh: 45      // Mock humidity if ESP doesn't send it
      },
      aqi: {
        value: aqiVal,
        category: aqiVal > 300 ? 'Hazardous' : (aqiVal > 200 ? 'Very Unhealthy' : 'Unhealthy')
      },
      source: 'live',
      battery: 100,
      firmware: 'v1.0.ESP32'
    });

    await reading.save();

    // Compute Hash
    const docForHash: any = reading.toObject();
    delete docForHash._id;
    delete docForHash.__v;
    delete docForHash.createdAt;
    delete docForHash.updatedAt;
    delete docForHash.hedera;

    const hash = computeHash(docForHash);

    // Prepare Hedera Message
    const compactMessage = {
      nodeId: reading.nodeId,
      ts: reading.timestamp.toISOString(),
      lat: reading.location.lat,
      lon: reading.location.lon,
      pm25: reading.sensors.pm25,
      aqi: reading.aqi.value,
      hash
    };

    // Publish Data to Hedera
    const topicId = process.env.HEDERA_TOPIC_ID;
    if (topicId) {
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
      
      console.log(`📡 ESP32 Data Published to Hedera | AQI: ${aqiVal} | PM2.5: ${pm25Val}`);
    }

    // Update Node stats
    node.totalReadings = (node.totalReadings || 0) + 1;
    node.lastSeen = new Date();
    await node.save();

  } catch (error) {
    console.error('Error processing ESP32 data:', error);
  }
};

// -------------------------------------------------------------------------
// Helper: Setup Serial Bridge (USB Connection)
// -------------------------------------------------------------------------
const setupSerialBridge = (configData: string) => {
  try {
    // Check if already open
    if (globalPort && globalPort.isOpen) {
      console.log('🔌 Serial Port already open, updating config...');
      globalPort.write(configData + '\n');
      return;
    }

    // ⚠️ ENSURE THIS MATCHES YOUR PORT (e.g., COM29)
    globalPort = new SerialPort({ path: 'COM29', baudRate: 115200 });
    
    // Pipe data through a parser to get clean lines
    const parser = globalPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    globalPort.on('open', () => {
      console.log('🔌 Serial Port Opened (COM29). Sending config...');
      // Wait 2s for ESP32 boot, then send config
      setTimeout(() => {
        globalPort?.write(configData + '\n');
      }, 2000);
    });

    // Listen for data FROM ESP32
    parser.on('data', (line: string) => {
      const cleanLine = line.trim();
      
      // Expected Format from ESP32: DATA:node-id,402,302.4
      if (cleanLine.startsWith('DATA:')) {
        const dataPart = cleanLine.substring(5); // Remove "DATA:"
        const parts = dataPart.split(',');

        if (parts.length >= 3) {
          const rxNodeId = parts[0];
          const rxAQI = parseInt(parts[1]);
          const rxPM25 = parseFloat(parts[2]);

          console.log(`📥 Received from ESP32: AQI=${rxAQI}, PM2.5=${rxPM25}`);
          processESP32Data(rxNodeId, rxAQI, rxPM25);
        }
      }
    });

    globalPort.on('error', (err) => {
      console.error('⚠️ Serial Port Error:', err.message);
    });

  } catch (error) {
    console.error('Failed to initialize SerialPort:', error);
  }
};

// -------------------------------------------------------------------------
// Controller: Register Node
// -------------------------------------------------------------------------
export const registerNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const nodeData = req.body;

    // Validate inputs
    if (!nodeData.ownerName || !nodeData.ownerEmail || !nodeData.ownerWallet) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    if (!nodeData.location || !nodeData.location.lat) {
      res.status(400).json({ error: 'Location required' });
      return;
    }

    // Generate ID & Timestamp
    const nodeId = generateNodeId();
    const currentTimestamp = new Date().toISOString();

    // 1. Prepare Registration JSON (To match the output you wanted)
    const registrationData = {
      nodeId,
      ownerName: nodeData.ownerName,
      ownerWallet: nodeData.ownerWallet,
      location: {
        lat: nodeData.location.lat,
        lon: nodeData.location.lon,
        city: nodeData.location.city,
        state: nodeData.location.state,
        country: nodeData.location.country
      },
      sensors: nodeData.sensors,
      timestamp: currentTimestamp,
      registrationType: 'NODE_REGISTRATION'
    };

    // 2. Publish Registration Message to Hedera
    const topicId = process.env.HEDERA_TOPIC_ID;
    let hederaDetails = {};

    if (topicId) {
      console.log('📝 Registering node on Hedera...', nodeId);
      const { transactionId, consensusTimestamp } = await publishToTopic(
        topicId,
        registrationData
      );
      
      hederaDetails = {
        topicId,
        registrationTxId: transactionId,
        consensusTimestamp
      };
    } else {
      console.warn('⚠️ HEDERA_TOPIC_ID not found. Skipping HCS registration.');
    }

    // 3. Save Node to Database
    const node = new Node({
      nodeId,
      ownerName: nodeData.ownerName,
      ownerEmail: nodeData.ownerEmail,
      ownerWallet: nodeData.ownerWallet,
      location: nodeData.location,
      sensors: nodeData.sensors,
      status: 'active',
      registeredAt: new Date(),
      dataForSale: nodeData.dataForSale || false,
      pricing: nodeData.dataForSale ? nodeData.pricing : undefined,
      hedera: hederaDetails
    });

    await node.save();

    // 4. Start Serial Bridge to ESP32
    // Format: REGISTER:NodeID,Lat,Lon,Timestamp
    const serialData = `REGISTER:${nodeId},${nodeData.location.lat},${nodeData.location.lon},${currentTimestamp}`;
    setupSerialBridge(serialData);

    console.log('✅ Node registered successfully:', nodeId);

    res.status(201).json({
      message: 'Node registered and connected to ESP32',
      node: {
        ...registrationData, // Return the registration data structure
        hedera: hederaDetails
      }
    });
  } catch (error) {
    console.error('Error registering node:', error);
    res.status(500).json({ error: 'Failed to register node' });
  }
};

// -------------------------------------------------------------------------
// Other Controller Methods (Unchanged)
// -------------------------------------------------------------------------

export const getAllNodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const nodes = await Node.find({}).sort({ registeredAt: -1 });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

export const getNodeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;
    const node = await Node.findOne({ nodeId });
    if (!node) { res.status(404).json({ error: 'Node not found' }); return; }
    const recentReadings = await Reading.find({ nodeId }).sort({ timestamp: -1 }).limit(10);
    res.json({ node, recentReadings });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const updateNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;
    const node = await Node.findOneAndUpdate({ nodeId }, { $set: req.body }, { new: true });
    res.json({ node });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const activateNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;
    const node = await Node.findOneAndUpdate({ nodeId }, { $set: { status: 'active' } }, { new: true });
    res.json({ message: 'Node activated', node });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const getNodeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;
    const totalReadings = await Reading.countDocuments({ nodeId });
    const latestReading = await Reading.findOne({ nodeId }).sort({ timestamp: -1 });
    res.json({ nodeId, totalReadings, lastSeen: latestReading?.timestamp });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};