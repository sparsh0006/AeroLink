# AeroLink DePIN — Weather & Pollution Monitoring Network

> **Breathe Truth. Powered by the Crowd.**

A decentralized physical infrastructure network (DePIN) for real-time environmental monitoring — built on Hedera Consensus Service (HCS) and Token Service (HTS).

🌐 **Live Demo:** [aero-link-nx1i-ftrneg75d-sparsh0006s-projects.vercel.app](https://aero-link-nx1i-ftrneg75d-sparsh0006s-projects.vercel.app/)
📦 **GitHub:** [github.com/sparsh0006/AeroLink](https://github.com/sparsh0006/AeroLink)
🎥 **Demo Video:** [Watch on Google Drive](https://drive.google.com/drive/folders/1RtL4M9Mjn3sz5VRg3vlOcN0FkOJgKOx-?usp=sharing)

---

## 🔗 On-Chain Proof

| Item | Value |
|---|---|
| Hedera Account ID | `0.0.5900886` |
| HCS Topic ID | `0.0.7289471` |
| First TX Hash | `0.0.5900886@1774314552.174889040` |
| EVM Address | `0xE0F6E4A65470c93d7Bc9DA29Ecc3687A202a7f8c` |
| HashScan Topic | [View on HashScan](https://hashscan.io/testnet/topic/0.0.7289471) |
| HashScan Account | [View on HashScan](https://hashscan.io/testnet/account/0.0.5900886) |

---

## 🎯 What It Does

Anyone can run a sensor node to track **PM2.5, PM10, temperature, humidity, and AQI**. Every reading gets anchored to Hedera's Consensus Service with a SHA256 hash and consensus timestamp — tamper-proof and publicly verifiable. Node operators earn **AERO tokens** via HTS based on uptime, data quality, and location.

### Core Features
- **Real-time Environmental Monitoring** — PM2.5, PM10, temperature, humidity, AQI
- **Hedera HCS Integration** — every reading published with SHA256 hash + immutable consensus timestamp
- **AERO Token Rewards** — automated distribution via HTS based on node performance
- **Interactive Map Dashboard** — visualize live sensor nodes across regions
- **Public Proof Verification** — every data point verifiable on HashScan

---

## 🏗️ Architecture

- **Backend:** TypeScript + Express + MongoDB + Hedera SDK
- **Frontend:** Next.js 14 + React + Leaflet.js
- **Blockchain:** Hedera Testnet — HCS for data integrity, HTS for rewards
- **Deployed:** Vercel (frontend)

---

## 📊 Reward Algorithm

```
rewardTokens = baseRate × uptimeScore × qualityScore × locationMultiplier

where:
  baseRate          = 100 AERO tokens
  uptimeScore       = readings_submitted / expected_readings  (capped at 1.0)
  qualityScore      = hedera_verified_readings / total_readings
  locationMultiplier = 1.5× for underserved areas | 1.0× elsewhere
```

> The less data a region has, the more you earn for filling that gap.

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- MongoDB Community Edition
- Hedera Testnet Account — [Get one free](https://portal.hedera.com)

### 1. Start MongoDB

```bash
mkdir -p ./data/db
mongod --dbpath ./data/db
```

Keep this terminal open.

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.sample .env
```

Edit `backend/.env`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/aerolink
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
HEDERA_TOPIC_ID=
HEDERA_TOKEN_ID=
```

```bash
npm run seed    # creates HCS topic + loads mock sensor data
npm run dev     # starts backend on http://localhost:4000
```

> After `npm run seed`, copy the printed `HEDERA_TOPIC_ID` into your `.env`.

### 3. Setup Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local
npm run dev     # starts frontend on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the live map, sensor readings, and Hedera proof verification.

---

## 🧪 API Reference

**Get all readings:**
```bash
curl http://localhost:4000/api/readings
```

**Get readings by node:**
```bash
curl http://localhost:4000/api/readings/node-001
```

**Submit a new reading:**
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

**Run reward calculation:**
```bash
cd backend && npm run reward
```

---

## 🔐 Hedera Integration

### HCS — Consensus Service
- Every sensor reading published to Topic `0.0.7289471`
- Compact message format kept under 1KB to minimize fees
- SHA256 hash included for data integrity
- Consensus timestamp = immutable, public proof

### HTS — Token Service
- **AERO token** minted and distributed to node operators
- Reward logic runs automatically based on 24h performance windows
- All transactions trackable on [HashScan](https://hashscan.io/testnet/account/0.0.5900886)

---

## 📁 Project Structure

```
aerolink-depin/
├── backend/
│   └── src/
│       ├── index.ts                  # Express server
│       ├── models/Reading.ts         # MongoDB schema
│       ├── services/
│       │   ├── hedera.ts             # HCS + HTS integration
│       │   ├── mongo.ts              # DB connection
│       │   └── rewardService.ts      # Token reward logic
│       ├── controllers/readingsController.ts
│       ├── routes/readings.ts
│       ├── seed/mockSeed.ts          # Mock sensor data
│       └── jobs/rewardJob.ts         # Reward calculation job
│
└── frontend/
    └── src/
        ├── app/page.tsx              # Main dashboard
        ├── components/
        │   ├── MapView.tsx           # Leaflet map
        │   └── NodeCard.tsx          # Reading card + proof modal
        └── lib/api.ts                # API client
```

---

## 🔧 Scripts

| Location | Command | Description |
|---|---|---|
| backend | `npm run dev` | Start dev server (port 4000) |
| backend | `npm run seed` | Load mock data + create HCS topic |
| backend | `npm run reward` | Run AERO reward calculation |
| backend | `npm run build` | Build for production |
| frontend | `npm run dev` | Start dev server (port 3000) |
| frontend | `npm run build` | Build for production |

---

## 📝 License

MIT

## 🤝 Contributing

PRs welcome. Please test thoroughly before submitting.

---

Built with ❤️ using Hedera, TypeScript, and Next.js