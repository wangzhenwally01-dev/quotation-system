import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const dbPath = path.resolve(config.databasePath);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqlDb: SqlJsDatabase;

// Synchronous-compatible wrapper around sql.js
class DatabaseWrapper {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  prepare(sql: string) {
    const db = this.db;
    return {
      run(...params: any[]) {
        db.run(sql, params);
        // Simulate lastInsertRowid
        const rowId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0;
        const changes = db.getRowsModified();
        return { lastInsertRowid: rowId, changes };
      },
      get(...params: any[]): any {
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const values = stmt.get();
          stmt.free();
          const row: any = {};
          cols.forEach((col, i) => { row[col] = values[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params: any[]): any[] {
        const results: any[] = [];
        const stmt = db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const values = stmt.get();
          const row: any = {};
          cols.forEach((col, i) => { row[col] = values[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      },
    };
  }

  exec(sql: string) {
    this.db.run(sql);
  }

  pragma(pragmas: string) {
    try {
      this.db.run(`PRAGMA ${pragmas}`);
    } catch {
      // sql.js doesn't support all pragmas
    }
  }

  save() {
    const data = this.db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

let wrapper: DatabaseWrapper;

export async function initDatabase(): Promise<DatabaseWrapper> {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  wrapper = new DatabaseWrapper(sqlDb);
  wrapper.pragma('foreign_keys = ON');

  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name  TEXT NOT NULL,
      phone         TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id        INTEGER NOT NULL,
      company_name    TEXT NOT NULL,
      contact_name    TEXT,
      contact_phone   TEXT,
      industry        TEXT,
      target_audience TEXT,
      current_status  TEXT,
      goals           TEXT,
      budget_range    TEXT,
      notes           TEXT,
      status          TEXT DEFAULT 'active',
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id       INTEGER NOT NULL,
      admin_id        INTEGER NOT NULL,
      config_json     TEXT NOT NULL,
      title           TEXT,
      status          TEXT DEFAULT 'draft',
      version         INTEGER DEFAULT 1,
      share_token     TEXT NOT NULL UNIQUE,
      share_url       TEXT,
      ai_generated_at DATETIME,
      published_at    DATETIME,
      expires_at      DATETIME,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS quotation_views (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id  INTEGER NOT NULL,
      view_ip       TEXT,
      user_agent    TEXT,
      viewed_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id)
    );

    CREATE TABLE IF NOT EXISTS service_templates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id      INTEGER NOT NULL,
      name          TEXT NOT NULL,
      key           TEXT,
      description   TEXT,
      unit_price    INTEGER DEFAULT 0,
      category      TEXT DEFAULT 'monthly',
      sort_order    INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS prompt_templates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id      INTEGER NOT NULL,
      name          TEXT NOT NULL,
      style_key     TEXT NOT NULL UNIQUE,
      description   TEXT,
      system_prompt TEXT NOT NULL,
      pricing_hint  TEXT,
      is_default    INTEGER DEFAULT 0,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );
  `);

  wrapper.save();
  return wrapper;
}

export function getDb(): DatabaseWrapper {
  if (!wrapper) throw new Error('Database not initialized. Call initDatabase() first.');
  return wrapper;
}

// Auto-save on process exit
process.on('exit', () => { if (wrapper) wrapper.save(); });
process.on('SIGINT', () => { if (wrapper) wrapper.save(); process.exit(); });
process.on('SIGTERM', () => { if (wrapper) wrapper.save(); process.exit(); });

export default {
  get prepare() { return getDb().prepare.bind(getDb()); },
  get exec() { return getDb().exec.bind(getDb()); },
  get save() { return getDb().save.bind(getDb()); },
};
