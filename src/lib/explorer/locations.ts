export type Location = {
  id: string;
  name: string;
  category: "academic" | "residential" | "spiritual" | "health" | "dining" | "culture" | "civic";
  lon: number;
  lat: number;
  description: string;
  hours?: string;
  geojson?: string;
  camera?: {
    heading?: number;
    pitch?: number;
    range?: number;
    offset?: { lon: number; lat: number };
  };
  image?: string;
  images?: string[];
};

export const CAMPUS_CENTER = { lon: 81.808466, lat: 16.399274, height: 600 };

export const LOCATIONS: Location[] = [
  {
    id: "riverside",
    name: "Riverside School",
    category: "academic",
    lon: 81.808723, lat: 16.399054,
    description: "The main learning hub of campus. Built to facilitate immersive and collaborative education, this structure houses smart classrooms, science labs, a digital library, and administrative offices where curriculum and student progress are managed daily.",
    hours: "7:30 — 17:00",
    geojson: "/geo/Outline.geojson",
    image: "/images/Slide1.JPG",
    images: [
      "/images/Slide1.JPG",
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200",
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200"
    ],
    camera: { heading: 260, pitch: -25, range: 150, offset: { lon: 0.0008, lat: 0 } },
  },
  {
    id: "main",
    name: "Main Building",
    category: "academic",
    lon: 81.80843, lat: 16.40034,
    description: "Central administration, principal's office, and central school operations. Serving as the governance headquarters, this building houses senior management, academic records, admissions, and faculty offices, ensuring smooth execution of educational guidelines.",
    hours: "8:00 — 16:30",
    geojson: "/geo/Mike_Wandell.geojson",
    images: [
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200",
      "https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?q=80&w=1200",
      "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200"
    ],
  },
  {
    id: "hospital",
    name: "Subbamma Mission Hospital",
    category: "health",
    lon: 81.80911, lat: 16.40012,
    description: "Full-service mission hospital serving students, staff, and the surrounding community. Equipped with outpatient clinics, emergency beds, a pharmacy, and pediatric units, it operates around the clock to provide essential medical care.",
    hours: "Open 24h",
    geojson: "/geo/Subbamma_Hospital.geojson",
    images: [
      "/images/Subbamma_House_2.jpg",
      "https://images.unsplash.com/photo-1586773860418-d3b3da96636c?q=80&w=1200",
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1200"
    ],
    camera: { heading: 260, pitch: -25, range: 150, offset: { lon: 0.0008, lat: 0 } },
  },
  {
    id: "smartvillage",
    name: "Smart Village Centre",
    category: "civic",
    lon: 81.80887, lat: 16.39824,
    description: "Community innovation hub designed to teach digital literacy, vocational training, and village development programs. Equipped with advanced desktop computers, seminar halls, and technical workshop tools.",
    hours: "9:00 — 18:00",
    geojson: "/geo/Smart_Village_Centre.geojson",
    images: [
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200",
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200"
    ],
  },
  {
    id: "conference",
    name: "Conference Center",
    category: "academic",
    lon: 81.808737, lat: 16.398261,
    description: "A sophisticated multipurpose facility hosting professional conferences, academic seminars, and leadership gatherings. Includes audio-visual setups and layout customizability for varied event shapes.",
    geojson: "/geo/Conference_Center.geojson",
    image: "/images/Conference_Centre_3.jpg",
    images: [
      "/images/Conference_Centre_3.jpg",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200",
      "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?q=80&w=1200"
    ],
  },
  {
    id: "jessy",
    name: "Jessy Flora Auditorium",
    category: "culture",
    lon: 81.807642, lat: 16.399459,
    description: "A state-of-the-art cinematic auditorium designed for world-class performances, student assemblies, and cultural celebrations. Includes acoustic wood paneling and lighting control systems.",
    geojson: "/geo/Jessy_Flora_Centre.geojson",
    image: "/images/Auditorium.JPG",
    images: [
      "/images/Auditorium.JPG",
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1200",
      "https://images.unsplash.com/photo-1460889418202-14df4772f77e?q=80&w=1200"
    ],
  },
  {
    id: "amy",
    name: "Amy Dance Studio",
    category: "culture",
    lon: 81.807790, lat: 16.399806,
    description: "A vibrant, light-filled creative space dedicated to the practice and performance of traditional and modern dance forms. Features floor-to-ceiling mirrors, dance barres, and audio hardware.",
    geojson: "/geo/Amy_Dance_Studio.geojson",
    image: "/images/Dance_Studio.JPG",
    images: [
      "/images/Dance_Studio.JPG",
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200"
    ],
  },
  {
    id: "girls-hostel",
    name: "Girls Hostel",
    category: "residential",
    lon: 81.80852, lat: 16.40036,
    description: "Residential hostel for girl students with study areas, common rooms, and comfortable bedrooms. Offers 24/7 security and a peaceful learning environment close to academic halls.",
    images: [
      "https://images.unsplash.com/photo-1555854817-40e098e05131?q=80&w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200"
    ],
  },
  {
    id: "boys-hostel",
    name: "Boys Hostel",
    category: "residential",
    lon: 81.80828, lat: 16.40029,
    description: "Safe and spacious residential hostel for boy students. Outfitted with recreational spaces, study desks, and modern hygiene facilities to support a balanced campus lifestyle.",
    images: [
      "https://images.unsplash.com/photo-1555854817-40e098e05131?q=80&w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200"
    ],
  },
  {
    id: "canteen",
    name: "Dining Hall",
    category: "dining",
    lon: 81.80843, lat: 16.40027,
    description: "Communal dining and study hall serving healthy meals three times daily. Features a wide seating area, hygienic kitchens, and nutritional menu designs to maintain student wellness.",
    hours: "7:00 · 12:30 · 19:00",
    images: [
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?q=80&w=1200",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200"
    ],
  },
  {
    id: "church",
    name: "GDM Church",
    category: "spiritual",
    lon: 81.80700, lat: 16.39820,
    description: "Campus chapel providing spiritual support, daily prayers, and Sunday services. The architecture is optimized for peaceful reflection and acoustic grandeur.",
    hours: "Daily",
    images: [
      "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1200",
      "https://images.unsplash.com/photo-1545638190-280685c17cf7?q=80&w=1200"
    ],
  },
  {
    id: "playground",
    name: "Playground",
    category: "academic",
    lon: 81.80790, lat: 16.39870,
    description: "Open sports field and running tracks for soccer, cricket, running, and athletic training. Hosts annual sports meets and community outdoor games.",
    images: [
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1200",
      "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?q=80&w=1200"
    ],
  },
  {
    id: "subbamma-house",
    name: "Subbamma House",
    category: "residential",
    lon: 81.808786, lat: 16.400107,
    description: "A beautifully preserved historical residence honoring the heritage and legacy of the Subbamma Mission founders. Serves as a museum and hosting site for distinguished guests.",
    image: "/images/Subbamma_House_2.jpg",
    images: [
      "/images/Subbamma_House_2.jpg",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200"
    ],
  },
  {
    id: "chairman",
    name: "Chairman Residency",
    category: "residential",
    lon: 81.808411, lat: 16.399790,
    description: "The official residency of the Mori School Chairman. Offers peaceful accommodation and reception areas for school trustees and institutional planning boards.",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200"
    ],
  },
  {
    id: "gate-salvation",
    name: "Gate of Salvation",
    category: "spiritual",
    lon: 81.809296, lat: 16.398948,
    description: "A beautifully designed spiritual gateway structure symbolizing entry into a space of learning, hope, and peace. Serves as the primary welcoming architectural node of the campus.",
    images: [
      "https://images.unsplash.com/photo-1544984243-ec57ea16fe25?q=80&w=1200",
      "https://images.unsplash.com/photo-1545638190-280685c17cf7?q=80&w=1200"
    ],
  },
  {
    id: "bethel-villa",
    name: "Bethel Villa",
    category: "residential",
    lon: 81.808014, lat: 16.399862,
    description: "A cozy residential villa on campus offering accommodation and a serene, landscaped environment for visiting faculty, scholars, and key administrative advisors.",
    images: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200"
    ],
  },
  {
    id: "teachers-quarters",
    name: "Teachers Quarters",
    category: "residential",
    lon: 81.808446, lat: 16.400023,
    description: "On-campus housing dedicated to faculty members and staff. Ensures proximity to academic buildings and fosters a close-knit educator community.",
    images: [
      "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=1200",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200"
    ],
  },
  {
    id: "subbamma-chappel",
    name: "Subbamma Chappel",
    category: "spiritual",
    lon: 81.808974, lat: 16.400538,
    description: "A beautiful chapel providing a space for quiet reflection, spiritual guidance, and regular services for students and staff.",
    images: [
      "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1200",
      "https://images.unsplash.com/photo-1545638190-280685c17cf7?q=80&w=1200"
    ],
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
