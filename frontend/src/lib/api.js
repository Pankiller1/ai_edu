const BASE = import.meta.env.VITE_API_BASE || '';

async function http(path, { method = 'GET', body } = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await resp.json();
  } catch (_) {
    data = {};
  }
  if (!resp.ok) {
    throw new Error(data.error || `请求失败 (${resp.status})`);
  }
  return data;
}

export const api = {
  status: () => http('/api/status'),

  // 题目解析
  solve: ({ question, image }) => http('/api/solve', { method: 'POST', body: { question, image } }),

  // 类似题生成
  practice: ({ question, studentAnswer, correctAnswer }) =>
    http('/api/practice', { method: 'POST', body: { question, studentAnswer, correctAnswer } }),

  // 学习历史
  history: {
    list: () => http('/api/history'),
    add: (rec) => http('/api/history', { method: 'POST', body: rec }),
    update: (id, patch) => http(`/api/history/${id}`, { method: 'PUT', body: patch }),
    remove: (id) => http(`/api/history/${id}`, { method: 'DELETE' }),
    clear: () => http('/api/history', { method: 'DELETE' }),
  },
};

/**
 * 轻量答案判定：把学生答案与标准答案做规范化比较。
 * 处理空格、大小写、常见前缀（x=、答:）、全角/半角、末尾标点与数值精度。
 */
export function checkAnswer(studentAnswer, correctAnswer) {
  const norm = (s) => {
    if (s === null || s === undefined) return '';
    let t = String(s).trim().toLowerCase();
    t = t.replace(/\s+/g, ''); // 去所有空白
    // 全角数字/符号转半角
    t = t.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
    t = t.replace(/＝/g, '=').replace(/＋/g, '+').replace(/－/g, '-').replace(/，/g, ',');
    // 去掉常见前缀：x= / y= / 答= / 答案:
    t = t.replace(/^(x|y|z|n|解|答|答案)\s*[=:=]/, '');
    // 去掉末尾标点
    t = t.replace(/[。.,;；!\!\s]+$/g, '');
    return t;
  };

  const a = norm(studentAnswer);
  const b = norm(correctAnswer);
  if (!b) return { correct: false, reason: '没有可参考的标准答案' };
  if (!a) return { correct: false, reason: '请输入答案' };
  if (a === b) return { correct: true, reason: '答案一致' };

  // 数值比较（容忍 1/100、小数误差）
  const na = a.match(/-?\d+(\.\d+)?/);
  const nb = b.match(/-?\d+(\.\d+)?/);
  if (na && nb) {
    const fa = parseFloat(na[0]);
    const fb = parseFloat(nb[0]);
    if (Math.abs(fa - fb) < 1e-6) return { correct: true, reason: '数值相同' };
    // 分数 a/b 形式
    const [p, q] = b.split('/');
    if (q && Math.abs(fa - parseFloat(p) / parseFloat(q)) < 1e-6) {
      return { correct: true, reason: '数值相同' };
    }
  }

  return { correct: false, reason: `与标准答案「${correctAnswer}」不一致` };
}
