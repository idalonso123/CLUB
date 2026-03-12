export interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  imageUrl: string;
  available: boolean;
  category: string;
  stock: number;
  redeemed?: boolean;
  canjeoMultiple?: boolean;
  expiracionActiva?: boolean;
  duracionMeses?: number;
  cooldownHoras?: number;
  barcodes?: BarCode[];
}

export interface BarCode {
  id?: number;
  codigo: string;
  descripcion?: string;
}

export interface Redemption {
  id: number;
  rewardId: number;
  rewardName: string;
  imageUrl: string;
  category: string;
  pointsSpent: number;
  status: string;
  redemptionDate: string;
  lastUpdated: string;
  expirationDate?: string;
  isExpired?: boolean;
  hasExpiration?: boolean;
}

export interface RedemptionFormData {
  rewardId: number;
  shippingAddress?: string;
  notes?: string;
}
