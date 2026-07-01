import { motion } from "motion/react";
import { LAYOUTS } from "../data";
import { StripLayout, StripLayoutId } from "../types";
import { Clock, Layout, Sparkles } from "lucide-react";

interface LayoutSelectorProps {
  selectedLayoutId: StripLayoutId;
  onSelectLayout: (id: StripLayoutId) => void;
  onNext: () => void;
}

export default function LayoutSelector({
  selectedLayoutId,
  onSelectLayout,
  onNext,
}: LayoutSelectorProps) {
  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <span className="font-mono text-xs tracking-widest text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full dark:bg-zinc-800 dark:text-zinc-500">
          Step 01 / 04
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          CHOOSE YOUR STRIP
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Select the photo strip format for your date memories
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-12">
        {LAYOUTS.map((layout) => {
          const isSelected = layout.id === selectedLayoutId;
          const isVertical = layout.cols === 1;

          return (
            <motion.div
              key={layout.id}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectLayout(layout.id)}
              className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 flex flex-col justify-between h-[340px] bg-white dark:bg-zinc-900 ${
                isSelected
                  ? "border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/10 dark:ring-zinc-100/10 shadow-lg shadow-zinc-200/50 dark:shadow-zinc-950"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 shadow-sm"
              }`}
            >
              {/* Layout Preview Graphic */}
              <div className="flex-1 flex items-center justify-center p-4">
                <div
                  className={`border border-zinc-300 dark:border-zinc-700 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex gap-1.5 ${
                    isVertical ? "flex-col w-20" : "flex-row flex-wrap w-36 justify-center"
                  }`}
                  style={{
                    maxHeight: "180px",
                  }}
                >
                  {Array.from({ length: layout.frames }).map((_, index) => (
                    <div
                      key={index}
                      className={`border border-dashed border-zinc-400 dark:border-zinc-600 rounded flex items-center justify-center bg-white dark:bg-zinc-900 relative ${
                        isVertical ? "w-14 h-10" : "w-10 h-8"
                      }`}
                    >
                      <span className="font-mono text-[9px] text-zinc-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {isSelected && index === 0 && (
                        <Sparkles className="absolute top-0.5 right-0.5 w-2 h-2 text-zinc-900 dark:text-zinc-100 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout details */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-display font-medium text-zinc-900 dark:text-zinc-100">
                    {layout.name}
                  </span>
                  <span className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-400 font-bold">
                    {layout.cols === 1 ? `${layout.frames}×1` : `${layout.cols}×${layout.rows}`}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mt-2 font-mono text-[11px] text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>~{layout.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layout className="w-3.5 h-3.5" />
                    <span>{layout.frames} Shots</span>
                  </div>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-zinc-900 dark:bg-zinc-100 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white dark:bg-zinc-900 rounded-full" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

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
  );
}
