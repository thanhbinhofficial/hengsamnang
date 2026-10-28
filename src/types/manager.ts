export type AccountRole = 'owner' | 'manager' | 'tenant';

export interface ManagerPermissions {
  canViewAssignedRooms: boolean;
  canAddTenant: boolean;
  canEditExistingTenant: boolean;
  canEnterMeterReadings: boolean;
  canCheckOutTenant?: boolean;
  canEditRentOrContract: boolean;
  canDeleteData: boolean; // Always false for managers per specification
}

export interface ManagerAccount {
  id: string;
  username: string;
  displayName: string;
  displayNameKh: string;
  role: 'manager';
  passwordHash: string;
  passwordHint?: string;
  status: 'ACTIVE' | 'LOCKED' | 'REVOKED';
  assignedRooms: string[]; // e.g., ["1", "2", ..., "16"]
  permissions: ManagerPermissions;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  actorId: string;
  actorName: string;
  actorRole: 'owner' | 'manager';
  actionType:
    | 'NEW_TENANT'
    | 'UPDATE_TENANT'
    | 'CHECKOUT_TENANT'
    | 'METER_READING'
    | 'METER_ADJUSTMENT'
    | 'WATER_READING'
    | 'ELECTRICITY_READING'
    | 'PERMISSION_CHANGE'
    | 'ACCOUNT_STATUS';
  roomId: string; // e.g. "RM-05"
  roomNo: string; // e.g. "5"
  tenantId: string; // e.g. "BKK-P05"
  tenantName: string;
  monthYear?: string; // e.g. "2026-10"
  elecBefore?: string;
  elecAfter?: string;
  waterBefore?: string;
  waterAfter?: string;
  valueBefore?: string;
  valueAfter?: string;
  notes?: string;
  saveStatus: 'SAVED_MASTER_DB' | 'SYNCED_LOCAL_AND_SERVER' | 'REJECTED';
}

export interface MeterReadingRecord {
  id: string; // Unique record code e.g. "MR-2026-10-RM05"
  roomId: string; // "RM-05"
  roomNo: string; // "5"
  tenantId: string; // "BKK-P05"
  tenantName: string;
  monthYear: string; // "2026-10"
  recordedDate: string; // "2026-10-27"
  elecOld: number;
  elecNew: number;
  elecUsage: number;
  elecRateKhr: number; // 1500
  elecCostUsd: number;
  waterOld: number;
  waterNew: number;
  waterUsage: number;
  waterRateKhr: number; // 2000
  waterCostUsd: number;
  roomPriceUsd: number;
  wifiPriceUsd: number;
  totalAmountUsd: number;
  recordedBy: string; // "Nguon Sopheak" or "HENG SAMNANG (H.S.N)"
  recordedById: string;
  isAdjustment?: boolean;
  adjustmentReason?: string;
  createdAt: string;
}
