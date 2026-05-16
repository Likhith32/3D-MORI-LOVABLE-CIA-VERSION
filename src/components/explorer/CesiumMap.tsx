import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";
import { loadCesium } from "@/lib/explorer/cesium-loader";
import { LOCATIONS, CAMPUS_CENTER, CATEGORY_META, type Location } from "@/lib/explorer/locations";

const CESIUM_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYzZmZGI0MC05ZWE0LTQwMzktOWU5OC1mZjQxMTZiOTI5YmEiLCJpZCI6NDMwMzk5LCJpc3MiOiJodHRwczovL2lvbi5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3Nzg1NTg1MjJ9.8jL2Gcnf29lihMNg7bQyIlVkgdQ8MOFBZpNie7Yl5AY";

// Soft zoom limits — allow free regional exploration but prevent globe-scale zoom out
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 25000;

export type MapHandle = {
  flyToLocation: (loc: Location, opts?: { duration?: number; pitch?: number }) => void;
  resetView: () => void;
  setImagery: (id: string) => void;
  setViewMode: (mode: string) => void;
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
  const tilesetRef = useRef<any>(null);
  const orbitRemoveRef = useRef<(() => void) | null>(null);

  const clearOrbit = () => {
    if (orbitRemoveRef.current) {
      orbitRemoveRef.current();
      orbitRemoveRef.current = null;
    }
  };

  const setViewMode = async (mode: string) => {
    const v = viewerRef.current;
    const C = cesiumRef.current;
    if (!v || !C) return;

    clearOrbit();

    // Reset look-at matrix just in case it was locked
    v.camera.lookAtTransform(C.Matrix4.IDENTITY);

    // Default time/lighting reset for standard modes
    const isTemporal = mode === "sunset" || mode === "night";
    if (!isTemporal) {
      v.clock.currentTime = C.JulianDate.fromIso8601("2024-05-12T12:00:00Z");
      v.scene.globe.enableLighting = false;
    } else {
      v.scene.globe.enableLighting = true;
    }

    switch (mode) {
      case "top":
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat, 1800),
          orientation: { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 },
          duration: 3,
          easingFunction: C.EasingFunction.CUBIC_IN_OUT,
        });
        break;
      case "cinematic":
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon - 0.002, CAMPUS_CENTER.lat - 0.012, 650),
          orientation: { heading: C.Math.toRadians(12), pitch: C.Math.toRadians(-28), roll: 0 },
          duration: 3.5,
          easingFunction: C.EasingFunction.QUADRATIC_IN_OUT,
        });
        break;
      case "street":
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat - 0.0012, 140),
          orientation: { heading: 0, pitch: C.Math.toRadians(-12), roll: 0 },
          duration: 3,
          easingFunction: C.EasingFunction.QUADRATIC_IN_OUT,
        });
        break;
      case "orbit":
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat - 0.005, 1100),
          orientation: { heading: 0, pitch: C.Math.toRadians(-40), roll: 0 },
          duration: 2.5,
          easingFunction: C.EasingFunction.CUBIC_IN_OUT,
          complete: () => {
             const target = C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat, 0);
             const transform = C.Transforms.eastNorthUpToFixedFrame(target);
             v.camera.lookAtTransform(transform, new C.HeadingPitchRange(0, C.Math.toRadians(-40), 1100));
             
             const tickHandler = () => {
               v.camera.rotateRight(0.0015);
             };
             v.clock.onTick.addEventListener(tickHandler);
             orbitRemoveRef.current = () => {
               v.clock.onTick.removeEventListener(tickHandler);
               v.camera.lookAtTransform(C.Matrix4.IDENTITY);
             };
          }
        });
        break;
      case "sunset":
        v.clock.currentTime = C.JulianDate.fromIso8601("2024-05-12T17:45:00Z");
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon - 0.0035, CAMPUS_CENTER.lat - 0.0035, 750),
          orientation: { heading: C.Math.toRadians(45), pitch: C.Math.toRadians(-30), roll: 0 },
          duration: 3.5,
        });
        break;
      case "night":
        v.clock.currentTime = C.JulianDate.fromIso8601("2024-05-12T21:30:00Z");
        v.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon + 0.001, CAMPUS_CENTER.lat - 0.004, 950),
          orientation: { heading: C.Math.toRadians(-15), pitch: C.Math.toRadians(-45), roll: 0 },
          duration: 3.5,
        });
        break;
      case "free":
      default:
        break;
    }
  };

  const switchImagery = async (id: string) => {
    const v = viewerRef.current;
    const C = cesiumRef.current;
    if (!v || !C) return;

    // Toggle Google Photorealistic 3D Tiles if we have them loaded
    // They take precedence over imagery, so we only show them for "Satellite"
    if (tilesetRef.current) {
      tilesetRef.current.show = id === "satellite";
    }

    // Remove all existing layers
    v.imageryLayers.removeAll();

    try {
      let provider;
      switch (id) {
        case "hybrid":
          provider = await C.createWorldImageryAsync({
            style: C.IonWorldImageryStyle.AERIAL_WITH_LABELS
          });
          break;
        case "street":
          provider = new C.OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/"
          });
          break;
        case "terrain":
          provider = await C.ArcGisMapServerImageryProvider.fromUrl(
            "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
          );
          break;
        case "dark":
          provider = await C.ArcGisMapServerImageryProvider.fromUrl(
            "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer"
          );
          break;
        default:
          provider = await C.createWorldImageryAsync({
            style: C.IonWorldImageryStyle.AERIAL
          });
          break;
      }

      if (provider) {
        const layer = v.imageryLayers.addImageryProvider(provider);
        layer.alpha = 0;
        let a = 0;
        const step = () => {
          a += 0.1;
          if (a <= 1) {
            layer.alpha = a;
            requestAnimationFrame(step);
          } else {
            layer.alpha = 1;
          }
        };
        step();
      }
    } catch (e) {
      console.warn("Failed to load imagery provider:", e);
      try {
        v.imageryLayers.addImageryProvider(
          new C.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" })
        );
      } catch {}
    }
  };

  useImperativeHandle(ref, () => ({
    flyToLocation: (loc, opts) => flyTo(loc, opts),
    resetView: () => resetView(),
    setImagery: (id: string) => switchImagery(id),
    setViewMode: (mode: string) => setViewMode(mode),
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
    clearOrbit();
    v.camera.lookAtTransform(C.Matrix4.IDENTITY);

    const heading = loc.camera?.heading ?? 0;
    const pitch = loc.camera?.pitch ?? opts?.pitch ?? -32;
    const range = loc.camera?.range ?? 200;
    const offsetLon = loc.camera?.offset?.lon ?? 0;
    const offsetLat = loc.camera?.offset?.lat ?? -0.0005;

    v.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(loc.lon + offsetLon, loc.lat + offsetLat, range),
      orientation: {
        heading: C.Math.toRadians(heading),
        pitch: C.Math.toRadians(pitch),
        roll: 0,
      },
      duration: opts?.duration ?? 2.8,
      easingFunction: C.EasingFunction.CUBIC_IN_OUT,
    });
  }

  function resetView() {
    const v = viewerRef.current;
    const C = cesiumRef.current;
    if (!v || !C) return;
    clearOrbit();
    v.camera.lookAtTransform(C.Matrix4.IDENTITY);
    v.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(CAMPUS_CENTER.lon - 0.002, CAMPUS_CENTER.lat - 0.012, 650),
      orientation: {
        heading: C.Math.toRadians(12),
        pitch: C.Math.toRadians(-28),
        roll: 0,
      },
      duration: 2.2,
      easingFunction: C.EasingFunction.CUBIC_IN_OUT,
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
        shadows: true, // Enable shadows for depth
        terrainShadows: Cesium.ShadowMode.ENABLED,
      });
      viewerRef.current = viewer;

      // Apply initially saved imagery if present
      try {
        const saved = localStorage.getItem("mori-map-imagery") || "satellite";
        setTimeout(() => switchImagery(saved), 100);
      } catch {}

      // Add Google Photorealistic 3D Tiles for cinematic look
      try {
        const tileset = await Cesium.createGooglePhotorealistic3DTileset();
        viewer.scene.primitives.add(tileset);
        tilesetRef.current = tileset;
        const saved = localStorage.getItem("mori-map-imagery") || "satellite";
        tileset.show = saved === "satellite";
      } catch (e) {
        console.warn("Photorealistic 3D Tiles unavailable, using default", e);
      }

      // Tune scene
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0018;
      viewer.scene.fog.screenSpaceErrorFactor = 5; // Crisper fog
      viewer.scene.globe.enableLighting = false;

      const ctrl = viewer.scene.screenSpaceCameraController;
      ctrl.minimumZoomDistance = MIN_HEIGHT;
      ctrl.maximumZoomDistance = MAX_HEIGHT;
      ctrl.enableCollisionDetection = true;

      // --- DYNAMIC CINEMATIC INTRO SEQUENCE ---
      // 1. Position far out dynamically
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          CAMPUS_CENTER.lon - 0.02, CAMPUS_CENTER.lat - 0.02, 5500,
        ),
        orientation: {
          heading: Cesium.Math.toRadians(40),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
      });

      // 2. Wait for short veil and trigger fly into campus
      setTimeout(() => {
        if (!viewer || cancelled) return;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            CAMPUS_CENTER.lon - 0.002, CAMPUS_CENTER.lat - 0.012, 650
          ),
          orientation: {
            heading: Cesium.Math.toRadians(12),
            pitch: Cesium.Math.toRadians(-28),
            roll: 0,
          },
          duration: 4.5,
          easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
        });
      }, 800);
      // -----------------------------------------

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
            ent.polygon.classificationType = Cesium.ClassificationType.BOTH;
          }
          if (ent.polyline) {
            ent.polyline.clampToGround = true;
            ent.polyline.classificationType = Cesium.ClassificationType.BOTH;
          }
        });
      } catch (e) { console.warn(e); }

      // Markers (Hidden as per request)
      /*
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
      */

      // Add 3D Models
      try {
        const hPos = Cesium.Cartesian3.fromDegrees(81.80911, 16.40012, 0);
        viewer.entities.add({
          id: "loc-hospital-3d", // Added ID
          name: "Hospital Building Model",
          position: hPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            hPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/Hospital.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
            scale: 2.5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 2. Riverside School
        const sPos = Cesium.Cartesian3.fromDegrees(81.808723, 16.399054, 0);
        viewer.entities.add({
          id: "loc-riverside-3d",
          name: "School Building Model",
          position: sPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            sPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/SCHOOL.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
            scale: 1.4,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 3. Conference Hall
        const cPos = Cesium.Cartesian3.fromDegrees(81.808737, 16.398261, 0);
        viewer.entities.add({
          id: "loc-conference-3d",
          name: "Conference Hall",
          position: cPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            cPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/Conference_Hall.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
            scale: 2.0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 4. Auditorium
        const aPos = Cesium.Cartesian3.fromDegrees(81.807642, 16.399459, 0);
        viewer.entities.add({
          id: "loc-jessy-3d",
          name: "Auditorium",
          position: aPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            aPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/Auditorium.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
            scale: 2.0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 5. Subbamma House
        const shPos = Cesium.Cartesian3.fromDegrees(81.808786, 16.400107, 0);
        viewer.entities.add({
          id: "loc-subbamma-house-3d",
          name: "Subbamma House",
          position: shPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            shPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/Subbamma_House.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
            scale: 0.8,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 6. Dance Studio
        const dPos = Cesium.Cartesian3.fromDegrees(81.807445, 16.400049, 0);
        viewer.entities.add({
          id: "loc-amy-3d",
          name: "Dance Studio",
          position: dPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            dPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/Dance_Studio.glb",
            minimumPixelSize: 128,
            maximumScale: 20000,
            scale: 2.0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
      } catch (e) {
        console.warn("Error adding 3D models:", e);
      }

      // Click handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: any) => {
        const picked = viewer.scene.pick(click.position);
        
        // Step 1: Direct entity pick (marker or custom mesh)
        if (picked && picked.id && typeof picked.id.id === "string" && picked.id.id.startsWith("loc-")) {
          const id = picked.id.id.replace("loc-", "").replace("-3d", "");
          const loc = LOCATIONS.find((l) => l.id === id);
          if (loc) {
            onSelect?.(loc);
            flyTo(loc);
            return;
          }
        }

        // Step 2: Spatial pick fallback (detects clicking 3D geometry from Google tileset)
        const ray = viewer.camera.getPickRay(click.position);
        const cartesian = viewer.scene.pickPosition(click.position) || viewer.scene.globe.pick(ray, viewer.scene);
        
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const clickedLon = Cesium.Math.toDegrees(cartographic.longitude);
          const clickedLat = Cesium.Math.toDegrees(cartographic.latitude);
          
          // Simple Euclidean distance comparison in degrees 
          // ~0.0004 is roughly 40-50 meters.
          const THRESHOLD = 0.00045; 
          let bestMatch = null;
          let bestDist = THRESHOLD;

          LOCATIONS.forEach(loc => {
            const dLon = loc.lon - clickedLon;
            const dLat = loc.lat - clickedLat;
            const d = Math.sqrt(dLon * dLon + dLat * dLat);
            if (d < bestDist) {
              bestDist = d;
              bestMatch = loc;
            }
          });

          if (bestMatch) {
            onSelect?.(bestMatch);
            flyTo(bestMatch);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      handler.setInputAction((click: any) => {
        const ray = viewer.camera.getPickRay(click.position);
        const cartesian = viewer.scene.pickPosition(click.position) || viewer.scene.globe.pick(ray, viewer.scene);

        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
          const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
          const coords = `${lon}, ${lat}`;

          navigator.clipboard.writeText(coords);
          toast.success("Coordinates Copied", {
            description: `${coords} has been copied to clipboard`,
            icon: "📍",
          });
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

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
