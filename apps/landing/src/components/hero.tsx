export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-white pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Decorative gradient orb */}
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-gradient-to-tr from-accent-400 to-accent-600 opacity-10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            数天上线，
            <br />
            <span className="text-brand-600">而非数月</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">
            开箱即用的全栈 SaaS 脚手架。NestJS + React + tRPC + Prisma
            Monorepo，内置认证、权限、支付、Admin 后台，克隆即可开工。
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#pricing"
              className="inline-flex items-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30"
            >
              立即开始
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <a
              href="#features"
              className="inline-flex items-center rounded-lg border-2 border-brand-600 px-6 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              了解更多
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
