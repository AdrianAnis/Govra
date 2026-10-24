"use client";

import type { Map as MapInstance, Marker as MarkerInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { DraftPoint } from "@/lib/report-draft";
import { cssColor, loadMapLibre, MAP_STYLE_URL } from "@/lib/map";

interface LocationPickerProps {
  bounds: readonly number[];
  point: DraftPoint | null;
  onPick: (point: DraftPoint) => void;
}

const FIT_PADDING = 24;
const PAN_MARGIN = 0.02;

function LocationPicker({ bounds, point, onPick }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const pickRef = useRef(onPick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pickRef.current = onPick;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let disposed = false;

    const mount = async () => {
      const { Map: MapLibreMap, NavigationControl, Marker } = await loadMapLibre();
      if (disposed) {
        return;
      }
      const [west = 0, south = 0, east = 0, north = 0] = bounds;
      const instance = new MapLibreMap({
        container,
        style: MAP_STYLE_URL,
        bounds: [west, south, east, north],
        fitBoundsOptions: { padding: FIT_PADDING },
        maxBounds: [
          [west - PAN_MARGIN, south - PAN_MARGIN],
          [east + PAN_MARGIN, north + PAN_MARGIN],
        ],
        attributionControl: { compact: true },
      });
      instance.addControl(new NavigationControl({ showCompass: false }), "top-right");
      instance.on("click", (event) => {
        pickRef.current({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      });
      mapRef.current = instance;
      markerRef.current = new Marker({ color: cssColor("--primary") });
      setReady(true);
    };

    void mount();
    return () => {
      disposed = true;
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      setReady(false);
    };
  }, [bounds]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!ready || !map || !marker) {
      return;
    }
    if (point) {
      marker.setLngLat([point.lng, point.lat]).addTo(map);
    } else {
      marker.remove();
    }
  }, [point, ready]);

  return (
    <div className="relative h-80 overflow-hidden rounded-lg border bg-surface-muted lg:h-96">
      <div ref={containerRef} role="application" aria-label="Peta untuk menandai lokasi" className="size-full" />
    </div>
  );
}

export { LocationPicker };
