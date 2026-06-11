'use client';

import { getCharacterColors, getInitial } from './characterColors';
import { MarkdownText } from './MarkdownText';

interface SpeechBubbleProps {
  characterName: string;
  colorIndex: number;
  era?: string;
  content: string;
}

export function SpeechBubble({ characterName, colorIndex, era, content }: SpeechBubbleProps) {
  const colors = getCharacterColors(colorIndex);
  const initial = getInitial(characterName);

  if (!content?.trim()) return null;

  return (
    <div className="py-4 border-b border-ink-100/40 last:border-b-0">
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
        {era && (
          <span className="ml-auto text-[10px] text-ink-400/50 font-mono tracking-wider">
            {era}
          </span>
        )}
      </div>
      <div className="pl-[48px]">
        <MarkdownText content={content} className="text-ink-900 text-[15px] font-medium" />
      </div>
    </div>
  );
}
