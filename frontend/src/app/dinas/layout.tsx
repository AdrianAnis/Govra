import { PanelShell } from "@/components/layout/panel-shell";

export default function DinasLayout({ children }: LayoutProps<"/dinas">) {
  return <PanelShell section="dinas">{children}</PanelShell>;
}
