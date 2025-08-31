// reset_pw.js
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database(path.join(__dirname, "data.db"));

function usage() {
  console.log("Usage:");
  console.log("  node reset_pw.js <email> <newPassword>");
  console.log("Example:");
  console.log("  node reset_pw.js resident@demo.com NewPass123!");
  process.exit(1);
}

const [, , email, newPw] = process.argv;
if (!email || !newPw) usage();

const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email);
if (!user) {
  console.error("User not found:", email);
  process.exit(2);
}

const hash = bcrypt.hashSync(newPw, 10);

// try to flip passwordResetRequired if that column exists; ignore if not
try {
  db.prepare("UPDATE users SET passwordHash = ?, passwordResetRequired = 1 WHERE id = ?").run(hash, user.id);
} catch {
  db.prepare("UPDATE users SET passwordHash = ? WHERE id = ?").run(hash, user.id);
}

console.log(`✅ Password updated for ${email}. New password = "${newPw}"`);
