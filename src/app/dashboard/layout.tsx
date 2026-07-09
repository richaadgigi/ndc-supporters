'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import { LogoutModal } from '@/components/modals';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthGuard requireAuth={true}>
      <section className="xui-dashboard xui-d-flex xui-pos-relative">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="screen">
          <div className="content xui-px-1-half">{children}</div>
        </div>
        <LogoutModal />
      </section>
    </AuthGuard>
  );
}
