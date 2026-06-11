'use client';

import { useState } from 'react';

interface Conclusion {
  topic: string;
  characterSignatures: string[];
  coreConflict: string;
  goldenQuotes: string[];
  decisionModel: string;
}

interface ConclusionCardProps {
  conclusion: Conclusion;
}

export function ConclusionCard({ conclusion }: ConclusionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = [
      `📜 结案锦囊`,
      ``,
      `【议题】${conclusion.topic}`,
      `【参与先哲】${conclusion.characterSignatures?.join('、')}`,
      conclusion.coreConflict ? `【核心冲突】${conclusion.coreConflict}` : '',
      ...(conclusion.goldenQuotes?.map((q, i) => `【金句${i + 1}】"${q}"`) ?? []),
      conclusion.decisionModel ? `【决策建议】${conclusion.decisionModel}` : '',
      ``,
      `— 赛博圆桌`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-8 print:border-black print:bg-white">
      <h2 className="text-center text-xl font-bold text-amber-900">📜 结案锦囊</h2>
      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-amber-600 uppercase">议题</p>
          <p className="mt-1 text-stone-800">{conclusion.topic}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-amber-600 uppercase">参与先哲</p>
          <p className="mt-1 text-stone-800">{conclusion.characterSignatures?.join(' · ')}</p>
        </div>
        {conclusion.coreConflict && (
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase">核心冲突</p>
            <p className="mt-1 text-stone-800">{conclusion.coreConflict}</p>
          </div>
        )}
        {conclusion.goldenQuotes?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase">先哲金句</p>
            <ul className="mt-1 space-y-2">
              {conclusion.goldenQuotes.map((q, i) => (
                <li key={i} className="rounded-lg bg-white p-3 text-stone-700 italic">
                  &ldquo;{q}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        )}
        {conclusion.decisionModel && (
          <div>
            <p className="text-xs font-medium text-amber-600 uppercase">决策建议</p>
            <p className="mt-1 text-stone-800">{conclusion.decisionModel}</p>
          </div>
        )}
      </div>
      <div className="mt-6 border-t border-amber-200 pt-4 text-center text-xs text-amber-400">
        本次论道已载入史册，先哲已退席
      </div>

      {/* 分享操作 */}
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={handleCopy}
          className="rounded-lg bg-white px-4 py-2 text-sm text-stone-600 shadow-sm transition hover:bg-stone-50"
        >
          {copied ? '✅ 已复制' : '📋 复制文本'}
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-white px-4 py-2 text-sm text-stone-600 shadow-sm transition hover:bg-stone-50"
        >
          📥 保存长图
        </button>
      </div>
    </div>
  );
}
