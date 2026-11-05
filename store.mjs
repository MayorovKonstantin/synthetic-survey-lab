import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS research (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, document TEXT NOT NULL);');
  const insert = db.prepare('INSERT INTO research (id, revision, document) VALUES (?, ?, ?)');
  const select = db.prepare('SELECT document FROM research WHERE id = ?');
  const update = db.prepare('UPDATE research SET revision = ?, document = ? WHERE id = ? AND revision = ?');
  const all = db.prepare('SELECT document FROM research ORDER BY rowid DESC');
  return {
    create(study) { insert.run(study.id, study.revision, JSON.stringify(study)); return study; },
    get(id) { const row = select.get(id); return row ? JSON.parse(row.document) : null; },
    list() { return all.all().map(row => { const s = JSON.parse(row.document); return { id: s.id, problem: s.problem, createdAt: s.createdAt, stage: s.report ? 'report' : s.runs.length ? 'survey' : s.personas ? 'personas' : s.segments ? 'segments' : s.tasks ? 'tasks' : 'problem' }; }); },
    save(study, priorRevision) { const result = update.run(study.revision, JSON.stringify(study), study.id, priorRevision); return result.changes === 1; },
    close() { db.close(); }
  };
}
