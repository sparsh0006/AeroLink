import mongoose, { Schema, Document } from 'mongoose';

export interface INode extends Document {
  nodeId: string;
  ownerName: string;
  ownerEmail: string;
  ownerWallet: string;
  location: {
    lat: number;
    lon: number;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  sensors: string[];
  status: 'pending' | 'active' | 'inactive' | 'maintenance';
  registeredAt: Date;
  lastSeen?: Date;
  dataForSale: boolean;
  pricing?: {
    pricePerReading: number;
    subscriptionMonthly: number;
    bulkDataPrice: number;
  };
  totalReadings: number;
  revenue: number;
  hedera?: {
    topicId: string;
    registrationTxId: string;
    consensusTimestamp: string;
  };
}

const NodeSchema: Schema = new Schema({
  nodeId: { type: String, required: true, unique: true, index: true },
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  ownerWallet: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true }
  },
  sensors: [{ type: String }],
  status: { 
    type: String, 
    enum: ['pending', 'active', 'inactive', 'maintenance'],
    default: 'active'
  },
  registeredAt: { type: Date, default: Date.now },
  lastSeen: { type: Date },
  dataForSale: { type: Boolean, default: false },
  pricing: {
    pricePerReading: { type: Number, default: 0 },
    subscriptionMonthly: { type: Number, default: 0 },
    bulkDataPrice: { type: Number, default: 0 }
  },
  totalReadings: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  hedera: {
    topicId: { type: String },
    registrationTxId: { type: String },
    consensusTimestamp: { type: String }
  }
}, {
  timestamps: true
});

export default mongoose.model<INode>('Node', NodeSchema);