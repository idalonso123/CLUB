export interface LogFilters {
  action?: string;
  userId?: string;
  adminId?: string;
  exportType?: string;
  format?: string;
  personaId?: string;
  actorId?: string;
  tipo?: string;
  fromDate?: string;
  toDate?: string;
  ipAddress?: string;
  rewardId?: string;
}

export interface LogPagination {
  total: number;
  totalPages: number;
  limit: number;
  page: number;
}

export interface LogsTableProps {
  logs: any[];
  logType: string;
  pagination: {
    total: number;
    totalPages: number;
    limit: number;
    page: number;
  } | null;
  page: number;
  setPage: (page: number) => void;
  variants?: any;
}

export interface LogsFilterMenuProps {
  logType: string;
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  onReset: () => void;
  onClose: () => void;
}