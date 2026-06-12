'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { RoundSection } from '@/components/debate/RoundSection';
import { ConclusionCard } from '@/components/debate/ConclusionCard';

interface Speech {
  characterId: string;
  characterName: string;
  content: string;
}

interface DebateRound {
  roundNumber: number;
  title: string;
  speeches: Speech[];
}

interface Conclusion {
  topic: string;
  characterSignatures: string[];
  coreConflict: string;
  goldenQuotes: string[];
  decisionModel: string;
}

interface DebateDetail {
  id: string;
  topic: string;
  type: string;
  status: string;
  characters: {
    character: { id: string; name: string; avatar: string | null; era: string; mbti: string };
  }[];
  rounds: DebateRound[];
  conclusion: Conclusion;
}

export default function DebateDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [debate, setDebate] = useState<DebateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConclusion, setShowConclusion] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get<DebateDetail>(`/debates/${id}`)
      .then((res) => setDebate(res.data))
      .catch(() => setDebate(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment-300 flex items-center justify-center font-sans-cn">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200/30 border-t-ink-400" />
      </div>
    );
  }

  if (!debate) {
    return (
      <div className="min-h-screen bg-parchment-300 flex items-center justify-center font-sans-cn">
        <p className="text-ink-400/40">辩论不存在</p>
      </div>
    );
  }

  const charColorIndices: Record<string, number> = {};
  const charEras: Record<string, string> = {};
  debate.characters?.forEach((dc, i: number) => {
    const c = dc.character;
    if (c?.id) {
      charColorIndices[c.id] = i;
      charEras[c.id] = c.era || '';
    }
  });

  const typeLabel = debate.type === 'COURT' ? '随机场' : '问策场';
  const typeIcon = debate.type === 'COURT' ? '🪷' : '🎯';

  return (
    <div className="min-h-screen bg-parchment-300 flex flex-col items-center font-sans-cn">
      <div className="w-full max-w-[660px] px-4 py-10">
        {/* 返回 */}
        <a
          href="/court"
          className="inline-flex items-center gap-1 text-sm text-ink-400/40 hover:text-ink-400/60 transition tracking-wider mb-6"
        >
          ← 返回论衡
        </a>

        <div
          id="debate-card"
          className="bg-parchment-100 p-8 sm:p-10 relative overflow-hidden shadow-sm"
        >
          {/* 品牌条 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl opacity-75">{typeIcon}</span>
              <div>
                <div className="font-serif text-base font-bold text-gold-700 tracking-[4px]">
                  论衡
                </div>
                <div className="font-mono text-[9px] text-ink-400/25 tracking-[2px]">
                  DIALECTICA
                </div>
              </div>
            </div>
            <div className="font-mono text-[10px] text-ink-400/20 tracking-[2px] px-3 py-1 border border-ink-400/10 rounded-full">
              {typeLabel}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-ink-400/15 to-transparent mb-5" />

          {/* 议题 */}
          <div className="text-center mb-7">
            <div className="font-mono text-[10px] text-ink-400/30 tracking-[4px] mb-2">
              — 议题 —
            </div>
            <div className="font-serif text-2xl font-black text-ink-900 leading-relaxed tracking-[2px]">
              {debate.topic}
            </div>
            <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
              {debate.characters?.map((dc, i: number) => (
                <span
                  key={i}
                  className="rounded-full bg-parchment-300/60 px-2.5 py-0.5 text-xs text-ink-400/50"
                >
                  {dc.character.name}
                </span>
              ))}
            </div>
          </div>

          {/* 轮次 */}
          {debate.rounds?.map((round, idx: number) => (
            <RoundSection
              key={idx}
              roundNumber={round.roundNumber}
              title={round.title}
              speeches={round.speeches}
              characterColorIndices={charColorIndices}
              characterEras={charEras}
            />
          ))}

          {/* 结案锦囊（可展开） */}
          {debate.conclusion && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowConclusion(!showConclusion)}
                className="px-6 py-2.5 rounded-md bg-gold-700 text-parchment-100 font-serif font-bold text-sm tracking-wider transition hover:bg-gold-900"
              >
                {showConclusion ? '收起' : '📜 查看结案锦囊'}
              </button>
            </div>
          )}
          {showConclusion && debate.conclusion && (
            <div className="mt-4">
              <ConclusionCard conclusion={debate.conclusion} />
            </div>
          )}

          {/* 落幕 */}
          <div className="mt-8 pt-5 border-t border-ink-400/10 text-center">
            <div className="font-serif text-sm text-ink-400/30 tracking-[6px] mb-4">
              📜 论道已毕 · 先哲退席
            </div>
          </div>
          <div className="mt-4 text-center font-mono text-[9px] text-ink-400/10 tracking-[3px]">
            论衡 · 自动辩论 · 无需等待
          </div>
        </div>
      </div>
    </div>
  );
}
