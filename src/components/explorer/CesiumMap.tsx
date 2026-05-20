import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";
import { loadCesium } from "@/lib/explorer/cesium-loader";
import { LOCATIONS, CAMPUS_CENTER, CATEGORY_META, type Location } from "@/lib/explorer/locations";

const CESIUM_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzYzZmZGI0MC05ZWE0LTQwMzktOWU5OC1mZjQxMTZiOTI5YmEiLCJpZCI6NDMwMzk5LCJpc3MiOiJodHRwczovL2lvbi5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3Nzg1NTg1MjJ9.8jL2Gcnf29lihMNg7bQyIlVkgdQ8MOFBZpNie7Yl5AY";

// Soft zoom limits — allow free regional exploration but prevent globe-scale zoom out
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 25000;

const createBrickPattern = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Base mortar color (warm concrete mortar)
  ctx.fillStyle = "#baa899";
  ctx.fillRect(0, 0, 256, 128);

  const rowHeight = 12;
  const colWidth = 32;
  const startY = 12; // leave 12px for concrete cap at top
  const endY = 116;  // leave 12px for concrete base at bottom

  // 2. Draw Bricks with 3D bevels
  for (let y = startY; y < endY; y += rowHeight) {
    const isEven = ((y - startY) / rowHeight) % 2 === 0;
    const offset = isEven ? 0 : colWidth / 2;

    for (let x = -colWidth; x <= 256 + colWidth; x += colWidth) {
      const bx = x + offset;
      const by = y;
      const bw = colWidth - 2; // 2px horizontal mortar gap
      const bh = rowHeight - 2; // 2px vertical mortar gap

      // Randomize brick color slightly for natural variation
      const rand = Math.random();
      let brickColor = "#9e3d22"; // Rich terracotta red
      let highlightColor = "#be5b3d";
      let shadowColor = "#6e210d";

      if (rand > 0.7) {
        brickColor = "#853118"; // Darker brick
        highlightColor = "#a34e32";
        shadowColor = "#541604";
      } else if (rand < 0.3) {
        brickColor = "#b64f33"; // Lighter brick
        highlightColor = "#d77255";
        shadowColor = "#822e18";
      }

      // Draw brick body
      ctx.fillStyle = brickColor;
      ctx.fillRect(bx, by, bw, bh);

      // 3D Bevel: Top & Left highlights
      ctx.fillStyle = highlightColor;
      ctx.fillRect(bx, by, bw, 1); // Top edge
      ctx.fillRect(bx, by, 1, bh); // Left edge

      // 3D Bevel: Bottom & Right shadows
      ctx.fillStyle = shadowColor;
      ctx.fillRect(bx, by + bh - 1, bw, 1); // Bottom edge
      ctx.fillRect(bx + bw - 1, by, 1, bh); // Right edge
    }
  }

  // 3. Draw Concrete Coping/Cap at top (y: 0 to 12)
  ctx.fillStyle = "#e5e5df"; // Light stone grey
  ctx.fillRect(0, 0, 256, 10);

  // Cap bevel highlight
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 2);

  // Cap shadow / drip edge
  ctx.fillStyle = "#a8a8a2";
  ctx.fillRect(0, 10, 256, 2);

  // 4. Draw Concrete Foundation/Base at bottom (y: 116 to 128)
  ctx.fillStyle = "#c5c5be"; // Mid stone grey
  ctx.fillRect(0, 116, 256, 12);

  // Base highlights/shadows
  ctx.fillStyle = "#dcdcd6";
  ctx.fillRect(0, 116, 256, 2);
  ctx.fillStyle = "#95958e";
  ctx.fillRect(0, 126, 256, 2);

  return canvas.toDataURL();
};

const createPinImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Outer shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // Teardrop path
  ctx.beginPath();
  ctx.moveTo(32, 58);
  ctx.bezierCurveTo(18, 40, 12, 32, 12, 22);
  ctx.arc(32, 22, 20, Math.PI, 0, false);
  ctx.bezierCurveTo(52, 32, 46, 40, 32, 58);
  ctx.closePath();

  // Gradient fill (premium neon green to rich emerald green)
  const grad = ctx.createRadialGradient(32, 22, 2, 32, 22, 20);
  grad.addColorStop(0, "#4ade80");
  grad.addColorStop(1, "#15803d");
  ctx.fillStyle = grad;
  ctx.fill();

  // White stroke border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Center white dot
  ctx.beginPath();
  ctx.arc(32, 22, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.restore();
  return canvas.toDataURL();
};

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
  onHover?: (loc: Location | null, pos?: { x: number; y: number }) => void;
  onCameraChange?: (info: { lon: number; lat: number; heading: number; height: number }) => void;
};

