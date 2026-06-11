'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 章节元数据 — 与后端 chapterMetadata 格式对齐
 */
export interface Chapter {
  offset: number;
  type: 'moderator_opening' | 'speech' | 'conclusion' | 'moderator_closing';
  speaker: string;
  roundNumber?: number;
  characterId?: string;
}

/**
 * 合并音频信息
 */
export interface MergedAudio {
  url: string;
  duration: number;
  chapters: Chapter[];
}

/**
 * 章节播放器 Hook
 * 播放单个合并 MP3，通过章节元数据实现跳转
 */
export function useChapterAudioPlayer(audio: MergedAudio | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const chapters = audio?.chapters ?? [];

  // 推导当前章节索引
  const currentChapterIndex = (() => {
    if (chapters.length === 0) return -1;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapters[i].offset) return i;
    }
    return 0;
  })();

  const currentChapter = chapters[currentChapterIndex] ?? null;

  // 初始化 Audio 元素
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audioEl = new Audio();

    audioEl.addEventListener('timeupdate', () => {
      setCurrentTime(audioEl.currentTime);
      if (audioEl.duration && isFinite(audioEl.duration)) {
        setDuration(audioEl.duration);
      }
    });

    audioEl.addEventListener('loadedmetadata', () => {
      if (audioEl.duration && isFinite(audioEl.duration)) {
        setDuration(audioEl.duration);
      }
    });

    audioEl.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audioRef.current = audioEl;

    return () => {
      audioEl.pause();
      audioEl.src = '';
    };
  }, []);

  // 当音频 URL 变化时加载
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !audio?.url) return;

    audioEl.src = audio.url;
    audioEl.load();
    setCurrentTime(0);
    setDuration(audio.duration || 0);
    setIsPlaying(false);
  }, [audio?.url]);

  const play = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !audio?.url) return;
    audioEl.play().catch(() => {
      setIsPlaying(false);
    });
    setIsPlaying(true);
  }, [audio?.url]);

  const pause = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seek = useCallback((time: number) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.currentTime = time;
    setCurrentTime(time);
  }, []);

  const seekToChapter = useCallback(
    (index: number) => {
      if (index < 0 || index >= chapters.length) return;
      const audioEl = audioRef.current;
      if (!audioEl) return;
      audioEl.currentTime = chapters[index].offset;
      setCurrentTime(chapters[index].offset);
      if (!isPlaying) {
        audioEl.play().catch(() => {});
        setIsPlaying(true);
      }
    },
    [chapters, isPlaying],
  );

  const next = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      seekToChapter(currentChapterIndex + 1);
    }
  }, [currentChapterIndex, chapters.length, seekToChapter]);

  const prev = useCallback(() => {
    if (currentChapterIndex > 0) {
      seekToChapter(currentChapterIndex - 1);
    }
  }, [currentChapterIndex, seekToChapter]);

  const stop = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.pause();
    audioEl.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  return {
    currentChapter,
    currentChapterIndex,
    isPlaying,
    currentTime,
    duration,
    chapters,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    seekToChapter,
    stop,
    totalChapters: chapters.length,
  };
}
