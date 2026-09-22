import { ShieldCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-screen max-h-screen w-full overflow-hidden bg-[#0D0F12] text-zinc-100">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/5 bg-[#0D0F12] p-8 md:flex md:p-12 lg:p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,192,45,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_30%)]" />

        <div className="relative z-10 flex h-48 w-48 items-center justify-center rounded-2xl bg-black/20">
          <Image src="/logo.png" alt="Mister Manager OS" width={192} height={192} priority unoptimized className="h-full w-full object-contain" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FBC02D]/30 bg-[#FBC02D]/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F7D36A]">
            <Sparkles className="h-3.5 w-3.5" />
            Gestão completa
          </div>

          <p className="max-w-xl text-4xl font-black uppercase leading-[1.05] tracking-[-0.06em] text-white lg:text-5xl">
            Operação
            <span className="block text-[#FBC02D]">mais eficiente</span>
            para sua barbearia
          </p>

        </div>

        <div className="relative z-10 mt-8 flex items-start gap-3 rounded-2xl border border-[#FBC02D]/15 bg-black/20 p-4 text-sm text-gray-300">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBC02D]/15 text-[#FBC02D]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="max-w-sm leading-relaxed">
            Controle financeiro, agendamentos, clientes e equipe em uma plataforma pensada para negócios de barbearia.
          </p>
        </div>
      </section>

      <section className="flex w-full items-center justify-center px-4 py-10 sm:px-6 md:w-1/2 md:px-10 lg:px-16">
        <div className="w-full max-w-xl">{children}</div>
      </section>
    </main>
  );
}