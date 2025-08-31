// check_users.js
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, "data.db"));

const rows = db.prepare(`
  SELECT id, name, email, role, isBlocked, datetime(createdAt) AS createdAt
  FROM users
  ORDER BY id
`).all();

console.table(rows);

// if you really want to see the (hashed) passwords:
const hashes = db.prepare(`SELECT id, email, passwordHash FROM users ORDER BY id`).all();
console.log("\nHashed passwords (bcrypt — not reversible):");
console.table(hashes.map(r => ({ id: r.id, email: r.email, hashStart: r.passwordHash.slice(0, 20) + "..." })));
