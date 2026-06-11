'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { RoundSection } from '@/components/debate/RoundSection';
import { SenateDecreeModal } from '@/components/debate/SenateDecreeModal';
import { AudioPlayer } from '@/components/debate/AudioPlayer';
import { ShareToolbar } from '@/components/debate/ShareToolbar';
import { useChapterAudioPlayer, type MergedAudio } from '@/hooks/use-audio-player';

/* ── 类型 ─────────────────────────────────────────── */

interface DebateListItem {
  id: string;
  topic: string;
  createdAt: string;
  characters: {
    character: { id: string; name: string; avatar: string | null; era: string; mbti: string };
  }[];
}

interface DebateDetail extends DebateListItem {
  type: string;
  status: string;
  rounds: any[];
  conclusion: any;
}

/* ── 页面 ─────────────────────────────────────────── */

export default function RoundTablePage() {
  // 列表
  const [debates, setDebates] = useState<DebateListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingList, setLoadingList] = useState(true);

  // 选中
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DebateDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 手机端抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // 结案展示
  const [showConclusion, setShowConclusion] = useState(false);

  // 角色索引（着色用）
  const [charMeta, setCharMeta] = useState<Record<string, { index: number; era: string }>>({});

  // 音频
  const [mergedAudio, setMergedAudio] = useState<MergedAudio | null>(null);
  const player = useChapterAudioPlayer(mergedAudio);

  /* ── 获取列表 ──────────────────────────────────── */

  const fetchDebates = useCallback(
    async (p: number, append = false) => {
      try {
        const res = await apiClient.get<DebateListItem[]>(
          `/debates?type=COURT&page=${p}&pageSize=20`,
        );
        const data = res.data || [];
        if (append) {
          setDebates((prev) => [...prev, ...data]);
        } else {
          setDebates(data);
        }
        setHasMore(data.length >= 20);

        // 首次加载时自动选中第一条
        if (!append && data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      } catch {
        if (!append) setDebates([]);
      } finally {
        setLoadingList(false);
      }
    },
    [selectedId],
  );

  // 首次加载列表（仅一次）
  useEffect(() => {
    fetchDebates(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── 获取详情 ──────────────────────────────────── */

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await apiClient.get<DebateDetail>(`/debates/${selectedId}`);
        if (cancelled) return;
        const d = res.data;
        setDetail(d);

        // 构建角色索引
        const meta: Record<string, { index: number; era: string }> = {};
        d.characters?.forEach((dc: any, i: number) => {
          const c = dc.character;
          if (c?.id) meta[c.id] = { index: i, era: c.era || '' };
        });
        setCharMeta(meta);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  /* ── 音频 ──────────────────────────────────────── */

  const fetchAudio = useCallback(async (debateId: string) => {
    try {
      const res = await apiClient.get<{ total: number; ready: number; status: string }>(
        `/debates/${debateId}/audio-status`,
      );
      const status = res?.data ?? res;
      if (status?.status === 'ready') {
        const audioRes = await apiClient.get<{
          mergedAudioUrl: string;
          mergedAudioDuration: number;
          chapterMetadata: any[];
        }>(`/debates/${debateId}/audio`);
        const audioData = audioRes?.data ?? audioRes;
        if (audioData?.mergedAudioUrl && audioData?.chapterMetadata?.length > 0) {
          setMergedAudio({
            url: audioData.mergedAudioUrl,
            duration: audioData.mergedAudioDuration || 0,
            chapters: audioData.chapterMetadata,
          });
        }
      }
    } catch {
      // audio may not be available yet
    }
  }, []);

  useEffect(() => {
    if (detail?.id) {
      setMergedAudio(null);
      const timer = setTimeout(() => fetchAudio(detail.id), 2000);
      return () => clearTimeout(timer);
    }
  }, [detail?.id, fetchAudio]);

  /* ── 加载更多 ──────────────────────────────────── */

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchDebates(next, true);
  };

  /* ── 选中并关闭抽屉（手机端） ──────────────────── */

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(false);
    setShowConclusion(false);
  };

  /* ── 点击遮罩关闭抽屉 ──────────────────────────── */

  useEffect(() => {
    if (!drawerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [drawerOpen]);

  /* ── 衍生数据 ──────────────────────────────────── */

  const charColorIndices = Object.fromEntries(
    Object.entries(charMeta).map(([k, v]) => [k, v.index]),
  );
  const charEras = Object.fromEntries(Object.entries(charMeta).map(([k, v]) => [k, v.era]));

  /* ── 侧栏列表（抽离为组件，桌面 & 手机复用） ── */

  const sidebarContent = (
    <>
      {/* 列表头 */}
      <div className="sticky top-0 z-10 bg-parchment-300 px-5 pt-8 pb-4 border-b border-ink-400/8">
        <div className="flex items-center gap-2">
          <span className="text-lg opacity-75">🏛️</span>
          <h2 className="font-serif text-sm font-bold text-gold-700 tracking-[3px]">朝议录</h2>
        </div>
        <p className="mt-1 font-mono text-[9px] text-ink-400/25 tracking-[2px]">ARCHIVES</p>
      </div>

      {/* 列表内容 */}
      {loadingList ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200/30 border-t-ink-400" />
        </div>
      ) : debates.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-ink-400/30">尚无朝议记录</p>
        </div>
      ) : (
        <div className="py-2">
          {debates.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id)}
              className={`w-full text-left px-5 py-4 transition-colors border-b border-ink-400/5 ${
                selectedId === d.id
                  ? 'bg-parchment-100 border-l-2 border-l-gold-500'
                  : 'hover:bg-parchment-100/60'
              }`}
            >
              <h3
                className={`font-serif text-sm leading-snug line-clamp-2 ${
                  selectedId === d.id ? 'text-ink-900 font-bold' : 'text-ink-800 font-medium'
                }`}
              >
                {d.topic}
              </h3>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                {d.characters?.map((dc: any, i: number) => (
                  <span key={i} className="text-[11px] text-ink-400/50">
                    {dc.character.name}
                    {i < d.characters.length - 1 && ' ·'}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-ink-400/25">
                {new Date(d.createdAt).toLocaleDateString('zh-CN', {
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </button>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-3 text-xs text-ink-400/30 hover:text-ink-400/50 transition tracking-wider"
            >
              查看更早 ↓
            </button>
          )}
        </div>
      )}
    </>
  );

  /* ── 渲染 ──────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-parchment-300 flex flex-col font-sans-cn">
      {/* 主体：左右分栏 */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* ──── 左侧：朝议列表（桌面端） ──── */}
        <aside className="hidden md:block w-[320px] lg:w-[340px] shrink-0 border-r border-ink-400/10 overflow-y-overlay overflow-y-auto h-[calc(100vh-56px)] sticky top-[56px] scrollbar-fade">
          {sidebarContent}
        </aside>

        {/* ──── 手机端：抽屉遮罩 ──── */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-ink-900/20 backdrop-blur-[2px] md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* ──── 手机端：抽屉面板 ──── */}
        <div
          ref={drawerRef}
          className={`fixed top-0 left-0 z-50 h-full w-[300px] bg-parchment-200 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden overflow-y-auto scrollbar-fade ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-ink-400/40 hover:text-ink-400/70 hover:bg-parchment-300/60 transition"
          >
            ✕
          </button>
          {sidebarContent}
        </div>

        {/* ──── 右侧：朝议内容 ──── */}
        <main className="flex-1 min-w-0 overflow-y-auto h-[calc(100vh-56px)] sticky top-[56px] scrollbar-fade relative">
          {/* 手机端：打开目录按钮 */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden fixed bottom-6 left-6 z-30 w-12 h-12 rounded-full bg-parchment-100 shadow-lg border border-ink-400/10 flex items-center justify-center text-lg active:scale-95 transition-transform"
          >
            📚
          </button>

          {loadingDetail ? (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200/30 border-t-ink-400" />
            </div>
          ) : !detail ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-4xl mb-4 opacity-30">📜</span>
              <p className="text-ink-400/30 text-sm">选择左侧朝议以查看内容</p>
            </div>
          ) : (
            <div className="max-w-[920px] mx-auto px-6 py-8">
              {/* 辩论卡片 */}
              <div
                id="debate-card"
                className="bg-parchment-100 p-8 sm:p-10 relative overflow-hidden shadow-sm"
              >
                {/* 议题 */}
                <div className="text-center mb-7">
                  <div className="font-mono text-[10px] text-ink-400/30 tracking-[4px] mb-2">
                    — 今日议题 —
                  </div>
                  <div className="font-serif text-2xl font-black text-ink-900 leading-relaxed tracking-[2px]">
                    {detail.topic}
                  </div>
                  <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
                    {detail.characters?.map((dc: any, i: number) => (
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
                {detail.rounds?.map((round: any, idx: number) => (
                  <RoundSection
                    key={idx}
                    roundNumber={round.roundNumber}
                    title={round.title}
                    speeches={round.speeches}
                    characterColorIndices={charColorIndices}
                    characterEras={charEras}
                  />
                ))}

                {/* 朝议法卷（弹窗） */}
                {detail.conclusion && !showConclusion && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setShowConclusion(true)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md border border-gold-500/25 bg-parchment-200/60 font-serif text-[13px] font-medium tracking-wider text-gold-700/70 hover:bg-parchment-200 hover:text-gold-700 transition"
                    >
                      📜 展开朝议法卷
                    </button>
                  </div>
                )}

                {showConclusion && detail.conclusion && (
                  <SenateDecreeModal
                    conclusion={detail.conclusion}
                    debateId={detail.id}
                    onClose={() => setShowConclusion(false)}
                  />
                )}

                {/* 落幕 */}
                <div className="mt-8 pt-5 border-t border-ink-400/10 text-center">
                  <div className="font-serif text-sm text-ink-400/30 tracking-[6px]">
                    📜 朝议已毕 · 群贤退席 · 识见留存
                  </div>
                </div>
                <div className="mt-4 text-center font-mono text-[9px] text-ink-400/10 tracking-[3px]">
                  一个问题，万智共鸣。
                </div>
              </div>

              {/* 截图工具栏 */}
              <div className="mt-4">
                <ShareToolbar
                  cardId="debate-card"
                  fileName={`赛博圆桌-${detail.topic.slice(0, 10)}`}
                />
              </div>

              {/* 页脚 */}
              <div className="mt-10 pb-8 text-center font-serif text-xs text-ink-400/20 tracking-[3px]">
                抽身尘嚣三分钟，入座千载思想局。
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 底部音频播放器 */}
      {mergedAudio && (
        <AudioPlayer
          audio={mergedAudio}
          currentTime={player.currentTime}
          duration={player.duration}
          isPlaying={player.isPlaying}
          currentChapter={player.currentChapter}
          currentChapterIndex={player.currentChapterIndex}
          totalChapters={player.totalChapters}
          chapters={player.chapters}
          onToggle={player.toggle}
          onNext={player.next}
          onPrev={player.prev}
          onSeek={player.seek}
          onSeekToChapter={player.seekToChapter}
          onStop={() => {
            player.stop();
            setMergedAudio(null);
          }}
        />
      )}
    </div>
  );
}
