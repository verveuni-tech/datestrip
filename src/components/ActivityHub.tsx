import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ACTIVITIES } from "../data";
import { CoupleActivity } from "../types";
import { Heart, Sparkles, MessageSquare, Mail, Palette, Calendar, Lock, BookOpen, Clock, Users, Send } from "lucide-react";

// Preset cards for LDR Question Deck
const QUESTION_DECK = [
  { id: 1, category: "Nostalgia", text: "What was your very first impression of me when we first met/talked?" },
  { id: 2, category: "Dreams", text: "If we could move to any city in the world together tomorrow, where would we go?" },
  { id: 3, category: "Intimacy", text: "What is a small, everyday habit of mine that secretly makes you smile or feel loved?" },
  { id: 4, category: "Growth", text: "What is the biggest lesson our long-distance experience has taught you about relationships?" },
  { id: 5, category: "Future", text: "Describe our perfect Sunday morning routine once we permanently close the distance." },
  { id: 6, category: "Play", text: "What is a funny, slightly embarrassing memory of us that always cheers you up?" },
];

interface ActivityHubProps {
  onOpenPhotobooth: () => void;
  onBack: () => void;
}

export default function ActivityHub({ onOpenPhotobooth, onBack }: ActivityHubProps) {
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  
  // Question Deck states
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Pixel Art Canvas states
  const gridSize = 8;
  const [pixelGrid, setPixelGrid] = useState<string[]>(Array(gridSize * gridSize).fill("#ffffff"));
  const [selectedColor, setSelectedColor] = useState("#f43f5e");
  const colorPalette = ["#f43f5e", "#ec4899", "#a855f7", "#3b82f6", "#10b981", "#eab308", "#18181b", "#ffffff"];

  // Time-Capsule Letter states
  const [letterContent, setLetterContent] = useState("");
  const [sealStyle, setSealStyle] = useState("rose-wax");
  const [unlockDate, setUnlockDate] = useState("");
  const [letterLocked, setLetterLocked] = useState(false);

  const handlePixelClick = (index: number) => {
    const newGrid = [...pixelGrid];
    newGrid[index] = newGrid[index] === selectedColor ? "#ffffff" : selectedColor;
    setPixelGrid(newGrid);
  };

  const handleClearPixelGrid = () => {
    setPixelGrid(Array(gridSize * gridSize).fill("#ffffff"));
  };

  const handleLockLetter = () => {
    if (letterContent.trim() && unlockDate) {
      setLetterLocked(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="font-mono text-xs tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 px-3 py-1 rounded-full font-bold uppercase">
          LDR Couple Activities
        </span>
        <h2 className="font-display text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          Date Night Hub
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Nurture closeness across the distance with sweet interactive rituals
        </p>
      </div>

      {activeActivity === null ? (
        /* GRID OF ACTIVITIES SELECTOR */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {ACTIVITIES.map((act) => {
            let IconComponent = Sparkles;
            let themeClass = "bg-rose-50 border-rose-100 text-rose-600";
            
            if (act.id === "photobooth") {
              IconComponent = MessageSquare;
              themeClass = "bg-purple-50 border-purple-100 text-purple-600";
            } else if (act.id === "quiz") {
              IconComponent = BookOpen;
              themeClass = "bg-indigo-50 border-indigo-100 text-indigo-600";
            } else if (act.id === "draw") {
              IconComponent = Palette;
              themeClass = "bg-sky-50 border-sky-100 text-sky-600";
            } else if (act.id === "letter") {
              IconComponent = Mail;
              themeClass = "bg-amber-50 border-amber-100 text-amber-600";
            }

            return (
              <motion.div
                key={act.id}
                whileHover={{ y: -6, transition: { duration: 0.15 } }}
                onClick={() => {
                  if (act.id === "photobooth") {
                    onOpenPhotobooth();
                  } else {
                    setActiveActivity(act.id);
                  }
                }}
                className="cursor-pointer border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between h-[280px]"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${themeClass}`}>
                    <IconComponent className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100">
                    {act.title}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{act.duration}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200 hover:underline">
                    {act.id === "photobooth" ? "Open →" : "Play now →"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* ACTIVE INTERACTIVE COMPONENT */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-md max-w-3xl mx-auto mb-10">
          
          {/* Back to hub bar */}
          <button
            onClick={() => {
              setActiveActivity(null);
              setIsFlipped(false);
              setLetterLocked(false);
              setLetterContent("");
            }}
            className="mb-8 text-xs font-mono text-zinc-500 hover:text-zinc-800 cursor-pointer flex items-center gap-1.5"
          >
            ← Back to Activities Hub
          </button>

          {/* 1. HEART QUESTION CARDS DECK */}
          {activeActivity === "quiz" && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-8">
                <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-100">
                  Nostalgic Question Cards
                </h3>
                <p className="text-zinc-500 text-xs mt-1">
                  Take turns asking each other these deep discussion prompts
                </p>
              </div>

              {/* FLIP CARD */}
              <div
                className="w-80 h-96 relative cursor-pointer group mb-8 perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full duration-500 preserve-3d relative"
                >
                  {/* Card Front */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 flex items-center justify-center shadow-xl">
                    <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[14px] flex flex-col justify-between p-6 text-center">
                      <span className="font-mono text-[10px] tracking-widest text-indigo-500 font-bold uppercase">
                        {QUESTION_DECK[currentCardIndex].category} Pack
                      </span>
                      <div className="my-auto">
                        <Heart className="w-12 h-12 text-rose-500 mx-auto fill-rose-50 animate-pulse mb-4" />
                        <span className="font-display text-lg font-bold text-zinc-950 dark:text-zinc-50">
                          Card #{QUESTION_DECK[currentCardIndex].id}
                        </span>
                        <p className="text-xs text-zinc-400 mt-2">
                          Tap card to flip and reveal prompt
                        </p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        datestrip exclusive deck
                      </span>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div
                    className="absolute inset-0 backface-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 flex flex-col justify-between text-center border-2 border-indigo-500 rotate-y-180 shadow-xl"
                  >
                    <span className="font-mono text-[10px] tracking-widest text-indigo-500 font-bold">
                      PROMPT
                    </span>
                    <div className="my-auto px-2">
                      <p className="font-display font-medium text-lg leading-relaxed text-zinc-900 dark:text-zinc-100">
                        "{QUESTION_DECK[currentCardIndex].text}"
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Tap again to hide prompt
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Card Controls */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => {
                      setCurrentCardIndex((prev) => (prev - 1 + QUESTION_DECK.length) % QUESTION_DECK.length);
                    }, 150);
                  }}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 dark:text-zinc-300 font-mono text-xs rounded-xl hover:bg-zinc-50 cursor-pointer"
                >
                  ← Previous Card
                </button>
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setTimeout(() => {
                      setCurrentCardIndex((prev) => (prev + 1) % QUESTION_DECK.length);
                    }, 150);
                  }}
                  className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono text-xs font-bold rounded-xl hover:bg-zinc-800 cursor-pointer"
                >
                  Next Card →
                </button>
              </div>
            </div>
          )}

          {/* 2. PIXEL ART CANVAS DRAWING */}
          {activeActivity === "draw" && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-6">
                <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-100">
                  Collaborative Pixel Canvas
                </h3>
                <p className="text-zinc-500 text-xs mt-1">
                  Design a cute couple pixel-token. Click on squares to draw.
                </p>
              </div>

              {/* COLOR SWATCHES */}
              <div className="flex gap-2.5 mb-6">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                      selectedColor === color ? "scale-110 border-black" : "border-zinc-200"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* GRID */}
              <div className="bg-zinc-950 p-4 rounded-3xl shadow-inner mb-6">
                <div
                  className="grid gap-1 bg-zinc-800"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  }}
                >
                  {pixelGrid.map((color, index) => (
                    <div
                      key={index}
                      onClick={() => handlePixelClick(index)}
                      className="w-10 h-10 cursor-pointer transition-colors border border-zinc-800 hover:opacity-80"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClearPixelGrid}
                  className="px-4 py-2 text-rose-500 text-xs font-mono font-bold hover:underline cursor-pointer"
                >
                  Wipe Grid
                </button>
                <button
                  onClick={() => alert("Pixel Art souvenir captured! Save it to your phone.")}
                  className="px-6 py-2 bg-sky-500 text-white font-mono text-xs font-bold rounded-xl hover:bg-sky-600 cursor-pointer"
                >
                  Save Art Snapshot
                </button>
              </div>
            </div>
          )}

          {/* 3. LETTER TIME-CAPSULE LETTER */}
          {activeActivity === "letter" && (
            <div>
              <div className="text-center mb-6">
                <h3 className="font-display font-black text-2xl text-zinc-900 dark:text-zinc-100">
                  Time-Capsule Letter Vault
                </h3>
                <p className="text-zinc-500 text-xs mt-1">
                  Draft a sweet message that gets sealed until a chosen date
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!letterLocked ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                        YOUR HEARTFELT LETTER
                      </label>
                      <textarea
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        placeholder="Write something sweet, raw, or nostalgic..."
                        className="w-full h-44 rounded-xl border-2 border-zinc-200 dark:border-zinc-800 p-4 text-sm focus:border-amber-400 outline-none text-zinc-800 dark:text-zinc-100 dark:bg-zinc-950 leading-relaxed font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                          UNLOCK DATE
                        </label>
                        <input
                          type="date"
                          value={unlockDate}
                          onChange={(e) => setUnlockDate(e.target.value)}
                          className="w-full rounded-xl border-2 border-zinc-200 dark:border-zinc-800 p-3 text-xs outline-none focus:border-amber-400 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-400 mb-1">
                          WAX SEAL STAMP
                        </label>
                        <select
                          value={sealStyle}
                          onChange={(e) => setSealStyle(e.target.value)}
                          className="w-full rounded-xl border-2 border-zinc-200 dark:border-zinc-800 p-3 text-xs outline-none focus:border-amber-400 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300"
                        >
                          <option value="rose-wax">🌹 Royal Rose Red Wax</option>
                          <option value="gold-wax">👑 Sparkling Gold Leaf</option>
                          <option value="love-wax">❤️ Traditional Heart Wax</option>
                          <option value="sky-wax">✨ Celestial Sky Blue Wax</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleLockLetter}
                      disabled={!letterContent.trim() || !unlockDate}
                      className={`w-full py-3.5 rounded-xl font-display font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        letterContent.trim() && unlockDate
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none"
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Seal Letter in Vault
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl mb-4 animate-bounce">
                      🔒
                    </div>
                    
                    <h4 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      Letter Sealed Successfully!
                    </h4>
                    
                    <p className="text-zinc-500 text-xs mt-2 max-w-sm leading-relaxed">
                      Your letter is securely locked and sealed under our cryptographic time vault. It cannot be read or unlocked until:
                      <span className="block font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                        📅 {new Date(unlockDate).toLocaleDateString(undefined, { dateStyle: "long" })}
                      </span>
                    </p>

                    <div className="mt-6 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-xs font-mono font-semibold max-w-sm">
                      Copy code and send to partner to import in their vault!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      )}

      {/* FOOTER ACTION */}
      {activeActivity === null && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 font-display font-medium rounded-xl text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
          >
            ← Back to Landing
          </button>
        </div>
      )}
    </div>
  );
}
