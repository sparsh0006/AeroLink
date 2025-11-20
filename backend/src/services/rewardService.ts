import Reading from '../models/Reading';
import { transferTokens } from './hedera';

interface RewardCalculation {
  nodeId: string;
  readingsCount: number;
  uptimeScore: number;
  qualityScore: number;
  locationMultiplier: number;
  rewardTokens: number;
}

const BASE_REWARD_RATE = 100; // base tokens per period
const EXPECTED_READINGS_PER_DAY = 24; // 1 reading per hour

export const calculateRewards = async (): Promise<RewardCalculation[]> => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get all readings from the last 24 hours
  const recentReadings = await Reading.find({
    timestamp: { $gte: oneDayAgo }
  });

  // Group by nodeId
  const nodeReadings = new Map<string, any[]>();
  
  for (const reading of recentReadings) {
    if (!nodeReadings.has(reading.nodeId)) {
      nodeReadings.set(reading.nodeId, []);
    }
    nodeReadings.get(reading.nodeId)!.push(reading);
  }

  const rewards: RewardCalculation[] = [];

  for (const [nodeId, readings] of nodeReadings.entries()) {
    // Calculate uptime score
    const uptimeScore = Math.min(readings.length / EXPECTED_READINGS_PER_DAY, 1);

    // Calculate quality score (readings with valid data and Hedera proof)
    const validReadings = readings.filter(r => 
      r.sensors.pm25 > 0 && 
      r.sensors.temp > -50 && 
      r.sensors.temp < 60 &&
      r.hedera?.topicId
    );
    const qualityScore = validReadings.length / readings.length;

    // Location multiplier (reward nodes in underserved areas more)
    // For demo: nodes in certain lat/lon ranges get higher rewards
    const avgLat = readings.reduce((sum, r) => sum + r.location.lat, 0) / readings.length;
    const locationMultiplier = avgLat < 15 && avgLat > 8 ? 1.5 : 1.0;

    // Calculate final reward
    const rewardTokens = Math.floor(
      BASE_REWARD_RATE * uptimeScore * qualityScore * locationMultiplier
    );

    rewards.push({
      nodeId,
      readingsCount: readings.length,
      uptimeScore,
      qualityScore,
      locationMultiplier,
      rewardTokens
    });
  }

  return rewards;
};

export const issueRewards = async (
  rewards: RewardCalculation[],
  tokenId: string
): Promise<void> => {
  console.log('💰 Issuing rewards to nodes...');
  
  for (const reward of rewards) {
    if (reward.rewardTokens > 0) {
      try {
        // In a real scenario, each node would have its own account
        // For demo, we'll use the operator account or skip actual transfer
        console.log(`  → ${reward.nodeId}: ${reward.rewardTokens} AERO tokens`);
        console.log(`     Uptime: ${(reward.uptimeScore * 100).toFixed(1)}% | Quality: ${(reward.qualityScore * 100).toFixed(1)}%`);
        
        // Uncomment when you have actual node accounts:
        // const txId = await transferTokens(tokenId, nodeAccountId, reward.rewardTokens);
        // Store txId in database for audit trail
      } catch (error) {
        console.error(`Failed to issue reward to ${reward.nodeId}:`, error);
      }
    }
  }
  
  console.log('✅ Reward issuance complete');
};