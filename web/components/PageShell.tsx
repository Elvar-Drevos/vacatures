import AppNav from './AppNav';

export default function PageShell({ title, children, actions, wide = false }: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <AppNav />
      <main className={`mx-auto px-4 pb-24 pt-6 md:pb-10 md:pl-64 md:pr-8 md:pt-10 ${wide ? 'max-w-screen-2xl' : 'max-w-5xl'}`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </>
  );
}
