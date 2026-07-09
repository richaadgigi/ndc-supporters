'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGeneral } from '@/context/GeneralContext';

export default function AuthGuard({ requireAuth, children }: { requireAuth: boolean; children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useGeneral();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (requireAuth && !isAuthenticated) router.replace('/login');
    if (!requireAuth && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, requireAuth, router]);

  if (isLoading) return null;
  if (requireAuth && !isAuthenticated) return null;
  if (!requireAuth && isAuthenticated) return null;

  return <>{children}</>;
}
