import type { Stage, Status, Herhaling } from './types';

export const HERHALINGEN: { value: Herhaling; label: string }[] = [
  { value: 'geen', label: 'Eenmalig' },
  { value: 'dagelijks', label: 'Dagelijks' },
  { value: 'wekelijks', label: 'Wekelijks' },
];

export const STAGES: { value: Stage; label: string }[] = [
  { value: 'interesse', label: 'Interesse' },
  { value: 'gesolliciteerd', label: 'Gesolliciteerd' },
  { value: 'eerste_gesprek', label: 'Eerste gesprek' },
  { value: 'tweede_gesprek', label: 'Tweede gesprek' },
  { value: 'aanbod', label: 'Aanbod' },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'actief', label: 'Actief' },
  { value: 'aangenomen', label: 'Aangenomen' },
  { value: 'afgewezen', label: 'Afgewezen' },
  { value: 'ingetrokken', label: 'Ingetrokken' },
];

export function stageLabel(stage: Stage): string {
  return STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function statusLabel(status: Status): string {
  return STATUSES.find((s) => s.value === status)?.label ?? status;
}
