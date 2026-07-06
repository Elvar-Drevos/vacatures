'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageShell from '@/components/PageShell';
import VacancyForm, { EMPTY_VACATURE_FORM, vacatureNaarForm, VacatureFormData } from '@/components/VacancyForm';
import { Card, Button, Badge, Field, Toggle, inputClass, SkeletonCards } from '@/components/ui';
import {
  listVacatures, createVacature, updateVacature, deleteVacature, createSollicitatie,
  getZoekprofiel, updateZoekprofiel, listFeeds, createFeed, deleteFeed, runZoeken,
} from '@/lib/api';
import type { Vacature, Zoekprofiel, RssFeed, ZoekRunResultaat } from '@/lib/types';

export default function FeedPage() {
  const router = useRouter();
  const [vacatures, setVacatures] = useState<Vacature[]>([]);
  const [loading, setLoading] = useState(true);
  const [toonAlles, setToonAlles] = useState(false);
  const [profiel, setProfiel] = useState<Zoekprofiel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editVacature, setEditVacature] = useState<Vacature | null>(null);
  const [showBronnen, setShowBronnen] = useState(false);
  const [zoekBezig, setZoekBezig] = useState(false);
  const [zoekResultaat, setZoekResultaat] = useState<ZoekRunResultaat[] | null>(null);

  const refetch = useCallback(async (alles = toonAlles) => {
    setVacatures(await listVacatures({ alles }));
    setLoading(false);
  }, [toonAlles]);

  useEffect(() => {
    Promise.all([refetch(), getZoekprofiel().then(setProfiel)]).catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function wisselAlles(aan: boolean) {
    setToonAlles(aan);
    await refetch(aan);
  }

  async function patchProfiel(data: Parameters<typeof updateZoekprofiel>[0]) {
    setProfiel(await updateZoekprofiel(data));
    await refetch();
  }

  async function handleSave(form: VacatureFormData) {
    if (editVacature) {
      await updateVacature(editVacature.id, form);
    } else {
      await createVacature(form);
    }
    setShowForm(false);
    setEditVacature(null);
    await refetch();
  }

  async function handleZoekNu() {
    setZoekBezig(true);
    setZoekResultaat(null);
    try {
      const resultaat = await runZoeken();
      setZoekResultaat(resultaat);
      await refetch();
    } finally {
      setZoekBezig(false);
    }
  }

  async function handleSolliciteer(v: Vacature) {
    await createSollicitatie(v.id);
    router.push('/tracker/');
  }

  async function handleArchiveer(v: Vacature) {
    await updateVacature(v.id, { gearchiveerd: 1 });
    await refetch();
  }

  async function handleDelete(v: Vacature) {
    if (!confirm(`"${v.titel}" bij ${v.bedrijf} verwijderen? Bijbehorende sollicitaties worden ook verwijderd.`)) return;
    await deleteVacature(v.id);
    await refetch();
  }

  return (
    <PageShell
      title="Vacature-feed"
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowBronnen(!showBronnen)}>Bronnen</Button>
          <Button onClick={() => { setShowForm(!showForm); setEditVacature(null); }}>
            {showForm ? 'Sluiten' : '+ Nieuw'}
          </Button>
        </div>
      }
    >
      {/* Zoekprofiel-filterbalk */}
      {profiel && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div className="min-w-40 flex-1">
              <Field label="Functie">
                <input
                  className={inputClass}
                  placeholder="bijv. frontend developer"
                  defaultValue={profiel.functie ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (profiel.functie ?? '')) patchProfiel({ functie: e.target.value });
                  }}
                />
              </Field>
              <div className="mt-2">
                <Toggle
                  checked={!!profiel.functie_actief}
                  onChange={(aan) => patchProfiel({ functieActief: aan })}
                  label="filter actief"
                />
              </div>
            </div>
            <div className="min-w-40 flex-1">
              <Field label="Locatie">
                <input
                  className={inputClass}
                  placeholder="bijv. Utrecht"
                  defaultValue={profiel.locatie ?? ''}
                  onBlur={(e) => {
                    if (e.target.value !== (profiel.locatie ?? '')) patchProfiel({ locatie: e.target.value });
                  }}
                />
              </Field>
              <div className="mt-2">
                <Toggle
                  checked={!!profiel.locatie_actief}
                  onChange={(aan) => patchProfiel({ locatieActief: aan })}
                  label="filter actief"
                />
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 pb-0.5">
              <Toggle
                checked={!!profiel.alleen_nederland}
                onChange={(aan) => patchProfiel({ alleenNederland: aan })}
                label="Alleen Nederland (bij importeren)"
              />
              <Toggle checked={toonAlles} onChange={wisselAlles} label="Toon alles (negeer filters)" />
              <Button onClick={handleZoekNu} disabled={zoekBezig} small>
                {zoekBezig ? 'Zoeken…' : '⟳ Zoek nu in alle bronnen'}
              </Button>
            </div>
          </div>
          {zoekResultaat && (
            <p className="mt-3 border-t border-line pt-3 font-mono text-xs text-muted">
              {zoekResultaat.map((r) => `${r.bron}: ${r.nieuw} nieuw${r.fout ? ' (fout)' : ''}`).join(' · ')}
            </p>
          )}
        </Card>
      )}

      {/* Bronnen (RSS-feeds) beheren */}
      {showBronnen && <BronnenPaneel />}

      {(showForm || editVacature) && (
        <Card className="mb-4">
          <VacancyForm
            key={editVacature?.id ?? 'nieuw'}
            initial={editVacature ? vacatureNaarForm(editVacature) : EMPTY_VACATURE_FORM}
            onSave={handleSave}
            submitLabel={editVacature ? 'Opslaan' : 'Toevoegen'}
          />
        </Card>
      )}

      {loading ? (
        <SkeletonCards count={4} />
      ) : vacatures.length === 0 ? (
        <Card className="text-center text-muted">
          Geen vacatures{!toonAlles ? ' binnen je actieve filters' : ''}. Voeg er handmatig een toe,
          stel je zoekprofiel in en klik &ldquo;Zoek nu&rdquo;, of voeg RSS-bronnen toe via &ldquo;Bronnen&rdquo;.
        </Card>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {vacatures.map((v) => (
            <Card key={v.id} className="flex flex-col">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-base font-semibold">{v.titel}</h2>
                  <p className="text-sm text-muted">
                    {v.bedrijf}
                    {v.locatie ? ` · ${v.locatie}` : ''}
                    {v.salaris ? ` · ${v.salaris}` : ''}
                  </p>
                </div>
                {v.bron !== 'handmatig' && (
                  <Badge tone="accent">{v.bron.replace('scrape:', '')}</Badge>
                )}
              </div>
              {v.omschrijving && (
                <p className="mb-3 line-clamp-3 whitespace-pre-line text-sm text-muted">{v.omschrijving}</p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={() => handleSolliciteer(v)} small>Solliciteren →</Button>
                {v.url && (
                  <a href={v.url} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-white/25 hover:text-white">
                    Bekijken ↗
                  </a>
                )}
                <span className="flex-1" />
                <Button variant="ghost" small onClick={() => { setEditVacature(v); setShowForm(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Bewerken
                </Button>
                <Button variant="ghost" small onClick={() => handleArchiveer(v)}>Archief</Button>
                <Button variant="danger" small onClick={() => handleDelete(v)}>✕</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function BronnenPaneel() {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [naam, setNaam] = useState('');
  const [url, setUrl] = useState('');
  const [fout, setFout] = useState<string | null>(null);

  const laad = useCallback(async () => setFeeds(await listFeeds()), []);
  useEffect(() => {
    laad();
  }, [laad]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFout(null);
    try {
      await createFeed(naam.trim(), url.trim());
      setNaam('');
      setUrl('');
      await laad();
    } catch (err) {
      setFout(err instanceof Error ? err.message : 'toevoegen mislukt');
    }
  }

  return (
    <Card className="mb-4">
      <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted">RSS-bronnen</h2>
      <p className="mb-3 text-xs text-muted">
        Deze feeds worden dagelijks automatisch opgehaald (en direct via &ldquo;Zoek nu&rdquo;).
        Daarnaast doorzoekt de app Indeed, NationaleVacaturebank en Werkzoeken.nl op basis van je
        actieve zoekfilters — let op: die sites blokkeren geautomatiseerd ophalen soms.
      </p>
      {feeds.length > 0 && (
        <div className="mb-3 divide-y divide-line">
          {feeds.map((feed) => (
            <div key={feed.id} className="group flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm">{feed.naam}</p>
                <p className="truncate font-mono text-xs text-muted">{feed.url}</p>
              </div>
              {feed.laatst_opgehaald_op && (
                <Badge>
                  {new Date(feed.laatst_opgehaald_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </Badge>
              )}
              <button
                onClick={async () => { await deleteFeed(feed.id); await laad(); }}
                className="text-muted/50 transition-colors hover:text-red-400"
                aria-label="feed verwijderen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <input className={`${inputClass} w-40`} placeholder="Naam" required value={naam}
          onChange={(e) => setNaam(e.target.value)} />
        <input className={`${inputClass} min-w-52 flex-1`} type="url" placeholder="https://…/feed.rss" required value={url}
          onChange={(e) => setUrl(e.target.value)} />
        <Button type="submit">Feed toevoegen</Button>
      </form>
      {fout && <p className="mt-2 text-sm text-red-400">{fout}</p>}
    </Card>
  );
}
