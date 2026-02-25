
export interface LaughEvent {
  id: string;
  timestamp: number;
  cost: number;
}

export interface BillingState {
  totalLaughs: number;
  currentBill: number;
  isMaxed: boolean;
}

export enum DetectionStatus {
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR'
}
