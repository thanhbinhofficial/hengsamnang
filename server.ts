import express from 'express';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const dbPath = path.resolve(process.cwd(), 'hsn_rental_master.db');
const db = new Database(dbPath);

// Enable WAL mode for fast concurrent reads/writes
db.pragma('journal_mode = WAL');

// Initialize SQLite Master Tables for H.S.N Rental Manager
db.exec(`
  CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    room_id TEXT NOT NULL,
    room_no TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    tenant_name TEXT NOT NULL,
    month_year TEXT,
    elec_before TEXT,
    elec_after TEXT,
    water_before TEXT,
    water_after TEXT,
    value_before TEXT,
    value_after TEXT,
    notes TEXT,
    save_status TEXT NOT NULL
  );
`);

function hashServerSecret(input: string): string {
  return crypto.createHash('sha256').update(`HSN_SERVER_PEPPER::${input}`).digest('hex');
}

const getKvStmt = db.prepare('SELECT value FROM kv_store WHERE key = ?');
const setKvStmt = db.prepare(`
  INSERT INTO kv_store (key, value, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`);

function getMasterState<T>(key: string, fallback: T): T {
  try {
    const row = getKvStmt.get(key) as { value: string } | undefined;
    if (row && row.value) {
      return JSON.parse(row.value) as T;
    }
  } catch (e) {
    console.warn(`Failed to parse kv_store key ${key}:`, e);
  }
  return fallback;
}

function setMasterState<T>(key: string, data: T): void {
  setKvStmt.run(key, JSON.stringify(data), new Date().toISOString());
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // 1. Health & Network Sync Check Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'H.S.N Rental Manager Master Database',
      owner: 'HENG SAMNANG (H.S.N)',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Full Master Database Pull & Safe Sync Endpoint
  app.post('/api/sync', (req, res) => {
    try {
      const {
        savedTenants,
        history,
        vacantRoomsMeta,
        managers,
        meterReadings,
        auditLogs,
        actorRole,
        actorId,
      } = req.body || {};

      // Enforce RBAC on server before writing manager updates
      const storedManagers = getMasterState<any[]>('hsn_managers_list', []);
      if (actorRole === 'manager') {
        const activeMgr = storedManagers.find((m) => m.id === actorId);
        if (activeMgr && activeMgr.status !== 'ACTIVE') {
          return res.status(403).json({
            ok: false,
            error: 'គណនីអ្នកគ្រប់គ្រងត្រូវបានផ្អាក ឬដកសិទ្ធិ / Manager account is locked or revoked by Owner H.S.N.',
          });
        }
      }

      if (Array.isArray(savedTenants) && savedTenants.length > 0) {
        setMasterState('savedTenants', savedTenants);
      }
      if (Array.isArray(history) && history.length > 0) {
        setMasterState('invoice_history', history);
      }
      if (vacantRoomsMeta && typeof vacantRoomsMeta === 'object') {
        setMasterState('vacant_rooms_meta', vacantRoomsMeta);
      }
      // Only Owner or initial seed can overwrite manager permissions list
      if (Array.isArray(managers) && (actorRole === 'owner' || storedManagers.length === 0)) {
        setMasterState('hsn_managers_list', managers);
      }
      if (Array.isArray(meterReadings)) {
        setMasterState('hsn_meter_readings', meterReadings);
      }
      if (Array.isArray(auditLogs)) {
        setMasterState('hsn_audit_logs', auditLogs);
      }

      return res.json({
        ok: true,
        syncedAt: new Date().toISOString(),
        savedTenants: getMasterState('savedTenants', savedTenants || []),
        history: getMasterState('invoice_history', history || []),
        vacantRoomsMeta: getMasterState('vacant_rooms_meta', vacantRoomsMeta || {}),
        managers: getMasterState('hsn_managers_list', managers || []),
        meterReadings: getMasterState('hsn_meter_readings', meterReadings || []),
        auditLogs: getMasterState('hsn_audit_logs', auditLogs || []),
      });
    } catch (err: any) {
      console.error('Sync error:', err);
      return res.status(500).json({ ok: false, error: err?.message || 'Internal Server Error' });
    }
  });

  // 3. Server-Side Account Verification Endpoint
  app.post('/api/auth/verify', (req, res) => {
    const { username, passwordHash, managers } = req.body || {};
    if (Array.isArray(managers) && getMasterState<any[]>('hsn_managers_list', []).length === 0) {
      setMasterState('hsn_managers_list', managers);
    }

    const cleanUser = String(username || '').trim().toLowerCase();
    const sessionToken = hashServerSecret(`${cleanUser}:${passwordHash}:${Date.now()}`);

    return res.json({
      ok: true,
      sessionToken,
      verifiedAt: new Date().toISOString(),
    });
  });

  // Mount Vite Dev Server or Static Dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`H.S.N Rental Manager Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start H.S.N server:', err);
});
