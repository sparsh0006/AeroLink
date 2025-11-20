import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TransferTransaction,
  AccountId,
  TopicId,
  TokenId
} from '@hashgraph/sdk';
import dotenv from 'dotenv';

dotenv.config();

let client: Client | null = null;

export const initHederaClient = (): Client => {
  if (client) return client;

  const network = process.env.HEDERA_NETWORK || 'testnet';
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env');
  }

  if (network === 'testnet') {
    client = Client.forTestnet();
  } else if (network === 'mainnet') {
    client = Client.forMainnet();
  } else {
    throw new Error('Invalid HEDERA_NETWORK. Use testnet or mainnet');
  }

  client.setOperator(operatorId, operatorKey);
  console.log('✅ Hedera client initialized for', network);
  
  return client;
};

export const createTopicIfMissing = async (): Promise<string> => {
  const existingTopicId = process.env.HEDERA_TOPIC_ID;
  
  if (existingTopicId && existingTopicId.trim() !== '') {
    console.log('📋 Using existing Topic ID:', existingTopicId);
    return existingTopicId;
  }

  const hederaClient = initHederaClient();
  
  console.log('🔨 Creating new HCS topic...');
  
  const transaction = new TopicCreateTransaction()
    .setTopicMemo('AeroLink DePIN Weather & Pollution Data');

  const txResponse = await transaction.execute(hederaClient);
  const receipt = await txResponse.getReceipt(hederaClient);
  const topicId = receipt.topicId;

  if (!topicId) {
    throw new Error('Failed to create topic');
  }

  console.log('✅ Topic created:', topicId.toString());
  console.log('⚠️  Add this to your .env file: HEDERA_TOPIC_ID=' + topicId.toString());
  
  return topicId.toString();
};

export const publishToTopic = async (
  topicId: string,
  message: any
): Promise<{ transactionId: string; consensusTimestamp: string }> => {
  const hederaClient = initHederaClient();
  
  const messageString = JSON.stringify(message);
  
  const transaction = new TopicMessageSubmitTransaction({
    topicId: TopicId.fromString(topicId),
    message: messageString,
  });

  const txResponse = await transaction.execute(hederaClient);
  const receipt = await txResponse.getReceipt(hederaClient);
  const record = await txResponse.getRecord(hederaClient);
  
  const consensusTimestamp = record.consensusTimestamp?.toString() || '';
  const transactionId = txResponse.transactionId.toString();

  console.log('📤 Published to HCS:', {
    topicId,
    transactionId,
    consensusTimestamp,
    messageSize: messageString.length
  });

  return {
    transactionId,
    consensusTimestamp
  };
};

export const createTokenIfMissing = async (): Promise<string> => {
  const existingTokenId = process.env.HEDERA_TOKEN_ID;
  
  if (existingTokenId && existingTokenId.trim() !== '') {
    console.log('🪙 Using existing Token ID:', existingTokenId);
    return existingTokenId;
  }

  const hederaClient = initHederaClient();
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_OPERATOR_KEY!);

  console.log('🔨 Creating new HTS token...');

  const transaction = new TokenCreateTransaction()
    .setTokenName('AeroLink Reward Token')
    .setTokenSymbol('AERO')
    .setDecimals(2)
    .setInitialSupply(1000000)
    .setTreasuryAccountId(AccountId.fromString(operatorId))
    .setSupplyType(TokenSupplyType.Infinite)
    .setTokenType(TokenType.FungibleCommon)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey);

  const txResponse = await transaction.execute(hederaClient);
  const receipt = await txResponse.getReceipt(hederaClient);
  const tokenId = receipt.tokenId;

  if (!tokenId) {
    throw new Error('Failed to create token');
  }

  console.log('✅ Token created:', tokenId.toString());
  console.log('⚠️  Add this to your .env file: HEDERA_TOKEN_ID=' + tokenId.toString());

  return tokenId.toString();
};

export const transferTokens = async (
  tokenId: string,
  toAccountId: string,
  amount: number
): Promise<string> => {
  const hederaClient = initHederaClient();
  const operatorId = process.env.HEDERA_OPERATOR_ID!;

  const transaction = new TransferTransaction()
    .addTokenTransfer(tokenId, operatorId, -amount)
    .addTokenTransfer(tokenId, toAccountId, amount);

  const txResponse = await transaction.execute(hederaClient);
  const receipt = await txResponse.getReceipt(hederaClient);

  console.log('💰 Token transfer successful:', {
    from: operatorId,
    to: toAccountId,
    amount,
    status: receipt.status.toString()
  });

  return txResponse.transactionId.toString();
};