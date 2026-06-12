'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getCharacterColors, getInitial } from './characterColors';
import { MarkdownText } from './MarkdownText';

interface SpeechBubbleProps {
  characterName: string;
  colorIndex: number;
  era?: string;
  content: string;
  /** 合并音频中对应的章节索引，未生成音频时为 undefined */
  audioChapterIndex?: number;
  /** 跳转到指定章节并播放 */
  onPlayAudioChapter?: (index: number) => void;
}

export function SpeechBubble({
  characterName,
  colorIndex,
  era,
  content,
  audioChapterIndex,
  onPlayAudioChapter,
}: SpeechBubbleProps) {
  const colors = getCharacterColors(colorIndex);
  const initial = getInitial(characterName);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 是否有合并音频可用
  const hasAudio = audioChapterIndex !== undefined && onPlayAudioChapter;

  // 首次渲染时尝试获取语音列表（作为无音频时的 fallback）
  useEffect(() => {
    if (!hasAudio) {
      window.speechSynthesis.getVoices();
    }
  }, [hasAudio]);

  if (!content?.trim()) return null;

  const handlePlay = useCallback(() => {
    if (hasAudio) {
      // 有合并音频 → 跳转到对应章节播放
      onPlayAudioChapter!(audioChapterIndex!);
      return;
    }

    // 无合并音频 → 回退到 Web Speech API
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const plain = content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/^>\s*/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\n{2,}/g, '\n')
      .trim();

    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = 'zh-CN';

    const voices = window.speechSynthesis.getVoices();
    const preferred = ['Ting-Ting', 'Sin-Ji', 'Li-Mu', 'Li Na', 'Mei-Jia', 'Huihui'];
    let bestVoice: SpeechSynthesisVoice | null = null;
    for (const name of preferred) {
      const found = voices.find((v) => v.name.includes(name));
      if (found) {
        bestVoice = found;
        break;
      }
    }
    if (!bestVoice) {
      bestVoice = voices.find((v) => v.lang.startsWith('zh')) ?? null;
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.rate = bestVoice.name.includes('Ting-Ting') ? 0.82 : 0.85;
    } else {
      utterance.rate = 0.85;
    }

    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [content, playing, hasAudio, audioChapterIndex, onPlayAudioChapter]);

  // 组件卸载时停止 Web Speech
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="py-4 border-b border-ink-100/40 last:border-b-0 group">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: colors.bg }}
        >
          <span
            className="font-serif text-base font-bold leading-none"
            style={{ color: colors.text }}
          >
            {initial}
          </span>
        </div>
        <span className="font-serif text-sm font-bold" style={{ color: colors.text }}>
          {characterName}
        </span>

        {/* 播放按钮 */}
        <button
          onClick={handlePlay}
          className="ml-1 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: hasAudio
              ? `${colors.text}15`
              : playing
                ? colors.text
                : `${colors.text}15`,
            color: hasAudio ? colors.text : playing ? '#fff' : colors.text,
          }}
          title={hasAudio ? '播放此段语音' : playing ? '停止朗读' : '朗读此段'}
        >
          {!hasAudio && playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <span className="ml-auto text-[10px] text-ink-400/50 font-mono tracking-wider">{era}</span>
      </div>
      <div className="pl-[48px]">
        <MarkdownText content={content} className="text-ink-900 text-[15px] font-medium" />
      </div>
    </div>
  );
}
