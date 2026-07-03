import { Router } from 'express';
import { practice } from '../lib/deepseek.js';

const router = Router();

// POST /api/practice
// body: { question, studentAnswer, correctAnswer }
// resp: { questions: string[] }
router.post('/', async (req, res) => {
  const { question, studentAnswer, correctAnswer } = req.body || {};
  if (!question) {
    return res.status(400).json({ error: '缺少原题 question' });
  }
  try {
    const result = await practice({ question, studentAnswer, correctAnswer });
    res.json(result);
  } catch (e) {
    console.error('[practice] 出错:', e.message);
    res.status(500).json({ error: '生成练习题失败：' + e.message });
  }
});

export default router;
