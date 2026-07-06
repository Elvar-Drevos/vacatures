'use client';

import { useState } from 'react';
import { Button, Field, inputClass } from './ui';
import type { Vacature } from '@/lib/types';

export interface VacatureFormData {
  titel: string;
  bedrijf: string;
  locatie: string;
  url: string;
  salaris: string;
  omschrijving: string;
}

export const EMPTY_VACATURE_FORM: VacatureFormData = {
  titel: '', bedrijf: '', locatie: '', url: '', salaris: '', omschrijving: '',
};

export function vacatureNaarForm(v: Vacature): VacatureFormData {
  return {
    titel: v.titel,
    bedrijf: v.bedrijf,
    locatie: v.locatie ?? '',
    url: v.url ?? '',
    salaris: v.salaris ?? '',
    omschrijving: v.omschrijving ?? '',
  };
}

export default function VacancyForm({ initial, onSave, submitLabel = 'Opslaan' }: {
  initial: VacatureFormData;
  onSave: (data: VacatureFormData) => Promise<void>;
  submitLabel?: string;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Functietitel *">
        <input className={inputClass} required value={form.titel}
          onChange={(e) => setForm({ ...form, titel: e.target.value })} />
      </Field>
      <Field label="Bedrijf *">
        <input className={inputClass} required value={form.bedrijf}
          onChange={(e) => setForm({ ...form, bedrijf: e.target.value })} />
      </Field>
      <Field label="Locatie">
        <input className={inputClass} value={form.locatie}
          onChange={(e) => setForm({ ...form, locatie: e.target.value })} />
      </Field>
      <Field label="Link naar vacature">
        <input className={inputClass} type="url" placeholder="https://…" value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })} />
      </Field>
      <Field label="Salaris">
        <input className={inputClass} placeholder="bijv. €3500–4200" value={form.salaris}
          onChange={(e) => setForm({ ...form, salaris: e.target.value })} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Omschrijving / notities">
          <textarea className={`${inputClass} min-h-24`} value={form.omschrijving}
            onChange={(e) => setForm({ ...form, omschrijving: e.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? 'Bezig…' : submitLabel}</Button>
      </div>
    </form>
  );
}
