export interface User {
  id: number;
  firstName: string;
  lastName: string;
  points?: number;
  email?: string;
  phone?: string;
}

export interface AddBalanceResult {
  success: boolean;
  message: string;
  puntosAñadidos?: number;
  puntosTotales?: number;
}

export interface AddBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  amount: string;
  setAmount: (amount: string) => void;
  handleAddBalance: (e: React.FormEvent) => Promise<void>;
  addPointsResult: AddBalanceResult | null;
  isCarnetAnimal: boolean;
  setIsCarnetAnimal: (isActive: boolean) => void;
  sacos: SacoItem[];
  setSacos: (sacos: SacoItem[]) => void;
}

export interface SearchFormProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (e: React.FormEvent) => Promise<void>;
  searching: boolean;
  error: string;
}

export interface SacoItem {
  id: string;
  price: string;
}

export interface AddBalanceFormProps {
  user: User;
  amount: string;
  setAmount: (amount: string) => void;
  handleAddBalance?: (e: React.FormEvent) => Promise<void>;
  addPointsResult: AddBalanceResult | null;
  isCarnetAnimal: boolean;
  setIsCarnetAnimal: (isActive: boolean) => void;
  sacos: SacoItem[];
  setSacos: (sacos: SacoItem[]) => void;
  onSubmit?: (e: React.FormEvent) => void;
  loading: boolean;
}

export interface Redemption {
  id: number;
  rewardName: string;
  redemptionDate: string;
  status: string;
  notes?: string;
  pointsSpent?: number;
  expirationDate?: string;
  hasExpiration?: boolean;
  isExpired?: boolean;
  codigoBarras?: string;
  codigoVisible?: string;
}

export interface RedemptionsTableProps {
  redemptions: Redemption[];
  handleChangeRedemptionStatus: (id: number, status: string) => Promise<void>;
  redemptionMsg: string;
}

export interface UsersTableProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onViewRedemptions: (user: User) => void;
  onOfferRewards?: (user: User) => void;
  onManagePetCards?: (user: User) => void;
}

export interface RedemptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    points?: number;
  } | null;
  redemptions: Redemption[];
  handleChangeRedemptionStatus: (id: number, status: string, notes?: string) => Promise<void>;
  redemptionMsg: string;
  userRole?: string | null;
}

export interface OfferRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onRedeemReward: (rewardId: number) => Promise<void>;
  redeemResult: {
    success: boolean;
    message: string;
  } | null;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  redemptionId?: number;
}

export interface TellerRewardsConfig {
  rewardIds: number[];
  showAllRewards: boolean;
}

export interface PetCard {
  id: number;
  userId: number;
  petName: string;
  petType: string;
  productName: string;
  stamps: number;
  stampDates: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  expirationDate?: string | null;  // 6 meses desde el último sello
  isExpired?: number | boolean;
  maxExpirationDate?: string | null; // 24 meses desde creación (máximo absoluto)
}

export interface PetCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  petCards: PetCard[];
  onAddPetCard: (petName: string, petType: string, productName: string) => void;
  onAddStamp: (petCardId: number) => void;
  onRemoveStamp: (petCardId: number) => void;
  onCompletePetCard: (petCardId: number) => void;
  onDeletePetCard: (petCardId: number) => void;
  loading: boolean;
  result: { success: boolean; message: string } | null;
  userRole?: string | null;
}