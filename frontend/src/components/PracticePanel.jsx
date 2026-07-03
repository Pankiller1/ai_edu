export default function PracticePanel({ questions = [], loading, onSolveQuestion, onRegenerate }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-lg">🎯</span>
          <h2 className="text-lg font-semibold text-slate-800">类似题练习</h2>
          <span className="text-xs text-slate-400">同类型 · 同难度 · 巩固提升</span>
        </div>
        <button
          onClick={onRegenerate}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          {loading ? '生成中…' : '🔄 换一组'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          正在为你生成练习题…
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-3 hover:border-indigo-200 transition">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 text-xs font-medium text-rose-500 bg-rose-50 rounded px-1.5 py-0.5">
                  第 {i + 1} 题
                </span>
                <p className="flex-1 text-sm text-slate-700 leading-relaxed">{q}</p>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => onSolveQuestion(q)}
                  className="text-xs px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                >
                  用此题练习（查看解析）→
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && questions.length === 0 && (
        <p className="text-sm text-slate-400 py-2">暂无练习题。</p>
      )}
    </section>
  );
}
