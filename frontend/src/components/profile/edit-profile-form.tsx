"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useId, useRef } from "react";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Upload, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/data/session";
import { DISTRICTS } from "@/lib/mock/reference";
import { PROFILE } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface EditProfileFormProps {
  user: SessionUser;
}

async function compressImage(file: File, maxDimension = 512, quality = 0.85): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ blob: file, previewUrl: objectUrl });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, previewUrl: objectUrl });
          } else {
            resolve({ blob: file, previewUrl: objectUrl });
          }
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      resolve({ blob: file, previewUrl: objectUrl });
    };

    img.src = objectUrl;
  });
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadRef = useRef<Promise<Response> | null>(null);
  const savedAvatarUrlRef = useRef<string>(user.avatarUrl ?? "");

  const displayNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const nikId = useId();
  const districtId = useId();
  const villageId = useId();
  const addressId = useId();
  const bioId = useId();

  const [displayName, setDisplayName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [nik, setNik] = useState(user.nik ?? "");
  const [selectedDistrict, setSelectedDistrict] = useState(user.district ?? "");
  const [selectedVillage, setSelectedVillage] = useState(user.village ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [bio, setBio] = useState(user.bio ?? "");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeDistrictObj = DISTRICTS.find(
    (d) =>
      d.name.toLowerCase() === selectedDistrict.toLowerCase() ||
      d.name.toLowerCase().replace("kecamatan ", "") === selectedDistrict.toLowerCase().replace("kecamatan ", ""),
  );

  const availableVillages = activeDistrictObj ? activeDistrictObj.villages : [];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextDistrict = e.target.value;
    setSelectedDistrict(nextDistrict);
    setSelectedVillage("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Format file tidak didukung. Harap unggah gambar JPG, PNG, atau WebP.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran file terlalu besar. Maksimal 10 MB per gambar.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      // 1. Instant preview & client compression for rapid sub-100ms upload
      const { blob, previewUrl } = await compressImage(file);
      setAvatarUrl(previewUrl);

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      formData.append("type", "avatar");

      const uploadPromise = fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      activeUploadRef.current = uploadPromise;
      const res = await uploadPromise;
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah foto profil ke server.");
      }

      if (data.url) {
        setAvatarUrl(data.url);
        savedAvatarUrlRef.current = data.url;
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Gagal mengunggah foto profil.");
    } finally {
      setUploading(false);
      activeUploadRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    savedAvatarUrlRef.current = "";
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError("Nama lengkap wajib diisi minimal 2 karakter.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      let finalAvatar = savedAvatarUrlRef.current;

      // If active upload is finishing up, wait briefly for its public URL
      if (activeUploadRef.current) {
        try {
          const res = await activeUploadRef.current;
          const data = await res.json();
          if (res.ok && data.url) {
            finalAvatar = data.url;
          }
        } catch {}
      }

      // If user cleared avatar
      if (!avatarUrl) {
        finalAvatar = "";
      }

      await updateProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        avatarUrl: finalAvatar,
        nik: nik.trim(),
        district: selectedDistrict.trim(),
        village: selectedVillage.trim(),
        address: address.trim(),
        bio: bio.trim(),
      });

      setSuccess(true);
      router.refresh();
      router.push(PROFILE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil. Silakan coba lagi.");
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
      <div className="flex items-center gap-3">
        <Link
          href={PROFILE}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-fg-muted hover:text-fg")}
        >
          <ArrowLeft className="size-4 text-fg" />
          <span>Kembali ke Profil</span>
        </Link>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-fg">
          <CheckCircle2 className="size-5 shrink-0 text-fg" />
          <p>Profil berhasil diperbarui dan tersimpan ke database. Mengalihkan ke halaman profil...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium text-fg">
          <AlertCircle className="size-5 shrink-0 text-fg" />
          <p>{error}</p>
        </div>
      )}

      <div className="w-full rounded-xl border border-border bg-surface p-6 sm:p-8 flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Identitas Pribadi</h2>
          <p className="text-sm text-fg-muted mt-1">Data identitas utama yang digunakan untuk akun dan verifikasi.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative size-24 rounded-full border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName || "Foto profil"}
                className="size-full object-cover"
                onError={() => setAvatarUrl("")}
              />
            ) : (
              <span className="text-3xl font-bold text-fg-muted">{user.initials}</span>
            )}
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading || pending}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading || pending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-fg" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4 text-fg" />
                    <span>{avatarUrl ? "Ganti Foto Profil" : "Unggah Foto Profil"}</span>
                  </>
                )}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-fg-muted hover:text-fg"
                  disabled={uploading || pending}
                  onClick={handleRemoveAvatar}
                >
                  <Trash2 className="size-4 text-fg" />
                  <span>Hapus Foto</span>
                </Button>
              )}
            </div>

            {uploadError && (
              <p role="alert" className="text-sm font-medium text-fg">
                {uploadError}
              </p>
            )}

            <p className="text-xs text-fg-muted">
              Format yang didukung: JPG, PNG, atau WebP (maksimal 5 MB). Jika Anda mendaftar melalui akun Google, foto profil secara otomatis disinkronkan dari akun Google Anda.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={displayNameId} className="text-sm font-medium text-fg">
              Nama Lengkap <span className="text-fg-muted">*</span>
            </label>
            <Input
              id={displayNameId}
              type="text"
              required
              placeholder="Contoh: Rina Handayani"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={emailId} className="text-sm font-medium text-fg">
              Alamat Email
            </label>
            <Input
              id={emailId}
              type="email"
              value={user.email}
              disabled
              className="bg-muted text-fg-muted cursor-not-allowed"
            />
            <p className="text-xs text-fg-muted">Alamat email terdaftar dan terikat pada akun Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={phoneId} className="text-sm font-medium text-fg">
              Nomor WhatsApp / Telepon
            </label>
            <Input
              id={phoneId}
              type="tel"
              placeholder="Contoh: 081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending}
            />
            <p className="text-xs text-fg-muted">
              Digunakan oleh WhatsApp Gateway untuk mengirim notifikasi pembaruan status laporan.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={nikId} className="text-sm font-medium text-fg">
              Nomor Induk Kependudukan (NIK)
            </label>
            <Input
              id={nikId}
              type="text"
              maxLength={16}
              placeholder="16 digit NIK (Opsional)"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              disabled={pending}
            />
            <p className="text-xs text-fg-muted">
              Data NIK hanya digunakan untuk keperluan verifikasi domisili pemerintah daerah.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-xl border border-border bg-surface p-6 sm:p-8 flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Domisili & Wilayah Tinggal</h2>
          <p className="text-sm text-fg-muted mt-1">
            Informasi lokasi kependudukan untuk memudahkan penanganan laporan berbasis wilayah.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={districtId} className="text-sm font-medium text-fg">
              Kecamatan
            </label>
            <select
              id={districtId}
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={pending}
              className="h-11 w-full rounded-sm border border-input bg-surface px-3 text-base text-foreground transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-muted md:text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Pilih Kecamatan --</option>
              {DISTRICTS.map((district) => (
                <option key={district.id} value={district.name.replace("Kecamatan ", "")}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={villageId} className="text-sm font-medium text-fg">
              Kelurahan
            </label>
            <select
              id={villageId}
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              disabled={pending || !selectedDistrict}
              className="h-11 w-full rounded-sm border border-input bg-surface px-3 text-base text-foreground transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-muted md:text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Pilih Kelurahan --</option>
              {availableVillages.map((village) => (
                <option key={village.id} value={village.name.replace("Kelurahan ", "")}>
                  {village.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={addressId} className="text-sm font-medium text-fg">
            Alamat Domisili Lengkap
          </label>
          <Textarea
            id={addressId}
            rows={3}
            placeholder="Contoh: Jl. Ciateul No. 45, RT 02 / RW 04"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <div className="w-full rounded-xl border border-border bg-surface p-6 sm:p-8 flex flex-col gap-6">
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-semibold tracking-tight text-fg">Catatan & Keterangan Warga</h2>
          <p className="text-sm text-fg-muted mt-1">
            Informasi tambahan mengenai profil Anda dalam komunitas masyarakat.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={bioId} className="text-sm font-medium text-fg">
            Bio / Keterangan Singkat
          </label>
          <Textarea
            id={bioId}
            rows={3}
            placeholder="Contoh: Warga aktif pemerhati fasilitas umum dan kebersihan lingkungan."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={pending}
          />
          <p className="text-xs text-fg-muted">
            Catatan ini dapat membantu petugas memahami konteks partisipasi Anda.
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 w-full">
        <Link
          href={PROFILE}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto text-center")}
        >
          Batal
        </Link>
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto min-w-36">
          {pending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-fg" />
              <span>Menyimpan...</span>
            </span>
          ) : (
            "Simpan Perubahan"
          )}
        </Button>
      </div>
    </form>
  );
}
