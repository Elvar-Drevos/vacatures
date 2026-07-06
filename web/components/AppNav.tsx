'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconFeed({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="14" width="18" height="7" rx="2" />
    </svg>
  );
}

function IconTracker({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1.5" />
      <rect x="10" y="3" width="5" height="12" rx="1.5" />
      <rect x="17" y="3" width="5" height="8" rx="1.5" />
    </svg>
  );
}

function IconTaken({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" />
      <path d="M4 5l1 1 2-2" /><path d="M4 11l1 1 2-2" /><path d="M4 17l1 1 2-2" />
    </svg>
  );
}

function IconChecklist({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.1V12a10 10 0 1 1-5.93-9.14" />
      <path d="M9 11l3 3L22 4" />
    </svg>
  );
}

const ITEMS = [
  { href: '/feed/', label: 'Feed', Icon: IconFeed },
  { href: '/tracker/', label: 'Tracker', Icon: IconTracker },
  { href: '/taken/', label: 'Taken', Icon: IconTaken },
  { href: '/checklist/', label: 'Checklist', Icon: IconChecklist },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobiel: onderbalk */}
      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-card/95 backdrop-blur md:hidden">
        <div className="flex items-stretch justify-around">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href.replace(/\/$/, ''));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[11px] font-medium transition-colors ${
                  active ? 'text-accent' : 'text-muted hover:text-white'
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: linker sidebar */}
      <nav className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col border-r border-line bg-card/60 px-3 py-6 md:flex">
        <Link href="/feed/" className="mb-8 px-3 font-heading text-lg font-bold">
          Vacatures<span className="text-accent">.</span>
        </Link>
        <div className="flex flex-col gap-1">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href.replace(/\/$/, ''));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </div>
        <p className="mt-auto px-3 font-mono text-[10px] text-muted/50">job search dashboard</p>
      </nav>
    </>
  );
}
