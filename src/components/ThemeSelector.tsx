import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { THEMES } from "../data";
import { ThemeConfig, ThemeId } from "../types";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface ThemeSelectorProps {
  selectedThemeId: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ThemeSelector({
  selectedThemeId,
  onSelectTheme,
  onNext,
  onBack,
}: ThemeSelectorProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3; // Responsive split helper
  const totalPages = Math.ceil(THEMES.length / itemsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <span className="font-mono text-xs tracking-widest text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-500">
          Step 02 / 04
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          PICK A THEME
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Customize the paper style, borders, and typography of your strip
        </p>
      </div>

      {/* Themes Carousel Grid */}
      <div className="relative w-full flex items-center justify-center px-8 mb-10">
        {/* Left Arrow */}
        <button
          onClick={handlePrevPage}
          className="absolute left-0 p-2.5 rounded-full border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors z-10"
        >
          <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>

        {/* Carousel Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl overflow-hidden py-4">
          {THEMES.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((theme) => {
            const isSelected = theme.id === selectedThemeId;

            return (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -6, transition: { duration: 0.15 } }}
                onClick={() => onSelectTheme(theme.id)}
                className={`cursor-pointer rounded-2xl border-2 p-5 bg-white dark:bg-zinc-900 flex flex-col items-center justify-between transition-all duration-200 h-[380px] ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 shadow-xl ring-1 ring-zinc-900/10"
                    : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 shadow-sm"
                }`}
              >
                {/* Paper Strip Miniature Preview */}
                <div className="w-full flex-1 flex items-center justify-center p-3">
                  <div
                    className={`w-14 h-48 rounded p-1 flex flex-col justify-between shadow-lg relative overflow-hidden`}
                    style={{
                      backgroundColor: theme.paperColor,
                      borderColor: theme.borderColor,
                      borderWidth: "3px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    {/* Tiny Paper texture overlay */}
                    {theme.texture === "paper" && (
                      <div className="absolute inset-0 bg-paper-texture pointer-events-none opacity-50" />
                    )}
                    {theme.texture === "grain" && (
                      <div className="absolute inset-0 bg-noise-grain pointer-events-none" />
                    )}
                    {theme.texture === "both" && (
                      <>
                        <div className="absolute inset-0 bg-paper-texture pointer-events-none opacity-50" />
                        <div className="absolute inset-0 bg-noise-grain pointer-events-none" />
                      </>
                    )}

                    {/* Tiny Frames */}
                    <div className="flex flex-col gap-1 z-10">
                      {[1, 2, 3].map((num) => (
                        <div
                          key={num}
                          className="w-full aspect-[4/3] bg-zinc-300/30 rounded border border-zinc-400/20"
                        />
                      ))}
                    </div>

                    {/* Tiny Footer */}
                    <div className="h-4 flex items-center justify-center z-10 overflow-hidden">
                      <span
                        className={`text-[5px] uppercase tracking-widest ${theme.fontFamily}`}
                        style={{ color: theme.textColor }}
                      >
                        datestrip
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Name and Selection Indicator */}
                <div className="mt-4 text-center w-full">
                  <span className="font-mono text-xs text-zinc-400 block mb-1">
                    {theme.id}
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="font-display font-medium text-sm text-zinc-900 dark:text-zinc-100">
                      {theme.name}
                    </h3>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNextPage}
          className="absolute right-0 p-2.5 rounded-full border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 shadow-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 mb-10">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
              currentPage === i ? "bg-zinc-800 w-4 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3.5 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 font-display font-medium rounded-xl text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
        >
          ← Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-display font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-md cursor-pointer"
        >
          <span>next</span>
          <span className="font-mono">▷</span>
        </motion.button>
      </div>
    </div>
  );
}
