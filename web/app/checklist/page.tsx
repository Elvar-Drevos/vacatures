'use client';

import { useCallback, useEffect, useState } from 'react';
import PageShell from '@/components/PageShell';
import { Card, Button, Badge, Field, inputClass, SkeletonCards } from '@/components/ui';
import { listChecklist, createChecklistItem, updateChecklistItem, deleteChecklistItem } from '@/lib/api';
import { HERHALINGEN } from '@/lib/constants';
import type { ChecklistItem, Herhaling } from '@/lib/types';

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categorie, setCategorie] = useState('');
  const [tekst, setTekst] = useState('');
  const [herhaling, setHerhaling] = useState<Herhaling>('geen');

  const refetch = useCallback(async () => {
    setItems(await listChecklist());
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch().catch(() => setLoading(false));
  }, [refetch]);

  const categorieen = [...new Set(items.map((i) => i.categorie))];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await createChecklistItem(categorie.trim(), tekst.trim(), herhaling);
    setTekst('');
    setHerhaling('geen');
    setShowForm(false);
    await refetch();
  }

  async function toggle(item: ChecklistItem) {
    await updateChecklistItem(item.id, { klaar: item.klaar ? 0 : 1 });
    await refetch();
  }

  async function handleDelete(item: ChecklistItem) {
    await deleteChecklistItem(item.id);
    await refetch();
  }

  const done = items.filter((i) => i.klaar).length;

  return (
    <PageShell
      title="Verbeterpunten"
      actions={
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Sluiten' : '+ Nieuw punt'}
        </Button>
      }
    >
      {items.length > 0 && (
        <p className="-mt-3 mb-4 font-mono text-xs text-muted">
          {done}/{items.length} afgerond
        </p>
      )}

      {showForm && (
        <Card className="mb-5">
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
            <Field label="Categorie *">
              <input
                className={inputClass}
                required
                list="categorieen"
                placeholder="bijv. CV, LinkedIn, Portfolio"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
              />
              <datalist id="categorieen">
                {categorieen.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Verbeterpunt *">
              <input className={inputClass} required value={tekst}
                onChange={(e) => setTekst(e.target.value)} />
            </Field>
            <Field label="Herhaling">
              <select className={inputClass} value={herhaling}
                onChange={(e) => setHerhaling(e.target.value as Herhaling)}>
                {HERHALINGEN.map((h) => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Toevoegen</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <SkeletonCards />
      ) : items.length === 0 ? (
        <Card className="text-center text-muted">Nog geen verbeterpunten.</Card>
      ) : (
        <div className="grid gap-4">
          {categorieen.map((cat) => (
            <div key={cat}>
              <h2 className="mb-2 font-mono text-xs uppercase tracking-wide text-accent">{cat}</h2>
              <Card className="divide-y divide-line p-0">
                {items
                  .filter((i) => i.categorie === cat)
                  .map((item) => (
                    <div key={item.id} className="group flex items-center gap-3 px-4 py-3">
                      <button
                        onClick={() => toggle(item)}
                        aria-label={item.klaar ? 'markeer als niet klaar' : 'markeer als klaar'}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                          item.klaar
                            ? 'border-accent bg-accent text-white'
                            : 'border-line text-transparent hover:border-accent'
                        }`}
                      >
                        ✓
                      </button>
                      <span className={`flex-1 text-sm ${item.klaar ? 'text-muted line-through' : ''}`}>
                        {item.tekst}
                      </span>
                      {item.herhaling !== 'geen' && (
                        <Badge tone="accent">↻ {item.herhaling}</Badge>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-muted/50 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                        aria-label="verwijderen"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
