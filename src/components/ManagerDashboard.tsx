import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  UserPlus,
  Droplets,
  Zap,
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  LogOut,
  Edit,
  Globe,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  ManagerAccount,
  AuditLogEntry,
  MeterReadingRecord,
} from '../types/manager';

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

interface ManagerDashboardProps {
  manager: ManagerAccount;
  isOwnerPreview: boolean;
  onExitOwnerPreview?: () => void;
  onLogout: () => void;
  savedTenants: SharedTenantRecord[];
  vacantRoomsMeta: Record<string, any>;
  meterReadings: MeterReadingRecord[];
  auditLogs: AuditLogEntry[];
  formatRoomBadge: (roomNo: string | number | undefined | null) => string;
  formatTenantId: (roomNo: string) => string;
  onAddNewTenantByManager: (
    newTenant: SharedTenantRecord,
    initialElecNew: string,
    initialWaterNew: string,
    notes: string
  ) => { ok: boolean; messageKh: string; messageEn: string };
  onUpdateExistingTenantByManager: (
    originalRoomNo: string,
    updatedFields: Partial<SharedTenantRecord>,
    reasonNote: string
  ) => { ok: boolean; messageKh: string; messageEn: string };
  onSaveMeterReadingByManager: (params: {
    roomNo: string;
    monthYear: string;
    recordedDate: string;
    elecNew: string;
    waterNew: string;
    focusType: 'water' | 'electricity' | 'both';
    isAdjustment: boolean;
    adjustmentReason: string;
    allowLowerReadingOverride: boolean;
  }) => { ok: boolean; messageKh: string; messageEn: string; requiresAdjustmentConfirm?: boolean };
  onOpenCheckOutModal?: (tenant: SharedTenantRecord) => void;
  isOnline: boolean;
  lastSyncedAt: string | null;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  manager,
  isOwnerPreview,
  onExitOwnerPreview,
  onLogout,
  savedTenants,
  vacantRoomsMeta,
  meterReadings,
  auditLogs,
  formatRoomBadge,
  formatTenantId,
  onAddNewTenantByManager,
  onUpdateExistingTenantByManager,
  onSaveMeterReadingByManager,
  onOpenCheckOutModal,
  isOnline,
}) => {
  const [lang, setLang] = useState<'kh' | 'en'>('kh');
  const [activeSection, setActiveSection] = useState<
    | 'assignedRooms'
    | 'newTenants'
    | 'existingTenants'
    | 'waterReadings'
    | 'elecReadings'
    | 'entryHistory'
  >('assignedRooms');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    kh: string;
    en: string;
  } | null>(null);

  const showBilingualNotice = (
    type: 'success' | 'error' | 'warning',
    kh: string,
    en: string
  ) => {
    setFeedback({ type, kh, en });
  };

  const assignedRoomNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'].filter(
    (r) => manager.assignedRooms.includes(r)
  );

  const assignedTenants = savedTenants
    .filter((t) => assignedRoomNumbers.includes(t.roomNo.trim()))
    .sort((a, b) => (parseInt(a.roomNo) || 99) - (parseInt(b.roomNo) || 99));

  const filteredAssignedTenants = assignedTenants.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.tenantName.toLowerCase().includes(q) ||
      t.roomNo.toLowerCase().includes(q) ||
      formatRoomBadge(t.roomNo).toLowerCase().includes(q) ||
      (t.tenantPhone || '').toLowerCase().includes(q) ||
      (t.tenantIdNo || '').toLowerCase().includes(q)
    );
  });

  const monthReadingsForAssigned = meterReadings.filter(
    (mr) =>
      mr.monthYear === selectedMonthYear &&
      assignedRoomNumbers.includes(mr.roomNo.trim())
  );

  const roomsPendingThisMonth = assignedTenants.filter(
    (t) =>
      !monthReadingsForAssigned.some((mr) => mr.roomNo.trim() === t.roomNo.trim())
  );

  const vacantAssignedRooms = assignedRoomNumbers.filter(
    (rNo) => !savedTenants.some((t) => t.roomNo.trim() === rNo && t.tenantName.trim() !== '')
  );

  const [newTenantForm, setNewTenantForm] = useState({
    roomNo: vacantAssignedRooms[0] || assignedRoomNumbers[0] || '1',
    tenantName: '',
    tenantIdNo: '',
    tenantPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    roomPrice: '80',
    deposit: '80',
    wifiPrice: '0',
    elecOld: '0',
    elecNew: '',
    waterOld: '0',
    waterNew: '',
    notes: '',
  });

  const handleSelectNewTenantRoom = (roomNo: string) => {
    const meta = vacantRoomsMeta[roomNo];
    setNewTenantForm((prev) => ({
      ...prev,
      roomNo,
      roomPrice: String(meta?.roomPrice ?? 80),
      deposit: String(meta?.deposit ?? meta?.roomPrice ?? 80),
      wifiPrice: String(meta?.wifiPrice ?? 0),
      elecOld: String(meta?.elecOld ?? '0'),
      waterOld: String(meta?.waterOld ?? '0'),
    }));
  };

  const handleNewTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      showBilingualNotice(
        'error',
        'មិនអាចរក្សាទុកបានទេដោយសារដាច់ការតភ្ជាប់បណ្តាញ! សូមពិនិត្យអ៊ីនធឺណិត។',
        'Cannot save while offline! Please check your network connection.'
      );
      return;
    }

    const res = onAddNewTenantByManager(
      {
        roomNo: newTenantForm.roomNo.trim(),
        tenantName: newTenantForm.tenantName.trim(),
        tenantIdNo:
          newTenantForm.tenantIdNo.trim() || formatTenantId(newTenantForm.roomNo.trim()),
        tenantPhone: newTenantForm.tenantPhone.trim(),
        checkInDate: newTenantForm.checkInDate,
        roomPrice: parseFloat(newTenantForm.roomPrice) || 80,
        deposit: parseFloat(newTenantForm.deposit) || 0,
        wifiPrice: parseFloat(newTenantForm.wifiPrice) || 0,
        elecOld: newTenantForm.elecOld.trim() || '0',
        waterOld: newTenantForm.waterOld.trim() || '0',
        notes: newTenantForm.notes.trim(),
      },
      newTenantForm.elecNew.trim(),
      newTenantForm.waterNew.trim(),
      newTenantForm.notes.trim()
    );

    if (!res.ok) {
      showBilingualNotice('error', res.messageKh, res.messageEn);
      return;
    }

    showBilingualNotice('success', res.messageKh, res.messageEn);
    const nextVacant = vacantAssignedRooms.find((r) => r !== newTenantForm.roomNo) || '1';
    const nextMeta = vacantRoomsMeta[nextVacant];
    setNewTenantForm({
      roomNo: nextVacant,
      tenantName: '',
      tenantIdNo: '',
      tenantPhone: '',
      checkInDate: new Date().toISOString().split('T')[0],
      roomPrice: String(nextMeta?.roomPrice ?? 80),
      deposit: String(nextMeta?.deposit ?? 80),
      wifiPrice: String(nextMeta?.wifiPrice ?? 0),
      elecOld: String(nextMeta?.elecOld ?? '0'),
      elecNew: '',
      waterOld: String(nextMeta?.waterOld ?? '0'),
      waterNew: '',
      notes: '',
    });
  };

  const [editingRoomNo, setEditingRoomNo] = useState<string | null>(null);
  const [editTenantForm, setEditTenantForm] = useState({
    tenantName: '',
    tenantIdNo: '',
    tenantPhone: '',
    checkInDate: '',
    roomPrice: 80,
    deposit: 80,
    wifiPrice: 0,
    notes: '',
    reasonNote: '',
  });

  const startEditExistingTenant = (t: SharedTenantRecord) => {
    setEditingRoomNo(t.roomNo);
    setEditTenantForm({
      tenantName: t.tenantName,
      tenantIdNo: t.tenantIdNo || formatTenantId(t.roomNo),
      tenantPhone: t.tenantPhone || '',
      checkInDate: t.checkInDate || '',
      roomPrice: t.roomPrice || 80,
      deposit: t.deposit || 0,
      wifiPrice: t.wifiPrice || 0,
      notes: t.notes || '',
      reasonNote: '',
    });
  };

  const handleSaveExistingTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomNo) return;
    const res = onUpdateExistingTenantByManager(
      editingRoomNo,
      {
        tenantName: editTenantForm.tenantName.trim(),
        tenantIdNo: editTenantForm.tenantIdNo.trim(),
        tenantPhone: editTenantForm.tenantPhone.trim(),
        checkInDate: editTenantForm.checkInDate,
        roomPrice: editTenantForm.roomPrice,
        deposit: editTenantForm.deposit,
        wifiPrice: editTenantForm.wifiPrice,
        notes: editTenantForm.notes.trim(),
      },
      editTenantForm.reasonNote.trim() || 'Updated by Manager Nguon Sopheak'
    );
    if (!res.ok) {
      showBilingualNotice('error', res.messageKh, res.messageEn);
      return;
    }
    showBilingualNotice('success', res.messageKh, res.messageEn);
    setEditingRoomNo(null);
  };

  const [selectedReadingRoom, setSelectedReadingRoom] = useState<string>(
    assignedTenants[0]?.roomNo || '5'
  );
  const [readingDate, setReadingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [elecNewInput, setElecNewInput] = useState<string>('');
  const [waterNewInput, setWaterNewInput] = useState<string>('');
  const [isAdjustmentMode, setIsAdjustmentMode] = useState<boolean>(false);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [confirmLowerReading, setConfirmLowerReading] = useState<boolean>(false);
  const [isSubmittingReading, setIsSubmittingReading] = useState<boolean>(false);

  const activeReadingTenant = assignedTenants.find(
    (t) => t.roomNo.trim() === selectedReadingRoom.trim()
  );

  const existingMonthReading = meterReadings.find(
    (mr) =>
      mr.roomNo.trim() === selectedReadingRoom.trim() &&
      mr.monthYear === selectedMonthYear
  );

  useEffect(() => {
    if (!activeReadingTenant) return;
    if (existingMonthReading) {
      setElecNewInput(String(existingMonthReading.elecNew));
      setWaterNewInput(String(existingMonthReading.waterNew));
      setIsAdjustmentMode(true);
    } else {
      setElecNewInput(activeReadingTenant.elecNew || '');
      setWaterNewInput(activeReadingTenant.waterNew || '');
      setIsAdjustmentMode(false);
    }
    setConfirmLowerReading(false);
    setAdjustmentReason('');
  }, [selectedReadingRoom, selectedMonthYear, activeReadingTenant?.roomNo]);

  const elecOldVal = existingMonthReading
    ? existingMonthReading.elecOld
    : parseFloat(activeReadingTenant?.elecOld || '0') || 0;
  const waterOldVal = existingMonthReading
    ? existingMonthReading.waterOld
    : parseFloat(activeReadingTenant?.waterOld || '0') || 0;

  const parsedElecNew = elecNewInput.trim() === '' ? elecOldVal : parseFloat(elecNewInput) || 0;
  const parsedWaterNew = waterNewInput.trim() === '' ? waterOldVal : parseFloat(waterNewInput) || 0;

  const isElecLower = elecNewInput.trim() !== '' && parsedElecNew < elecOldVal;
  const isWaterLower = waterNewInput.trim() !== '' && parsedWaterNew < waterOldVal;

  const elecUsageCalc = Math.max(0, parsedElecNew - elecOldVal);
  const waterUsageCalc = Math.max(0, parsedWaterNew - waterOldVal);

  const ELEC_RATE_KHR = 1500;
  const WATER_RATE_KHR = 2000;

  const elecCostKhr = elecUsageCalc * ELEC_RATE_KHR;
  const elecCostUsd = elecCostKhr / 4000;

  const waterCostKhr = waterUsageCalc * WATER_RATE_KHR;
  const waterCostUsd = waterCostKhr / 4000;

  const totalEstimatedUsd =
    (activeReadingTenant?.roomPrice || 0) +
    (activeReadingTenant?.wifiPrice || 0) +
    elecCostUsd +
    waterCostUsd;

  const handleMeterReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingReading) return;
    if (!activeReadingTenant) {
      showBilingualNotice(
        'error',
        'សូមជ្រើសរើសបន្ទប់ដែលមានភ្ញៀវកំពុងជួលជាមុនសិន!',
        'Please select a room with an active tenant first!'
      );
      return;
    }

    setIsSubmittingReading(true);
    try {
      const res = onSaveMeterReadingByManager({
        roomNo: activeReadingTenant.roomNo,
        monthYear: selectedMonthYear,
        recordedDate: readingDate,
        elecNew: elecNewInput.trim() === '' ? String(elecOldVal) : elecNewInput.trim(),
        waterNew: waterNewInput.trim() === '' ? String(waterOldVal) : waterNewInput.trim(),
        focusType:
          activeSection === 'waterReadings'
            ? 'water'
            : activeSection === 'elecReadings'
            ? 'electricity'
            : 'both',
        isAdjustment: isAdjustmentMode || Boolean(existingMonthReading),
        adjustmentReason: adjustmentReason.trim(),
        allowLowerReadingOverride: confirmLowerReading,
      });

      if (!res.ok) {
        showBilingualNotice(
          res.requiresAdjustmentConfirm ? 'warning' : 'error',
          res.messageKh,
          res.messageEn
        );
      } else {
        showBilingualNotice('success', res.messageKh, res.messageEn);
        setAdjustmentReason('');
      }
    } finally {
      setTimeout(() => setIsSubmittingReading(false), 400);
    }
  };

  const managerAuditLogs = auditLogs.filter(
    (log) =>
      log.actorId === manager.id ||
      log.actorName.toLowerCase().includes(manager.displayName.toLowerCase()) ||
      assignedRoomNumbers.includes(log.roomNo)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans text-stone-800 pb-12">
      {isOwnerPreview && onExitOwnerPreview && (
        <div className="bg-amber-400 text-stone-950 rounded-2xl p-3.5 px-5 shadow-xl border-2 border-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-black">
            <ShieldCheck className="w-5 h-5 text-stone-950 shrink-0" />
            <span>
              ម្ចាស់ផ្ទះ HENG SAMNANG (H.S.N) កំពុងមើលទំព័រ៖{' '}
              <u>{manager.displayName} – Manager Dashboard</u>
            </span>
          </div>
          <button
            type="button"
            onClick={onExitOwnerPreview}
            className="bg-stone-950 hover:bg-stone-800 text-amber-300 font-black text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
          >
            ← ត្រឡប់ទៅផ្ទាំងម្ចាស់ផ្ទះ H.S.N (Back to Owner Panel)
          </button>
        </div>
      )}

      {/* Top Manager Header Card */}
      <div className="bg-gradient-to-r from-[#092B1B] via-[#11442B] to-[#082218] rounded-3xl p-5 sm:p-7 text-white border-2 border-emerald-500/50 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 text-stone-950 font-black text-xl flex flex-col items-center justify-center shrink-0 shadow-lg border-2 border-amber-200">
              <span>NS</span>
              <span className="text-[8px] font-extrabold tracking-wider uppercase">MANAGER</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  H.S.N RENTAL MANAGER • អ្នកគ្រប់គ្រង
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isOnline
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400/50'
                      : 'bg-red-900 text-red-200 border-red-400'
                  }`}
                >
                  {isOnline
                    ? '● តភ្ជាប់ប្រព័ន្ធមេ H.S.N / Synced with Master DB'
                    : '⚠️ ដាច់ការតភ្ជាប់ / Offline Mode'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-moul leading-normal">
                {manager.displayName} – Manager Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium mt-0.5">
                {lang === 'kh'
                  ? `គណនីអ្នកគ្រប់គ្រង៖ ${manager.displayNameKh} (@${manager.username}) • ផ្តល់សិទ្ធិដោយម្ចាស់ផ្ទះ HENG SAMNANG (H.S.N)`
                  : `Manager Account: ${manager.displayName} (@${manager.username}) • Authorized by Owner HENG SAMNANG (H.S.N)`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="bg-emerald-950/80 border border-emerald-600/60 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-300" />
              <div className="text-left">
                <div className="text-[9px] text-emerald-300 font-bold uppercase">
                  {lang === 'kh' ? 'ខែកត់ត្រា / Month' : 'Recording Month'}
                </div>
                <input
                  type="month"
                  value={selectedMonthYear}
                  onChange={(e) => setSelectedMonthYear(e.target.value)}
                  className="bg-transparent text-white font-mono font-black text-xs outline-none cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLang(lang === 'kh' ? 'en' : 'kh')}
              className="bg-emerald-800/80 hover:bg-emerald-700 text-amber-200 border border-emerald-500/50 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Globe className="w-4 h-4 text-amber-300" />
              <span>{lang === 'kh' ? 'ភាសាខ្មែរ ➔ English' : 'English ➔ ភាសាខ្មែរ'}</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="bg-red-600/90 hover:bg-red-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'kh' ? 'ចាកចេញ (Logout)' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          <div className="bg-emerald-950/75 border border-emerald-600/50 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-emerald-300">
              {lang === 'kh' ? '១. បន្ទប់ដែលទទួលខុសត្រូវ' : '1. Assigned Rooms'}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
              {assignedRoomNumbers.length}{' '}
              <span className="text-xs font-sans font-bold text-emerald-300">
                {lang === 'kh' ? 'បន្ទប់ / Rooms' : 'Rooms'}
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-1">
              {vacantAssignedRooms.length} {lang === 'kh' ? 'ទំនេរ (Vacant)' : 'Vacant'} •{' '}
              {assignedTenants.length} {lang === 'kh' ? 'មានភ្ញៀវ (Occupied)' : 'Occupied'}
            </div>
          </div>

          <div className="bg-emerald-950/75 border border-emerald-600/50 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-amber-300">
              {lang === 'kh' ? '២. ចំនួនភ្ញៀវជួលបច្ចុប្បន្ន' : '2. Current Active Tenants'}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono mt-1">
              {assignedTenants.length}{' '}
              <span className="text-xs font-sans font-bold text-amber-200">
                {lang === 'kh' ? 'នាក់ / Tenants' : 'Tenants'}
              </span>
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">
              {lang === 'kh' ? 'ភ្ជាប់ផ្ទាល់ជាមួយទិន្នន័យដើម H.S.N' : 'Linked directly to H.S.N Master DB'}
            </div>
          </div>

          <div className="bg-emerald-950/75 border border-emerald-600/50 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-cyan-300">
              {lang === 'kh'
                ? `៣. កត់ត្រាទឹក-ភ្លើងខែនេះ (${selectedMonthYear})`
                : `3. Meter Readings Entered (${selectedMonthYear})`}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono mt-1">
              {monthReadingsForAssigned.length}{' '}
              <span className="text-xs font-sans font-bold text-cyan-200">
                / {assignedTenants.length} {lang === 'kh' ? 'បន្ទប់' : 'Rooms'}
              </span>
            </div>
            <div className="text-[10px] text-cyan-200/80 mt-1">
              {lang === 'kh' ? 'កំណត់ត្រាបានរក្សាទុកក្នុងខែនេះ' : 'Saved utility records this month'}
            </div>
          </div>

          <div className="bg-emerald-950/75 border border-amber-400/50 rounded-2xl p-4">
            <div className="text-[11px] font-bold text-orange-300">
              {lang === 'kh' ? '៤. បន្ទប់មិនទាន់បញ្ចូលលេខខែនេះ' : '4. Rooms Pending Reading'}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-orange-300 font-mono mt-1">
              {roomsPendingThisMonth.length}{' '}
              <span className="text-xs font-sans font-bold text-orange-200">
                {lang === 'kh' ? 'បន្ទប់ / Pending' : 'Pending'}
              </span>
            </div>
            <div className="text-[10px] text-orange-200/90 mt-1 truncate">
              {roomsPendingThisMonth.length === 0
                ? lang === 'kh'
                  ? '✓ បានបញ្ចូលគ្រប់បន្ទប់រួចរាល់!'
                  : '✓ All occupied rooms recorded!'
                : roomsPendingThisMonth.map((t) => formatRoomBadge(t.roomNo)).join(', ')}
            </div>
          </div>
        </div>

        {/* 6 Main Navigation Modules */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 pt-5 border-t border-emerald-800/70">
          {[
            { id: 'assignedRooms' as const, kh: '១. បន្ទប់ដែលទទួលខុសត្រូវ', en: 'Assigned Rooms', icon: Home },
            { id: 'newTenants' as const, kh: '២. អតិថិជនថ្មី', en: 'New Tenants', icon: UserPlus },
            { id: 'existingTenants' as const, kh: '៣. អតិថិជនចាស់', en: 'Existing Tenants', icon: Users },
            { id: 'waterReadings' as const, kh: '៤. កត់ត្រាលេខទឹក', en: 'Water Meter Readings', icon: Droplets },
            { id: 'elecReadings' as const, kh: '៥. កត់ត្រាលេខភ្លើង', en: 'Electricity Meter Readings', icon: Zap },
            { id: 'entryHistory' as const, kh: '៦. ប្រវត្តិការបញ្ចូលទិន្នន័យ', en: 'Entry History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSection(tab.id);
                  setFeedback(null);
                }}
                className={`p-3 rounded-2xl text-left border-2 transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-stone-950 border-white font-black shadow-lg scale-[1.02]'
                    : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-100 border-emerald-700/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${active ? 'text-stone-950' : 'text-amber-300'}`} />
                  {active && (
                    <span className="text-[9px] bg-stone-950 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-extrabold leading-tight">{tab.kh}</div>
                  <div className={`text-[10px] font-medium ${active ? 'text-stone-800' : 'text-emerald-300/80'}`}>
                    {tab.en}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 border-2 shadow-lg flex items-start justify-between gap-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-500 text-amber-950'
              : 'bg-red-50 border-red-500 text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle
                className={`w-6 h-6 shrink-0 mt-0.5 ${
                  feedback.type === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`}
              />
            )}
            <div className="space-y-0.5">
              <div className="text-sm font-extrabold">{feedback.kh}</div>
              <div className="text-xs font-semibold opacity-85">{feedback.en}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-500 hover:text-stone-900 font-black text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: ASSIGNED ROOMS */}
      {activeSection === 'assignedRooms' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-700" />
                ១. បន្ទប់ដែលទទួលខុសត្រូវ / Assigned Rooms ({assignedRoomNumbers.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                បញ្ជីបន្ទប់ដែលម្ចាស់ផ្ទះ HENG SAMNANG (H.S.N) បានប្រគល់សិទ្ធិឱ្យ{' '}
                <strong>{manager.displayName}</strong> គ្រប់គ្រង និងកត់ត្រាទឹក-ភ្លើង។
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកបន្ទប់ ឈ្មោះ ឬទូរស័ព្ទ... / Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-stone-800 outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {assignedRoomNumbers.map((rNo) => {
              const occupant = assignedTenants.find((t) => t.roomNo.trim() === rNo);
              const q = searchQuery.trim().toLowerCase();
              if (
                q &&
                !formatRoomBadge(rNo).toLowerCase().includes(q) &&
                !(occupant?.tenantName || '').toLowerCase().includes(q) &&
                !(occupant?.tenantPhone || '').toLowerCase().includes(q)
              ) {
                return null;
              }

              const hasMonthRecord = monthReadingsForAssigned.some(
                (mr) => mr.roomNo.trim() === rNo
              );

              return (
                <div
                  key={`assigned-card-${rNo}`}
                  className={`rounded-2xl border-2 p-4 flex flex-col justify-between gap-3 transition-all ${
                    occupant
                      ? 'bg-white border-stone-200 hover:border-emerald-500 shadow-sm'
                      : 'bg-emerald-50/60 border-dashed border-emerald-300 hover:border-emerald-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-black bg-emerald-900 text-amber-300 px-3 py-1 rounded-xl font-sans">
                        {formatRoomBadge(rNo)}
                      </span>
                      {occupant ? (
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            hasMonthRecord
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {hasMonthRecord ? '✓ បានកត់ត្រាខែនេះ' : '⏳ មិនទាន់កត់ត្រាខែនេះ'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                          ● ទំនេរ / Vacant
                        </span>
                      )}
                    </div>

                    {occupant ? (
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="font-moul text-sm text-blue-950">{occupant.tenantName}</div>
                        <div className="text-[11px] font-mono text-stone-500">
                          ID: <strong>{occupant.tenantIdNo || formatTenantId(rNo)}</strong>
                        </div>
                        <div className="text-[11px] text-stone-600">📞 {occupant.tenantPhone || '—'}</div>
                        <div className="grid grid-cols-2 gap-1.5 pt-2 mt-2 border-t border-stone-100 text-[11px]">
                          <div className="bg-blue-50 text-blue-900 px-2 py-1 rounded font-bold">
                            ⚡ ភ្លើងចាស់: {occupant.elecOld || '0'}
                          </div>
                          <div className="bg-cyan-50 text-cyan-900 px-2 py-1 rounded font-bold">
                            💧 ទឹកចាស់: {occupant.waterOld || '0'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-emerald-900 space-y-1">
                        <div className="font-bold">បន្ទប់ទំនេរ (Available Room)</div>
                        <div className="text-[11px] text-stone-600">
                          តម្លៃបន្ទប់: ${vacantRoomsMeta[rNo]?.roomPrice ?? 80}/ខែ
                        </div>
                        <div className="text-[11px] text-stone-500">
                          ភ្លើងចាស់: {vacantRoomsMeta[rNo]?.elecOld ?? '0'} • ទឹកចាស់:{' '}
                          {vacantRoomsMeta[rNo]?.waterOld ?? '0'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
                    {occupant ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReadingRoom(rNo);
                            setActiveSection('elecReadings');
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>កត់ភ្លើង</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReadingRoom(rNo);
                            setActiveSection('waterReadings');
                          }}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Droplets className="w-3.5 h-3.5" />
                          <span>កត់ទឹក</span>
                        </button>
                        {manager.permissions.canCheckOutTenant !== false && onOpenCheckOutModal && (
                          <button
                            type="button"
                            onClick={() => onOpenCheckOutModal(occupant)}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-1"
                            title="លុបព័ត៌មានភ្ញៀវចាស់ដែលឈប់ជួល តែរក្សាទុកចំណូលបូកសរុប / Check-out former tenant & preserve cumulative revenue"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'kh'
                                ? 'ភ្ញៀវចាកចេញ / លុបភ្ញៀវចាស់ (រក្សាចំណូល)'
                                : 'Check-Out / Remove Old Tenant (Keep Revenue)'}
                            </span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectNewTenantRoom(rNo);
                          setActiveSection('newTenants');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>បញ្ចូលភ្ញៀវថ្មី / Add Tenant</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: NEW TENANTS */}
      {activeSection === 'newTenants' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="border-b border-stone-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                ២. បញ្ចូលអតិថិជនជួលថ្មី / Enter New Tenant (Rooms 1–16)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                រាល់ទិន្នន័យភ្ញៀវថ្មីនឹងត្រូវបានពិនិត្យការពារការជាន់បន្ទប់ និងរក្សាទុកផ្ទាល់ទៅក្នុងប្រព័ន្ធមេរបស់ H.S.N ដោយកត់ត្រាឈ្មោះអ្នកបង្កើតគឺ{' '}
                <strong>{manager.displayName}</strong>។
              </p>
            </div>
            <span className="text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl shrink-0">
              បន្ទប់ទំនេរ៖ {vacantAssignedRooms.length} បន្ទប់ / Vacant Rooms
            </span>
          </div>

          {!manager.permissions.canAddTenant ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center text-red-900 space-y-1">
              <Lock className="w-8 h-8 mx-auto text-red-600" />
              <div className="font-extrabold text-sm">
                គណនីរបស់អ្នកមិនទាន់ត្រូវបានផ្តល់សិទ្ធិបន្ថែមភ្ញៀវថ្មីទេ!
              </div>
              <div className="text-xs">
                Your manager account does not currently have permission to add new tenants.
              </div>
            </div>
          ) : (
            <form onSubmit={handleNewTenantSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-stone-700 mb-1">
                    លេខបន្ទប់ (Room Number 1–16) <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={newTenantForm.roomNo}
                    onChange={(e) => handleSelectNewTenantRoom(e.target.value)}
                    className="w-full bg-emerald-50 border-2 border-emerald-500 rounded-xl p-2.5 text-sm font-black text-emerald-950"
                  >
                    {assignedRoomNumbers.map((rNo) => {
                      const occ = savedTenants.find(
                        (t) => t.roomNo.trim() === rNo && t.tenantName.trim() !== ''
                      );
                      return (
                        <option key={`new-t-room-${rNo}`} value={rNo}>
                          {formatRoomBadge(rNo)} —{' '}
                          {occ ? `⚠️ មានភ្ញៀវ (${occ.tenantName}) / Occupied` : '● ទំនេរ / Vacant'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-700 mb-1">
                    ឈ្មោះពេញរបស់ភ្ញៀវ (Tenant Full Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="បញ្ចូលឈ្មោះភ្ញៀវ / Enter full name..."
                    value={newTenantForm.tenantName}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, tenantName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-stone-700">
                      លេខសម្គាល់ ID (ID Card / Tenant ID) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNewTenantForm({
                          ...newTenantForm,
                          tenantIdNo: formatTenantId(newTenantForm.roomNo),
                        })
                      }
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      + Auto ({formatTenantId(newTenantForm.roomNo)})
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${formatTenantId(newTenantForm.roomNo)}`}
                    value={newTenantForm.tenantIdNo}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, tenantIdNo: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-700 mb-1">
                    លេខទូរស័ព្ទ (Phone Number) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 012 345 678"
                    value={newTenantForm.tenantPhone}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, tenantPhone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-700 mb-1">
                    ថ្ងៃចាប់ផ្តើមជួល (Start Date) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newTenantForm.checkInDate}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, checkInDate: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-stone-700 mb-1">
                    ថ្លៃជួលប្រចាំខែ (Monthly Rent USD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newTenantForm.roomPrice}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, roomPrice: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-sm font-black text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-amber-800 mb-1">
                    ប្រាក់កក់ (Security Deposit USD)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newTenantForm.deposit}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, deposit: e.target.value })}
                    className="w-full bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-sm font-black text-amber-950"
                  />
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-blue-950 mb-1">
                      ⚡ ភ្លើងចាស់ (Old Elec KWH)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newTenantForm.elecOld}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, elecOld: e.target.value })}
                      className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs font-black text-blue-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-blue-950 mb-1">
                      ⚡ ភ្លើងថ្មី (New Elec KWH)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      value={newTenantForm.elecNew}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, elecNew: e.target.value })}
                      className="w-full bg-white border border-blue-300 rounded-lg p-2 text-xs font-black text-blue-950"
                    />
                  </div>
                </div>

                <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-cyan-950 mb-1">
                      💧 ទឹកចាស់ (Old Water M³)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newTenantForm.waterOld}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, waterOld: e.target.value })}
                      className="w-full bg-white border border-cyan-300 rounded-lg p-2 text-xs font-black text-cyan-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-cyan-950 mb-1">
                      💧 ទឹកថ្មី (New Water M³)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Optional"
                      value={newTenantForm.waterNew}
                      onChange={(e) => setNewTenantForm({ ...newTenantForm, waterNew: e.target.value })}
                      className="w-full bg-white border border-cyan-300 rounded-lg p-2 text-xs font-black text-cyan-950"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-extrabold text-stone-700 mb-1">
                    កំណត់ចំណាំ (Notes / Remarks)
                  </label>
                  <input
                    type="text"
                    placeholder="កំណត់ចំណាំបន្ថែមអំពីភ្ញៀវ ឬកិច្ចសន្យា / Additional notes..."
                    value={newTenantForm.notes}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, notes: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-800"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-stone-200">
                <div className="text-xs text-stone-500">
                  អ្នកបង្កើតទិន្នន័យ / Created by:{' '}
                  <strong className="text-emerald-800">{manager.displayName}</strong>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    រក្សាទុកអតិថិជនថ្មីចូលបន្ទប់ {formatRoomBadge(newTenantForm.roomNo)} / Save New Tenant
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SECTION 3: EXISTING TENANTS */}
      {activeSection === 'existingTenants' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                ៣. បញ្ជីអតិថិជនចាស់កំពុងជួល / Existing Active Tenants ({assignedTenants.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                ស្វែងរក និងធ្វើបច្ចុប្បន្នភាពព័ត៌មានភ្ញៀវចាស់។{' '}
                {!manager.permissions.canEditRentOrContract && (
                  <strong className="text-amber-800">
                    🔒 តម្លៃជួល ប្រាក់កក់ និងកិច្ចសន្យាត្រូវបានចាក់សោការពារដោយម្ចាស់ផ្ទះ H.S.N។
                  </strong>
                )}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ស្វែងរកភ្ញៀវចាស់... / Search tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-stone-800"
              />
            </div>
          </div>

          {editingRoomNo && (
            <form
              onSubmit={handleSaveExistingTenant}
              className="bg-emerald-50/90 border-2 border-emerald-500 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <h4 className="text-sm font-extrabold text-emerald-950">
                  កែសម្រួលព័ត៌មានភ្ញៀវបន្ទប់ {formatRoomBadge(editingRoomNo)} / Update Tenant ({formatRoomBadge(editingRoomNo)})
                </h4>
                {!manager.permissions.canEditRentOrContract && (
                  <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                    🔒 តម្លៃបន្ទប់ & ប្រាក់កក់ត្រូវបានចាក់សោ / Rent & Deposit Locked by Owner
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">ឈ្មោះភ្ញៀវ (Tenant Name) *</label>
                  <input
                    type="text"
                    required
                    value={editTenantForm.tenantName}
                    onChange={(e) => setEditTenantForm({ ...editTenantForm, tenantName: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">លេខទូរស័ព្ទ (Phone Number)</label>
                  <input
                    type="text"
                    value={editTenantForm.tenantPhone}
                    onChange={(e) => setEditTenantForm({ ...editTenantForm, tenantPhone: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">លេខ ID (ID Card / Tenant ID)</label>
                  <input
                    type="text"
                    value={editTenantForm.tenantIdNo}
                    onChange={(e) => setEditTenantForm({ ...editTenantForm, tenantIdNo: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ថ្លៃបន្ទប់ (Monthly Rent $) {!manager.permissions.canEditRentOrContract && '🔒'}
                  </label>
                  <input
                    type="number"
                    disabled={!manager.permissions.canEditRentOrContract}
                    value={editTenantForm.roomPrice}
                    onChange={(e) =>
                      setEditTenantForm({ ...editTenantForm, roomPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-stone-100 disabled:opacity-70 border border-stone-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ប្រាក់កក់ (Deposit $) {!manager.permissions.canEditRentOrContract && '🔒'}
                  </label>
                  <input
                    type="number"
                    disabled={!manager.permissions.canEditRentOrContract}
                    value={editTenantForm.deposit}
                    onChange={(e) =>
                      setEditTenantForm({ ...editTenantForm, deposit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-stone-100 disabled:opacity-70 border border-stone-300 rounded-lg p-2 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">កំណត់ចំណាំ (Notes)</label>
                  <input
                    type="text"
                    value={editTenantForm.notes}
                    onChange={(e) => setEditTenantForm({ ...editTenantForm, notes: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoomNo(null)}
                  className="bg-stone-200 text-stone-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  បោះបង់ / Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-lg cursor-pointer"
                >
                  រក្សាទុកការកែប្រែ / Save Changes
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignedTenants.map((tenant) => (
              <div
                key={`exist-${tenant.roomNo}`}
                className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-black bg-blue-900 text-white px-3 py-1 rounded-xl">
                      {formatRoomBadge(tenant.roomNo)}
                    </span>
                    <div>
                      <h4 className="font-moul text-sm text-blue-950">{tenant.tenantName}</h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        ID: {tenant.tenantIdNo || formatTenantId(tenant.roomNo)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-stone-800 bg-white border border-stone-200 px-2.5 py-1 rounded-lg">
                    ${tenant.roomPrice}/ខែ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 bg-white p-3 rounded-xl border border-stone-200/80">
                  <div>📞 ទូរស័ព្ទ: <strong>{tenant.tenantPhone || '—'}</strong></div>
                  <div>📅 ថ្ងៃចូល: <strong>{tenant.checkInDate || '—'}</strong></div>
                  <div>⚡ ភ្លើងចាស់: <strong className="text-blue-900">{tenant.elecOld || '0'} KWH</strong></div>
                  <div>💧 ទឹកចាស់: <strong className="text-cyan-900">{tenant.waterOld || '0'} M³</strong></div>
                  <div>💰 ប្រាក់កក់: <strong>${tenant.deposit ?? 0}</strong></div>
                  <div>🌐 Wi-Fi: <strong>${tenant.wifiPrice ?? 0}</strong></div>
                  {tenant.notes && (
                    <div className="col-span-2 text-[11px] text-amber-800 italic">📝 {tenant.notes}</div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReadingRoom(tenant.roomNo);
                        setActiveSection('elecReadings');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>បញ្ចូលទឹក-ភ្លើង / Enter Readings</span>
                    </button>
                    {manager.permissions.canEditExistingTenant && (
                      <button
                        type="button"
                        onClick={() => startEditExistingTenant(tenant)}
                        className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>កែប្រែ / Edit</span>
                      </button>
                    )}
                    {manager.permissions.canCheckOutTenant !== false && onOpenCheckOutModal && (
                      <button
                        type="button"
                        onClick={() => onOpenCheckOutModal(tenant)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                        title="លុបព័ត៌មានភ្ញៀវចាស់ដែលឈប់ជួល តែរក្សាទុកចំណូលបូកសរុប / Check-out former tenant & preserve cumulative revenue"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'kh'
                            ? 'ភ្ញៀវចាកចេញ / លុបភ្ញៀវចាស់'
                            : 'Check-Out / Remove Old Tenant'}
                        </span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> មិនអាចលុបទិន្នន័យដើម
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4 & 5: WATER & ELECTRICITY METER READINGS */}
      {(activeSection === 'waterReadings' || activeSection === 'elecReadings') && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase mb-1">
                <span>AUTOMATIC TENANT & PREVIOUS METER LOOKUP</span>
                <span>•</span>
                <span>LINKED TO H.S.N MASTER DB</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
                {activeSection === 'waterReadings' ? (
                  <>
                    <Droplets className="w-6 h-6 text-cyan-600" />
                    <span>៤. កត់ត្រាលេខកុងទ័រទឹកប្រចាំខែ (Water Meter Readings Entry)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6 text-amber-500" />
                    <span>៥. កត់ត្រាលេខកុងទ័រភ្លើងប្រចាំខែ (Electricity Meter Readings Entry)</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                ជ្រើសរើសបន្ទប់ ប្រព័ន្ធនឹងទាញយកឈ្មោះភ្ញៀវបច្ចុប្បន្ន និងលេខកុងទ័រខែមុនដោយស្វ័យប្រវត្តិ។
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('waterReadings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border ${
                  activeSection === 'waterReadings'
                    ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm'
                    : 'bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span>កត់ត្រាលេខទឹក (Water)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('elecReadings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border ${
                  activeSection === 'elecReadings'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>កត់ត្រាលេខភ្លើង (Electricity)</span>
              </button>
            </div>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-stone-700 flex items-center justify-between">
              <span>ជ្រើសរើសបន្ទប់ភ្ញៀវកំពុងជួល (Select Active Tenant Room):</span>
              <span className="text-emerald-700">
                ខែកត់ត្រា / Month: <strong className="font-mono">{selectedMonthYear}</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {assignedTenants.map((t) => {
                const isSelected = t.roomNo.trim() === selectedReadingRoom.trim();
                const isRecorded = monthReadingsForAssigned.some(
                  (mr) => mr.roomNo.trim() === t.roomNo.trim()
                );
                return (
                  <button
                    key={`pick-read-${t.roomNo}`}
                    type="button"
                    onClick={() => setSelectedReadingRoom(t.roomNo)}
                    className={`px-3 py-2 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-700 border-amber-400 text-white shadow-md scale-[1.03]'
                        : isRecorded
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-white border-stone-300 text-stone-800 hover:border-emerald-500'
                    }`}
                  >
                    <span className="font-black text-xs font-sans">{formatRoomBadge(t.roomNo)}</span>
                    <span className="text-xs font-bold font-moul truncate max-w-[110px]">
                      {t.tenantName}
                    </span>
                    {isRecorded && (
                      <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-black">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {activeReadingTenant ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleMeterReadingSubmit}
                className="lg:col-span-7 bg-stone-50/70 border-2 border-emerald-600/30 rounded-2xl p-5 space-y-5"
              >
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-amber-300 uppercase">
                      ភ្ញៀវកំពុងស្នាក់នៅ (ACTIVE TENANT FOUND IN MASTER DB)
                    </div>
                    <div className="text-base sm:text-lg font-bold font-moul mt-0.5">
                      បន្ទប់ {formatRoomBadge(activeReadingTenant.roomNo)} —{' '}
                      {activeReadingTenant.tenantName}
                    </div>
                    <div className="text-xs text-emerald-200 font-mono mt-0.5">
                      Tenant ID: {activeReadingTenant.tenantIdNo || formatTenantId(activeReadingTenant.roomNo)} • 📞{' '}
                      {activeReadingTenant.tenantPhone || '—'}
                    </div>
                  </div>
                  <div className="text-right bg-emerald-950/80 border border-emerald-500/40 px-3.5 py-2 rounded-xl shrink-0">
                    <div className="text-[10px] text-emerald-300">ថ្លៃបន្ទប់ (Locked Rent)</div>
                    <div className="text-lg font-black text-amber-300 font-mono">
                      ${activeReadingTenant.roomPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-stone-700 mb-1">
                      ខែកត់ត្រា (Recording Month YYYY-MM) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={selectedMonthYear}
                      onChange={(e) => setSelectedMonthYear(e.target.value)}
                      className="w-full bg-white border-2 border-stone-300 rounded-xl p-2.5 text-sm font-black text-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-stone-700 mb-1">
                      ថ្ងៃកត់ត្រា (Recording Date) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={readingDate}
                      onChange={(e) => setReadingDate(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-sm font-bold text-stone-900"
                    />
                  </div>
                </div>

                {existingMonthReading && (
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        បន្ទប់ {formatRoomBadge(activeReadingTenant.roomNo)} មានកំណត់ត្រាសម្រាប់ខែ{' '}
                        {selectedMonthYear} រួចហើយ (ID: {existingMonthReading.id})!
                      </span>
                    </div>
                    <p className="text-[11px]">
                      ប្រសិនបើអ្នកចង់កែតម្រូវលេខខែនេះ សូមបញ្ចូលមូលហេតុកែតម្រូវខាងក្រោម។
                    </p>
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    activeSection === 'elecReadings'
                      ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-blue-600" />
                      កុងទ័រអគ្គិសនី / Electricity Meter (1,500 ៛ / KWH 🔒)
                    </span>
                    <span className="text-xs font-black text-blue-800 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 font-mono">
                      ប្រើប្រាស់: {elecUsageCalc} KWH = {elecCostKhr.toLocaleString()} ៛ ($
                      {elecCostUsd.toFixed(2)})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        លេខភ្លើងខែមុន / Previous Reading (Auto-loaded) 🔒
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${elecOldVal} KWH`}
                        className="w-full bg-blue-100/80 border border-blue-300 rounded-xl p-2.5 text-sm font-black text-blue-950 font-mono cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-blue-950 mb-1">
                        បញ្ចូលលេខភ្លើងថ្មី / Enter New Elec Reading (KWH) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder={`>= ${elecOldVal}`}
                        value={elecNewInput}
                        onChange={(e) => setElecNewInput(e.target.value)}
                        className="w-full bg-white border-2 border-blue-500 rounded-xl p-2.5 text-sm font-black text-stone-950 font-mono outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    activeSection === 'waterReadings'
                      ? 'bg-cyan-50/90 border-cyan-500 shadow-sm ring-2 ring-cyan-400/30'
                      : 'bg-cyan-50/40 border-cyan-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-cyan-950 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-cyan-600" />
                      កុងទ័រទឹកស្អាត / Water Meter (2,000 ៛ / M³ 🔒)
                    </span>
                    <span className="text-xs font-black text-cyan-800 bg-white px-2.5 py-0.5 rounded-lg border border-cyan-200 font-mono">
                      ប្រើប្រាស់: {waterUsageCalc} M³ = {waterCostKhr.toLocaleString()} ៛ ($
                      {waterCostUsd.toFixed(2)})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-cyan-900 mb-1">
                        លេខទឹកខែមុន / Previous Reading (Auto-loaded) 🔒
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${waterOldVal} M³`}
                        className="w-full bg-cyan-100/80 border border-cyan-300 rounded-xl p-2.5 text-sm font-black text-cyan-950 font-mono cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-cyan-950 mb-1">
                        បញ្ចូលលេខទឹកថ្មី / Enter New Water Reading (M³) *
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder={`>= ${waterOldVal}`}
                        value={waterNewInput}
                        onChange={(e) => setWaterNewInput(e.target.value)}
                        className="w-full bg-white border-2 border-cyan-500 rounded-xl p-2.5 text-sm font-black text-stone-950 font-mono outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {(isElecLower || isWaterLower) && (
                  <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-xs text-red-950 space-y-2">
                    <div className="font-extrabold flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span>
                        ⚠️ ការព្រមាន៖ លេខកុងទ័រថ្មីទាបជាងលេខកុងទ័រចាស់! (Warning: New reading is lower than previous reading!)
                      </span>
                    </div>
                    <label className="flex items-center gap-2 font-extrabold cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={confirmLowerReading}
                        onChange={(e) => setConfirmLowerReading(e.target.checked)}
                        className="w-4 h-4 accent-red-600"
                      />
                      <span>
                        ខ្ញុំសូមបញ្ជាក់ថាលេខនេះជាការកែតម្រូវត្រឹមត្រូវ (Confirm valid meter adjustment)
                      </span>
                    </label>
                  </div>
                )}

                {(existingMonthReading || isElecLower || isWaterLower || isAdjustmentMode) && (
                  <div>
                    <label className="block text-xs font-extrabold text-amber-900 mb-1">
                      មូលហេតុនៃការកែតម្រូវ (Audited Adjustment Reason) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="បញ្ជាក់មូលហេតុកែតម្រូវដើម្បីកត់ត្រាក្នុងប្រវត្តិ..."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full bg-amber-50 border-2 border-amber-400 rounded-xl p-2.5 text-xs font-bold text-stone-900"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingReading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-400 text-white font-black text-sm py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span>
                    {existingMonthReading
                      ? `រក្សាទុកការកែតម្រូវខែ ${selectedMonthYear} (${formatRoomBadge(activeReadingTenant.roomNo)}) / Save Audited Adjustment`
                      : `រក្សាទុកលេខទឹក-ភ្លើងចូលប្រព័ន្ធមេ H.S.N (${formatRoomBadge(activeReadingTenant.roomNo)}) / Save Readings to Master DB`}
                  </span>
                </button>
              </form>

              <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-5 border-2 border-amber-400/70 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-700 pb-3">
                  <div>
                    <div className="text-[10px] font-extrabold text-amber-300 uppercase">
                      ការគណនាស្វ័យប្រវត្តិ / AUTO CALCULATION
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      សង្ខេបវិក្កយបត្រខែ {selectedMonthYear}
                    </h3>
                  </div>
                  <span className="text-base font-black bg-amber-400 text-stone-950 px-3 py-1 rounded-xl">
                    {formatRoomBadge(activeReadingTenant.roomNo)}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-stone-800">
                    <span className="text-stone-400">ឈ្មោះភ្ញៀវ / Tenant:</span>
                    <span className="font-bold text-white font-moul">{activeReadingTenant.tenantName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-800">
                    <span className="text-stone-400">លេខសម្គាល់ / Tenant ID:</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {activeReadingTenant.tenantIdNo || formatTenantId(activeReadingTenant.roomNo)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-800">
                    <span className="text-stone-400">ថ្លៃឈ្នួលបន្ទប់ / Room Rent:</span>
                    <span className="font-mono font-bold text-white">
                      ${activeReadingTenant.roomPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-800">
                    <span className="text-stone-400">ថ្លៃវ៉ាយហ្វាយ / Wi-Fi:</span>
                    <span className="font-mono font-bold text-white">
                      ${(activeReadingTenant.wifiPrice || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-blue-950/70 border border-blue-500/40 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between font-bold text-blue-300">
                      <span>⚡ អគ្គិសនីប្រើប្រាស់ (Elec Usage):</span>
                      <span className="font-mono">
                        {parsedElecNew} − {elecOldVal} = {elecUsageCalc} KWH
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-blue-200">
                      <span>ថ្លៃភ្លើង ({elecUsageCalc} × 1,500 ៛):</span>
                      <span className="font-mono font-black text-amber-300">
                        {elecCostKhr.toLocaleString()} ៛ (${elecCostUsd.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  <div className="bg-cyan-950/70 border border-cyan-500/40 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between font-bold text-cyan-300">
                      <span>💧 ទឹកប្រើប្រាស់ (Water Usage):</span>
                      <span className="font-mono">
                        {parsedWaterNew} − {waterOldVal} = {waterUsageCalc} M³
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-cyan-200">
                      <span>ថ្លៃទឹក ({waterUsageCalc} × 2,000 ៛):</span>
                      <span className="font-mono font-black text-amber-300">
                        {waterCostKhr.toLocaleString()} ៛ (${waterCostUsd.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-950 border-2 border-emerald-500/60 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-300 uppercase">
                      សរុបត្រូវបង់ខែនេះ / TOTAL AMOUNT
                    </div>
                    <div className="text-xs text-stone-300">
                      ~ {Math.round(totalEstimatedUsd * 4000).toLocaleString()} ៛ (KHR)
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    ${totalEstimatedUsd.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-stone-500 text-xs">
              សូមជ្រើសរើសបន្ទប់ដែលមានភ្ញៀវជួល / Please select an occupied room.
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: ENTRY HISTORY */}
      {activeSection === 'entryHistory' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" />
                ៦. ប្រវត្តិការបញ្ចូលទិន្នន័យ / Entry History & Audit Trail ({managerAuditLogs.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                អ្នកគ្រប់គ្រងមិនអាចលុបប្រវត្តិដែលបានរក្សាទុកទេ (បើបញ្ចូលខុស សូមប្រើមុខងារកែតម្រូវដោយមានប្រវត្តិ)។
              </p>
            </div>
            <span className="text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>ការពារមិនឱ្យលុបប្រវត្តិ / History Deletion Locked</span>
            </span>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 text-white text-[10px] font-extrabold uppercase">
                  <th className="p-3">ពេលវេលា / Timestamp</th>
                  <th className="p-3">អ្នកបញ្ចូល / Entered By</th>
                  <th className="p-3">ប្រភេទ / Action</th>
                  <th className="p-3">បន្ទប់ & ភ្ញៀវ / Room & Tenant</th>
                  <th className="p-3">ភ្លើង (មុន➔ក្រោយ)</th>
                  <th className="p-3">ទឹក (មុន➔ក្រោយ)</th>
                  <th className="p-3">ព័ត៌មានលម្អិត / Value Before ➔ After</th>
                  <th className="p-3">កែតម្រូវ / Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {managerAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-stone-400">
                      មិនទាន់មានប្រវត្តិបញ្ចូលទិន្នន័យទេ / No entry history yet.
                    </td>
                  </tr>
                ) : (
                  managerAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50">
                      <td className="p-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="p-3 font-bold text-stone-900">{log.actorName}</td>
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                          {log.actionType}
                        </span>
                        {log.monthYear && (
                          <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                            {log.monthYear}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded mr-1.5">
                          {log.roomId}
                        </span>
                        <span className="font-bold text-stone-900">{log.tenantName}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-900">
                        {log.elecBefore !== undefined || log.elecAfter !== undefined
                          ? `${log.elecBefore || '0'} ➔ ${log.elecAfter || '0'}`
                          : '—'}
                      </td>
                      <td className="p-3 font-mono font-bold text-cyan-900">
                        {log.waterBefore !== undefined || log.waterAfter !== undefined
                          ? `${log.waterBefore || '0'} ➔ ${log.waterAfter || '0'}`
                          : '—'}
                      </td>
                      <td className="p-3 text-[11px] max-w-xs">
                        {log.valueBefore && (
                          <div className="text-stone-500 truncate">មុន: {log.valueBefore}</div>
                        )}
                        {log.valueAfter && (
                          <div className="text-stone-900 font-bold truncate">
                            ក្រោយ: {log.valueAfter}
                          </div>
                        )}
                        {log.notes && (
                          <div className="text-[10px] text-amber-800 italic">📝 {log.notes}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {log.roomNo && assignedRoomNumbers.includes(log.roomNo) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReadingRoom(log.roomNo);
                              if (log.monthYear) setSelectedMonthYear(log.monthYear);
                              setIsAdjustmentMode(true);
                              setActiveSection('elecReadings');
                            }}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[10px] px-2.5 py-1 rounded-lg cursor-pointer"
                          >
                            កែតម្រូវ / Adjust
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400">✓ Saved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
