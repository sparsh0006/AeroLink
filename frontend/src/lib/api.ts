import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Reading {
  _id: string;
  nodeId: string;
  timestamp: string;
  location: {
    lat: number;
    lon: number;
  };
  sensors: {
    pm25: number;
    pm10: number;
    co2?: number;
    no2?: number;
    o3?: number;
    temp: number;
    rh: number;
  };
  aqi: {
    value: number;
    category: string;
  };
  source: string;
  battery?: number;
  firmware?: string;
  hedera?: {
    topicId: string;
    messageId: string;
    consensusTimestamp: string;
    publishedMessage: any;
  };
}

export const fetchRecentReadings = async (): Promise<Reading[]> => {
  const response = await axios.get(`${API_URL}/readings?limit=100`);
  return response.data;
};

export const fetchNodeReadings = async (nodeId: string): Promise<Reading[]> => {
  const response = await axios.get(`${API_URL}/readings/${nodeId}`);
  return response.data;
};

export const createReading = async (reading: Partial<Reading>): Promise<Reading> => {
  const response = await axios.post(`${API_URL}/readings`, reading);
  return response.data;
};