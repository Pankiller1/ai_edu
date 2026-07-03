import { Router } from 'express';
import { solve } from '../lib/deepseek.js';

const router = Router();

// POST /api/solve
// body: { question: string, image?: string(base64 或 data URL) }
// resp: { questionType, knowledgePoints, steps, finalAnswer, summary, image? }
router.post('/', async (req, res) => {
  const { question, image } = req.body || {};
  if (!question && !image) {
    return res.status(400).json({ error: '请提供题目文字或图片' });
  }
  try {
    const result = await solve({ question: question || '', image });
    // 不把整张图片回传，节省带宽；仅标记是否有图
    res.json({ ...result, hasImage: Boolean(image) });
  } catch (e) {
    console.error('[solve] 出错:', e.message);
    res.status(500).json({ error: '解题失败：' + e.message });
  }
});

export default router;
