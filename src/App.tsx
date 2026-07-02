import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CapturedPhoto, FilterId, StripLayoutId, ThemeId } from "./types";
import { LAYOUTS, THEMES } from "./data";
import LayoutSelector from "./components/LayoutSelector";
import ThemeSelector from "./components/ThemeSelector";
import CameraView from "./components/CameraView";
import StripArranger from "./components/StripArranger";
import FilterCarousel from "./components/FilterCarousel";
import FinalStrip from "./components/FinalStrip";
import ActivityHub from "./components/ActivityHub";
import DateInvitation from "./components/DateInvitation";
import { normalizeRoomCode } from "./lib/roomCode";
import {
  createRoomRequest,
  joinRoomRequest,
  saveParticipantRequest,
  configureRoomRequest,
  pollRoomStateRequest,
} from "./lib/roomsApi";
import { Camera, Heart, Plus, Calendar, ArrowRight, Share2, Clipboard, ChevronRight, User, HelpCircle, Laptop } from "lucide-react";

type Screen =
  | "landing"
  | "booth_setup"
  | "room_code"
  | "name_input"
  | "waiting_for_host"
  | "choose_layout"
  | "choose_theme"
  | "camera"
  | "arrange"
  | "filter"
  | "final"
  | "activities_hub"
  | "create_date";

