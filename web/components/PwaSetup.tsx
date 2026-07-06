'use client';

import { useEffect } from 'react';

// Registreert de service worker (alleen in productie relevant, maar onschadelijk lokaal).
export default function PwaSetup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {});
    }
  }, []);
  return null;
}
