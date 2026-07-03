import { useEffect, useState, useCallback } from 'react';
import { api, checkAnswer } from './lib/api.js';
import UploadPanel from './components/UploadPanel.jsx';
import SolutionView from './components/SolutionView.jsx';
import PracticePanel from './components/PracticePanel.jsx';
import HistoryList from './components/HistoryList.jsx';

export default function App() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  const [solution, setSolution] = useState(null);
  const [current, setCurrent] = useState({ question: '', image: null, hasImage: false });
  const [activeId, setActiveId] = useState(null);

  const [solving, setSolving] = useState(false);
  const [practice, setPractice] = useState({ items: [], loading: false });

  const [answerInput, setAnswerInput] = useState('');
  const [answerResult, setAnswerResult] = useState(null);
  const [error, setError] = useState(null);

  // 初始化：状态 + 历史
  useEffect(() => {
    api.status().then(setStatus).catch(() => setStatus({ mode: 'mock' }));
    refreshHistory();
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await api.history.list());
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ---- 解题 ----
  const handleSolve = useCallback(async ({ question, image }) => {
    setError(null);
    setSolving(true);
    setSolution(null);
    setPractice({ items: [], loading: false });
    setAnswerInput('');
    setAnswerResult(null);
    setActiveId(null);
    try {
      const res = await api.solve({ question, image });
      setSolution(res);
      setCurrent({ question, image, hasImage: res.hasImage });
      // 写入学习历史（先记为“已解析”，作答后再更新对错）
      const rec = await api.history.add({
        question,
        hasImage: res.hasImage,
        questionType: res.questionType,
        knowledgePoints: res.knowledgePoints,
        steps: res.steps,
        finalAnswer: res.finalAnswer,
        summary: res.summary,
        studentAnswer: null,
        correct: null,
        status: 'viewed',
      });
      setActiveId(rec.id);
      refreshHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setSolving(false);
    }
  }, [refreshHistory]);

  // ---- 答案判定 ----
  const handleCheck = useCallback(async () => {
    if (!solution?.finalAnswer) {
      setError('当前题目未提供标准答案，无法判分');
      return;
    }
    const res = checkAnswer(answerInput, solution.finalAnswer);
    setAnswerResult(res);
    if (activeId) {
      await api.history
        .update(activeId, {
          studentAnswer: answerInput,
          correct: res.correct,
          status: res.correct ? 'correct' : 'wrong',
        })
        .catch(() => {});
      refreshHistory();
    }
    // 答错 → 自动生成类似题
    if (!res.correct) {
      generatePractice(answerInput);
    } else {
      setPractice({ items: [], loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solution, answerInput, activeId, refreshHistory]);

  // ---- 生成类似题 ----
  const generatePractice = useCallback(
    async (studentAnswer) => {
      setPractice((p) => ({ ...p, loading: true }));
      try {
        const res = await api.practice({
          question: current.question || '（图片题目）',
          studentAnswer: studentAnswer ?? answerInput,
          correctAnswer: solution?.finalAnswer || '',
        });
        setPractice({ items: res.questions || [], loading: false });
      } catch (e) {
        setError(e.message);
        setPractice((p) => ({ ...p, loading: false }));
      }
    },
    [current.question, answerInput, solution]
  );

  // ---- 回顾历史：载入某条记录 ----
  const handleSelectHistory = useCallback((h) => {
    setSolution({
      questionType: h.questionType,
      knowledgePoints: h.knowledgePoints || [],
      steps: h.steps || [],
      finalAnswer: h.finalAnswer,
      summary: h.summary,
      hasImage: h.hasImage,
    });
    setCurrent({ question: h.question, image: null, hasImage: h.hasImage });
    setActiveId(h.id);
    setAnswerInput(h.studentAnswer || '');
    setAnswerResult(
      h.correct === true
        ? { correct: true, reason: '历史记录：答对' }
        : h.correct === false
        ? { correct: false, reason: '历史记录：答错' }
        : null
    );
    setPractice({ items: [], loading: false });
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      await api.history.remove(id).catch(() => {});
      if (id === activeId) setActiveId(null);
      refreshHistory();
    },
    [activeId, refreshHistory]
  );

  const handleClear = useCallback(async () => {
    if (!confirm('确定清空全部学习历史？')) return;
    await api.history.clear().catch(() => {});
    setActiveId(null);
    refreshHistory();
  }, [refreshHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* 顶栏 */}
      <header className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-sky-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl">🎓</span>
            <div>
              <h1 className="text-lg font-semibold leading-tight">基于大语言模型的个性化学习辅导系统</h1>
              <p className="text-xs text-white/70">题目解析 · 个性化解题辅导 · 类似题生成 · 学习历史</p>
            </div>
          </div>
          <ModeBadge status={status} />
        </div>
      </header>

      {/* 主体 */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-5 py-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* 左：学习历史 */}
        <div className="lg:sticky lg:top-5 lg:self-start lg:h-[calc(100vh-7rem)]">
          <HistoryList
            history={history}
            activeId={activeId}
            onSelect={handleSelectHistory}
            onDelete={handleDelete}
            onClear={handleClear}
          />
        </div>

        {/* 右：主操作区 */}
        <div className="space-y-5 min-w-0">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm animate-fade-in">
              <span className="mt-0.5">⚠️</span>
              <div className="flex-1">{error}</div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">
                ✕
              </button>
            </div>
          )}

          <UploadPanel onSolve={handleSolve} loading={solving} />

          {solving && !solution && <SolvingSkeleton />}

          {solution && (
            <>
              <SolutionView solution={solution} />

              {/* 自测作答 */}
              {solution.finalAnswer && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-lg">✅</span>
                    <h2 className="text-lg font-semibold text-slate-800">自测作答</h2>
                    <span className="text-xs text-slate-400">输入你的答案，系统自动判分</span>
                  </div>
                  <div className="flex gap-3">
                    <input
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                      placeholder="输入你的答案，例如 6 或 x=6"
                      className="flex-1 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none px-3 py-2.5 text-slate-700 transition"
                    />
                    <button
                      onClick={handleCheck}
                      className="px-5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition"
                    >
                      提交答案
                    </button>
                  </div>
                  {answerResult && (
                    <div
                      className={`mt-3 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 animate-fade-in ${
                        answerResult.correct
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      <span>{answerResult.correct ? '🎉' : '💡'}</span>
                      <span>
                        {answerResult.correct
                          ? `答对了！${answerResult.reason}`
                          : `没关系，再练几道。${answerResult.reason}（已为你生成类似题 👇）`}
                      </span>
                    </div>
                  )}
                </section>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => generatePractice(answerInput)}
                  className="text-sm text-slate-500 hover:text-indigo-600 transition"
                >
                  🎯 手动生成类似练习题
                </button>
              </div>
            </>
          )}

          {(practice.items.length > 0 || practice.loading) && (
            <PracticePanel
              questions={practice.items}
              loading={practice.loading}
              onSolveQuestion={(q) => handleSolve({ question: q, image: null })}
              onRegenerate={() => generatePractice(answerInput)}
            />
          )}

          {!solution && !solving && <EmptyHint />}
        </div>
      </main>

      <footer className="text-center text-xs text-slate-400 py-4">
        AI-Powered Personalized Learning Tutoring System · NDBC 2026 系统演示
      </footer>
    </div>
  );
}

function ModeBadge({ status }) {
  if (!status) return null;
  const isApi = status.mode === 'api';
  return (
    <div
      className={`text-xs px-3 py-1.5 rounded-full border ${
        isApi ? 'bg-white/15 border-white/20 text-white' : 'bg-amber-400/90 border-amber-300 text-amber-950'
      }`}
      title={isApi ? `模型：${status.model}` : '未配置 DEEPSEEK_API_KEY，返回演示数据'}
    >
      {isApi ? `🟢 在线 · ${status.model}` : '🟡 演示模式'}
    </div>
  );
}

function SolvingSkeleton() {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-fade-in">
      <div className="flex items-center gap-2 text-slate-500 mb-4">
        <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        正在调用大模型解析题目…
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyHint() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-dashed border-slate-300 p-10 text-center text-slate-400">
      <div className="text-4xl mb-3">🤖</div>
      <p className="text-sm">在上方输入或上传一道题目，点击「AI 解题」开始个性化辅导</p>
    </div>
  );
}
