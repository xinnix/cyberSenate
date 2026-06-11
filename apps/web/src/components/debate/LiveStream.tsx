'use client';

import { useRef, useEffect } from 'react';
import { SpeechBubble } from './SpeechBubble';
import { cleanText } from './cleanText';

interface LiveEvent {
  type: string;
  roundNumber?: number;
  title?: string;
  content?: string;
  characterId?: string;
  characterName?: string;
  conclusion?: any;
  message?: string;
  status?: string;
}

interface LiveStreamProps {
  topic: string;
  events: LiveEvent[];
  done: boolean;
  characterColorIndices?: Record<string, number>;
  characterEras?: Record<string, string>;
}

export function LiveStream({
  topic,
  events,
  done,
  characterColorIndices = {},
  characterEras = {},
}: LiveStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="rounded-lg border-2 border-gold-500/30 bg-parchment-100 overflow-hidden">
      {/* 标题 */}
      <div className="border-b border-ink-200/15 bg-gradient-to-r from-gold-500/5 to-transparent px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">📡</span>
          <span className="font-serif text-sm font-bold text-ink-600">{topic}</span>
        </div>
      </div>

      {/* 事件流 */}
      <div ref={scrollRef} className="max-h-[500px] overflow-y-auto p-5">
        <div className="space-y-4">
          {events.map((evt, i) => {
            if (evt.type === 'status') return null;

            if (evt.type === 'round_start')
              return (
                <div key={i} className="flex items-center gap-3 pt-2">
                  <div className="h-px flex-1 bg-ink-200/40" />
                  <span className="text-xs font-serif font-bold text-ink-400/60 tracking-widest whitespace-nowrap">
                    第{evt.roundNumber}轮 · {evt.title}
                  </span>
                  <div className="h-px flex-1 bg-ink-200/40" />
                </div>
              );

            if (evt.type === 'moderator_opening')
              return (
                <div
                  key={i}
                  className="px-4 py-2 rounded-lg bg-gold-500/5 text-sm text-ink-600/70 italic font-serif"
                >
                  🎤 {cleanText(evt.content || '')}
                </div>
              );

            if (evt.type === 'moderator_closing')
              return (
                <div
                  key={i}
                  className="px-4 py-2 rounded-lg bg-gold-500/5 text-sm text-ink-600/70 italic font-serif"
                >
                  🎤 {cleanText(evt.content || '')}
                </div>
              );

            if (evt.type === 'speech')
              return (
                <SpeechBubble
                  key={i}
                  characterName={evt.characterName || ''}
                  colorIndex={characterColorIndices[evt.characterId || ''] ?? 0}
                  era={characterEras[evt.characterId || '']}
                  content={evt.content || ''}
                />
              );

            if (evt.type === 'conclusion') return null; // conclusion handled by parent page

            if (evt.type === 'error')
              return (
                <div key={i} className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  ❌ {evt.message}
                </div>
              );

            return null;
          })}

          {!done && events.length === 0 && (
            <div className="flex flex-col items-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink-200/40 border-t-gold-500" />
              <p className="mt-4 text-ink-400/60 font-sans-cn">先哲们正在入席准备…</p>
              <p className="mt-1 text-xs text-ink-400/30">正在等待第一段内容</p>
            </div>
          )}
          {!done && events.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200/40 border-t-gold-500" />
              <span className="text-sm text-ink-400/40">思考中…</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
