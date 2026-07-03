import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStatus } from './lib/deepseek.js';

import solveRoutes from './routes/solve.js';
import practiceRoutes from './routes/practice.js';
import historyRoutes from './routes/history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// 题目图片以 base64 上传，体积可能较大，放宽限制
app.use(express.json({ limit: '20mb' }));

// 健康检查 / 运行状态（前端据此显示 API / 演示模式）
app.get('/api/status', (req, res) => {
  res.json({ ok: true, service: 'ai-edu-backend', ...getStatus() });
});

app.use('/api/solve', solveRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/history', historyRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    name: 'AI 个性化学习辅导系统 - 后端',
    status: getStatus(),
    endpoints: ['/api/status', 'POST /api/solve', 'POST /api/practice', 'GET/POST/PUT/DELETE /api/history'],
  });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('[server] 未捕获错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  const s = getStatus();
  console.log(`\n🚀 AI 辅导系统后端已启动: http://localhost:${PORT}`);
  console.log(`   运行模式: ${s.mode === 'api' ? '✅ 真实 DeepSeek API' : '⚠️  演示模式（未配置 DEEPSEEK_API_KEY）'}`);
  console.log(`   模型: ${s.model}\n`);
});
