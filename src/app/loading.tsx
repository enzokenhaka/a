export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-400" />
          <div className="absolute inset-2 rounded-full bg-amber-400/10 blur-sm" />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Carregando módulo</p>
      </div>
    </div>
  );
}
