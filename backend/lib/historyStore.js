import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'history.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]', 'utf-8');
}

export function readAll() {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE, 'utf-8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('[history] 读取失败，重置为空:', e.message);
    return [];
  }
}

function writeAll(list) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export function list() {
  // 最新在前
  return readAll().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function add(item) {
  const all = readAll();
  const record = {
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...item,
  };
  all.push(record);
  writeAll(all);
  return record;
}

export function update(id, patch) {
  const all = readAll();
  const idx = all.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() };
  writeAll(all);
  return all[idx];
}

export function remove(id) {
  const all = readAll();
  const next = all.filter((x) => x.id !== id);
  writeAll(next);
  return all.length - next.length;
}

export function clear() {
  writeAll([]);
}
