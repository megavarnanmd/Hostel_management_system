# Resident Complaint System (Hostel) — Full Stack

Roles: Resident, Warden, Technician Head, Technician.
Features: Complaint creation (with photo), tracking, assignment, completion with proof image, resident verification, and in‑app notifications.

## Quick Start

### 1) Server
```bash
cd server
npm install
npm run start
```
Server runs at `http://localhost:4000` and serves uploaded images under `/uploads/...`.

Login (demo accounts):
- Resident — `resident@demo.com / resident123`
- Warden — `warden@demo.com / warden123`
- Technician Head — `head@demo.com / head123`
- Technician — `tech1@demo.com / tech123`
- Technician — `tech2@demo.com / tech123`

### 2) Client
```bash
cd client
npm install
npm run dev
```
Vite dev server runs at `http://localhost:5173` and proxies `/api` → `http://localhost:4000`.

## Notes
- Database: SQLite (file `server/data.db`) auto-created.
- Images stored in `server/uploads/`.
- JWT auth with role‑based access control.
