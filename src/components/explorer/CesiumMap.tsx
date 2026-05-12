import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { loadCesium } from "@/lib/explorer/cesium-loader";
import { LOCATIONS, CAMPUS_CENTER, CATEGORY_META, type Location } from "@/lib/explorer/locations";

const CESIUM_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYzZmZGI0MC05ZWE0LTQwMzktOWU5OC1mZjQxMTZiOTI5YmEiLCJpZCI6NDMwMzk5LCJpc3MiOiJodHRwczovL2lvbi5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3Nzg1NTg1MjJ9.8jL2Gcnf29lihMNg7bQyIlVkgdQ8MOFBZpNie7Yl5AY";

export type MapHandle = {
  flyToLocation: (loc: Location, opts?: { duration?: number; pitch?: number }) => void;
  resetView: () => void;
  getHeading: () => number;
  getCenterLngLat: () => { lon: number; lat: number };
};

type Props = {
  onReady?: () => void;
  onSelect?: (loc: Location) => void;
  onCameraChange?: (info: { lon: number; lat: number; heading: number; height: number }) => void;
};

const CesiumMap = forwardRef<MapHandle, Props>(function CesiumMap(
  { onReady, onSelect, onCameraChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const cesiumRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    flyToLocation: (loc, opts) => flyTo(loc, opts),
    resetView: () => resetView(),
    getHeading: () => {
      const v = viewerRef.current;
      if (!v) return 0;
      return v.camera.heading;
    },
    getCenterLngLat: () => {
      const v = viewerRef.current;
      const C = cesiumRef.current;
      if (!v || !C) return { lon: CAMPUS_CENTER.lon, lat: CAMPUS_CENTER.lat };
      const pos = v.camera.positionCartographic;
      return { lon: C.Math.toDegrees(pos.longitude), lat: C.Math.toDegrees(pos.latitude) };
    },
  }));

  function flyTo(loc: Location, opts?: { duration?: number; pitch?: number }) {
    const v = viewerRef.current;
    const C = cesiumRef.current;
    if (!v || !C) return;
    v.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(loc.lon, loc.lat - 0.0008, 280),
      orientation: {
        heading: C.Math.toRadians(0),
        pitch: C.Math.toRadians(opts?.pitch ?? -38),
        roll: 0,
      },
      duration: opts?.duration ?? 2.4,
      easingFunction: C.EasingFunction.QUADRATIC_IN_OUT,
    });
  }

  function resetView() {
    const v = viewerRef.current;
    const C = cesiumRef.current;
    if (!v || !C) return;
    v.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat - 0.002, 900),
      orientation: {
        heading: C.Math.toRadians(0),
        pitch: C.Math.toRadians(-50),
        roll: 0,
      },
      duration: 2.2,
    });
  }

  useEffect(() => {
    let cancelled = false;
    let removeCamera: (() => void) | null = null;

    loadCesium().then(async (Cesium) => {
      if (cancelled || !containerRef.current) return;
      cesiumRef.current = Cesium;
      Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

      const viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      });
      viewerRef.current = viewer;

      // Add Google Photorealistic 3D Tiles for cinematic look
      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset();
        viewer.scene.primitives.add(tileset);
      } catch (e) {
        // Fallback to default imagery already loaded.
        console.warn("Photorealistic 3D Tiles unavailable, using default", e);
      }

      // Tune scene
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.globe.enableLighting = false;

      // Initial cinematic camera
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          CAMPUS_CENTER.lon, CAMPUS_CENTER.lat - 0.004, 1400,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-55),
          roll: 0,
        },
      });

      // Load campus outline
      try {
        const ds = await Cesium.GeoJsonDataSource.load("/geo/Outline.geojson", {
          stroke: Cesium.Color.fromCssColorString("#4ade80"),
          fill: Cesium.Color.fromCssColorString("rgba(74, 222, 128, 0.08)"),
          strokeWidth: 4,
          clampToGround: true,
        });
        viewer.dataSources.add(ds);
        ds.entities.values.forEach((ent: any) => {
          if (ent.polygon) {
            ent.polygon.outline = true;
            ent.polygon.outlineColor = Cesium.Color.fromCssColorString("#22d3ee");
            ent.polygon.material = Cesium.Color.fromCssColorString("rgba(74, 222, 128, 0.10)");
          }
        });
      } catch (e) { console.warn(e); }

      // Markers
      LOCATIONS.forEach((loc) => {
        const meta = CATEGORY_META[loc.category];
        const ringColor = Cesium.Color.fromCssColorString(meta.color);
        viewer.entities.add({
          id: `loc-${loc.id}`,
          name: loc.name,
          position: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, 80),
          point: {
            pixelSize: 14,
            color: Cesium.Color.WHITE,
            outlineColor: ringColor,
            outlineWidth: 4,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: loc.name,
            font: "500 13px -apple-system, SF Pro Display, Inter, sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#0b1320"),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("rgba(255,255,255,0.85)"),
            backgroundPadding: new Cesium.Cartesian2(10, 6),
            pixelOffset: new Cesium.Cartesian2(0, -28),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            scaleByDistance: new Cesium.NearFarScalar(200, 1.0, 2500, 0.0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      });

      // Click handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: any) => {
        const picked = viewer.scene.pick(click.position);
        if (picked && picked.id && typeof picked.id.id === "string" && picked.id.id.startsWith("loc-")) {
          const id = picked.id.id.replace("loc-", "");
          const loc = LOCATIONS.find((l) => l.id === id);
          if (loc) {
            onSelect?.(loc);
            flyTo(loc);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Camera change reporting (throttled via Cesium event)
      const onChange = () => {
        const pos = viewer.camera.positionCartographic;
        onCameraChange?.({
          lon: Cesium.Math.toDegrees(pos.longitude),
          lat: Cesium.Math.toDegrees(pos.latitude),
          heading: viewer.camera.heading,
          height: pos.height,
        });
      };
      viewer.camera.changed.addEventListener(onChange);
      viewer.camera.percentageChanged = 0.01;
      removeCamera = () => viewer.camera.changed.removeEventListener(onChange);

      onReady?.();
    }).catch((e) => console.error("Cesium failed to init", e));

    return () => {
      cancelled = true;
      try { removeCamera?.(); } catch {}
      try { viewerRef.current?.destroy(); } catch {}
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
});

export default CesiumMap;
