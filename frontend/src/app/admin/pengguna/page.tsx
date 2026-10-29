import type { Metadata } from "next";
import { CreateUserDialog, UserRowActions } from "@/components/admin/user-actions";
import { DataCell, DataRow, DataTable, RowHead } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state-message";
import { currentTime } from "@/lib/clock";
import { listOpdsAdmin, listUsers } from "@/lib/data/admin";
import { formatRelativeTime } from "@/lib/format";
import { parsePage, type RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "Pengguna" };

const PAGE_SIZE = 20;
const HEADERS = ["Akun", "OPD", "Status", "Terakhir masuk", "Tindakan"] as const;

function first(value: string | string[] | undefined): string | undefined {
  const picked = Array.isArray(value) ? value[0] : value;
  return picked ? picked : undefined;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams;
  const opd = first(raw.opd);
  const [users, opds] = await Promise.all([
    listUsers({ opd, page: parsePage(raw), limit: PAGE_SIZE }),
    listOpdsAdmin(),
  ]);
  const now = currentTime();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Pengguna" description="Akun Dinas dan OPD yang menjadi wewenangnya.">
        <div>
          <CreateUserDialog opds={opds.items} />
        </div>
      </PageHeader>
      <FilterBar
        selects={[
          {
            name: "opd",
            label: "Filter OPD",
            allLabel: "Semua OPD",
            options: opds.items.map((item) => ({ value: item.slug, label: item.name })),
          },
        ]}
      />
      {users.items.length > 0 ? (
        <DataTable caption="Akun Dinas" headers={HEADERS}>
          {users.items.map((user) => (
            <DataRow key={user.id}>
              <RowHead>
                <span className="flex flex-col gap-0.5">
                  <span>{user.display_name ?? user.email}</span>
                  <span className="text-xs font-normal text-fg-muted">{user.email}</span>
                </span>
              </RowHead>
              <DataCell>
                {user.opd?.name ?? (user.role === "ADMIN" ? "Pusat (Administrator)" : "Pusat / Umum")}
              </DataCell>
              <DataCell>
                <Badge weight={user.status === "ACTIVE" ? "berjalan" : "netral"}>
                  {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                </Badge>
              </DataCell>
              <DataCell className="text-sm text-fg-muted">
                {user.last_sign_in_at ? formatRelativeTime(user.last_sign_in_at, now) : "Belum pernah"}
              </DataCell>
              <DataCell>
                <UserRowActions user={user} opds={opds.items} />
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Belum ada akun" description="Tidak ada akun yang cocok dengan filter yang dipilih." />
      )}
      <Pagination
        page={users.page}
        limit={users.limit}
        total={users.total}
        basePath="/admin/pengguna"
        params={opd ? { opd } : {}}
      />
    </div>
  );
}
