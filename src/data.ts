import { StripLayout, ThemeConfig, FilterConfig, CoupleActivity } from "./types";

export const LAYOUTS: StripLayout[] = [
  {
    id: "1x3",
    name: "1 × 3 vertical",
    frames: 3,
    cols: 1,
    rows: 3,
    aspectRatio: "3/4",
    estimatedTime: "30 seconds",
  },
  {
    id: "1x4",
    name: "1 × 4 vertical",
    frames: 4,
    cols: 1,
    rows: 4,
    aspectRatio: "3/4",
    estimatedTime: "40 seconds",
  },
  {
    id: "1x5",
    name: "1 × 5 vertical",
    frames: 5,
    cols: 1,
    rows: 5,
    aspectRatio: "3/4",
    estimatedTime: "50 seconds",
  },
  {
    id: "2x2",
    name: "2 × 2 grid",
    frames: 4,
    cols: 2,
    rows: 2,
    aspectRatio: "4/3",
    estimatedTime: "40 seconds",
  },
  {
    id: "2x3",
    name: "2 × 3 grid",
    frames: 6,
    cols: 2,
    rows: 3,
    aspectRatio: "4/3",
    estimatedTime: "60 seconds",
  },
  {
    id: "3x3",
    name: "3 × 3 collage",
    frames: 9,
    cols: 3,
    rows: 3,
    aspectRatio: "1/1",
    estimatedTime: "90 seconds",
  },
];

export const THEMES: ThemeConfig[] = [
  {
    id: "black",
    name: "Classic Black",
    borderColor: "#18181b",
    paperColor: "#09090b",
    footerColor: "#18181b",
    textColor: "#fafafa",
    fontFamily: "font-mono",
    shadow: "shadow-2xl shadow-black/60",
    texture: "grain",
  },
  {
    id: "white",
    name: "Classic White",
    borderColor: "#e4e4e7",
    paperColor: "#ffffff",
    footerColor: "#f4f4f5",
    textColor: "#18181b",
    fontFamily: "font-sans",
    shadow: "shadow-xl shadow-zinc-200",
    texture: "paper",
  },
  {
    id: "cream",
    name: "Creamy Ivory",
    borderColor: "#e4d9c7",
    paperColor: "#faf6f0",
    footerColor: "#ede4d5",
    textColor: "#4a3b32",
    fontFamily: "font-display",
    shadow: "shadow-xl shadow-amber-900/10",
    texture: "both",
  },
  {
    id: "film",
    name: "Noir Filmstrip",
    borderColor: "#111827",
    paperColor: "#030712",
    footerColor: "#1f2937",
    textColor: "#f9fafb",
    fontFamily: "font-mono",
    shadow: "shadow-2xl shadow-zinc-950",
    texture: "grain",
    borderStyle: "border-x-4 border-dashed",
  },
  {
    id: "retro",
    name: "Sunset Retro",
    borderColor: "#ea580c",
    paperColor: "#fff7ed",
    footerColor: "#ffedd5",
    textColor: "#7c2d12",
    fontFamily: "font-display",
    shadow: "shadow-xl shadow-orange-950/20",
    texture: "both",
  },
  {
    id: "sakura",
    name: "Sakura Pink",
    borderColor: "#f472b6",
    paperColor: "#fff1f2",
    footerColor: "#ffe4e6",
    textColor: "#9f1239",
    fontFamily: "font-sans",
    shadow: "shadow-lg shadow-pink-200/50",
    texture: "paper",
  },
  {
    id: "coffee",
    name: "Cozy Café",
    borderColor: "#7c2d12",
    paperColor: "#fffbeb",
    footerColor: "#fef3c7",
    textColor: "#451a03",
    fontFamily: "font-display",
    shadow: "shadow-lg shadow-amber-900/15",
    texture: "both",
  },
  {
    id: "pastel",
    name: "Dreamy Lavender",
    borderColor: "#c084fc",
    paperColor: "#faf5ff",
    footerColor: "#f3e8ff",
    textColor: "#581c87",
    fontFamily: "font-sans",
    shadow: "shadow-lg shadow-purple-200",
    texture: "paper",
  },
];

export const FILTERS: FilterConfig[] = [
  { id: "original", name: "Original", class: "" },
  { id: "mono", name: "Mono", class: "filter-mono" },
  { id: "retro", name: "Retro", class: "filter-retro" },
  { id: "film", name: "Film", class: "filter-film" },
  { id: "cool", name: "Cool", class: "filter-cool" },
  { id: "peach", name: "Peach", class: "filter-peach" },
  { id: "vintage", name: "Vintage", class: "filter-vintage" },
  { id: "warm", name: "Warm", class: "filter-warm" },
  { id: "soft", name: "Soft", class: "filter-soft" },
  { id: "dream", name: "Dream", class: "filter-dream" },
];

export const ACTIVITIES: CoupleActivity[] = [
  {
    id: "photobooth",
    title: "Virtual Life Four Cuts",
    description: "Recreate the iconic, nostalgic Korean life-four-cuts photobooth, capture dynamic poses together and print them locally.",
    duration: "2 mins",
    category: "create",
    iconName: "Camera",
  },
  {
    id: "quiz",
    title: "Nostalgic Question Deck",
    description: "A customized set of LDR card prompts ranging from sweet childhood stories to deep, heartfelt future planning.",
    duration: "15 mins",
    category: "talk",
    iconName: "HeartHandshake",
  },
  {
    id: "draw",
    title: "Pixel Art Together",
    description: "Cooperate in real-time or take turns filling a cute canvas with colorful pixels to create adorable couple tokens.",
    duration: "10 mins",
    category: "play",
    iconName: "Palette",
  },
  {
    id: "letter",
    title: "Midnight Time-Capsule Letter",
    description: "Write sweet letters that get virtually locked until a specific anniversary date, complete with personalized stamps.",
    duration: "20 mins",
    category: "romantic",
    iconName: "MailOpen",
  },
];

// Preset simulated responses for virtual partner "Khushi"
// beautiful photos (rendered on client canvas or with stylish silhouette illustrations)
// Let's use nice, recognizable cute couple doodles or SVG vectors to pose perfectly as half-hearts!
export const ANGIE_POSES = [
  // Pose 1: Half Heart Left (Mohit poses Half Heart Right, together they form a heart)
  "svg:half-heart-left",
  // Pose 2: Finger Heart / Peace sign
  "svg:peace-sign",
  // Pose 3: Blowing a Kiss / Cute smile
  "svg:cute-smile",
  // Pose 4: Big Heart with arms above head
  "svg:arm-heart-left",
  // Pose 5: Winking / Fun pose
  "svg:wink",
];
