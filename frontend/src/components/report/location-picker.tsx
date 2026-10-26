"use client";

import type { GeoJSONSource, Map as MapInstance, Marker as MarkerInstance } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { cssColor, loadMapLibre, MAP_STYLE_URL } from "@/lib/map";
import { DISTRICT_SEEDS } from "@/lib/mock/reference";
import type { DraftPoint } from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";

interface LocationPickerProps {
  bounds: readonly number[];
  point: DraftPoint | null;
  districts?: readonly Schema<"District">[];
  selectedDistrictId?: string;
  selectedVillageId?: string;
  onPick: (point: DraftPoint) => void;
}

type GeoJSONFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: [number, number][][];
  };
  properties: Record<string, unknown>;
};

const FIT_PADDING = 20;
const PAN_MARGIN = 0.02;

function findAreaTarget(
  districtId?: string,
  villageId?: string,
  districts?: readonly Schema<"District">[]
) {
  if (!districtId) return null;
  const list = districts && districts.length > 0 ? districts : DISTRICT_SEEDS;
  const d = list.find((item) => item.id === districtId || item.name === districtId);
  if (!d) return null;
  if (villageId) {
    const v = (d.villages ?? []).find(
      (item) => item.id === villageId || item.name === villageId
    );
    if (v && "point" in v) {
      const pt = v.point as { lat: number; lng: number };
      return { lat: pt.lat, lng: pt.lng, radius: 0.012, zoom: 15.2 };
    }
  }
  if ("point" in d) {
    const pt = d.point as { lat: number; lng: number };
    return { lat: pt.lat, lng: pt.lng, radius: 0.028, zoom: 13.5 };
  }
  const fallback = DISTRICT_SEEDS.find(
    (item) => item.id === districtId || item.name === d.name
  );
  if (fallback) {
    return { lat: fallback.point.lat, lng: fallback.point.lng, radius: 0.028, zoom: 13.5 };
  }
  return null;
}

function makeCircleGeoJSON(lng: number, lat: number, radius: number): GeoJSONFeature {
  const coords: [number, number][] = [];
  const segments = 36;
  for (let i = 0; i <= segments; i++) {
    const rad = (i * 2 * Math.PI) / segments;
    coords.push([lng + radius * Math.cos(rad), lat + radius * 0.9 * Math.sin(rad)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

function LocationPicker({ bounds, point, districts, selectedDistrictId, selectedVillageId, onPick }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const pickRef = useRef(onPick);
  const prevDistrictRef = useRef<string | undefined>(undefined);
  const prevVillageRef = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pickRef.current = onPick;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;

    const mount = async () => {
      const { Map: MapLibreMap, NavigationControl, Marker } = await loadMapLibre();
      if (disposed) return;
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
      instance.once("load", () => {
        instance.resize();
      });
      setReady(true);
    };

    void mount();

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
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
    if (!ready || !map || !marker) return;
    if (point) {
      marker.setLngLat([point.lng, point.lat]).addTo(map);
      map.easeTo({ center: [point.lng, point.lat], duration: 400 });
    } else {
      marker.remove();
    }
  }, [point, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;

    const districtChanged = prevDistrictRef.current !== selectedDistrictId;
    const villageChanged = prevVillageRef.current !== selectedVillageId;
    prevDistrictRef.current = selectedDistrictId;
    prevVillageRef.current = selectedVillageId;

    const target = findAreaTarget(selectedDistrictId, selectedVillageId, districts);
    if (!target) return;

    const color = cssColor("--primary") || "#0d9488";
    const geo = makeCircleGeoJSON(target.lng, target.lat, target.radius);

    const applyTrackedArea = () => {
      if (!map) return;
      const src = map.getSource("tracked-area") as GeoJSONSource | undefined;
      if (src) {
        src.setData(geo as unknown as GeoJSON.GeoJSON);
      } else {
        if (!map.getSource("tracked-area")) {
          map.addSource("tracked-area", { type: "geojson", data: geo as unknown as GeoJSON.GeoJSON });
        }
        if (!map.getLayer("tracked-area-fill")) {
          map.addLayer({
            id: "tracked-area-fill",
            type: "fill",
            source: "tracked-area",
            paint: { "fill-color": color, "fill-opacity": 0.22 },
          });
        }
        if (!map.getLayer("tracked-area-line")) {
          map.addLayer({
            id: "tracked-area-line",
            type: "line",
            source: "tracked-area",
            paint: { "line-color": color, "line-width": 2, "line-dasharray": [2, 1] },
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyTrackedArea();
    } else {
      map.once("load", applyTrackedArea);
      map.once("styledata", applyTrackedArea);
    }

    if (districtChanged || villageChanged) {
      map.flyTo({ center: [target.lng, target.lat], zoom: target.zoom, speed: 1.4, essential: true });
      pickRef.current({ lat: target.lat, lng: target.lng });
    }
  }, [selectedDistrictId, selectedVillageId, ready, districts]);

  return (
    <div className="relative h-48 sm:h-52 lg:h-56 overflow-hidden rounded-xl border bg-surface-muted shadow-xs">
      <div ref={containerRef} role="application" aria-label="Peta untuk menandai lokasi" className="size-full" />
    </div>
  );
}

export { LocationPicker };
