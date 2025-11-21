import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchase extends Document {
  buyerWallet: string;
  buyerEmail: string;
  nodeId: string;
  purchaseType: 'single' | 'subscription' | 'bulk';
  amount: number;
  tokenAmount: number;
  duration?: number; // for subscriptions (in days)
  readingsCount?: number; // for bulk purchases
  status: 'pending' | 'completed' | 'failed';
  hederaTxId?: string;
  purchasedAt: Date;
  expiresAt?: Date;
  dataAccessed: boolean;
}

const PurchaseSchema: Schema = new Schema({
  buyerWallet: { type: String, required: true, index: true },
  buyerEmail: { type: String, required: true },
  nodeId: { type: String, required: true, index: true },
  purchaseType: { 
    type: String, 
    enum: ['single', 'subscription', 'bulk'],
    required: true
  },
  amount: { type: Number, required: true },
  tokenAmount: { type: Number, required: true },
  duration: { type: Number },
  readingsCount: { type: Number },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  hederaTxId: { type: String },
  purchasedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  dataAccessed: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);