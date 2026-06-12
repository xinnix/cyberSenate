'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { RoundSection } from '@/components/debate/RoundSection';
import { ConclusionCard } from '@/components/debate/ConclusionCard';
import { LiveStream } from '@/components/debate/LiveStream';

interface Character {
  id: string;
  name: string;
  slug: string;
  era: string;
  mbti: string;
  coreStance: string;
  speakingStyle: string;
  expertise: string;
  avatar: string | null;
}

interface DebateRound {
  roundNumber: number;
  title: string;
  speeches: { characterId: string; characterName: string; content: string }[];
}

interface Conclusion {
  topic: string;
  characterSignatures: string[];
  coreConflict: string;
  goldenQuotes: string[];
  decisionModel: string;
}

interface LiveEvent {
  type: string;
  roundNumber?: number;
  title?: string;
  content?: string;
  characterId?: string;
  characterName?: string;
  conclusion?: Conclusion;
  message?: string;
}

type Step = 'form' | 'generating' | 'result';

export default function ConsultationPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [step, setStep] = useState<Step>('form');
  const [topic, setTopic] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rounds, setRounds] = useState<DebateRound[]>([]);
  const [conclusion, setConclusion] = useState<Conclusion | null>(null);

  // SSE
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveDone, setLiveDone] = useState(false);

  // 角色元数据
  const [charMeta, setCharMeta] = useState<Record<string, { index: number; era: string }>>({});

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/debates/characters`)
      .then((r) => r.json())
      .then((data) => {
        const chars: Character[] =
          Array.isArray(data) && data.length ? data : data?.data?.length ? data.data : [];
        setCharacters(chars);
        const meta: Record<string, { index: number; era: string }> = {};
        chars.forEach((c, i) => {
          meta[c.id] = { index: i, era: c.era };
        });
        setCharMeta(meta);
      })
      .catch(() => {});
  }, []);

  const toggleCharacter = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  };

  const charColorIndices = Object.fromEntries(
    Object.entries(charMeta).map(([k, v]) => [k, v.index]),
  );
  const charEras = Object.fromEntries(Object.entries(charMeta).map(([k, v]) => [k, v.era]));

  const handleSubmit = async () => {
    if (!topic.trim() || selectedIds.length < 2) return;
    try {
      const res = await apiClient.post<{ id: string; status: string }>('/debates', {
        type: 'CONSULTATION',
        topic: topic.trim(),
        characterIds: selectedIds,
      });
      const debateId = res.data.id;
      setStep('generating');
      setLiveEvents([]);
      setLiveDone(false);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const es = new EventSource(`${baseUrl}/api/debates/${debateId}/stream`);
      let closed = false;
      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'done') {
          closed = true;
          es.close();
          setLiveDone(true);
          apiClient
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .get<any>(`/debates/${debateId}`)
            .then((r) => {
              setRounds(r.data?.rounds || []);
              setConclusion(r.data?.conclusion || null);
              setStep('result');
            })
            .catch(() => setStep('result'));
        } else if (data.type === 'error') {
          closed = true;
          es.close();
          setLiveEvents((p) => [...p, data]);
          setLiveDone(true);
        } else {
          setLiveEvents((p) => [...p, data]);
        }
      };
      es.onerror = () => {
        if (!closed) {
          es.close();
          setLiveEvents((p) => [...p, { type: 'error', message: '连接中断' }]);
          setLiveDone(true);
        }
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交失败';
      alert(message);
    }
  };

  const handleReset = () => {
    setStep('form');
    setTopic('');
    setSelectedIds([]);
    setRounds([]);
    setConclusion(null);
    setLiveEvents([]);
    setLiveDone(false);
  };

  return (
    <div className="min-h-screen bg-parchment-300 flex flex-col items-center font-sans-cn">
      <div className="w-full max-w-[660px] px-4 py-10">
        {/* 步骤 1: 表单 */}
        {step === 'form' && (
          <div className="space-y-6">
            {/* 页头 */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-serif font-bold text-ink-900 tracking-wider">
                赛博圆桌
              </h1>
              <p className="mt-2 text-sm text-ink-400/60 tracking-wider">
                提出你的问题，选几位先哲为你论辩
              </p>
            </div>

            {/* 议题输入 */}
            <div className="bg-parchment-100 rounded-lg p-6">
              <label className="block text-sm font-medium text-ink-600 mb-2">你的问题</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例如：我该不该辞职创业？AI会取代我的工作吗？要不要给孩子报编程班？"
                rows={3}
                className="w-full rounded-md border border-ink-400/15 bg-parchment-50 p-3 text-ink-900 placeholder:text-ink-400/30 focus:border-gold-500/50 focus:outline-none font-sans-cn text-sm"
              />
            </div>

            {/* 选择角色 */}
            <div className="bg-parchment-100 rounded-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-ink-600">选择先哲（2-5位）</p>
                <span className="text-xs text-ink-400/40">已选 {selectedIds.length}/5</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {characters.map((ch) => {
                  const selected = selectedIds.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleCharacter(ch.id)}
                      className={`rounded-md border p-4 text-left transition ${
                        selected
                          ? 'border-gold-500/40 bg-gold-500/5 ring-1 ring-gold-500/30'
                          : 'border-ink-400/10 bg-parchment-50 hover:border-ink-400/20'
                      }`}
                    >
                      <p className="font-serif text-sm font-bold text-ink-900">{ch.name}</p>
                      <p className="mt-1 text-xs text-ink-400/50">
                        {ch.era} · {ch.mbti}
                      </p>
                      <p className="mt-1 text-xs text-ink-400/30">{ch.coreStance}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 提交 */}
            <button
              onClick={handleSubmit}
              disabled={!topic.trim() || selectedIds.length < 2}
              className="w-full rounded-md bg-gold-700 py-3 text-base font-serif font-bold text-parchment-100 tracking-wider transition hover:bg-gold-900 disabled:opacity-30"
            >
              请先哲论道（{selectedIds.length}位）
            </button>
          </div>
        )}

        {/* 步骤 2: SSE 直播 */}
        {step === 'generating' && (
          <LiveStream
            topic={topic}
            events={liveEvents as Parameters<typeof LiveStream>[0]['events']}
            done={liveDone}
            characterColorIndices={charColorIndices}
            characterEras={charEras}
          />
        )}

        {/* 步骤 3: 结果 */}
        {step === 'result' && (
          <div>
            <div
              id="debate-card"
              className="bg-parchment-100 p-8 sm:p-10 relative overflow-hidden shadow-sm"
            >
              {/* 品牌条 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl opacity-75">🎯</span>
                  <div>
                    <div className="font-serif text-base font-bold text-gold-700 tracking-[4px]">
                      赛博圆桌
                    </div>
                    <div className="font-mono text-[9px] text-ink-400/25 tracking-[2px]">
                      CYBER ROUNDTABLE
                    </div>
                  </div>
                </div>
                <div className="font-mono text-[10px] text-ink-400/20 tracking-[2px] px-3 py-1 border border-ink-400/10 rounded-full">
                  问策场
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-ink-400/15 to-transparent mb-5" />

              {/* 议题 */}
              <div className="text-center mb-7">
                <div className="font-mono text-[10px] text-ink-400/30 tracking-[4px] mb-2">
                  — 论题 —
                </div>
                <div className="font-serif text-2xl font-black text-ink-900 leading-relaxed tracking-[2px]">
                  {topic}
                </div>
              </div>

              {/* 轮次 */}
              {rounds.map((round, idx) => (
                <RoundSection
                  key={idx}
                  roundNumber={round.roundNumber}
                  title={round.title}
                  speeches={round.speeches}
                  characterColorIndices={charColorIndices}
                  characterEras={charEras}
                />
              ))}

              {/* 结案锦囊 */}
              {conclusion && <ConclusionCard conclusion={conclusion} />}

              {/* 落幕 */}
              <div className="mt-8 pt-5 border-t border-ink-400/10 text-center">
                <div className="font-serif text-sm text-ink-400/30 tracking-[6px] mb-4">
                  📜 论道已毕 · 先哲退席
                </div>
              </div>
              <div className="mt-4 text-center font-mono text-[9px] text-ink-400/10 tracking-[3px]">
                赛博圆桌 · 自动辩论 · 无需等待
              </div>
            </div>

            {/* 再来一局 */}
            <div className="text-center mt-6">
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-md border border-ink-400/15 bg-parchment-100 text-ink-400/50 text-sm tracking-wider transition hover:bg-parchment-200"
              >
                🔄 再来一局
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
