"use client";

import {
  ArrowRight,
  Calendar,
  ChevronRight,
  ExternalLink,
  Eye,
  Filter,
  Info,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import type { Map as MapInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cssColor, loadMapLibre, MAP_STYLE_URL } from "@/lib/map";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ReportMapPoint {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: string;
  urgency?: string;
  opd_id?: string;
  opd_name?: string;
  address_detail?: string;
  cover_photo_url?: string;
  lat: number;
  lng: number;
  created_at?: string;
}

const SOURCE_ID = "reports-distribution";
const FIT_PADDING = 60;
const MAX_FIT_ZOOM = 15;

const STATUS_CONFIG: Record<string, { label: string; color: string; badgeCls: string }> = {
  DIAJUKAN: {
    label: "Diajukan",
    color: "#F59E0B",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
  },
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu Verifikasi",
    color: "#F59E0B",
    badgeCls: "bg-amber-100 text-amber-800 border-amber-300",
  },
  DITERUSKAN: {
    label: "Diteruskan ke Dinas",
    color: "#136cfc",
    badgeCls: "bg-blue-100 text-blue-800 border-blue-300",
  },
  DIPROSES: {
    label: "Dalam Penanganan",
    color: "#6366F1",
    badgeCls: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  SELESAI: {
    label: "Selesai",
    color: "#10B981",
    badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  DITOLAK: {
    label: "Ditolak",
    color: "#EF4444",
    badgeCls: "bg-red-100 text-red-800 border-red-300",
  },
};

const DEFAULT_STATUS = {
  label: "Lainnya",
  color: "#6B7280",
  badgeCls: "bg-zinc-100 text-zinc-800 border-zinc-300",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "Semua Status" },
  { value: "VERIFIKASI", label: "Perlu Verifikasi" },
  { value: "DITERUSKAN", label: "Diteruskan ke Dinas" },
  { value: "DIPROSES", label: "Dalam Penanganan" },
  { value: "SELESAI", label: "Selesai" },
  { value: "DITOLAK", label: "Ditolak" },
] as const;

export function AdminDistributionMap({
  points,
  mode = "admin",
  title = "Peta Sebaran Laporan Warga",
}: {
  points: readonly ReportMapPoint[];
  mode?: "admin" | "dinas";
  title?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<ReportMapPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: ReportMapPoint; x: number; y: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const mapRef = useRef<MapInstance | null>(null);

  const validPoints = useMemo(() => {
    return points.filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number" && (p.lat !== 0 || p.lng !== 0),
    );
  }, [points]);

  const filteredPoints = useMemo(() => {
    if (statusFilter === "ALL") return validPoints;
    if (statusFilter === "VERIFIKASI") {
      return validPoints.filter((p) => p.status === "DIAJUKAN" || p.status === "MENUNGGU_VERIFIKASI");
    }
    return validPoints.filter((p) => p.status === statusFilter);
  }, [validPoints, statusFilter]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const mount = async () => {
      const { Map: MapLibreMap, NavigationControl, LngLatBounds } = await loadMapLibre();
      if (disposed) return;

      const map = new MapLibreMap({
        container,
        style: MAP_STYLE_URL,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.addControl(new NavigationControl({ showCompass: false }), "top-right");

      const ptsToFit = filteredPoints.length > 0 ? filteredPoints : validPoints;
      if (ptsToFit.length > 0) {
        const bounds = new LngLatBounds();
        for (const pt of ptsToFit) {
          bounds.extend([pt.lng, pt.lat]);
        }
        map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM, animate: false });
      } else {
        map.setCenter([107.6191, -6.9175]);
        map.setZoom(12);
      }

      map.on("load", () => {
        if (disposed) return;

        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: filteredPoints.map((p) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
              properties: {
                id: p.id,
                code: p.code,
                title: p.title,
                status: p.status,
                color: (STATUS_CONFIG[p.status] || DEFAULT_STATUS).color,
              },
            })),
          },
        });

        map.addLayer({
          id: "report-pins-halo",
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 15,
            "circle-opacity": 0.28,
          },
        });

        map.addLayer({
          id: "report-pins",
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 7.5,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": cssColor("--surface") || "#ffffff",
          },
        });

        map.on("click", "report-pins", (e) => {
          const id = e.features?.[0]?.properties?.id;
          const found = filteredPoints.find((p) => p.id === id);
          if (found) {
            setSelectedPoint(found);
            setHoveredPoint(null);
            map.easeTo({ center: [found.lng, found.lat], zoom: Math.max(map.getZoom(), 15) });
          }
        });

        map.on("mousemove", "report-pins", (e) => {
          const id = e.features?.[0]?.properties?.id;
          const found = filteredPoints.find((p) => p.id === id);
          if (found) {
            setHoveredPoint({ point: found, x: e.point.x, y: e.point.y });
          }
        });

        map.on("mouseenter", "report-pins", () => {
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", "report-pins", () => {
          map.getCanvas().style.cursor = "";
          setHoveredPoint(null);
        });

        map.on("movestart", () => {
          setHoveredPoint(null);
        });
      });
    };

    void mount();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [filteredPoints, validPoints]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-fg tracking-tight">{title}</h2>
          <p className="text-xs text-fg-muted">
            Menampilkan {filteredPoints.length} titik sebaran laporan warga. Sorot (hover) titik untuk info cepat, atau klik untuk melihat detail lengkap.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Select
            value={statusFilter}
            items={STATUS_OPTIONS}
            onValueChange={(val) => {
              if (val) {
                setStatusFilter(val);
                setSelectedPoint(null);
                setHoveredPoint(null);
              }
            }}
          >
            <SelectTrigger
              aria-label="Filter status laporan"
              className="h-10 w-52 sm:w-56 rounded-lg border-border-strong bg-surface px-3 text-sm font-medium text-fg shadow-2xs hover:border-fg-muted focus-visible:border-fg"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
                <Filter className="size-4 shrink-0 text-fg-muted" />
                <SelectValue placeholder="Semua Status" className="truncate text-sm" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative h-[480px] w-full overflow-hidden rounded-lg border border-border/80 bg-surface-muted">
        <div ref={containerRef} className="size-full" role="region" aria-label={title} />

        {hoveredPoint && !selectedPoint && (
          <div
            className="pointer-events-none absolute z-20 w-72 max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-full pb-3"
            style={{
              left: `${Math.max(150, Math.min(hoveredPoint.x, (containerRef.current?.clientWidth || 500) - 150))}px`,
              top: `${Math.max(10, hoveredPoint.y - 12)}px`,
            }}
          >
            <div className="rounded-xl border border-border bg-surface/98 p-3 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                    (STATUS_CONFIG[hoveredPoint.point.status] || DEFAULT_STATUS).badgeCls,
                  )}
                >
                  {(STATUS_CONFIG[hoveredPoint.point.status] || DEFAULT_STATUS).label}
                </span>
                <span className="font-mono text-[11px] font-semibold text-fg-muted">
                  {hoveredPoint.point.code}
                </span>
              </div>

              <h4 className="mt-1.5 text-xs font-bold text-fg line-clamp-1">
                {hoveredPoint.point.title}
              </h4>

              {hoveredPoint.point.address_detail && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-fg-muted line-clamp-1">
                  <MapPin className="size-3 shrink-0 text-primary" />
                  <span>{hoveredPoint.point.address_detail}</span>
                </p>
              )}

              {hoveredPoint.point.opd_name && (
                <p className="mt-1 text-[11px] text-fg-muted font-medium line-clamp-1">
                  Dinas: {hoveredPoint.point.opd_name}
                </p>
              )}

              <div className="mt-2 flex items-center justify-between border-t border-border pt-1.5 text-[10px] font-semibold text-primary">
                <span>Klik pin untuk buka detail</span>
                <span>→</span>
              </div>
            </div>
          </div>
        )}

        {selectedPoint && (
          <div className="absolute top-3 right-3 left-3 z-30 max-w-md rounded-2xl border border-border bg-surface/98 p-4 shadow-2xl backdrop-blur-md sm:left-auto">
            <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                    (STATUS_CONFIG[selectedPoint.status] || DEFAULT_STATUS).badgeCls,
                  )}
                >
                  {(STATUS_CONFIG[selectedPoint.status] || DEFAULT_STATUS).label}
                </span>
                <span className="font-mono text-xs font-semibold text-fg-muted">
                  {selectedPoint.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
                aria-label="Tutup detail"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                  Judul Laporan
                </span>
                <h3 className="text-sm font-bold text-fg leading-snug">
                  {selectedPoint.title}
                </h3>
              </div>

              {selectedPoint.cover_photo_url && (
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={selectedPoint.cover_photo_url}
                    alt={selectedPoint.title}
                    className="h-36 w-full object-cover"
                  />
                </div>
              )}

              {selectedPoint.description && (
                <div className="rounded-lg border border-border/80 bg-surface-muted/60 p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
                    Isi Laporan Warga
                  </span>
                  <p className="mt-1 text-xs text-fg leading-relaxed">
                    {selectedPoint.description}
                  </p>
                </div>
              )}

              {selectedPoint.address_detail && (
                <div className="flex items-start gap-1.5 text-xs text-fg-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div>
                    <span className="font-semibold text-fg">Lokasi: </span>
                    <span>{selectedPoint.address_detail}</span>
                  </div>
                </div>
              )}

              {selectedPoint.opd_name && (
                <div className="rounded-md bg-surface-muted px-2.5 py-1.5 text-xs text-fg-muted">
                  <span className="font-semibold text-fg">Dinas Terkait: </span>
                  <span>{selectedPoint.opd_name}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-fg-muted">
                <span>
                  Koordinat: {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    mapRef.current?.easeTo({
                      center: [selectedPoint.lng, selectedPoint.lat],
                      zoom: 16,
                    });
                  }}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  <Navigation className="size-3" />
                  Fokus Peta
                </button>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3">

              {mode === "admin" ? (
                selectedPoint.status === "DIAJUKAN" || selectedPoint.status === "MENUNGGU_VERIFIKASI" ? (
                  <Link
                    href="/admin/verifikasi"
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg shadow-xs hover:bg-primary/90"
                  >
                    Verifikasi Laporan
                    <ChevronRight className="size-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/isu"
                    className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-semibold text-fg hover:bg-surface-muted/80"
                  >
                    Buka Isu Terkini
                    <ArrowRight className="size-3.5" />
                  </Link>
                )
              ) : (
                <Link
                  href={`/dinas/isu/${selectedPoint.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg shadow-xs hover:bg-primary/90"
                >
                  Buka Detail Dinas
                  <ChevronRight className="size-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}