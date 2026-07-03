import { Router } from 'express';
import * as store from '../lib/historyStore.js';

const router = Router();

// GET /api/history —— 获取全部历史（最新在前）
router.get('/', (req, res) => {
  res.json(store.list());
});

// POST /api/history —— 新增一条
// body: { question, questionType, finalAnswer, studentAnswer?, correct?, knowledgePoints?, hasImage? }
router.post('/', (req, res) => {
  const rec = store.add(req.body || {});
  res.status(201).json(rec);
});

// PUT /api/history/:id —— 更新（如记录学生答案与对错）
router.put('/:id', (req, res) => {
  const rec = store.update(req.params.id, req.body || {});
  if (!rec) return res.status(404).json({ error: '记录不存在' });
  res.json(rec);
});

// DELETE /api/history/:id —— 删除一条
router.delete('/:id', (req, res) => {
  const n = store.remove(req.params.id);
  res.json({ removed: n });
});

// DELETE /api/history —— 清空
router.delete('/', (req, res) => {
  store.clear();
  res.json({ cleared: true });
});

export default router;
