const Check = () => (
  <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const X = () => (
  <svg className="h-4 w-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const tiers = [
  {
    name: 'Starter',
    price: '免费',
    desc: '开源社区版，自建部署',
    featured: false,
    features: [
      { text: 'Monorepo 脚手架', ok: true },
      { text: 'tRPC 端到端类型安全', ok: true },
      { text: 'Prisma + PostgreSQL', ok: true },
      { text: '基础认证系统', ok: true },
      { text: 'Admin 后台模板', ok: true },
      { text: '微信支付集成', ok: false },
      { text: '优先技术支持', ok: false },
      { text: '私有 Slack 频道', ok: false },
    ],
    cta: '免费开始',
  },
  {
    name: 'Pro',
    price: '¥299',
    period: '/月',
    desc: '专业版，开箱即用',
    featured: true,
    features: [
      { text: 'Monorepo 脚手架', ok: true },
      { text: 'tRPC 端到端类型安全', ok: true },
      { text: 'Prisma + PostgreSQL', ok: true },
      { text: '完整 Auth & RBAC', ok: true },
      { text: 'Admin 后台 + CRUD 生成', ok: true },
      { text: '微信支付 + 退款', ok: true },
      { text: '优先技术支持', ok: true },
      { text: '私有 Slack 频道', ok: false },
    ],
    cta: '立即订阅',
  },
  {
    name: 'Enterprise',
    price: '定制',
    desc: '企业版，专属服务',
    featured: false,
    features: [
      { text: 'Pro 全部功能', ok: true },
      { text: '私有化部署方案', ok: true },
      { text: '定制化功能开发', ok: true },
      { text: 'SLA 保障', ok: true },
      { text: '专属技术顾问', ok: true },
      { text: '私有 Slack 频道', ok: true },
    ],
    cta: '联系我们',
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            简单透明的定价
          </h2>
          <p className="mt-4 text-lg text-neutral-500">选择适合你的方案，随时升级</p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.featured ? 'border-brand-600 ring-2 ring-brand-600' : 'border-neutral-200'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  最受欢迎
                </span>
              )}
              <h3 className="text-lg font-semibold text-neutral-900">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-neutral-900">{tier.price}</span>
                {tier.period && <span className="text-sm text-neutral-500">{tier.period}</span>}
              </div>
              <p className="mt-2 text-sm text-neutral-500">{tier.desc}</p>

              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {f.ok ? <Check /> : <X />}
                    <span className={`text-sm ${f.ok ? 'text-neutral-700' : 'text-neutral-400'}`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                  tier.featured
                    ? 'bg-brand-600 text-white hover:bg-brand-700'
                    : 'border border-neutral-300 text-neutral-700 hover:border-brand-600 hover:text-brand-600'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
