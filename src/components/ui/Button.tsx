import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
};

export function Button({ children, variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
        variant === 'primary'
          ? 'bg-[#C5A059] text-[#0B0D10] hover:bg-[#d8b875]'
          : 'rounded-xl border border-white/5 bg-[#1B1C1E] text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}