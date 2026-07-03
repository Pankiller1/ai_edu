import { useState } from 'react';

export default function SolutionView({ solution }) {
  const [revealed, setRevealed] = useState(false);
  if (!solution) return null;
  const { questionType, knowledgePoints = [], steps = [], finalAnswer, summary, hasImage } = solution;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">🧠</span>
        <h2 className="text-lg font-semibold text-slate-800">AI 解题过程</h2>
        {hasImage && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">📷 含图片</span>}
      </div>

      {/* 题型与知识点 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {questionType && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
            {questionType}
          </span>
        )}
        {knowledgePoints.map((k) => (
          <span key={k} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            #{k}
          </span>
        ))}
      </div>

      {/* 分步解题 */}
      {steps.length > 0 && (
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-sm flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                {s.title && <div className="font-medium text-slate-800 text-sm mb-1">{s.title}</div>}
                <div className="step-detail text-sm text-slate-600">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* 最终答案（默认隐藏，鼓励先自测） */}
      {finalAnswer && (
        <div className="mt-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-slate-500">最终答案：</span>
            {revealed ? (
              <span className="font-semibold text-indigo-700">{finalAnswer}</span>
            ) : (
              <span className="text-slate-400">（已隐藏，先自己算算看 👆）</span>
            )}
          </div>
          <button
            onClick={() => setRevealed((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition"
          >
            {revealed ? '🙈 隐藏答案' : '👁 显示答案'}
          </button>
        </div>
      )}

      {/* 总结 */}
      {summary && (
        <div className="mt-4 text-sm text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
          💡 {summary}
        </div>
      )}
    </section>
  );
}
