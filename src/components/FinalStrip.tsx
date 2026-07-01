import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FILTERS } from "../data";
import { FilterId, StripLayout, ThemeConfig } from "../types";
import { Download, Share2, Eye, Sparkles, RefreshCw, Instagram, ExternalLink, Calendar, Heart } from "lucide-react";

interface FinalStripProps {
  arrangedPhotoUrls: string[];
  layout: StripLayout;
  theme: ThemeConfig;
  selectedFilterId: FilterId;
  userName: string;
  partnerName: string;
  onReset: () => void;
  onBrowseActivities: () => void;
}

export default function FinalStrip({
  arrangedPhotoUrls,
  layout,
  theme,
  selectedFilterId,
  userName,
  partnerName,
  onReset,
  onBrowseActivities,
}: FinalStripProps) {
  const [highResDataUrl, setHighResDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showInstagramMockup, setShowInstagramMockup] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load capture source"));
      img.src = src;
    });
  };

  // Generate High-Res Photo Strip on Canvas
  useEffect(() => {
    async function renderStrip() {
      try {
        setIsGenerating(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 1. Dimensions setup based on Layout orientation
        const isVertical = layout.cols === 1;
        const width = isVertical ? 1080 : 1200;
        
        // High density multipliers
        const padding = 60;
        const gap = 40;
        const footerHeight = 280;
        
        let photoWidth = 0;
        let photoHeight = 0;
        let totalHeight = 0;

        if (isVertical) {
          photoWidth = width - (2 * padding);
          // 4:3 photo ratio (width is 4, height is 3) -> 3/4 aspect height
          photoHeight = photoWidth * 0.75; 
          totalHeight = (2 * padding) + (layout.frames * photoHeight) + ((layout.frames - 1) * gap) + footerHeight;
        } else {
          // Grid layout calculations (e.g. 2x2 or 2x3)
          photoWidth = (width - (2 * padding) - ((layout.cols - 1) * gap)) / layout.cols;
          photoHeight = photoWidth * 0.75;
          totalHeight = (2 * padding) + (layout.rows * photoHeight) + ((layout.rows - 1) * gap) + footerHeight;
        }

        canvas.width = width;
        canvas.height = totalHeight;

        // 2. Draw Paper Background Color
        ctx.fillStyle = theme.paperColor;
        ctx.fillRect(0, 0, width, totalHeight);

        // 3. Draw Theme textures (Paper grain dots or lines)
        if (theme.texture === "paper" || theme.texture === "both") {
          // Draw horizontal fiber noise lines
          ctx.strokeStyle = "rgba(0, 0, 0, 0.02)";
          ctx.lineWidth = 1;
          for (let i = 0; i < totalHeight; i += 8) {
            ctx.beginPath();
            ctx.moveTo(0, i + (Math.random() * 4));
            ctx.lineTo(width, i + (Math.random() * 4));
            ctx.stroke();
          }
        }
        if (theme.texture === "grain" || theme.texture === "both") {
          // Draw subtle dark speckles representing classic grain
          ctx.fillStyle = "rgba(0, 0, 0, 0.035)";
          for (let i = 0; i < 60000; i++) {
            const rx = Math.random() * width;
            const ry = Math.random() * totalHeight;
            ctx.fillRect(rx, ry, 1.5, 1.5);
          }
        }

        // 4. Draw outer border decoration if theme requires (like Noir Filmstrip)
        if (theme.id === "film") {
          ctx.fillStyle = "#ffffff";
          // Draw film sprocket rectangular slots on left and right borders
          const slotW = 16;
          const slotH = 26;
          const slotGap = 50;
          for (let y = 30; y < totalHeight - 30; y += slotGap) {
            ctx.fillRect(15, y, slotW, slotH);
            ctx.fillRect(width - 15 - slotW, y, slotW, slotH);
          }
        }

        // 5. Draw the Photos with Filter Effects
        const filterConfig = FILTERS.find((f) => f.id === selectedFilterId);
        
        // Setup CSS Canvas Context filters
        if (filterConfig && filterConfig.id !== "original") {
          if (filterConfig.id === "mono") ctx.filter = "grayscale(1) contrast(1.1) brightness(0.95)";
          else if (filterConfig.id === "retro") ctx.filter = "sepia(0.2) contrast(1.1) saturate(1.2) hue-rotate(10deg)";
          else if (filterConfig.id === "film") ctx.filter = "contrast(1.05) saturate(0.85) brightness(0.98) sepia(0.1)";
          else if (filterConfig.id === "cool") ctx.filter = "saturate(0.9) brightness(0.98) hue-rotate(-10deg) contrast(1.02)";
          else if (filterConfig.id === "peach") ctx.filter = "sepia(0.1) saturate(1.2) hue-rotate(15deg) contrast(1.05) brightness(0.98)";
          else if (filterConfig.id === "vintage") ctx.filter = "sepia(0.35) contrast(0.95) brightness(1.02) saturate(0.85) hue-rotate(-5deg)";
          else if (filterConfig.id === "warm") ctx.filter = "sepia(0.15) saturate(1.1) brightness(1.02)";
          else if (filterConfig.id === "soft") ctx.filter = "saturate(0.85) contrast(0.9) brightness(1.02)";
          else if (filterConfig.id === "dream") ctx.filter = "saturate(1.3) contrast(0.95) brightness(1.05) sepia(0.1)";
        } else {
          ctx.filter = "none";
        }

        for (let index = 0; index < arrangedPhotoUrls.length; index++) {
          const imgUrl = arrangedPhotoUrls[index];
          const img = await loadImage(imgUrl);
          
          let dx = 0;
          let dy = 0;

          if (isVertical) {
            dx = padding;
            dy = padding + index * (photoHeight + gap);
          } else {
            const col = index % layout.cols;
            const row = Math.floor(index / layout.cols);
            dx = padding + col * (photoWidth + gap);
            dy = padding + row * (photoHeight + gap);
          }

          // Draw the photo image onto high-res canvas
          ctx.drawImage(img, dx, dy, photoWidth, photoHeight);

          // Draw a very thin inner photograph border
          ctx.save();
          ctx.filter = "none";
          ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
          ctx.lineWidth = 2;
          ctx.strokeRect(dx, dy, photoWidth, photoHeight);
          ctx.restore();
        }

        // 6. Draw Personalized Footer
        ctx.filter = "none"; // Ensure filter is cleared for footer typography
        
        const footerY = totalHeight - (footerHeight / 2) - 10;
        ctx.fillStyle = theme.textColor;
        ctx.textAlign = "center";
        
        // Pick appropriate handwriting or classic font weights
        let fontName = "Inter, sans-serif";
        if (theme.fontFamily === "font-mono") fontName = "'JetBrains Mono', monospace";
        else if (theme.fontFamily === "font-display") fontName = "'Space Grotesk', sans-serif";

        // Main text: Mohit + Khushi (or custom couple names)
        ctx.font = `bold 44px ${fontName}`;
        const coupleNames = partnerName.trim() ? `${userName || "YOU"} & ${partnerName}` : (userName || "YOU");
        ctx.fillText(coupleNames.toUpperCase(), width / 2, footerY - 15);

        // Subtext: Date in Korean dots/digits
        ctx.font = `normal 26px ${fontName}`;
        ctx.fillStyle = `${theme.textColor}cc`; // slight opacity
        const dateString = new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).replace(/\s/g, "");
        ctx.fillText(dateString, width / 2, footerY + 35);

        // Watermark/Brand details
        ctx.font = `italic 16px ${fontName}`;
        ctx.fillStyle = `${theme.textColor}55`; // faint opacity
        ctx.fillText("datestrip.com · 인생네컷", width / 2, footerY + 85);

        // 7. Extract data URL
        const dataUrl = canvas.toDataURL("image/png");
        setHighResDataUrl(dataUrl);
        setIsGenerating(false);
      } catch (err) {
        console.error("Canvas generation failed:", err);
        setIsGenerating(false);
      }
    }

    renderStrip();
  }, [arrangedPhotoUrls, layout, theme, selectedFilterId, userName, partnerName]);

  const handleDownload = () => {
    if (highResDataUrl) {
      const link = document.createElement("a");
      const partnerSuffix = partnerName.trim() ? `-${partnerName}` : "";
      link.download = `datestrip-${userName || "us"}${partnerSuffix}-${Date.now()}.png`;
      link.href = highResDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Hidden high-res compiler */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Title */}
      <div className="text-center mb-8">
        <span className="font-mono text-xs tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400 font-bold uppercase animate-pulse">
          ✨ ALL DONE!
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3">
          Your Photostrip is Ready
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          Download your high-resolution souvenir memory or share it directly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: THE CRISP PHOTO STRIP PREVIEW (Span 5) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          {isGenerating ? (
            <div className="w-72 aspect-[1/3] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-inner">
              <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
              <span className="font-mono text-xs text-zinc-500">Compiling high-res pixels...</span>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="relative group cursor-pointer"
              onClick={() => setShowLightbox(true)}
            >
              {/* Actual compiled Image element */}
              <img
                src={highResDataUrl!}
                alt="DateStrip Photostrip"
                className="w-72 rounded-2xl shadow-2xl border border-zinc-200/50 hover:shadow-zinc-300/50 dark:hover:shadow-zinc-950 transition-all duration-300"
              />
              
              {/* Hover overlay for zoom */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
                <span className="bg-zinc-900/80 backdrop-blur-sm text-white font-mono text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg">
                  <Eye className="w-4 h-4" />
                  Tap to Zoom Fullscreen
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTIONS & SOCIAL PREVIEWS (Span 7) */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* Main Action card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
            <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
              Export and Download
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-display font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-5 h-5" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={() => setShowInstagramMockup(!showInstagramMockup)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-display font-bold rounded-xl transition-all cursor-pointer shadow-md"
              >
                <Instagram className="w-5 h-5" />
                <span>Instagram Story Mockup</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-medium rounded-lg hover:border-zinc-400 transition-colors cursor-pointer text-center"
              >
                {copiedLink ? "✓ Copied Session Link" : "🔗 Copy Room Link"}
              </button>
              <button
                onClick={() => setShowLightbox(true)}
                className="px-4 py-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-medium rounded-lg hover:border-zinc-400 transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Inspect Pixels
              </button>
            </div>
          </div>

          {/* INSTAGRAM LIVE PHONE MOCKUP (Delightful micro-feature!) */}
          <AnimatePresence>
            {showInstagramMockup && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 flex flex-col md:flex-row items-center gap-6 shadow-2xl"
              >
                {/* Virtual smartphone frame */}
                <div className="w-56 aspect-[9/16] bg-zinc-900 rounded-[32px] p-2.5 border-[4px] border-zinc-800 relative shadow-2xl overflow-hidden shrink-0">
                  {/* Smartphone camera notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-950 rounded-full z-20 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  </div>

                  {/* Story mockup container */}
                  <div className="w-full h-full rounded-[24px] bg-gradient-to-tr from-rose-400 to-indigo-500 flex flex-col justify-between p-4 relative overflow-hidden">
                    {/* Tiny Instagram header */}
                    <div className="flex items-center gap-1.5 z-10">
                      <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px]">
                        ❤️
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold">yourname</span>
                        <span className="text-[6px] opacity-60">1h ago</span>
                      </div>
                    </div>

                    {/* Centered Strip photo scaled down */}
                    <div className="flex-1 flex items-center justify-center py-4 z-10">
                      <img
                        src={highResDataUrl!}
                        alt="Miniature story preview"
                        className="h-[80%] rounded shadow-lg border border-white/20 rotate-[-2deg]"
                      />
                    </div>

                    {/* Cute sticker note */}
                    <div className="absolute bottom-16 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] border border-white/30 rotate-[6deg] z-10">
                      ✨ date night cuts
                    </div>

                    {/* Bottom Instagram reply bar */}
                    <div className="h-6 bg-white/20 backdrop-blur-md rounded-full px-3 flex items-center justify-between text-[8px] text-white/80 z-10">
                      <span>Send message...</span>
                      <span>❤️</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-display font-bold text-sm text-pink-400 flex items-center gap-1 justify-center md:justify-start">
                    <Instagram className="w-4 h-4" />
                    How to Share to Stories
                  </h4>
                  <ul className="text-xs text-zinc-400 mt-2 space-y-2 font-mono">
                    <li>1. Click "Download PNG" to save the high-res strip.</li>
                    <li>2. Open Instagram, swipe right to create a Story.</li>
                    <li>3. Select the photo from your camera roll.</li>
                    <li>4. Post and tag <span className="text-white">@datestrip</span> to get showcased on our couple features board!</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Action Buttons to Restart or Explore Activities */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col items-center text-center gap-4">
            <div>
              <h4 className="font-display font-bold text-zinc-900 dark:text-zinc-100">
                Want to do more together?
              </h4>
              <p className="text-zinc-500 text-xs mt-1">
                Explore romantic question cards, letter exchange vaults, and collaborative mini-activities designed for long distance.
              </p>
            </div>

            <div className="flex gap-3 w-full flex-wrap justify-center">
              <button
                onClick={onReset}
                className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-700 dark:text-zinc-300 font-display font-medium text-xs hover:border-zinc-400 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Take Another Cut
              </button>
              <button
                onClick={onBrowseActivities}
                className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 font-display font-bold text-xs hover:border-rose-400 cursor-pointer flex items-center gap-1"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                Browse Romantic Activities
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* DETAILED FULLSCREEN LIGHTBOX PREVIEW */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLightbox(false)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-full max-h-[90vh] overflow-y-auto rounded-xl p-2 bg-zinc-950 border border-zinc-800 shadow-2xl relative"
            >
              <img
                src={highResDataUrl!}
                alt="Fullscreen High density Photostrip"
                className="max-h-[85vh] w-auto mx-auto rounded"
              />
              <div className="text-center text-zinc-500 font-mono text-[10px] mt-2">
                Datestrip Souvenir 1080p — Tap anywhere to close preview
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
