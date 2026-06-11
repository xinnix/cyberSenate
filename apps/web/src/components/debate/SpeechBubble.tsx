'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getCharacterColors, getInitial } from './characterColors';
import { MarkdownText } from './MarkdownText';

interface SpeechBubbleProps {
  characterName: string;
  colorIndex: number;
  era?: string;
  content: string;
}

/** 将 markdown 文本转成纯文本 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** 获取系统中最佳中文语音 */
function getBestChineseVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();

  // macOS 中文语音偏好：Ting-Ting > Sin-Ji > Li-Mu > Li Na
  const preferred = ['Ting-Ting', 'Sin-Ji', 'Li-Mu', 'Li Na', 'Mei-Jia', 'Huihui'];

  for (const name of preferred) {
    const found = voices.find((v) => v.name.includes(name));
    if (found) return found;
  }

  // 退回到任意 zh 语音
  return voices.find((v) => v.lang.startsWith('zh')) ?? null;
}

/** 预加载语音（Safari 需要用户交互后才暴露语音列表） */
let voicePrefetched = false;
function prefetchVoices() {
  if (voicePrefetched) return;
  voicePrefetched = true;
  window.speechSynthesis.getVoices();
}

export function SpeechBubble({ characterName, colorIndex, era, content }: SpeechBubbleProps) {
  const colors = getCharacterColors(colorIndex);
  const initial = getInitial(characterName);
  const [playing, setPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 首次渲染时尝试获取语音列表
  useEffect(() => {
    prefetchVoices();
  }, []);

  if (!content?.trim()) return null;

  const handlePlay = useCallback(() => {
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }

    const plain = stripMarkdown(content);
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.lang = 'zh-CN';

    // 挑选最佳中文语音（每次播放时重新获取，因为语音列表可能是异步加载的）
    const bestVoice = getBestChineseVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      // macOS Ting-Ting 的默认语速稍快，整体按 0.85 自然节奏朗读
      utterance.rate = bestVoice.name.includes('Ting-Ting') ? 0.82 : 0.85;
    } else {
      utterance.rate = 0.85; // 无特定语音时的语速
    }

    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setPlaying(true);
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [content, playing]);

  // 组件卸载时停止播放
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
            backgroundColor: playing ? colors.text : `${colors.text}15`,
            color: playing ? '#fff' : colors.text,
          }}
          title={playing ? '停止朗读' : '朗读此段'}
        >
          {playing ? (
            /* 暂停图标 */
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* 播放图标 */
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
