import { useRef, useState } from 'react';

const SAMPLES = [
  '解方程：2x + 5 = 17',
  '计算：(3/4 + 1/2) × 8',
  '一个数的 30% 等于 15，求这个数。',
  '一列火车以 120 km/h 的速度行驶，2.5 小时行驶多少千米？',
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadPanel({ onSolve, loading }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null); // data URL
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const canSubmit = !loading && (text.trim() || image);

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('图片过大（>8MB），请压缩后再上传');
      return;
    }
    setImage(await fileToDataUrl(file));
  }

  function submit() {
    if (!canSubmit) return;
    onSolve({ question: text.trim(), image });
  }

  function reset() {
    setText('');
    setImage(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">📝</span>
        <h2 className="text-lg font-semibold text-slate-800">题目上传</h2>
        <span className="text-xs text-slate-400">文字输入或图片上传</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="在此输入题目，例如：解方程 3x - 7 = 14"
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none p-3 text-slate-700 placeholder:text-slate-400 transition"
      />

      {/* 图片上传区 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed transition flex items-center justify-center ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        } ${image ? 'p-3' : 'p-6'}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {image ? (
          <div className="flex items-center gap-3 w-full">
            <img src={image} alt="题目图片" className="h-20 w-auto rounded-lg border border-slate-200 object-contain" />
            <div className="flex-1 text-sm text-slate-500">
              <div className="text-slate-700 font-medium">已选择图片</div>
              <div>将调用大模型识别图片中的题目</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImage(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="text-slate-400 hover:text-red-500 text-sm px-2"
            >
              ✕ 移除
            </button>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-400">
            <div className="text-2xl mb-1">🖼️</div>
            点击或拖拽上传题目图片（支持手写题拍照）
          </div>
        )}
      </div>

      {/* 示例题目 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 self-center">示例：</span>
        {SAMPLES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setText(s);
              setImage(null);
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-600 transition"
          >
            {s.length > 14 ? s.slice(0, 14) + '…' : s}
          </button>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-medium py-2.5 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              AI 解题中…
            </>
          ) : (
            <>✨ AI 解题</>
          )}
        </button>
        <button
          onClick={reset}
          disabled={loading}
          className="px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          清空
        </button>
      </div>
    </section>
  );
}
