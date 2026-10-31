"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { cssColor, loadMapLibre, MAP_STYLE_URL } from "@/lib/map";

interface SpreadPoint {
  lat: number;
  lng: number;
}

const FIT_PADDING = 48;
const MAX_FIT_ZOOM = 16;
const SOURCE_ID = "spread";

function SpreadMap({ points }: { points: readonly SpreadPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let disposed = false;
    let cleanup = () => {};

    const mount = async () => {
      const { Map: MapLibreMap, NavigationControl, LngLatBounds } = await loadMapLibre();
      if (disposed) {
        return;
      }
      const map = new MapLibreMap({ container, style: MAP_STYLE_URL, attributionControl: { compact: true } });
      cleanup = () => map.remove();
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      const bounds = new LngLatBounds();
      for (const point of points) {
        bounds.extend([point.lng, point.lat]);
      }
      map.fitBounds(bounds, { padding: FIT_PADDING, maxZoom: MAX_FIT_ZOOM, animate: false });
      map.on("load", () => {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: points.map((point) => ({
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [point.lng, point.lat] },
              properties: {},
            })),
          },
        });
        map.addLayer({
          id: "spread-points",
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-color": cssColor("--primary"),
            "circle-radius": 9,
            "circle-stroke-width": 3,
            "circle-stroke-color": cssColor("--surface"),
          },
        });
      });
    };

    void mount();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [points]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Peta sebaran lokasi laporan"
      className="h-80 overflow-hidden rounded-lg border bg-surface-muted"
    />
  );
}

export { SpreadMap };
