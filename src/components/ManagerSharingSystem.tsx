import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  Plus,
  Search,
  Zap,
  Droplets,
  Home,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit,
  Eye,
  Calendar,
  Wifi,
  WifiOff,
  RotateCcw,
  Check,
  Globe,
  Trash2,
  UserMinus,
  TrendingUp
} from 'lucide-react';

export interface ManagerPermissions {
  canAddTenant: boolean;
  canUpdateTenant: boolean;
  canEnterUtilities: boolean;
  canModifyPrices: boolean;
  canDeleteRecords: boolean;
}

export interface ManagerAccount {
  id: string;
  fullName: string;
  khmerName: string;
  username: string;
  phone: string;
  passwordHash: string;
  status: 'ACTIVE' | 'LOCKED' | 'REVOKED';
  assignedRooms: string[];
  permissions: ManagerPermissions;
  createdAt: string;
  createdBy: string;
  lastLoginAt?: string;
  lastLogin?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorUsername?: string;
  actorRole: 'OWNER' | 'MANAGER';
  actionType:
    | 'CREATE_TENANT'
    | 'UPDATE_TENANT'
    | 'VACATE_KEEP_REVENUE'
    | 'ENTER_UTILITY'
    | 'ADJUST_UTILITY'
    | 'ACCOUNT_PERMISSION'
    | 'PERMISSION_CHANGE';
  roomNo: string;
  tenantId: string;
  tenantName: string;
  monthStr?: string;
  elecBefore?: string;
  elecAfter?: string;
  waterBefore?: string;
  waterAfter?: string;
  valueBefore?: string;
  valueAfter?: string;
  beforeData?: string;
  afterData?: string;
  status: 'SYNCED' | 'ADJUSTED' | 'VERIFIED';
  notes?: string;
  note?: string;
}

