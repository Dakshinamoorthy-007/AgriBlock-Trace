// Mock data for AgriChain demo
import { Batch, MiddlemanAction, TraceResult } from './types';

export const mockBatches: Batch[] = [
  {
    id: 'batch-001',
    batchCode: 'AGRI-BATCH-TOMATO-915612',
    cropName: 'Tomato',
    cropNameTamil: 'தக்காளி',
    quantity: 500,
    unit: 'kg',
    harvestDate: new Date('2024-01-15'),
    location: 'Coimbatore',
    village: 'Sulur',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    farmerId: 'farmer-001',
    farmerName: 'Raman Kumar',
    blockchainTxHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    dataHash: 'sha256:abc123def456...',
    status: 'in-transit',
    createdAt: new Date('2024-01-15T08:30:00'),
  },
  {
    id: 'batch-002',
    batchCode: 'AGRI-BATCH-ONION-823456',
    cropName: 'Onion',
    cropNameTamil: 'வெங்காயம்',
    quantity: 1000,
    unit: 'kg',
    harvestDate: new Date('2024-01-12'),
    location: 'Madurai',
    village: 'Thiruparankundram',
    district: 'Madurai',
    state: 'Tamil Nadu',
    farmerId: 'farmer-002',
    farmerName: 'Selvam Pillai',
    blockchainTxHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    dataHash: 'sha256:xyz789ghi012...',
    status: 'verified',
    createdAt: new Date('2024-01-12T09:00:00'),
  },
  {
    id: 'batch-003',
    batchCode: 'AGRI-BATCH-RICE-734521',
    cropName: 'Rice',
    cropNameTamil: 'அரிசி',
    quantity: 2,
    unit: 'tonnes',
    harvestDate: new Date('2024-01-10'),
    location: 'Thanjavur',
    village: 'Kumbakonam',
    district: 'Thanjavur',
    state: 'Tamil Nadu',
    farmerId: 'farmer-003',
    farmerName: 'Murugan Iyer',
    blockchainTxHash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
    dataHash: 'sha256:mno345pqr678...',
    status: 'delivered',
    createdAt: new Date('2024-01-10T07:45:00'),
  },
];

export const mockActions: MiddlemanAction[] = [
  {
    id: 'action-001',
    batchId: 'batch-001',
    middlemanId: 'middleman-001',
    middlemanName: 'Chennai Traders',
    actionType: 'transport',
    description: 'Transported from farm to Chennai warehouse',
    fromLocation: 'Sulur, Coimbatore',
    toLocation: 'Chennai Central Warehouse',
    timestamp: new Date('2024-01-16T10:00:00'),
    blockchainTxHash: '0xabc123...',
    actionHash: 'sha256:transport001...',
  },
  {
    id: 'action-002',
    batchId: 'batch-001',
    middlemanId: 'middleman-001',
    middlemanName: 'Chennai Traders',
    actionType: 'storage',
    description: 'Cold storage at 4°C',
    storageCondition: 'Cold Storage',
    temperature: 4,
    humidity: 85,
    timestamp: new Date('2024-01-16T14:00:00'),
    blockchainTxHash: '0xdef456...',
    actionHash: 'sha256:storage001...',
  },
  {
    id: 'action-003',
    batchId: 'batch-001',
    middlemanId: 'middleman-002',
    middlemanName: 'Quality Checkers Co.',
    actionType: 'quality-check',
    description: 'Quality inspection passed - Grade A',
    timestamp: new Date('2024-01-17T09:00:00'),
    blockchainTxHash: '0xghi789...',
    actionHash: 'sha256:quality001...',
  },
  {
    id: 'action-004',
    batchId: 'batch-001',
    middlemanId: 'middleman-003',
    middlemanName: 'Market Distributors',
    actionType: 'pricing',
    description: 'Final market pricing set',
    pricePerKg: 45,
    timestamp: new Date('2024-01-17T12:00:00'),
    blockchainTxHash: '0xjkl012...',
    actionHash: 'sha256:pricing001...',
  },
];

export const getTraceResult = (batchCode: string): TraceResult | null => {
  const batch = mockBatches.find(b => b.batchCode === batchCode);
  if (!batch) return null;

  const actions = mockActions.filter(a => a.batchId === batch.id);
  
  return {
    batch,
    actions,
    verificationStatus: 'verified',
    blockchainVerified: true,
    lastUpdated: new Date(),
  };
};

export const generateBatchCode = (cropName: string): string => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const cropCode = cropName.toUpperCase().slice(0, 6);
  return `AGRI-BATCH-${cropCode}-${randomNum}`;
};

export const crops = [
  { key: 'tomato', en: 'Tomato', ta: 'தக்காளி' },
  { key: 'onion', en: 'Onion', ta: 'வெங்காயம்' },
  { key: 'potato', en: 'Potato', ta: 'உருளைக்கிழங்கு' },
  { key: 'rice', en: 'Rice', ta: 'அரிசி' },
  { key: 'wheat', en: 'Wheat', ta: 'கோதுமை' },
  { key: 'sugarcane', en: 'Sugarcane', ta: 'கரும்பு' },
  { key: 'cotton', en: 'Cotton', ta: 'பருத்தி' },
  { key: 'groundnut', en: 'Groundnut', ta: 'நிலக்கடலை' },
  { key: 'chilli', en: 'Chilli', ta: 'மிளகாய்' },
  { key: 'turmeric', en: 'Turmeric', ta: 'மஞ்சள்' },
];
