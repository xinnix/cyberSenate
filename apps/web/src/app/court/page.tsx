'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api-client';
import { RoundSection } from '@/components/debate/RoundSection';
import { SenateDecreeModal } from '@/components/debate/SenateDecreeModal';
import { CourtAudioBar } from '@/components/debate/CourtAudioBar';
import { useChapterAudioPlayer, type MergedAudio, type Chapter } from '@/hooks/use-audio-player';
import { getCharacterColors, getInitial } from '@/components/debate/characterColors';

/* ── 类型 ─────────────────────────────────────────── */

interface Sage {
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

interface DebateListItem {
  id: string;
  topic: string;
  createdAt: string;
  characters: {
    character: { id: string; name: string; avatar: string | null; era: string; mbti: string };
  }[];
}

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

interface DebateDetail extends DebateListItem {
  type: string;
  status: string;
  rounds: DebateRound[];
  conclusion: Conclusion;
}

interface DailyStatus {
  todayExists: boolean;
  nextGenerationAt: string;
  countdownSeconds: number;
  status: string | null;
  todayDebate: DebateDetail | null;
}

/* ── 页面 ─────────────────────────────────────────── */

export default function RoundTablePage() {
  // 每日状态 & 倒计时
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [countdown, setCountdown] = useState('');

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

  // 智者列表（右侧栏）
  const [sages, setSages] = useState<Sage[]>([]);
  const [loadingSages, setLoadingSages] = useState(true);

  /* ── 每日状态 & 倒计时 ─────────────────────────── */

  // 获取今日状态
  const fetchDailyStatus = useCallback(async () => {
    try {
      const res = await apiClient.get<DailyStatus>('/debates/daily-status');
      const data = res?.data ?? res;
      if (data) setDailyStatus(data);
    } catch {
      // 静默失败
    }
  }, []);

  // 秒级倒计时更新
  useEffect(() => {
    if (!dailyStatus?.nextGenerationAt) return;
    const next = new Date(dailyStatus.nextGenerationAt).getTime();

    const tick = () => {
      const diff = Math.max(0, Math.floor((next - Date.now()) / 1000));
      if (diff <= 0) {
        setCountdown('即将生成');
        fetchDailyStatus(); // 刷新状态
        return;
      }
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setCountdown(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [dailyStatus?.nextGenerationAt, fetchDailyStatus]);

  // 首次获取
  useEffect(() => {
    fetchDailyStatus();
  }, [fetchDailyStatus]);

  // 获取智者列表
  const fetchSages = useCallback(async () => {
    try {
      const res = await apiClient.get<Sage[]>('/debates/characters');
      const data = res.data || [];
      setSages(data);
    } catch {
      // 静默失败
    } finally {
      setLoadingSages(false);
    }
  }, []);

  useEffect(() => {
    fetchSages();
  }, [fetchSages]);

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
        d.characters?.forEach((dc, i: number) => {
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
          chapterMetadata: Chapter[];
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

  // 当前辩论中参与的角色 ID 集合（用于右侧栏高亮）
  const activeSageIds = new Set(detail?.characters?.map((dc) => dc.character.id) ?? []);

  // 当前正在播放音频的角色 ID
  const speakingCharacterId =
    mergedAudio && player.isPlaying && player.currentChapter?.characterId
      ? player.currentChapter.characterId
      : null;

  // 参议谱：展示 7 位角色（含当前讨论的 3 位，其余随机）
  const displaySages = useMemo(() => {
    if (sages.length <= 7) return sages;

    const active = sages.filter((s) => activeSageIds.has(s.id));
    const inactive = sages.filter((s) => !activeSageIds.has(s.id));

    // Fisher-Yates shuffle 取前 N 个补齐
    const shuffled = [...inactive];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const fill = 7 - active.length;
    return [...active, ...shuffled.slice(0, Math.max(0, fill))];
  }, [sages, activeSageIds]);

  /* ── 章节 → 发言 索引映射 ── */

  // 构建 (roundNumber, speechIndexInRound) → chapterIndex 映射
  const speechChapterMap = useMemo(() => {
    if (!mergedAudio?.chapters) return null;
    const map = new Map<string, number>();
    // 按 roundNumber 分组 speech 类型章节
    const speechChapters = mergedAudio.chapters
      .map((ch, idx) => ({ ...ch, idx }))
      .filter((ch) => ch.type === 'speech');
    const byRound = new Map<number, typeof speechChapters>();
    for (const ch of speechChapters) {
      const rn = ch.roundNumber ?? 0;
      if (!byRound.has(rn)) byRound.set(rn, []);
      byRound.get(rn)!.push(ch);
    }
    for (const [rn, chapters] of byRound) {
      chapters.forEach((ch, i) => {
        map.set(`${rn}-${i}`, ch.idx);
      });
    }
    return map;
  }, [mergedAudio?.chapters]);

  const getSpeechChapterIndex = useCallback(
    (roundNumber: number, speechIndex: number): number | undefined => {
      return speechChapterMap?.get(`${roundNumber}-${speechIndex}`);
    },
    [speechChapterMap],
  );

  const handlePlayAudioChapter = useCallback(
    (chapterIndex: number) => {
      player.seekToChapter(chapterIndex);
    },
    [player],
  );

  /* ── 侧栏列表（抽离为组件，桌面 & 手机复用） ── */

  const sidebarContent = (
    <>
      {/* 列表头 */}
      <div className="sticky top-0 z-10 bg-parchment-300 px-5 pt-6 pb-3 border-b border-ink-400/8">
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
                {d.characters?.map((dc, i: number) => (
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

  /* ── 右侧栏：智者列表 ─────────────────────────── */

  const rightSidebarContent = (
    <>
      {/* 头部 */}
      <div className="px-5 pt-6 pb-3 border-b border-ink-400/8">
        <div className="flex items-center gap-2">
          <span className="text-lg opacity-75">👥</span>
          <h2 className="font-serif text-sm font-bold text-gold-700 tracking-[3px]">参议谱</h2>
        </div>
        <p className="mt-1 font-mono text-[9px] text-ink-400/25 tracking-[2px]">COUNCIL OF SAGES</p>
      </div>

      {/* 列表 */}
      <div className="px-3 py-3 space-y-2">
        {loadingSages ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-200/30 border-t-ink-400" />
          </div>
        ) : sages.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-ink-400/30">暂无贤者</p>
          </div>
        ) : (
          displaySages.map((sage, index) => {
            const colors = getCharacterColors(index);
            const initial = getInitial(sage.name);
            const isActive = detail && activeSageIds.has(sage.id);
            const isSpeaking = speakingCharacterId === sage.id;
            return (
              <div
                key={sage.id}
                className={`group rounded-md px-3 py-2.5 transition-all duration-300 cursor-default border ${
                  isSpeaking
                    ? 'bg-gold-500/10 border-l-2 border-l-gold-500 border-t border-r border-b border-gold-500/30 shadow-[3px_0_8px_-2px_rgba(212,175,55,0.4)]'
                    : isActive
                      ? 'bg-parchment-100 border-l-2 border-l-gold-500 border-t border-r border-b border-ink-400/10 shadow-[2px_0_0_0_rgba(212,175,55,0.3)]'
                      : 'bg-parchment-100/50 hover:bg-parchment-100 border border-ink-400/5 hover:border-gold-500/15'
                }`}
              >
                {/* 头部区域 */}
                <div className="flex items-start gap-2.5">
                  {/* 头像 */}
                  <div
                    className={`relative shrink-0 w-9 h-9 rounded-md flex items-center justify-center overflow-hidden text-sm font-bold ${
                      isSpeaking ? 'ring-2 ring-gold-500/60 animate-pulse' : ''
                    }`}
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {sage.avatar ? (
                      <Image src={sage.avatar} alt={sage.name} fill className="object-cover" />
                    ) : (
                      initial
                    )}
                  </div>

                  {/* 名称 + 徽章 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-serif text-sm font-bold text-ink-800">{sage.name}</span>
                      <span className="rounded bg-parchment-300/80 px-1.5 py-0.5 text-[9px] font-mono text-ink-500/60 leading-tight">
                        {sage.era}
                      </span>
                      {isActive && !isSpeaking && (
                        <span className="rounded bg-gold-500/10 px-1.5 py-0.5 text-[8px] font-mono text-gold-600/70 leading-tight tracking-[1px]">
                          参议中
                        </span>
                      )}
                      {isSpeaking && (
                        <span className="rounded bg-gold-500/20 px-1.5 py-0.5 text-[8px] font-mono text-gold-700 leading-tight tracking-[1px] animate-pulse">
                          🔊 发言中
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gold-600/50 tracking-[1px]">
                        {sage.mbti}
                      </span>
                      {sage.expertise && (
                        <>
                          <span className="text-[8px] text-ink-400/30">·</span>
                          <span className="text-[10px] text-ink-500/50 truncate">
                            {sage.expertise}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 核心立场（只有桌面 hover 展开） */}
                {sage.coreStance && (
                  <div className="mt-1.5 ml-[46px] text-[11px] text-ink-500/60 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all font-serif">
                    — {sage.coreStance}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 底部水印 */}
      <div className="px-4 py-4 text-center">
        <div className="font-mono text-[8px] text-ink-400/15 tracking-[2px]">
          与历史先哲 · 共议天下事
        </div>
      </div>
    </>
  );

  /* ── 渲染 ──────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-parchment-300 flex flex-col font-sans-cn">
      {/* 主体：左中右三栏 */}
      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* ──── 左侧：朝议列表（桌面端） ──── */}
        <aside className="hidden md:block w-[300px] lg:w-[340px] shrink-0 border-r border-ink-400/10 overflow-y-overlay overflow-y-auto h-[calc(100vh-56px)] sticky top-[56px] scrollbar-fade">
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

          {/* ──── 顶部倒计时 ──── */}
          <div className="border-b border-ink-400/8 px-6 py-3">
            {dailyStatus?.todayExists ? (
              <div className="flex items-center gap-2 text-gold-700/70">
                <span className="text-sm">⏳</span>
                <span className="font-mono text-[11px] tracking-[2px]">下次朝议 · {countdown}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ink-500">
                <span className="text-sm">📜</span>
                <span className="font-serif text-[11px] tracking-[1px]">
                  今日朝议 {dailyStatus?.status === 'GENERATING' ? '生成中…' : '即将开始'}
                </span>
              </div>
            )}
            <div className="mt-1 font-mono text-[9px] text-ink-400/25 tracking-[2px]">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </div>
          </div>

          {/* ──── 音频控制条（仅音频已生成时显示） ──── */}
          {mergedAudio && (
            <CourtAudioBar
              audio={mergedAudio}
              currentTime={player.currentTime}
              duration={player.duration}
              isPlaying={player.isPlaying}
              currentChapter={player.currentChapter}
              currentChapterIndex={player.currentChapterIndex}
              totalChapters={player.totalChapters}
              onToggle={player.toggle}
              onNext={player.next}
              onPrev={player.prev}
              onSeek={player.seek}
              onSeekToChapter={player.seekToChapter}
              onClose={() => {
                player.stop();
                setMergedAudio(null);
              }}
            />
          )}

          {loadingDetail ? (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200/30 border-t-ink-400" />
            </div>
          ) : !detail ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              {/* Hero 区：产品价值观 */}
              <div className="max-w-lg mx-auto mb-16">
                <div className="font-serif text-5xl sm:text-6xl font-black text-ink-900 leading-[1.2] tracking-[3px]">
                  一个问题
                </div>
                <div className="mt-3 font-serif text-xl sm:text-2xl font-bold text-gold-700 tracking-[6px]">
                  万智共鸣
                </div>
                <div className="mt-8 w-12 h-px bg-ink-400/15 mx-auto" />
                <p className="mt-8 text-[15px] text-ink-400/60 leading-relaxed tracking-[1px] font-serif">
                  溯千载智慧之流，解今朝现世之围。
                </p>
                <p className="mt-2 text-[13px] text-ink-400/40 leading-relaxed tracking-[1px] font-serif">
                  每日朝议，让苏格拉底、鲁迅、尼采共议 AI；
                  <br />
                  跨时空对话，为你的困惑提供深度洞见。
                </p>
                <div className="mt-10 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="font-serif text-2xl font-bold text-ink-900">🏛️</div>
                    <div className="mt-1.5 font-mono text-[10px] text-ink-400/30 tracking-[2px]">
                      每日朝议
                    </div>
                  </div>
                  <div className="w-px h-10 bg-ink-400/10" />
                  <div className="text-center">
                    <div className="font-serif text-2xl font-bold text-ink-900">🎭</div>
                    <div className="mt-1.5 font-mono text-[10px] text-ink-400/30 tracking-[2px]">
                      先哲论战
                    </div>
                  </div>
                  <div className="w-px h-10 bg-ink-400/10" />
                  <div className="text-center">
                    <div className="font-serif text-2xl font-bold text-ink-900">📜</div>
                    <div className="mt-1.5 font-mono text-[10px] text-ink-400/30 tracking-[2px]">
                      法卷截屏
                    </div>
                  </div>
                </div>
              </div>

              {/* 提示文字 */}
              <div className="text-ink-400/20 text-sm font-serif tracking-[3px]">
                — 选择左侧朝议，入座思想局 —
              </div>
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
                    {detail.characters?.map((dc, i: number) => (
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
                {detail.rounds?.map((round, idx: number) => (
                  <RoundSection
                    key={idx}
                    roundNumber={round.roundNumber}
                    title={round.title}
                    speeches={round.speeches}
                    characterColorIndices={charColorIndices}
                    characterEras={charEras}
                    getSpeechChapterIndex={getSpeechChapterIndex}
                    onPlayAudioChapter={handlePlayAudioChapter}
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

              {/* 页脚 */}
              <div className="mt-10 pb-8 text-center font-serif text-xs text-ink-400/20 tracking-[3px]">
                抽身尘嚣三分钟，入座千载思想局。
              </div>
            </div>
          )}
        </main>

        {/* ──── 右侧：贤者谱（桌面端） ──── */}
        <aside className="hidden xl:block w-[300px] lg:w-[340px] shrink-0 border-l border-ink-400/10 overflow-y-overflow overflow-y-auto h-[calc(100vh-56px)] sticky top-[56px] scrollbar-fade">
          {rightSidebarContent}
        </aside>
      </div>

      {/* ──── 朝议法卷弹窗（页面根层级，覆盖三栏） ──── */}
      {showConclusion && detail?.conclusion && (
        <SenateDecreeModal
          conclusion={detail.conclusion}
          debateId={detail.id}
          onClose={() => setShowConclusion(false)}
        />
      )}

      {/* ──── 底部版权 ──── */}
      <div className="border-t border-ink-400/8 px-4 py-3 text-center">
        <div className="font-mono text-[10px] text-ink-400/25 tracking-[2px]">
          赛博圆桌 · Cyber Senate
        </div>
        <div className="mt-0.5 font-mono text-[8px] text-ink-400/15 tracking-[1px]">
          v1.0.0 &copy; {new Date().getFullYear()} 赛博圆桌
        </div>
      </div>
    </div>
  );
}
