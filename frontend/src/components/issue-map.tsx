"use client";

import { X } from "lucide-react";
import type { Map as MapInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ISSUE_STATUS, type IssueStatus } from "@/lib/status";

export interface IssueMarker {
  id: string;
  title: string;
  status: IssueStatus;
  reporters: number;
  village: string;
  cover: string | null;
  lat: number;
  lng: number;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const SOURCE_ID = "issues";
const FIT_PADDING = 64;
const MAX_FIT_ZOOM = 13;
const MAX_LEAVES = 50;
const CLUSTER_RADIUS = 50;
const CLUSTER_ZOOM_CAP = 13;

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function IssueMap({ markers }: { markers: readonly IssueMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<readonly IssueMarker[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let map: MapInstance | null = null;
    let disposed = false;
    const byId = new Map(markers.map((marker) => [marker.id, marker]));

    const pick = (id: unknown): IssueMarker[] => {
      const marker = typeof id === "string" ? byId.get(id) : undefined;
      return marker ? [marker] : [];
    };

    const mount = async () => {
      const { Map: MapLibreMap, NavigationControl, LngLatBounds, GeoJSONSource, setWorkerUrl } = await import(
        "maplibre-gl"
      );
      if (disposed) {
        return;
      }
      setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString());
      const dark = cssColor("--secondary");
      const light = cssColor("--surface");
      const accent = cssColor("--primary");
      const instance = new MapLibreMap({
        container,
        style: STYLE_URL,
        attributionControl: { compact: true },
      });
      map = instance;
      instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
      const bounds = new LngLatBounds();
      for (const marker of markers) {
        bounds.extend([marker.lng, marker.lat]);
      }
      instance.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM, animate: false });

      instance.on("load", () => {
        instance.addSource(SOURCE_ID, {
          type: "geojson",
          cluster: true,
          clusterRadius: CLUSTER_RADIUS,
          data: {
            type: "FeatureCollection",
            features: markers.map((marker) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [marker.lng, marker.lat] },
              properties: { id: marker.id },
            })),
          },
        });
        instance.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": dark,
            "circle-radius": ["step", ["get", "point_count"], 18, 5, 24, 15, 30],
            "circle-stroke-width": 3,
            "circle-stroke-color": light,
          },
        });
        instance.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 14,
            "text-allow-overlap": true,
          },
          paint: { "text-color": light },
        });
        instance.addLayer({
          id: "points",
          type: "circle",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": accent,
            "circle-radius": 9,
            "circle-stroke-width": 3,
            "circle-stroke-color": light,
          },
        });
      });

      instance.on("click", "points", (event) => {
        setSelection(pick(event.features?.[0]?.properties?.id));
      });

      instance.on("click", "clusters", async (event) => {
        const clusterId = event.features?.[0]?.properties?.cluster_id;
        const source = instance.getSource(SOURCE_ID);
        if (typeof clusterId !== "number" || !(source instanceof GeoJSONSource)) {
          return;
        }
        const [leaves, zoom] = await Promise.all([
          source.getClusterLeaves(clusterId, MAX_LEAVES, 0),
          source.getClusterExpansionZoom(clusterId),
        ]);
        if (disposed) {
          return;
        }
        setSelection(leaves.flatMap((leaf) => pick(leaf.properties?.id)));
        instance.easeTo({
          center: event.lngLat,
          zoom: Math.max(instance.getZoom(), Math.min(zoom, CLUSTER_ZOOM_CAP)),
        });
      });

      for (const layer of ["points", "clusters"]) {
        instance.on("mouseenter", layer, () => {
          instance.getCanvas().style.cursor = "pointer";
        });
        instance.on("mouseleave", layer, () => {
          instance.getCanvas().style.cursor = "";
        });
      }
    };

    void mount();
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [markers]);

  return (
    <div className="relative h-128 overflow-hidden rounded-lg border bg-surface-muted lg:h-160">
      <div ref={containerRef} role="region" aria-label="Peta sebaran isu warga" className="size-full" />
      {selection.length > 0 && (
        <div className="absolute right-4 bottom-4 left-4 flex max-h-96 flex-col overflow-hidden rounded-lg bg-surface shadow-xl sm:right-auto sm:w-96">
          <div className="flex items-start justify-between gap-4 bg-secondary p-5 text-secondary-fg">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-secondary-fg/70">
                {selection.length === 1 ? "Isu di" : `${selection.length} isu di sekitar`}
              </p>
              <p className="text-xl leading-snug font-bold tracking-tight">{selection[0]?.village}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelection([])}
              aria-label="Tutup"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-fg/10 transition-colors hover:bg-secondary-fg/20"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          <ul className="no-scrollbar flex flex-col gap-1 overflow-y-auto p-2">
            {selection.map((item) => {
              const { label, icon: StatusIcon } = ISSUE_STATUS[item.status];
              return (
                <li key={item.id}>
                  <Link
                    href={`/isu/${item.id}`}
                    className="group flex items-center gap-4 rounded-md p-3 transition-colors duration-200 ease-ui hover:bg-surface-muted"
                  >
                    <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-secondary text-secondary-fg">
                      {item.cover ? (
                        <Image src={item.cover} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <StatusIcon aria-hidden className="size-6" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="line-clamp-2 leading-snug font-semibold group-hover:text-primary">
                        {item.title}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 text-xs text-fg-muted">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <StatusIcon aria-hidden className="size-3.5" />
                          {label}
                        </span>
                        <span>{item.reporters} pelapor</span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export { IssueMap };
