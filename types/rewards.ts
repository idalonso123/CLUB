export interface Reward {
  id: number;
  name: string;
  description: string;
  points: number;
  tipoRecompensa?: 'puntos' | 'carnet';  // Nuevo campo para distinguir tipo de recompensa
  imageUrl: string;
  available: boolean;
  category: string;
  stock: number;
  redeemed?: boolean;
  canjeoMultiple?: boolean;
  expiracionActiva?: boolean;
  duracionMeses?: number;
  cooldownHoras?: number;
  cooldownMode?: 'same_day' | '24_hours' | 'custom';
  barcodes?: BarCode[];
  // Campos adicionales para recompensas de carnet
  isCarnetReward?: boolean;
  carnetRewardId?: number;
  productPvp?: number;
  petName?: string;
  petType?: string;
  productBarcode?: string | null;
  fechaExpiracion?: string | null;
}

// Nueva interfaz para recompensas de carnet generadas para un usuario específico
export interface RewardCarnetUsuario {
  id: number;
  personaId: number;
  carnetId: number;
  recompensaId: number;
  nombrePienso: string;
  codigoBarrasProducto?: string;
  canjeada: boolean;
  fechaCreacion: string;
  fechaCanje?: string;
  // Datos de la recompensa base (plantilla)
  recompensaBase?: {
    id: number;
    name: string;
    imageUrl: string;
    barcodes: BarCode[];
  };
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
