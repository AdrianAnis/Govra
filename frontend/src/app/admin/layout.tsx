import { PanelShell } from "@/components/layout/panel-shell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <PanelShell section="admin">{children}</PanelShell>;
}
