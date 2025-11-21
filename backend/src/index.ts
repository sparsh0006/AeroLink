import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './services/mongo';
import { initHederaClient } from './services/hedera';
import readingsRouter from './routes/readings';
import nodesRouter from './routes/nodes';
import marketplaceRouter from './routes/marketplace';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', readingsRouter);
app.use('/api', nodesRouter);
app.use('/api', marketplaceRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'AeroLink DePIN Backend'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Hedera client
    initHederaClient();

    app.listen(PORT, () => {
      console.log('🚀 AeroLink DePIN Backend');
      console.log('─'.repeat(50));
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🔗 API endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/readings`);
      console.log(`   GET  http://localhost:${PORT}/api/readings`);
      console.log(`   GET  http://localhost:${PORT}/api/readings/:nodeId`);
      console.log('─'.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();