export type StripLayoutId = "1x3" | "1x4" | "1x5" | "2x2" | "2x3" | "3x3";

export interface StripLayout {
  id: StripLayoutId;
  name: string;
  frames: number;
  cols: number;
  rows: number;
  aspectRatio: string; // e.g., "3/4" or "1/1"
  estimatedTime: string;
}

export type ThemeId =
  | "black"
  | "white"
  | "cream"
  | "film"
  | "retro"
  | "sakura"
  | "gray"
  | "coffee"
  | "pastel";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  borderColor: string;
  paperColor: string;
  footerColor: string;
  fontFamily: string; // "font-sans", "font-mono", "font-display"
  textColor: string;
  shadow: string;
  texture: "none" | "paper" | "grain" | "both";
  borderStyle?: string;
}

export type FilterId =
  | "original"
  | "mono"
  | "vintage"
  | "film"
  | "retro"
  | "warm"
  | "cool"
  | "soft"
  | "dream"
  | "peach";

export interface FilterConfig {
  id: FilterId;
  name: string;
  class: string;
}

export interface CapturedPhoto {
  id: string;
  url: string;
  timestamp: number;
  by: "you" | "partner" | "both";
}

export interface CoupleActivity {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: "play" | "talk" | "romantic" | "create";
  iconName: string;
  interactiveContent?: string;
}

export interface DateInvitation {
  hostName: string;
  partnerName: string;
  date: string;
  time: string;
  location: string;
  activities: string[];
  note: string;
}
