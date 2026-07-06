'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { Button, inputClass } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await login(passcode);
      router.replace('/feed/');
    } catch {
      setErrorMsg('Ongeldige passcode');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-line bg-card p-6"
      >
        <h1 className="mb-1 text-2xl font-semibold">
          Vacatures<span className="text-accent">.</span>
        </h1>
        <p className="mb-6 text-sm text-muted">Voer je passcode in om verder te gaan.</p>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          autoFocus
          className={`${inputClass} mb-3`}
        />
        {errorMsg && <p className="mb-3 text-sm text-red-400">{errorMsg}</p>}
        <Button type="submit" disabled={busy || !passcode}>
          {busy ? 'Bezig…' : 'Inloggen'}
        </Button>
      </form>
    </main>
  );
}
