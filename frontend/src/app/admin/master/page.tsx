import type { Metadata } from "next";
import { ActionButton } from "@/components/admin/action-button";
import {
  CreateCategoryDialog,
  CreateOpdDialog,
  EditOpdDialog,
  NameDialog,
} from "@/components/admin/master-actions";
import { PageHeader } from "@/components/page-header";
import { PageSection } from "@/components/page-section";
import { Badge } from "@/components/ui/badge";
import { listDistrictsAdmin, listOpdsAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Master Data" };

export default async function AdminMasterPage() {
  const [opds, districts] = await Promise.all([listOpdsAdmin(), listDistrictsAdmin()]);

  return (
    <div className="flex flex-col gap-12">
      <PageHeader title="Master Data" description="OPD, kategori, dan wilayah yang dipakai di seluruh aplikasi." />

      <PageSection title="OPD dan kategori" action={<CreateOpdDialog />}>
        <ul className="flex flex-col gap-4">
          {opds.items.map((opd) => (
            <li key={opd.code} className="flex flex-col gap-5 rounded-lg border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="flex flex-wrap items-center gap-3 text-xl font-semibold">
                    {opd.name}
                    {!opd.active && <Badge weight="netral">Nonaktif</Badge>}
                  </h3>
                  <p className="text-sm text-fg-muted">
                    {opd.code} · {opd.slug}
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <EditOpdDialog opd={opd} />
                  <ActionButton
                    label={opd.active ? "Nonaktifkan" : "Aktifkan"}
                    method="PATCH"
                    path={`/opds/${opd.code}`}
                    body={{ active: !opd.active }}
                  />
                </div>
              </div>
              <ul className="flex flex-col divide-y rounded-lg border">
                {opd.categories.map((category) => (
                  <li key={category.code} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2 font-medium">
                        {category.name}
                        {!category.active && <Badge weight="netral">Nonaktif</Badge>}
                      </span>
                      <span className="text-xs text-fg-muted">{category.code}</span>
                    </span>
                    <span className="flex flex-wrap items-start gap-2">
                      <NameDialog
                        triggerLabel="Ubah nama"
                        title="Ubah nama kategori"
                        label="Nama kategori"
                        initial={category.name}
                        method="PATCH"
                        path={`/categories/${category.code}`}
                      />
                      <ActionButton
                        label={category.active ? "Nonaktifkan" : "Aktifkan"}
                        method="PATCH"
                    path={`/categories/${category.code}`}
                    body={{ active: !category.active }}
                      />
                    </span>
                  </li>
                ))}
                {opd.categories.length === 0 && (
                  <li className="px-4 py-3 text-sm text-fg-muted">Belum ada kategori.</li>
                )}
              </ul>
              <div>
                <CreateCategoryDialog opd={opd} />
              </div>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        title="Wilayah"
        action={
          <NameDialog
            primary
            triggerLabel="Tambah kecamatan"
            title="Tambah kecamatan"
            label="Nama kecamatan"
            submitLabel="Tambah"
            method="POST"
                        path={"/districts"}
          />
        }
      >
        <ul className="grid gap-4 lg:grid-cols-2">
          {districts.items.map((district) => (
            <li key={district.id} className="flex flex-col gap-4 rounded-lg border bg-surface p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">{district.name}</h3>
                <NameDialog
                  triggerLabel="Ubah nama"
                  title="Ubah nama kecamatan"
                  label="Nama kecamatan"
                  initial={district.name}
                  method="PATCH"
                        path={`/districts/${district.id}`}
                />
              </div>
              <ul className="flex flex-col divide-y rounded-lg border">
                {district.villages.map((village) => (
                  <li key={village.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <span className="font-medium">{village.name}</span>
                    <NameDialog
                      triggerLabel="Ubah nama"
                      title="Ubah nama kelurahan"
                      label="Nama kelurahan atau desa"
                      initial={village.name}
                      method="PATCH"
                        path={`/villages/${village.id}`}
                    />
                  </li>
                ))}
                {district.villages.length === 0 && (
                  <li className="px-4 py-3 text-sm text-fg-muted">Belum ada kelurahan.</li>
                )}
              </ul>
              <div>
                <NameDialog
                  triggerLabel="Tambah kelurahan"
                  title={`Tambah kelurahan di ${district.name}`}
                  label="Nama kelurahan atau desa"
                  submitLabel="Tambah"
                  method="POST"
                        path={`/districts/${district.id}/villages`}
                />
              </div>
            </li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
