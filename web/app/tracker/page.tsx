'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageShell from '@/components/PageShell';
import { Card, Badge, SkeletonCards } from '@/components/ui';
import { listSollicitaties } from '@/lib/api';
import { STAGES, statusLabel } from '@/lib/constants';
import type { Sollicitatie, Status } from '@/lib/types';

const STATUS_TONE: Record<Status, 'accent' | 'green' | 'red' | 'gray'> = {
  actief: 'accent',
  aangenomen: 'green',
  afgewezen: 'red',
  ingetrokken: 'gray',
};

export default function TrackerPage() {
  const [items, setItems] = useState<Sollicitatie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSollicitaties()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const actief = items.filter((s) => s.status === 'actief');
  const afgerond = items.filter((s) => s.status !== 'actief');

  return (
    <PageShell title="Sollicitatie-tracker" wide>
      {loading ? (
        <SkeletonCards />
      ) : items.length === 0 ? (
        <Card className="text-center text-muted">
          Nog geen sollicitaties. Start er een vanuit de{' '}
          <Link href="/feed/" className="text-accent underline">vacature-feed</Link>.
        </Card>
      ) : (
        <>
          <div className="flex snap-x gap-3 overflow-x-auto pb-3 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {STAGES.map((stage) => {
              const inStage = actief.filter((s) => s.stage === stage.value);
              return (
                <div key={stage.value} className="w-64 shrink-0 snap-start lg:w-auto">
                  <p className="mb-2 font-mono text-xs uppercase tracking-wide text-muted">
                    {stage.label} <span className="text-accent">{inStage.length}</span>
                  </p>
                  <div className="grid gap-2">
                    {inStage.map((s) => (
                      <SollicitatieCard key={s.id} s={s} />
                    ))}
                    {inStage.length === 0 && (
                      <div className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted/60">
                        leeg
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {afgerond.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 font-mono text-xs uppercase tracking-wide text-muted">Afgerond</h2>
              <div className="grid gap-2">
                {afgerond.map((s) => (
                  <SollicitatieCard key={s.id} s={s} showStatus />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}

function SollicitatieCard({ s, showStatus = false }: { s: Sollicitatie; showStatus?: boolean }) {
  return (
    <Link href={`/tracker/detail/?id=${s.id}`}>
      <Card className="hover:bg-card-hover">
        <p className="font-heading text-sm font-semibold">{s.vacature_titel}</p>
        <p className="mb-1.5 text-xs text-muted">{s.vacature_bedrijf}</p>
        {showStatus && <Badge tone={STATUS_TONE[s.status]}>{statusLabel(s.status)}</Badge>}
      </Card>
    </Link>
  );
}
