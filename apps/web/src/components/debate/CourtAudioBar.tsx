'use client';

import { useState, useRef, useEffect } from 'react';
import { formatTime } from './format-time';
import type { Chapter, MergedAudio } from '@/hooks/use-audio-player';

interface CourtAudioBarProps {
  audio: MergedAudio;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  totalChapters: number;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onSeekToChapter: (index: number) => void;
  onClose: () => void;
}

/** 章节类型 → 短标签 */
function shortChapterLabel(type: string, roundNumber?: number): string {
  switch (type) {
    case 'moderator_opening':
      return '开场';
    case 'moderator_closing':
      return '结语';
    case 'conclusion':
      return '结案';
    case 'speech':
      return roundNumber ? `R${roundNumber}` : '发言';
    default:
      return '';
  }
}

export function CourtAudioBar({
  audio,
  currentTime,
  duration,
  isPlaying,
  currentChapter,
  currentChapterIndex,
  totalChapters,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  onSeekToChapter,
  onClose,
}: CourtAudioBarProps) {
  const [expanded, setExpanded] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const chapters = audio?.chapters ?? [];

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speakerName = currentChapter?.speaker || '主持人';
  const chapterLabel = currentChapter
    ? shortChapterLabel(currentChapter.type, currentChapter.roundNumber)
    : '';

  // 点击外部关闭展开面板
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  return (
    <div ref={barRef} className="relative">
      {/* 主控制条 */}
      <div className="flex items-center gap-2.5 px-4 py-2 bg-parchment-200/80 border-b border-ink-400/8">
        {/* 播放/暂停 */}
        <button
          onClick={onToggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-700 hover:bg-gold-500/25 transition-colors"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* 时间 */}
        <span className="text-[11px] tabular-nums text-ink-400/50 w-8 shrink-0 text-right">
          {formatTime(currentTime)}
        </span>

        {/* 进度条 */}
        <div
          className="flex-1 relative group cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(ratio * duration);
          }}
        >
          {/* 轨道 */}
          <div className="h-1 rounded-full bg-ink-400/10 overflow-hidden">
            <div
              className="h-full bg-gold-500/50 rounded-full transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* 章节刻度 */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            {Array.from({ length: totalChapters - 1 }, (_, i) => {
              const chapterStart = ((i + 1) / totalChapters) * 100;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-ink-400/15"
                  style={{ left: `${chapterStart}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* 总时长 */}
        <span className="text-[11px] tabular-nums text-ink-400/50 w-8 shrink-0">
          {formatTime(duration)}
        </span>

        {/* 当前发言者 */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          <span className="font-serif text-[12px] text-ink-800/70 truncate max-w-[80px]">
            {speakerName}
          </span>
          {chapterLabel && (
            <span className="text-[9px] font-mono text-gold-600/50 tracking-[1px] shrink-0">
              {chapterLabel}
            </span>
          )}
        </div>

        {/* 上/下一章 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onPrev}
            disabled={currentChapterIndex <= 0}
            className="p-0.5 text-ink-400/40 disabled:opacity-30 hover:text-ink-400/70 transition-colors"
            title="上一章"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={onNext}
            disabled={currentChapterIndex >= totalChapters - 1}
            className="p-0.5 text-ink-400/40 disabled:opacity-30 hover:text-ink-400/70 transition-colors"
            title="下一章"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* 章节列表 & 关闭 */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-1 rounded transition-colors ${
              expanded ? 'text-gold-600 bg-gold-500/10' : 'text-ink-400/30 hover:text-ink-400/60'
            }`}
            title="章节列表"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 text-ink-400/30 hover:text-ink-400/60 transition-colors"
            title="关闭"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 章节列表（展开） */}
      {expanded && (
        <div className="absolute left-0 right-0 top-full z-20 border-b border-ink-400/10 bg-parchment-100 shadow-sm max-h-56 overflow-y-auto scrollbar-fade">
          {chapters.map((ch, i) => {
            const isActive = i === currentChapterIndex;
            return (
              <button
                key={i}
                onClick={() => {
                  onSeekToChapter(i);
                  setExpanded(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors
                  ${isActive ? 'bg-gold-500/10' : 'hover:bg-parchment-200/60'}`}
              >
                {/* 播放指示 */}
                <span className="w-3 shrink-0">
                  {isActive && (
                    <span className="inline-block h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
                  )}
                </span>
                <span className="text-[11px] tabular-nums text-ink-400/40 w-10 shrink-0">
                  {formatTime(ch.offset)}
                </span>
                <span className="text-[10px] font-mono text-gold-600/50 w-10 shrink-0">
                  {shortChapterLabel(ch.type, ch.roundNumber)}
                </span>
                <span
                  className={`text-[12px] truncate ${isActive ? 'text-gold-700 font-medium' : 'text-ink-800/70'}`}
                >
                  {ch.speaker}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
