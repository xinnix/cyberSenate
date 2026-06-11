'use client';

import { useState } from 'react';
import { formatTime } from './format-time';
import type { Chapter, MergedAudio } from '@/hooks/use-audio-player';

interface AudioPlayerProps {
  audio: MergedAudio;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  currentChapter: Chapter | null;
  currentChapterIndex: number;
  totalChapters: number;
  chapters: Chapter[];
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onSeekToChapter: (index: number) => void;
  onStop: () => void;
}

/** 章节类型 → 中文标签 */
function chapterLabel(type: string, roundNumber?: number): string {
  switch (type) {
    case 'moderator_opening':
      return '主持人开场';
    case 'moderator_closing':
      return '主持人结语';
    case 'conclusion':
      return '结案锦囊';
    case 'speech':
      return roundNumber ? `第${roundNumber}轮·发言` : '发言';
    default:
      return type;
  }
}

export function AudioPlayer({
  audio,
  currentTime,
  duration,
  isPlaying,
  currentChapter,
  currentChapterIndex,
  totalChapters,
  chapters,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  onSeekToChapter,
  onStop,
}: AudioPlayerProps) {
  const [showChapters, setShowChapters] = useState(false);

  if (!audio) return null;

  const speakerName = currentChapter?.speaker || '主持人';
  const isModerator =
    !currentChapter ||
    ['moderator_opening', 'moderator_closing', 'conclusion'].includes(currentChapter.type);
  const speakerColor = isModerator ? '#b8963a' : '#6a5528';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#b8963a]/30 bg-[#f5f0e6] shadow-lg">
      <div className="mx-auto max-w-[660px] px-4 py-3">
        {/* 主控制栏 */}
        <div className="flex items-center gap-3">
          {/* 发言者信息 */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm font-bold text-white"
              style={{ backgroundColor: speakerColor }}
            >
              {speakerName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-[#2a2824]">{speakerName}</div>
              <div className="text-xs text-[#2a2824]/50">
                {currentChapter
                  ? chapterLabel(currentChapter.type, currentChapter.roundNumber)
                  : ''}
              </div>
            </div>
          </div>

          {/* 传输控制 */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={currentChapterIndex <= 0}
              className="p-1 text-[#2a2824]/50 disabled:opacity-30 hover:text-[#2a2824]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#b8963a] hover:bg-[#b8963a]/10"
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={onNext}
              disabled={currentChapterIndex >= totalChapters - 1}
              className="p-1 text-[#2a2824]/50 disabled:opacity-30 hover:text-[#2a2824]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* 进度条 */}
          <div className="flex flex-1 items-center gap-2">
            <span className="text-xs tabular-nums text-[#2a2824]/50">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[#b8963a]/30 accent-[#b8963a]
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b8963a]"
            />
            <span className="text-xs tabular-nums text-[#2a2824]/50">{formatTime(duration)}</span>
          </div>

          {/* 章节列表切换 */}
          <button
            onClick={() => setShowChapters(!showChapters)}
            className={`p-1 transition-colors ${showChapters ? 'text-[#b8963a]' : 'text-[#2a2824]/40 hover:text-[#2a2824]'}`}
            title="章节列表"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </button>

          {/* 关闭按钮 */}
          <button
            onClick={onStop}
            className="p-1 text-[#2a2824]/40 hover:text-[#2a2824]"
            title="关闭播放器"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* 章节列表面板 */}
        {showChapters && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded border border-[#b8963a]/20 bg-[#faf7f0]">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => onSeekToChapter(i)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[#b8963a]/10
                  ${i === currentChapterIndex ? 'bg-[#b8963a]/15 font-medium text-[#b8963a]' : 'text-[#2a2824]/70'}`}
              >
                <span className="w-14 shrink-0 text-xs tabular-nums text-[#2a2824]/40">
                  {formatTime(ch.offset)}
                </span>
                <span className="shrink-0 text-xs text-[#2a2824]/40">
                  {chapterLabel(ch.type, ch.roundNumber)}
                </span>
                <span className="truncate">{ch.speaker}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
