"use client";

import { useState } from "react";
import { FormDialog } from "@/components/form-dialog";
import { FormField } from "@/components/form-field";
import { adminCall, type AdminMethod } from "@/lib/admin-client";
import type { Schema } from "@/lib/schema";

interface NameDialogProps {
  triggerLabel: string;
  title: string;
  label: string;
  initial?: string;
  submitLabel?: string;
  primary?: boolean;
  method: AdminMethod;
  path: string;
}

function NameDialog({
  triggerLabel,
  title,
  label,
  initial = "",
  submitLabel = "Simpan",
  primary = false,
  method,
  path,
}: NameDialogProps) {
  const [name, setName] = useState(initial);
  const id = `name-${title.replaceAll(" ", "-")}-${initial}`;

  return (
    <FormDialog
      triggerLabel={triggerLabel}
      triggerVariant={primary ? "primary" : "outline"}
      triggerSize={primary ? "default" : "sm"}
      title={title}
      submitLabel={submitLabel}
      onSubmit={() => adminCall(method, path, { name })}
      onReset={() => setName(initial)}
    >
      <FormField id={id} label={label} value={name} maxLength={120} onChange={(event) => setName(event.target.value)} />
    </FormDialog>
  );
}

function CreateOpdDialog() {
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");

  return (
    <FormDialog
      triggerLabel="Tambah OPD"
      triggerVariant="primary"
      triggerSize="default"
      title="Tambah OPD"
      submitLabel="Tambah"
      onSubmit={() => adminCall("POST", "/opds", { code, slug, name })}
      onReset={() => {
        setCode("");
        setSlug("");
        setName("");
      }}
    >
      <FormField
        id="opd-name"
        label="Nama OPD"
        value={name}
        maxLength={120}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        id="opd-code"
        label="Kode"
        hint="Huruf besar, angka, dan garis bawah. Contoh: BMSDA."
        value={code}
        maxLength={40}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
      />
      <FormField
        id="opd-slug"
        label="Slug"
        hint="Dipakai di alamat halaman. Contoh: dinas-bina-marga."
        value={slug}
        maxLength={80}
        onChange={(event) => setSlug(event.target.value.toLowerCase())}
      />
    </FormDialog>
  );
}

function EditOpdDialog({ opd }: { opd: Schema<"OpdDetail"> }) {
  const [name, setName] = useState(opd.name);
  const [slug, setSlug] = useState(opd.slug);

  return (
    <FormDialog
      triggerLabel="Ubah"
      title="Ubah OPD"
      submitLabel="Simpan"
      onSubmit={() => adminCall("PATCH", `/opds/${opd.code}`, { name, slug })}
      onReset={() => {
        setName(opd.name);
        setSlug(opd.slug);
      }}
    >
      <FormField
        id={`opd-name-${opd.code}`}
        label="Nama OPD"
        value={name}
        maxLength={120}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        id={`opd-slug-${opd.code}`}
        label="Slug"
        value={slug}
        maxLength={80}
        onChange={(event) => setSlug(event.target.value.toLowerCase())}
      />
    </FormDialog>
  );
}

function CreateCategoryDialog({ opd }: { opd: Schema<"OpdDetail"> }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  return (
    <FormDialog
      triggerLabel="Tambah kategori"
      title={`Tambah kategori di ${opd.name}`}
      submitLabel="Tambah"
      onSubmit={() => adminCall("POST", `/opds/${opd.code}/categories`, { code, name })}
      onReset={() => {
        setCode("");
        setName("");
      }}
    >
      <FormField
        id={`cat-name-${opd.code}`}
        label="Nama kategori"
        value={name}
        maxLength={120}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        id={`cat-code-${opd.code}`}
        label="Kode"
        hint="Huruf besar, angka, dan garis bawah."
        value={code}
        maxLength={40}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
      />
    </FormDialog>
  );
}

export { CreateCategoryDialog, CreateOpdDialog, EditOpdDialog, NameDialog };
