'use client';

export function Card({ children, className = '', onClick }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-line bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.3)] ${
        onClick ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled, small }: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  small?: boolean;
}) {
  const styles = {
    primary: 'bg-accent text-white shadow-[0_2px_10px_rgba(255,104,35,0.25)] hover:brightness-110',
    ghost: 'border border-line text-muted hover:border-white/25 hover:text-white',
    danger: 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 ${
        small ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
      } ${styles}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'default' }: {
  children: React.ReactNode;
  tone?: 'default' | 'accent' | 'green' | 'red' | 'gray';
}) {
  const styles = {
    default: 'bg-white/5 text-muted',
    accent: 'bg-accent-soft text-accent',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-400',
    gray: 'bg-white/5 text-muted line-through',
  }[tone];

  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-xs ${styles}`}>
      {children}
    </span>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-white placeholder:text-muted/60 transition-colors focus:border-accent focus:outline-none';

export function Toggle({ checked, onChange, label }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-white/10'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-1'
          }`}
        />
      </span>
      {label && <span className={checked ? 'text-white' : 'text-muted'}>{label}</span>}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}
