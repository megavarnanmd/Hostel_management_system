import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_super_secret_jwt_key_change_me';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve('./uploads')));

// ensure uploads dir
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({ storage });

// ==== helpers ====
function sign(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
function notify(userId, message) {
  db.prepare('INSERT INTO notifications (userId, message) VALUES (?, ?)').run(userId, message);
}

// safe delete (break references)
function safeDeleteUser(id) {
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
  if (!user) return { ok: true, reason: 'missing' };

  const tx = db.transaction((uid, role) => {
    db.prepare('UPDATE complaints SET assignedTechnicianId = NULL WHERE assignedTechnicianId = ?').run(uid);
    db.prepare('UPDATE complaints SET wardenId = NULL WHERE wardenId = ?').run(uid);
    db.prepare('UPDATE complaints SET techHeadId = NULL WHERE techHeadId = ?').run(uid);
    if (role === 'RESIDENT') {
      db.prepare('DELETE FROM complaints WHERE residentId = ?').run(uid);
    }
    db.prepare('DELETE FROM notifications WHERE userId = ?').run(uid);
    db.prepare('DELETE FROM users WHERE id = ?').run(uid);
  });

  tx(user.id, user.role);
  return { ok: true };
}

// ==== AUTH ====
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'Invalid email or password' });
  if (user.isBlocked) return res.status(403).json({ error: 'Account blocked. Contact admin.' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid email or password' });
  const token = sign(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Optional register (resident)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'Email already in use' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name,email,passwordHash,role) VALUES (?,?,?,?)')
    .run(name, email, hash, 'RESIDENT');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ==== ADMIN: user management ====
app.get('/api/admin/users', auth, requireRole('ADMIN'), (req, res) => {
  const list = db.prepare('SELECT id, name, email, role, isBlocked, createdAt FROM users ORDER BY id ASC').all();
  res.json(list);
});
app.post('/api/admin/users', auth, requireRole('ADMIN'), (req, res) => {
  const { name, email, password, role } = req.body;
  const allowed = ['ADMIN', 'RESIDENT', 'WARDEN', 'TECH_HEAD', 'TECHNICIAN'];
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'Email already exists' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (name,email,passwordHash,role) VALUES (?,?,?,?)')
    .run(name, email, hash, role);
  res.json({ id: info.lastInsertRowid });
});
app.patch('/api/admin/users/:id/block', auth, requireRole('ADMIN','TECH_HEAD'), (req, res) => {
  const id = Number(req.params.id);
  const { block } = req.body; // true/false
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot block yourself' });
  db.prepare('UPDATE users SET isBlocked = ? WHERE id = ?').run(block ? 1 : 0, id);
  res.json({ ok: true, blocked: !!block });
});
app.delete('/api/admin/users/:id', auth, requireRole('ADMIN'), (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  try { const r = safeDeleteUser(id); if (r.ok) return res.json({ ok: true }); }
  catch {}
  return res.status(400).json({ error: 'Delete failed' });
});
app.delete('/api/admin/remove-demos', auth, requireRole('ADMIN'), (req, res) => {
  const demoEmails = ['resident@demo.com', 'warden@demo.com', 'head@demo.com', 'tech1@demo.com', 'tech2@demo.com'];
  let removed = 0;
  for (const em of demoEmails) {
    const u = db.prepare('SELECT id FROM users WHERE email = ?').get(em);
    if (u) { try { safeDeleteUser(u.id); removed++; } catch {} }
  }
  res.json({ removed });
});

// ==== USERS helper ====
app.get('/api/users/technicians', auth, requireRole('TECH_HEAD', 'WARDEN'), (req, res) => {
  const list = db.prepare("SELECT id, name, email FROM users WHERE role = 'TECHNICIAN'").all();
  res.json(list);
});

// ==== NOTIFICATIONS ====
app.get('/api/notifications', auth, (req, res) => {
  const list = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY id DESC').all(req.user.id);
  res.json(list);
});
app.patch('/api/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?')
    .run(req.params.id, req.user.id);
  res.json({ ok: true });
});

// ==== COMPLAINTS ====
// list based on role
app.get('/api/complaints', auth, (req, res) => {
  const role = req.user.role;
  let rows = [];
  if (role === 'RESIDENT') {
    rows = db.prepare('SELECT * FROM complaints WHERE residentId = ? ORDER BY id DESC').all(req.user.id);
  } else if (role === 'WARDEN' || role === 'ADMIN') {
    rows = db.prepare('SELECT * FROM complaints ORDER BY id DESC').all();
  } else if (role === 'TECH_HEAD') {
    rows = db.prepare(`
      SELECT * FROM complaints
      WHERE status IN ('SENT_TO_TECHNICIAN','ASSIGNED_TO_TECHNICIAN','COMPLETED_BY_TECHNICIAN')
      OR isFlagged = 1
      ORDER BY id DESC
    `).all();
  } else if (role === 'TECHNICIAN') {
    rows = db.prepare('SELECT * FROM complaints WHERE assignedTechnicianId = ? ORDER BY id DESC').all(req.user.id);
  }
  res.json(rows);
});

// create complaint (resident) with location fields
app.post('/api/complaints', auth, requireRole('RESIDENT'), upload.single('photo'), (req, res) => {
  const { title, description, locationType, locationText } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Missing fields' });
  // require location
  if (!locationType || !locationText) return res.status(400).json({ error: 'Location required' });
  const photo = req.file ? '/uploads/' + req.file.filename : null;

  const info = db.prepare(`
    INSERT INTO complaints
    (title, description, photo, status, residentId, locationType, locationText)
    VALUES (?,?,?,?,?,?,?)
  `).run(title, description, photo, 'PENDING_WARDEN_APPROVAL', req.user.id, locationType, locationText);

  const wardens = db.prepare("SELECT id FROM users WHERE role = 'WARDEN'").all();
  for (const w of wardens) notify(w.id, `New complaint submitted: ${title}`);
  res.json({ id: info.lastInsertRowid });
});

