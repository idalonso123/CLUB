export interface StatData {
  label: string;
  value: number;
  change: number; // Porcentaje de cambio respecto al periodo anterior
  changeType: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  icon?: string;
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface StatsResponse {
  success: boolean;
  message?: string;
  stats?: StatData[];
  timeRange?: TimeRange;
  previousTimeRange?: TimeRange;
}

export interface StatsFilters {
  period?: 'day' | 'week' | 'month' | 'year';
  custom?: {
    from: string;
    to: string;
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface ChartData {
  label: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface StatsChartResponse {
  success: boolean;
  message?: string;
  charts: ChartData[];
  timeRange: TimeRange;
}