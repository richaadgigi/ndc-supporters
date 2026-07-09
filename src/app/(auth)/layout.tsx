'use client';

import AuthGuard from '@/components/AuthGuard';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      <section
        className="xui-min-h-[100vh] xui-d-flex xui-flex-ai-center xui-flex-jc-center"
        style={{ backgroundColor: '#f0f0f0' }}
      >
        <div
          className="xui-bg-white xui-bdr-rad-[12px] xui-p-2 xui-mx-1"
          style={{ maxWidth: '420px', width: '100%' }}
        >
          {children}
        </div>
      </section>
    </AuthGuard>
  );
}
