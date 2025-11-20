# AeroLink DePIN - Weather & Pollution Monitoring Network

A decentralized physical infrastructure network (DePIN) for environmental monitoring using Hedera Consensus Service (HCS) and Token Service (HTS).

## 🎯 Features

- **Real-time Environmental Monitoring**: Track PM2.5, PM10, temperature, humidity, and more
- **Hedera Integration**: Immutable proof via HCS, rewards via HTS
- **Interactive Map**: Visualize sensor nodes across regions
- **Reward System**: Automated token distribution based on uptime and data quality
- **Mock Data Support**: Test the system with realistic mock sensor data

## 🏗️ Architecture

- **Backend**: TypeScript + Express + MongoDB + Hedera SDK
- **Frontend**: Next.js 14 + React + Leaflet
- **Blockchain**: Hedera Testnet (HCS for data integrity, HTS for rewards)

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (Community Edition)
3. **Hedera Testnet Account** (Get from [Hedera Portal](https://portal.hedera.com))

## 🚀 Quick Start

### 1. Install MongoDB

**macOS (via Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb-org
```

**Windows:**
Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### 2. Start MongoDB

Create data directory and start MongoDB:
```bash
mkdir -p ./data/db
mongod --dbpath ./data/db
```

Keep this terminal open.

### 3. Setup Backend

In a new terminal:

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.sample .env
```

Edit `backend/.env` and add your Hedera credentials:
```bash
PORT=4000
MONGO_URI=mongodb://localhost:27017/aerolink
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
HEDERA_TOPIC_ID=
HEDERA_TOKEN_ID=
```

**Get Hedera Testnet Credentials:**
1. Visit [Hedera Portal](https://portal.hedera.com)
2. Create a testnet account
3. Copy your Account ID and Private Key

### 4. Seed Database

```bash
# This will create HCS topic and seed mock data
npm run seed
```

The script will output your `HEDERA_TOPIC_ID`. Add it to your `.env` file.

### 5. Start Backend Server

```bash
npm run dev
```

Backend runs on `http://localhost:4000`

### 6. Setup Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

## 🧪 Testing the System

### View the Dashboard
Open `http://localhost:3000` to see:
- Interactive map with sensor nodes
- Real-time readings
- Hedera proof verification

### Test API Endpoints

**Get all readings:**
```bash
curl http://localhost:4000/api/readings
```

**Get readings by node:**
```bash
curl http://localhost:4000/api/readings/node-001
```

**Create new reading:**
```bash
curl -X POST http://localhost:4000/api/readings \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": "node-test",
    "location": {"lat": 11.0, "lon": 76.9},
    "sensors": {"pm25": 25, "pm10": 40, "temp": 28, "rh": 65},
    "aqi": {"value": 70, "category": "Moderate"}
  }'
```

### Run Reward Calculation

```bash
cd backend
npm run reward
```

This analyzes the last 24 hours of data and calculates token rewards based on:
- **Uptime Score**: Number of readings vs. expected
- **Quality Score**: Valid data with Hedera proofs
- **Location Multiplier**: Higher rewards for underserved areas

## 🔐 Hedera Integration Details

### HCS (Consensus Service)
- Each reading is published to a Hedera topic
- Compact message format (< 1KB) to minimize fees
- Includes SHA256 hash for data integrity verification
- Consensus timestamp provides immutable proof

### HTS (Token Service)
- Reward token: AERO
- Distributed based on node performance
- Tracks all transactions on-chain

### View on Hedera Explorer
Visit: `https://hashscan.io/testnet/topic/YOUR_TOPIC_ID`

## 📁 Project Structure

```
aerolink-depin/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server
│   │   ├── models/
│   │   │   └── Reading.ts        # MongoDB schema
│   │   ├── services/
│   │   │   ├── mongo.ts          # Database connection
│   │   │   ├── hedera.ts         # Hedera SDK integration
│   │   │   └── rewardService.ts  # Token reward logic
│   │   ├── controllers/
│   │   │   └── readingsController.ts
│   │   ├── routes/
│   │   │   └── readings.ts
│   │   ├── seed/
│   │   │   └── mockSeed.ts       # Mock data seeding
│   │   └── jobs/
│   │       └── rewardJob.ts      # Reward calculation
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # Main dashboard
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── MapView.tsx       # Leaflet map
    │   │   └── NodeCard.tsx      # Reading card + proof modal
    │   └── lib/
    │       └── api.ts            # API client
    ├── package.json
    └── .env.local
```

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run seed` - Seed database with mock data
- `npm run reward` - Run reward calculation
- `npm run build` - Build for production
- `npm start` - Start production server

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server



## 📊 Reward Algorithm

```
rewardTokens = baseRate × uptimeScore × qualityScore × locationMultiplier

where:
- baseRate = 100 tokens
- uptimeScore = readings_count / expected_readings (capped at 1.0)
- qualityScore = valid_readings / total_readings
- locationMultiplier = 1.5 for underserved areas, 1.0 otherwise
```


## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome! Please test thoroughly before submitting.

## 📧 Support

For issues, please open a GitHub issue or contact the development team.

---

Built with ❤️ using Hedera, TypeScript, and Next.js