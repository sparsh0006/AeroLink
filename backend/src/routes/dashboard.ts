import { Router } from 'express';
import Node from '../models/Node';
import Reading from '../models/Reading';

const router = Router();

router.get('/dashboard/stats', async (req, res) => {
  try {
    // Active nodes count
    const activeNodes = await Node.countDocuments({ status: 'active' });

    // Total readings count
    const totalReadings = await Reading.countDocuments();

    // Average AQI
    const aqiData = await Reading.aggregate([
      { $group: { _id: null, avgAQI: { $avg: '$aqi.value' } } }
    ]);
    const avgAQI = aqiData[0]?.avgAQI || 0;

    // Hedera verified count
    const hederaVerified = await Reading.countDocuments({ 
      'hedera.topicId': { $exists: true } 
    });

    res.json({
      activeNodes,
      totalReadings,
      avgAQI: Math.round(avgAQI),
      hederaVerified
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;