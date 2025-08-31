import Database from "better-sqlite3";
const db = new Database("./data.db");

function hasCol(table, col){
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c=>c.name);
  return cols.includes(col);
}

db.exec("BEGIN");

if (!hasCol("users","isBlocked")) {
  db.exec(`ALTER TABLE users ADD COLUMN isBlocked INTEGER NOT NULL DEFAULT 0`);
}
if (!hasCol("complaints","locationType")) {
  db.exec(`ALTER TABLE complaints ADD COLUMN locationType TEXT`);
}
if (!hasCol("complaints","locationText")) {
  db.exec(`ALTER TABLE complaints ADD COLUMN locationText TEXT`);
}
if (!hasCol("complaints","isFlagged")) {
  db.exec(`ALTER TABLE complaints ADD COLUMN isFlagged INTEGER NOT NULL DEFAULT 0`);
}
if (!hasCol("complaints","misuseReportedBy")) {
  db.exec(`ALTER TABLE complaints ADD COLUMN misuseReportedBy INTEGER`);
}
if (!hasCol("complaints","misuseReason")) {
  db.exec(`ALTER TABLE complaints ADD COLUMN misuseReason TEXT`);
}

db.exec("COMMIT");
console.log("✅ Migration complete: location+flag fields & user.isBlocked added");
