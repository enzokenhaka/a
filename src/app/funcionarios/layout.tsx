import { PanelShell } from '@/components/layout/PanelShell';

export default function EmployeesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PanelShell title="Funcionários">{children}</PanelShell>;
}
