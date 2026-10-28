import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  Plus,
  History,
  CheckCircle2,
  AlertTriangle,
  Eye,
  UserCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { ManagerAccount, AuditLogEntry, ManagerPermissions } from '../types/manager';
import { hashPasswordSync } from '../utils/security';

interface OwnerManagersPanelProps {
  managers: ManagerAccount[];
  onUpdateManagers: (updated: ManagerAccount[], logNote?: string) => void;
  auditLogs: AuditLogEntry[];
  allRoomNumbers: string[];
  formatRoomBadge: (roomNo: string | number | undefined | null) => string;
  onOpenManagerDashboardPreview: (manager: ManagerAccount) => void;
  activeSubTab: 'list' | 'share' | 'audit';
  setActiveSubTab: (tab: 'list' | 'share' | 'audit') => void;
  isOnline: boolean;
  lastSyncedAt: string | null;
}

export const OwnerManagersPanel: React.FC<OwnerManagersPanelProps> = ({
  managers,
  onUpdateManagers,
  auditLogs,
  allRoomNumbers,
  formatRoomBadge,
  onOpenManagerDashboardPreview,
  activeSubTab,
  setActiveSubTab,
  isOnline,
  lastSyncedAt,
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    managers[0]?.id || 'mgr-nguon-sopheak-01'
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMgrName, setNewMgrName] = useState('');
  const [newMgrNameKh, setNewMgrNameKh] = useState('');
  const [newMgrUsername, setNewMgrUsername] = useState('');
  const [newMgrPassword, setNewMgrPassword] = useState('');
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [resetPwdTargetId, setResetPwdTargetId] = useState<string | null>(null);
  const [auditFilterActor, setAuditFilterActor] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedManager =
    managers.find((m) => m.id === selectedManagerId) || managers[0];

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusBanner({ type, text });
    setTimeout(() => setStatusBanner(null), 4500);
  };

  const handleTogglePermission = (mgrId: string, permKey: keyof ManagerPermissions) => {
    if (permKey === 'canDeleteData') return; // Never allow manager to delete master data
    const updated = managers.map((m) => {
      if (m.id !== mgrId) return m;
      const nextVal = !m.permissions[permKey];
      return {
        ...m,
        updatedAt: new Date().toISOString(),
        permissions: {
          ...m.permissions,
          [permKey]: nextVal,
        },
      };
    });
    const target = updated.find((m) => m.id === mgrId);
    onUpdateManagers(
      updated,
      `Updated permission "${permKey}" for ${target?.displayName} to ${target?.permissions[permKey]}`
    );
    showNotice(
      'success',
      `បានធ្វើបច្ចុប្បន្នភាពសិទ្ធិរបស់ ${target?.displayName} ដោយជោគជ័យ! / Updated permissions for ${target?.displayName} successfully!`
    );
  };

  const handleToggleRoomAssignment = (mgrId: string, roomNo: string) => {
    const updated = managers.map((m) => {
      if (m.id !== mgrId) return m;
      const exists = m.assignedRooms.includes(roomNo);
      const nextRooms = exists
        ? m.assignedRooms.filter((r) => r !== roomNo)
        : [...m.assignedRooms, roomNo].sort((a, b) => (parseInt(a) || 99) - (parseInt(b) || 99));
      return {
        ...m,
        assignedRooms: nextRooms,
        updatedAt: new Date().toISOString(),
      };
    });
    const target = updated.find((m) => m.id === mgrId);
    onUpdateManagers(
      updated,
      `Updated assigned rooms for ${target?.displayName}: ${target?.assignedRooms.map((r) => formatRoomBadge(r)).join(', ')}`
    );
  };

  const handleSelectAllRooms = (mgrId: string, selectAll: boolean) => {
    const baseRooms = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
    const updated = managers.map((m) => {
      if (m.id !== mgrId) return m;
      return {
        ...m,
        assignedRooms: selectAll ? baseRooms : [],
        updatedAt: new Date().toISOString(),
      };
    });
    onUpdateManagers(
      updated,
      `${selectAll ? 'Assigned all rooms (1-16)' : 'Cleared assigned rooms'} for manager`
    );
    showNotice(
      'success',
      selectAll
        ? 'បានផ្តល់សិទ្ធិគ្រប់គ្រងបន្ទប់ទាំងអស់ (RM-01 ដល់ RM-16)! / Assigned all rooms (RM-01 to RM-16)!'
        : 'បានដកសិទ្ធិបន្ទប់ទាំងអស់បណ្តោះអាសន្ន! / Cleared assigned rooms!'
    );
  };

  const handleSetAccountStatus = (mgrId: string, status: 'ACTIVE' | 'LOCKED' | 'REVOKED') => {
    const updated = managers.map((m) => {
      if (m.id !== mgrId) return m;
      return {
        ...m,
        status,
        updatedAt: new Date().toISOString(),
      };
    });
    const target = updated.find((m) => m.id === mgrId);
    onUpdateManagers(
      updated,
      `Changed account status of ${target?.displayName} to ${status}`
    );
    showNotice(
      'success',
      `ស្ថានភាពគណនីរបស់ ${target?.displayName} ត្រូវបានប្តូរទៅជា ${status}! / Account status changed to ${status}!`
    );
  };

  const handleResetManagerPassword = (mgrId: string) => {
    if (!resetPwdValue.trim() || resetPwdValue.trim().length < 4) {
      showNotice('error', 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មីយ៉ាងតិច ៤ ខ្ទង់! / Password must be at least 4 characters!');
      return;
    }
    if (resetPwdValue.trim() === '123456') {
      showNotice(
        'error',
        'អ្នកគ្រប់គ្រងមិនអាចប្រើពាក្យសម្ងាត់ដូចម្ចាស់ផ្ទះ (H.S.N) បានទេ! / Manager cannot share the same password as Owner H.S.N!'
      );
      return;
    }
    const newHash = hashPasswordSync(resetPwdValue.trim());
    const updated = managers.map((m) => {
      if (m.id !== mgrId) return m;
      return {
        ...m,
        passwordHash: newHash,
        passwordHint: `Updated on ${new Date().toISOString().slice(0, 10)} (Encrypted SHA-256)`,
        updatedAt: new Date().toISOString(),
      };
    });
    const target = updated.find((m) => m.id === mgrId);
    onUpdateManagers(updated, `Reset encrypted password for manager ${target?.displayName}`);
    setResetPwdTargetId(null);
    setResetPwdValue('');
    showNotice(
      'success',
      `បានប្តូរពាក្យសម្ងាត់ថ្មី (Encrypted) សម្រាប់ ${target?.displayName} ដោយជោគជ័យ! / Password updated & hashed successfully!`
    );
  };

  const handleCreateManager = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newMgrUsername.trim().toLowerCase();
    const cleanName = newMgrName.trim();
    const cleanPass = newMgrPassword.trim();

    if (!cleanUser || !cleanName || !cleanPass) {
      showNotice('error', 'សូមបំពេញព័ត៌មានគណនីអ្នកគ្រប់គ្រងឱ្យបានគ្រប់គ្រាន់! / Please fill all required fields!');
      return;
    }
    if (cleanUser === 'admin' || cleanUser === 'hsn' || cleanPass === '123456') {
      showNotice(
        'error',
        'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនអាចជាន់គ្នាជាមួយម្ចាស់ផ្ទះ H.S.N បានទេ! / Manager credentials must be separate from Owner H.S.N!'
      );
      return;
    }
    if (managers.some((m) => m.username.toLowerCase() === cleanUser)) {
      showNotice('error', 'ឈ្មោះអ្នកប្រើប្រាស់នេះមានរួចហើយ! / Username already exists!');
      return;
    }

    const newAccount: ManagerAccount = {
      id: `mgr-${Date.now()}`,
      username: cleanUser,
      displayName: cleanName,
      displayNameKh: newMgrNameKh.trim() || cleanName,
      role: 'manager',
      passwordHash: hashPasswordSync(cleanPass),
      passwordHint: `Username: ${cleanUser} (SHA-256 Hashed)`,
      status: 'ACTIVE',
      assignedRooms: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'],
      permissions: {
        canViewAssignedRooms: true,
        canAddTenant: true,
        canEditExistingTenant: true,
        canEnterMeterReadings: true,
        canEditRentOrContract: false,
        canDeleteData: false,
      },
      invitedBy: 'HENG SAMNANG (H.S.N)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...managers, newAccount];
    onUpdateManagers(updated, `Owner HENG SAMNANG (H.S.N) invited new manager: ${cleanName} (@${cleanUser})`);
    setSelectedManagerId(newAccount.id);
    setNewMgrName('');
    setNewMgrNameKh('');
    setNewMgrUsername('');
    setNewMgrPassword('');
    setShowInviteModal(false);
    showNotice(
      'success',
      `បានបង្កើតគណនីអ្នកគ្រប់គ្រង "${cleanName}" ដោយជោគជ័យ! / Created manager account "${cleanName}" successfully!`
    );
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchActor =
      auditFilterActor === 'ALL' ||
      log.actorName.toLowerCase().includes(auditFilterActor.toLowerCase());
    const q = auditSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      log.tenantName.toLowerCase().includes(q) ||
      log.roomId.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      (log.notes || '').toLowerCase().includes(q);
    return matchActor && matchSearch;
  });

  return (
    <div className="w-full bg-white shadow-2xl rounded-xl overflow-hidden border border-stone-200 font-sans text-stone-800">
      {/* Top Royal Emerald & Gold Header */}
      <div className="bg-gradient-to-r from-[#092B1B] via-[#11442B] to-[#092B1B] px-6 py-5 text-white border-b-4 border-amber-400">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <span>OWNER ACCESS CONTROL • HENG SAMNANG (H.S.N)</span>
                <span>•</span>
                <span className={isOnline ? 'text-emerald-300' : 'text-red-300'}>
                  {isOnline ? '● ONLINE & SYNCED' : '● OFFLINE MODE'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                គ្រប់គ្រងសិទ្ធិអ្នកគ្រប់គ្រង និងការចែករំលែកសិទ្ធិ (Managers & Share Access)
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1">
                ម្ចាស់ផ្ទះ <strong>HENG SAMNANG (H.S.N)</strong> អាចបង្កើតគណនី និងផ្តល់សិទ្ធិជូនអ្នកគ្រប់គ្រង <strong>Nguon Sopheak</strong> ដោយមានគណនីដាច់ដោយឡែក និងតាមដានប្រវត្តិបញ្ចូលទិន្នន័យ។
              </p>
            </div>
          </div>

          {/* Sub-navigation tabs matching Prompt Requirement 1 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('list')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeSubTab === 'list'
                  ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-md'
                  : 'bg-emerald-950/70 text-emerald-100 border-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>បញ្ជីអ្នកគ្រប់គ្រង / Manager List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('share')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeSubTab === 'share'
                  ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-md'
                  : 'bg-emerald-950/70 text-emerald-100 border-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>ចែករំលែកសិទ្ធិ / Share Access</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeSubTab === 'audit'
                  ? 'bg-amber-400 text-stone-950 border-amber-200 shadow-md'
                  : 'bg-emerald-950/70 text-emerald-100 border-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ប្រវត្តិបញ្ចូលទិន្នន័យ / Audit Log ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {statusBanner && (
          <div
            className={`p-4 rounded-xl border-2 flex items-center justify-between gap-3 text-xs font-bold ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-red-50 border-red-500 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-stone-500 hover:text-stone-800 font-black px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: MANAGER LIST (បញ្ជីអ្នកគ្រប់គ្រង / Manager List) */}
        {activeSubTab === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  បញ្ជីគណនីម្ចាស់ផ្ទះ និងអ្នកគ្រប់គ្រង (Owner & Manager Accounts)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  ប្រព័ន្ធបែងចែកសិទ្ធិ ២ កម្រិត៖ ម្ចាស់ផ្ទះ <strong>HENG SAMNANG (H.S.N)</strong> និងអ្នកគ្រប់គ្រង <strong>Nguon Sopheak</strong>។
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(!showInviteModal)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>អញ្ជើញអ្នកគ្រប់គ្រងថ្មី / Invite Manager</span>
              </button>
            </div>

            {/* Invite New Manager Modal/Card */}
            {showInviteModal && (
              <form
                onSubmit={handleCreateManager}
                className="bg-emerald-50/80 border-2 border-emerald-400 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <h4 className="text-sm font-extrabold text-emerald-950">
                    បង្កើតគណនីអ្នកគ្រប់គ្រងថ្មី (Create New Manager Account)
                  </h4>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    SHA-256 Encrypted Password
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      ឈ្មោះបង្ហាញ (Display Name - EN) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nguon Sopheak"
                      value={newMgrName}
                      onChange={(e) => setNewMgrName(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      ឈ្មោះភាសាខ្មែរ (Khmer Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ងួន សុភ័ក្រ"
                      value={newMgrNameKh}
                      onChange={(e) => setNewMgrNameKh(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      ឈ្មោះគណនីចូល (Login Username) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. sopheak2"
                      value={newMgrUsername}
                      onChange={(e) => setNewMgrUsername(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-mono font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      ពាក្យសម្ងាត់ដាច់ដោយឡែក (Password) *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 4 chars (Not 123456)"
                      value={newMgrPassword}
                      onChange={(e) => setNewMgrPassword(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg p-2 font-bold text-stone-900"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                  >
                    បោះបង់ / Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-5 py-2 rounded-lg shadow-sm cursor-pointer"
                  >
                    បង្កើតគណនី និងផ្តល់សិទ្ធិ / Create & Grant Access
                  </button>
                </div>
              </form>
            )}

            {/* Tier A: Owner Master Card */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-xl p-5 border-2 border-amber-400 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center shrink-0 border-2 border-white">
                  H.S.N
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-amber-300">
                      HENG SAMNANG (H.S.N)
                    </span>
                    <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      ម្ចាស់ផ្ទះ • OWNER (FULL ACCESS)
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1">
                    មានសិទ្ធិគ្រប់គ្រងទាំងស្រុង៖ មើល និងកែសម្រួលទិន្នន័យគ្រប់បន្ទប់ បន្ថែម/បញ្ចប់កិច្ចសន្យា ផ្តល់ ឬដកសិទ្ធិអ្នកគ្រប់គ្រង និងពិនិត្យប្រវត្តិបញ្ចូលទិន្នន័យ។
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 font-mono text-xs bg-stone-950/80 border border-stone-700 px-3.5 py-2 rounded-xl">
                <div className="text-stone-400 text-[10px]">LOGIN USERNAME</div>
                <div className="text-emerald-400 font-bold">admin / hsn</div>
              </div>
            </div>

            {/* Tier B: Manager Accounts Cards (Nguon Sopheak default) */}
            <div className="grid grid-cols-1 gap-4">
              {managers.map((mgr) => (
                <div
                  key={mgr.id}
                  className={`rounded-xl border-2 p-5 transition-all ${
                    mgr.status === 'ACTIVE'
                      ? 'bg-white border-emerald-500/70 shadow-md'
                      : 'bg-stone-100 border-stone-300 opacity-85'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                        {mgr.displayName
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black text-stone-900">{mgr.displayName}</h4>
                          <span className="text-sm font-bold text-emerald-800 font-moul">
                            ({mgr.displayNameKh})
                          </span>
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              mgr.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : mgr.status === 'LOCKED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}
                          >
                            {mgr.status === 'ACTIVE'
                              ? '● សកម្ម / ACTIVE MANAGER'
                              : mgr.status === 'LOCKED'
                              ? '🔒 ផ្អាកបណ្តោះអាសន្ន / LOCKED'
                              : '⛔ ដកសិទ្ធិ / REVOKED'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-stone-600">
                          <span className="bg-stone-100 border border-stone-300 px-2.5 py-0.5 rounded font-mono font-bold text-stone-900">
                            👤 Username: <strong className="text-emerald-700">{mgr.username}</strong>
                          </span>
                          <span className="bg-stone-100 border border-stone-300 px-2.5 py-0.5 rounded font-mono text-stone-700">
                            🔑 Password: <strong>បំប្លែងកូដសម្ងាត់ (SHA-256 Hashed • ដាច់ដោយឡែកពីម្ចាស់ផ្ទះ)</strong>
                          </span>
                          <span>
                            អញ្ជើញដោយ / Invited by: <strong>{mgr.invitedBy}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Owner H.S.N */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenManagerDashboardPreview(mgr)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>បើកទំព័រ {mgr.displayName} / Open Manager Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedManagerId(mgr.id);
                          setActiveSubTab('share');
                        }}
                        className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Key className="w-4 h-4" />
                        <span>កំណត់សិទ្ធិ / Configure Access</span>
                      </button>

                      {mgr.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => handleSetAccountStatus(mgr.id, 'LOCKED')}
                          className="bg-stone-100 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>ចាក់សោ / Lock</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetAccountStatus(mgr.id, 'ACTIVE')}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-400 font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>បើកសិទ្ធិវិញ / Activate</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Rooms & Active Permissions Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                      <div className="font-extrabold text-stone-700 mb-2 flex items-center justify-between">
                        <span>១. បន្ទប់ដែលទទួលខុសត្រូវ (Assigned Rooms):</span>
                        <span className="text-emerald-700 font-mono">
                          {mgr.assignedRooms.length} បន្ទប់ / Rooms
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mgr.assignedRooms.map((rNo) => (
                          <span
                            key={`mgr-badge-${mgr.id}-${rNo}`}
                            className="bg-emerald-100 border border-emerald-300 text-emerald-950 font-black px-2 py-0.5 rounded text-[11px] font-sans"
                          >
                            {formatRoomBadge(rNo)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2">
                      <div className="font-extrabold text-stone-700">
                        ២. សិទ្ធិប្រើប្រាស់បច្ចុប្បន្ន (Granted Permissions):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            mgr.permissions.canEnterMeterReadings
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {mgr.permissions.canEnterMeterReadings ? '✓' : '✕'} កត់ត្រាទឹក-ភ្លើង / Meter Readings
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            mgr.permissions.canAddTenant
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {mgr.permissions.canAddTenant ? '✓' : '✕'} បន្ថែមភ្ញៀវថ្មី / Add New Tenant
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            mgr.permissions.canEditExistingTenant
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {mgr.permissions.canEditExistingTenant ? '✓' : '✕'} កែព័ត៌មានភ្ញៀវចាស់ / Update Tenant
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            mgr.permissions.canEditRentOrContract
                              ? 'bg-amber-100 border-amber-300 text-amber-900'
                              : 'bg-stone-100 border-stone-300 text-stone-500'
                          }`}
                        >
                          {mgr.permissions.canEditRentOrContract
                            ? '✓ អនុញ្ញាតកែតម្លៃបន្ទប់/ប្រាក់កក់'
                            : '🔒 មិនអនុញ្ញាតកែតម្លៃបន្ទប់/ប្រាក់កក់ (Rent/Deposit Locked)'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 border border-red-200 text-red-700">
                          ⛔ មិនអាចលុបទិន្នន័យដើម (Cannot Delete Master Data)
                        </span>
                      </div>

                      {/* Password Reset Inline */}
                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
                        {resetPwdTargetId === mgr.id ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="password"
                              placeholder="ពាក្យសម្ងាត់ថ្មី / New password..."
                              value={resetPwdValue}
                              onChange={(e) => setResetPwdValue(e.target.value)}
                              className="flex-1 bg-white border border-stone-300 rounded px-2 py-1 text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => handleResetManagerPassword(mgr.id)}
                              className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded text-xs cursor-pointer"
                            >
                              រក្សាទុក / Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetPwdTargetId(null);
                                setResetPwdValue('');
                              }}
                              className="bg-stone-200 text-stone-700 font-bold px-2 py-1 rounded text-xs cursor-pointer"
                            >
                              បោះបង់
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setResetPwdTargetId(mgr.id)}
                            className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Key className="w-3 h-3" />
                            ប្តូរពាក្យសម្ងាត់ថ្មីសម្រាប់ {mgr.displayName} (Reset Password)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SHARE ACCESS & PERMISSION MATRIX (ចែករំលែកសិទ្ធិ / Share Access) */}
        {activeSubTab === 'share' && selectedManager && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-600" />
                  ចែករំលែកសិទ្ធិ និងកំណត់បន្ទប់ទទួលខុសត្រូវ (Share Access & Room Permissions)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  កំណត់សិទ្ធិលម្អិតសម្រាប់ <strong>{selectedManager.displayName}</strong>។ រាល់ការផ្លាស់ប្តូរត្រូវបានអនុវត្តភ្លាមៗ។
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-stone-600">ជ្រើសរើសអ្នកគ្រប់គ្រង:</label>
                <select
                  value={selectedManager.id}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="bg-emerald-50 border-2 border-emerald-500 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-950"
                >
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} (@{m.username}) — {m.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Permission Toggles (7 cols) */}
              <div className="lg:col-span-7 bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-extrabold text-stone-800 border-b border-stone-200 pb-2">
                  ១. កំណត់សិទ្ធិប្រតិបត្តិការ (Granular Permission Controls)
                </h4>

                {[
                  {
                    key: 'canViewAssignedRooms' as const,
                    titleKh: 'មើលបញ្ជីបន្ទប់ និងភ្ញៀវដែលត្រូវគ្រប់គ្រង',
                    titleEn: 'View Assigned Rooms & Active Tenants Directory',
                    desc: 'អនុញ្ញាតឱ្យមើលព័ត៌មានបន្ទប់ និងភ្ញៀវនៅក្នុងដែនកំណត់ដែលម្ចាស់ផ្ទះប្រគល់ជូន។',
                  },
                  {
                    key: 'canEnterMeterReadings' as const,
                    titleKh: 'កត់ត្រាលេខកុងទ័រទឹក និងភ្លើងប្រចាំខែ',
                    titleEn: 'Enter Monthly Electricity & Water Meter Readings',
                    desc: 'អនុញ្ញាតឱ្យបញ្ចូលលេខអគ្គិសនី និងទឹកថ្មី គណនាស្វ័យប្រវត្តិ និងធ្វើបច្ចុប្បន្នភាពចូលទិន្នន័យដើមរបស់ H.S.N។',
                  },
                  {
                    key: 'canAddTenant' as const,
                    titleKh: 'បញ្ចូលភ្ញៀវជួលថ្មីចូលបន្ទប់ទំនេរ (១ ដល់ ១៦)',
                    titleEn: 'Add New Tenants into Vacant Rooms (Rooms 1–16)',
                    desc: 'អនុញ្ញាតឱ្យចុះឈ្មោះភ្ញៀវថ្មី (ការពារមិនឱ្យបង្កើតកិច្ចសន្យាជាន់គ្នាលើបន្ទប់ដែលមានភ្ញៀវកំពុងស្នាក់នៅ)។',
                  },
                  {
                    key: 'canEditExistingTenant' as const,
                    titleKh: 'ស្វែងរក និងធ្វើបច្ចុប្បន្នភាពព័ត៌មានភ្ញៀវចាស់',
                    titleEn: 'Search & Update Existing Tenant Contact/Notes',
                    desc: 'អនុញ្ញាតឱ្យកែសម្រួលលេខទូរស័ព្ទ លេខអត្តសញ្ញាណប័ណ្ណ និងកំណត់ចំណាំរបស់ភ្ញៀវបច្ចុប្បន្ន។',
                  },
                  {
                    key: 'canCheckOutTenant' as const,
                    titleKh: 'លុបព័ត៌មានភ្ញៀវចាស់ដែលឈប់ជួល (រក្សាទុកចំណូលបូកសរុប)',
                    titleEn: 'Check-Out / Remove Vacated Tenant (Preserving Monthly Landlord Revenue)',
                    desc: 'អនុញ្ញាតឱ្យផ្ទេរបន្ទប់ទៅជាបន្ទប់ទំនេរនៅពេលភ្ញៀវឈប់ជួល ដោយរក្សាទុកចំណូលដែលបានជួលពីមុនទាំងអស់នៅក្នុងតារាងចំណូលម្ចាស់ផ្ទះ។',
                  },
                  {
                    key: 'canEditRentOrContract' as const,
                    titleKh: 'កែប្រែតម្លៃជួលបន្ទប់ ប្រាក់កក់ ឬព័ត៌មានកិច្ចសន្យា',
                    titleEn: 'Modify Monthly Rent Price, Security Deposit, or Contract Terms',
                    desc: 'ប្រសិនបើបិទ (បិទជាលំនាំដើម) អ្នកគ្រប់គ្រងមិនអាចកែតម្លៃបន្ទប់ ប្រាក់កក់ ឬតម្លៃឯកតាទឹក-ភ្លើងដោយចិត្តឯងបានទេ។',
                  },
                ].map((item) => {
                  const enabled = Boolean(selectedManager.permissions[item.key]);
                  return (
                    <div
                      key={item.key}
                      className="bg-white border border-stone-200 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-2xs"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-stone-900">
                          {item.titleKh} <span className="text-emerald-700">/ {item.titleEn}</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(selectedManager.id, item.key)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer shrink-0 border ${
                          enabled
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-stone-200 text-stone-600 border-stone-300'
                        }`}
                      >
                        {enabled ? '✓ បើកសិទ្ធិ (GRANTED)' : '✕ បិទសិទ្ធិ (RESTRICTED)'}
                      </button>
                    </div>
                  );
                })}

                {/* Locked Master Protection Rule */}
                <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-extrabold text-red-900">
                      ការពារទិន្នន័យដើម និងសិទ្ធិម្ចាស់ផ្ទះ (Master Data & Owner Protection)
                    </div>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      អ្នកគ្រប់គ្រងមិនអាចលុបទិន្នន័យដើម មិនអាចលុបប្រវត្តិកត់ត្រាទឹក-ភ្លើង និងមិនអាចកែប្រែសិទ្ធិម្ចាស់ផ្ទះ H.S.N បានឡើយ។
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-black shrink-0">
                    🔒 PROTECTED
                  </span>
                </div>
              </div>

              {/* Assigned Rooms Grid (5 cols) */}
              <div className="lg:col-span-5 bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="text-sm font-extrabold text-stone-800">
                    ២. បន្ទប់ដែលអនុញ្ញាតឱ្យគ្រប់គ្រង (Assigned Rooms 1–16)
                  </h4>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectAllRooms(selectedManager.id, true)}
                      className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      ជ្រើសទាំងអស់ (All 1–16)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllRooms(selectedManager.id, false)}
                      className="text-[10px] font-bold bg-stone-200 text-stone-700 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      ដកទាំងអស់ (None)
                    </button>
                  </div>
                </div>

                <p className="text-xs text-stone-500">
                  ចុចលើលេខបន្ទប់ដើម្បីផ្តល់ ឬដកសិទ្ធិគ្រប់គ្រងបន្ទប់នោះសម្រាប់{' '}
                  <strong>{selectedManager.displayName}</strong>៖
                </p>

                <div className="grid grid-cols-4 gap-2.5">
                  {allRoomNumbers.map((rNo) => {
                    const isAssigned = selectedManager.assignedRooms.includes(rNo);
                    return (
                      <button
                        key={`assign-room-${rNo}`}
                        type="button"
                        onClick={() => handleToggleRoomAssignment(selectedManager.id, rNo)}
                        className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isAssigned
                            ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                            : 'bg-white border-stone-200 text-stone-400 hover:border-stone-400'
                        }`}
                      >
                        <span className="text-xs font-black font-sans">
                          {formatRoomBadge(rNo)}
                        </span>
                        <span className="text-[9px] font-bold">
                          {isAssigned ? '✓ ផ្តល់សិទ្ធិ' : 'មិនផ្តល់សិទ្ធិ'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Account Status Control Box */}
                <div className="pt-4 border-t border-stone-200 space-y-2">
                  <div className="text-xs font-extrabold text-stone-700">
                    ៣. ស្ថានភាពគណនីអ្នកគ្រប់គ្រង (Account Access Status):
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAccountStatus(selectedManager.id, 'ACTIVE')}
                      className={`py-2 px-2 rounded-xl text-xs font-black border cursor-pointer ${
                        selectedManager.status === 'ACTIVE'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      ✓ សកម្ម (ACTIVE)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAccountStatus(selectedManager.id, 'LOCKED')}
                      className={`py-2 px-2 rounded-xl text-xs font-black border cursor-pointer ${
                        selectedManager.status === 'LOCKED'
                          ? 'bg-amber-500 text-stone-950 border-amber-600'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      🔒 ចាក់សោ (LOCKED)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAccountStatus(selectedManager.id, 'REVOKED')}
                      className={`py-2 px-2 rounded-xl text-xs font-black border cursor-pointer ${
                        selectedManager.status === 'REVOKED'
                          ? 'bg-red-600 text-white border-red-700'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      ⛔ ដកសិទ្ធិ (REVOKED)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOG (ប្រវត្តិការបញ្ចូលទិន្នន័យ / Manager Entry History & Audit Log) */}
        {activeSubTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-700" />
                  ប្រវត្តិការបញ្ចូលទិន្នន័យ និងកំណត់ត្រាត្រួតពិនិត្យ (Manager Entry Audit Log)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  កត់ត្រាអ្នកបញ្ចូល ពេលវេលា បន្ទប់ ភ្ញៀវ លេខទឹក-ភ្លើងមុន និងក្រោយកែប្រែ និងស្ថានភាពរក្សាទុក។
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកបន្ទប់ ឈ្មោះភ្ញៀវ... / Search..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="bg-stone-50 border border-stone-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-800"
                  />
                </div>
                <select
                  value={auditFilterActor}
                  onChange={(e) => setAuditFilterActor(e.target.value)}
                  className="bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-800"
                >
                  <option value="ALL">គ្រប់គណនីទាំងអស់ / All Accounts</option>
                  <option value="Nguon Sopheak">Nguon Sopheak (Manager)</option>
                  <option value="HENG SAMNANG">HENG SAMNANG (Owner)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-900 text-white uppercase text-[10px] font-extrabold">
                    <th className="p-3 border-b border-stone-700">ពេលវេលា / Time</th>
                    <th className="p-3 border-b border-stone-700">អ្នកបញ្ចូល / Actor</th>
                    <th className="p-3 border-b border-stone-700">ប្រភេទ / Action</th>
                    <th className="p-3 border-b border-stone-700">បន្ទប់ & ភ្ញៀវ / Room & Tenant</th>
                    <th className="p-3 border-b border-stone-700">ភ្លើង (មុន➔ក្រោយ)</th>
                    <th className="p-3 border-b border-stone-700">ទឹក (មុន➔ក្រោយ)</th>
                    <th className="p-3 border-b border-stone-700">តម្លៃមុន ➔ ក្រោយ / Details</th>
                    <th className="p-3 border-b border-stone-700">ស្ថានភាព / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-stone-400">
                        មិនទាន់មានប្រវត្តិកត់ត្រាទេ / No audit log entries found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-emerald-50/40">
                        <td className="p-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-GB', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3">
                          <div className="font-extrabold text-stone-900">{log.actorName}</div>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                              log.actorRole === 'owner'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-[10px] bg-stone-100 border border-stone-300 px-2 py-0.5 rounded text-stone-800">
                            {log.actionType}
                          </span>
                          {log.monthYear && (
                            <div className="text-[10px] text-stone-500 mt-0.5 font-mono">
                              ខែ/Month: {log.monthYear}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                              {log.roomId}
                            </span>
                            <span className="font-bold text-stone-900">{log.tenantName}</span>
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">ID: {log.tenantId}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {log.elecBefore !== undefined || log.elecAfter !== undefined ? (
                            <span className="text-blue-900 font-bold">
                              {log.elecBefore || '0'} ➔ {log.elecAfter || '0'} KWH
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {log.waterBefore !== undefined || log.waterAfter !== undefined ? (
                            <span className="text-cyan-900 font-bold">
                              {log.waterBefore || '0'} ➔ {log.waterAfter || '0'} M³
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3 text-[11px] max-w-xs">
                          {log.valueBefore && (
                            <div className="text-stone-500 truncate" title={log.valueBefore}>
                              មុន/Before: {log.valueBefore}
                            </div>
                          )}
                          {log.valueAfter && (
                            <div className="text-stone-900 font-bold truncate" title={log.valueAfter}>
                              ក្រោយ/After: {log.valueAfter}
                            </div>
                          )}
                          {log.notes && (
                            <div className="text-[10px] text-amber-800 italic mt-0.5">
                              📝 {log.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            ✓ {log.saveStatus}
                          </span>
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
    </div>
  );
};
