import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CapturedPhoto, StripLayout, ThemeConfig } from "../types";
import { Sparkles, Trash2, HelpCircle, Shuffle, LayoutGrid, CheckCircle } from "lucide-react";

interface StripArrangerProps {
  capturedPhotos: CapturedPhoto[];
  layout: StripLayout;
  theme: ThemeConfig;
  userName: string;
  partnerName: string;
  onArrangementComplete: (arrangedPhotoUrls: string[]) => void;
  onBack: () => void;
}

export default function StripArranger({
  capturedPhotos,
  layout,
  theme,
  userName,
  partnerName,
  onArrangementComplete,
  onBack,
}: StripArrangerProps) {
  // Array of image urls assigned to each frame slot
  const [slots, setSlots] = useState<(string | null)[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Initialize slots
  useEffect(() => {
    setSlots(Array(layout.frames).fill(null));
    // Default: auto fill on load so the user has an instant gorgeous preview!
    const defaultUrls = capturedPhotos.slice(0, layout.frames).map((p) => p.url);
    const initialSlots = Array(layout.frames).fill(null);
    defaultUrls.forEach((url, i) => {
      initialSlots[i] = url;
    });
    setSlots(initialSlots);
  }, [layout.frames, capturedPhotos]);

  const handleSelectPhoto = (url: string) => {
    setSelectedPhotoUrl(url === selectedPhotoUrl ? null : url);
  };

  const handleSlotClick = (index: number) => {
    if (selectedPhotoUrl) {
      // Place selected photo into this slot
      const newSlots = [...slots];
      newSlots[index] = selectedPhotoUrl;
      setSlots(newSlots);
      setSelectedPhotoUrl(null); // Reset selection
    } else {
      // If slot is filled, clicking can clear it
      if (slots[index]) {
        const newSlots = [...slots];
        newSlots[index] = null;
        setSlots(newSlots);
      }
    }
  };

  const handleAutoFill = () => {
    const newSlots = Array(layout.frames).fill(null);
    capturedPhotos.forEach((photo, index) => {
      if (index < layout.frames) {
        newSlots[index] = photo.url;
      }
    });
    setSlots(newSlots);
  };

  const handleClearAll = () => {
    setSlots(Array(layout.frames).fill(null));
  };

  const isComplete = slots.every((url) => url !== null);

  const handleProceed = () => {
    if (isComplete) {
      onArrangementComplete(slots as string[]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header instructions */}
      <div className="text-center mb-8">
        <span className="font-mono text-xs tracking-widest text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-500">
          Step 03 / 04
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          MAKE YOUR STRIP
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Arrange your photos into the strip slots. Click a photo, then tap a slot to place it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (GRID OF TAKEN PHOTOS) - Span 7 */}
        <div className="md:col-span-7 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 h-full">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-zinc-500" />
              Captured Gallery ({capturedPhotos.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAutoFill}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 rounded-lg hover:border-zinc-400 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Auto Fill
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-rose-600 rounded-lg hover:border-zinc-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Strip
              </button>
            </div>
          </div>

          {/* Grid Layout of photos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {capturedPhotos.map((photo) => {
              const isSelected = selectedPhotoUrl === photo.url;
              const isUsedCount = slots.filter((url) => url === photo.url).length;

              return (
                <motion.div
                  key={photo.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPhoto(photo.url)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border-3 transition-all duration-200 ${
                    isSelected
                      ? "border-rose-500 ring-4 ring-rose-500/20"
                      : isUsedCount > 0
                      ? "border-emerald-500/80"
                      : "border-transparent shadow-sm"
                  }`}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={photo.url}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />

                  {/* Badges for use */}
                  {isUsedCount > 0 && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>{isUsedCount}x placed</span>
                    </div>
                  )}

                  {/* Selected Indicator Glow */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                      <span className="bg-rose-500 text-white font-mono text-xs font-bold px-2.5 py-1 rounded shadow-lg">
                        Selected
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
              Pro-Tip: You can reuse the same beautiful selfie across multiple strip slots! Once every slot on the right has a photo, click Next.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (THE DESIGNER STRIP) - Span 5 */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          {/* Outer photo strip */}
          <div
            className="w-72 rounded-2xl p-4 border-2 flex flex-col justify-between shadow-2xl relative transition-all duration-300"
            style={{
              backgroundColor: theme.paperColor,
              borderColor: theme.borderColor,
              color: theme.textColor,
            }}
          >
            {/* Theme textures */}
            {theme.texture === "paper" && (
              <div className="absolute inset-0 bg-paper-texture pointer-events-none opacity-40" />
            )}
            {theme.texture === "grain" && (
              <div className="absolute inset-0 bg-noise-grain pointer-events-none" />
            )}
            {theme.texture === "both" && (
              <>
                <div className="absolute inset-0 bg-paper-texture pointer-events-none opacity-40" />
                <div className="absolute inset-0 bg-noise-grain pointer-events-none" />
              </>
            )}

            {/* Layout grid columns/rows wrapper */}
            <div
              className={`grid gap-3 z-10 w-full`}
              style={{
                gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
              }}
            >
              {slots.map((slotUrl, index) => {
                const isTargetForSelected = selectedPhotoUrl !== null && slotUrl === null;

                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSlotClick(index)}
                    className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      slotUrl
                        ? "border-transparent"
                        : isTargetForSelected
                        ? "border-dashed border-rose-500 bg-rose-50/10 ring-2 ring-rose-400/20"
                        : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/10 hover:bg-zinc-200/10 hover:border-zinc-400"
                    }`}
                  >
                    {slotUrl ? (
                      <>
                        <img
                          referrerPolicy="no-referrer"
                          src={slotUrl}
                          alt={`Assigned frame ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover Overlay to Tap and Clear */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <span className="bg-black/60 text-white font-mono text-[10px] uppercase font-bold px-2 py-1 rounded">
                            Tap to Clear
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-center p-2">
                        <span className="font-display font-bold text-lg opacity-40">+</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider opacity-50">
                          {isTargetForSelected ? "Tap to Place" : `Frame ${index + 1}`}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Personalized Footer */}
            <div className="mt-5 pt-3 border-t border-zinc-200/20 flex flex-col items-center justify-center z-10">
              <span className={`text-[11px] uppercase tracking-widest ${theme.fontFamily} font-bold opacity-80`}>
                {userName || "you"} & {partnerName || "me"}
              </span>
              <span className="text-[9px] font-mono opacity-50 mt-1">
                {new Date().toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-center gap-4 mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="px-6 py-3.5 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 font-display font-medium rounded-xl text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
        >
          ← Camera
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProceed}
          disabled={!isComplete}
          className={`flex items-center gap-2 px-10 py-3.5 font-display font-bold rounded-xl transition-all shadow-md cursor-pointer ${
            isComplete
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none"
          }`}
        >
          <span>next</span>
          <span className="font-mono">▷</span>
        </motion.button>
      </div>
    </div>
  );
}
