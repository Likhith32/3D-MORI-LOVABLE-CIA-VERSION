export type Location = {
  id: string;
  name: string;
  category: "academic" | "residential" | "spiritual" | "health" | "dining" | "culture" | "civic";
  lon: number;
  lat: number;
  description: string;
  hours?: string;
  geojson?: string;
};

export const CAMPUS_CENTER = { lon: 81.80852, lat: 16.39935, height: 600 };

export const LOCATIONS: Location[] = [
  {
    id: "riverside",
    name: "Riverside School",
    category: "academic",
    lon: 81.80850, lat: 16.39935,
    description: "The heart of campus — home to classrooms, learning labs and student life.",
    hours: "7:30 — 17:00",
    geojson: "/geo/Outline.geojson",
  },
  {
    id: "main",
    name: "Main Building",
    category: "academic",
    lon: 81.80843, lat: 16.40034,
    description: "Administration, principal's office and central school operations.",
    hours: "8:00 — 16:30",
    geojson: "/geo/Mike_Wandell.geojson",
  },
  {
    id: "hospital",
    name: "Subbamma Mission Hospital",
    category: "health",
    lon: 81.80911, lat: 16.40012,
    description: "Full-service mission hospital serving students, staff and the village.",
    hours: "Open 24h",
    geojson: "/geo/Subbamma_Hospital.geojson",
  },
  {
    id: "smartvillage",
    name: "Smart Village Centre",
    category: "civic",
    lon: 81.80887, lat: 16.39824,
    description: "Community innovation hub — digital literacy and village programs.",
    hours: "9:00 — 18:00",
    geojson: "/geo/Smart_Village_Centre.geojson",
  },
  {
    id: "conference",
    name: "Conference Center",
    category: "academic",
    lon: 81.80867, lat: 16.39827,
    description: "Modern hall for assemblies, conferences and faculty gatherings.",
    geojson: "/geo/Conference_Center.geojson",
  },
  {
    id: "jessy",
    name: "Jessy Flora Auditorium",
    category: "culture",
    lon: 81.80755, lat: 16.39939,
    description: "Cinematic auditorium for performances, ceremonies and cultural nights.",
    geojson: "/geo/Jessy_Flora_Centre.geojson",
  },
  {
    id: "amy",
    name: "Amy Dance Studio",
    category: "culture",
    lon: 81.80774, lat: 16.39920,
    description: "Light-filled studio for classical and contemporary dance.",
    geojson: "/geo/Amy_Dance_Studio.geojson",
  },
  {
    id: "girls-hostel",
    name: "Girls Hostel",
    category: "residential",
    lon: 81.80852, lat: 16.40036,
    description: "Residential hostel for girl students with study and recreation rooms.",
  },
  {
    id: "boys-hostel",
    name: "Boys Hostel",
    category: "residential",
    lon: 81.80828, lat: 16.40029,
    description: "Residential hostel for boy students.",
  },
  {
    id: "canteen",
    name: "Dining Hall",
    category: "dining",
    lon: 81.80843, lat: 16.40027,
    description: "Communal dining and study hall — meals served three times daily.",
    hours: "7:00 · 12:30 · 19:00",
  },
  {
    id: "church",
    name: "GDM Church",
    category: "spiritual",
    lon: 81.80700, lat: 16.39820,
    description: "Campus chapel — daily prayers and Sunday services.",
    hours: "Daily",
  },
  {
    id: "playground",
    name: "Playground",
    category: "academic",
    lon: 81.80790, lat: 16.39870,
    description: "Open sports field for football, cricket and athletics.",
  },
];

export const TOUR_STOPS = [
  "riverside", "main", "hospital", "church", "canteen", "jessy",
];

export const CATEGORY_META: Record<Location["category"], { label: string; color: string; ring: string }> = {
  academic:    { label: "Academic",    color: "oklch(0.78 0.18 155)", ring: "oklch(0.68 0.16 155)" },
  residential: { label: "Residential", color: "oklch(0.82 0.13 60)",  ring: "oklch(0.72 0.14 60)" },
  spiritual:   { label: "Spiritual",   color: "oklch(0.82 0.10 280)", ring: "oklch(0.72 0.12 280)" },
  health:      { label: "Health",      color: "oklch(0.72 0.20 25)",  ring: "oklch(0.62 0.22 25)" },
  dining:      { label: "Dining",      color: "oklch(0.85 0.15 90)",  ring: "oklch(0.75 0.16 90)" },
  culture:     { label: "Culture",     color: "oklch(0.78 0.16 320)", ring: "oklch(0.68 0.18 320)" },
  civic:       { label: "Civic",       color: "oklch(0.82 0.13 210)", ring: "oklch(0.72 0.14 210)" },
};