// warden approve/reject
app.patch('/api/complaints/:id/approve', auth, requireRole('WARDEN'), (req, res) => {
  const id = req.params.id;
  db.prepare(`
    UPDATE complaints
    SET status='SENT_TO_TECHNICIAN', wardenId = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(req.user.id, id);
  const heads = db.prepare("SELECT id FROM users WHERE role = 'TECH_HEAD'").all();
  for (const h of heads) notify(h.id, `Complaint #${id} approved by Warden, needs assignment.`);
  res.json({ ok: true });
});
app.patch('/api/complaints/:id/reject', auth, requireRole('WARDEN'), (req, res) => {
  const id = req.params.id;
  db.prepare(`
    UPDATE complaints
    SET status='REJECTED_BY_WARDEN', wardenId = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(req.user.id, id);
  const c = db.prepare('SELECT residentId, title FROM complaints WHERE id = ?').get(id);
  if (c) notify(c.residentId, `Your complaint '${c.title}' was rejected by the Warden.`);
  res.json({ ok: true });
});

// tech head assignment
app.patch('/api/complaints/:id/assign', auth, requireRole('TECH_HEAD'), (req, res) => {
  const id = req.params.id;
  const { technicianId } = req.body;
  if (!technicianId) return res.status(400).json({ error: 'technicianId required' });
  db.prepare(`
    UPDATE complaints
    SET status='ASSIGNED_TO_TECHNICIAN', techHeadId = ?, assignedTechnicianId = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(req.user.id, technicianId, id);
  const c = db.prepare('SELECT residentId, title FROM complaints WHERE id = ?').get(id);
  if (c) {
    notify(technicianId, `New task assigned: Complaint #${id} - ${c.title}`);
    notify(c.residentId, `Your complaint '${c.title}' has been assigned to a technician.`);
  }
  res.json({ ok: true });
});

// technician complete
const completeUpload = upload.single('completedImage');
app.post('/api/complaints/:id/complete', auth, requireRole('TECHNICIAN'), (req, res) => {
  completeUpload(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Upload failed' });
    const id = req.params.id;
    const { completedMessage } = req.body;
    const c = db.prepare('SELECT assignedTechnicianId, title, residentId FROM complaints WHERE id = ?').get(id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    if (c.assignedTechnicianId !== req.user.id) return res.status(403).json({ error: 'Not your task' });
    const img = req.file ? '/uploads/' + req.file.filename : null;
    db.prepare(`
      UPDATE complaints
      SET status='COMPLETED_BY_TECHNICIAN', completedMessage = ?, completedImage = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(completedMessage || '', img, id);
    const heads = db.prepare("SELECT id FROM users WHERE role = 'TECH_HEAD'").all();
    for (const h of heads) notify(h.id, `Technician completed Complaint #${id}: '${c.title}'. Review & confirm.`);
    const wardens = db.prepare("SELECT id FROM users WHERE role = 'WARDEN'").all();
    for (const w of wardens) notify(w.id, `Technician completed Complaint #${id}. Awaiting resident verification.`);
    notify(c.residentId, `Fix done for '${c.title}'. Please verify if rectified.`);
    res.json({ ok: true });
  });
});

// technician report misuse (flags complaint + notifies head & admin)
app.post('/api/complaints/:id/report-misuse', auth, requireRole('TECHNICIAN'), (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;
  const c = db.prepare('SELECT assignedTechnicianId, residentId, title FROM complaints WHERE id = ?').get(id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (c.assignedTechnicianId !== req.user.id) return res.status(403).json({ error: 'Not your task' });

  db.prepare(`
    UPDATE complaints
    SET isFlagged = 1, misuseReportedBy = ?, misuseReason = ?, updatedAt = datetime('now')
    WHERE id = ?
  `).run(req.user.id, reason || '', id);

  const heads = db.prepare("SELECT id FROM users WHERE role = 'TECH_HEAD'").all();
  const admins = db.prepare("SELECT id FROM users WHERE role = 'ADMIN'").all();
  for (const h of heads) notify(h.id, `⚠️ Misuse reported on complaint #${id}: '${c.title}'`);
  for (const a of admins) notify(a.id, `⚠️ Misuse reported on complaint #${id}: '${c.title}'`);
  res.json({ ok: true });
});

// resident verify
app.post('/api/complaints/:id/rectified', auth, requireRole('RESIDENT'), (req, res) => {
  const id = req.params.id;
  const c = db.prepare('SELECT residentId, title FROM complaints WHERE id = ?').get(id);
  if (!c || c.residentId !== req.user.id) return res.status(404).json({ error: 'Not found' });
  db.prepare("UPDATE complaints SET status='RESIDENT_VERIFIED', updatedAt = datetime('now') WHERE id = ?").run(id);
  const wardens = db.prepare("SELECT id FROM users WHERE role = 'WARDEN'").all();
  for (const w of wardens) notify(w.id, `Resident verified Complaint #${id} as rectified.`);
  res.json({ ok: true });
});

// health + single listen
app.get('/', (_, res) => res.send('HMS server running'));
app.listen(PORT, () => console.log(`HMS server running on http://localhost:${PORT}`));
