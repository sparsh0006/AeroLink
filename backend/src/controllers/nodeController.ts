import { Request, Response } from 'express';
import crypto from 'crypto';
import Node from '../models/Node';
import Reading from '../models/Reading';
import { publishToTopic } from '../services/hedera';

// Generate unique node ID
const generateNodeId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `node-${timestamp}-${randomStr}`;
};

export const registerNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const nodeData = req.body;

    // Validate required fields
    if (!nodeData.ownerName || !nodeData.ownerEmail || !nodeData.ownerWallet) {
      res.status(400).json({ error: 'Missing required fields: ownerName, ownerEmail, ownerWallet' });
      return;
    }

    if (!nodeData.location || !nodeData.location.lat || !nodeData.location.lon) {
      res.status(400).json({ error: 'Location with lat and lon is required' });
      return;
    }

    if (!nodeData.sensors || nodeData.sensors.length === 0) {
      res.status(400).json({ error: 'At least one sensor is required' });
      return;
    }

    // Generate unique node ID
    const nodeId = generateNodeId();

    // Prepare node data for Hedera registration
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
      timestamp: new Date().toISOString(),
      registrationType: 'NODE_REGISTRATION'
    };

    // Publish node registration to Hedera
    const topicId = process.env.HEDERA_TOPIC_ID;
    if (!topicId) {
      res.status(500).json({ error: 'HEDERA_TOPIC_ID not configured' });
      return;
    }

    console.log('📝 Registering node on Hedera...', nodeId);
    const { transactionId, consensusTimestamp } = await publishToTopic(
      topicId,
      registrationData
    );

    // Create node in database
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
      totalReadings: 0,
      revenue: 0,
      hedera: {
        topicId,
        registrationTxId: transactionId,
        consensusTimestamp
      }
    });

    await node.save();

    console.log('✅ Node registered successfully:', nodeId);

    res.status(201).json({
      message: 'Node registered successfully on Hedera network',
      node: {
        nodeId: node.nodeId,
        ownerName: node.ownerName,
        location: node.location,
        sensors: node.sensors,
        status: node.status,
        dataForSale: node.dataForSale,
        hedera: {
          topicId: node.hedera?.topicId,
          transactionId: node.hedera?.registrationTxId,
          consensusTimestamp: node.hedera?.consensusTimestamp,
          explorerUrl: `https://hashscan.io/testnet/transaction/${transactionId}`
        }
      }
    });
  } catch (error) {
    console.error('Error registering node:', error);
    res.status(500).json({ error: 'Failed to register node on Hedera network' });
  }
};

export const getAllNodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const dataForSale = req.query.dataForSale as string;

    const query: any = {};
    if (status) query.status = status;
    if (dataForSale) query.dataForSale = dataForSale === 'true';

    const nodes = await Node.find(query).sort({ registeredAt: -1 });

    res.json(nodes);
  } catch (error) {
    console.error('Error fetching nodes:', error);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

export const getNodeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;

    const node = await Node.findOne({ nodeId });

    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    // Get latest readings for this node
    const recentReadings = await Reading.find({ nodeId })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      node,
      recentReadings
    });
  } catch (error) {
    console.error('Error fetching node:', error);
    res.status(500).json({ error: 'Failed to fetch node' });
  }
};

export const updateNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;
    const updateData = req.body;

    // Don't allow updating nodeId or hedera data
    delete updateData.nodeId;
    delete updateData.hedera;

    const node = await Node.findOneAndUpdate(
      { nodeId },
      { $set: updateData },
      { new: true }
    );

    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    console.log('✅ Node updated:', nodeId);

    res.json({
      message: 'Node updated successfully',
      node
    });
  } catch (error) {
    console.error('Error updating node:', error);
    res.status(500).json({ error: 'Failed to update node' });
  }
};

export const activateNode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;

    const node = await Node.findOneAndUpdate(
      { nodeId },
      { $set: { status: 'active' } },
      { new: true }
    );

    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    console.log('✅ Node activated:', nodeId);

    res.json({
      message: 'Node activated successfully',
      node
    });
  } catch (error) {
    console.error('Error activating node:', error);
    res.status(500).json({ error: 'Failed to activate node' });
  }
};

export const getNodeStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId } = req.params;

    const node = await Node.findOne({ nodeId });
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    const totalReadings = await Reading.countDocuments({ nodeId });
    const last24hReadings = await Reading.countDocuments({
      nodeId,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const latestReading = await Reading.findOne({ nodeId })
      .sort({ timestamp: -1 });

    res.json({
      nodeId,
      totalReadings,
      last24hReadings,
      uptime: last24hReadings / 24,
      lastSeen: latestReading?.timestamp,
      revenue: node.revenue,
      status: node.status
    });
  } catch (error) {
    console.error('Error fetching node stats:', error);
    res.status(500).json({ error: 'Failed to fetch node stats' });
  }
};