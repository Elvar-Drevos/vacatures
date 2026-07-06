'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { Card, Badge, SkeletonCards } from '@/components/ui';
import { listTaken, updateTaak, deleteTaak } from '@/lib/api';
import type { Taak } from '@/lib/types';

function deadlineTone(deadline: string | null): { tone: 'red' | 'accent' | 'default'; label: string } | null {
  if (!deadline) return null;
  const vandaag = new Date().toISOString().slice(0, 10);
  const label = new Date(deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  if (deadline < vandaag) return { tone: 'red', label: `verlopen · ${label}` };
  if (deadline === vandaag) return { tone: 'accent', label: 'vandaag' };
  return { tone: 'default', label };
}

export default function TakenPage() {
  const [taken, setTaken] = useState<Taak[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setTaken(await listTaken());
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch().catch(() => setLoading(false));
  }, [refetch]);

  async function toggle(taak: Taak) {
    await updateTaak(taak.id, { klaar: !taak.klaar });
    await refetch();
  }

  async function handleDelete(taak: Taak) {
    await deleteTaak(taak.id);
    await refetch();
  }

  const open = taken.filter((t) => !t.klaar);
  const klaar = taken.filter((t) => t.klaar);

  return (
    <PageShell title="Taken">
      {loading ? (
        <SkeletonCards />
      ) : taken.length === 0 ? (
        <Card className="text-center text-muted">
          Nog geen taken. Maak taken aan vanaf de detailpagina van een sollicitatie in de{' '}
          <Link href="/tracker/" className="text-accent underline">tracker</Link>.
        </Card>
      ) : (
        <div className="grid gap-4">
          <TaakLijst taken={open} onToggle={toggle} onDelete={handleDelete} />
          {klaar.length > 0 && (
            <>
              <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Afgerond</h2>
              <TaakLijst taken={klaar} onToggle={toggle} onDelete={handleDelete} />
            </>
          )}
        </div>
      )}
    </PageShell>
  );
}

function TaakLijst({ taken, onToggle, onDelete }: {
  taken: Taak[];
  onToggle: (t: Taak) => void;
  onDelete: (t: Taak) => void;
}) {
  if (taken.length === 0) return null;
  return (
    <Card className="divide-y divide-line p-0">
      {taken.map((taak) => {
        const dl = deadlineTone(taak.deadline);
        return (
          <div key={taak.id} className="group flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => onToggle(taak)}
              aria-label={taak.klaar ? 'markeer als open' : 'markeer als klaar'}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                taak.klaar
                  ? 'border-accent bg-accent text-white'
                  : 'border-line text-transparent hover:border-accent'
              }`}
            >
              ✓
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${taak.klaar ? 'text-muted line-through' : ''}`}>{taak.tekst}</p>
              <Link
                href={`/tracker/detail/?id=${taak.sollicitatie_id}`}
                className="text-xs text-muted hover:text-accent"
              >
                {taak.vacature_titel} · {taak.vacature_bedrijf}
              </Link>
            </div>
            {dl && !taak.klaar && <Badge tone={dl.tone}>{dl.label}</Badge>}
            <button
              onClick={() => onDelete(taak)}
              className="text-muted/50 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              aria-label="verwijderen"
            >
              ✕
            </button>
          </div>
        );
      })}
    </Card>
  );
}
