'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageShell from '@/components/PageShell';
import VacancyForm, { vacatureNaarForm } from '@/components/VacancyForm';
import { Card, Button, Badge, Field, inputClass, Skeleton } from '@/components/ui';
import {
  getSollicitatie, updateSollicitatie, deleteSollicitatie, getVacature, updateVacature,
  listTaken, createTaak, updateTaak, deleteTaak,
} from '@/lib/api';
import { STAGES, STATUSES, statusLabel } from '@/lib/constants';
import type { Sollicitatie, Stage, Status, Taak, Vacature } from '@/lib/types';

export default function DetailPage() {
  return (
    <Suspense>
      <DetailContent />
    </Suspense>
  );
}

function DetailContent() {
  const router = useRouter();
  const id = Number(useSearchParams().get('id'));
  const [s, setS] = useState<Sollicitatie | null>(null);
  const [taken, setTaken] = useState<Taak[]>([]);
  const [notities, setNotities] = useState('');
  const [saved, setSaved] = useState(false);
  const [toonVacatureForm, setToonVacatureForm] = useState(false);
  const [vacature, setVacature] = useState<Vacature | null>(null);
  const [taakTekst, setTaakTekst] = useState('');
  const [taakDeadline, setTaakDeadline] = useState('');

  const laadTaken = useCallback(async () => {
    if (id) setTaken(await listTaken(id));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getSollicitatie(id).then((data) => {
      setS(data);
      setNotities(data.notities ?? '');
    });
    laadTaken();
  }, [id, laadTaken]);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function patch(data: Parameters<typeof updateSollicitatie>[1]) {
    if (!s) return;
    setS(await updateSollicitatie(s.id, data));
    flashSaved();
  }

  async function toggleVacatureForm() {
    if (!toonVacatureForm && s && !vacature) {
      setVacature(await getVacature(s.vacature_id));
    }
    setToonVacatureForm(!toonVacatureForm);
  }

  async function saveVacature(form: ReturnType<typeof vacatureNaarForm>) {
    if (!s) return;
    await updateVacature(s.vacature_id, form as Partial<Vacature>);
    setS(await getSollicitatie(s.id));
    setVacature(null);
    setToonVacatureForm(false);
    flashSaved();
  }

  async function handleAddTaak(e: React.FormEvent) {
    e.preventDefault();
    if (!s || !taakTekst.trim()) return;
    await createTaak(s.id, taakTekst.trim(), taakDeadline || undefined);
    setTaakTekst('');
    setTaakDeadline('');
    await laadTaken();
  }

  async function handleDelete() {
    if (!s || !confirm('Deze sollicitatie verwijderen?')) return;
    await deleteSollicitatie(s.id);
    router.push('/tracker/');
  }

  if (!s) {
    return (
      <PageShell title="Sollicitatie">
        <div className="grid gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={s.vacature_titel}
      actions={saved ? <Badge tone="green">opgeslagen ✓</Badge> : undefined}
    >
      <p className="-mt-5 mb-6 text-sm text-muted">
        {s.vacature_bedrijf}
        {s.vacature_locatie ? ` · ${s.vacature_locatie}` : ''}
        {s.vacature_url && (
          <>
            {' · '}
            <a href={s.vacature_url} target="_blank" rel="noreferrer" className="text-accent underline">
              vacature ↗
            </a>
          </>
        )}
      </p>

      <div className="grid gap-4">
        <Card>
          <Field label="Fase">
            <div className="flex flex-wrap gap-2">
              {STAGES.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => patch({ stage: stage.value as Stage })}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    s.stage === stage.value
                      ? 'bg-accent text-white'
                      : 'border border-line text-muted hover:text-white'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="mt-4">
            <Field label="Status">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => patch({ status: status.value as Status })}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      s.status === status.value
                        ? 'bg-accent text-white'
                        : 'border border-line text-muted hover:text-white'
                    }`}
                  >
                    {statusLabel(status.value)}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          {s.gesolliciteerd_op && (
            <p className="mt-4 font-mono text-xs text-muted">
              Gesolliciteerd op {new Date(s.gesolliciteerd_op).toLocaleDateString('nl-NL')}
            </p>
          )}
        </Card>

        {/* Taken voor deze sollicitatie */}
        <Card>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">Taken</h2>
          {taken.length > 0 && (
            <div className="mb-3 divide-y divide-line">
              {taken.map((taak) => (
                <div key={taak.id} className="group flex items-center gap-3 py-2">
                  <button
                    onClick={async () => { await updateTaak(taak.id, { klaar: !taak.klaar }); await laadTaken(); }}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs transition-colors ${
                      taak.klaar
                        ? 'border-accent bg-accent text-white'
                        : 'border-line text-transparent hover:border-accent'
                    }`}
                    aria-label="taak afvinken"
                  >
                    ✓
                  </button>
                  <span className={`flex-1 text-sm ${taak.klaar ? 'text-muted line-through' : ''}`}>
                    {taak.tekst}
                  </span>
                  {taak.deadline && !taak.klaar && (
                    <Badge>{new Date(taak.deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</Badge>
                  )}
                  <button
                    onClick={async () => { await deleteTaak(taak.id); await laadTaken(); }}
                    className="text-muted/50 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    aria-label="taak verwijderen"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddTaak} className="flex flex-wrap gap-2">
            <input
              className={`${inputClass} min-w-40 flex-1`}
              placeholder="Nieuwe taak, bijv. 'Bel HR terug'"
              value={taakTekst}
              onChange={(e) => setTaakTekst(e.target.value)}
            />
            <input
              className={`${inputClass} w-auto`}
              type="date"
              value={taakDeadline}
              onChange={(e) => setTaakDeadline(e.target.value)}
            />
            <Button type="submit" disabled={!taakTekst.trim()}>Toevoegen</Button>
          </form>
        </Card>

        <Card>
          <Field label="Notities">
            <textarea
              className={`${inputClass} min-h-40`}
              value={notities}
              onChange={(e) => setNotities(e.target.value)}
              placeholder="Contactpersoon, gespreksnotities, follow-ups…"
            />
          </Field>
          <div className="mt-3">
            <Button onClick={() => patch({ notities })}>Notities opslaan</Button>
          </div>
        </Card>

        {/* Vacaturegegevens bewerken zonder terug naar de feed te hoeven */}
        <Card>
          <button
            onClick={toggleVacatureForm}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">Vacature bewerken</h2>
            <span className="text-muted">{toonVacatureForm ? '▴' : '▾'}</span>
          </button>
          {toonVacatureForm && vacature && (
            <div className="mt-4">
              <VacancyForm initial={vacatureNaarForm(vacature)} onSave={saveVacature} />
            </div>
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => router.push('/tracker/')}>← Terug</Button>
          <Button variant="danger" onClick={handleDelete}>Verwijderen</Button>
        </div>
      </div>
    </PageShell>
  );
}
