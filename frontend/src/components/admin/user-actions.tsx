"use client";

import { useState } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/form-dialog";
import { FormField } from "@/components/form-field";
import { PasswordField } from "@/components/password-field";
import { SelectField } from "@/components/select-field";
import { adminCall } from "@/lib/admin-client";
import type { Schema } from "@/lib/schema";

interface CreateUserDialogProps {
  opds: readonly Schema<"OpdDetail">[];
}

function CreateUserDialog({ opds }: CreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [opd, setOpd] = useState<string | null>(null);

  const reset = () => {
    setEmail("");
    setName("");
    setPassword("");
    setOpd(null);
  };

  const submit = async () => {
    if (!opd) {
      throw new Error("Pilih OPD terlebih dahulu.");
    }
    await adminCall("POST", "/users", { email, display_name: name, opd_code: opd, password });
  };

  return (
    <FormDialog
      triggerLabel="Tambah akun"
      triggerVariant="primary"
      triggerSize="default"
      title="Tambah akun Dinas"
      description="Akun terikat ke satu OPD dan hanya bisa mengelola isu OPD itu."
      submitLabel="Buat akun"
      onSubmit={submit}
      onReset={reset}
    >
      <FormField
        id="user-name"
        label="Nama"
        value={name}
        maxLength={80}
        onChange={(event) => setName(event.target.value)}
      />
      <FormField
        id="user-email"
        type="email"
        label="Alamat email"
        autoComplete="off"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <SelectField
        id="user-opd"
        label="OPD"
        value={opd}
        options={opds.filter((item) => item.active).map((item) => ({ value: item.code, label: item.name }))}
        placeholder="Pilih OPD"
        onChange={setOpd}
      />
      <PasswordField
        id="user-password"
        label="Kata sandi awal"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <p className="-mt-3 text-sm text-fg-muted">Minimal 12 karakter. Sampaikan ke pemilik akun lewat saluran aman.</p>
    </FormDialog>
  );
}

interface UserRowActionsProps {
  user: Schema<"AdminUser">;
  opds: readonly Schema<"OpdDetail">[];
}

function UserRowActions({ user, opds }: UserRowActionsProps) {
  const [opd, setOpd] = useState<string | null>(user.opd?.code ?? null);
  const active = user.status === "ACTIVE";

  return (
    <div className="flex flex-wrap items-start gap-2">
      <FormDialog
        triggerLabel="Ganti OPD"
        title="Ganti OPD"
        description={`Akun ${user.email} akan memindahkan akses ke OPD yang dipilih.`}
        submitLabel="Simpan"
        onSubmit={async () => {
          if (!opd) {
            throw new Error("Pilih OPD terlebih dahulu.");
          }
          await adminCall("PATCH", `/users/${user.id}`, { opd_code: opd });
        }}
        onReset={() => setOpd(user.opd?.code ?? null)}
      >
        <SelectField
          id={`opd-${user.id}`}
          label="OPD"
          value={opd}
          options={opds.filter((item) => item.active).map((item) => ({ value: item.code, label: item.name }))}
          placeholder="Pilih OPD"
          onChange={setOpd}
        />
      </FormDialog>
      <ActionButton
        label={active ? "Nonaktifkan" : "Aktifkan"}
        method="PATCH"
        path={`/users/${user.id}`}
        body={{ status: active ? "DISABLED" : "ACTIVE" }}
      />
    </div>
  );
}

export { CreateUserDialog, UserRowActions };
