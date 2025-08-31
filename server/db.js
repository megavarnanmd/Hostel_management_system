import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./data.db');

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT CHECK(role IN ('ADMIN','RESIDENT','WARDEN','TECH_HEAD','TECHNICIAN')) NOT NULL,
  isBlocked INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo TEXT,
  status TEXT CHECK(status IN (
    'PENDING_WARDEN_APPROVAL',
    'REJECTED_BY_WARDEN',
    'SENT_TO_TECHNICIAN',
    'ASSIGNED_TO_TECHNICIAN',
    'COMPLETED_BY_TECHNICIAN',
    'RESIDENT_VERIFIED'
  )) NOT NULL DEFAULT 'PENDING_WARDEN_APPROVAL',
  residentId INTEGER NOT NULL,
  wardenId INTEGER,
  techHeadId INTEGER,
  assignedTechnicianId INTEGER,
  completedMessage TEXT,
  completedImage TEXT,
  -- NEW fields
  locationType TEXT,     -- 'ROOM' | 'AREA'
  locationText TEXT,     -- e.g., 'Room 102' OR 'Cafeteria sink'
  isFlagged INTEGER NOT NULL DEFAULT 0,
  misuseReportedBy INTEGER,
  misuseReason TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(residentId) REFERENCES users(id),
  FOREIGN KEY(wardenId) REFERENCES users(id),
  FOREIGN KEY(techHeadId) REFERENCES users(id),
  FOREIGN KEY(assignedTechnicianId) REFERENCES users(id)
);
`);

function seed() {
  const c = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (c > 0) return;
  const users = [
    {name:'Admin User', email:'admin@demo.com', password:'admin123', role:'ADMIN'},
    {name:'Ramu Resident', email:'resident@demo.com', password:'resident123', role:'RESIDENT'},
    {name:'Wendy Warden', email:'warden@demo.com', password:'warden123', role:'WARDEN'},
    {name:'Terry TechHead', email:'head@demo.com', password:'head123', role:'TECH_HEAD'},
    {name:'Tina Technician', email:'tech1@demo.com', password:'tech123', role:'TECHNICIAN'},
    {name:'Tom Technician', email:'tech2@demo.com', password:'tech123', role:'TECHNICIAN'}
  ];
  const ins = db.prepare('INSERT INTO users (name,email,passwordHash,role) VALUES (?,?,?,?)');
  for (const u of users) ins.run(u.name, u.email, bcrypt.hashSync(u.password,10), u.role);
}
seed();

// ensure admin exists even if DB predated admin
const admin = db.prepare("SELECT id FROM users WHERE email='admin@demo.com'").get();
if (!admin) {
  const h = bcrypt.hashSync('admin123',10);
  db.prepare('INSERT INTO users (name,email,passwordHash,role) VALUES (?,?,?,?)')
    .run('Admin User','admin@demo.com',h,'ADMIN');
}

export default db;
