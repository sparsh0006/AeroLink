import { Request, Response } from 'express';
import crypto from 'crypto';
import Reading from '../models/Reading';
import { publishToTopic } from '../services/hedera';

const computeHash = (data: any): string => {
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

export const createReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const readingData = req.body;

    // Validate required fields
    if (!readingData.nodeId || !readingData.location || !readingData.sensors) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Insert into MongoDB
    const reading = new Reading({
      ...readingData,
      timestamp: readingData.timestamp || new Date(),
      source: readingData.source || 'live'
    });

    await reading.save();

    // Compute hash of the stored document
    const docForHash = reading.toObject() as any;
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

    // Publish to Hedera HCS
    const topicId = process.env.HEDERA_TOPIC_ID;
    if (!topicId) {
      console.warn('⚠️  HEDERA_TOPIC_ID not set. Skipping HCS publish.');
      res.status(201).json(reading);
      return;
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

    res.status(201).json(reading);
  } catch (error) {
    console.error('Error creating reading:', error);
    res.status(500).json({ error: 'Failed to create reading' });
  }
};

export const getReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const nodeId = req.query.nodeId as string;

    const query = nodeId ? { nodeId } : {};

    const readings = await Reading.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(readings);
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
};

export const getReadingsByNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const readings = await Reading.find({ nodeId })
      .sort({ timestamp: -1 })
      .limit(limit);

    if (readings.length === 0) {
      res.status(404).json({ error: 'No readings found for this node' });
      return;
    }

    res.json(readings);
  } catch (error) {
    console.error('Error fetching node readings:', error);
    res.status(500).json({ error: 'Failed to fetch node readings' });
  }
};