export default function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");

  // User details
  const [userName, setUserName] = useState("Mohit");
  const [partnerName, setPartnerName] = useState("Khushi");
  const [roomCode, setRoomCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [roomRole, setRoomRole] = useState<"solo" | "host" | "guest">("solo");
  const [roomError, setRoomError] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);

  // Selection configurations (Restored from LocalStorage per PRD 25)
  const [selectedLayoutId, setSelectedLayoutId] = useState<StripLayoutId>(() => {
    return (localStorage.getItem("datestrip_layout") as StripLayoutId) || "1x4";
  });
  
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem("datestrip_theme") as ThemeId) || "black";
  });

  const [selectedFilterId, setSelectedFilterId] = useState<FilterId>(() => {
    return (localStorage.getItem("datestrip_filter") as FilterId) || "original";
  });

  // Captured Photos states
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [arrangedPhotoUrls, setArrangedPhotoUrls] = useState<string[]>([]);

  // Local storage persistence observers
  useEffect(() => {
    localStorage.setItem("datestrip_layout", selectedLayoutId);
  }, [selectedLayoutId]);

  useEffect(() => {
    localStorage.setItem("datestrip_theme", selectedThemeId);
  }, [selectedThemeId]);

  useEffect(() => {
    localStorage.setItem("datestrip_filter", selectedFilterId);
  }, [selectedFilterId]);

  const handleCreateRoom = async () => {
    setRoomError("");
    setIsCreatingRoom(true);

    try {
      const room = await createRoomRequest();
      setRoomRole("host");
      setRoomCode(room.roomCode);
      setJoinCodeInput(room.roomCode);
      setCurrentScreen("room_code");
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "Unable to create a room right now.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    setRoomError("");
    setIsJoiningRoom(true);

    try {
      const room = await joinRoomRequest(joinCodeInput);
      setRoomRole("guest");
      setRoomCode(room.roomCode);
      setJoinCodeInput(room.roomCode);
      setPartnerName(room.hostName ?? "");
      setCurrentScreen("name_input");
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "Unable to join that room right now.");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleContinueFromNames = async () => {
    if (!userName.trim()) {
      return;
    }

    setRoomError("");

    if (roomRole !== "solo" && roomCode) {
      setIsSavingParticipant(true);

      try {
        const room = await saveParticipantRequest(roomCode, roomRole, userName);
        setRoomCode(room.roomCode);

        if (roomRole === "host" && room.guestName) {
          setPartnerName(room.guestName);
        }

        if (roomRole === "guest" && room.hostName) {
          setPartnerName(room.hostName);
        }
      } catch (error) {
        setRoomError(error instanceof Error ? error.message : "Unable to save your room details right now.");
        setIsSavingParticipant(false);
        return;
      }

      setIsSavingParticipant(false);
    }

    if (roomRole === "guest") {
      setCurrentScreen("waiting_for_host");
    } else {
      setCurrentScreen("choose_layout");
    }
  };

  const [isConfiguringRoom, setIsConfiguringRoom] = useState(false);

  const handleThemeNext = async () => {
    if (roomRole !== "host" || !roomCode) {
      setCurrentScreen("camera");
      return;
    }

    setRoomError("");
    setIsConfiguringRoom(true);

    try {
      await configureRoomRequest(roomCode, selectedLayoutId, selectedThemeId);
      setCurrentScreen("camera");
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "Unable to start the joint session right now.");
    } finally {
      setIsConfiguringRoom(false);
    }
  };

  // Guest waits here until the host has chosen a layout + theme, then adopts them and jumps to camera.
  useEffect(() => {
    if (currentScreen !== "waiting_for_host" || roomRole !== "guest" || !roomCode) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const state = await pollRoomStateRequest(roomCode);

        if (cancelled) return;

        if (state.room.layoutId && state.room.themeId) {
          setSelectedLayoutId(state.room.layoutId as StripLayoutId);
          setSelectedThemeId(state.room.themeId as ThemeId);
          setCurrentScreen("camera");
        }
      } catch {
        // Transient poll failure; the interval will retry.
      }
    };

    poll();
    const intervalId = setInterval(poll, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [currentScreen, roomRole, roomCode]);

  const selectedLayout = LAYOUTS.find((l) => l.id === selectedLayoutId) || LAYOUTS[1];
  const selectedTheme = THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-rose-100 dark:selection:bg-rose-950 transition-colors duration-300">
      
      {/* Decorative subtle ambient backdrop glow */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-rose-100/15 via-transparent to-transparent pointer-events-none" />

      {/* Primary Global Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center relative z-20">
        <div
          onClick={() => setCurrentScreen("landing")}
          className="flex items-center gap-2 cursor-pointer font-display font-black text-xl tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 font-display">
            D
          </div>
          <span>DateStrip</span>
        </div>

        {/* Small global indicators */}
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600 hidden sm:inline">
            UTC: 2026.07.01
          </span>
          <a
            href="https://github.com"
            target="_blank"
            className="text-xs font-mono font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            v1.0 (MVP)
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 pb-20">
        <AnimatePresence mode="wait">
          {/* 1. THE LANDING PAGE SCREEN */}
          {currentScreen === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              {/* Left landing content */}
              <div className="lg:col-span-7 space-y-8 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase">
                    Made For Two
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-full uppercase">
                    인생네컷 & More
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-zinc-900 dark:text-zinc-50">
                    Fun Dates for <br />
                    <span className="text-rose-500">Long Distance</span> <br />
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                      Relationships
                    </span>
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-xl leading-relaxed font-mono">
                    This was made for my LDR girlfriend, Khushi. This is our little hub of dates and activities that kept us together through the distance this past 2 years. I hope you'll enjoy them too!
                  </p>
                </div>

                {/* Primary landing CTA pills */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => setCurrentScreen("booth_setup")}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-display font-bold rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-lg shadow-zinc-900/10"
                  >
                    <span>Open the photobooth</span>
                    <span className="font-mono text-sm">▷</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen("activities_hub")}
                    className="flex items-center justify-center gap-2 px-7 py-4 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 font-display font-medium rounded-2xl text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    <span>Browse activities</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen("create_date")}
                    className="flex items-center justify-center gap-2 px-7 py-4 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 font-display font-medium rounded-2xl text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    <span>Create a date</span>
                    <span className="font-mono text-sm">▷</span>
                  </button>
                </div>

                {/* Floating tags reference */}
                <div className="flex items-center gap-2 pt-6 text-xs text-zinc-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>you</span>
                  <span className="opacity-40">+</span>
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>me</span>
                </div>
              </div>

              {/* Right landing visual mockup stack */}
              <div className="lg:col-span-5 flex items-center justify-center relative min-h-[450px]">
                
                {/* Visual Strip 1 (Blank Strip mockup) */}
                <motion.div
                  initial={{ rotate: -8, x: -40, opacity: 0 }}
                  animate={{ rotate: -12, x: -30, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="absolute w-52 rounded-2xl p-3 border border-zinc-200 bg-white shadow-xl z-10 flex flex-col justify-between"
                  style={{ transformOrigin: "bottom center" }}
                >
                  <div className="absolute top-2 right-2 bg-zinc-900 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                    shot 0 / 4
                  </div>
                  <div className="space-y-2 mt-4">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="w-full aspect-[4/3] rounded bg-zinc-50 border border-dashed border-zinc-200 flex items-center justify-center font-mono text-[10px] text-zinc-300">
                        0{n}
                      </div>
                    ))}
                  </div>
                  <div className="h-8 mt-4 border-t border-dashed border-zinc-100 flex items-center justify-center">
                    <span className="text-[9px] font-mono tracking-widest text-zinc-300">khushi · KX7RM</span>
                  </div>
                </motion.div>

                {/* Visual Strip 2 (Finished Romantic cuts of Mohit and Khushi!) */}
                <motion.div
                  initial={{ rotate: 12, x: 40, opacity: 0 }}
                  animate={{ rotate: 10, x: 50, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute w-52 rounded-2xl p-3 border-2 border-zinc-900 bg-white shadow-2xl z-20 flex flex-col justify-between"
                  style={{ transformOrigin: "bottom center" }}
                >
                  <div className="space-y-2">
                    {[
                      { num: "01", heart: "💖 Forming Heart" },
                      { num: "02", heart: "✌️ Love sign" },
                      { num: "03", heart: "🙆‍♀️ Overhead heart" },
                      { num: "04", heart: "😘 Blow Kiss" },
                    ].map((item, i) => (
                      <div key={i} className="w-full aspect-[4/3] rounded overflow-hidden relative border border-zinc-100">
                        {/* Static visual simulated photo strips */}
                        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                          <span className="text-xl">{i === 0 ? "👩‍❤️‍👨" : i === 1 ? "✌️🥰" : i === 2 ? "🫶✨" : "😘🌹"}</span>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white font-mono text-[7px] px-1 rounded uppercase tracking-wider">
                          {item.heart}
                        </span>
                        <span className="absolute top-1 left-1 text-white font-mono text-[8px] font-bold opacity-60">
                          {item.num}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-8 mt-4 border-t border-zinc-100 flex flex-col items-center justify-center">
                    <span className="text-[9px] font-mono tracking-widest text-zinc-800 font-bold uppercase">khushi · 7K2QF</span>
                  </div>
                </motion.div>

                {/* Floating cursor mockup tags (Khushi & Mohit pointer cues!) */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-36 left-4 bg-pink-100 text-pink-600 border border-pink-200 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 z-30 font-mono"
                >
                  <span>You</span>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, delay: 2, ease: "easeInOut" }}
                  className="absolute bottom-24 right-1 bg-blue-100 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1 z-30 font-mono"
                >
                  <span>Me</span>
                </motion.div>

              </div>
            </motion.div>
          )}

          {/* 2. PHOTOBOOTH SESSION OPTION ENTRY */}
          {currentScreen === "booth_setup" && (
            <motion.div
              key="booth_setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-4xl mx-auto px-6 py-12"
            >
              <div className="text-center mb-12">
                <h2 className="font-display text-4xl font-black text-zinc-900 dark:text-zinc-100">
                  Photobooth <span className="font-sans font-normal text-zinc-400">인생네컷</span>
                </h2>
                <button
                  onClick={() => setCurrentScreen("landing")}
                  className="text-xs font-mono text-zinc-500 hover:underline mt-2 cursor-pointer"
                >
                  ← back to activities
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mb-8">
                {/* CREATE SESSION CARD */}
                <div
                  onClick={() => {
                    if (!isCreatingRoom) {
                      handleCreateRoom();
                    }
                  }}
                  className={`border-2 rounded-3xl p-8 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-[200px] transition-all duration-200 ${
                    isCreatingRoom
                      ? "cursor-wait border-zinc-300 dark:border-zinc-700 opacity-80"
                      : "cursor-pointer border-zinc-200 hover:border-zinc-950 dark:border-zinc-800 dark:hover:border-zinc-200"
                  }`}
                >
                  <div>
                    <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-50">
                      Create
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
                      Generate a custom room link code to share with your LDR partner.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    get code ▷
                  </span>
                </div>

                {/* JOIN WITH CODE CARD */}
                <div className="border-2 border-zinc-200 rounded-3xl p-8 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-[200px]">
                  <div>
                    <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-50">
                      Join
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
                      Enter a 5-digit code shared by your date to align sessions.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(normalizeRoomCode(e.target.value))}
                      placeholder="e.g. KX7RM"
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 p-2.5 text-xs outline-none focus:border-zinc-900 uppercase font-mono"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={isJoiningRoom}
                      className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-mono cursor-pointer hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-500"
                    >
                      {isJoiningRoom ? "..." : "Join"}
                    </button>
                  </div>
                  {roomError && (
                    <p className="mt-3 text-[11px] font-mono text-rose-500">
                      {roomError}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setRoomRole("solo");
                    setRoomCode("");
                    setRoomError("");
                    setCurrentScreen("name_input");
                  }}
                  className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:underline cursor-pointer"
                >
                  or start the session now ▷
                </button>
              </div>
            </motion.div>
          )}

          {/* 3. GENERATED ROOM CODE SCREEN */}
          {currentScreen === "room_code" && (
            <motion.div
              key="room_code"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto px-6 py-12 text-center"
            >
              <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase font-bold">
                Your Code
              </span>

              {/* Big Code Boxes */}
              <div className="flex gap-3 justify-center my-8">
                {roomCode.split("").map((letter, i) => (
                  <div
                    key={i}
                    className="w-14 h-16 bg-zinc-900 text-white font-display font-extrabold text-2xl rounded-xl flex items-center justify-center border-2 border-zinc-800 shadow-lg"
                  >
                    {letter}
                  </div>
                ))}
              </div>

              {/* Copy room code link action */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  alert("Room Code copied to clipboard!");
                }}
                className="px-6 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 rounded-xl text-xs font-mono font-medium inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm mb-6"
              >
                <span>copy link</span>
                <Clipboard className="w-3.5 h-3.5 text-zinc-500" />
              </button>

              <div className="flex flex-col items-center justify-center gap-2.5 mb-10">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>waiting for partner...</span>
                </div>
                <p className="text-[11px] text-zinc-400 max-w-xs font-mono">
                  You can proceed alone and capture poses, or wait for your partner to join this room code.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-8">
                <button
                  onClick={() => setCurrentScreen("name_input")}
                  className="px-10 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-display font-bold rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                >
                  start the session now ▷
                </button>
                <button
                  onClick={() => setCurrentScreen("booth_setup")}
                  className="font-mono text-xs text-zinc-400 hover:underline cursor-pointer"
                >
                  ← back
                </button>
              </div>
            </motion.div>
          )}

          {/* 4. CHOOSE NAMES INPUT CARD */}
          {currentScreen === "name_input" && (
            <motion.div
              key="name_input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto px-6 py-12"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl space-y-6">
                <div className="text-center">
                  <span className="font-mono text-[10px] tracking-widest text-rose-500 font-bold uppercase">
                    Personalization
                  </span>
                  <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-50 mt-1">
                    WHO IS POSING?
                  </h3>
                  {roomCode && roomRole !== "solo" && (
                    <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-400">
                      Connected to room {roomCode} as {roomRole}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                      YOUR NAME
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:border-zinc-500 outline-none dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-400 mb-1 flex items-center justify-between">
                      <span>PARTNER'S NAME</span>
                      <span className="text-[10px] text-zinc-400 font-normal italic lowercase">(optional - leave blank for solo mode)</span>
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Partner's name (optional)"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-sm focus:border-zinc-500 outline-none dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>

                {roomError && (
                  <p className="text-[11px] font-mono text-rose-500 text-center">
                    {roomError}
                  </p>
                )}

                <button
                  onClick={handleContinueFromNames}
                  disabled={!userName.trim() || isSavingParticipant}
                  className={`w-full py-3.5 rounded-xl font-display font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                    userName.trim() && !isSavingParticipant
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none"
                  }`}
                >
                  <span>{isSavingParticipant ? "syncing..." : "ready"}</span>
                  <span className="font-mono">▷</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* 4b. GUEST: WAITING FOR HOST TO CONFIGURE THE SHARED STRIP */}
          {currentScreen === "waiting_for_host" && (
            <motion.div
              key="waiting_for_host"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto px-6 py-12 text-center"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl space-y-5">
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>waiting for {partnerName || "your partner"}...</span>
                </div>
                <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-50">
                  Getting the booth ready
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed">
                  {partnerName || "Your partner"} is picking the strip layout and theme. You'll join the
                  same camera session automatically once it's ready.
                </p>
                {roomError && (
                  <p className="text-[11px] font-mono text-rose-500">{roomError}</p>
                )}
                <button
                  onClick={() => setCurrentScreen("name_input")}
                  className="font-mono text-xs text-zinc-400 hover:underline cursor-pointer"
                >
                  ← back
                </button>
              </div>
            </motion.div>
          )}

          {/* 5. STEP 1: SELECT LAYOUT */}
          {currentScreen === "choose_layout" && (
            <motion.div
              key="choose_layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LayoutSelector
                selectedLayoutId={selectedLayoutId}
                onSelectLayout={setSelectedLayoutId}
                onNext={() => setCurrentScreen("choose_theme")}
              />
            </motion.div>
          )}

          {/* 6. STEP 2: SELECT THEME */}
          {currentScreen === "choose_theme" && (
            <motion.div
              key="choose_theme"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ThemeSelector
                selectedThemeId={selectedThemeId}
                onSelectTheme={setSelectedThemeId}
                onNext={handleThemeNext}
                onBack={() => setCurrentScreen("choose_layout")}
              />
              {isConfiguringRoom && (
                <p className="text-center text-xs font-mono text-zinc-400 mt-4">syncing with partner...</p>
              )}
              {roomError && (
                <p className="text-center text-xs font-mono text-rose-500 mt-2">{roomError}</p>
              )}
            </motion.div>
          )}

          {/* 7. STEP 3: CAMERA LIVE CAPTURE SEQUENCE */}
          {currentScreen === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CameraView
                layout={selectedLayout}
                theme={selectedTheme}
                userName={userName}
                partnerName={partnerName}
                roomCode={roomRole === "solo" ? undefined : roomCode}
                roomRole={roomRole}
                onPhotosCaptured={(photos) => {
                  setCapturedPhotos(photos);
                  setCurrentScreen("arrange");
                }}
                onBack={() => setCurrentScreen(roomRole === "guest" ? "waiting_for_host" : "choose_theme")}
              />
            </motion.div>
          )}

          {/* 8. STEP 4: ARRANGE CAPTURED PHOTOS */}
          {currentScreen === "arrange" && (
            <motion.div
              key="arrange"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <StripArranger
                capturedPhotos={capturedPhotos}
                layout={selectedLayout}
                theme={selectedTheme}
                userName={userName}
                partnerName={partnerName}
                onArrangementComplete={(urls) => {
                  setArrangedPhotoUrls(urls);
                  setCurrentScreen("filter");
                }}
                onBack={() => setCurrentScreen("camera")}
              />
            </motion.div>
          )}

          {/* 9. STEP 5: COLOR GRADING FILTER CAROUSEL */}
          {currentScreen === "filter" && (
            <motion.div
              key="filter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FilterCarousel
                arrangedPhotoUrls={arrangedPhotoUrls}
                layout={selectedLayout}
                theme={selectedTheme}
                selectedFilterId={selectedFilterId}
                onSelectFilter={setSelectedFilterId}
                onNext={() => setCurrentScreen("final")}
                onBack={() => setCurrentScreen("arrange")}
                userName={userName}
                partnerName={partnerName}
              />
            </motion.div>
          )}

          {/* 10. STEP 6: EXPORT / FINAL VIEW */}
          {currentScreen === "final" && (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FinalStrip
                arrangedPhotoUrls={arrangedPhotoUrls}
                layout={selectedLayout}
                theme={selectedTheme}
                selectedFilterId={selectedFilterId}
                userName={userName}
                partnerName={partnerName}
                onReset={() => {
                  setCapturedPhotos([]);
                  setArrangedPhotoUrls([]);
                  setCurrentScreen("choose_layout");
                }}
                onBrowseActivities={() => setCurrentScreen("activities_hub")}
              />
            </motion.div>
          )}

          {/* 11. BROWSE ACTIVITIES DECK */}
          {currentScreen === "activities_hub" && (
            <motion.div
              key="activities"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ActivityHub
                onOpenPhotobooth={() => setCurrentScreen("booth_setup")}
                onBack={() => setCurrentScreen("landing")}
              />
            </motion.div>
          )}

          {/* 12. CREATE DATE INVITATION */}
          {currentScreen === "create_date" && (
            <motion.div
              key="create_date"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DateInvitation onBack={() => setCurrentScreen("landing")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
