'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MergedAudio, Chapter } from '@/hooks/use-audio-player';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface AudioToggleButtonProps {
  debateId: string;
  onAudioReady: (audio: MergedAudio) => void;
}

type AudioState = 'idle' | 'checking' | 'generating' | 'ready' | 'failed';

/** 全局响应拦截器包裹格式：{ success, data, ... } */
function unwrap<T>(raw: any): T {
  if (raw?.success === true && raw?.data !== undefined) return raw.data as T;
  return raw as T;
}

export function AudioToggleButton({ debateId, onAudioReady }: AudioToggleButtonProps) {
  const [state, setState] = useState<AudioState>('idle');
  const [progress, setProgress] = useState({ ready: 0, total: 0 });

  // 轮询音频生成进度
  useEffect(() => {
    if (state !== 'generating') return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/debates/${debateId}/audio-status`);
        if (!res.ok) return;
        const raw = await res.json();
        const inner = unwrap<{ total: number; ready: number; status: string }>(raw);
        setProgress({ ready: inner.ready, total: inner.total });

        if (inner.status === 'ready') {
          setState('ready');
        } else if (inner.status === 'failed') {
          setState('failed');
        }
      } catch {
        // 网络错误，继续轮询
      }
    };

    const interval = setInterval(poll, 5000);
    poll();

    return () => clearInterval(interval);
  }, [debateId, state]);

  /** 从 /audio 端点加载合并音频数据 */
  const loadMergedAudio = useCallback(async (): Promise<MergedAudio | null> => {
    const res = await fetch(`${API_BASE}/debates/${debateId}/audio`);
    if (!res.ok) return null;
    const raw = await res.json();
    const inner = unwrap<{
      audioStatus: string;
      mergedAudioUrl: string;
      mergedAudioDuration: number;
      chapterMetadata: Chapter[];
    }>(raw);

    if (inner.mergedAudioUrl && inner.chapterMetadata?.length > 0) {
      return {
        url: inner.mergedAudioUrl,
        duration: inner.mergedAudioDuration || 0,
        chapters: inner.chapterMetadata,
      };
    }
    return null;
  }, [debateId]);

  const handleClick = useCallback(async () => {
    if (state === 'ready') {
      const audio = await loadMergedAudio();
      if (audio) {
        onAudioReady(audio);
        return;
      }
    }

    setState('checking');
    try {
      const res = await fetch(`${API_BASE}/debates/${debateId}/audio-status`);
      if (!res.ok) {
        setState('idle');
        return;
      }
      const raw = await res.json();
      const inner = unwrap<{ total: number; ready: number; status: string }>(raw);

      if (inner.status === 'ready') {
        setState('ready');
        const audio = await loadMergedAudio();
        if (audio) {
          onAudioReady(audio);
          return;
        }
      } else if (inner.status === 'generating' && inner.ready > 0) {
        setState('generating');
      } else {
        setState('generating');
        await fetch(`${API_BASE}/debates/${debateId}/generate-audio`, { method: 'POST' });
      }
    } catch {
      setState('idle');
    }
  }, [debateId, state, onAudioReady, loadMergedAudio]);

  return (
    <button
      onClick={handleClick}
      disabled={state === 'checking'}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#b8963a]/40 bg-[#f5f0e6] px-3 py-1.5 text-sm text-[#2a2824] transition-colors hover:bg-[#ede6d8] disabled:opacity-50"
    >
      {state === 'idle' && (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-[#b8963a]"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          听辩论
        </>
      )}
      {state === 'checking' && (
        <>
          <svg className="h-3.5 w-3.5 animate-spin text-[#b8963a]" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          检查中...
        </>
      )}
      {state === 'generating' && (
        <>
          <svg className="h-3.5 w-3.5 animate-spin text-[#b8963a]" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          音频生成中 {progress.total > 0 && `${progress.ready}/${progress.total}`}
        </>
      )}
      {state === 'ready' && (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-[#b8963a]"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          听辩论
        </>
      )}
      {state === 'failed' && (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-red-400"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          重试生成
        </>
      )}
    </button>
  );
}
