import { connectDB, disconnectDB } from '../services/mongo';
import { createTokenIfMissing } from '../services/hedera';
import { calculateRewards, issueRewards } from '../services/rewardService';

const runRewardJob = async () => {
  try {
    console.log('💰 Starting reward calculation job...');
    
    await connectDB();

    // Ensure token exists
    const tokenId = await createTokenIfMissing();
    console.log('🪙 Token ID:', tokenId);

    // Calculate rewards based on last 24h performance
    const rewards = await calculateRewards();
    
    console.log(`\n📊 Calculated rewards for ${rewards.length} nodes:\n`);
    console.log('─'.repeat(80));
    console.log('Node ID      | Readings | Uptime | Quality | Location | Tokens');
    console.log('─'.repeat(80));
    
    for (const reward of rewards) {
      console.log(
        `${reward.nodeId.padEnd(12)} | ` +
        `${String(reward.readingsCount).padStart(8)} | ` +
        `${(reward.uptimeScore * 100).toFixed(1).padStart(6)}% | ` +
        `${(reward.qualityScore * 100).toFixed(1).padStart(7)}% | ` +
        `${reward.locationMultiplier.toFixed(1).padStart(8)}x | ` +
        `${String(reward.rewardTokens).padStart(6)}`
      );
    }
    
    console.log('─'.repeat(80));
    
    const totalTokens = rewards.reduce((sum, r) => sum + r.rewardTokens, 0);
    console.log(`\n💎 Total tokens to distribute: ${totalTokens} AERO\n`);

    // Issue rewards
    await issueRewards(rewards, tokenId);

    console.log('✅ Reward job completed successfully!');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reward job failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

runRewardJob();