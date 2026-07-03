function fmtTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

const STATUS = {
  correct: { label: '答对', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  wrong: { label: '答错', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  viewed: { label: '已解析', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function HistoryList({ history = [], activeId, onSelect, onDelete, onClear }) {
  const total = history.length;
  const correct = history.filter((h) => h.correct === true).length;
  const wrong = history.filter((h) => h.correct === false).length;
  const rate = total ? Math.round((correct / total) * 100) : 0;

  return (
    <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-lg">📚</span>
          <h2 className="text-base font-semibold text-slate-800">学习历史</h2>
        </div>
        {total > 0 && (
          <button onClick={onClear} className="text-xs text-slate-400 hover:text-red-500 transition">
            清空
          </button>
        )}
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Stat label="总数" value={total} cls="text-slate-700" />
        <Stat label="答对" value={correct} cls="text-emerald-600" />
        <Stat label="答错" value={wrong} cls="text-rose-600" />
        <Stat label="正确率" value={`${rate}%`} cls="text-indigo-600" />
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2">
        {total === 0 && (
          <div className="text-center text-sm text-slate-400 py-10">
            <div className="text-3xl mb-2">🗒️</div>
            还没有学习记录
            <div className="text-xs mt-1">上传题目开始学习吧</div>
          </div>
        )}

        {history.map((h) => {
          const st = h.correct === true ? STATUS.correct : h.correct === false ? STATUS.wrong : STATUS.viewed;
          const isActive = h.id === activeId;
          return (
            <div
              key={h.id}
              onClick={() => onSelect(h)}
              className={`group cursor-pointer rounded-xl border p-3 transition ${
                isActive ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                <span className="text-[10px] text-slate-400">{fmtTime(h.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 line-clamp-2 leading-snug">
                {h.hasImage && '📷 '}
                {h.question || '（图片题目）'}
              </p>
              {h.finalAnswer && (
                <p className="text-xs text-slate-400 mt-1">答案：{h.finalAnswer}</p>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(h.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-red-500 transition mt-1"
              >
                删除
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function Stat({ label, value, cls }) {
  return (
    <div className="text-center bg-slate-50 rounded-lg py-1.5">
      <div className={`text-base font-semibold ${cls}`}>{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}
