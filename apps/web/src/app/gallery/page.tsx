import Link from 'next/link';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-parchment-300 flex flex-col items-center font-sans-cn">
      <div className="w-full max-w-[660px] px-4 py-20 text-center">
        <div className="text-5xl mb-6">👥</div>
        <h1 className="font-serif text-2xl font-bold text-ink-900 tracking-[4px] mb-4">聚贤</h1>
        <p className="text-sm text-ink-400/40 tracking-wider mb-2">Persona Workshop</p>
        <p className="text-base text-ink-400/50 leading-relaxed max-w-md mx-auto mt-6">
          在这里，你可以创建属于自己的先哲角色，
          <br />
          定义他们的人格、立场和说话风格，
          <br />
          并将他们送上论衡的辩论场。
        </p>
        <div className="mt-8 font-mono text-xs text-ink-400/20 tracking-[4px]">— 即将开放 —</div>
        <Link
          href="/court"
          className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-medium tracking-wider border border-gold-500/30 bg-parchment-100 text-gold-700 hover:bg-parchment-200 transition"
        >
          🏛️ 返回朝议
        </Link>
      </div>
    </div>
  );
}
