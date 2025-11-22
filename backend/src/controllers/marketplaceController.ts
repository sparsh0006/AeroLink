import { Request, Response } from 'express';
import Node from '../models/Node';
import Purchase from '../models/Purchase';
import Reading from '../models/Reading';
import { transferTokens } from '../services/hedera';

export const getMarketplaceListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = req.query.city as string;
    const minPrice = req.query.minPrice as string;
    const maxPrice = req.query.maxPrice as string;

    // Base query - all active nodes with data for sale
    const query: any = { 
      status: 'active',
      dataForSale: true 
    };

    // Apply filters only if provided
    if (city && city.trim() !== '') {
      query['location.city'] = new RegExp(city.trim(), 'i');
    }

    const nodes = await Node.find(query).sort({ 'pricing.pricePerReading': 1 });

    // Add statistics for each node
    const listings = await Promise.all(
      nodes.map(async (node) => {
        const totalReadings = await Reading.countDocuments({ nodeId: node.nodeId });
        const last24hReadings = await Reading.countDocuments({
          nodeId: node.nodeId,
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        const latestReading = await Reading.findOne({ nodeId: node.nodeId })
          .sort({ timestamp: -1 });

        return {
          ...node.toObject(),
          stats: {
            totalReadings,
            last24hReadings,
            latestReading: latestReading?.timestamp,
            avgAQI: latestReading?.aqi?.value
          }
        };
      })
    );

    // Filter by price if provided
    let filteredListings = listings;
    if (minPrice || maxPrice) {
      filteredListings = listings.filter(listing => {
        const price = listing.pricing?.pricePerReading || 0;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    console.log(`📊 Marketplace listings: ${filteredListings.length} nodes available`);

    res.json(filteredListings);
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace listings' });
  }
};

export const purchaseData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nodeId, buyerWallet, buyerEmail, purchaseType, duration, readingsCount } = req.body;

    // Validate required fields
    if (!nodeId || !buyerWallet || !buyerEmail || !purchaseType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Get node
    const node = await Node.findOne({ nodeId });
    if (!node) {
      res.status(404).json({ error: 'Node not found' });
      return;
    }

    if (!node.dataForSale) {
      res.status(400).json({ error: 'Data not available for sale' });
      return;
    }

    // Calculate amount based on purchase type
    let amount = 0;
    let tokenAmount = 0;
    let expiresAt: Date | undefined;

    switch (purchaseType) {
      case 'single':
        amount = node.pricing?.pricePerReading || 0;
        tokenAmount = amount * 10; // 1 USD = 10 AERO tokens
        break;
      case 'subscription':
        if (!duration) {
          res.status(400).json({ error: 'Duration required for subscription' });
          return;
        }
        amount = (node.pricing?.subscriptionMonthly || 0) * (duration / 30);
        tokenAmount = amount * 10;
        expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        break;
      case 'bulk':
        if (!readingsCount) {
          res.status(400).json({ error: 'Readings count required for bulk purchase' });
          return;
        }
        amount = (node.pricing?.bulkDataPrice || 0) * (readingsCount / 1000);
        tokenAmount = amount * 10;
        break;
      default:
        res.status(400).json({ error: 'Invalid purchase type' });
        return;
    }

    // Create purchase record
    const purchase = new Purchase({
      buyerWallet,
      buyerEmail,
      nodeId,
      purchaseType,
      amount,
      tokenAmount,
      duration,
      readingsCount,
      status: 'pending',
      expiresAt
    });

    await purchase.save();

    // Process token transfer and update node owner's revenue
    try {
      const tokenId = process.env.HEDERA_TOKEN_ID;
      
      // In production, this would be actual Hedera token transfer from buyer to node owner
      console.log('💰 Processing payment:', {
        from: buyerWallet,
        to: node.ownerWallet,
        amount: tokenAmount,
        amountUSD: amount,
        tokenId
      });

      // Uncomment for actual Hedera token transfer:
      // if (tokenId && node.ownerWallet) {
      //   const txId = await transferTokens(tokenId, node.ownerWallet, tokenAmount);
      //   purchase.hederaTxId = txId;
      // }
      
      // Mark purchase as completed
      purchase.status = 'completed';
      purchase.hederaTxId = 'demo-tx-' + Date.now();
      await purchase.save();

      // Update node owner's revenue (THIS IS THE KEY PART)
      node.revenue = (node.revenue || 0) + amount;
      await node.save();

      console.log(`✅ Payment completed: ${amount} USD transferred to node owner ${node.ownerName}`);
      console.log(`💵 Node ${nodeId} total revenue: ${node.revenue} USD`);

      res.status(201).json({
        message: 'Purchase completed successfully',
        purchase,
        accessToken: `access-${purchase._id}`,
        payment: {
          amountUSD: amount,
          amountAERO: tokenAmount,
          recipient: node.ownerName,
          recipientWallet: node.ownerWallet
        }
      });
    } catch (transferError) {
      purchase.status = 'failed';
      await purchase.save();
      
      console.error('Payment processing failed:', transferError);
      res.status(500).json({ error: 'Payment processing failed' });
    }
  } catch (error) {
    console.error('Error processing purchase:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
};

export const getPurchaseHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet } = req.params;

    const purchases = await Purchase.find({ buyerWallet: wallet })
      .sort({ purchasedAt: -1 });

    // Enrich with node data
    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        const node = await Node.findOne({ nodeId: purchase.nodeId });
        return {
          ...purchase.toObject(),
          nodeDetails: node ? {
            ownerName: node.ownerName,
            location: node.location,
            sensors: node.sensors
          } : null
        };
      })
    );

    res.json(enrichedPurchases);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
};

