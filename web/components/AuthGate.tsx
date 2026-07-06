'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isLogin = pathname.startsWith('/login');

  useEffect(() => {
    if (!isLogin && !getToken()) {
      router.replace('/login/');
    } else {
      setReady(true);
    }
  }, [isLogin, router]);

  if (!ready) return null;
  return <>{children}</>;
}
