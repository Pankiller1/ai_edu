import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

// ---- 配置 ----
const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const VISION_MODEL = process.env.DEEPSEEK_VISION_MODEL || 'deepseek-chat';

export const MODE = API_KEY ? 'api' : 'mock';

// 缓存 Prompt 模板
function loadPrompt(name) {
  try {
    return fs.readFileSync(path.join(PROMPTS_DIR, name), 'utf-8');
  } catch (e) {
    console.error(`[deepseek] 无法读取模板 ${name}:`, e.message);
    return '';
  }
}

const SOLVE_TEMPLATE = loadPrompt('solve.txt');
const PRACTICE_TEMPLATE = loadPrompt('practice.txt');

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

// 从可能包含杂质的文本中提取 JSON 对象
function extractJSON(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // 尝试截取第一个 {...}
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

/**
 * 低层调用：OpenAI 兼容的 chat completions
 * @param {Array} messages OpenAI 消息格式
 * @param {Object} opts { json, temperature }
 */
async function chat(messages, { json = false, temperature = 0.7 } = {}) {
  const body = {
    model: MODEL,
    messages,
    temperature,
    stream: false,
  };
  if (json) body.response_format = { type: 'json_object' };

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`DeepSeek API 错误 (${resp.status}): ${errText.slice(0, 500)}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

// 构造可能含图片的用户消息（OpenAI 兼容的 vision 格式）
function buildUserMessage(promptText, image) {
  if (image) {
    const url = image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
    return {
      role: 'user',
      content: [
        { type: 'text', text: promptText },
        { type: 'image_url', image_url: { url } },
      ],
    };
  }
  return { role: 'user', content: promptText };
}

// ============================ 解题 ============================
/**
 * @param {Object} p { question, image }
 * @returns {Promise<Object>} { questionType, knowledgePoints, steps, finalAnswer, summary }
 */
export async function solve({ question, image }) {
  if (MODE === 'mock') {
    return mockSolve({ question, image });
  }

  const prompt = fill(SOLVE_TEMPLATE, { question: question || '（见图片）' });
  const messages = [
    { role: 'system', content: '你是一名经验丰富、耐心细致的学科辅导老师，擅长把题目讲解得清晰易懂。务必只输出合法 JSON。' },
    buildUserMessage(prompt, image),
  ];

  const raw = await chat(messages, { json: true, temperature: 0.5 });
  const parsed = extractJSON(raw);
  if (!parsed) {
    return {
      questionType: '解析失败',
      knowledgePoints: [],
      steps: [{ title: '原始返回', detail: raw }],
      finalAnswer: '',
      summary: '模型未返回标准 JSON，以上为原始内容。',
      _raw: raw,
    };
  }
  return normalizeSolution(parsed);
}

function normalizeSolution(p) {
  return {
    questionType: p.questionType || p.type || '未知题型',
    knowledgePoints: Array.isArray(p.knowledgePoints) ? p.knowledgePoints : [],
    steps: Array.isArray(p.steps)
      ? p.steps.map((s, i) => ({
          title: typeof s === 'string' ? `第 ${i + 1} 步` : s.title || `第 ${i + 1} 步`,
          detail: typeof s === 'string' ? s : s.detail || s.content || '',
        }))
      : [],
    finalAnswer: p.finalAnswer || p.answer || '',
    summary: p.summary || '',
  };
}

// ============================ 类似题 ============================
/**
 * @param {Object} p { question, studentAnswer, correctAnswer }
 * @returns {Promise<Object>} { questions: string[] }
 */
export async function practice({ question, studentAnswer, correctAnswer }) {
  if (MODE === 'mock') {
    return mockPractice({ question, studentAnswer, correctAnswer });
  }

  const prompt = fill(PRACTICE_TEMPLATE, {
    question: question || '',
    student_answer: studentAnswer || '（未提供）',
    correct_answer: correctAnswer || '（未提供）',
  });
  const messages = [
    { role: 'system', content: '你是出题专家。只输出合法 JSON，题目文本规范完整，不输出答案。' },
    { role: 'user', content: prompt },
  ];

  const raw = await chat(messages, { json: true, temperature: 0.9 });
  const parsed = extractJSON(raw);
  const questions = Array.isArray(parsed?.questions)
    ? parsed.questions.filter((q) => typeof q === 'string' && q.trim())
    : [];
  return { questions: questions.length ? questions : ['（未能生成练习题，请重试）'] };
}

// ============================ Mock 实现（无 API Key 时） ============================
function mockSolve({ question, image }) {
  const q = (question || '').trim();
  const hasImg = !!image;
  const text = q || (hasImg ? '（已上传图片题目，演示模式未连接真实模型）' : '');

  // 简单启发式：检测数字运算 / 方程，给出贴近的演示解答
  const equation = /[=?]/.test(q) && /[a-zA-Z]/.test(q);
  return {
    questionType: equation ? '一元方程求解' : '基础计算 / 概念题',
    knowledgePoints: equation ? ['等式性质', '移项', '合并同类项'] : ['基本运算', '审题理解'],
    steps: [
      {
        title: '审题与梳理',
        detail: hasImg && !q ? '识别图片中的题目信息，明确已知量与求解目标。' : `题目要求：${text}。先明确已知条件与求解目标。`,
      },
      {
        title: equation ? '移项与整理' : '列式 / 选择方法',
        detail: equation
          ? '将含未知数的项移到等式一侧，常数项移到另一侧，注意移项变号。'
          : '根据题意，选择合适的运算方法，列出算式或表达式。',
      },
      {
        title: '求解',
        detail: equation ? '合并同类项后，系数化为 1，得到未知数的值。' : '按运算顺序逐步计算，得到中间结果。',
      },
    ],
    finalAnswer: equation ? 'x = 演示值（请配置真实 API Key 获取准确解答）' : '演示答案（请配置真实 API Key）',
    summary: '⚠️ 演示模式：未检测到 DEEPSEEK_API_KEY，以上为占位内容。配置 .env 后将调用真实大模型。',
  };
}

function mockPractice({ question }) {
  const base = (question || '原题').replace(/\s+/g, ' ').slice(0, 40);
  return {
    questions: [
      `【演示练习 1】与“${base}”同类型的题目（难度相近），请独立完成。`,
      `【演示练习 2】变换已知条件，与“${base}”考查同一知识点的另一道题。`,
    ],
  };
}

export function getStatus() {
  return {
    mode: MODE,
    model: MODEL,
    visionModel: VISION_MODEL,
    hasKey: Boolean(API_KEY),
    baseUrl: BASE_URL,
  };
}
