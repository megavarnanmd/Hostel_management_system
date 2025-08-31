// server/migrate_add_admin.js
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./data.db');

// 1) ensure users table allows ADMIN in CHECK() constraint
const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
const createSQL = row?.sql || '';
const hasAdminRole = createSQL.includes("'ADMIN'");

if (!hasAdminRole) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;

    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT CHECK(role IN ('ADMIN','RESIDENT','WARDEN','TECH_HEAD','TECHNICIAN')) NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    INSERT INTO users_new (id,name,email,passwordHash,role,createdAt)
    SELECT id,name,email,passwordHash,role,createdAt FROM users;

    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;

    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
  console.log('✅ Migrated users table to include ADMIN role');
} else {
  console.log('ℹ️ users table already allows ADMIN');
}

// 2) upsert admin user with known password
const email = 'admin@demo.com';
const hash = bcrypt.hashSync('admin123', 10);

// SQLite upsert: update password+role if admin already exists
db.prepare(`
  INSERT INTO users (name,email,passwordHash,role)
  VALUES ('Admin User', @email, @hash, 'ADMIN')
  ON CONFLICT(email) DO UPDATE SET
    passwordHash = excluded.passwordHash,
    role = 'ADMIN'
`).run({ email, hash });

console.log('✅ Admin ensured: admin@demo.com / admin123');

// 3) show users for sanity
const users = db.prepare('SELECT id,name,email,role FROM users ORDER BY id').all();
console.table(users);
console.log('Done.');
