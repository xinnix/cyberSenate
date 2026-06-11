'use client';

import { SpeechBubble } from './SpeechBubble';

interface Speech {
  characterId: string;
  characterName: string;
  content: string;
}

interface RoundSectionProps {
  roundNumber: number;
  title: string;
  speeches: Speech[];
  characterColorIndices?: Record<string, number>;
  characterEras?: Record<string, string>;
}

const roundLabels = ['拆解与立论', '交锋与深挖', '结案与收束'];

export function RoundSection({
  roundNumber,
  title,
  speeches,
  characterColorIndices = {},
  characterEras = {},
}: RoundSectionProps) {
  return (
    <div className="mb-8">
      {/* 轮次标题 */}
      <div className="flex items-center gap-4 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200/60 to-transparent" />
        <span className="text-sm font-serif font-bold text-ink-400 tracking-widest whitespace-nowrap">
          第{roundNumber}轮 · {title || roundLabels[roundNumber - 1]}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ink-200/60 to-transparent" />
      </div>

      {/* 发言列表 */}
      <div className="divide-y divide-ink-100/40">
        {speeches.map((speech, i) => (
          <SpeechBubble
            key={i}
            characterName={speech.characterName}
            colorIndex={characterColorIndices[speech.characterId] ?? 0}
            era={characterEras[speech.characterId]}
            content={speech.content}
          />
        ))}
      </div>
    </div>
  );
}