const CesiumMap = forwardRef<MapHandle, Props>(function CesiumMap(
  { onReady, onSelect, onHover, onCameraChange },
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
    // They take precedence over imagery, so we only show them for "Satellite" when zoomed out
    if (tilesetRef.current && v) {
      const currentHeight = v.camera.positionCartographic.height;
      tilesetRef.current.show = (id === "satellite") && (currentHeight >= 1800);
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
      } catch { }
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
    const pitch = loc.camera?.pitch ?? opts?.pitch ?? -30;
    const range = loc.camera?.range ?? 220;

    // Use flyToBoundingSphere to guarantee perfect centering and camera orientation
    const targetPos = C.Cartesian3.fromDegrees(loc.lon, loc.lat, 10);
    const bs = new C.BoundingSphere(targetPos, 25);

    v.camera.flyToBoundingSphere(bs, {
      offset: new C.HeadingPitchRange(
        C.Math.toRadians(heading),
        C.Math.toRadians(pitch),
        range
      ),
      duration: opts?.duration ?? 2.8,
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
    let outlineDataSource: any = null;

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
      viewer.scene.globe.enableLighting = true;
      viewer.scene.highDynamicRange = true;

      // Apply initially saved imagery if present
      try {
        const saved = localStorage.getItem("mori-map-imagery") || "satellite";
        setTimeout(() => switchImagery(saved), 100);
      } catch { }

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
      viewer.scene.globe.depthTestAgainstTerrain = false;
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
        outlineDataSource = ds;
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
        // Initial visibility based on start camera height
        const startHeight = viewer.camera.positionCartographic.height;
        ds.show = startHeight >= 1800;
      } catch (e) { console.warn(e); }

      // Add Mori School Pin
      viewer.entities.add({
        id: "mori-school-pin",
        name: "Mori School",
        position: Cesium.Cartesian3.fromDegrees(CAMPUS_CENTER.lon, CAMPUS_CENTER.lat, 0),
        billboard: {
          image: createPinImage(),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: "Mori School",
          font: "bold 14px -apple-system, SF Pro Display, Inter, sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString("#15803d"),
          outlineWidth: 3.5,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString("rgba(21, 128, 61, 0.9)"),
          backgroundPadding: new Cesium.Cartesian2(12, 8),
          pixelOffset: new Cesium.Cartesian2(0, -45),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        show: viewer.camera.positionCartographic.height >= 1800,
      });

      // Add brick boundary wall around Map Area
      const brickWallCoords = [
        81.806380608499055, 16.400100291621388,
        81.80696792581233, 16.397338975348219,
        81.809879135181205, 16.3980046917466,
        81.809228998388932, 16.400738775319901,
        81.806380608499055, 16.400100291621388
      ];

      // Subdivide the path to conform to the 3D terrain profile
      const subdividePath = (coords: number[], maxStep: number = 0.00005) => {
        const result: number[] = [];
        for (let i = 0; i < coords.length - 2; i += 2) {
          const lon1 = coords[i];
          const lat1 = coords[i + 1];
          const lon2 = coords[i + 2];
          const lat2 = coords[i + 3];

          const dx = lon2 - lon1;
          const dy = lat2 - lat1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const steps = Math.ceil(dist / maxStep);

          for (let s = 0; s < steps; s++) {
            const t = s / steps;
            result.push(lon1 + dx * t);
            result.push(lat1 + dy * t);
          }
        }
        result.push(coords[coords.length - 2]);
        result.push(coords[coords.length - 1]);
        return result;
      };

      const subdividedCoords = subdividePath(brickWallCoords);

      viewer.entities.add({
        id: "campus-boundary-wall",
        name: "Campus Boundary Wall",
        corridor: {
          positions: Cesium.Cartesian3.fromDegreesArray(subdividedCoords),
          width: 0.9, // 0.9 meters wide wall
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          extrudedHeight: 11.5, // 4.5 meters high
          extrudedHeightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          material: new Cesium.GridMaterialProperty({
            color: Cesium.Color.fromCssColorString("#cef2f8ff"), // glowing cyan grid lines
            cellAlpha: 0.15, // semi-transparent cyan cells
            lineCount: new Cesium.Cartesian2(180, 4), // grid segments
            thickness: new Cesium.Cartesian2(1.5, 1.5),
          }),
          shadows: Cesium.ShadowMode.ENABLED,
        },
        show: viewer.camera.positionCartographic.height < 1800,
      });

      // Add Grass Polygon draped on top of 3D Tiles and terrain
      viewer.entities.add({
        id: "grass-field",
        name: "Lush Grass Field",
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(
            Cesium.Cartesian3.fromDegreesArray([
              81.807572, 16.398519,
              81.808038, 16.398621,
              81.807957, 16.398940,
              81.807520, 16.398845
            ])
          ),
          material: new Cesium.ImageMaterialProperty({
            image: "/textures/grass.jpg",
            repeat: new Cesium.Cartesian2(25.0, 25.0),
          }),
          classificationType: Cesium.ClassificationType.BOTH,
        },
        show: viewer.camera.positionCartographic.height < 1800,
      });


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
            scale: 2.0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 7. Chairman Residency
        const cResPos = Cesium.Cartesian3.fromDegrees(81.808411, 16.399790, 0);
        viewer.entities.add({
          id: "loc-chairman-3d",
          name: "Chairman Residency",
          position: cResPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            cResPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/chairman_residency.glb",
            scale: 1.2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 8. Gate of Salvation
        const gosPos = Cesium.Cartesian3.fromDegrees(81.809296, 16.398948, 0);
        viewer.entities.add({
          id: "loc-gate-salvation-3d",
          name: "Gate of Salvation",
          position: gosPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            gosPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/gate_of_salvation (1).glb",
            scale: 1.0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });

        // 9. Bethel Villa
        const bvPos = Cesium.Cartesian3.fromDegrees(81.808281, 16.400106, 0);
        viewer.entities.add({
          id: "loc-bethel-villa-3d",
          name: "Bethel Villa",
          position: bvPos,
          orientation: Cesium.Transforms.headingPitchRollQuaternion(
            bvPos,
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(80), 0, 0)
          ),
          model: {
            uri: "/models/Betherl villa (1).glb",
            scale: 1.2,
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

      // Interactive Hover Highlight on 3D Models
      let hoveredEntity: any = null;
      handler.setInputAction((movement: any) => {
        const picked = viewer.scene.pick(movement.endPosition);
        let foundEntity = null;

        if (picked && picked.id && typeof picked.id.id === "string" && picked.id.id.startsWith("loc-")) {
          foundEntity = picked.id;
        }

        if (foundEntity !== hoveredEntity) {
          if (hoveredEntity && hoveredEntity.model) {
            hoveredEntity.model.color = Cesium.Color.WHITE;
          }
          if (foundEntity && foundEntity.model) {
            hoveredEntity = foundEntity;
            foundEntity.model.color = Cesium.Color.fromCssColorString("#22d3ee");
            const id = foundEntity.id.replace("loc-", "").replace("-3d", "");
            const loc = LOCATIONS.find((l) => l.id === id);
            if (loc && movement.endPosition) {
              onHover?.(loc, { x: movement.endPosition.x, y: movement.endPosition.y });
            }
          } else {
            hoveredEntity = null;
            onHover?.(null);
          }
        } else if (foundEntity && movement.endPosition) {
          const id = foundEntity.id.replace("loc-", "").replace("-3d", "");
          const loc = LOCATIONS.find((l) => l.id === id);
          if (loc) {
            onHover?.(loc, { x: movement.endPosition.x, y: movement.endPosition.y });
          }
        }

        if (foundEntity) {
          viewer.scene.canvas.style.cursor = "pointer";
        } else {
          viewer.scene.canvas.style.cursor = "default";
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      // Camera change reporting (throttled via Cesium event)
      const onChange = () => {
        const pos = viewer.camera.positionCartographic;
        const currentHeight = pos.height;

        // Toggle visibility based on 1.8km altitude threshold
        const zoomThreshold = 1800;
        const show3D = currentHeight < zoomThreshold;

        // Toggle custom 3D models and boundary wall
        const modelIds = [
          "loc-hospital-3d",
          "loc-riverside-3d",
          "loc-conference-3d",
          "loc-jessy-3d",
          "loc-subbamma-house-3d",
          "loc-amy-3d",
          "loc-chairman-3d",
          "loc-gate-salvation-3d",
          "loc-bethel-villa-3d",
          "campus-boundary-wall",
          "grass-field"
        ];

        modelIds.forEach(id => {
          const ent = viewer.entities.getById(id);
          if (ent) {
            ent.show = show3D;
          }
        });

        // Toggle Google Photorealistic 3D Tileset (only show when zoomed out)
        if (tilesetRef.current) {
          const savedImagery = localStorage.getItem("mori-map-imagery") || "satellite";
          tilesetRef.current.show = (savedImagery === "satellite") && !show3D;
        }

        // Toggle Mori School Pin
        const pin = viewer.entities.getById("mori-school-pin");
        if (pin) {
          pin.show = !show3D;
        }

        // Toggle flat GeoJSON outline
        if (outlineDataSource) {
          outlineDataSource.show = !show3D;
        }



        onCameraChange?.({
          lon: Cesium.Math.toDegrees(pos.longitude),
          lat: Cesium.Math.toDegrees(pos.latitude),
          heading: viewer.camera.heading,
          height: currentHeight,
        });
      };
      viewer.camera.changed.addEventListener(onChange);
      viewer.camera.percentageChanged = 0.01;
      removeCamera = () => viewer.camera.changed.removeEventListener(onChange);

      onReady?.();
    }).catch((e) => console.error("Cesium failed to init", e));

    return () => {
      cancelled = true;
      try { removeCamera?.(); } catch { }
      try { viewerRef.current?.destroy(); } catch { }
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
});

export default CesiumMap;
