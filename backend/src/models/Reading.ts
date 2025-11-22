import mongoose, { Schema, Document } from 'mongoose';

export interface ISensor {
  pm25: number;
  pm10: number;
  co2?: number;
  no2?: number;
  o3?: number;
  temp: number;
  rh: number;
}

export interface IAQI {
  value: number;
  category: string;
}

export interface ILocation {
  lat: number;
  lon: number;
}

export interface IHedera {
  topicId: string;
  messageId: string;
  consensusTimestamp: string;
  publishedMessage: any;
}

export interface IReading extends Document {
  nodeId: string;
  timestamp: Date;
  location: ILocation;
  sensors: ISensor;
  aqi: IAQI;
  // include 'auto' here
  source: 'mock' | 'live' | 'auto';
  battery?: number;
  firmware?: string;
  hedera?: IHedera;
}

const ReadingSchema: Schema = new Schema({
  nodeId: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  sensors: {
    pm25: { type: Number, required: true },
    pm10: { type: Number, required: true },
    co2: { type: Number },
    no2: { type: Number },
    o3: { type: Number },
    temp: { type: Number, required: true },
    rh: { type: Number, required: true }
  },
  aqi: {
    value: { type: Number, required: true },
    category: { type: String, required: true }
  },
  // add 'auto' to the enum; keep default as 'mock' or set to 'auto' if preferred
  source: { type: String, enum: ['mock', 'live', 'auto'], default: 'mock' },
  battery: { type: Number },
  firmware: { type: String },
  hedera: {
    topicId: { type: String },
    messageId: { type: String },
    consensusTimestamp: { type: String },
    publishedMessage: { type: Schema.Types.Mixed }
  }
}, {
  timestamps: true
});

export default mongoose.model<IReading>('Reading', ReadingSchema);
