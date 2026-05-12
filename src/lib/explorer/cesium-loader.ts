// Loads CesiumJS from CDN at runtime so we don't need to bundle workers/assets.
const CESIUM_VERSION = "1.121";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

let loadPromise: Promise<any> | null = null;

export function loadCesium(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const w = window as any;
  if (w.Cesium) return Promise.resolve(w.Cesium);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    w.CESIUM_BASE_URL = CESIUM_BASE;
    const s = document.createElement("script");
    s.src = `${CESIUM_BASE}/Cesium.js`;
    s.async = true;
    s.onload = () => resolve((window as any).Cesium);
    s.onerror = () => reject(new Error("Failed to load Cesium"));
    document.head.appendChild(s);
  });
  return loadPromise;
}