export interface SharedTenantRecord {
  tenantName: string;
  roomNo: string;
  tenantPhone: string;
  tenantIdNo: string;
  checkInDate: string;
  roomPrice: number;
  wifiPrice: number;
  elecOld: string;
  waterOld: string;
  elecNew?: string;
  waterNew?: string;
  isPaid?: boolean;
  deposit?: number;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface SharedHistoryRecord {
  id: string;
  tenantName: string;
  roomNo: string;
  paymentDate: string; // YYYY-MM-DD
  roomPrice: number;
  wifiPrice: number;
  elecPrice: number;
  waterPrice: number;
  otherPrice: number;
  totalUsd: number;
  elecUsage: number;
  waterUsage: number;
  status: 'PAID' | 'PENDING';
  tenantIdNo?: string;
  elecOld?: string;
  elecNew?: string;
  waterOld?: string;
  waterNew?: string;
  recordedBy?: string;
  recordedAt?: string;
}

// Non-plaintext deterministic password hash (FNV-1a + SHA-style mixing)
export const hashPassword = (raw: string): string => {
  const clean = raw.trim();
  let h1 = 0xdeadbeef ^ clean.length;
  let h2 = 0x41c6ce57 ^ clean.length;
  for (let i = 0, ch; i < clean.length; i++) {
    ch = clean.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'hsn_sha_' + (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
};

export const ALL_STANDARD_ROOMS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16'
];

export const LanguageFlagIcon: React.FC<{ lang: 'km' | 'en'; className?: string }> = ({
  lang,
  className = 'w-7 h-5'
}) => {
  if (lang === 'km') {
    // Official Flag of Cambodia SVG
    return (
      <svg
        viewBox="0 0 36 24"
        className={`${className} rounded-[3px] shadow-xs shrink-0 overflow-hidden`}
        aria-label="Cambodia Flag"
      >
        <rect width="36" height="24" fill="#032EA1" />
        <rect y="6" width="36" height="12" fill="#E00025" />
        {/* Angkor Wat White Silhouette */}
        <g fill="#FFFFFF">
          <rect x="11" y="15" width="14" height="1.6" rx="0.3" />
          <rect x="12.2" y="13.3" width="11.6" height="1.5" rx="0.2" />
          <path d="M13.5 13.3 L13.5 10.2 L14.8 8.6 L16.1 10.2 L16.1 13.3 Z" />
          <path d="M16.5 13.3 L16.5 9.0 L18.0 7.0 L19.5 9.0 L19.5 13.3 Z" />
          <path d="M19.9 13.3 L19.9 10.2 L21.2 8.6 L22.5 10.2 L22.5 13.3 Z" />
        </g>
      </svg>
    );
  }
  // UK / English Flag SVG
  return (
    <svg
      viewBox="0 0 36 24"
      className={`${className} rounded-[3px] shadow-xs shrink-0 overflow-hidden`}
      aria-label="English Flag"
    >
      <rect width="36" height="24" fill="#012169" />
      <path d="M0,0 L36,24 M36,0 L0,24" stroke="#FFFFFF" strokeWidth="4.5" />
      <path d="M0,0 L36,24 M36,0 L0,24" stroke="#C8102E" strokeWidth="2.4" />
      <path d="M18,0 L18,24 M0,12 L36,12" stroke="#FFFFFF" strokeWidth="7.5" />
      <path d="M18,0 L18,24 M0,12 L36,12" stroke="#C8102E" strokeWidth="4.5" />
    </svg>
  );
};

export const DEFAULT_NGUON_SOPHEAK_ACCOUNT: ManagerAccount = {
  id: 'mgr-nguon-sopheak',
  fullName: 'Nguon Sopheak',
  khmerName: 'ងួន សុភ័ក្រ',
  username: 'sopheak',
  phone: '088 966 8896',
  passwordHash: hashPassword('sopheak168'),
  status: 'ACTIVE',
  assignedRooms: [...ALL_STANDARD_ROOMS],
  permissions: {
    canAddTenant: true,
    canUpdateTenant: true,
    canEnterUtilities: true,
    canModifyPrices: false,
    canDeleteRecords: false
  },
  createdAt: '2026-10-01T08:00:00.000Z',
  createdBy: 'HENG SAMNANG (HSN - Owner)'
};

export const formatRoomCode = (roomNo: string | number | undefined | null): string => {
  if (!roomNo) return 'RM-00';
  const str = String(roomNo).trim();
  const cleanNum = str.replace(/^(P\.|RM-|RM|P|\.)/i, '').trim();
  if (!cleanNum) return str;
  return `RM-${cleanNum.padStart(2, '0')}`;
};

export const formatStableTenantId = (roomNo: string, existingId?: string): string => {
  if (existingId && existingId.trim()) return existingId.trim();
  const num = (roomNo || '').replace(/\D/g, '') || roomNo;
  return `BKK-P${num.padStart(2, '0')}`;
};

export const normalizeRoom = (roomStr: string): string => {
  if (!roomStr) return '';
  return String(roomStr).replace(/^(RM-|P\.)/i, '').replace(/^0+(?=\d)/, '').trim();
};

interface ManagerSharingProps {
  mode: 'owner_overview' | 'owner_list' | 'owner_access' | 'sopheak_dashboard';
  staffRole?: 'admin' | 'manager';
  currentUserRole?: 'owner' | 'manager';
  activeManager?: ManagerAccount;
  managerAccounts: ManagerAccount[];
  setManagerAccounts: React.Dispatch<React.SetStateAction<ManagerAccount[]>>;
  auditLogs: AuditLogEntry[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
  savedTenants: SharedTenantRecord[];
  setSavedTenants: React.Dispatch<React.SetStateAction<any[]>>;
  history: SharedHistoryRecord[];
  setHistory: React.Dispatch<React.SetStateAction<any[]>>;
  vacantRoomsMeta?: Record<string, any>;
  setVacantRoomsMeta?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  onSelectTenantForInvoice: (tenant: any) => void;
  onSwitchMainTab: (tab: any) => void;
  playAudioFeedback?: (type: 'click' | 'success' | 'delete') => void;
  lang?: 'km' | 'en';
  setLang?: React.Dispatch<React.SetStateAction<'km' | 'en'>>;
  elecRateRiel?: number;
  waterRateRiel?: number;
  onSystemTenantUpdated?: (info: {
    roomNo: string;
    tenantName: string;
    action: 'new' | 'edit' | 'vacate' | 'utility';
  }) => void;
}

export const ManagerSharingSystem: React.FC<ManagerSharingProps> = ({
  mode,
  staffRole = 'admin',
  currentUserRole,
  activeManager,
  managerAccounts,
  setManagerAccounts,
  auditLogs,
  setAuditLogs,
  savedTenants,
  setSavedTenants,
  history,
  setHistory,
  vacantRoomsMeta = {},
  setVacantRoomsMeta,
  onSelectTenantForInvoice,
  onSwitchMainTab,
  playAudioFeedback,
  lang: propLang,
  setLang: propSetLang,
  elecRateRiel = 1500,
  waterRateRiel = 2000,
  onSystemTenantUpdated
}) => {
  // Determine effective role ('owner' vs 'manager')
  const resolvedRole: 'owner' | 'manager' =
    currentUserRole || (staffRole === 'manager' ? 'manager' : 'owner');

  // Language State: Khmer ('km') prioritized by default, toggleable to English ('en')
  const [localLang, setLocalLang] = useState<'km' | 'en'>(() => {
    const saved = localStorage.getItem('hsn_app_lang');
    return saved === 'en' ? 'en' : 'km';
  });

  const lang = propLang ?? localLang;
  const toggleLanguage = () => {
    const next = lang === 'km' ? 'en' : 'km';
    if (propSetLang) {
      propSetLang(next);
    } else {
      setLocalLang(next);
    }
    localStorage.setItem('hsn_app_lang', next);
    playAudioFeedback?.('click');
  };

  // Translation helper (Khmer priority vs English)
  const tr = (kmText: string, enText: string) => (lang === 'km' ? kmText : enText);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [bannerNotice, setBannerNotice] = useState<{
    type: 'success' | 'error' | 'warning';
    km: string;
    en: string;
  } | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showNotice = (type: 'success' | 'error' | 'warning', km: string, en: string) => {
    setBannerNotice({ type, km, en });
    setTimeout(() => {
      setBannerNotice(prev => (prev?.km === km ? null : prev));
    }, 6500);
  };

  // Sub-tabs inside Nguon Sopheak Dashboard
  const [sopheakTab, setSopheakTab] = useState<
    'assignedRooms' | 'newTenant' | 'currentTenants' | 'waterMeter' | 'elecMeter' | 'entryHistory'
  >('assignedRooms');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('2026-10');

  // New Tenant Form State (for Nguon Sopheak & Owner)
  const [newTenantForm, setNewTenantForm] = useState({
    tenantName: '',
    tenantIdNo: '',
    tenantPhone: '',
    roomNo: '1',
    roomPrice: '80',
    wifiPrice: '0',
    deposit: '80',
    checkInDate: new Date().toISOString().split('T')[0],
    elecOld: '0',
    elecNew: '',
    waterOld: '0',
    waterNew: '',
    notes: '',
    replaceExistingKeepRevenue: true
  });

  // Current Tenant Edit State
  const [editingRoomNo, setEditingRoomNo] = useState<string>('5');
  const [editTenantForm, setEditTenantForm] = useState({
    tenantName: '',
    tenantIdNo: '',
    tenantPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    roomPrice: 80,
    wifiPrice: 0,
    deposit: 80,
    elecOld: '0',
    waterOld: '0',
    notes: ''
  });
  const [lastSystemAutoSync, setLastSystemAutoSync] = useState<string>('');

  // Monthly Meter Entry State (Electricity & Water)
  const [meterRoomNo, setMeterRoomNo] = useState<string>('5');
  const [meterMonth, setMeterMonth] = useState<string>('2026-10');
  const [meterElecOld, setMeterElecOld] = useState<string>('0');
  const [meterElecNew, setMeterElecNew] = useState<string>('');
  const [meterWaterOld, setMeterWaterOld] = useState<string>('0');
  const [meterWaterNew, setMeterWaterNew] = useState<string>('');
  const [meterNotes, setMeterNotes] = useState<string>('');
  const [confirmLowerReading, setConfirmLowerReading] = useState<boolean>(false);
  const [lowerReadingReason, setLowerReadingReason] = useState<string>('');

  // History Adjustment Modal State
  const [adjustingRecord, setAdjustingRecord] = useState<SharedHistoryRecord | null>(null);
  const [adjustElecNew, setAdjustElecNew] = useState<string>('');
  const [adjustWaterNew, setAdjustWaterNew] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Owner Manager Creation / Password Reset State
  const [newMgrName, setNewMgrName] = useState('');
  const [newMgrKhmerName, setNewMgrKhmerName] = useState('');
  const [newMgrUsername, setNewMgrUsername] = useState('');
  const [newMgrPhone, setNewMgrPhone] = useState('');
  const [newMgrPassword, setNewMgrPassword] = useState('');
  const [resetPwdMgrId, setResetPwdMgrId] = useState<string | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState<string>('');
  const [selectedMgrIdForPerms, setSelectedMgrIdForPerms] = useState<string>(
    managerAccounts[0]?.id || DEFAULT_NGUON_SOPHEAK_ACCOUNT.id
  );
  const [auditFilterRoom, setAuditFilterRoom] = useState<string>('ALL');

  // Effective Manager Profile (auto-normalized to 16 standard rooms RM-01..RM-16)
  const effectiveManager = useMemo(() => {
    const raw =
      managerAccounts.find(m => m.id === activeManager?.id) ||
      managerAccounts.find(m => m.username === 'sopheak') ||
      DEFAULT_NGUON_SOPHEAK_ACCOUNT;
    const validAssigned = (raw.assignedRooms || [])
      .map(r => normalizeRoom(r))
      .filter(r => ALL_STANDARD_ROOMS.includes(r));
    return {
      ...raw,
      assignedRooms: validAssigned.length > 0 ? validAssigned : [...ALL_STANDARD_ROOMS]
    };
  }, [managerAccounts, activeManager]);

  const assignedRoomSet = useMemo(() => {
    return new Set(effectiveManager.assignedRooms.map(r => normalizeRoom(r)));
  }, [effectiveManager]);

  // Filter savedTenants by assigned rooms
  const scopedTenants = useMemo(() => {
    return [...savedTenants]
      .filter(t => assignedRoomSet.has(normalizeRoom(t.roomNo)))
      .sort((a, b) => (parseInt(normalizeRoom(a.roomNo)) || 0) - (parseInt(normalizeRoom(b.roomNo)) || 0));
  }, [savedTenants, assignedRoomSet]);

  const filteredScopedTenants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return scopedTenants;
    return scopedTenants.filter(
      t =>
        t.tenantName.toLowerCase().includes(q) ||
        formatRoomCode(t.roomNo).toLowerCase().includes(q) ||
        normalizeRoom(t.roomNo).includes(q) ||
        (t.tenantPhone || '').toLowerCase().includes(q) ||
        (t.tenantIdNo || '').toLowerCase().includes(q)
    );
  }, [scopedTenants, searchQuery]);

  // Calculate cumulative revenue per room across all months (preserved across old & new tenants)
  const roomCumulativeRevenueMap = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach(h => {
      const rKey = normalizeRoom(h.roomNo);
      if (rKey) {
        map[rKey] = (map[rKey] || 0) + (Number(h.totalUsd) || 0);
      }
    });
    return map;
  }, [history]);

  // Auto-load vacant room metadata or existing room readings when selecting a room in New Tenant form
  useEffect(() => {
    const cleanR = normalizeRoom(newTenantForm.roomNo);
    const existing = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    const meta = vacantRoomsMeta?.[cleanR];
    if (existing) {
      setNewTenantForm(prev => ({
        ...prev,
        roomPrice: String(existing.roomPrice || 80),
        wifiPrice: String(existing.wifiPrice || 0),
        deposit: String(existing.deposit || 80),
        elecOld: existing.elecOld || '0',
        waterOld: existing.waterOld || '0'
      }));
    } else if (meta) {
      setNewTenantForm(prev => ({
        ...prev,
        roomPrice: String(meta.roomPrice ?? 80),
        wifiPrice: String(meta.wifiPrice ?? 0),
        deposit: String(meta.deposit ?? 80),
        elecOld: String(meta.elecOld ?? '0'),
        waterOld: String(meta.waterOld ?? '0')
      }));
    }
  }, [newTenantForm.roomNo, savedTenants, vacantRoomsMeta]);

  // Auto-load tenant or vacant room defaults when editingRoomNo changes in Current Tenants tab
  useEffect(() => {
    const cleanR = normalizeRoom(editingRoomNo);
    const found = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    const meta = vacantRoomsMeta?.[cleanR];
    if (found) {
      setEditTenantForm({
        tenantName: found.tenantName || '',
        tenantIdNo: found.tenantIdNo || formatStableTenantId(found.roomNo),
        tenantPhone: found.tenantPhone || '',
        checkInDate: found.checkInDate || new Date().toISOString().split('T')[0],
        roomPrice: found.roomPrice || 80,
        wifiPrice: found.wifiPrice || 0,
        deposit: found.deposit || 0,
        elecOld: String(found.elecOld ?? '0'),
        waterOld: String(found.waterOld ?? '0'),
        notes: found.notes || ''
      });
    } else {
      setEditTenantForm({
        tenantName: '',
        tenantIdNo: formatStableTenantId(cleanR),
        tenantPhone: '',
        checkInDate: new Date().toISOString().split('T')[0],
        roomPrice: meta?.roomPrice ?? 80,
        wifiPrice: meta?.wifiPrice ?? 0,
        deposit: meta?.deposit ?? 80,
        elecOld: String(meta?.elecOld ?? '0'),
        waterOld: String(meta?.waterOld ?? '0'),
        notes: ''
      });
    }
  }, [editingRoomNo]);

  // Debounced Real-Time Auto-Update of System when Existing Tenant Info is Edited in editTenantForm
  useEffect(() => {
    if (sopheakTab !== 'currentTenants') return;
    if (resolvedRole === 'manager' && !effectiveManager.permissions.canUpdateTenant) return;

    const cleanR = normalizeRoom(editingRoomNo);
    const existing = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    if (!existing) return; // For vacant rooms in edit tab, wait for explicit submit button

    const newNameTrim = editTenantForm.tenantName.trim();
    if (!newNameTrim) return;

    const canEditPrice = resolvedRole === 'owner' || effectiveManager.permissions.canModifyPrices;
    const finalRoomPrice = canEditPrice ? Number(editTenantForm.roomPrice) : existing.roomPrice;
    const finalWifiPrice = canEditPrice ? Number(editTenantForm.wifiPrice) : existing.wifiPrice;
    const finalDeposit = canEditPrice ? Number(editTenantForm.deposit) : existing.deposit || 0;
    const stableId = formatStableTenantId(cleanR, editTenantForm.tenantIdNo || existing.tenantIdNo);
    const cleanPhone = editTenantForm.tenantPhone.trim();
    const cleanDate = editTenantForm.checkInDate || existing.checkInDate;
    const cleanElecOld = String(editTenantForm.elecOld ?? existing.elecOld ?? '0').trim() || '0';
    const cleanWaterOld = String(editTenantForm.waterOld ?? existing.waterOld ?? '0').trim() || '0';
    const cleanNotes = editTenantForm.notes.trim();

    const hasChanged =
      existing.tenantName !== newNameTrim ||
      (existing.tenantIdNo || '') !== stableId ||
      (existing.tenantPhone || '') !== cleanPhone ||
      (existing.checkInDate || '') !== cleanDate ||
      Number(existing.roomPrice) !== finalRoomPrice ||
      Number(existing.wifiPrice) !== finalWifiPrice ||
      Number(existing.deposit || 0) !== finalDeposit ||
      String(existing.elecOld || '0') !== cleanElecOld ||
      String(existing.waterOld || '0') !== cleanWaterOld ||
      (existing.notes || '') !== cleanNotes;

    if (!hasChanged) return;

    const timer = setTimeout(() => {
      const nowIso = new Date().toISOString();
      const actorLabel =
        resolvedRole === 'owner'
          ? 'HENG SAMNANG (Owner)'
          : `${effectiveManager.fullName} (${effectiveManager.khmerName})`;

      const updatedTenant: SharedTenantRecord = {
        ...existing,
        tenantName: newNameTrim,
        tenantIdNo: stableId,
        tenantPhone: cleanPhone,
        checkInDate: cleanDate,
        roomPrice: finalRoomPrice,
        wifiPrice: finalWifiPrice,
        deposit: finalDeposit,
        elecOld: cleanElecOld,
        waterOld: cleanWaterOld,
        notes: cleanNotes,
        updatedBy: actorLabel,
        updatedAt: nowIso
      };

      setSavedTenants(prev => {
        const updated = prev.map(t => (normalizeRoom(t.roomNo) === cleanR ? updatedTenant : t));
        localStorage.setItem('savedTenants', JSON.stringify(updated));
        return updated;
      });

      // Also synchronize active (non-archived) records for this room in history so tables & summaries update immediately
      setHistory(prev => {
        const updated = prev.map(rec => {
          if (!rec.id.startsWith('h-archived-') && normalizeRoom(rec.roomNo) === cleanR) {
            const newTotal =
              finalRoomPrice +
              finalWifiPrice +
              (Number(rec.elecPrice) || 0) +
              (Number(rec.waterPrice) || 0) +
              (Number(rec.otherPrice) || 0);
            return {
              ...rec,
              tenantName: newNameTrim,
              tenantIdNo: stableId,
              roomPrice: finalRoomPrice,
              wifiPrice: finalWifiPrice,
              totalUsd: Number(newTotal.toFixed(2))
            };
          }
          return rec;
        });
        localStorage.setItem('invoice_history', JSON.stringify(updated));
        return updated;
      });

      onSelectTenantForInvoice(updatedTenant);
      setLastSystemAutoSync(new Date().toLocaleTimeString());
      onSystemTenantUpdated?.({
        roomNo: cleanR,
        tenantName: newNameTrim,
        action: 'edit'
      });
    }, 550);

    return () => clearTimeout(timer);
  }, [editTenantForm, editingRoomNo, sopheakTab]);

  // Auto-load previous meter readings when meterRoomNo or meterMonth changes
  useEffect(() => {
    const cleanR = normalizeRoom(meterRoomNo);
    const activeTenant = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    if (!activeTenant) {
      setMeterElecOld('0');
      setMeterWaterOld('0');
      setMeterElecNew('');
      setMeterWaterNew('');
      return;
    }

    const existingMonthRec = history.find(
      h => normalizeRoom(h.roomNo) === cleanR && h.paymentDate.startsWith(meterMonth)
    );

    const prevElec = existingMonthRec?.elecOld || activeTenant.elecOld || '0';
    const prevWater = existingMonthRec?.waterOld || activeTenant.waterOld || '0';
    setMeterElecOld(prevElec);
    setMeterWaterOld(prevWater);

    if (existingMonthRec) {
      const calcElecNew =
        existingMonthRec.elecNew ||
        String((parseFloat(prevElec) || 0) + (Number(existingMonthRec.elecUsage) || 0));
      const calcWaterNew =
        existingMonthRec.waterNew ||
        String((parseFloat(prevWater) || 0) + (Number(existingMonthRec.waterUsage) || 0));
      setMeterElecNew(calcElecNew);
      setMeterWaterNew(calcWaterNew);
    } else {
      setMeterElecNew('');
      setMeterWaterNew('');
    }
    setConfirmLowerReading(false);
    setLowerReadingReason('');
  }, [meterRoomNo, meterMonth, savedTenants, history]);

  // Append an immutable entry to the Audit Log
  const appendAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => {
      const updated = [fullEntry, ...prev];
      localStorage.setItem('hsn_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper: Archive Old Tenant's Revenue in History & Purge Old Tenant Personal Info (Keep 100% Cumulative Room Revenue)
  const archiveOldTenantRevenueAndKeepCumulative = (
    roomNo: string,
    oldTenant?: SharedTenantRecord,
    newTenantName?: string
  ) => {
    const cleanR = normalizeRoom(roomNo);
    const archiveLabel = newTenantName?.trim()
      ? newTenantName.trim()
      : `បន្ទប់ ${formatRoomCode(cleanR)} (ចំណូលចាស់រក្សាទុក / Archived Room Revenue)`;

    setHistory(prev => {
      let updated = [...prev];

      // Preserve the old tenant's current month revenue into history before deleting old tenant if not yet recorded
      if (oldTenant && cleanR) {
        const currentYearMonth = new Date().toISOString().slice(0, 7);
        const hasAnyRoomRecord = updated.some(r => normalizeRoom(r.roomNo) === cleanR);
        const hasCurrent = updated.some(
          r => normalizeRoom(r.roomNo) === cleanR && r.paymentDate.startsWith(currentYearMonth)
        );
        if ((oldTenant.isPaid && !hasCurrent) || !hasAnyRoomRecord) {
          const preservedRec: SharedHistoryRecord = {
            id: `h-archived-${Date.now()}-RM${cleanR.padStart(2, '0')}`,
            roomNo: cleanR,
            tenantName: archiveLabel,
            paymentDate: `${currentYearMonth}-05`,
            roomPrice: Number(oldTenant.roomPrice) || 80,
            wifiPrice: Number(oldTenant.wifiPrice) || 0,
            elecPrice: 0,
            waterPrice: 0,
            otherPrice: 0,
            totalUsd: (Number(oldTenant.roomPrice) || 80) + (Number(oldTenant.wifiPrice) || 0),
            elecUsage: 0,
            waterUsage: 0,
            status: 'PAID'
          };
          updated = [preservedRec, ...updated];
        }
      }

      // Keep 100% of past monthly revenue for this room and tag IDs as archived so new tenant records accumulate (cộng dồn) without overwriting
      updated = updated.map(rec => {
        const sameRoom = cleanR && normalizeRoom(rec.roomNo) === cleanR;
        const sameOldName =
          oldTenant?.tenantName &&
          rec.tenantName.trim().toLowerCase() === oldTenant.tenantName.trim().toLowerCase();
        if (sameRoom || sameOldName) {
          const archivedId = rec.id.startsWith('h-archived-')
            ? rec.id
            : `h-archived-${rec.id}`;
          return {
            ...rec,
            id: archivedId,
            roomNo: cleanR || rec.roomNo,
            tenantName: archiveLabel
          };
        }
        return rec;
      });

      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Action: Vacate Room (Delete Vacated Tenant Personal Info while Preserving & Accumulating All Room Revenue)
  const handleVacateTenantKeepRevenue = (tenant: SharedTenantRecord) => {
    const cleanR = normalizeRoom(tenant.roomNo);
    const cumRev = roomCumulativeRevenueMap[cleanR] || 0;

    playAudioFeedback?.('delete');

    // 1. Archive & keep all monthly revenue for this room in history
    archiveOldTenantRevenueAndKeepCumulative(cleanR, tenant);

    // 2. Store last meter readings & room price in vacantRoomsMeta for the next tenant
    if (setVacantRoomsMeta) {
      setVacantRoomsMeta(prev => {
        const updated = {
          ...prev,
          [cleanR]: {
            roomPrice: tenant.roomPrice || 80,
            wifiPrice: tenant.wifiPrice || 0,
            elecOld: tenant.elecOld || '0',
            waterOld: tenant.waterOld || '0',
            deposit: tenant.deposit || 80,
            vacatedDate: new Date().toISOString().split('T')[0]
          }
        };
        localStorage.setItem('vacant_rooms_meta', JSON.stringify(updated));
        return updated;
      });
    }

    // 3. Remove vacated tenant from active savedTenants so room is vacant for new tenant
    setSavedTenants(prev => {
      const updated = prev.filter(t => normalizeRoom(t.roomNo) !== cleanR);
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    const actorLabel =
      resolvedRole === 'owner'
        ? 'HENG SAMNANG (Owner)'
        : `${effectiveManager.fullName} (${effectiveManager.khmerName})`;

    appendAuditLog({
      actorName: actorLabel,
      actorUsername: resolvedRole === 'owner' ? 'admin' : effectiveManager.username,
      actorRole: resolvedRole === 'owner' ? 'OWNER' : 'MANAGER',
      actionType: 'VACATE_KEEP_REVENUE',
      roomNo: cleanR,
      tenantId: formatStableTenantId(cleanR, tenant.tenantIdNo),
      tenantName: tenant.tenantName,
      monthStr: selectedMonthYear,
      elecBefore: `${tenant.elecOld || '0'} kWh`,
      elecAfter: `${tenant.elecOld || '0'} kWh (រក្សាទុកសម្រាប់ភ្ញៀវថ្មី)`,
      waterBefore: `${tenant.waterOld || '0'} m³`,
      waterAfter: `${tenant.waterOld || '0'} m³ (រក្សាទុកសម្រាប់ភ្ញៀវថ្មី)`,
      valueBefore: `ភ្ញៀវចាស់: ${tenant.tenantName}`,
      valueAfter: `បន្ទប់ទំនេរ (ចំណូលសរុប $${cumRev.toFixed(2)} រក្សាទុកបូកបន្ត)`,
      status: 'SYNCED',
      notes: 'លុបព័ត៌មានភ្ញៀវចាស់ ប៉ុន្តែរក្សាទុកចំណូលគ្រប់ខែរបស់ម្ចាស់ផ្ទះដើម្បីបូកបន្ត / Deleted old tenant, kept cumulative landlord revenue'
    });

    onSystemTenantUpdated?.({
      roomNo: cleanR,
      tenantName: tenant.tenantName,
      action: 'vacate'
    });

    showNotice(
      'success',
      `✅ ប្រព័ន្ធបានធ្វើបច្ចុប្បន្នភាព៖ បានលុបព័ត៌មានភ្ញៀវចាស់ចេញពីបន្ទប់ ${formatRoomCode(cleanR)} ហើយចំណូលរបស់ម្ចាស់ផ្ទះត្រូវបានរក្សាទុកបូកបន្ត!`,
      `System Updated: Deleted old tenant from ${formatRoomCode(cleanR)}. Landlord revenue is preserved and will accumulate when a new tenant moves in.`
    );
  };

  // KPI Metrics for Nguon Sopheak Dashboard
  const dashboardStats = useMemo(() => {
    const totalAssignedRooms = effectiveManager.assignedRooms.length;
    const activeTenantsCount = scopedTenants.length;

    const enteredRoomSet = new Set<string>();
    history.forEach(h => {
      const rKey = normalizeRoom(h.roomNo);
      if (assignedRoomSet.has(rKey) && h.paymentDate.startsWith(selectedMonthYear)) {
        enteredRoomSet.add(rKey);
      }
    });

    const pendingRooms = scopedTenants.filter(t => !enteredRoomSet.has(normalizeRoom(t.roomNo)));
    return {
      totalAssignedRooms,
      activeTenantsCount,
      enteredThisMonthCount: enteredRoomSet.size,
      pendingRoomsCount: pendingRooms.length,
      pendingRooms
    };
  }, [effectiveManager, scopedTenants, history, assignedRoomSet, selectedMonthYear]);

  // 1. Handle New Tenant Registration (or Replacing Vacated Tenant while Preserving & Accumulating Revenue)
  const handleManagerAddNewTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedRole === 'manager' && !effectiveManager.permissions.canAddTenant) {
      showNotice(
        'error',
        'គណនីរបស់អ្នកមិនមានសិទ្ធិបន្ថែមភ្ញៀវថ្មីទេ!',
        'Access Denied: Your manager account does not have permission to add new tenants.'
      );
      return;
    }

    const cleanR = normalizeRoom(newTenantForm.roomNo);
    if (!cleanR) {
      showNotice('error', 'សូមជ្រើសរើសលេខបន្ទប់!', 'Please select a valid room number (1-16).');
      return;
    }

    if (resolvedRole === 'manager' && !assignedRoomSet.has(cleanR)) {
      showNotice(
        'error',
        `អ្នកមិនមានសិទ្ធិគ្រប់គ្រងបន្ទប់ ${formatRoomCode(cleanR)} ទេ!`,
        `Room ${formatRoomCode(cleanR)} is outside your assigned management scope.`
      );
      return;
    }

    const nameTrim = newTenantForm.tenantName.trim();
    if (!nameTrim) {
      showNotice('error', 'សូមបញ្ចូលឈ្មោះភ្ញៀវជួល!', 'Please enter the tenant full name.');
      return;
    }

    // Check if room is currently occupied
    const existingActive = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    if (existingActive) {
      // Preserve 100% of past room revenue in history and link to new tenant
      archiveOldTenantRevenueAndKeepCumulative(cleanR, existingActive, nameTrim);
    } else {
      // Even if room was already vacant, link historical archived revenue of this room to the new tenant so cumulative revenue continues seamlessly
      archiveOldTenantRevenueAndKeepCumulative(cleanR, undefined, nameTrim);
    }

    const stableId = formatStableTenantId(cleanR, newTenantForm.tenantIdNo);
    const rPrice = parseFloat(newTenantForm.roomPrice) || 80;
    const wPrice = parseFloat(newTenantForm.wifiPrice) || 0;
    const dep = parseFloat(newTenantForm.deposit) || 0;
    const eOld = newTenantForm.elecOld.trim() || '0';
    const wOld = newTenantForm.waterOld.trim() || '0';
    const eNew = newTenantForm.elecNew.trim();
    const wNew = newTenantForm.waterNew.trim();
    const nowIso = new Date().toISOString();

    const actorLabel =
      resolvedRole === 'owner'
        ? 'HENG SAMNANG (Owner)'
        : `${effectiveManager.fullName} (${effectiveManager.khmerName})`;

    const newTenantRecord: SharedTenantRecord = {
      tenantName: nameTrim,
      roomNo: cleanR,
      tenantPhone: newTenantForm.tenantPhone.trim(),
      tenantIdNo: stableId,
      checkInDate: newTenantForm.checkInDate || nowIso.split('T')[0],
      roomPrice: rPrice,
      wifiPrice: wPrice,
      elecOld: eNew || eOld,
      waterOld: wNew || wOld,
      deposit: dep,
      isPaid: false,
      notes: newTenantForm.notes.trim(),
      createdBy: actorLabel,
      createdAt: nowIso
    };

    // Save into main HSN database (savedTenants), replacing any old tenant in that room
    setSavedTenants(prev => {
      const withoutOld = prev.filter(t => normalizeRoom(t.roomNo) !== cleanR);
      const updated = [...withoutOld, newTenantRecord].sort(
        (a, b) => (parseInt(normalizeRoom(a.roomNo)) || 0) - (parseInt(normalizeRoom(b.roomNo)) || 0)
      );
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    // Accumulate (cộng dồn) new tenant's rental record onto existing preserved room revenue in history
    const eUsage = Math.max(0, (parseFloat(eNew || eOld) || 0) - (parseFloat(eOld) || 0));
    const wUsage = Math.max(0, (parseFloat(wNew || wOld) || 0) - (parseFloat(wOld) || 0));
    const eUsd = (eUsage * elecRateRiel) / 4000;
    const wUsd = (wUsage * waterRateRiel) / 4000;
    const totalUsd = rPrice + wPrice + eUsd + wUsd;
    const mPrefix = (newTenantForm.checkInDate || nowIso.split('T')[0]).slice(0, 7);
    const recId = `h-${mPrefix}-RM${cleanR.padStart(2, '0')}-${Date.now()}`;

    const newHist: SharedHistoryRecord = {
      id: recId,
      tenantName: nameTrim,
      roomNo: cleanR,
      paymentDate: newTenantForm.checkInDate || nowIso.split('T')[0],
      roomPrice: rPrice,
      wifiPrice: wPrice,
      elecPrice: Number(eUsd.toFixed(2)),
      waterPrice: Number(wUsd.toFixed(2)),
      otherPrice: 0,
      totalUsd: Number(totalUsd.toFixed(2)),
      elecUsage: eUsage,
      waterUsage: wUsage,
      status: 'PAID',
      tenantIdNo: stableId,
      elecOld: eOld,
      elecNew: eNew || eOld,
      waterOld: wOld,
      waterNew: wNew || wOld,
      recordedBy: actorLabel,
      recordedAt: nowIso
    };

    setHistory(prev => {
      // Never remove archived old tenant revenue records; accumulate (cộng dồn) new tenant record on top
      const updated = [newHist, ...prev];
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    onSelectTenantForInvoice(newTenantRecord);
    setEditingRoomNo(cleanR);
    setLastSystemAutoSync(new Date().toLocaleTimeString());
    playAudioFeedback?.('success');

    onSystemTenantUpdated?.({
      roomNo: cleanR,
      tenantName: nameTrim,
      action: 'new'
    });

    appendAuditLog({
      actorName: actorLabel,
      actorUsername: resolvedRole === 'owner' ? 'admin' : effectiveManager.username,
      actorRole: resolvedRole === 'owner' ? 'OWNER' : 'MANAGER',
      actionType: 'CREATE_TENANT',
      roomNo: cleanR,
      tenantId: stableId,
      tenantName: nameTrim,
      monthStr: (newTenantForm.checkInDate || nowIso.split('T')[0]).slice(0, 7),
      elecBefore: eOld,
      elecAfter: eNew || eOld,
      waterBefore: wOld,
      waterAfter: wNew || wOld,
      valueBefore: existingActive
        ? `ប្តូរពីភ្ញៀវចាស់: ${existingActive.tenantName} (រក្សាចំណូលបូកបន្ត)`
        : 'បន្ទប់ទំនេរ (Vacant)',
      valueAfter: `ភ្ញៀវថ្មី: ${nameTrim} | ថ្លៃបន្ទប់ $${rPrice} | កក់ $${dep}`,
      status: isOnline ? 'SYNCED' : 'VERIFIED',
      notes:
        newTenantForm.notes.trim() ||
        'ចុះឈ្មោះភ្ញៀវថ្មី និងរក្សាទុកចំណូលខែមុនៗបូកបន្ត / Registered new tenant & preserved cumulative room revenue'
    });

    showNotice(
      'success',
      `✅ ប្រព័ន្ធបានធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិ៖ បានបញ្ចូលភ្ញៀវថ្មី "${nameTrim}" ចូលបន្ទប់ ${formatRoomCode(cleanR)} រួចរាល់! ចំណូលខែមុនៗត្រូវបានរក្សាទុកបូកបន្ត។`,
      `System Automatically Updated: Added new tenant "${nameTrim}" (${stableId}) to ${formatRoomCode(cleanR)}. Past monthly room revenues are preserved and continue accumulating.`
    );

    // Reset form
    setNewTenantForm(prev => ({
      ...prev,
      tenantName: '',
      tenantIdNo: '',
      tenantPhone: '',
      elecNew: '',
      waterNew: '',
      notes: ''
    }));
  };

  // 2. Handle Updating Current Tenant Info by Manager (also supports entering a new tenant into a vacant room & keeping cumulative revenue)
  const handleManagerUpdateCurrentTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedRole === 'manager' && !effectiveManager.permissions.canUpdateTenant) {
      showNotice(
        'error',
        'គណនីរបស់អ្នកមិនមានសិទ្ធិកែប្រែព័ត៌មានភ្ញៀវទេ!',
        'Access Denied: Your manager account does not have permission to update tenant profiles.'
      );
      return;
    }

    const cleanR = normalizeRoom(editingRoomNo);
    const existing = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    const newNameTrim = editTenantForm.tenantName.trim() || existing?.tenantName || '';

    if (!newNameTrim) {
      showNotice(
        'error',
        'សូមបញ្ចូលឈ្មោះភ្ញៀវជួល!',
        'Please enter the tenant name.'
      );
      return;
    }

    const canEditPrice = resolvedRole === 'owner' || effectiveManager.permissions.canModifyPrices;
    const finalRoomPrice = canEditPrice ? Number(editTenantForm.roomPrice) || 80 : existing?.roomPrice ?? 80;
    const finalWifiPrice = canEditPrice ? Number(editTenantForm.wifiPrice) || 0 : existing?.wifiPrice ?? 0;
    const finalDeposit = canEditPrice ? Number(editTenantForm.deposit) || 0 : existing?.deposit ?? 0;
    const stableId = formatStableTenantId(cleanR, editTenantForm.tenantIdNo || existing?.tenantIdNo);
    const cleanElecOld = String(editTenantForm.elecOld ?? existing?.elecOld ?? '0').trim() || '0';
    const cleanWaterOld = String(editTenantForm.waterOld ?? existing?.waterOld ?? '0').trim() || '0';
    const nowIso = new Date().toISOString();

    const actorLabel =
      resolvedRole === 'owner'
        ? 'HENG SAMNANG (Owner)'
        : `${effectiveManager.fullName} (${effectiveManager.khmerName})`;

    const updatedTenant: SharedTenantRecord = {
      ...(existing || {}),
      roomNo: cleanR,
      tenantName: newNameTrim,
      tenantIdNo: stableId,
      tenantPhone: editTenantForm.tenantPhone.trim(),
      checkInDate: editTenantForm.checkInDate || existing?.checkInDate || nowIso.split('T')[0],
      roomPrice: finalRoomPrice,
      wifiPrice: finalWifiPrice,
      deposit: finalDeposit,
      elecOld: cleanElecOld,
      waterOld: cleanWaterOld,
      notes: editTenantForm.notes.trim(),
      updatedBy: actorLabel,
      updatedAt: nowIso
    };

    setSavedTenants(prev => {
      const hasRoom = prev.some(t => normalizeRoom(t.roomNo) === cleanR);
      const updated = hasRoom
        ? prev.map(t => (normalizeRoom(t.roomNo) === cleanR ? updatedTenant : t))
        : [...prev, updatedTenant].sort(
            (a, b) => (parseInt(normalizeRoom(a.roomNo)) || 0) - (parseInt(normalizeRoom(b.roomNo)) || 0)
          );
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    // Synchronize active (non-archived) records in history so all system views immediately reflect the updated tenant info
    setHistory(prev => {
      const currentMonthPrefix = (updatedTenant.checkInDate || nowIso.split('T')[0]).slice(0, 7);
      const hasActiveRoomRec = prev.some(
        r => !r.id.startsWith('h-archived-') && normalizeRoom(r.roomNo) === cleanR
      );

      let updated: SharedHistoryRecord[];
      if (hasActiveRoomRec) {
        updated = prev.map(rec => {
          if (!rec.id.startsWith('h-archived-') && normalizeRoom(rec.roomNo) === cleanR) {
            const newTotal =
              finalRoomPrice +
              finalWifiPrice +
              (Number(rec.elecPrice) || 0) +
              (Number(rec.waterPrice) || 0) +
              (Number(rec.otherPrice) || 0);
            return {
              ...rec,
              tenantName: newNameTrim,
              tenantIdNo: stableId,
              roomPrice: finalRoomPrice,
              wifiPrice: finalWifiPrice,
              totalUsd: Number(newTotal.toFixed(2))
            };
          }
          return rec;
        });
      } else {
        const newRec: SharedHistoryRecord = {
          id: `h-${currentMonthPrefix}-RM${cleanR.padStart(2, '0')}-${Date.now()}`,
          tenantName: newNameTrim,
          roomNo: cleanR,
          paymentDate: updatedTenant.checkInDate,
          roomPrice: finalRoomPrice,
          wifiPrice: finalWifiPrice,
          elecPrice: 0,
          waterPrice: 0,
          otherPrice: 0,
          totalUsd: Number((finalRoomPrice + finalWifiPrice).toFixed(2)),
          elecUsage: 0,
          waterUsage: 0,
          status: 'PAID',
          tenantIdNo: stableId,
          elecOld: cleanElecOld,
          elecNew: cleanElecOld,
          waterOld: cleanWaterOld,
          waterNew: cleanWaterOld,
          recordedBy: actorLabel,
          recordedAt: nowIso
        };
        updated = [newRec, ...prev];
      }

      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    onSelectTenantForInvoice(updatedTenant);
    setLastSystemAutoSync(new Date().toLocaleTimeString());
    playAudioFeedback?.('success');

    onSystemTenantUpdated?.({
      roomNo: cleanR,
      tenantName: newNameTrim,
      action: existing ? 'edit' : 'new'
    });

    appendAuditLog({
      actorName: actorLabel,
      actorUsername: resolvedRole === 'owner' ? 'admin' : effectiveManager.username,
      actorRole: resolvedRole === 'owner' ? 'OWNER' : 'MANAGER',
      actionType: existing ? 'UPDATE_TENANT' : 'CREATE_TENANT',
      roomNo: cleanR,
      tenantId: stableId,
      tenantName: updatedTenant.tenantName,
      monthStr: selectedMonthYear,
      valueBefore: existing
        ? `${existing.tenantName} | Tel: ${existing.tenantPhone} | $${existing.roomPrice}`
        : 'បន្ទប់ទំនេរ (Vacant)',
      valueAfter: `${updatedTenant.tenantName} | Tel: ${updatedTenant.tenantPhone} | $${updatedTenant.roomPrice}`,
      status: isOnline ? 'SYNCED' : 'VERIFIED',
      notes:
        editTenantForm.notes.trim() ||
        'ប្រព័ន្ធធ្វើបច្ចុប្បន្នភាពព័ត៌មានភ្ញៀវដោយស្វ័យប្រវត្តិ (រក្សាទុកចំណូលបូកបន្ត) / System automatically updated tenant info (cumulative revenue preserved)'
    });

    showNotice(
      'success',
      `✅ ប្រព័ន្ធបានធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិ៖ ព័ត៌មានភ្ញៀវ "${newNameTrim}" បន្ទប់ ${formatRoomCode(cleanR)} ត្រូវបានកែប្រែ និងរក្សាទុកក្នុងប្រព័ន្ធរួចរាល់!`,
      `System Automatically Updated: Tenant profile "${newNameTrim}" for ${formatRoomCode(cleanR)} is synced across all views.`
    );
  };

  // 3. Handle Monthly Utility Meter Recording (Electricity & Water) for Existing Tenants
  const handleSaveMonthlyMeterReadings = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedRole === 'manager' && !effectiveManager.permissions.canEnterUtilities) {
      showNotice(
        'error',
        'គណនីរបស់អ្នកមិនមានសិទ្ធិបញ្ចូលលេខទឹក-ភ្លើងទេ!',
        'Access Denied: Your manager account is not authorized to enter utility meter readings.'
      );
      return;
    }

    const cleanR = normalizeRoom(meterRoomNo);
    const activeTenant = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
    if (!activeTenant) {
      showNotice(
        'error',
        `បន្ទប់ ${formatRoomCode(cleanR)} មិនទាន់មានភ្ញៀវស្នាក់នៅទេ!`,
        `Room ${formatRoomCode(cleanR)} has no active tenant. Please register a tenant first.`
      );
      return;
    }

    const oldE = parseFloat(meterElecOld) || 0;
    const newE = meterElecNew.trim() !== '' ? parseFloat(meterElecNew) : oldE;
    const oldW = parseFloat(meterWaterOld) || 0;
    const newW = meterWaterNew.trim() !== '' ? parseFloat(meterWaterNew) : oldW;

    const isElecLower = newE < oldE;
    const isWaterLower = newW < oldW;

    if (isElecLower || isWaterLower) {
      if (!confirmLowerReading || !lowerReadingReason.trim()) {
        setConfirmLowerReading(true);
        showNotice(
          'warning',
          '⚠️ លេខកុងទ័រថ្មីទាបជាងលេខចាស់! សូមបញ្ជាក់មូលហេតុនៃការកែតម្រូវខាងក្រោមមុនពេលរក្សាទុក។',
          'Warning: New meter reading is lower than previous reading! Please enter verification/adjustment reason below.'
        );
        return;
      }
    }

    const elecUsage = Math.max(0, newE - oldE);
    const waterUsage = Math.max(0, newW - oldW);
    const elecUsd = (elecUsage * elecRateRiel) / 4000;
    const waterUsd = (waterUsage * waterRateRiel) / 4000;
    const roomPrice = Number(activeTenant.roomPrice) || 80;
    const wifiPrice = Number(activeTenant.wifiPrice) || 0;
    const totalUsd = roomPrice + wifiPrice + elecUsd + waterUsd;

    const stableTenantId = formatStableTenantId(cleanR, activeTenant.tenantIdNo);
    const nowIso = new Date().toISOString();
    const actorLabel =
      resolvedRole === 'owner'
        ? 'HENG SAMNANG (Owner)'
        : `${effectiveManager.fullName} (${effectiveManager.khmerName})`;

    const existingMonthRec = history.find(
      h => normalizeRoom(h.roomNo) === cleanR && h.paymentDate.startsWith(meterMonth)
    );
    const recordId = existingMonthRec?.id || `util-${meterMonth}-RM${cleanR.padStart(2, '0')}`;
    const paymentDateStr = existingMonthRec?.paymentDate || `${meterMonth}-01`;

    const newHistoryRecord: SharedHistoryRecord = {
      id: recordId,
      tenantName: activeTenant.tenantName,
      roomNo: cleanR,
      paymentDate: paymentDateStr,
      roomPrice,
      wifiPrice,
      elecPrice: Number(elecUsd.toFixed(2)),
      waterPrice: Number(waterUsd.toFixed(2)),
      otherPrice: existingMonthRec?.otherPrice || 0,
      totalUsd: Number((totalUsd + (existingMonthRec?.otherPrice || 0)).toFixed(2)),
      elecUsage,
      waterUsage,
      status: existingMonthRec?.status || 'PAID',
      tenantIdNo: stableTenantId,
      elecOld: String(oldE),
      elecNew: String(newE),
      waterOld: String(oldW),
      waterNew: String(newW),
      recordedBy: actorLabel,
      recordedAt: nowIso
    };

    // 1. Update main history (Idempotent Upsert for current tenant in this room+month, while preserving all archived old tenant records so revenue accumulates!)
    setHistory(prev => {
      const withoutDuplicate = prev.filter(
        h =>
          h.id.startsWith('h-archived-') ||
          !(normalizeRoom(h.roomNo) === cleanR && h.paymentDate.startsWith(meterMonth))
      );
      const updated = [newHistoryRecord, ...withoutDuplicate];
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    // 2. Update tenant's latest readings in savedTenants
    const updatedTenant: SharedTenantRecord = {
      ...activeTenant,
      tenantIdNo: stableTenantId,
      elecOld: String(newE),
      waterOld: String(newW),
      elecNew: String(newE),
      waterNew: String(newW),
      updatedBy: actorLabel,
      updatedAt: nowIso
    };

    setSavedTenants(prev => {
      const updated = prev.map(t => (normalizeRoom(t.roomNo) === cleanR ? updatedTenant : t));
      localStorage.setItem('savedTenants', JSON.stringify(updated));
      return updated;
    });

    onSelectTenantForInvoice(updatedTenant);
    playAudioFeedback?.('success');

    appendAuditLog({
      actorName: actorLabel,
      actorUsername: resolvedRole === 'owner' ? 'admin' : effectiveManager.username,
      actorRole: resolvedRole === 'owner' ? 'OWNER' : 'MANAGER',
      actionType: isElecLower || isWaterLower ? 'ADJUST_UTILITY' : 'ENTER_UTILITY',
      roomNo: cleanR,
      tenantId: stableTenantId,
      tenantName: activeTenant.tenantName,
      monthStr: meterMonth,
      elecBefore: `${oldE} kWh`,
      elecAfter: `${newE} kWh (${elecUsage} kWh = $${elecUsd.toFixed(2)})`,
      waterBefore: `${oldW} m³`,
      waterAfter: `${newW} m³ (${waterUsage} m³ = $${waterUsd.toFixed(2)})`,
      valueBefore: existingMonthRec ? `$${existingMonthRec.totalUsd.toFixed(2)}` : '$0.00',
      valueAfter: `$${newHistoryRecord.totalUsd.toFixed(2)}`,
      status: isElecLower || isWaterLower ? 'ADJUSTED' : 'SYNCED',
      notes:
        lowerReadingReason.trim() ||
        meterNotes.trim() ||
        `កត់ត្រាទឹក-ភ្លើងប្រចាំខែ ${meterMonth} / Monthly utility reading saved`
    });

    setConfirmLowerReading(false);
    setLowerReadingReason('');
    setMeterNotes('');

    showNotice(
      'success',
      `✅ បានរក្សាទុកលេខទឹក-ភ្លើងបន្ទប់ ${formatRoomCode(cleanR)} សម្រាប់ខែ ${meterMonth} ដោយជោគជ័យ!`,
      `Synced ${formatRoomCode(cleanR)} (${elecUsage} kWh, ${waterUsage} m³) to HSN master database.`
    );
  };

  // 4. Handle Controlled Adjustment of Saved Utility Record (with Audit Trail)
  const handleSaveRecordAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingRecord) return;
    if (!adjustReason.trim()) {
      showNotice(
        'error',
        'សូមបញ្ចូលមូលហេតុនៃការកែតម្រូវទិន្នន័យ!',
        'Please provide a mandatory reason for adjusting this saved utility record.'
      );
      return;
    }

    const cleanR = normalizeRoom(adjustingRecord.roomNo);
    const oldE = parseFloat(adjustingRecord.elecOld || '0') || 0;
    const oldW = parseFloat(adjustingRecord.waterOld || '0') || 0;
    const newE = parseFloat(adjustElecNew) || 0;
    const newW = parseFloat(adjustWaterNew) || 0;

    const elecUsage = Math.max(0, newE - oldE);
    const waterUsage = Math.max(0, newW - oldW);
    const elecUsd = (elecUsage * elecRateRiel) / 4000;
    const waterUsd = (waterUsage * waterRateRiel) / 4000;
    const totalUsd =
      Number(adjustingRecord.roomPrice) +
      Number(adjustingRecord.wifiPrice) +
      elecUsd +
      waterUsd +
      Number(adjustingRecord.otherPrice || 0);

    const actorLabel =
      resolvedRole === 'owner'
        ? 'HENG SAMNANG (Owner)'
        : `${effectiveManager.fullName} (${effectiveManager.khmerName})`;
    const nowIso = new Date().toISOString();

    const updatedRec: SharedHistoryRecord = {
      ...adjustingRecord,
      elecPrice: Number(elecUsd.toFixed(2)),
      waterPrice: Number(waterUsd.toFixed(2)),
      totalUsd: Number(totalUsd.toFixed(2)),
      elecUsage,
      waterUsage,
      elecNew: String(newE),
      waterNew: String(newW),
      recordedBy: actorLabel,
      recordedAt: nowIso
    };

    setHistory(prev => {
      const updated = prev.map(item => (item.id === adjustingRecord.id ? updatedRec : item));
      localStorage.setItem('invoice_history', JSON.stringify(updated));
      return updated;
    });

    appendAuditLog({
      actorName: actorLabel,
      actorUsername: resolvedRole === 'owner' ? 'admin' : effectiveManager.username,
      actorRole: resolvedRole === 'owner' ? 'OWNER' : 'MANAGER',
      actionType: 'ADJUST_UTILITY',
      roomNo: cleanR,
      tenantId: adjustingRecord.tenantIdNo || formatStableTenantId(cleanR),
      tenantName: adjustingRecord.tenantName,
      monthStr: adjustingRecord.paymentDate.slice(0, 7),
      elecBefore: `${adjustingRecord.elecUsage} kWh ($${adjustingRecord.elecPrice.toFixed(2)})`,
      elecAfter: `${elecUsage} kWh ($${elecUsd.toFixed(2)})`,
      waterBefore: `${adjustingRecord.waterUsage} m³ ($${adjustingRecord.waterPrice.toFixed(2)})`,
      waterAfter: `${waterUsage} m³ ($${waterUsd.toFixed(2)})`,
      valueBefore: `$${adjustingRecord.totalUsd.toFixed(2)}`,
      valueAfter: `$${updatedRec.totalUsd.toFixed(2)}`,
      status: 'ADJUSTED',
      notes: `មូលហេតុកែតម្រូវ / Adjustment Reason: ${adjustReason.trim()}`
    });

    setAdjustingRecord(null);
    setAdjustReason('');
    showNotice(
      'success',
      `✅ បានកែតម្រូវកំណត់ត្រាបន្ទប់ ${formatRoomCode(cleanR)} ដោយមានកត់ត្រាក្នុងប្រវត្តិត្រួតពិនិត្យ!`,
      `Adjusted utility record for ${formatRoomCode(cleanR)} and logged before/after diff in Audit Log.`
    );
  };

  // Owner Actions: Create New Manager Account
  const handleOwnerCreateManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedRole !== 'owner') return;
    const uName = newMgrUsername.trim().toLowerCase();
    const fName = newMgrName.trim();
    const pwd = newMgrPassword.trim();
    if (!uName || !fName || !pwd) {
      showNotice('error', 'សូមបំពេញឈ្មោះ គណនី និងពាក្យសម្ងាត់!', 'Please fill in full name, username, and password.');
      return;
    }
    if (uName === 'admin' || managerAccounts.some(m => m.username.toLowerCase() === uName)) {
      showNotice('error', 'ឈ្មោះគណនីនេះមានរួចហើយ!', 'This username is already taken or reserved.');
      return;
    }

    const newAcc: ManagerAccount = {
      id: `mgr-${Date.now()}`,
      fullName: fName,
      khmerName: newMgrKhmerName.trim() || fName,
      username: uName,
      phone: newMgrPhone.trim() || '—',
      passwordHash: hashPassword(pwd),
      status: 'ACTIVE',
      assignedRooms: [...ALL_STANDARD_ROOMS],
      permissions: {
        canAddTenant: true,
        canUpdateTenant: true,
        canEnterUtilities: true,
        canModifyPrices: false,
        canDeleteRecords: false
      },
      createdAt: new Date().toISOString(),
      createdBy: 'HENG SAMNANG (HSN - Owner)'
    };

    setManagerAccounts(prev => {
      const updated = [...prev, newAcc];
      localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
      return updated;
    });

    appendAuditLog({
      actorName: 'HENG SAMNANG (Owner)',
      actorUsername: 'admin',
      actorRole: 'OWNER',
      actionType: 'ACCOUNT_PERMISSION',
      roomNo: 'ALL',
      tenantId: newAcc.id,
      tenantName: newAcc.fullName,
      monthStr: selectedMonthYear,
      valueBefore: 'None',
      valueAfter: `Created Manager Account (@${newAcc.username})`,
      status: 'VERIFIED',
      notes: 'ម្ចាស់ផ្ទះ HSN បានបង្កើតគណនីអ្នកគ្រប់គ្រងថ្មី / Owner created manager account'
    });

    setNewMgrName('');
    setNewMgrKhmerName('');
    setNewMgrUsername('');
    setNewMgrPhone('');
    setNewMgrPassword('');
    showNotice('success', `✅ បានបង្កើតគណនីអ្នកគ្រប់គ្រង "${fName}" ដោយជោគជ័យ!`, `Created manager account @${uName}.`);
  };

  // Owner Actions: Toggle Manager Status (ACTIVE / LOCKED / REVOKED)
  const handleOwnerSetManagerStatus = (mgrId: string, newStatus: 'ACTIVE' | 'LOCKED' | 'REVOKED') => {
    if (resolvedRole !== 'owner') return;
    setManagerAccounts(prev => {
      const updated = prev.map(m => (m.id === mgrId ? { ...m, status: newStatus } : m));
      localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
      return updated;
    });
    const target = managerAccounts.find(m => m.id === mgrId);
    appendAuditLog({
      actorName: 'HENG SAMNANG (Owner)',
      actorUsername: 'admin',
      actorRole: 'OWNER',
      actionType: 'ACCOUNT_PERMISSION',
      roomNo: 'ALL',
      tenantId: mgrId,
      tenantName: target?.fullName || mgrId,
      monthStr: selectedMonthYear,
      valueBefore: target?.status || 'ACTIVE',
      valueAfter: newStatus,
      status: 'VERIFIED',
      notes: `ប្តូរស្ថានភាពគណនីអ្នកគ្រប់គ្រងទៅជា ${newStatus}`
    });
    showNotice(
      'success',
      `បានប្តូរស្ថានភាពគណនី ${target?.fullName} ទៅជា ${newStatus}!`,
      `Updated manager status to ${newStatus}.`
    );
  };

  // Owner Actions: Reset Manager Password (hashed)
  const handleOwnerResetManagerPassword = (mgrId: string) => {
    if (resolvedRole !== 'owner' || !resetPwdValue.trim()) return;
    const hashed = hashPassword(resetPwdValue.trim());
    setManagerAccounts(prev => {
      const updated = prev.map(m => (m.id === mgrId ? { ...m, passwordHash: hashed } : m));
      localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
      return updated;
    });
    setResetPwdMgrId(null);
    setResetPwdValue('');
    showNotice('success', '✅ បានផ្លាស់ប្តូរពាក្យសម្ងាត់អ្នកគ្រប់គ្រងដោយជោគជ័យ!', 'Manager password updated and hashed securely.');
  };

  // Owner Actions: Toggle Room Assignment or Permission Flag
  const handleOwnerToggleRoomForManager = (mgrId: string, roomNo: string) => {
    if (resolvedRole !== 'owner') return;
    setManagerAccounts(prev => {
      const updated = prev.map(m => {
        if (m.id !== mgrId) return m;
        const exists = m.assignedRooms.includes(roomNo);
        const nextRooms = exists
          ? m.assignedRooms.filter(r => r !== roomNo)
          : [...m.assignedRooms, roomNo].sort((a, b) => Number(a) - Number(b));
        return { ...m, assignedRooms: nextRooms };
      });
      localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const handleOwnerTogglePermissionFlag = (mgrId: string, flag: keyof ManagerPermissions) => {
    if (resolvedRole !== 'owner') return;
    setManagerAccounts(prev => {
      const updated = prev.map(m => {
        if (m.id !== mgrId) return m;
        return {
          ...m,
          permissions: {
            ...m.permissions,
            [flag]: !m.permissions[flag]
          }
        };
      });
      localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const selectedMeterTenant = useMemo(() => {
    return savedTenants.find(t => normalizeRoom(t.roomNo) === normalizeRoom(meterRoomNo));
  }, [savedTenants, meterRoomNo]);

  const liveElecConsumption = useMemo(() => {
    const oldVal = parseFloat(meterElecOld) || 0;
    const newVal = meterElecNew.trim() !== '' ? parseFloat(meterElecNew) : oldVal;
    return newVal - oldVal;
  }, [meterElecOld, meterElecNew]);

  const liveWaterConsumption = useMemo(() => {
    const oldVal = parseFloat(meterWaterOld) || 0;
    const newVal = meterWaterNew.trim() !== '' ? parseFloat(meterWaterNew) : oldVal;
    return newVal - oldVal;
  }, [meterWaterOld, meterWaterNew]);

  const liveElecCostRiel = Math.max(0, liveElecConsumption) * elecRateRiel;
  const liveWaterCostRiel = Math.max(0, liveWaterConsumption) * waterRateRiel;
  const liveElecCostUsd = liveElecCostRiel / 4000;
  const liveWaterCostUsd = liveWaterCostRiel / 4000;

  // Reusable Language Toggle Button — ONLY Flag Icon (No text)
  const renderLanguageToggleButton = () => (
    <button
      type="button"
      onClick={toggleLanguage}
      className="p-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-700 border-2 border-amber-300/90 cursor-pointer flex items-center justify-center shadow-md transition-all active:scale-95"
      title={lang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
      aria-label={lang === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
    >
      <LanguageFlagIcon lang={lang} className="w-7 h-5" />
    </button>
  );

  const KHMER_MONTH_NAMES = [
    'មករា',
    'កុម្ភៈ',
    'មីនា',
    'មេសា',
    'ឧសភា',
    'មិថុនា',
    'កក្កដា',
    'សីហា',
    'កញ្ញា',
    'តុលា',
    'វិច្ឆិកា',
    'ធ្នូ'
  ];
  const EN_MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  const renderCustomMonthYearSelect = (
    value: string,
    onChangeValue: (nextVal: string) => void,
    darkTheme: boolean = true
  ) => {
    const parts = (value || '2026-10').split('-');
    const yr = parts[0] || '2026';
    const mo = (parts[1] || '10').padStart(2, '0');
    const selectClass = darkTheme
      ? 'bg-emerald-900 text-white font-mono font-black text-xs px-2 py-1 rounded-lg border border-emerald-500/60 outline-none cursor-pointer'
      : 'bg-white text-stone-900 font-mono font-black text-xs px-2.5 py-2 rounded-xl border border-stone-300 outline-none cursor-pointer';

    return (
      <div className="flex items-center gap-1.5">
        <select
          value={mo}
          onChange={e => onChangeValue(`${yr}-${e.target.value}`)}
          className={selectClass}
        >
          {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((m, idx) => (
            <option key={m} value={m} className="bg-emerald-950 text-white font-bold">
              {lang === 'km' ? `ខែទី ${idx + 1} (${KHMER_MONTH_NAMES[idx]})` : `${m} - ${EN_MONTH_NAMES[idx]}`}
            </option>
          ))}
        </select>
        <select
          value={yr}
          onChange={e => onChangeValue(`${e.target.value}-${mo}`)}
          className={selectClass}
        >
          {['2025', '2026', '2027'].map(y => (
            <option key={y} value={y} className="bg-emerald-950 text-white font-bold">
              {y}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // ============================================================================
  // RENDER OWNER MENU VIEWS: អ្នកគ្រប់គ្រង | បញ្ជីអ្នកគ្រប់គ្រង | ចែករំលែកសិទ្ធិ
  // ============================================================================
  if ((mode === 'owner_overview' || mode === 'owner_list' || mode === 'owner_access') && resolvedRole === 'owner') {
    const targetMgr =
      managerAccounts.find(m => m.id === selectedMgrIdForPerms) ||
      managerAccounts[0] ||
      DEFAULT_NGUON_SOPHEAK_ACCOUNT;

    return (
      <div className="p-4 sm:p-6 bg-stone-50 min-h-[720px] font-sans text-stone-800 space-y-6">
        {/* Top Owner Header Bar */}
        <div className="bg-gradient-to-r from-[#072b1b] via-emerald-900 to-[#093522] text-white rounded-2xl p-5 border-2 border-emerald-500/50 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border-2 border-amber-300/80 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-md">
                  {tr('ម្ចាស់កម្មសិទ្ធិ • OWNER (HENG SAMNANG - HSN)', 'OWNER • HENG SAMNANG (HSN)')}
                </span>
                <span className="text-xs text-emerald-200 font-bold">
                  {tr('• ប្រព័ន្ធចែករំលែកសិទ្ធិគ្រប់គ្រង', '• Shared Management & Access Control')}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-normal font-moul text-white mt-1">
                {mode === 'owner_overview' && tr('អ្នកគ្រប់គ្រង (Manager Overview)', 'Manager Overview & Role Control')}
                {mode === 'owner_list' && tr('បញ្ជីអ្នកគ្រប់គ្រង (Manager Directory)', 'Manager Accounts Directory')}
                {mode === 'owner_access' && tr('ចែករំលែកសិទ្ធិ (Shared Access & Audit Log)', 'Shared Access Permissions & Audit Log')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            {renderLanguageToggleButton()}

            <button
              type="button"
              onClick={() => onSwitchMainTab('managerOverview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                mode === 'owner_overview'
                  ? 'bg-amber-400 text-stone-950 border-white shadow-md'
                  : 'bg-emerald-950/80 text-emerald-100 border-emerald-600 hover:bg-emerald-800'
              }`}
            >
              {tr('អ្នកគ្រប់គ្រង', 'Managers')}
            </button>
            <button
              type="button"
              onClick={() => onSwitchMainTab('managerList')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                mode === 'owner_list'
                  ? 'bg-amber-400 text-stone-950 border-white shadow-md'
                  : 'bg-emerald-950/80 text-emerald-100 border-emerald-600 hover:bg-emerald-800'
              }`}
            >
              {tr('បញ្ជីអ្នកគ្រប់គ្រង', 'Manager List')}
            </button>
            <button
              type="button"
              onClick={() => onSwitchMainTab('sharedAccess')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                mode === 'owner_access'
                  ? 'bg-amber-400 text-stone-950 border-white shadow-md'
                  : 'bg-emerald-950/80 text-emerald-100 border-emerald-600 hover:bg-emerald-800'
              }`}
            >
              {tr('ចែករំលែកសិទ្ធិ', 'Shared Access')}
            </button>
            <button
              type="button"
              onClick={() => onSwitchMainTab('sopheakDashboard')}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-stone-950 border-2 border-white shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>{tr('បើកផ្ទាំង Nguon Sopheak', 'Open Nguon Sopheak View')}</span>
            </button>
          </div>
        </div>

        {bannerNotice && (
          <div
            className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 shadow-md ${
              bannerNotice.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-400'
                : bannerNotice.type === 'warning'
                ? 'bg-amber-950 text-amber-100 border-amber-400'
                : 'bg-red-950 text-red-100 border-red-400'
            }`}
          >
            <div>
              <p className="font-bold text-sm">{lang === 'km' ? bannerNotice.km : bannerNotice.en}</p>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs font-bold px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: OWNER_OVERVIEW */}
        {mode === 'owner_overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-stone-500">
                  {tr('អ្នកគ្រប់គ្រងសកម្ម', 'Active Primary Manager')}
                </div>
                <div className="text-lg font-black text-emerald-900 mt-1">Nguon Sopheak (ងួន សុភ័ក្រ)</div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  {tr('គណនីដាច់ដោយឡែក:', 'Dedicated Account:')} @{DEFAULT_NGUON_SOPHEAK_ACCOUNT.username}
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-stone-500">
                  {tr('បន្ទប់បានប្រគល់សិទ្ធិ', 'Assigned Rooms')}
                </div>
                <div className="text-2xl font-black text-stone-900 font-mono tabular-nums mt-1">
                  {effectiveManager.assignedRooms.length} / {ALL_STANDARD_ROOMS.length} {tr('បន្ទប់', 'Rooms')}
                </div>
                <div className="text-[11px] text-stone-600 mt-1">
                  {tr('មានភ្ញៀវកំពុងជួល:', 'Currently Occupied:')} {dashboardStats.activeTenantsCount}{' '}
                  {tr('បន្ទប់', 'Rooms')}
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-stone-500">
                  {tr(`បានកត់ត្រាទឹក-ភ្លើងខែនេះ (${selectedMonthYear})`, `Meters Recorded (${selectedMonthYear})`)}
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1">
                  {dashboardStats.enteredThisMonthCount} {tr('បន្ទប់', 'Rooms')}
                </div>
                <div className="text-[11px] text-amber-700 font-bold mt-1">
                  {tr('នៅសល់មិនទាន់បញ្ចូល:', 'Pending Entry:')} {dashboardStats.pendingRoomsCount}{' '}
                  {tr('បន្ទប់', 'Rooms')}
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 shadow-sm">
                <div className="text-xs font-bold text-stone-500">
                  {tr('កំណត់ត្រាត្រួតពិនិត្យ (Audit Log)', 'Audit Log Records')}
                </div>
                <div className="text-2xl font-black text-blue-900 font-mono tabular-nums mt-1">
                  {auditLogs.length} {tr('កំណត់ត្រា', 'Entries')}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  {tr('✓ ធ្វើសមកាលកម្មទិន្នន័យរួម HSN 100%', '✓ 100% Synced with HSN Master DB')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <h3 className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>A. {tr('ម្ចាស់កម្មសិទ្ធិ – Owner (HENG SAMNANG - HSN)', 'Owner – HENG SAMNANG (HSN)')}</span>
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md">
                    {tr('សិទ្ធិពេញលេញ 100%', 'Full Control 100%')}
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-stone-700 font-medium">
                  <li>
                    ✓{' '}
                    {tr(
                      'មានសិទ្ធិគ្រប់គ្រងកម្មវិធីទាំងមូល និងមើល/កែប្រែគ្រប់តារាងទិន្នន័យ។',
                      'Full administrative control to view and edit all system tables and revenue ledgers.'
                    )}
                  </li>
                  <li>
                    ✓{' '}
                    {tr(
                      'បន្ថែម កែសម្រួល ឬបញ្ចប់កិច្ចសន្យាជួលបន្ទប់ (រក្សាទុកចំណូលបូកបន្ត)។',
                      'Add, edit, or terminate room rental contracts while preserving cumulative revenue.'
                    )}
                  </li>
                  <li>
                    ✓{' '}
                    {tr(
                      'បង្កើតគណនី ផ្តល់សិទ្ធិ ចាក់សោ (Lock) ឬដកហូតសិទ្ធិអ្នកគ្រប់គ្រង (Revoke)។',
                      'Create accounts, assign room permissions, lock, or revoke manager access.'
                    )}
                  </li>
                  <li>
                    ✓{' '}
                    {tr(
                      'ពិនិត្យមើលប្រវត្តិបញ្ចូលទិន្នន័យ (Audit Log) របស់ Nguon Sopheak គ្រប់ពេល។',
                      'Inspect complete Audit Log history of all entries made by Nguon Sopheak.'
                    )}
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <h3 className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <span>
                      B. {tr('អ្នកគ្រប់គ្រង – Manager (Nguon Sopheak / ងួន សុភ័ក្រ)', 'Manager – Nguon Sopheak')}
                    </span>
                  </h3>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2.5 py-1 rounded-md">
                    {tr('គណនីដាច់ដោយឡែក', 'Separate Account')}
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-stone-700 font-medium">
                  <li>
                    ✓{' '}
                    {tr(
                      'ចូលប្រព័ន្ធដោយគណនីផ្ទាល់ខ្លួន (@sopheak) មិនប្រើពាក្យសម្ងាត់រួមជាមួយម្ចាស់ផ្ទះ។',
                      'Logs in with a separate dedicated account (@sopheak), never sharing the Owner password.'
                    )}
                  </li>
                  <li>
                    ✓{' '}
                    {tr(
                      'បញ្ចូលភ្ញៀវជួលថ្មី ស្វែងរកភ្ញៀវចាស់ ប្តូរភ្ញៀវឈប់ជួល (រក្សាចំណូលបូកបន្ត) និងកត់ត្រាទឹក-ភ្លើងប្រចាំខែ។',
                      'Registers new tenants, updates existing tenants, clears vacated tenants (preserving cumulative revenue), and enters monthly water/electricity meters.'
                    )}
                  </li>
                  <li>
                    ✓{' '}
                    {tr(
                      'ទិន្នន័យធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិចូលក្នុងប្រព័ន្ធមេរបស់ HSN។',
                      'All entries automatically synchronize into the shared HSN master database.'
                    )}
                  </li>
                  <li>
                    🔒{' '}
                    {tr(
                      'មិនអាចលុបប្រវត្តិទឹក-ភ្លើងដែលបានរក្សាទុក ឬកែតម្លៃបន្ទប់ដោយគ្មានសិទ្ធិពីម្ចាស់ផ្ទះឡើយ។',
                      'Cannot delete saved utility history records or alter room/utility prices unless granted permission.'
                    )}
                  </li>
                </ul>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSwitchMainTab('sopheakDashboard')}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {tr(
                        'ចូលមើលផ្ទាំងគ្រប់គ្រងរបស់ Nguon Sopheak',
                        'Open Nguon Sopheak Management Dashboard'
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OWNER_LIST */}
        {mode === 'owner_list' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <h3 className="text-sm font-extrabold text-stone-900 mb-4 flex items-center justify-between">
                  <span>{tr('បញ្ជីគណនីអ្នកគ្រប់គ្រងទាំងអស់', 'All Manager Accounts')}</span>
                  <span className="text-xs font-mono bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md">
                    {managerAccounts.length} {tr('គណនី', 'Accounts')}
                  </span>
                </h3>

                <div className="space-y-4">
                  {managerAccounts.map(mgr => (
                    <div
                      key={mgr.id}
                      className="p-4 rounded-xl border-2 border-stone-200 bg-stone-50/70 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-emerald-950">{mgr.fullName}</span>
                            <span className="font-moul text-xs text-emerald-700">({mgr.khmerName})</span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                mgr.status === 'ACTIVE'
                                  ? 'bg-emerald-600 text-white'
                                  : mgr.status === 'LOCKED'
                                  ? 'bg-amber-500 text-stone-950'
                                  : 'bg-red-600 text-white'
                              }`}
                            >
                              {mgr.status}
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 mt-1 font-mono">
                            Username: <strong className="text-stone-900">@{mgr.username}</strong> • Tel: {mgr.phone} • Rooms:{' '}
                            <strong>
                              {mgr.assignedRooms.length} {tr('បន្ទប់', 'Rooms')}
                            </strong>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Password Hash: <code className="text-emerald-800">{mgr.passwordHash}</code>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mgr.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleOwnerSetManagerStatus(mgr.id, 'ACTIVE')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>{tr('បើកសិទ្ធិ', 'Activate')}</span>
                            </button>
                          )}
                          {mgr.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleOwnerSetManagerStatus(mgr.id, 'LOCKED')}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{tr('ចាក់សោ', 'Lock')}</span>
                            </button>
                          )}
                          {mgr.status !== 'REVOKED' && (
                            <button
                              type="button"
                              onClick={() => handleOwnerSetManagerStatus(mgr.id, 'REVOKED')}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              {tr('ដកហូតសិទ្ធិ', 'Revoke')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setResetPwdMgrId(resetPwdMgrId === mgr.id ? null : mgr.id);
                              setResetPwdValue('');
                            }}
                            className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>{tr('ប្តូរពាក្យសម្ងាត់', 'Reset Password')}</span>
                          </button>
                        </div>
                      </div>

                      {resetPwdMgrId === mgr.id && (
                        <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
                          <input
                            type="password"
                            placeholder={tr('បញ្ចូលពាក្យសម្ងាត់ថ្មី...', 'Enter new password...')}
                            value={resetPwdValue}
                            onChange={e => setResetPwdValue(e.target.value)}
                            className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleOwnerResetManagerPassword(mgr.id)}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            {tr('រក្សាទុក', 'Save Password')}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleOwnerCreateManager}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4"
              >
                <h3 className="text-sm font-extrabold text-emerald-950 border-b border-stone-200 pb-2.5 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>{tr('អញ្ជើញ និងបង្កើតគណនីអ្នកគ្រប់គ្រងថ្មី', 'Invite & Create New Manager Account')}</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ឈ្មោះពេញ (Full Name) *', 'Full Name *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguon Sopheak"
                      value={newMgrName}
                      onChange={e => setNewMgrName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ឈ្មោះភាសាខ្មែរ (Khmer Name)', 'Khmer Name')}
                    </label>
                    <input
                      type="text"
                      placeholder="ងួន សុភ័ក្រ"
                      value={newMgrKhmerName}
                      onChange={e => setNewMgrKhmerName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ឈ្មោះគណនីចូលប្រព័ន្ធ (Username) *', 'Login Username *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="sopheak2"
                      value={newMgrUsername}
                      onChange={e => setNewMgrUsername(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('លេខទូរស័ព្ទ (Phone)', 'Phone Number')}
                    </label>
                    <input
                      type="text"
                      placeholder="088 966 8896"
                      value={newMgrPhone}
                      onChange={e => setNewMgrPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ពាក្យសម្ងាត់ដាច់ដោយឡែក (Password) *', 'Separate Password (Hashed) *')}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newMgrPassword}
                      onChange={e => setNewMgrPassword(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl shadow cursor-pointer"
                  >
                    + {tr('បង្កើតគណនីអ្នកគ្រប់គ្រង និងផ្តល់សិទ្ធិ', 'Create Manager Account & Grant Access')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: OWNER_ACCESS */}
        {mode === 'owner_access' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900">
                    {tr(
                      'កំណត់សិទ្ធិប្រើប្រាស់ និងបន្ទប់សម្រាប់អ្នកគ្រប់គ្រង',
                      'Configure Room Scope & Functional Permissions'
                    )}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {tr(
                      'ម្ចាស់ផ្ទះ HENG SAMNANG អាចបើក ឬបិទសិទ្ធិបន្ទប់នីមួយៗ និងសិទ្ធិកែតម្លៃសម្រាប់ Nguon Sopheak។',
                      'Owner HENG SAMNANG can enable or restrict specific rooms and price-editing permissions for Nguon Sopheak.'
                    )}
                  </p>
                </div>
                <select
                  value={targetMgr.id}
                  onChange={e => setSelectedMgrIdForPerms(e.target.value)}
                  className="bg-emerald-950 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-emerald-500"
                >
                  {managerAccounts.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} (@{m.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    key: 'canAddTenant' as keyof ManagerPermissions,
                    title: tr('បញ្ចូលភ្ញៀវជួលថ្មី', 'Add New Tenants'),
                    desc: tr('អនុញ្ញាតឱ្យចុះឈ្មោះភ្ញៀវចូលបន្ទប់ទំនេរ', 'Allow registering new tenants into rooms')
                  },
                  {
                    key: 'canUpdateTenant' as keyof ManagerPermissions,
                    title: tr('កែប្រែព័ត៌មានភ្ញៀវចាស់', 'Update Current Tenants'),
                    desc: tr('ស្វែងរក និងធ្វើបច្ចុប្បន្នភាពលេខទូរស័ព្ទ/ID', 'Search and update tenant phone/ID')
                  },
                  {
                    key: 'canEnterUtilities' as keyof ManagerPermissions,
                    title: tr('កត់ត្រាទឹក-ភ្លើងប្រចាំខែ', 'Enter Monthly Meters'),
                    desc: tr('បញ្ចូលលេខកុងទ័រថ្មី និងគណនាស្វ័យប្រវត្តិ', 'Record water & electricity readings')
                  },
                  {
                    key: 'canModifyPrices' as keyof ManagerPermissions,
                    title: tr('សិទ្ធិកែតម្លៃបន្ទប់/ប្រាក់កក់', 'Modify Room Prices & Deposit'),
                    desc: tr(
                      'បើបិទ អ្នកគ្រប់គ្រងមិនអាចកែតម្លៃបន្ទប់ ឬទឹកភ្លើងបានទេ',
                      'When locked, manager cannot alter rent or utility rates'
                    )
                  }
                ].map(item => {
                  const enabled = targetMgr.permissions[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleOwnerTogglePermissionFlag(targetMgr.id, item.key)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        enabled
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                          : 'bg-stone-100 border-stone-300 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">{item.title}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            enabled ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
                          }`}
                        >
                          {enabled ? 'ON' : 'LOCKED'}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-stone-700">
                    {tr(
                      `បន្ទប់ដែលបានប្រគល់សិទ្ធិឱ្យ ${targetMgr.fullName} គ្រប់គ្រង (RM-01 .. RM-17):`,
                      `Assigned Rooms for ${targetMgr.fullName} (RM-01 .. RM-17):`
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setManagerAccounts(prev => {
                        const updated = prev.map(m =>
                          m.id === targetMgr.id ? { ...m, assignedRooms: [...ALL_STANDARD_ROOMS] } : m
                        );
                        localStorage.setItem('hsn_manager_accounts', JSON.stringify(updated));
                        return updated;
                      });
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {tr('ជ្រើសរើសទាំងអស់', 'Select All Rooms')}
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2">
                  {ALL_STANDARD_ROOMS.map(rNo => {
                    const isAssigned = targetMgr.assignedRooms.includes(rNo);
                    return (
                      <button
                        key={`perm-room-${rNo}`}
                        type="button"
                        onClick={() => handleOwnerToggleRoomForManager(targetMgr.id, rNo)}
                        className={`py-2 px-2.5 rounded-xl font-mono text-xs font-black border-2 cursor-pointer transition-all flex items-center justify-center gap-1 ${
                          isAssigned
                            ? 'bg-emerald-700 text-white border-emerald-500 shadow-xs'
                            : 'bg-stone-100 text-stone-400 border-stone-300'
                        }`}
                      >
                        <span>{formatRoomCode(rNo)}</span>
                        {isAssigned && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Full Audit Log Table */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-700" />
                    <span>{tr('ប្រវត្តិបញ្ចូលទិន្នន័យ និងត្រួតពិនិត្យ (Audit Log)', 'System Audit Log & Activity History')}</span>
                  </h3>
                </div>
                <select
                  value={auditFilterRoom}
                  onChange={e => setAuditFilterRoom(e.target.value)}
                  className="bg-stone-100 border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                >
                  <option value="ALL">{tr('គ្រប់បន្ទប់ទាំងអស់', 'All Rooms')}</option>
                  {ALL_STANDARD_ROOMS.map(r => (
                    <option key={`audit-f-${r}`} value={r}>
                      {formatRoomCode(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-emerald-950 text-white uppercase text-[11px]">
                      <th className="p-2.5 rounded-tl-lg">{tr('ម៉ោង', 'Timestamp')}</th>
                      <th className="p-2.5">{tr('អ្នកបញ្ចូល', 'Actor')}</th>
                      <th className="p-2.5">{tr('បន្ទប់ & ភ្ញៀវ', 'Room & Tenant')}</th>
                      <th className="p-2.5">{tr('ភ្លើង (មុន ➔ ក្រោយ)', 'Elec (Before ➔ After)')}</th>
                      <th className="p-2.5">{tr('ទឹក (មុន ➔ ក្រោយ)', 'Water (Before ➔ After)')}</th>
                      <th className="p-2.5">{tr('តម្លៃ (មុន ➔ ក្រោយ)', 'Value (Before ➔ After)')}</th>
                      <th className="p-2.5 rounded-tr-lg">{tr('ស្ថានភាព / សម្គាល់', 'Status / Notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {auditLogs
                      .filter(l => auditFilterRoom === 'ALL' || normalizeRoom(l.roomNo) === auditFilterRoom)
                      .map(log => (
                        <tr key={log.id} className="hover:bg-stone-50">
                          <td className="p-2.5 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-900">{log.actorName}</td>
                          <td className="p-2.5">
                            <span className="font-mono font-black text-emerald-800">
                              {log.roomNo.includes('ALL') ? 'ALL' : formatRoomCode(log.roomNo)}
                            </span>{' '}
                            • <span className="font-bold">{log.tenantName}</span>
                            <div className="text-[10px] font-mono text-stone-500">ID: {log.tenantId}</div>
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">
                            {log.elecBefore ? `${log.elecBefore} ➔ ${log.elecAfter}` : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">
                            {log.waterBefore ? `${log.waterBefore} ➔ ${log.waterAfter}` : '—'}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-stone-800">
                            {log.valueBefore || log.beforeData} ➔{' '}
                            <span className="text-emerald-700">{log.valueAfter || log.afterData}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-black uppercase text-emerald-800">[{log.status}]</span>
                            {(log.notes || log.note) && (
                              <div className="text-[11px] text-stone-600 mt-0.5">{log.notes || log.note}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER NGUON SOPHEAK DEDICATED MANAGEMENT DASHBOARD
  // ============================================================================
  return (
    <div className="p-4 sm:p-6 bg-stone-100 min-h-[760px] font-sans text-stone-800 space-y-5">
      {/* Top Dashboard Identity Banner */}
      <div className="bg-gradient-to-r from-[#062819] via-emerald-900 to-[#0a3823] text-white rounded-2xl p-5 border-2 border-emerald-400/60 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-amber-300 flex flex-col items-center justify-center shrink-0 shadow-md">
              <UserCheck className="w-6 h-6 text-amber-300" />
              <span className="text-[9px] font-black uppercase text-white mt-0.5">MANAGER</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                  HSN RENTAL MANAGER • HENG SAMNANG
                </span>
                <span className="text-white/50">·</span>
                <span className="text-xs font-bold text-emerald-200 flex items-center gap-1">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{tr('តភ្ជាប់ប្រព័ន្ធមេ HSN (Online & Synced)', 'Connected to HSN Master DB (Synced)')}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>{tr('ដាច់អ៊ីនធឺណិត • រក្សាទុកក្នុងឧបករណ៍', 'Offline Mode • Saved Locally')}</span>
                    </>
                  )}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-normal font-moul text-white mt-1 leading-normal">
                {tr('ងួន សុភ័ក្រ – ផ្ទាំងគ្រប់គ្រងការងារ', 'Nguon Sopheak – Management Dashboard')}
              </h2>
              <p className="text-xs sm:text-sm font-extrabold text-emerald-100">
                {tr(
                  `${effectiveManager.fullName} (${effectiveManager.khmerName}) • គណនីអ្នកគ្រប់គ្រងបន្ទប់ជួល`,
                  `${effectiveManager.fullName} (${effectiveManager.khmerName}) • Dedicated Room Manager Portal`
                )}
              </p>
            </div>
          </div>

          {/* Right Controls: Month Picker, Language Toggle with Icon, Clear Data Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold text-emerald-200">{tr('ខែ៖', 'Month:')}</span>
              {renderCustomMonthYearSelect(
                selectedMonthYear,
                nextVal => {
                  setSelectedMonthYear(nextVal);
                  setMeterMonth(nextVal);
                },
                true
              )}
            </div>

            {renderLanguageToggleButton()}

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMeterElecNew('');
                setMeterWaterNew('');
                setMeterNotes('');
                showNotice(
                  'success',
                  'បានសម្អាតប្រអប់ស្វែងរក និងទម្រង់បញ្ចូល!',
                  'Cleared search filter and input fields.'
                );
              }}
              className="px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-white/30 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>{tr('សម្អាតទិន្នន័យបញ្ចូល', 'Clear Input Fields')}</span>
            </button>
          </div>
        </div>

        {/* 4 Transaction & Room Management KPI Stat Cards (All 16 Rooms RM-01 to RM-16) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="bg-emerald-950/85 border border-emerald-500/40 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-emerald-300">
              {tr('១. បន្ទប់សរុបទាំងអស់', '1. Total Assigned Rooms')}
            </div>
            <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
              16 {tr('បន្ទប់', 'Rooms')}
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-0.5">
              RM-01 ➔ RM-16 ({dashboardStats.totalAssignedRooms} {tr('បន្ទប់', 'Rooms')})
            </div>
          </div>

          <div className="bg-emerald-950/85 border border-emerald-500/40 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-emerald-300">
              {tr('២. អតិថិជនបច្ចុប្បន្ន (ក្នុង ១៦ បន្ទប់)', '2. Active Tenants (of 16 Rooms)')}
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono tabular-nums mt-1">
              {dashboardStats.activeTenantsCount} / 16 {tr('បន្ទប់', 'Rooms')}
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-0.5">
              {tr('បន្ទប់ទំនេរ៖', 'Vacant Rooms:')}{' '}
              {Math.max(0, 16 - dashboardStats.activeTenantsCount)} {tr('បន្ទប់', 'Rooms')}
            </div>
          </div>

          <div className="bg-emerald-950/85 border border-emerald-500/40 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-emerald-300">
              {tr('៣. បានកត់ត្រាទឹក-ភ្លើងខែនេះ', '3. Utility Records Entered')}
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
              {dashboardStats.enteredThisMonthCount} / 16 {tr('បន្ទប់', 'Rooms')}
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-0.5">
              {tr('ខែ', 'Month')} {selectedMonthYear}
            </div>
          </div>

          <div className="bg-emerald-950/85 border border-amber-400/50 rounded-xl p-3.5">
            <div className="text-[11px] font-bold text-amber-300">
              {tr('៤. បន្ទប់មិនទាន់បញ្ចូលខែនេះ', '4. Pending Meter Reading')}
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono tabular-nums mt-1">
              {dashboardStats.pendingRoomsCount} / 16 {tr('បន្ទប់', 'Rooms')}
            </div>
            <div className="text-[11px] text-amber-200/90 truncate mt-0.5">
              {dashboardStats.pendingRooms.length > 0
                ? dashboardStats.pendingRooms.map(p => formatRoomCode(p.roomNo)).join(', ')
                : tr('បានបញ្ចូលគ្រប់បន្ទប់ ✓', 'All Rooms Entered ✓')}
            </div>
          </div>
        </div>
      </div>

      {/* Bilingual Feedback Notification Banner */}
      {bannerNotice && (
        <div
          className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 shadow-lg ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-400'
              : bannerNotice.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-300'
              : 'bg-red-900 text-white border-red-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {bannerNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">{lang === 'km' ? bannerNotice.km : bannerNotice.en}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Modules of Nguon Sopheak Management Dashboard */}
      <div className="bg-stone-900 p-2 rounded-2xl border border-emerald-600/50 flex items-center gap-1.5 overflow-x-auto">
        {[
          {
            id: 'assignedRooms',
            label: tr('១. បន្ទប់ទាំង ១៦', '1. Assigned Rooms (16)'),
            sub: tr('បញ្ជីបន្ទប់ • ភ្ញៀវថ្មី • កែភ្ញៀវចាស់', 'Rooms • New & Existing Tenants'),
            icon: Home,
            showForManager: true
          },
          {
            id: 'newTenant',
            label: tr('២. បញ្ចូលភ្ញៀវថ្មី', '2. Enter New Tenant'),
            sub: tr('ចុះឈ្មោះភ្ញៀវជួលថ្មី', 'Register New Tenant'),
            icon: Plus,
            showForManager: true
          },
          {
            id: 'currentTenants',
            label: tr('៣. កែសម្រួលភ្ញៀវចាស់', '3. Edit Existing Tenants'),
            sub: tr('ស្វែងរក & កែប្រែព័ត៌មានភ្ញៀវចាស់', 'Search & Edit Existing Tenants'),
            icon: Users,
            showForManager: true
          },
          {
            id: 'elecMeter',
            label: tr('៤. កត់ត្រាលេខភ្លើង', '4. Electricity Meter'),
            sub: tr('បញ្ចូលលេខកុងទ័រភ្លើងប្រចាំខែ', 'Monthly Electricity Readings'),
            icon: Zap,
            showForManager: true
          },
          {
            id: 'waterMeter',
            label: tr('៥. កត់ត្រាលេខទឹក', '5. Water Meter'),
            sub: tr('បញ្ចូលលេខកុងទ័រទឹកប្រចាំខែ', 'Monthly Water Readings'),
            icon: Droplets,
            showForManager: true
          },
          {
            id: 'entryHistory',
            label: tr('៦. ប្រវត្តិកត់ត្រា & ចំណូល', '6. Entry History & Revenue'),
            sub: tr('សម្រាប់ម្ចាស់ផ្ទះត្រួតពិនិត្យប៉ុណ្ណោះ', 'Owner Audit & Revenue Only'),
            icon: History,
            showForManager: false
          }
        ]
          .filter(tab => resolvedRole === 'owner' || tab.showForManager)
          .map(tab => {
            const IconComp = tab.icon;
            const active = sopheakTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSopheakTab(tab.id as any)}
                className={`px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer shrink-0 flex items-center gap-2 border ${
                  active
                    ? 'bg-emerald-600 text-white border-white font-black shadow-md'
                    : 'bg-stone-800/90 text-stone-200 border-stone-700 hover:bg-emerald-900/60'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold whitespace-nowrap">{tab.label}</div>
                  <div className="text-[10px] opacity-90 whitespace-nowrap">{tab.sub}</div>
                </div>
              </button>
            );
          })}
      </div>

      {/* Global Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={tr(
              'ស្វែងរកតាមលេខបន្ទប់ (RM-05), ឈ្មោះភ្ញៀវ, លេខទូរស័ព្ទ ឬ ID...',
              'Search by room number (RM-05), tenant name, phone, or ID...'
            )}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-emerald-600"
          />
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
          >
            {tr('សម្អាតការស្វែងរក', 'Clear Search')}
          </button>
        )}
      </div>

      {/* =====================================================================
          MODULE 1: បន្ទប់ដែលបានកំណត់ / Assigned Rooms
         ===================================================================== */}
      {sopheakTab === 'assignedRooms' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                {tr(
                  'បញ្ជីបន្ទប់ដែលបានប្រគល់សិទ្ធិគ្រប់គ្រង (ប្តូរភ្ញៀវថ្មី តែរក្សាចំណូលបូកបន្ត)',
                  'Assigned Rooms Directory (Change Tenant while Preserving Cumulative Revenue)'
                )}
              </h3>
              <p className="text-xs text-stone-500">
                {tr(
                  'នៅពេលភ្ញៀវចាស់ឈប់ជួល សូមចុច "លុបភ្ញៀវឈប់ជួល (រក្សាចំណូល)" ឬចុច "ប្តូរភ្ញៀវថ្មី" នោះចំណូលខែមុនៗនឹងនៅតែរក្សាទុកបូកបន្តជានិច្ច។',
                  'When a tenant moves out, click "Clear Vacated Tenant (Keep Revenue)" or "Replace Tenant" — all previous monthly revenues remain saved and accumulate.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {effectiveManager.assignedRooms.map(rNo => {
              const cleanR = normalizeRoom(rNo);
              const tenant = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
              const monthRec = history.find(
                h => normalizeRoom(h.roomNo) === cleanR && h.paymentDate.startsWith(selectedMonthYear)
              );
              const cumRevenue = roomCumulativeRevenueMap[cleanR] || 0;

              if (
                searchQuery.trim() &&
                !formatRoomCode(cleanR).toLowerCase().includes(searchQuery.toLowerCase()) &&
                !(tenant?.tenantName || '').toLowerCase().includes(searchQuery.toLowerCase())
              ) {
                return null;
              }

              return (
                <div
                  key={`assigned-card-${cleanR}`}
                  className={`rounded-xl border-2 p-4 flex flex-col justify-between gap-3 transition-all ${
                    tenant
                      ? 'bg-white border-emerald-600/40 shadow-xs'
                      : 'bg-stone-50 border-dashed border-stone-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="font-mono font-black text-sm bg-emerald-900 text-white px-2.5 py-1 rounded-lg">
                        {formatRoomCode(cleanR)}
                      </span>
                      {tenant ? (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            monthRec
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {monthRec
                            ? tr('✓ បានកត់ត្រាខែនេះ', '✓ Entered This Month')
                            : tr('⏳ មិនទាន់កត់ត្រាទឹកភ្លើង', '⏳ Pending Meter')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-stone-200 text-stone-700 px-2 py-0.5 rounded">
                          {tr('បន្ទប់ទំនេរ', 'Vacant Room')}
                        </span>
                      )}
                    </div>

                    {/* Cumulative Landlord Revenue Badge — visible ONLY to Owner (Admin), hidden for Manager */}
                    {resolvedRole === 'owner' && (
                      <div className="mt-2 bg-emerald-50/90 border border-emerald-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{tr('ចំណូលបូកបន្តសរុប៖', 'Cumulative Revenue:')}</span>
                        </span>
                        <span className="font-mono font-black text-emerald-800">${cumRevenue.toFixed(2)}</span>
                      </div>
                    )}

                    {tenant ? (
                      <div className="mt-2.5 space-y-1 text-xs">
                        {resolvedRole === 'owner' ? (
                          <>
                            <div className="font-moul text-sm text-blue-950">{tenant.tenantName}</div>
                            <div className="text-stone-600 font-mono">
                              Tel: {tenant.tenantPhone || '—'} • ${tenant.roomPrice}/{tr('ខែ', 'mo')}
                            </div>
                          </>
                        ) : (
                          <div className="font-extrabold text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                            <span>{tr('បន្ទប់ភ្ញៀវជួល៖', 'Tenant Room:')}</span>
                            <span className="font-mono font-black text-sm">{formatRoomCode(cleanR)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 font-mono text-[11px]">
                          <span className="text-amber-800 font-bold">
                            ⚡ {tr('ភ្លើងចាស់៖', 'Old Elec:')} {tenant.elecOld || '0'} kWh
                          </span>
                          <span className="text-cyan-800 font-bold">
                            💧 {tr('ទឹកចាស់៖', 'Old Water:')} {tenant.waterOld || '0'} m³
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-500 mt-2.5">
                        {tr(
                          'បន្ទប់ទំនេរ (ចំណូលខែមុនៗត្រូវបានរក្សាទុកបូកបន្ត)។ អាចបញ្ចូលភ្ញៀវថ្មីបានភ្លាម។',
                          'Room is vacant (all previous monthly revenues are preserved). Ready for new tenant check-in.'
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-stone-100">
                    {tenant ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMeterRoomNo(cleanR);
                              setSopheakTab('elecMeter');
                            }}
                            className="flex-1 py-2 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-lg cursor-pointer text-center"
                          >
                            ⚡💧 {tr('កត់ត្រាទឹក-ភ្លើង', 'Enter Meters')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoomNo(cleanR);
                              setSopheakTab('currentTenants');
                            }}
                            className="py-2 px-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            {tr('កែប្រែ', 'Edit')}
                          </button>
                        </div>

                        {/* Clear Vacated Tenant & Keep Cumulative Revenue OR Replace with New Tenant */}
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVacateTenantKeepRevenue(tenant)}
                            className="py-1.5 px-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 text-[11px] font-extrabold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                            title={tr(
                              'លុបភ្ញៀវចាស់ ប៉ុន្តែរក្សាទុកចំណូលរបស់ម្ចាស់ផ្ទះបូកបន្តពេលមានភ្ញៀវថ្មីចូលជួល',
                              'Delete old tenant while keeping landlord cumulative revenue when a new tenant rents'
                            )}
                          >
                            <UserMinus className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{tr('លុបភ្ញៀវចាស់', 'Delete Old Tenant')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setNewTenantForm(prev => ({
                                ...prev,
                                roomNo: cleanR,
                                replaceExistingKeepRevenue: true
                              }));
                              setSopheakTab('newTenant');
                            }}
                            className="py-1.5 px-2 bg-amber-100 hover:bg-amber-500 text-amber-950 border border-amber-300 text-[11px] font-extrabold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors"
                            title={tr(
                              'ប្តូរភ្ញៀវថ្មីចូលបន្ទប់នេះ ហើយបូកបន្តចំណូល',
                              'Replace with new tenant and continue accumulating revenue'
                            )}
                          >
                            <RefreshCw className="w-3 h-3 shrink-0" />
                            <span className="truncate">{tr('ប្តូរភ្ញៀវថ្មី', 'Change Tenant')}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTenantForm(prev => ({ ...prev, roomNo: cleanR }));
                          setSopheakTab('newTenant');
                        }}
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-lg cursor-pointer"
                      >
                        + {tr(`បញ្ចូលភ្ញៀវថ្មីចូល ${formatRoomCode(cleanR)}`, `Add New Tenant to ${formatRoomCode(cleanR)}`)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 2: អតិថិជនថ្មី / New Tenant Registration (with Cumulative Revenue Preservation)
         ===================================================================== */}
      {sopheakTab === 'newTenant' && (
        <form
          onSubmit={handleManagerAddNewTenant}
          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-emerald-950">
                {tr(
                  'បញ្ចូលភ្ញៀវជួលថ្មី ឬប្តូរភ្ញៀវថ្មី (រក្សាទុកចំណូលខែមុនៗបូកបន្ត)',
                  'Register New Tenant or Replace Vacated Tenant (Cumulative Revenue Preserved)'
                )}
              </h3>
              <p className="text-xs text-stone-500">
                {tr(
                  'នៅពេលប្តូរភ្ញៀវថ្មីចូលបន្ទប់ ព័ត៌មានភ្ញៀវចាស់ដែលឈប់ជួលនឹងត្រូវលុបចេញ ប៉ុន្តែទិន្នន័យចំណូលគ្រប់ខែរបស់ម្ចាស់ផ្ទះនៅតែរក្សាទុក និងបូកបន្ត។',
                  'When registering a new tenant into a room, the vacated tenant profile is cleared while 100% of past monthly revenues remain saved and accumulate for the landlord.'
                )}
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg shrink-0">
              {tr('អ្នកបញ្ចូល៖', 'Recorded by:')} {effectiveManager.fullName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('លេខបន្ទប់ (1 - 16) *', 'Room Number (1 - 16) *')}
              </label>
              <select
                value={newTenantForm.roomNo}
                onChange={e => setNewTenantForm({ ...newTenantForm, roomNo: e.target.value })}
                className="w-full bg-stone-50 border-2 border-emerald-600/60 rounded-xl p-2.5 font-mono font-black text-sm text-stone-900"
              >
                {effectiveManager.assignedRooms.map(r => {
                  const occ = savedTenants.find(t => normalizeRoom(t.roomNo) === normalizeRoom(r));
                  return (
                    <option key={`new-r-${r}`} value={r}>
                      {formatRoomCode(r)}{' '}
                      {occ
                        ? resolvedRole === 'owner'
                          ? tr(`(មានភ្ញៀវ: ${occ.tenantName})`, `(Occupied: ${occ.tenantName})`)
                          : tr('(មានភ្ញៀវជួល / Occupied)', '(Occupied)')
                        : tr('— ទំនេរ (Vacant)', '— Vacant')}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('ឈ្មោះពេញភ្ញៀវជួលថ្មី *', 'New Tenant Full Name *')}
              </label>
              <input
                type="text"
                required
                placeholder={tr('ឧ. សុខ សម្បត្តិ', 'e.g. Sok Sambath')}
                value={newTenantForm.tenantName}
                onChange={e => setNewTenantForm({ ...newTenantForm, tenantName: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold"
              />
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('លេខសម្គាល់ ID (Tenant ID) *', 'Tenant ID Number *')}
              </label>
              <input
                type="text"
                placeholder={`${tr('ស្វ័យប្រវត្តិ៖', 'Auto:')} ${formatStableTenantId(newTenantForm.roomNo)}`}
                value={newTenantForm.tenantIdNo}
                onChange={e => setNewTenantForm({ ...newTenantForm, tenantIdNo: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('លេខទូរស័ព្ទ (Phone) *', 'Phone Number *')}
              </label>
              <input
                type="text"
                required
                placeholder="096 879 3531"
                value={newTenantForm.tenantPhone}
                onChange={e => setNewTenantForm({ ...newTenantForm, tenantPhone: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('ថ្លៃជួលប្រចាំខែ ($) *', 'Monthly Rent ($) *')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={newTenantForm.roomPrice}
                onChange={e => setNewTenantForm({ ...newTenantForm, roomPrice: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-black font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('ប្រាក់កក់ (Deposit $)', 'Security Deposit ($)')}
              </label>
              <input
                type="number"
                step="any"
                value={newTenantForm.deposit}
                onChange={e => setNewTenantForm({ ...newTenantForm, deposit: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-black font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('ថ្ងៃចូលស្នាក់នៅដំបូង (YYYY-MM-DD) *', 'Check-In Date (YYYY-MM-DD) *')}
              </label>
              <input
                type="text"
                required
                placeholder="YYYY-MM-DD"
                value={newTenantForm.checkInDate}
                onChange={e => setNewTenantForm({ ...newTenantForm, checkInDate: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-stone-700 mb-1">
                {tr('ថ្លៃវ៉ាយហ្វាយ (Wi-Fi $/ខែ)', 'Wi-Fi Fee ($/month)')}
              </label>
              <input
                type="number"
                step="any"
                value={newTenantForm.wifiPrice}
                onChange={e => setNewTenantForm({ ...newTenantForm, wifiPrice: e.target.value })}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-amber-900 mb-1">
                ⚡ {tr('លេខភ្លើងចាស់ (kWh) *', 'Old Electricity Reading (kWh) *')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={newTenantForm.elecOld}
                onChange={e => setNewTenantForm({ ...newTenantForm, elecOld: e.target.value })}
                className="w-full bg-amber-50/70 border border-amber-300 rounded-xl p-2.5 font-black font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-amber-900 mb-1">
                ⚡ {tr('លេខភ្លើងថ្មី (បើមាន)', 'New Electricity Reading (Optional)')}
              </label>
              <input
                type="number"
                step="any"
                placeholder={tr('ទុកទំនេរប្រសិនបើទើបចូលនៅ', 'Leave blank if just moved in')}
                value={newTenantForm.elecNew}
                onChange={e => setNewTenantForm({ ...newTenantForm, elecNew: e.target.value })}
                className="w-full bg-amber-50/40 border border-amber-300 rounded-xl p-2.5 font-black font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-cyan-900 mb-1">
                💧 {tr('លេខទឹកចាស់ (m³) *', 'Old Water Reading (m³) *')}
              </label>
              <input
                type="number"
                step="any"
                required
                value={newTenantForm.waterOld}
                onChange={e => setNewTenantForm({ ...newTenantForm, waterOld: e.target.value })}
                className="w-full bg-cyan-50/70 border border-cyan-300 rounded-xl p-2.5 font-black font-mono"
              />
            </div>

            <div>
              <label className="block font-extrabold text-cyan-900 mb-1">
                💧 {tr('លេខទឹកថ្មី (បើមាន)', 'New Water Reading (Optional)')}
              </label>
              <input
                type="number"
                step="any"
                placeholder={tr('ទុកទំនេរប្រសិនបើទើបចូលនៅ', 'Leave blank if just moved in')}
                value={newTenantForm.waterNew}
                onChange={e => setNewTenantForm({ ...newTenantForm, waterNew: e.target.value })}
                className="w-full bg-cyan-50/40 border border-cyan-300 rounded-xl p-2.5 font-black font-mono"
              />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-xs font-extrabold text-emerald-950 cursor-pointer">
              <input
                type="checkbox"
                checked={newTenantForm.replaceExistingKeepRevenue}
                onChange={e =>
                  setNewTenantForm({ ...newTenantForm, replaceExistingKeepRevenue: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>
                {tr(
                  'បើបន្ទប់មានភ្ញៀវចាស់ឈប់ជួល៖ លុបឈ្មោះភ្ញៀវចាស់ ហើយប្តូរដាក់ភ្ញៀវថ្មីដោយរក្សាទុកចំណូលខែមុនៗបូកបន្ត 100%',
                  'If room has a vacated tenant: Clear old tenant info and replace with new tenant while keeping 100% of cumulative monthly revenue'
                )}
              </span>
            </label>
            {resolvedRole === 'owner' && (
              <span className="font-mono text-xs font-black text-emerald-800 shrink-0">
                {tr('ចំណូលបន្ទប់នេះ៖', 'Room Cumulative:')} $
                {(roomCumulativeRevenueMap[normalizeRoom(newTenantForm.roomNo)] || 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="text-xs">
            <label className="block font-extrabold text-stone-700 mb-1">
              {tr('សម្គាល់ (Notes)', 'Notes')}
            </label>
            <input
              type="text"
              placeholder={tr('កំណត់ចំណាំបន្ថែមអំពីភ្ញៀវ ឬកិច្ចសន្យា...', 'Additional notes about tenant or lease...')}
              value={newTenantForm.notes}
              onChange={e => setNewTenantForm({ ...newTenantForm, notes: e.target.value })}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {tr(
                  'រក្សាទុកភ្ញៀវថ្មី & បូកបន្តចំណូលម្ចាស់ផ្ទះ',
                  'Save New Tenant & Accumulate Landlord Revenue'
                )}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* =====================================================================
          MODULE 3: អតិថិជនចាស់ / Current Tenants Search, Update & Vacate (Keep Revenue)
         ===================================================================== */}
      {sopheakTab === 'currentTenants' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-stone-900 border-b border-stone-200 pb-2.5">
              {tr(
                `បញ្ជីលេខបន្ទប់ភ្ញៀវកំពុងជួល (${filteredScopedTenants.length} បន្ទប់)`,
                `Occupied Tenant Room Numbers (${filteredScopedTenants.length} Rooms)`
              )}
            </h3>
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredScopedTenants.map(t => {
                const cleanR = normalizeRoom(t.roomNo);
                const isSelected = cleanR === normalizeRoom(editingRoomNo);
                const cumRev = roomCumulativeRevenueMap[cleanR] || 0;
                return (
                  <div
                    key={`cur-t-${t.roomNo}`}
                    onClick={() => setEditingRoomNo(t.roomNo)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600'
                        : 'bg-stone-50/70 border-stone-200 hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs bg-emerald-900 text-white px-2.5 py-1 rounded-lg">
                          {formatRoomCode(t.roomNo)}
                        </span>
                        {resolvedRole === 'owner' ? (
                          <span className="font-moul text-sm text-blue-950">{t.tenantName}</span>
                        ) : (
                          <span className="font-extrabold text-xs text-emerald-900">
                            {tr(`បន្ទប់ភ្ញៀវជួល ${formatRoomCode(t.roomNo)}`, `Tenant Room ${formatRoomCode(t.roomNo)}`)}
                          </span>
                        )}
                      </div>
                      {resolvedRole === 'owner' && (
                        <div className="text-xs text-stone-600 font-mono mt-1">
                          Tel: {t.tenantPhone || '—'} • {tr('ចំណូលបូកបន្ត៖', 'Cumulative Revenue:')}{' '}
                          <strong className="text-emerald-800">${cumRev.toFixed(2)}</strong>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right font-mono mr-2">
                        {resolvedRole === 'owner' && (
                          <div className="font-black text-sm text-emerald-800">
                            ${t.roomPrice}/{tr('ខែ', 'mo')}
                          </div>
                        )}
                        <div className="text-[11px] text-stone-500">
                          ⚡{t.elecOld} | 💧{t.waterOld}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={ev => {
                          ev.stopPropagation();
                          handleVacateTenantKeepRevenue(t);
                        }}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-extrabold rounded-lg cursor-pointer flex items-center gap-1"
                        title={tr(
                          'លុបព័ត៌មានភ្ញៀវចាស់ ប៉ុន្តែរក្សាទុកចំណូលម្ចាស់ផ្ទះបូកបន្តពេលមានភ្ញៀវថ្មីជួល',
                          'Delete old tenant info while keeping landlord cumulative revenue when a new tenant rents'
                        )}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        <span>{tr('លុបភ្ញៀវចាស់ (រក្សាចំណូល)', 'Delete Old Tenant')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5">
            <form
              onSubmit={handleManagerUpdateCurrentTenant}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    {tr(
                      `កែប្រែព័ត៌មានភ្ញៀវបន្ទប់ ${formatRoomCode(editingRoomNo)}`,
                      `Edit Tenant Information for ${formatRoomCode(editingRoomNo)}`
                    )}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700">
                      {lastSystemAutoSync
                        ? tr(
                            `ប្រព័ន្ធបានធ្វើបច្ចុប្បន្នភាពស្វ័យប្រវត្តិ (${lastSystemAutoSync})`,
                            `System auto-updated (${lastSystemAutoSync})`
                          )
                        : tr(
                            'ប្រព័ន្ធធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិពេលកែប្រែ',
                            'System automatically updates on edit'
                          )}
                    </span>
                  </div>
                </div>
                {resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices && (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> {tr('ចាក់សោតម្លៃ', 'Price Locked')}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {tr('ជ្រើសរើសលេខបន្ទប់ (ទាំង ១៦ បន្ទប់)', 'Select Room Number (All 16 Rooms)')}
                  </label>
                  <select
                    value={editingRoomNo}
                    onChange={e => setEditingRoomNo(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono font-black"
                  >
                    {effectiveManager.assignedRooms.map(rNo => {
                      const cleanR = normalizeRoom(rNo);
                      const occ = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
                      return (
                        <option key={`edit-sel-${cleanR}`} value={cleanR}>
                          {formatRoomCode(cleanR)} —{' '}
                          {occ
                            ? resolvedRole === 'owner'
                              ? occ.tenantName
                              : tr('មានភ្ញៀវជួល (Occupied)', 'Occupied')
                            : tr('បន្ទប់ទំនេរ', 'Vacant Room')}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {tr('ឈ្មោះភ្ញៀវជួល (ប្រព័ន្ធធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិ) *', 'Tenant Name (System Auto-Updates) *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tr('បញ្ចូលឈ្មោះភ្ញៀវជួល...', 'Enter tenant full name...')}
                    value={editTenantForm.tenantName}
                    onChange={e => setEditTenantForm({ ...editTenantForm, tenantName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold focus:border-emerald-600 focus:bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('លេខសម្គាល់ ID', 'Tenant ID')}
                    </label>
                    <input
                      type="text"
                      value={editTenantForm.tenantIdNo}
                      onChange={e => setEditTenantForm({ ...editTenantForm, tenantIdNo: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono font-bold focus:border-emerald-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('លេខទូរស័ព្ទ', 'Phone Number')}
                    </label>
                    <input
                      type="text"
                      value={editTenantForm.tenantPhone}
                      onChange={e => setEditTenantForm({ ...editTenantForm, tenantPhone: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono font-bold focus:border-emerald-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ថ្ងៃចូលស្នាក់នៅ', 'Check-in Date')}
                    </label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={editTenantForm.checkInDate}
                      onChange={e => setEditTenantForm({ ...editTenantForm, checkInDate: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono font-bold focus:border-emerald-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      ⚡ {tr('ភ្លើងចាស់ (kWh)', 'Old Elec')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editTenantForm.elecOld}
                      onChange={e => setEditTenantForm({ ...editTenantForm, elecOld: e.target.value })}
                      className="w-full bg-amber-50/70 border border-amber-300 rounded-xl p-2.5 font-mono font-black focus:border-amber-600 focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-cyan-900 mb-1">
                      💧 {tr('ទឹកចាស់ (m³)', 'Old Water')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editTenantForm.waterOld}
                      onChange={e => setEditTenantForm({ ...editTenantForm, waterOld: e.target.value })}
                      className="w-full bg-cyan-50/70 border border-cyan-300 rounded-xl p-2.5 font-mono font-black focus:border-cyan-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ថ្លៃបន្ទប់ ($/ខែ)', 'Monthly Rent ($)')}{' '}
                      {resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices && '🔒'}
                    </label>
                    <input
                      type="number"
                      disabled={resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices}
                      value={editTenantForm.roomPrice}
                      onChange={e => setEditTenantForm({ ...editTenantForm, roomPrice: Number(e.target.value) })}
                      className="w-full bg-stone-100 disabled:opacity-70 border border-stone-300 rounded-xl p-2.5 font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('ប្រាក់កក់ ($)', 'Deposit ($)')}{' '}
                      {resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices && '🔒'}
                    </label>
                    <input
                      type="number"
                      disabled={resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices}
                      value={editTenantForm.deposit}
                      onChange={e => setEditTenantForm({ ...editTenantForm, deposit: Number(e.target.value) })}
                      className="w-full bg-stone-100 disabled:opacity-70 border border-stone-300 rounded-xl p-2.5 font-mono font-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">{tr('សម្គាល់', 'Notes')}</label>
                  <input
                    type="text"
                    value={editTenantForm.notes}
                    onChange={e => setEditTenantForm({ ...editTenantForm, notes: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl shadow cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      {tr(
                        'ធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធឥឡូវនេះ (រក្សាចំណូលបូកបន្ត)',
                        'Update System Now (Keep Cumulative Revenue)'
                      )}
                    </span>
                  </button>

                  {(() => {
                    const currentEditingTenant = savedTenants.find(
                      t => normalizeRoom(t.roomNo) === normalizeRoom(editingRoomNo)
                    );
                    if (!currentEditingTenant) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => handleVacateTenantKeepRevenue(currentEditingTenant)}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserMinus className="w-4 h-4" />
                        <span>
                          {tr(
                            `លុបភ្ញៀវចាស់បន្ទប់ ${formatRoomCode(editingRoomNo)} (រក្សាទុកចំណូលម្ចាស់ផ្ទះបូកបន្ត)`,
                            `Delete Old Tenant ${formatRoomCode(editingRoomNo)} (Keep Landlord Cumulative Revenue)`
                          )}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULES 4 & 5: កត់ត្រាលេខទឹក & កត់ត្រាលេខភ្លើង (Water & Electricity Meters)
         ===================================================================== */}
      {(sopheakTab === 'waterMeter' || sopheakTab === 'elecMeter') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveMonthlyMeterReadings}
            className="lg:col-span-8 bg-white rounded-2xl border-2 border-emerald-600/40 p-5 shadow-md space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950 flex items-center gap-2">
                  {sopheakTab === 'waterMeter' ? (
                    <Droplets className="w-5 h-5 text-cyan-600" />
                  ) : (
                    <Zap className="w-5 h-5 text-amber-500" />
                  )}
                  <span>
                    {sopheakTab === 'waterMeter'
                      ? tr('កត់ត្រាលេខកុងទ័រទឹក និងភ្លើងប្រចាំខែ', 'Monthly Water & Electricity Meter Recording')
                      : tr('កត់ត្រាលេខកុងទ័រភ្លើង និងទឹកប្រចាំខែ', 'Monthly Electricity & Water Meter Recording')}
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {tr(
                    'ជ្រើសរើសបន្ទប់ ➔ ប្រព័ន្ធទាញយកឈ្មោះភ្ញៀវបច្ចុប្បន្ន និងលេខកុងទ័រខែមុនដោយស្វ័យប្រវត្តិ។',
                    'Select a room ➔ System automatically loads current tenant and previous month meter readings.'
                  )}
                </p>
              </div>
              <span className="text-xs font-mono font-black bg-emerald-950 text-amber-300 px-3 py-1.5 rounded-xl">
                {tr('ខែ៖', 'Month:')} {meterMonth}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <div>
                <label className="block text-xs font-extrabold text-emerald-950 mb-1">
                  {tr('១. ជ្រើសរើសលេខបន្ទប់ (១៦ បន្ទប់) *', '1. Select Room (16 Rooms) *')}
                </label>
                <select
                  value={meterRoomNo}
                  onChange={e => setMeterRoomNo(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-600 rounded-xl p-2.5 text-sm font-mono font-black text-stone-900 cursor-pointer"
                >
                  {effectiveManager.assignedRooms.map(rNo => {
                    const cleanR = normalizeRoom(rNo);
                    const occ = savedTenants.find(t => normalizeRoom(t.roomNo) === cleanR);
                    return (
                      <option key={`meter-room-${cleanR}`} value={cleanR}>
                        {formatRoomCode(cleanR)} —{' '}
                        {occ
                          ? resolvedRole === 'owner'
                            ? occ.tenantName
                            : tr('មានភ្ញៀវជួល (Occupied)', 'Occupied')
                          : tr('បន្ទប់ទំនេរ', 'Vacant Room')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 mb-1">
                  {tr('២. ស្ថានភាពបន្ទប់ជួល', '2. Room Status')}
                </label>
                <div className="bg-white border border-stone-300 rounded-xl p-2.5 text-sm font-extrabold text-blue-950 flex items-center justify-between">
                  <span>
                    {selectedMeterTenant
                      ? resolvedRole === 'owner'
                        ? `${formatRoomCode(meterRoomNo)} • ${selectedMeterTenant.tenantName}`
                        : `${formatRoomCode(meterRoomNo)} — ${tr('មានភ្ញៀវជួល', 'Occupied')}`
                      : tr('បន្ទប់ទំនេរ', 'Vacant Room')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-emerald-950 mb-1">
                  {tr('៣. ខែកត់ត្រា *', '3. Billing Month *')}
                </label>
                {renderCustomMonthYearSelect(
                  meterMonth,
                  nextVal => {
                    setMeterMonth(nextVal);
                    setSelectedMonthYear(nextVal);
                  },
                  false
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Electricity Box */}
              <div
                className={`rounded-2xl p-4 border-2 space-y-3 ${
                  sopheakTab === 'elecMeter'
                    ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-300/50'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-extrabold text-sm text-amber-950 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span>{tr('កុងទ័រភ្លើង (kWh)', 'Electricity Meter (kWh)')}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                    🔒 {elecRateRiel.toLocaleString()} ៛/kWh
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">
                      {tr('លេខភ្លើងខែមុន', 'Old Reading')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      readOnly={resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices}
                      value={meterElecOld}
                      onChange={e => setMeterElecOld(e.target.value)}
                      className="w-full bg-stone-100 border border-stone-300 rounded-xl p-2.5 font-mono font-black text-sm text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-amber-950 mb-1">
                      {tr('លេខភ្លើងខែថ្មី *', 'New Reading *')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder={`>= ${meterElecOld}`}
                      value={meterElecNew}
                      onChange={e => setMeterElecNew(e.target.value)}
                      className="w-full bg-white border-2 border-amber-500 rounded-xl p-2.5 font-mono font-black text-sm text-stone-950 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white/90 rounded-xl p-3 border border-amber-200 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans text-stone-600">{tr('ភ្លើងប្រើប្រាស់៖', 'Usage:')}</span>
                    <span className={`font-black ${liveElecConsumption < 0 ? 'text-red-600' : 'text-amber-900'}`}>
                      {meterElecNew ? `${liveElecConsumption} kWh` : '0 kWh'}
                    </span>
                  </div>
                  {resolvedRole === 'owner' && (
                    <div className="flex justify-between">
                      <span className="font-sans text-stone-600">{tr('ប្រាក់ភ្លើង៖', 'Electricity Cost:')}</span>
                      <span className="font-black text-emerald-800">
                        ៛{liveElecCostRiel.toLocaleString()} (~ ${liveElecCostUsd.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Water Box */}
              <div
                className={`rounded-2xl p-4 border-2 space-y-3 ${
                  sopheakTab === 'waterMeter'
                    ? 'bg-cyan-50/70 border-cyan-400 ring-2 ring-cyan-300/50'
                    : 'bg-cyan-50/40 border-cyan-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-cyan-200 pb-2">
                  <span className="font-extrabold text-sm text-cyan-950 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    <span>{tr('កុងទ័រទឹក (m³)', 'Water Meter (m³)')}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-900 bg-cyan-200/70 px-2 py-0.5 rounded">
                    🔒 {waterRateRiel.toLocaleString()} ៛/m³
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-600 mb-1">
                      {tr('លេខទឹកខែមុន', 'Old Reading')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      readOnly={resolvedRole === 'manager' && !effectiveManager.permissions.canModifyPrices}
                      value={meterWaterOld}
                      onChange={e => setMeterWaterOld(e.target.value)}
                      className="w-full bg-stone-100 border border-stone-300 rounded-xl p-2.5 font-mono font-black text-sm text-stone-700"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-cyan-950 mb-1">
                      {tr('លេខទឹកខែថ្មី *', 'New Reading *')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder={`>= ${meterWaterOld}`}
                      value={meterWaterNew}
                      onChange={e => setMeterWaterNew(e.target.value)}
                      className="w-full bg-white border-2 border-cyan-500 rounded-xl p-2.5 font-mono font-black text-sm text-stone-950 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-white/90 rounded-xl p-3 border border-cyan-200 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans text-stone-600">{tr('ទឹកប្រើប្រាស់៖', 'Usage:')}</span>
                    <span className={`font-black ${liveWaterConsumption < 0 ? 'text-red-600' : 'text-cyan-900'}`}>
                      {meterWaterNew ? `${liveWaterConsumption} m³` : '0 m³'}
                    </span>
                  </div>
                  {resolvedRole === 'owner' && (
                    <div className="flex justify-between">
                      <span className="font-sans text-stone-600">{tr('ប្រាក់ទឹក៖', 'Water Cost:')}</span>
                      <span className="font-black text-emerald-800">
                        ៛{liveWaterCostRiel.toLocaleString()} (~ ${liveWaterCostUsd.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(liveElecConsumption < 0 || liveWaterConsumption < 0 || confirmLowerReading) && (
              <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-extrabold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {tr(
                      '⚠️ ការព្រមាន៖ លេខកុងទ័រថ្មីទាបជាងលេខកុងទ័រចាស់!',
                      '⚠️ Warning: New meter reading is lower than previous reading!'
                    )}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={tr(
                    'បញ្ចូលមូលហេតុបញ្ជាក់ការកែតម្រូវ (ឧ. ប្តូរកុងទ័រថ្មី)...',
                    'Enter verification reason (e.g. meter replacement)...'
                  )}
                  value={lowerReadingReason}
                  onChange={e => setLowerReadingReason(e.target.value)}
                  className="w-full bg-white border border-red-400 rounded-lg p-2.5 font-bold text-stone-900"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-200">
              {resolvedRole === 'owner' ? (
                <div className="text-xs text-stone-600">
                  {tr('ថ្លៃបន្ទប់៖', 'Room Rent:')}{' '}
                  <strong className="font-mono">${selectedMeterTenant?.roomPrice || 80}</strong> +{' '}
                  {tr('ទឹកភ្លើង៖', 'Utilities:')}{' '}
                  <strong className="font-mono text-emerald-700">
                    ${(liveElecCostUsd + liveWaterCostUsd).toFixed(2)}
                  </strong>{' '}
                  = {tr('សរុបខែនេះ៖', 'Month Total:')}{' '}
                  <strong className="font-mono text-base font-black text-emerald-900">
                    $
                    {(
                      (selectedMeterTenant?.roomPrice || 80) +
                      (selectedMeterTenant?.wifiPrice || 0) +
                      liveElecCostUsd +
                      liveWaterCostUsd
                    ).toFixed(2)}
                  </strong>
                </div>
              ) : (
                <div className="text-xs font-bold text-emerald-900">
                  {tr(
                    `បន្ទប់ជ្រើសរើស៖ ${formatRoomCode(meterRoomNo)}`,
                    `Selected Room: ${formatRoomCode(meterRoomNo)}`
                  )}
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{tr('រក្សាទុកលេខទឹក-ភ្លើងចូលប្រព័ន្ធ HSN', 'Save Readings to HSN Database')}</span>
              </button>
            </div>
          </form>

          {/* Right Quick Room Selector */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold text-stone-800 uppercase border-b border-stone-200 pb-2">
              {tr(`ជ្រើសរើសលេខបន្ទប់ភ្ញៀវជួល (${scopedTenants.length} បន្ទប់)`, `Select Tenant Room Number (${scopedTenants.length} Rooms)`)}
            </h4>
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {scopedTenants.map(t => {
                const cleanR = normalizeRoom(t.roomNo);
                const hasMonthRec = history.some(
                  h => normalizeRoom(h.roomNo) === cleanR && h.paymentDate.startsWith(meterMonth)
                );
                const active = cleanR === normalizeRoom(meterRoomNo);
                return (
                  <button
                    key={`fast-meter-${cleanR}`}
                    type="button"
                    onClick={() => setMeterRoomNo(cleanR)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-emerald-900 text-white border-emerald-500 font-bold'
                        : 'bg-stone-50 hover:bg-emerald-50 text-stone-800 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-black/20">
                        {formatRoomCode(cleanR)}
                      </span>
                      <span className="font-sans font-bold text-xs truncate">
                        {resolvedRole === 'owner'
                          ? t.tenantName
                          : tr(`បន្ទប់ភ្ញៀវជួល ${formatRoomCode(cleanR)}`, `Tenant Room ${formatRoomCode(cleanR)}`)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${
                        hasMonthRec ? 'bg-emerald-500 text-stone-950' : 'bg-amber-300 text-stone-950'
                      }`}
                    >
                      {hasMonthRec ? tr('✓ រួចរាល់', '✓ Done') : tr('មិនទាន់កត់', 'Pending')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 6: ប្រវត្តិកត់ត្រា / Entry History & Audit Control (Owner Only)
         ===================================================================== */}
      {sopheakTab === 'entryHistory' && resolvedRole === 'owner' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  {tr(
                    'កំណត់ត្រាទឹក-ភ្លើង និងចំណូលបូកបន្តដែលបានរក្សាទុក',
                    'Saved Monthly Utility & Cumulative Revenue Records'
                  )}
                </h3>
                <p className="text-xs text-stone-500">
                  {tr(
                    'ទិន្នន័យចំណូលខែមុនៗទាំងអស់ត្រូវបានរក្សាទុក និងបូកបន្តសម្រាប់ម្ចាស់ផ្ទះ។ បើបញ្ចូលខុស សូមប្រើប៊ូតុង "កែតម្រូវ"។',
                    'All monthly revenue records are preserved and accumulated for the landlord. Use "Adjust" for audited corrections.'
                  )}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg">
                🔒 {tr('រក្សាទុកចំណូលបូកបន្ត 100%', '100% Cumulative Revenue Protected')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-900 text-white uppercase text-[11px]">
                    <th className="p-2.5 rounded-tl-lg">{tr('ខែ / ថ្ងៃទី', 'Date')}</th>
                    <th className="p-2.5">{tr('បន្ទប់', 'Room')}</th>
                    <th className="p-2.5">{tr('ឈ្មោះភ្ញៀវ', 'Tenant')}</th>
                    <th className="p-2.5 text-right">{tr('ភ្លើង (kWh)', 'Elec (kWh)')}</th>
                    <th className="p-2.5 text-right">{tr('ទឹក (m³)', 'Water (m³)')}</th>
                    <th className="p-2.5 text-right">{tr('សរុប ($)', 'Total ($)')}</th>
                    <th className="p-2.5">{tr('អ្នកកត់ត្រា', 'Recorded By')}</th>
                    <th className="p-2.5 text-right rounded-tr-lg">{tr('សកម្មភាព', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {history
                    .filter(h => assignedRoomSet.has(normalizeRoom(h.roomNo)))
                    .slice(0, 35)
                    .map(rec => (
                      <tr key={rec.id} className="hover:bg-stone-50">
                        <td className="p-2.5 font-mono font-bold">{rec.paymentDate}</td>
                        <td className="p-2.5 font-mono font-black text-emerald-800">
                          {formatRoomCode(rec.roomNo)}
                        </td>
                        <td className="p-2.5 font-moul text-blue-950">{rec.tenantName}</td>
                        <td className="p-2.5 text-right font-mono">
                          {rec.elecUsage} kWh (${rec.elecPrice.toFixed(2)})
                        </td>
                        <td className="p-2.5 text-right font-mono">
                          {rec.waterUsage} m³ (${rec.waterPrice.toFixed(2)})
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-emerald-700">
                          ${rec.totalUsd.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-[11px] text-stone-600">{rec.recordedBy || 'HSN System'}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingRecord(rec);
                              const oldE = parseFloat(rec.elecOld || '0') || 0;
                              const oldW = parseFloat(rec.waterOld || '0') || 0;
                              setAdjustElecNew(rec.elecNew || String(oldE + (rec.elecUsage || 0)));
                              setAdjustWaterNew(rec.waterNew || String(oldW + (rec.waterUsage || 0)));
                              setAdjustReason('');
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-[11px] rounded-lg cursor-pointer"
                          >
                            {tr('កែតម្រូវ', 'Adjust')}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {adjustingRecord && (
            <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveRecordAdjustment}
                className="bg-white rounded-2xl max-w-md w-full p-5 border-2 border-amber-400 shadow-2xl space-y-4 text-xs"
              >
                <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                  <h4 className="font-extrabold text-sm text-stone-900">
                    {tr('កែតម្រូវទិន្នន័យទឹក-ភ្លើង', 'Adjust Utility Record')} ({formatRoomCode(adjustingRecord.roomNo)} •{' '}
                    {adjustingRecord.paymentDate})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setAdjustingRecord(null)}
                    className="text-stone-500 hover:text-stone-900 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('លេខភ្លើងថ្មីកែតម្រូវ (kWh)', 'Adjusted Elec Reading (kWh)')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={adjustElecNew}
                      onChange={e => setAdjustElecNew(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      {tr('លេខទឹកថ្មីកែតម្រូវ (m³)', 'Adjusted Water Reading (m³)')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={adjustWaterNew}
                      onChange={e => setAdjustWaterNew(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono font-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-red-800 mb-1">
                    {tr('មូលហេតុនៃការកែតម្រូវ *', 'Reason for Adjustment (Logged in Audit Trail) *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={tr('ឧ. ចុចលេខកុងទ័រខុស ១ ខ្ទង់...', 'e.g. Typo in meter digit...')}
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    className="w-full bg-stone-50 border border-red-300 rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingRecord(null)}
                    className="px-4 py-2 bg-stone-200 rounded-xl font-bold cursor-pointer"
                  >
                    {tr('បោះបង់', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-black cursor-pointer"
                  >
                    {tr('រក្សាទុកការកែតម្រូវ', 'Save Adjustment')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Immutable Audit Log History */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-700" />
              <span>{tr('កំណត់ហេតុត្រួតពិនិត្យ (Audit Log)', 'Audit Log History')}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-950 text-white uppercase text-[11px]">
                    <th className="p-2.5">{tr('ម៉ោង', 'Timestamp')}</th>
                    <th className="p-2.5">{tr('អ្នកបញ្ចូល', 'Actor')}</th>
                    <th className="p-2.5">{tr('បន្ទប់ & ភ្ញៀវ', 'Room & Tenant')}</th>
                    <th className="p-2.5">{tr('ភ្លើង (មុន ➔ ក្រោយ)', 'Elec (Before ➔ After)')}</th>
                    <th className="p-2.5">{tr('ទឹក (មុន ➔ ក្រោយ)', 'Water (Before ➔ After)')}</th>
                    <th className="p-2.5">{tr('តម្លៃ (មុន ➔ ក្រោយ)', 'Value (Before ➔ After)')}</th>
                    <th className="p-2.5">{tr('ស្ថានភាព', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-900">{log.actorName}</td>
                      <td className="p-2.5">
                        <span className="font-mono font-black">{formatRoomCode(log.roomNo)}</span> • {log.tenantName}
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {log.elecBefore ? `${log.elecBefore} ➔ ${log.elecAfter}` : '—'}
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {log.waterBefore ? `${log.waterBefore} ➔ ${log.waterAfter}` : '—'}
                      </td>
                      <td className="p-2.5 font-mono font-bold">
                        {log.valueBefore || log.beforeData} ➔{' '}
                        <span className="text-emerald-700">{log.valueAfter || log.afterData}</span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-black text-[10px] text-emerald-800">[{log.status}]</span>
                        {(log.notes || log.note) && (
                          <div className="text-[11px] text-stone-500">{log.notes || log.note}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
