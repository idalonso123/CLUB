export type AdjustmentType = 'Administrador' | 'Sistema' | 'Canje' | 'Caducidad' | 'Compra' | 'Bonificación';

export interface PointsData {
  currentPoints: number;
  adjustment: number;
  reason: string;
  type: AdjustmentType;
  newPoints?: number;
}

export interface TypeOption {
  value: AdjustmentType;
  label: string;
  icon: string;
  variant: 'info' | 'purple' | 'success' | 'warning' | 'danger' | 'secondary';
}

export interface PointPreset {
  value: number;
  label: string;
  variant: 'danger' | 'success';
}