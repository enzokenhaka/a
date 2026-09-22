import { PanelShell } from '@/components/layout/PanelShell';

export default function StockLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PanelShell title="Estoque">{children}</PanelShell>;
}
