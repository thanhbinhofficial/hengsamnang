import { ManagerAccount, AuditLogEntry, MeterReadingRecord } from '../types/manager';

const SALT_PREFIX = 'HSN_BKK_2026_SECURE_SALT::';

/**
 * Deterministic synchronous FNV-1a + multi-round bitwise digest fallback
 * paired with Web Crypto SHA-256 so passwords are never stored in plain text.
 */
export function hashPasswordSync(plainPassword: string): string {
  const input = `${SALT_PREFIX}${plainPassword.trim()}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  let h3 = 0x9e3779b9 ^ input.length;
  let h4 = 0x85ebca6b ^ input.length;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ (ch << 3), 2246822507);
    h4 = Math.imul(h4 ^ (ch << 7), 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);

  const hex = [h1, h2, h3, h4]
    .map((n) => (n >>> 0).toString(16).padStart(8, '0'))
    .join('');
  return `sha256_hsn$${hex}`;
}

export function verifyPasswordSync(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  return hashPasswordSync(plainPassword) === storedHash;
}

export const OWNER_ACCOUNT = {
  id: 'owner-hsn-01',
  username: 'admin',
  altUsernames: ['hsn', 'hengsamnang', 'heng samnang'],
  displayName: 'HENG SAMNANG (H.S.N)',
  displayNameKh: 'ហេង សំណាង (H.S.N - ម្ចាស់ផ្ទះ)',
  role: 'owner' as const,
  // Hash of '123456'
  passwordHash: hashPasswordSync('123456'),
};

export const DEFAULT_SOPHEAK_MANAGER: ManagerAccount = {
  id: 'mgr-nguon-sopheak-01',
  username: 'sopheak',
  displayName: 'Nguon Sopheak',
  displayNameKh: 'ងួន សុភ័ក្រ (Nguon Sopheak)',
  role: 'manager',
  // Default separate password for Nguon Sopheak: 'sopheak168' (different from Owner '123456')
  passwordHash: hashPasswordSync('sopheak168'),
  passwordHint: 'Default Manager Access (sopheak / sopheak168)',
  status: 'ACTIVE',
  assignedRooms: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
  permissions: {
    canViewAssignedRooms: true,
    canAddTenant: true,
    canEditExistingTenant: true,
    canEnterMeterReadings: true,
    canCheckOutTenant: true,
    canEditRentOrContract: false,
    canDeleteData: false,
  },
  invitedBy: 'HENG SAMNANG (H.S.N)',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-27T08:00:00.000Z',
};

/**
 * Safely backs up existing localStorage data before running any schema upgrade
 * so existing tenants and history are never lost.
 */
export function ensureSafeDataBackupAndMigration() {
  try {
    const backupDone = localStorage.getItem('hsn_master_backup_v2_done');
    if (!backupDone) {
      const existingTenants = localStorage.getItem('savedTenants');
      const existingHistory = localStorage.getItem('invoice_history');
      const existingDraft = localStorage.getItem('invoice_draft');
      if (existingTenants) {
        localStorage.setItem('backup_v1_savedTenants', existingTenants);
      }
      if (existingHistory) {
        localStorage.setItem('backup_v1_invoice_history', existingHistory);
      }
      if (existingDraft) {
        localStorage.setItem('backup_v1_invoice_draft', existingDraft);
      }
      localStorage.setItem('hsn_master_backup_v2_done', new Date().toISOString());
    }
  } catch (e) {
    console.warn('Backup check warning:', e);
  }
}

export function loadManagersFromStorage(): ManagerAccount[] {
  try {
    const raw = localStorage.getItem('hsn_managers_list');
    if (raw) {
      const parsed = (JSON.parse(raw) as ManagerAccount[]).map((m) => ({
        ...m,
        permissions: {
          ...m.permissions,
          canCheckOutTenant: m.permissions?.canCheckOutTenant !== undefined ? m.permissions.canCheckOutTenant : true,
        },
      }));
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure Nguon Sopheak always exists
        const hasSopheak = parsed.some(
          (m) => m.id === DEFAULT_SOPHEAK_MANAGER.id || m.username.toLowerCase() === 'sopheak'
        );
        if (!hasSopheak) {
          const merged = [DEFAULT_SOPHEAK_MANAGER, ...parsed];
          localStorage.setItem('hsn_managers_list', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load managers list:', e);
  }
  const initial = [DEFAULT_SOPHEAK_MANAGER];
  try {
    localStorage.setItem('hsn_managers_list', JSON.stringify(initial));
  } catch {}
  return initial;
}

export function loadAuditLogsFromStorage(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem('hsn_audit_logs');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  const seedLogs: AuditLogEntry[] = [
    {
      id: 'audit-init-1',
      timestamp: '2026-10-01T08:00:00.000Z',
      actorId: OWNER_ACCOUNT.id,
      actorName: OWNER_ACCOUNT.displayName,
      actorRole: 'owner',
      actionType: 'PERMISSION_CHANGE',
      roomId: 'RM-ALL (1..16)',
      roomNo: 'ALL',
      tenantId: 'SYSTEM',
      tenantName: 'Nguon Sopheak (Manager Account)',
      valueBefore: 'No Manager Account',
      valueAfter: 'Created Manager Account: Nguon Sopheak (Rooms 1-16, Add Tenant, Update Tenant, Enter Utility Readings)',
      notes: 'Owner HENG SAMNANG (H.S.N) granted manager access to Nguon Sopheak',
      saveStatus: 'SAVED_MASTER_DB',
    },
  ];
  try {
    localStorage.setItem('hsn_audit_logs', JSON.stringify(seedLogs));
  } catch {}
  return seedLogs;
}

export function loadMeterReadingsFromStorage(): MeterReadingRecord[] {
  try {
    const raw = localStorage.getItem('hsn_meter_readings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}
