import { useState, useRef } from "react";
import { motion } from "motion/react";
import { FILTERS } from "../data";
import { FilterConfig, FilterId, StripLayout, ThemeConfig } from "../types";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface FilterCarouselProps {
  arrangedPhotoUrls: string[];
  layout: StripLayout;
  theme: ThemeConfig;
  selectedFilterId: FilterId;
  onSelectFilter: (id: FilterId) => void;
  onNext: () => void;
  onBack: () => void;
  userName: string;
  partnerName: string;
}

export default function FilterCarousel({
  arrangedPhotoUrls,
  layout,
  theme,
  selectedFilterId,
  onSelectFilter,
  onNext,
  onBack,
  userName,
  partnerName,
}: FilterCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(FILTERS.length / itemsPerPage);

  const selectedFilterClass = FILTERS.find((f) => f.id === selectedFilterId)?.class || "";

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="font-mono text-xs tracking-widest text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-500">
          Step 04 / 04
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          PICK A FILTER
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Apply a nostalgic color grading filter to your date pictures
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* LEFT COLUMN (THE PREVIEW STRIP WITH LIVE FILTER APPLIED) - Span 5 */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
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
              {arrangedPhotoUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200/10 flex items-center justify-center"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={url}
                    alt={`Frame ${index + 1}`}
                    className={`w-full h-full object-cover transition-all duration-300 ${selectedFilterClass}`}
                  />
                </div>
              ))}
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

        {/* RIGHT COLUMN (FILTER CAROUSEL AND SELECTION) - Span 7 */}
        <div className="md:col-span-7 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-full min-h-[380px]">
          <div>
            <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-5">
              Select Preset Vintage Grade
            </h3>

            {/* Slider carousel */}
            <div className="relative flex items-center justify-center px-6 py-4">
              {/* Left Arrow */}
              <button
                onClick={handlePrevPage}
                className="absolute left-0 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>

              {/* Thumbnails list */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
                {FILTERS.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((filter) => {
                  const isSelected = filter.id === selectedFilterId;

                  return (
                    <motion.div
                      key={filter.id}
                      whileHover={{ y: -3 }}
                      onClick={() => onSelectFilter(filter.id)}
                      className={`cursor-pointer rounded-xl border-2 p-1.5 bg-white dark:bg-zinc-950 flex flex-col items-center justify-between h-[130px] transition-all duration-200 ${
                        isSelected
                          ? "border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/10 shadow-md"
                          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800"
                      }`}
                    >
                      {/* Filter preview using the very first photo taken */}
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200/10">
                        <img
                          referrerPolicy="no-referrer"
                          src={arrangedPhotoUrls[0]}
                          alt="First frame"
                          className={`w-full h-full object-cover ${filter.class}`}
                        />
                      </div>

                      <div className="text-center mt-2 w-full flex items-center justify-center gap-1">
                        <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                          {filter.name}
                        </span>
                        {isSelected && (
                          <Check className="w-2.5 h-2.5 text-zinc-900 dark:text-zinc-100 stroke-[3]" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Right Arrow */}
              <button
                onClick={handleNextPage}
                className="absolute right-0 p-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors z-10 shadow-sm"
              >
                <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </button>
            </div>

            {/* Slider Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentPage === i ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 mt-10 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 font-display font-medium rounded-xl text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              ← Back
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="flex items-center gap-2 px-10 py-3 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-display font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
            >
              <span>next</span>
              <span className="font-mono">▷</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
