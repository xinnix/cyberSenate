export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          {/* TODO: 替换为实际 Logo 图片 — 将 logo 文件放入 apps/web/public/logo.png */}
          <img src="/logo.png" alt="赛博圆桌" className="mx-auto h-10 w-auto mb-2" />
          <p className="text-sm text-neutral-500">赛博圆桌 · Cyber Senate</p>
        </div>
        {children}
      </div>
    </div>
  );
}
