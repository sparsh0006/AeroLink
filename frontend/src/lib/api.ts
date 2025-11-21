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

export interface Node {
  _id: string;
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
  status: string;
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
  stats?: {
    totalReadings: number;
    last24hReadings: number;
    latestReading: string;
    avgAQI: number;
  };
}

export interface Purchase {
  _id: string;
  buyerWallet: string;
  nodeId: string;
  purchaseType: string;
  amount: number;
  tokenAmount: number;
  status: string;
  purchasedAt: string;
  expiresAt?: string;
}

// Readings API
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

// Nodes API
export const registerNode = async (nodeData: any): Promise<any> => {
  const response = await axios.post(`${API_URL}/nodes`, nodeData);
  return response.data;
};

export const fetchAllNodes = async (): Promise<Node[]> => {
  const response = await axios.get(`${API_URL}/nodes`);
  return response.data;
};

export const fetchNodeDetails = async (nodeId: string): Promise<any> => {
  const response = await axios.get(`${API_URL}/nodes/${nodeId}`);
  return response.data;
};

export const updateNode = async (nodeId: string, updateData: any): Promise<Node> => {
  const response = await axios.put(`${API_URL}/nodes/${nodeId}`, updateData);
  return response.data;
};

// Marketplace API
export const fetchMarketplaceListings = async (filters?: {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Node[]> => {
  const params = new URLSearchParams();
  if (filters?.city) params.append('city', filters.city);
  if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  
  const url = params.toString() 
    ? `${API_URL}/marketplace/listings?${params}`
    : `${API_URL}/marketplace/listings`;
  
  const response = await axios.get(url);
  return response.data;
};

export const purchaseData = async (purchaseData: {
  nodeId: string;
  buyerWallet: string;
  buyerEmail: string;
  purchaseType: string;
  duration?: number;
  readingsCount?: number;
}): Promise<any> => {
  const response = await axios.post(`${API_URL}/marketplace/purchase`, purchaseData);
  return response.data;
};

export const fetchPurchaseHistory = async (wallet: string): Promise<Purchase[]> => {
  const response = await axios.get(`${API_URL}/marketplace/purchases/${wallet}`);
  return response.data;
};

export const fetchMarketplaceStats = async (): Promise<any> => {
  const response = await axios.get(`${API_URL}/marketplace/stats`);
  return response.data;
};