import { PanelShell } from '@/components/layout/PanelShell';

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PanelShell title="Minha Conta">{children}</PanelShell>;
}