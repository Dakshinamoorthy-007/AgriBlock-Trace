// AgriChain Type Definitions

export type UserRole = 'farmer' | 'middleman' | 'consumer' | 'admin';

export type Language = 'en' | 'ta';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  languagePreference: Language;
  oauthId?: string;
  createdAt: Date;
}

// In your @/lib/types.ts, update the Batch interface to add these two fields:

export interface Batch {
  id: string;
  batchCode: string;
  cropName: string;
  cropNameTamil?: string;
  quantity: number;
  unit: 'kg' | 'tonnes';
  harvestDate: Date;
  location: string;
  village?: string;
  district?: string;
  state?: string;
  farmerId: string;
  farmerName: string;
  blockchainTxHash?: string;
  dataHash?: string;
  status: 'registered' | 'in-transit' | 'delivered' | 'verified';
  createdAt: Date;
  // Transparency fields
  sellingPricePerKg?: number | null;
  totalSellingPrice?: number | null;
}

export type ActionType = 'transport' | 'storage' | 'quality-check' | 'pricing' | 'handover';

export interface MiddlemanAction {
  id: string;
  batchId: string;
  middlemanId: string;
  middlemanName: string;
  actionType: ActionType;
  description?: string;
  pricePerKg?: number;
  fromLocation?: string;
  toLocation?: string;
  storageCondition?: string;
  temperature?: number;
  humidity?: number;
  timestamp: Date;
  blockchainTxHash?: string;
  actionHash?: string;
}

export type VerificationStatus = 'verified' | 'tampered' | 'not-registered' | 'pending';

export interface TraceResult {
  batch: Batch;
  actions: MiddlemanAction[];
  verificationStatus: VerificationStatus;
  blockchainVerified: boolean;
  lastUpdated: Date;
}

// Bilingual text helper
export interface BilingualText {
  en: string;
  ta: string;
}

// QR Code data structure
export interface QRData {
  batchCode: string;
  traceUrl: string;
}
