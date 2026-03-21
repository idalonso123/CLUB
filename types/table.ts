import { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
}

export interface DataTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
  headerClassName?: string;
  variants?: any;
  className?: string;
}
