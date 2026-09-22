import type { Config } from 'tailwindcss';
const config: Config = { content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink: '#0D0F12', panel: '#141517', surface: '#1B1C1E', gold: '#C5A059', 'gold-deep': '#A37F3D' }, fontFamily: { sans: ['var(--font-manrope)', 'sans-serif'] } } }, plugins: [] };
export default config;