export const getAccessData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { purchaseId } = req.params;
    const { accessToken } = req.query;

    // Validate access token
    if (accessToken !== `access-${purchaseId}`) {
      res.status(403).json({ error: 'Invalid access token' });
      return;
    }

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      res.status(404).json({ error: 'Purchase not found' });
      return;
    }

    if (purchase.status !== 'completed') {
      res.status(400).json({ error: 'Purchase not completed' });
      return;
    }

    // Check if subscription is expired
    if (purchase.expiresAt && purchase.expiresAt < new Date()) {
      res.status(403).json({ error: 'Subscription expired' });
      return;
    }

    // Get readings based on purchase type
    let readings;
    switch (purchase.purchaseType) {
      case 'single':
        readings = await Reading.findOne({ nodeId: purchase.nodeId })
          .sort({ timestamp: -1 });
        break;
      case 'subscription':
        readings = await Reading.find({
          nodeId: purchase.nodeId,
          timestamp: { 
            $gte: purchase.purchasedAt,
            $lte: purchase.expiresAt || new Date()
          }
        }).sort({ timestamp: -1 });
        break;
      case 'bulk':
        readings = await Reading.find({ nodeId: purchase.nodeId })
          .sort({ timestamp: -1 })
          .limit(purchase.readingsCount || 100);
        break;
    }

    // Mark as accessed
    if (!purchase.dataAccessed) {
      purchase.dataAccessed = true;
      await purchase.save();
    }

    res.json({
      purchase: {
        id: purchase._id,
        nodeId: purchase.nodeId,
        purchaseType: purchase.purchaseType,
        purchasedAt: purchase.purchasedAt,
        expiresAt: purchase.expiresAt
      },
      data: readings
    });
  } catch (error) {
    console.error('Error fetching access data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
};

export const getMarketplaceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalNodes = await Node.countDocuments({ dataForSale: true, status: 'active' });
    const totalPurchases = await Purchase.countDocuments({ status: 'completed' });
    const totalRevenue = await Node.aggregate([
      { $match: { dataForSale: true } },
      { $group: { _id: null, total: { $sum: '$revenue' } } }
    ]);

    const topNodes = await Node.find({ dataForSale: true, status: 'active' })
      .sort({ revenue: -1 })
      .limit(5);

    res.json({
      totalNodes,
      totalPurchases,
      totalRevenue: totalRevenue[0]?.total || 0,
      topNodes
    });
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({ error: 'Failed to fetch marketplace stats' });
  }
};